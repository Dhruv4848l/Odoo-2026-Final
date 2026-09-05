import { query } from '../../../core/db';
import { SalaryRuleDefinition } from './rule-evaluator';

export interface SalaryStructure {
  id: number;
  name: string;
  description?: string;
  rules?: SalaryRuleDefinition[];
}

export class SalaryStructureService {
  static async getAllStructures(): Promise<SalaryStructure[]> {
    const res = await query('SELECT * FROM salary_structures ORDER BY id ASC');
    const structures = res.rows || [];

    for (const struct of structures) {
      const rulesRes = await query('SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC', [struct.id]);
      struct.rules = rulesRes.rows || [];
    }

    return structures;
  }

  static async getStructureById(id: number): Promise<SalaryStructure | null> {
    const structRes = await query('SELECT * FROM salary_structures WHERE id = $1', [id]);
    if (!structRes.rows || structRes.rows.length === 0) return null;

    const structure = structRes.rows[0];
    const rulesRes = await query(
      'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
      [id]
    );
    structure.rules = rulesRes.rows || [];
    return structure;
  }

  static async createStructure(name: string): Promise<SalaryStructure> {
    const res = await query(
      'INSERT INTO salary_structures (name) VALUES ($1) RETURNING *',
      [name]
    );
    if (!res.rows || !res.rows[0]) throw new Error('Failed to create salary structure');
    return { ...res.rows[0], rules: [] };
  }

  static async addSalaryRule(rule: any): Promise<SalaryRuleDefinition> {
    const res = await query(
      `INSERT INTO salary_rules 
       (structure_id, name, code, category, sequence, computation_method, amount, formula, condition_expression)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        rule.structure_id,
        rule.name,
        rule.code,
        rule.category,
        rule.sequence,
        rule.computation_method,
        rule.amount ?? null,
        rule.formula ?? null,
        rule.condition_expression ?? null
      ]
    );
    if (!res.rows || !res.rows[0]) throw new Error('Failed to create salary rule');
    return res.rows[0];
  }

  static async updateSalaryRule(id: number, rule: Partial<SalaryRuleDefinition>): Promise<SalaryRuleDefinition> {
    const res = await query(
      `UPDATE salary_rules SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        category = COALESCE($3, category),
        sequence = COALESCE($4, sequence),
        computation_method = COALESCE($5, computation_method),
        amount = $6,
        formula = $7,
        condition_expression = $8
       WHERE id = $9
       RETURNING *`,
      [
        rule.name, rule.code, rule.category, rule.sequence,
        rule.computation_method, rule.amount, rule.formula,
        rule.condition_expression, id
      ]
    );
    if (!res.rows || !res.rows[0]) throw new Error('Salary rule not found');
    return res.rows[0];
  }

  static async deleteSalaryRule(id: number): Promise<boolean> {
    const res = await query('DELETE FROM salary_rules WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
