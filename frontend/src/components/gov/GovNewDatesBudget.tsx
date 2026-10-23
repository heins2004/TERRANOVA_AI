"use client";

import { getKolkataToday } from "@/lib/dateRules";

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
        <div>
          <label className="block text-sm font-medium text-white">Start Date</label>
          <input
            id="gov-input-start-date"
            type="date"
            min={minStartDate}
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[14px] py-[10px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
          />
          {startDateError && (
            <p id="gov-start-date-error" className="mt-[4px] text-[12px] text-danger">
              {startDateError}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white">End Date</label>
          <input
            id="gov-input-end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[14px] py-[10px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
          />
          {endDateError && (
            <p id="gov-end-date-error" className="mt-[4px] text-[12px] text-danger">
              {endDateError}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
