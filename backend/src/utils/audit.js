import { query } from '../config/db.js';

/**
 * Audit log helper function
 * Constraint: Every write operation (create/update/delete) must call the logAudit utility.
 *
 * @param {string|null} userId - UUID of the user performing the action
 * @param {string} action - Action performed (e.g. 'CREATE_CLIENT', 'APPROVE_LOAN', 'DISBURSE_LOAN')
 * @param {string} entity - Target entity (e.g. 'clients', 'loans', 'savings')
 * @param {string|null} entityId - UUID of the affected entity
 * @param {object|null} changes - JSON object representing state changes, payload, or diff
 * @param {string|null} ip - Client IP address
 * @returns {Promise<object|null>} The inserted audit log record
 */
export const logAudit = async (userId, action, entity, entityId = null, changes = null, ip = null) => {
  try {
    let uId = userId;
    let act = action;
    let ent = entity;
    let entId = entityId;
    let chg = changes;
    let ipAddr = ip;

    // Gracefully support single-object configuration parameter { userId, action, entity, entityId, changes, ip }
    if (typeof userId === 'object' && userId !== null && action === undefined) {
      uId = userId.userId;
      act = userId.action;
      ent = userId.entity;
      entId = userId.entityId;
      chg = userId.changes || userId.details;
      ipAddr = userId.ip || userId.ip_address;
    }

    const text = `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, changes, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;

    const values = [
      uId || null,
      act,
      ent,
      entId || null,
      chg ? (typeof chg === 'string' ? chg : JSON.stringify(chg)) : null,
      ipAddr || null,
    ];

    const result = await query(text, values);
    return result.rows[0];
  } catch (error) {
    console.error('[logAudit Error]: Failed to record audit log entry:', error.message);
    return null;
  }
};

export default {
  logAudit,
};
