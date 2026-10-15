"use client";

interface ProposalExplanationFieldProps {
  explanation: string;
  onChange: (val: string) => void;
  error?: string;
}

export function ProposalExplanationField({
  explanation,
  onChange,
  error,
}: ProposalExplanationFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
          Site Explanation (20 - 1000 characters)
        </label>
        <span className="font-data-mono text-[10px] text-on-surface-variant">
          {explanation.trim().length} / 1000
        </span>
      </div>
      <textarea
        rows={4}
        id="planner-site-explanation"
        placeholder="Explain spatial suitability, accessibility, and environmental feasibility..."
        value={explanation}
        onChange={(e) => onChange(e.target.value)}
        maxLength={1000}
        className="mt-[6px] w-full rounded border border-white/15 bg-white/[0.03] px-[14px] py-[10px] text-sm text-foreground focus:border-primary-container/80 focus:outline-none"
      />
      {error && (
        <p className="mt-[4px] font-data-mono text-[11px] text-danger">{error}</p>
      )}
    </div>
  );
}
