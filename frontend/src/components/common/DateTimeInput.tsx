"use client";

import React from "react";
import {
  buildISTISOString,
  getISTDatePart,
  getISTTimePart,
} from "@/lib/dateRules";

export interface DateTimeInputProps {
  id: string;
  value: string;
  onChange: (isoValue: string) => void;
  label?: string;
  labelClassName?: string;
  min?: string;
  max?: string;
  error?: string;
  errorId?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
  dateAriaLabel?: string;
  timeAriaLabel?: string;
}

export function DateTimeInput({
  id,
  value,
  onChange,
  label,
  labelClassName,
  min,
  max,
  error,
  errorId,
  className = "",
  inputClassName,
  disabled = false,
  required = false,
  dateAriaLabel,
  timeAriaLabel,
}: DateTimeInputProps) {
  const dateVal = getISTDatePart(value);
  const timeVal = dateVal ? getISTTimePart(value) || "12:00" : "";

  const minDate = min ? getISTDatePart(min) || min : undefined;
  const maxDate = max ? getISTDatePart(max) || max : undefined;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) {
      onChange("");
      return;
    }
    const currentTime = timeVal || "12:00";
    onChange(buildISTISOString(newDate, currentTime));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (!dateVal) {
      return;
    }
    onChange(buildISTISOString(dateVal, newTime || "12:00"));
  };

  const defaultInputClass =
    "w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const appliedInputClass = inputClassName || defaultInputClass;

  return (
    <div className={`space-y-[6px] ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={
            labelClassName || "block text-sm font-medium text-white"
          }
        >
          {label}
        </label>
      )}

      <div
        role="group"
        aria-label={label ? `${label} date and time (IST)` : "Date and time (IST)"}
        className="flex flex-col gap-[8px] sm:flex-row sm:items-center"
      >
        <div className="flex-1 min-w-0">
          <input
            type="date"
            id={id}
            value={dateVal}
            onChange={handleDateChange}
            min={minDate}
            max={maxDate}
            disabled={disabled}
            required={required}
            aria-label={dateAriaLabel || (label ? `${label} date` : "Date")}
            aria-invalid={Boolean(error)}
            className={appliedInputClass}
          />
        </div>

        <div className="flex items-center gap-[6px] sm:w-[150px] shrink-0">
          <input
            type="time"
            id={`${id}-time`}
            value={timeVal || (dateVal ? "12:00" : "")}
            onChange={handleTimeChange}
            disabled={disabled || !dateVal}
            aria-label={timeAriaLabel || (label ? `${label} time (IST)` : "Time (IST)")}
            aria-invalid={Boolean(error)}
            className={appliedInputClass}
          />
          <span className="font-data-mono text-[11px] text-on-surface-variant uppercase shrink-0">
            IST
          </span>
        </div>
      </div>

      {error && (
        <p
          id={errorId}
          className="text-xs text-danger font-data-mono mt-[4px]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
