import { query } from '../../../core/db.js';

export interface SalaryRuleDefinition {
  id: string;
  structure_id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  computation_method: string;
  amount?: number;
  value?: number;
  formula?: string;
  cap_amount?: number;
  condition_expression?: string;
  is_active?: boolean;
}

export interface SalaryStructure {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  rules?: SalaryRuleDefinition[];
}

export class SalaryStructureService {
  static async getAllStructures(): Promise<SalaryStructure[]> {
    const res = await query('SELECT * FROM salary_structures ORDER BY created_at DESC');
    const structures = res.rows || [];

    for (const struct of structures) {
      const rulesRes = await query('SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC', [String(struct.id)]);
      struct.rules = rulesRes.rows || [];
    }

    return structures;
  }

  static async getStructureById(id: string): Promise<SalaryStructure | null> {
    const structRes = await query('SELECT * FROM salary_structures WHERE id = $1', [String(id)]);
    if (!structRes.rows || structRes.rows.length === 0) return null;

    const structure = structRes.rows[0];
    const rulesRes = await query(
      'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
      [String(id)]
    );
    structure.rules = rulesRes.rows || [];
    return structure;
  }

  static async createStructure(name: string, code?: string, description?: string): Promise<SalaryStructure> {
    const structId = `struct_${Date.now()}`;
    const structCode = code || name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
    const res = await query(
      'INSERT INTO salary_structures (id, name, code, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [structId, name, structCode, description || '']
    );
    if (!res.rows || !res.rows[0]) throw new Error('Failed to create salary structure');
    return { ...res.rows[0], rules: [] };
  }

  static async addSalaryRule(rule: any): Promise<SalaryRuleDefinition> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const res = await query(
      `INSERT INTO salary_rules 
       (id, structure_id, name, code, category, sequence, computation_method, amount, formula, condition_expression)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        ruleId,
        String(rule.structure_id),
        rule.name,
        rule.code,
        rule.category || 'ALLOWANCE',
        Number(rule.sequence) || 10,
        rule.computation_method || 'Fixed',
        rule.amount !== undefined ? Number(rule.amount) : null,
        rule.formula ?? null,
        rule.condition_expression ?? null
      ]
    );
    if (!res.rows || !res.rows[0]) throw new Error('Failed to create salary rule');
    return res.rows[0];
  }

  static async updateSalaryRule(id: string, rule: Partial<SalaryRuleDefinition>): Promise<SalaryRuleDefinition> {
    const res = await query(
      `UPDATE salary_rules SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        category = COALESCE($3, category),
        sequence = COALESCE($4, sequence),
        computation_method = COALESCE($5, computation_method),
        amount = COALESCE($6, amount),
        formula = COALESCE($7, formula),
        condition_expression = COALESCE($8, condition_expression)
       WHERE id = $9
       RETURNING *`,
      [
        rule.name, rule.code, rule.category, rule.sequence,
        rule.computation_method, rule.amount, rule.formula,
        rule.condition_expression, String(id)
      ]
    );
    if (!res.rows || !res.rows[0]) throw new Error('Salary rule not found');
    return res.rows[0];
  }

  static async deleteSalaryRule(id: string): Promise<boolean> {
    const res = await query('DELETE FROM salary_rules WHERE id = $1', [String(id)]);
    return (res.rowCount ?? 0) > 0;
  }
}
