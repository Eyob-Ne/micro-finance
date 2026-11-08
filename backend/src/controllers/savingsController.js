import { query, pool } from '../config/db.js';
import { logAudit } from '../utils/audit.js';

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * 1. Open a Savings Account for a Client
 */
export const openAccount = async (req, res, next) => {
  try {
    const { client_id } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required.' });
    }

    // Check client exists
    const clientRes = await query('SELECT id, first_name, last_name, is_active FROM clients WHERE id = $1', [client_id]);
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    if (!clientRes.rows[0].is_active) {
      return res.status(400).json({ error: 'Cannot open savings account for an inactive client.' });
    }

    // Check if account already exists
    const existing = await query('SELECT * FROM savings_accounts WHERE client_id = $1', [client_id]);
    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: 'Client already has an active savings account.',
        account: existing.rows[0],
      });
    }

    const insertText = `
      INSERT INTO savings_accounts (client_id, balance, created_at)
      VALUES ($1, 0, NOW())
      RETURNING *;
    `;

    const result = await query(insertText, [client_id]);
    const newAccount = result.rows[0];

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'OPEN_SAVINGS_ACCOUNT',
      'savings_accounts',
      newAccount.id,
      { client_id },
      clientIp
    );

    return res.status(201).json({
      message: 'Savings account opened successfully',
      account: newAccount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Deposit into Savings Account
 * Constraint: Atomic DB transaction
 */
export const deposit = async (req, res, next) => {
  const dbClient = await pool.connect();

  try {
    const { account_id, amount, payment_method = 'cash' } = req.body;

    if (!account_id || amount === undefined) {
      return res.status(400).json({ error: 'account_id and amount are required.' });
    }

    const depositAmount = round2(amount);
    if (depositAmount <= 0) {
      return res.status(400).json({ error: 'Deposit amount must be greater than zero.' });
    }

    await dbClient.query('BEGIN');

    // Pessimistic lock on savings account
    const accountRes = await dbClient.query(
      'SELECT * FROM savings_accounts WHERE id = $1 FOR UPDATE;',
      [account_id]
    );

    if (accountRes.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Savings account not found.' });
    }

    const account = accountRes.rows[0];
    const newBalance = round2(Number(account.balance) + depositAmount);

    // Update account balance
    const updateRes = await dbClient.query(
      'UPDATE savings_accounts SET balance = $1 WHERE id = $2 RETURNING *;',
      [newBalance, account_id]
    );
    const updatedAccount = updateRes.rows[0];

    // Record transaction
    const txQuery = `
      INSERT INTO savings_transactions (
        account_id, type, amount, payment_method, balance_after, recorded_by, created_at
      )
      VALUES ($1, 'deposit', $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const txRes = await dbClient.query(txQuery, [
      account_id,
      depositAmount,
      payment_method,
      newBalance,
      req.user.id,
    ]);
    const transaction = txRes.rows[0];

    await dbClient.query('COMMIT');

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'SAVINGS_DEPOSIT',
      'savings_transactions',
      transaction.id,
      {
        account_id,
        amount: depositAmount,
        balance_after: newBalance,
        payment_method,
      },
      clientIp
    );

    return res.status(200).json({
      message: 'Deposit completed successfully',
      account: updatedAccount,
      transaction,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    next(err);
  } finally {
    dbClient.release();
  }
};

/**
 * 3. Withdraw from Savings Account
 * Constraint: Atomic DB transaction, sufficient balance verification
 */
export const withdraw = async (req, res, next) => {
  const dbClient = await pool.connect();

  try {
    const { account_id, amount, payment_method = 'cash' } = req.body;

    if (!account_id || amount === undefined) {
      return res.status(400).json({ error: 'account_id and amount are required.' });
    }

    const withdrawAmount = round2(amount);
    if (withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Withdrawal amount must be greater than zero.' });
    }

    await dbClient.query('BEGIN');

    // Pessimistic lock on savings account
    const accountRes = await dbClient.query(
      'SELECT * FROM savings_accounts WHERE id = $1 FOR UPDATE;',
      [account_id]
    );

    if (accountRes.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Savings account not found.' });
    }

    const account = accountRes.rows[0];
    const currentBalance = round2(Number(account.balance));

    if (currentBalance < withdrawAmount) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient savings balance. Available balance: ${currentBalance}, Requested: ${withdrawAmount}`,
      });
    }

    const newBalance = round2(currentBalance - withdrawAmount);

    // Update account balance
    const updateRes = await dbClient.query(
      'UPDATE savings_accounts SET balance = $1 WHERE id = $2 RETURNING *;',
      [newBalance, account_id]
    );
    const updatedAccount = updateRes.rows[0];

    // Record transaction
    const txQuery = `
      INSERT INTO savings_transactions (
        account_id, type, amount, payment_method, balance_after, recorded_by, created_at
      )
      VALUES ($1, 'withdrawal', $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const txRes = await dbClient.query(txQuery, [
      account_id,
      withdrawAmount,
      payment_method,
      newBalance,
      req.user.id,
    ]);
    const transaction = txRes.rows[0];

    await dbClient.query('COMMIT');

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'SAVINGS_WITHDRAWAL',
      'savings_transactions',
      transaction.id,
      {
        account_id,
        amount: withdrawAmount,
        balance_after: newBalance,
        payment_method,
      },
      clientIp
    );

    return res.status(200).json({
      message: 'Withdrawal completed successfully',
      account: updatedAccount,
      transaction,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    next(err);
  } finally {
    dbClient.release();
  }
};

/**
 * 4. Get Savings Account and Recent Transactions for a Client
 */
export const getAccountByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const accountRes = await query(
      `SELECT sa.*, c.first_name, c.last_name, c.national_id, c.phone 
       FROM savings_accounts sa
       JOIN clients c ON sa.client_id = c.id
       WHERE sa.client_id = $1`,
      [clientId]
    );

    if (accountRes.rows.length === 0) {
      return res.status(404).json({ error: 'No savings account found for this client.' });
    }

    const account = accountRes.rows[0];

    // Fetch recent 20 transactions
    const txRes = await query(
      `SELECT st.*, u.full_name AS recorded_by_name
       FROM savings_transactions st
       LEFT JOIN users u ON st.recorded_by = u.id
       WHERE st.account_id = $1
       ORDER BY st.created_at DESC
       LIMIT 20;`,
      [account.id]
    );

    return res.status(200).json({
      account,
      recent_transactions: txRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Get Paginated Transaction History for an Account
 */
export const getTransactionHistory = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    // Verify account exists
    const accountCheck = await query('SELECT id FROM savings_accounts WHERE id = $1', [accountId]);
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Savings account not found.' });
    }

    const countRes = await query(
      'SELECT COUNT(*) FROM savings_transactions WHERE account_id = $1',
      [accountId]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const txRes = await query(
      `SELECT st.*, u.full_name AS recorded_by_name
       FROM savings_transactions st
       LEFT JOIN users u ON st.recorded_by = u.id
       WHERE st.account_id = $1
       ORDER BY st.created_at DESC
       LIMIT $2 OFFSET $3;`,
      [accountId, limit, offset]
    );

    return res.status(200).json({
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      transactions: txRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  openAccount,
  deposit,
  withdraw,
  getAccountByClient,
  getTransactionHistory,
};
