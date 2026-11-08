import { query, pool } from '../config/db.js';
import { logAudit } from '../utils/audit.js';

/**
 * Utility to round numbers safely to 2 decimal places
 */
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * Helper to compute installment due dates (1 month apart starting from today)
 */
const getDueDate = (startDate, monthIndex) => {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + monthIndex);
  return d.toISOString().split('T')[0];
};

/**
 * 1. Create a new Loan Product
 * Constraint: Admin only
 */
export const createLoanProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      interest_rate,
      calculation_method,
      term_months,
      min_amount,
      max_amount,
      penalty_rate = 2.0,
      grace_period_days = 3,
    } = req.body;

    if (!name || interest_rate === undefined || !calculation_method || !term_months || !min_amount || !max_amount) {
      return res.status(400).json({
        error: 'name, interest_rate, calculation_method, term_months, min_amount, and max_amount are required.',
      });
    }

    if (!['flat', 'declining'].includes(calculation_method)) {
      return res.status(400).json({
        error: "calculation_method must be either 'flat' or 'declining'.",
      });
    }

    if (Number(min_amount) > Number(max_amount)) {
      return res.status(400).json({
        error: 'min_amount cannot be greater than max_amount.',
      });
    }

    const insertText = `
      INSERT INTO loan_products (
        name, description, interest_rate, calculation_method, term_months,
        min_amount, max_amount, penalty_rate, grace_period_days, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING *;
    `;

    const values = [
      name.trim(),
      description ? description.trim() : null,
      Number(interest_rate),
      calculation_method,
      parseInt(term_months, 10),
      Number(min_amount),
      Number(max_amount),
      Number(penalty_rate),
      parseInt(grace_period_days, 10),
    ];

    const result = await query(insertText, values);
    const newProduct = result.rows[0];

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'CREATE_LOAN_PRODUCT',
      'loan_products',
      newProduct.id,
      { name: newProduct.name, method: newProduct.calculation_method },
      clientIp
    );

    return res.status(201).json({
      message: 'Loan product created successfully',
      product: newProduct,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Get all Loan Products
 */
export const getLoanProducts = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM loan_products WHERE is_active = true ORDER BY name ASC'
    );
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Apply for a Loan & Generate Repayment Schedule
 * Constraint: Atomic DB transaction (BEGIN/COMMIT)
 */
export const applyForLoan = async (req, res, next) => {
  const dbClient = await pool.connect();

  try {
    const { client_id, product_id, principal } = req.body;

    if (!client_id || !product_id || !principal) {
      return res.status(400).json({
        error: 'client_id, product_id, and principal amount are required.',
      });
    }

    const principalNum = round2(principal);
    if (principalNum <= 0) {
      return res.status(400).json({ error: 'Principal amount must be greater than zero.' });
    }

    // Check client
    const clientCheck = await dbClient.query(
      'SELECT id, first_name, last_name, is_active FROM clients WHERE id = $1',
      [client_id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    if (!clientCheck.rows[0].is_active) {
      return res.status(400).json({ error: 'Client account is inactive.' });
    }

    // Check loan product
    const productCheck = await dbClient.query(
      'SELECT * FROM loan_products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Active loan product not found.' });
    }

    const product = productCheck.rows[0];

    // Validate principal limits
    if (principalNum < Number(product.min_amount) || principalNum > Number(product.max_amount)) {
      return res.status(400).json({
        error: `Principal amount must be between ${product.min_amount} and ${product.max_amount}.`,
      });
    }

    const rate = Number(product.interest_rate);
    const n = parseInt(product.term_months, 10);
    const method = product.calculation_method;

    let totalInterest = 0;
    let totalRepayable = 0;
    const scheduleItems = [];
    const today = new Date();

    if (method === 'flat') {
      // Flat Rate: interest = principal * (rate / 100) * term_months
      totalInterest = round2(principalNum * (rate / 100) * n);
      totalRepayable = round2(principalNum + totalInterest);

      const baseMonthlyPrincipal = round2(principalNum / n);
      const baseMonthlyInterest = round2(totalInterest / n);

      let accumulatedPrincipal = 0;
      let accumulatedInterest = 0;

      for (let i = 1; i <= n; i++) {
        let principalDue = baseMonthlyPrincipal;
        let interestDue = baseMonthlyInterest;

        // Adjust last installment to prevent penny rounding drift
        if (i === n) {
          principalDue = round2(principalNum - accumulatedPrincipal);
          interestDue = round2(totalInterest - accumulatedInterest);
        } else {
          accumulatedPrincipal = round2(accumulatedPrincipal + principalDue);
          accumulatedInterest = round2(accumulatedInterest + interestDue);
        }

        const totalDue = round2(principalDue + interestDue);
        const dueDate = getDueDate(today, i);

        scheduleItems.push({
          installment_no: i,
          due_date: dueDate,
          principal_due: principalDue,
          interest_due: interestDue,
          total_due: totalDue,
        });
      }
    } else if (method === 'declining') {
      // Declining Balance: EMI = P * r * (1+r)^n / ((1+r)^n - 1) where r = (rate/100)/12
      const r = (rate / 100) / 12;

      let emi = 0;
      if (r === 0) {
        emi = principalNum / n;
      } else {
        const factor = Math.pow(1 + r, n);
        emi = round2((principalNum * r * factor) / (factor - 1));
      }

      let remainingPrincipal = principalNum;
      let calculatedTotalInterest = 0;

      for (let i = 1; i <= n; i++) {
        const interestDue = round2(remainingPrincipal * r);
        let principalDue = round2(emi - interestDue);

        // On the final installment, settle all remaining principal
        if (i === n || principalDue > remainingPrincipal) {
          principalDue = remainingPrincipal;
        }

        const totalDue = round2(principalDue + interestDue);
        calculatedTotalInterest = round2(calculatedTotalInterest + interestDue);
        remainingPrincipal = round2(remainingPrincipal - principalDue);

        const dueDate = getDueDate(today, i);

        scheduleItems.push({
          installment_no: i,
          due_date: dueDate,
          principal_due: principalDue,
          interest_due: interestDue,
          total_due: totalDue,
        });
      }

      totalInterest = calculatedTotalInterest;
      totalRepayable = round2(principalNum + totalInterest);
    }

    // Begin Database Transaction
    await dbClient.query('BEGIN');

    // 1. Insert into loans table
    const insertLoanQuery = `
      INSERT INTO loans (
        client_id, product_id, principal, interest_amount, total_repayable,
        status, applied_by, applied_at
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())
      RETURNING *;
    `;

    const loanResult = await dbClient.query(insertLoanQuery, [
      client_id,
      product_id,
      principalNum,
      totalInterest,
      totalRepayable,
      req.user.id,
    ]);

    const newLoan = loanResult.rows[0];

    // 2. Insert generated schedule rows
    const insertedSchedules = [];
    for (const item of scheduleItems) {
      const scheduleQuery = `
        INSERT INTO loan_schedules (
          loan_id, installment_no, due_date, principal_due, interest_due,
          total_due, amount_paid, penalty_accrued, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 'pending')
        RETURNING *;
      `;

      const scheduleRes = await dbClient.query(scheduleQuery, [
        newLoan.id,
        item.installment_no,
        item.due_date,
        item.principal_due,
        item.interest_due,
        item.total_due,
      ]);

      insertedSchedules.push(scheduleRes.rows[0]);
    }

    // Commit Transaction
    await dbClient.query('COMMIT');

    // Record audit event
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'APPLY_LOAN',
      'loans',
      newLoan.id,
      {
        client_id,
        product_id,
        principal: principalNum,
        total_interest: totalInterest,
        total_repayable: totalRepayable,
        method,
      },
      clientIp
    );

    return res.status(201).json({
      message: 'Loan application submitted and schedule generated successfully',
      loan: newLoan,
      schedules: insertedSchedules,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    next(err);
  } finally {
    dbClient.release();
  }
};

/**
 * 4. Approve Loan
 * Constraint: Manager only
 */
export const approveLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const checkRes = await query('SELECT status FROM loans WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    if (checkRes.rows[0].status !== 'pending') {
      return res.status(400).json({
        error: `Cannot approve loan with status '${checkRes.rows[0].status}'. Must be 'pending'.`,
      });
    }

    const updateQuery = `
      UPDATE loans
      SET status = 'approved',
          approved_by = $1,
          approved_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await query(updateQuery, [req.user.id, id]);
    const approvedLoan = result.rows[0];

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'APPROVE_LOAN',
      'loans',
      id,
      { status: 'approved' },
      clientIp
    );

    return res.status(200).json({
      message: 'Loan approved successfully',
      loan: approvedLoan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Reject Loan
 * Constraint: Manager only
 */
export const rejectLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const checkRes = await query('SELECT status FROM loans WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    if (checkRes.rows[0].status !== 'pending') {
      return res.status(400).json({
        error: `Cannot reject loan with status '${checkRes.rows[0].status}'. Must be 'pending'.`,
      });
    }

    const updateQuery = `
      UPDATE loans
      SET status = 'rejected'
      WHERE id = $1
      RETURNING *;
    `;

    const result = await query(updateQuery, [id]);
    const rejectedLoan = result.rows[0];

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'REJECT_LOAN',
      'loans',
      id,
      { status: 'rejected' },
      clientIp
    );

    return res.status(200).json({
      message: 'Loan rejected',
      loan: rejectedLoan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Disburse Loan
 * Constraint: Cashier only
 */
export const disburseLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const checkRes = await query('SELECT status FROM loans WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    if (checkRes.rows[0].status !== 'approved') {
      return res.status(400).json({
        error: `Cannot disburse loan with status '${checkRes.rows[0].status}'. Must be 'approved'.`,
      });
    }

    const updateQuery = `
      UPDATE loans
      SET status = 'disbursed',
          disbursed_by = $1,
          disbursed_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;

    const result = await query(updateQuery, [req.user.id, id]);
    const disbursedLoan = result.rows[0];

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'DISBURSE_LOAN',
      'loans',
      id,
      { status: 'disbursed', amount: disbursedLoan.principal },
      clientIp
    );

    return res.status(200).json({
      message: 'Loan disbursed successfully',
      loan: disbursedLoan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. Get Loans with filters
 */
export const getLoans = async (req, res, next) => {
  try {
    const { status, client_id, product_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND l.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (client_id) {
      whereClause += ` AND l.client_id = $${paramIndex}`;
      params.push(client_id);
      paramIndex++;
    }

    if (product_id) {
      whereClause += ` AND l.product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }

    const selectQuery = `
      SELECT 
        l.*,
        c.first_name,
        c.last_name,
        c.national_id,
        c.phone,
        lp.name AS product_name,
        lp.calculation_method,
        lp.interest_rate,
        u_app.full_name AS applied_by_name,
        u_apr.full_name AS approved_by_name,
        u_dis.full_name AS disbursed_by_name
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      LEFT JOIN users u_app ON l.applied_by = u_app.id
      LEFT JOIN users u_apr ON l.approved_by = u_apr.id
      LEFT JOIN users u_dis ON l.disbursed_by = u_dis.id
      ${whereClause}
      ORDER BY l.applied_at DESC;
    `;

    const result = await query(selectQuery, params);

    return res.status(200).json({
      count: result.rows.length,
      loans: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Get Loan by ID (including schedule array and repayments)
 */
export const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loanRes = await query(
      `SELECT 
        l.*,
        c.first_name,
        c.last_name,
        c.national_id,
        c.phone,
        c.email,
        lp.name AS product_name,
        lp.calculation_method,
        lp.interest_rate,
        lp.term_months,
        lp.penalty_rate,
        lp.grace_period_days,
        u_app.full_name AS applied_by_name,
        u_apr.full_name AS approved_by_name,
        u_dis.full_name AS disbursed_by_name
       FROM loans l
       JOIN clients c ON l.client_id = c.id
       JOIN loan_products lp ON l.product_id = lp.id
       LEFT JOIN users u_app ON l.applied_by = u_app.id
       LEFT JOIN users u_apr ON l.approved_by = u_apr.id
       LEFT JOIN users u_dis ON l.disbursed_by = u_dis.id
       WHERE l.id = $1`,
      [id]
    );

    if (loanRes.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    const loan = loanRes.rows[0];

    // Schedules
    const scheduleRes = await query(
      `SELECT * FROM loan_schedules 
       WHERE loan_id = $1 
       ORDER BY installment_no ASC`,
      [id]
    );

    // Repayments
    const repaymentsRes = await query(
      `SELECT r.*, u.full_name AS received_by_name 
       FROM repayments r
       LEFT JOIN users u ON r.received_by = u.id
       WHERE r.loan_id = $1 
       ORDER BY r.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      loan,
      schedules: scheduleRes.rows,
      repayments: repaymentsRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createLoanProduct,
  getLoanProducts,
  applyForLoan,
  approveLoan,
  rejectLoan,
  disburseLoan,
  getLoans,
  getLoanById,
};
export const updateLoanProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, interest_rate, calculation_method, term_months, min_amount, max_amount, penalty_rate, grace_period_days } = req.body;

    const result = await query(
      `UPDATE loan_products 
       SET name = $1, interest_rate = $2, calculation_method = $3, term_months = $4, min_amount = $5, max_amount = $6, penalty_rate = $7, grace_period_days = $8
       WHERE id = $9 RETURNING *`,
      [name, Number(interest_rate), calculation_method, parseInt(term_months), Number(min_amount), Number(max_amount), Number(penalty_rate), parseInt(grace_period_days), id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.status(200).json({ message: 'Product updated', product: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteLoanProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Soft delete (recommended) - just mark as inactive
    const result = await query(
      `UPDATE loan_products SET is_active = false WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.status(200).json({ message: 'Product deactivated', product: result.rows[0] });
  } catch (err) { next(err); }
};