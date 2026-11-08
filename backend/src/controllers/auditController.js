import { query } from '../config/db.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    // Optional filters
    const { action, user_id, entity } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let i = 1;

    if (action) {
      whereClause += ` AND al.action ILIKE $${i++}`;
      params.push(`%${action}%`);
    }
    if (user_id) {
      whereClause += ` AND al.user_id = $${i++}`;
      params.push(user_id);
    }
    if (entity) {
      whereClause += ` AND al.entity = $${i++}`;
      params.push(entity);
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM audit_logs al ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const dataRes = await query(
      `SELECT 
         al.id,
         al.user_id,
         u.full_name AS user_name,
         u.email AS user_email,
         al.action,
         al.entity,
         al.entity_id AS record_id,
         al.changes AS details,
         al.ip_address,
         al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${i++} OFFSET $${i++};`,
      params
    );

    return res.status(200).json({
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
      logs: dataRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

export default { getAuditLogs };
