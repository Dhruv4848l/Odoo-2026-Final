import assert from 'assert';
import { RuleEvaluator, EvaluationContext, SalaryRuleDefinition } from '../src/modules/payroll-engine/services/rule-evaluator.js';

console.log('--- Running RuleEvaluator Unit Tests ---');

// Test 1: Fixed Rule Calculation
const fixedRule: SalaryRuleDefinition = {
  id: 1,
  code: 'BASIC',
  name: 'Basic Wage',
  category: 'BASIC',
  sequence: 10,
  computation_method: 'Fixed',
  amount: 5000,
};
const context: EvaluationContext = {
  BASIC: 5000,
  CONTRACT_WAGE: 5000,
  GROSS: 5000,
  WORKED_DAYS: 22,
  TOTAL_WORKING_DAYS: 22,
  OVERTIME_HOURS: 0,
  UNPAID_LEAVE_DAYS: 0,
};
const fixedResult = RuleEvaluator.evaluateRule(fixedRule, context);
assert.strictEqual(fixedResult, 5000, 'Fixed rule should return exact amount');
console.log('✓ Test 1 Passed: Fixed rule calculation');

// Test 2: Percentage Rule Calculation
const percentageRule: SalaryRuleDefinition = {
  id: 2,
  code: 'HRA',
  name: 'House Rent Allowance',
  category: 'ALLOWANCE',
  sequence: 20,
  computation_method: 'Percentage',
  amount: 40, // 40% of BASIC
};
const hraResult = RuleEvaluator.evaluateRule(percentageRule, context);
assert.strictEqual(hraResult, 2000, 'HRA (40% of 5000) should return 2000');
console.log('✓ Test 2 Passed: Percentage rule calculation');

// Test 3: Capped Rule Calculation (Dev C Edge Case 2)
const pfCapRule: SalaryRuleDefinition = {
  id: 3,
  code: 'PF',
  name: 'Provident Fund (Capped $1800)',
  category: 'DEDUCTION',
  sequence: 30,
  computation_method: 'Percentage',
  amount: 12, // 12% of 20,000 = 2400 -> Capped at 1800
  cap_amount: 1800,
};
const highWageContext: EvaluationContext = { ...context, BASIC: 20000 };
const pfResult = RuleEvaluator.evaluateRule(pfCapRule, highWageContext);
assert.strictEqual(pfResult, 1800, 'PF should be capped at 1800 ceiling');
console.log('✓ Test 3 Passed: Capped contribution rule calculation');

// Test 4: Formula Expression Calculation
const formulaRule: SalaryRuleDefinition = {
  id: 4,
  code: 'OT_PAY',
  name: 'Overtime Pay',
  category: 'ALLOWANCE',
  sequence: 40,
  computation_method: 'Formula',
  formula: '(BASIC / 176) * 1.5 * OVERTIME_HOURS',
};
const otContext: EvaluationContext = { ...context, BASIC: 3520, OVERTIME_HOURS: 10 };
const otResult = RuleEvaluator.evaluateRule(formulaRule, otContext);
// (3520 / 176) = 20 * 1.5 * 10 = 300
assert.strictEqual(otResult, 300, 'Overtime pay formula should evaluate correctly');
console.log('✓ Test 4 Passed: Formula expression calculation');

console.log('All RuleEvaluator tests passed successfully!\n');
