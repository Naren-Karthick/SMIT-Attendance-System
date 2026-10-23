const { expect } = require('chai');
const { calculateAttendanceMetrics } = require('../../server/src/attendanceEngine');

describe('Attendance Engine - Calculation & Policy Tests', () => {
  const standardPolicy = {
    min_attendance_pct: 75.0,
    warning_threshold_pct: 85.0,
    od_treatment: 'attended',
    permission_treatment: 'attended',
    leave_treatment: 'excluded'
  };

  it('calculates 100% when all sessions are PRESENT', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' }
    ];
    const metrics = calculateAttendanceMetrics(records, standardPolicy);
    expect(metrics.percentage).to.equal(100.0);
    expect(metrics.statusBadge).to.equal('safe');
    expect(metrics.classesCanMiss).to.be.at.least(1);
    expect(metrics.classesNeededToRecover).to.equal(0);
  });

  it('accurately calculates critical status when below 75%', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'ABSENT' },
      { status: 'ABSENT' }
    ];
    const metrics = calculateAttendanceMetrics(records, standardPolicy);
    expect(metrics.percentage).to.equal(50.0);
    expect(metrics.statusBadge).to.equal('critical');
    expect(metrics.classesNeededToRecover).to.equal(4);
    expect(metrics.classesCanMiss).to.equal(0);
  });

  it('treats OD as attended under default policy', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'OD' },
      { status: 'ABSENT' },
      { status: 'PRESENT' }
    ];
    const metrics = calculateAttendanceMetrics(records, standardPolicy);
    expect(metrics.percentage).to.equal(75.0);
    expect(metrics.od).to.equal(1);
    expect(metrics.attendedHours).to.equal(3);
    expect(metrics.statusBadge).to.equal('warning');
  });

  it('treats LEAVE as excluded from denominator under default policy', () => {
    const records = [
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'LEAVE' }
    ];
    const metrics = calculateAttendanceMetrics(records, standardPolicy);
    expect(metrics.applicableTotal).to.equal(3);
    expect(metrics.attendedHours).to.equal(3);
    expect(metrics.percentage).to.equal(100.0);
  });
});
