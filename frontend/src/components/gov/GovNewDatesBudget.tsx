"use client";

import { getKolkataToday } from "@/lib/dateRules";
import { DateTimeInput } from "@/components/common/DateTimeInput";

interface GovNewDatesBudgetProps {
  budget: string;
  startDate: string;
  endDate: string;
  onBudgetChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  budgetError?: string;
  startDateError?: string;
  endDateError?: string;
}

export function GovNewDatesBudget({
  budget,
  startDate,
  endDate,
  onBudgetChange,
  onStartDateChange,
  onEndDateChange,
  budgetError,
  startDateError,
  endDateError,
}: GovNewDatesBudgetProps) {
  const minStartDate = getKolkataToday();

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-white">Budget (₹ INR)</label>
        <input
          id="gov-input-budget"
          type="number"
          value={budget}
          onChange={(e) => onBudgetChange(e.target.value)}
          className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[14px] py-[10px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
        />
        {budgetError && <p className="mt-[4px] text-[12px] text-danger">{budgetError}</p>}
      </div>

      <div className="grid gap-[16px] sm:grid-cols-2">
        <DateTimeInput
          id="gov-input-start-date"
          label="Start Date"
          min={minStartDate}
          value={startDate}
          onChange={onStartDateChange}
          error={startDateError}
          errorId="gov-start-date-error"
        />

        <DateTimeInput
          id="gov-input-end-date"
          label="End Date"
          value={endDate}
          onChange={onEndDateChange}
          error={endDateError}
          errorId="gov-end-date-error"
        />
      </div>
    </>
  );
}
