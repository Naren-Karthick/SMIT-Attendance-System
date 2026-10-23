const crypto = require('crypto');
const SECRETS_KEY = process.env.JWT_SECRET || 'smit-smart-attendance-super-secret-key-2026';
function generateEvidenceSignedUrl(fileId, expiresInSeconds = 3600) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const payload = String(fileId) + ':' + String(expiresAt);
  const signature = crypto.createHmac('sha256', SECRETS_KEY).update(payload).digest('hex');
  const token = Buffer.from(JSON.stringify({ fileId, expiresAt, signature })).toString('base64url');
  return '/api/evidence/download/' + token;
}
function verifyEvidenceToken(token) {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const { fileId, expiresAt, signature } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      return { valid: false, error: 'Link has expired. Please request a new link.' };
    }
    const payload = String(fileId) + ':' + String(expiresAt);
    const expectedSignature = crypto.createHmac('sha256', SECRETS_KEY).update(payload).digest('hex');
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid file signature.' };
    }
    return { valid: true, fileId };
  } catch (err) {
    return { valid: false, error: 'Malformed access token.' };
  }
}
module.exports = { generateEvidenceSignedUrl, verifyEvidenceToken };