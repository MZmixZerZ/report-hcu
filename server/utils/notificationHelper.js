/**
 * Notification Helper — creates notification documents in Firestore.
 *
 * Schema (notifications collection):
 *   recipientId   : string | null — specific user UID (officer)
 *   recipientRole : string | null — broadcast to role ('admin')
 *   type          : 'new_complaint' | 'custom_issue_request'
 *   title         : string
 *   body          : string
 *   complaintId   : string | null
 *   customIssueId : string | null
 *   read          : boolean (false on creation)
 *   createdAt     : Timestamp
 */

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {Object} opts
 * @param {string|null} [opts.recipientId]   - specific user UID
 * @param {string|null} [opts.recipientRole] - role broadcast ('admin')
 * @param {string}      opts.type
 * @param {string}      opts.title
 * @param {string}      opts.body
 * @param {string|null} [opts.complaintId]
 * @param {string|null} [opts.customIssueId]
 */
async function createNotification(db, {
  recipientId = null,
  recipientRole = null,
  type,
  title,
  body,
  complaintId = null,
  customIssueId = null,
}) {
  await db.collection('notifications').add({
    recipientId,
    recipientRole,
    type,
    title,
    body,
    complaintId,
    customIssueId,
    read: false,
    createdAt: new Date(),
  });
}

module.exports = { createNotification };
