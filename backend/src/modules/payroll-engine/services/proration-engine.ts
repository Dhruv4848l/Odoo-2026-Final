export interface PeriodDates {
  startDate: Date;
  endDate: Date;
}

export interface ContractDetails {
  id: number;
  employee_id: number;
  wage: number;
  start_date: Date;
  end_date?: Date | null;
}

export interface ProrationResult {
  contractWage: number;
  totalWorkingDays: number;
  workedDays: number;
  unpaidLeaveDays: number;
  paidLeaveDays: number;
  overtimeHours: number;
  proratedBasicWage: number;
  isProrated: boolean;
}

export class ProrationEngine {
  /**
   * Calculates total working days (excluding weekends Mon-Fri standard)
   */
  static getWorkingDaysInPeriod(startDate: Date, endDate: Date): number {
    let count = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) { // Mon-Fri
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count || 1;
  }

  /**
   * Calculates effective working days for mid-month hire or resignation
   */
  static calculateProration(
    contract: ContractDetails,
    period: PeriodDates,
    attendanceWorkedDays: number = 0,
    unpaidLeaveDays: number = 0,
    paidLeaveDays: number = 0,
    overtimeHours: number = 0
  ): ProrationResult {
    const totalWorkingDays = this.getWorkingDaysInPeriod(period.startDate, period.endDate);

    // Determine effective active start and end dates within the period
    const contractStart = new Date(contract.start_date);
    const effectiveStart = contractStart > period.startDate ? contractStart : period.startDate;

    const contractEnd = contract.end_date ? new Date(contract.end_date) : null;
    let effectiveEnd = period.endDate;
    if (contractEnd && contractEnd < period.endDate) {
      effectiveEnd = contractEnd;
    }

    // Standard active days for contract within period
    const activeWorkingDays = this.getWorkingDaysInPeriod(effectiveStart, effectiveEnd);

    // Worked days taking unpaid leave into account
    // If attendance data was explicitly passed, use it; otherwise use active days minus unpaid leave
    const effectiveWorkedDays = Math.max(0, activeWorkingDays - unpaidLeaveDays);

    const isProrated = activeWorkingDays < totalWorkingDays || unpaidLeaveDays > 0;

    // Proration ratio (Dev C Edge Case 1 & 6)
    // Paid leave does NOT reduce basic; unpaid leave DOES reduce basic
    const prorationRatio = effectiveWorkedDays / totalWorkingDays;
    const proratedBasicWage = Math.round(contract.wage * prorationRatio * 100) / 100;

    return {
      contractWage: Number(contract.wage),
      totalWorkingDays,
      workedDays: effectiveWorkedDays,
      unpaidLeaveDays,
      paidLeaveDays,
      overtimeHours,
      proratedBasicWage,
      isProrated,
    };
  }
}
