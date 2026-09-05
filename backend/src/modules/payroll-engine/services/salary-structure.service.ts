import { query } from '../../../core/db';
import { SalaryRuleDefinition } from './rule-evaluator';

export interface SalaryStructure {
  id: number;
  name: string;
  rules?: SalaryRuleDefinition[];
}

export class SalaryStructureService {
  static async getAllStructures(): Promise<SalaryStructure[]> {
    const res = await query('SELECT * FROM salary_structures ORDER BY id ASC');
    return res.rows;
  }

  static async getStructureById(id: number): Promise<SalaryStructure | null> {
    const structRes = await query('SELECT * FROM salary_structures WHERE id = $1', [id]);
    if (structRes.rows.length === 0) return null;

    const structure = structRes.rows[0];
    const rulesRes = await query(
      'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
      [id]
    );

    structure.rules = rulesRes.rows;
    return structure;
  }

  static async createStructure(name: string): Promise<SalaryStructure> {
    const res = await query(
      'INSERT INTO salary_structures (name) VALUES ($1) RETURNING *',
      [name]
    );
    return res.rows[0];
  }

  static async addSalaryRule(rule: Omit<SalaryRuleDefinition, 'id'> & { structure_id: number }): Promise<SalaryRuleDefinition> {
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
        rule.name,
        rule.code,
        rule.category,
        rule.sequence,
        rule.computation_method,
        rule.amount,
        rule.formula,
        rule.condition_expression,
        id
      ]
    );
    return res.rows[0];
  }

  static async deleteSalaryRule(id: number): Promise<boolean> {
    const res = await query('DELETE FROM salary_rules WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
