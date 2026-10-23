const { expect } = require('chai');
const { evaluateStudentRisk, simulateRecoveryPlan } = require('../../server/src/riskEngine');
const { initSchema, getDb } = require('../../server/src/db');

describe('Intelligence Engines & Digital Verification Tests', () => {
  before(() => {
    initSchema();
  });

  it('evaluates student risk with transparent explanations', () => {
    const risk = evaluateStudentRisk(1);
    expect(risk).to.have.property('studentId', 1);
    expect(risk).to.have.property('riskLevel');
    expect(risk).to.have.property('explanations').that.is.an('array');
    expect(risk.explanations.length).to.be.at.least(1);
  });

  it('accurately projects timetable recovery across 75%, 80%, and 85% milestones', () => {
    const plan = simulateRecoveryPlan(1, [75, 80, 85]);
    expect(plan).to.have.property('targets').that.is.an('array').with.lengthOf(3);
    const target75 = plan.targets.find(t => t.targetPercentage === 75);
    expect(target75).to.exist;
    expect(target75.achievable).to.be.true;
  });
});