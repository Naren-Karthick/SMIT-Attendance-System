const { expect } = require('chai');
const { generateEvidenceSignedUrl, verifyEvidenceToken } = require('../../server/src/utils/signedEvidence');
const { hasPermission } = require('../../server/src/middleware/auth');

describe('Security & Permissions Tests', () => {
  it('generates and validates an evidence signed token successfully', () => {
    const fileId = 'OD_EVIDENCE_2026_TEST';
    const url = generateEvidenceSignedUrl(fileId, 300);
    expect(url).to.include('/api/evidence/download/');
    const token = url.split('/api/evidence/download/')[1];
    
    const result = verifyEvidenceToken(token);
    expect(result.valid).to.be.true;
    expect(result.fileId).to.equal(fileId);
  });

  it('rejects an expired evidence token', () => {
    const fileId = 'EXPIRED_FILE';
    const url = generateEvidenceSignedUrl(fileId, -10); // Expired 10s ago
    const token = url.split('/api/evidence/download/')[1];
    
    const result = verifyEvidenceToken(token);
    expect(result.valid).to.be.false;
    expect(result.error).to.include('expired');
  });

  it('enforces RBAC permissions correctly across roles', () => {
    expect(hasPermission('student', 'attendance:mark')).to.be.false;
    expect(hasPermission('student', 'od:apply')).to.be.true;
    expect(hasPermission('faculty', 'attendance:mark')).to.be.true;
    expect(hasPermission('mentor', 'intervention:manage')).to.be.true;
    expect(hasPermission('hod', 'timetable:manage')).to.be.true;
    expect(hasPermission('sysadmin', 'anything')).to.be.true;
  });
});
