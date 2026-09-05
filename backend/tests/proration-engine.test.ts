import assert from 'assert';
import { ProrationEngine } from '../src/modules/payroll-engine/services/proration-engine';

console.log('--- Running ProrationEngine Unit Tests ---');

// Test 1: Full Month No Proration
const fullContract = {
  id: 1,
  employee_id: 1,
  wage: 5000,
  start_date: new Date('2026-01-01'),
  end_date: null,
};
const fullPeriod = {
  startDate: new Date('2026-09-01'),
  endDate: new Date('2026-09-30'),
};
const fullResult = ProrationEngine.calculateProration(fullContract, fullPeriod);
assert.strictEqual(fullResult.proratedBasicWage, 5000, 'Full month should return full wage');
assert.strictEqual(fullResult.isProrated, false);
console.log('✓ Test 1 Passed: Full month no proration');

// Test 2: Mid-Period Hire Proration (Jan 15 Hire)
const midHireContract = {
  id: 2,
  employee_id: 1,
  wage: 4400,
  start_date: new Date('2026-01-15'),
  end_date: null,
};
const janPeriod = {
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
};
const midHireResult = ProrationEngine.calculateProration(midHireContract, janPeriod);
assert.strictEqual(midHireResult.isProrated, true);
assert.ok(midHireResult.proratedBasicWage < 4400, 'Prorated wage should be less than full wage');
console.log(`✓ Test 2 Passed: Mid-month hire proration ($${midHireResult.proratedBasicWage} vs $4400 base)`);

// Test 3: Unpaid Leave Deducts Basic Wage (Dev C Edge Case 6)
const unpaidLeaveResult = ProrationEngine.calculateProration(fullContract, fullPeriod, 0, 2, 0, 0);
assert.strictEqual(unpaidLeaveResult.unpaidLeaveDays, 2);
assert.ok(unpaidLeaveResult.proratedBasicWage < 5000, 'Unpaid leave should reduce basic wage');
console.log(`✓ Test 3 Passed: Unpaid leave proration deduction ($${unpaidLeaveResult.proratedBasicWage})`);

console.log('All ProrationEngine tests passed successfully!\n');
