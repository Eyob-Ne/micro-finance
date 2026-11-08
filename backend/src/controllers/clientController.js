import { query } from '../config/db.js';
import { supabase } from '../config/supabase.js';
import { logAudit } from '../utils/audit.js';

/**
 * Helper to upload a buffer to Supabase Storage bucket 'kyc-docs'
 */
const uploadToSupabase = async (file, fileType, identifier) => {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Check SUPABASE_URL and credentials.');
  }

  const sanitizedId = (identifier || 'client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const ext = file.originalname?.split('.').pop() || 'jpg';
  const fileName = `${sanitizedId}_${fileType}_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('kyc-docs')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload ${fileType} to Supabase: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('kyc-docs')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

/**
 * Create a new client with optional KYC documents upload
 */
export const createClient = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      national_id,
      address,
      dob,
      gender,
    } = req.body;

    if (!first_name || !last_name || !national_id) {
      return res.status(400).json({
        error: 'first_name, last_name, and national_id are required fields.',
      });
    }

    // Check uniqueness of national_id
    const existing = await query(
      'SELECT id FROM clients WHERE national_id = $1',
      [national_id.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: `A client with National ID '${national_id}' is already registered.`,
      });
    }

    let kyc_id_url = null;
    let kyc_photo_url = null;

    // Handle KYC ID file upload
    if (req.files?.kyc_id?.[0]) {
      kyc_id_url = await uploadToSupabase(
        req.files.kyc_id[0],
        'kyc_id',
        national_id.trim()
      );
    }

    // Handle KYC photo file upload
    if (req.files?.kyc_photo?.[0]) {
      kyc_photo_url = await uploadToSupabase(
        req.files.kyc_photo[0],
        'kyc_photo',
        national_id.trim()
      );
    }

    const insertClientQuery = `
      INSERT INTO clients (
        first_name,
        last_name,
        phone,
        email,
        national_id,
        address,
        dob,
        gender,
        kyc_id_url,
        kyc_photo_url,
        created_by,
        is_active,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())
      RETURNING *;
    `;

    const clientValues = [
      first_name.trim(),
      last_name.trim(),
      phone ? phone.trim() : null,
      email ? email.trim().toLowerCase() : null,
      national_id.trim(),
      address ? address.trim() : null,
      dob || null,
      gender || null,
      kyc_id_url,
      kyc_photo_url,
      req.user.id,
    ];

    const clientResult = await query(insertClientQuery, clientValues);
    const newClient = clientResult.rows[0];

    // Automatically initialize a standard savings account for the new client
    const savingsResult = await query(
      `INSERT INTO savings_accounts (client_id, balance, created_at)
       VALUES ($1, 0, NOW())
       RETURNING id, balance, created_at;`,
      [newClient.id]
    );

    // Record audit event
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'CREATE_CLIENT',
      'clients',
      newClient.id,
      {
        national_id: newClient.national_id,
        full_name: `${newClient.first_name} ${newClient.last_name}`,
        has_kyc_id: !!kyc_id_url,
        has_kyc_photo: !!kyc_photo_url,
      },
      clientIp
    );

    return res.status(201).json({
      message: 'Client created successfully',
      client: newClient,
      savings_account: savingsResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List clients with pagination and search
 */
export const getClients = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = req.query.offset !== undefined ? parseInt(req.query.offset, 10) : (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        phone ILIKE $${paramIndex} OR 
        national_id ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (req.query.is_active !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(req.query.is_active === 'true');
      paramIndex++;
    }

    // Count total query
    const countQuery = `SELECT COUNT(*) FROM clients ${whereClause};`;
    const countRes = await query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Data query
    const dataQuery = `
      SELECT 
        c.*,
        COALESCE(s.balance, 0) AS savings_balance
      FROM clients c
      LEFT JOIN savings_accounts s ON s.client_id = c.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    params.push(limit, offset);

    const dataRes = await query(dataQuery, params);

    return res.status(200).json({
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      total_pages: Math.ceil(total / limit),
      clients: dataRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get client details including savings balance and active loans
 */
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get client
    const clientRes = await query(
      `SELECT c.*, u.full_name AS created_by_name 
       FROM clients c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const client = clientRes.rows[0];

    // Get savings account(s)
    const savingsRes = await query(
      `SELECT id, balance, created_at 
       FROM savings_accounts 
       WHERE client_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );

    // Get active loans
    const loansRes = await query(
      `SELECT 
        l.id,
        l.product_id,
        lp.name AS product_name,
        l.principal,
        l.interest_amount,
        l.total_repayable,
        l.status,
        l.applied_at,
        l.approved_at,
        l.disbursed_at
       FROM loans l
       LEFT JOIN loan_products lp ON l.product_id = lp.id
       WHERE l.client_id = $1 AND l.status IN ('pending', 'approved', 'disbursed')
       ORDER BY l.applied_at DESC`,
      [id]
    );

    return res.status(200).json({
      client,
      savings_account: savingsRes.rows[0] || null,
      active_loans: loansRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update client details and replace KYC files if provided
 */
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      phone,
      email,
      national_id,
      address,
      dob,
      gender,
      is_active,
    } = req.body;

    // Check client existence
    const existingRes = await query('SELECT * FROM clients WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    const current = existingRes.rows[0];

    // Check national_id collision if changed
    if (national_id && national_id.trim() !== current.national_id) {
      const collision = await query(
        'SELECT id FROM clients WHERE national_id = $1 AND id != $2',
        [national_id.trim(), id]
      );
      if (collision.rows.length > 0) {
        return res.status(409).json({
          error: `Another client with National ID '${national_id}' already exists.`,
        });
      }
    }

    let kyc_id_url = current.kyc_id_url;
    let kyc_photo_url = current.kyc_photo_url;

    const identifier = national_id ? national_id.trim() : current.national_id;

    if (req.files?.kyc_id?.[0]) {
      kyc_id_url = await uploadToSupabase(req.files.kyc_id[0], 'kyc_id', identifier);
    }

    if (req.files?.kyc_photo?.[0]) {
      kyc_photo_url = await uploadToSupabase(req.files.kyc_photo[0], 'kyc_photo', identifier);
    }

    const updateQuery = `
      UPDATE clients
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        national_id = COALESCE($5, national_id),
        address = COALESCE($6, address),
        dob = COALESCE($7, dob),
        gender = COALESCE($8, gender),
        kyc_id_url = COALESCE($9, kyc_id_url),
        kyc_photo_url = COALESCE($10, kyc_photo_url),
        is_active = COALESCE($11, is_active)
      WHERE id = $12
      RETURNING *;
    `;

    const updateValues = [
      first_name ? first_name.trim() : null,
      last_name ? last_name.trim() : null,
      phone !== undefined ? phone : null,
      email !== undefined ? email : null,
      national_id ? national_id.trim() : null,
      address !== undefined ? address : null,
      dob !== undefined ? dob : null,
      gender !== undefined ? gender : null,
      kyc_id_url,
      kyc_photo_url,
      is_active !== undefined ? is_active : null,
      id,
    ];

    const result = await query(updateQuery, updateValues);
    const updatedClient = result.rows[0];

    // Record audit event
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'UPDATE_CLIENT',
      'clients',
      id,
      {
        changes: req.body,
        updated_kyc_id: !!req.files?.kyc_id?.[0],
        updated_kyc_photo: !!req.files?.kyc_photo?.[0],
      },
      clientIp
    );

    return res.status(200).json({
      message: 'Client updated successfully',
      client: updatedClient,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Soft delete client by setting is_active = false
 */
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE clients 
       SET is_active = false 
       WHERE id = $1 
       RETURNING *;`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const deactivatedClient = result.rows[0];

    // Record audit event
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'DELETE_CLIENT',
      'clients',
      id,
      { is_active: false, national_id: deactivatedClient.national_id },
      clientIp
    );

    return res.status(200).json({
      message: 'Client deactivated successfully',
      client: deactivatedClient,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reactivate a previously soft-deleted client
 */
export const reactivateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE clients SET is_active = true WHERE id = $1 RETURNING *;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await logAudit(
      req.user.id,
      'REACTIVATE_CLIENT',
      'clients',
      id,
      { is_active: true },
      clientIp
    );
    return res.status(200).json({
      message: 'Client reactivated successfully.',
      client: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  reactivateClient,
};
