export interface EvaluationContext {
  BASIC: number;
  CONTRACT_WAGE: number;
  GROSS: number;
  WORKED_DAYS: number;
  TOTAL_WORKING_DAYS: number;
  OVERTIME_HOURS: number;
  UNPAID_LEAVE_DAYS: number;
  [key: string]: number;
}

export interface SalaryRuleDefinition {
  id: number;
  code: string;
  name: string;
  category: 'BASIC' | 'ALLOWANCE' | 'DEDUCTION' | 'GROSS' | 'NET';
  sequence: number;
  computation_method: 'Fixed' | 'Percentage' | 'Formula';
  amount?: number | null;
  formula?: string | null;
  cap_amount?: number | null;
  condition_expression?: string | null;
}

export class RuleEvaluator {
  /**
   * Safely evaluates math expressions including min(), max(), arithmetic operations and context variables
   */
  static evaluateExpression(expr: string, context: EvaluationContext): number {
    if (!expr || expr.trim() === '') return 0;

    let sanitized = expr;

    // Replace variable names with their numerical values from context
    // Sort keys by length descending to prevent replacing substrings of longer variables
    const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const val = context[key] ?? 0;
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      sanitized = sanitized.replace(regex, String(val));
    }

    // Replace min and max helper syntax
    sanitized = sanitized.replace(/min\(([^,]+),([^)]+)\)/gi, 'Math.min($1, $2)');
    sanitized = sanitized.replace(/max\(([^,]+),([^)]+)\)/gi, 'Math.max($1, $2)');

    try {
      // Evaluate mathematical expression in a restricted scope
      const fn = new Function('Math', `return (${sanitized});`);
      const result = fn(Math);
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (err) {
      console.error(`RuleEvaluator error evaluating expression [${expr}] -> [${sanitized}]:`, err);
      return 0;
    }
  }

  /**
   * Evaluates a single salary rule against execution context
   */
  static evaluateRule(rule: SalaryRuleDefinition, context: EvaluationContext): number {
    // 1. Evaluate condition expression if defined
    if (rule.condition_expression && rule.condition_expression.trim() !== '') {
      const isConditionMet = this.evaluateCondition(rule.condition_expression, context);
      if (!isConditionMet) {
        return 0;
      }
    }

    let calculatedAmount = 0;

    // 2. Compute based on method
    switch (rule.computation_method) {
      case 'Fixed':
        calculatedAmount = rule.amount ?? 0;
        break;

      case 'Percentage':
        // Percentage of BASIC by default, or evaluated from formula context
        const baseVal = context['BASIC'] || context['CONTRACT_WAGE'] || 0;
        const percentage = rule.amount ?? 0;
        calculatedAmount = (baseVal * percentage) / 100;
        break;

      case 'Formula':
        if (rule.formula) {
          calculatedAmount = this.evaluateExpression(rule.formula, context);
        }
        break;
    }

    // 3. Apply Cap if specified (Dev C Edge Case 2)
    if (rule.cap_amount != null && rule.cap_amount > 0) {
      calculatedAmount = Math.min(calculatedAmount, rule.cap_amount);
    }

    // 4. Rounding to 2 decimal places (Dev C Edge Case 10)
    return Math.round(calculatedAmount * 100) / 100;
  }

  /**
   * Evaluates boolean conditions (e.g. "OVERTIME_HOURS > 0")
   */
  private static evaluateCondition(condExpr: string, context: EvaluationContext): boolean {
    let sanitized = condExpr;
    const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const val = context[key] ?? 0;
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      sanitized = sanitized.replace(regex, String(val));
    }
    try {
      const fn = new Function(`return Boolean(${sanitized});`);
      return Boolean(fn());
    } catch {
      return true;
    }
  }
}
