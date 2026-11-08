import { query, pool } from '../config/db.js';
import { logAudit } from '../utils/audit.js';

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * 1. Record a Repayment (FIFO allocation across schedules)
 * Constraint: Atomic DB transaction (BEGIN/COMMIT)
 */
export const recordRepayment = async (req, res, next) => {
  const dbClient = await pool.connect();

  try {
    const { loan_id, amount, payment_method = 'cash' } = req.body;

    if (!loan_id || !amount) {
      return res.status(400).json({ error: 'loan_id and amount are required.' });
    }

    const paymentAmount = round2(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
    }

    // Verify loan exists and is in disbursed state
    const loanRes = await dbClient.query(
      `SELECT l.*, c.first_name, c.last_name 
       FROM loans l 
       JOIN clients c ON l.client_id = c.id 
       WHERE l.id = $1`,
      [loan_id]
    );

    if (loanRes.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    const loan = loanRes.rows[0];

    if (loan.status !== 'disbursed') {
      return res.status(400).json({
        error: `Cannot record repayment for loan with status '${loan.status}'. Must be 'disbursed'.`,
      });
    }

    // Begin Database Transaction
    await dbClient.query('BEGIN');

    // Fetch unpaid/partial/overdue schedules for this loan in FIFO order (row lock FOR UPDATE)
    const schedulesRes = await dbClient.query(
      `SELECT * FROM loan_schedules 
       WHERE loan_id = $1 AND status IN ('pending', 'partial', 'overdue')
       ORDER BY installment_no ASC
       FOR UPDATE;`,
      [loan_id]
    );

    if (schedulesRes.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        error: 'No outstanding schedules found for this loan. It may already be fully paid.',
      });
    }

    let remainingPayment = paymentAmount;
    const repaymentRecords = [];
    const updatedSchedules = [];

    for (const schedule of schedulesRes.rows) {
      if (remainingPayment <= 0) break;

      const totalRequired = round2(Number(schedule.total_due) + Number(schedule.penalty_accrued));
      const outstandingBalance = round2(totalRequired - Number(schedule.amount_paid));

      if (outstandingBalance <= 0) continue;

      const allocation = Math.min(remainingPayment, outstandingBalance);
      const newAmountPaid = round2(Number(schedule.amount_paid) + allocation);
      const newStatus = newAmountPaid >= totalRequired ? 'paid' : 'partial';

      // Update the schedule
      const updateScheduleRes = await dbClient.query(
        `UPDATE loan_schedules 
         SET amount_paid = $1, status = $2 
         WHERE id = $3 
         RETURNING *;`,
        [newAmountPaid, newStatus, schedule.id]
      );
      updatedSchedules.push(updateScheduleRes.rows[0]);

      // Insert into repayments table
      const insertRepaymentRes = await dbClient.query(
        `INSERT INTO repayments (
          loan_id, schedule_id, amount, payment_method, received_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *;`,
        [loan_id, schedule.id, allocation, payment_method, req.user.id]
      );
      repaymentRecords.push(insertRepaymentRes.rows[0]);

      remainingPayment = round2(remainingPayment - allocation);
    }

    // Check if ALL schedules for this loan are now 'paid'
    const checkRemainingRes = await dbClient.query(
      `SELECT COUNT(*) AS unpaid_count 
       FROM loan_schedules 
       WHERE loan_id = $1 AND status != 'paid';`,
      [loan_id]
    );

    let loanClosed = false;
    if (parseInt(checkRemainingRes.rows[0].unpaid_count, 10) === 0) {
      await dbClient.query(
        "UPDATE loans SET status = 'closed' WHERE id = $1;",
        [loan_id]
      );
      loanClosed = true;
    }

    // Commit Transaction
    await dbClient.query('COMMIT');

    // Record audit log
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'RECORD_REPAYMENT',
      'repayments',
      repaymentRecords[0]?.id || null,
      {
        loan_id,
        total_payment: paymentAmount,
        allocated_amount: round2(paymentAmount - remainingPayment),
        unallocated_excess: remainingPayment,
        loan_closed: loanClosed,
      },
      clientIp
    );

    return res.status(201).json({
      message: loanClosed
        ? 'Repayment applied successfully. Loan is now fully paid and closed!'
        : 'Repayment applied successfully.',
      allocated_amount: round2(paymentAmount - remainingPayment),
      unallocated_excess: remainingPayment,
      loan_status: loanClosed ? 'closed' : 'disbursed',
      repayments: repaymentRecords,
      updated_schedules: updatedSchedules,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    next(err);
  } finally {
    dbClient.release();
  }
};

/**
 * 2. Apply Penalties to Overdue Schedules
 * Checks due_date < CURRENT_DATE beyond grace period and accrues penalty
 */
export const applyPenalties = async (req, res, next) => {
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    // Fetch schedules past grace period with no penalty applied yet
    const overdueQuery = `
      SELECT 
        ls.id,
        ls.loan_id,
        ls.installment_no,
        ls.due_date,
        ls.principal_due,
        ls.total_due,
        ls.amount_paid,
        ls.penalty_accrued,
        ls.status,
        lp.penalty_rate,
        lp.grace_period_days
      FROM loan_schedules ls
      JOIN loans l ON ls.loan_id = l.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE l.status = 'disbursed'
        AND ls.status IN ('pending', 'partial')
        AND ls.due_date < (CURRENT_DATE - (lp.grace_period_days || ' days')::INTERVAL)
      FOR UPDATE;
    `;

    const overdueRes = await dbClient.query(overdueQuery);
    const updatedSchedules = [];

    for (const schedule of overdueRes.rows) {
      // Calculate penalty on principal due
      const penaltyAmount = round2(
        Number(schedule.principal_due) * (Number(schedule.penalty_rate) / 100)
      );

      // Only accrue if not already accrued or update penalty
      const newPenalty = round2(Number(schedule.penalty_accrued) + penaltyAmount);

      const updateRes = await dbClient.query(
        `UPDATE loan_schedules
         SET penalty_accrued = $1, status = 'overdue'
         WHERE id = $2
         RETURNING *;`,
        [newPenalty, schedule.id]
      );

      updatedSchedules.push(updateRes.rows[0]);
    }

    await dbClient.query('COMMIT');

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user?.id || null,
      'APPLY_PENALTIES',
      'loan_schedules',
      null,
      { count: updatedSchedules.length },
      clientIp
    );

    return res.status(200).json({
      message: `Penalties evaluated. Updated ${updatedSchedules.length} schedule(s) to overdue.`,
      penalized_count: updatedSchedules.length,
      schedules: updatedSchedules,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    next(err);
  } finally {
    dbClient.release();
  }
};

/**
 * 3. Get Overdue Loans List
 */
export const getOverdueLoans = async (req, res, next) => {
  try {
    const overdueLoansQuery = `
      SELECT 
        l.id AS loan_id,
        l.client_id,
        l.principal,
        l.total_repayable,
        l.status AS loan_status,
        c.first_name,
        c.last_name,
        c.phone,
        c.national_id,
        lp.name AS product_name,
        lp.penalty_rate,
        COUNT(ls.id) AS overdue_installments_count,
        SUM((ls.total_due + ls.penalty_accrued) - ls.amount_paid) AS total_overdue_amount,
        SUM(ls.penalty_accrued) AS total_penalty_accrued,
        MIN(ls.due_date) AS earliest_overdue_date
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      JOIN loan_schedules ls ON ls.loan_id = l.id
      WHERE l.status = 'disbursed'
        AND (ls.status = 'overdue' OR (ls.due_date < CURRENT_DATE AND ls.status != 'paid'))
      GROUP BY l.id, c.id, lp.id
      ORDER BY total_overdue_amount DESC;
    `;

    const result = await query(overdueLoansQuery);

    return res.status(200).json({
      count: result.rows.length,
      overdue_loans: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  recordRepayment,
  applyPenalties,
  getOverdueLoans,
};
