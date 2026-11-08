import { query } from '../config/db.js';

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * 1. Dashboard Executive KPI Stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // Total disbursed amount (sum of loans currently disbursed or closed)
    const disbursedQuery = `
      SELECT 
        COALESCE(SUM(principal), 0) AS total_disbursed_amount,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END) AS active_loans_count,
        COUNT(*) AS total_loans_count
      FROM loans
      WHERE status IN ('disbursed', 'closed');
    `;
    const disbursedRes = await query(disbursedQuery);

    // Total overdue amount across disbursed loans
    const overdueQuery = `
      SELECT 
        COALESCE(SUM((ls.total_due + ls.penalty_accrued) - ls.amount_paid), 0) AS total_overdue_amount,
        COUNT(DISTINCT l.id) AS overdue_loans_count,
        COUNT(ls.id) AS overdue_schedules_count
      FROM loan_schedules ls
      JOIN loans l ON ls.loan_id = l.id
      WHERE l.status = 'disbursed'
        AND (ls.status = 'overdue' OR (ls.due_date < CURRENT_DATE AND ls.status != 'paid'));
    `;
    const overdueRes = await query(overdueQuery);

    // Total savings balance across all client accounts
    const savingsQuery = `
      SELECT 
        COALESCE(SUM(balance), 0) AS total_savings_balance,
        COUNT(*) AS total_savings_accounts
      FROM savings_accounts;
    `;
    const savingsRes = await query(savingsQuery);

    // Total registered clients
    const clientsQuery = `
      SELECT 
        COUNT(*) AS total_clients,
        COUNT(CASE WHEN is_active = true THEN 1 END) AS active_clients
      FROM clients;
    `;
    const clientsRes = await query(clientsQuery);

    // Total repayments collected all time
    const repaymentsQuery = `
      SELECT COALESCE(SUM(amount), 0) AS total_repayments_collected
      FROM repayments;
    `;
    const repaymentsRes = await query(repaymentsQuery);

    return res.status(200).json({
      total_disbursed_amount: round2(disbursedRes.rows[0].total_disbursed_amount),
      active_loans_count: parseInt(disbursedRes.rows[0].active_loans_count, 10),
      total_loans_count: parseInt(disbursedRes.rows[0].total_loans_count, 10),
      total_overdue_amount: round2(overdueRes.rows[0].total_overdue_amount),
      overdue_loans_count: parseInt(overdueRes.rows[0].overdue_loans_count, 10),
      total_savings_balance: round2(savingsRes.rows[0].total_savings_balance),
      total_savings_accounts: parseInt(savingsRes.rows[0].total_savings_accounts, 10),
      total_clients: parseInt(clientsRes.rows[0].total_clients, 10),
      active_clients: parseInt(clientsRes.rows[0].active_clients, 10),
      total_repayments_collected: round2(repaymentsRes.rows[0].total_repayments_collected),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Loan Portfolio Distribution Report
 */
export const getLoanPortfolioReport = async (req, res, next) => {
  try {
    // Breakdown by loan status
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) AS count,
        COALESCE(SUM(principal), 0) AS total_principal,
        COALESCE(SUM(interest_amount), 0) AS total_interest,
        COALESCE(SUM(total_repayable), 0) AS total_repayable
      FROM loans
      GROUP BY status
      ORDER BY count DESC;
    `;
    const statusRes = await query(statusQuery);

    // Breakdown by loan product
    const productQuery = `
      SELECT 
        lp.id AS product_id,
        lp.name AS product_name,
        lp.calculation_method,
        lp.interest_rate,
        COUNT(l.id) AS loans_count,
        COALESCE(SUM(l.principal), 0) AS total_principal,
        COALESCE(SUM(l.total_repayable), 0) AS total_repayable
      FROM loan_products lp
      LEFT JOIN loans l ON lp.id = l.product_id
      GROUP BY lp.id
      ORDER BY total_principal DESC;
    `;
    const productRes = await query(productQuery);

    return res.status(200).json({
      by_status: statusRes.rows.map((r) => ({
        ...r,
        count: parseInt(r.count, 10),
        total_principal: round2(r.total_principal),
        total_interest: round2(r.total_interest),
        total_repayable: round2(r.total_repayable),
      })),
      by_product: productRes.rows.map((r) => ({
        ...r,
        loans_count: parseInt(r.loans_count, 10),
        total_principal: round2(r.total_principal),
        total_repayable: round2(r.total_repayable),
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Repayment Schedule Report (Overdue, Due Today, Upcoming 7 Days)
 */
export const getRepaymentScheduleReport = async (req, res, next) => {
  try {
    // Due Today
    const dueTodayQuery = `
      SELECT 
        ls.*,
        c.id AS client_id,
        c.first_name,
        c.last_name,
        c.phone,
        c.national_id,
        lp.name AS product_name
      FROM loan_schedules ls
      JOIN loans l ON ls.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE l.status = 'disbursed'
        AND ls.due_date = CURRENT_DATE
        AND ls.status != 'paid'
      ORDER BY ls.total_due DESC;
    `;
    const dueTodayRes = await query(dueTodayQuery);

    // Upcoming Next 7 Days
    const upcomingQuery = `
      SELECT 
        ls.*,
        c.id AS client_id,
        c.first_name,
        c.last_name,
        c.phone,
        c.national_id,
        lp.name AS product_name
      FROM loan_schedules ls
      JOIN loans l ON ls.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE l.status = 'disbursed'
        AND ls.due_date > CURRENT_DATE
        AND ls.due_date <= (CURRENT_DATE + INTERVAL '7 days')
        AND ls.status != 'paid'
      ORDER BY ls.due_date ASC;
    `;
    const upcomingRes = await query(upcomingQuery);

    // Overdue Schedules
    const overdueQuery = `
      SELECT 
        ls.*,
        c.id AS client_id,
        c.first_name,
        c.last_name,
        c.phone,
        c.national_id,
        lp.name AS product_name,
        (CURRENT_DATE - ls.due_date) AS days_overdue
      FROM loan_schedules ls
      JOIN loans l ON ls.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE l.status = 'disbursed'
        AND (ls.status = 'overdue' OR ls.due_date < CURRENT_DATE)
        AND ls.status != 'paid'
      ORDER BY ls.due_date ASC;
    `;
    const overdueRes = await query(overdueQuery);

    return res.status(200).json({
      due_today: {
        count: dueTodayRes.rows.length,
        total_amount: round2(dueTodayRes.rows.reduce((acc, r) => acc + (Number(r.total_due) - Number(r.amount_paid)), 0)),
        items: dueTodayRes.rows,
      },
      upcoming_7_days: {
        count: upcomingRes.rows.length,
        total_amount: round2(upcomingRes.rows.reduce((acc, r) => acc + (Number(r.total_due) - Number(r.amount_paid)), 0)),
        items: upcomingRes.rows,
      },
      overdue: {
        count: overdueRes.rows.length,
        total_amount: round2(overdueRes.rows.reduce((acc, r) => acc + ((Number(r.total_due) + Number(r.penalty_accrued)) - Number(r.amount_paid)), 0)),
        items: overdueRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Collection Performance Report
 */
export const getCollectionReport = async (req, res, next) => {
  try {
    // Today
    const todayRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count 
       FROM repayments 
       WHERE DATE(created_at) = CURRENT_DATE;`
    );

    // This Week
    const weekRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count 
       FROM repayments 
       WHERE created_at >= date_trunc('week', CURRENT_DATE);`
    );

    // This Month
    const monthRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count 
       FROM repayments 
       WHERE created_at >= date_trunc('month', CURRENT_DATE);`
    );

    // Payment methods breakdown
    const methodsRes = await query(
      `SELECT 
        payment_method, 
        COUNT(*) AS count, 
        COALESCE(SUM(amount), 0) AS total 
       FROM repayments 
       GROUP BY payment_method 
       ORDER BY total DESC;`
    );

    // Last 14 days daily collections (ideal for trend chart)
    const dailyTrendRes = await query(
      `SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS transactions_count,
        COALESCE(SUM(amount), 0) AS total_collected
       FROM repayments
       WHERE created_at >= (CURRENT_DATE - INTERVAL '14 days')
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC;`
    );

    return res.status(200).json({
      summary: {
        today: {
          total: round2(todayRes.rows[0].total),
          count: parseInt(todayRes.rows[0].count, 10),
        },
        this_week: {
          total: round2(weekRes.rows[0].total),
          count: parseInt(weekRes.rows[0].count, 10),
        },
        this_month: {
          total: round2(monthRes.rows[0].total),
          count: parseInt(monthRes.rows[0].count, 10),
        },
      },
      by_payment_method: methodsRes.rows.map((r) => ({
        method: r.payment_method || 'other',
        count: parseInt(r.count, 10),
        total: round2(r.total),
      })),
      daily_trend: dailyTrendRes.rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        count: parseInt(r.transactions_count, 10),
        total: round2(r.total_collected),
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Loan Officer Performance Report
 */
export const getLoanOfficerPerformance = async (req, res, next) => {
  try {
    const performanceQuery = `
      SELECT 
        u.id AS user_id,
        u.full_name,
        u.email,
        u.role,
        COUNT(l.id) AS total_loans_originated,
        COUNT(CASE WHEN l.status = 'approved' THEN 1 END) AS approved_count,
        COUNT(CASE WHEN l.status IN ('disbursed', 'closed') THEN 1 END) AS disbursed_count,
        COUNT(CASE WHEN l.status = 'rejected' THEN 1 END) AS rejected_count,
        COALESCE(SUM(CASE WHEN l.status IN ('disbursed', 'closed') THEN l.principal ELSE 0 END), 0) AS total_disbursed_principal,
        COALESCE(SUM(CASE WHEN l.status IN ('disbursed', 'closed') THEN l.interest_amount ELSE 0 END), 0) AS total_interest_generated
      FROM users u
      LEFT JOIN loans l ON l.applied_by = u.id
      WHERE u.role IN ('loan_officer', 'manager', 'admin')
      GROUP BY u.id
      ORDER BY total_disbursed_principal DESC;
    `;

    const result = await query(performanceQuery);

    return res.status(200).json({
      officers: result.rows.map((r) => ({
        ...r,
        total_loans_originated: parseInt(r.total_loans_originated, 10),
        approved_count: parseInt(r.approved_count, 10),
        disbursed_count: parseInt(r.disbursed_count, 10),
        rejected_count: parseInt(r.rejected_count, 10),
        total_disbursed_principal: round2(r.total_disbursed_principal),
        total_interest_generated: round2(r.total_interest_generated),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getDashboardStats,
  getLoanPortfolioReport,
  getRepaymentScheduleReport,
  getCollectionReport,
  getLoanOfficerPerformance,
};
