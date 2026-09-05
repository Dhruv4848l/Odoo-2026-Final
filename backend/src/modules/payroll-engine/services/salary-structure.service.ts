import { query, memoryDb } from '../../../core/db';
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
    if (res.rows && res.rows.length > 0) {
      const structures = res.rows;
      for (const struct of structures) {
        const rulesRes = await query('SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC', [struct.id]);
        struct.rules = rulesRes.rows || [];
      }
      return structures;
    }

    // Memory DB Fallback
    return memoryDb.salary_structures.map((s: any) => ({
      ...s,
      rules: (memoryDb.salary_rules as any[]).filter((r: any) => r.structure_id === s.id).sort((a: any, b: any) => a.sequence - b.sequence),
    }));
  }

  static async getStructureById(id: number): Promise<SalaryStructure | null> {
    const structRes = await query('SELECT * FROM salary_structures WHERE id = $1', [id]);
    if (structRes.rows && structRes.rows.length > 0) {
      const structure = structRes.rows[0];
      const rulesRes = await query(
        'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
        [id]
      );
      structure.rules = rulesRes.rows;
      return structure;
    }

    // Memory DB Fallback
    const found = memoryDb.salary_structures.find((s: any) => s.id === id);
    if (!found) return null;
    return {
      ...found,
      rules: (memoryDb.salary_rules as any[]).filter((r: any) => r.structure_id === id).sort((a: any, b: any) => a.sequence - b.sequence),
    };
  }

  static async createStructure(name: string): Promise<SalaryStructure> {
    const res = await query(
      'INSERT INTO salary_structures (name) VALUES ($1) RETURNING *',
      [name]
    );
    if (res.rows && res.rows[0]) return res.rows[0];

    // Memory DB Fallback
    const newStruct: SalaryStructure = {
      id: Date.now(),
      name,
      description: '',
      rules: [],
    };
    memoryDb.salary_structures.push(newStruct as any);
    return newStruct;
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
    if (res.rows && res.rows[0]) return res.rows[0];

    // Memory DB Fallback
    const newRule: any = {
      id: Date.now(),
      structure_id: rule.structure_id,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      sequence: Number(rule.sequence),
      computation_method: rule.computation_method,
      amount: rule.amount ?? null,
      formula: rule.formula ?? null,
      cap_amount: rule.cap_amount ?? null,
      condition_expression: rule.condition_expression ?? null,
    };
    memoryDb.salary_rules.push(newRule);
    return newRule;
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
    if (res.rows && res.rows[0]) return res.rows[0];

    // Memory DB Fallback
    const idx = (memoryDb.salary_rules as any[]).findIndex((r: any) => r.id === id);
    if (idx !== -1) {
      (memoryDb.salary_rules as any[])[idx] = { ...(memoryDb.salary_rules as any[])[idx], ...rule };
      return (memoryDb.salary_rules as any[])[idx] as SalaryRuleDefinition;
    }
    throw new Error('Salary rule not found');
  }

  static async deleteSalaryRule(id: number): Promise<boolean> {
    const res = await query('DELETE FROM salary_rules WHERE id = $1', [id]);
    if (res.rowCount && res.rowCount > 0) return true;

    // Memory DB Fallback
    const idx = (memoryDb.salary_rules as any[]).findIndex((r: any) => r.id === id);
    if (idx !== -1) {
      memoryDb.salary_rules.splice(idx, 1);
      return true;
    }
    return false;
  }
}
