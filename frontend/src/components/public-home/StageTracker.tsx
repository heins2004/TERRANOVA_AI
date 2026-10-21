"use client";

export type ProjectStage =
  | "OpenForResponse"
  | "InProgress"
  | "Completed"
  | "Halted"
  | string;

type StageTrackerProps = {
  stage: ProjectStage;
  haltReason?: string;
};

const STAGES = [
  { key: "OpenForResponse", label: "Open for response", order: 0 },
  { key: "InProgress", label: "In progress", order: 1 },
  { key: "Completed", label: "Completed", order: 2 },
];

export function StageTracker({ stage, haltReason }: StageTrackerProps) {
  if (stage === "Halted") {
    return (
      <div
        role="alert"
        className="mb-[16px] rounded-[10px] border border-danger bg-danger/10 p-[14px] font-body-md text-[13px] text-on-surface"
      >
        <span className="font-semibold text-danger">Halted.</span>{" "}
        {haltReason || "This project is currently paused by governing authorities."}
      </div>
    );
  }

  const currentOrder =
    stage === "Completed" ? 2 : stage === "InProgress" ? 1 : 0;

  return (
    <ol className="flex flex-row gap-[6px] p-0 list-none font-body-md text-[11px] h-[30px] items-stretch">
      {STAGES.map((s, idx) => {
        const isDone = idx < currentOrder;
        const isCurrent = idx === currentOrder;

        return (
          <li
            key={s.key}
            className={`flex-1 rounded-[6px] border px-[8px] flex items-center justify-center text-center transition-all ${
              isDone
                ? "border-success/60 bg-success/10 text-on-surface font-medium"
                : isCurrent
                ? "border-primary-container/70 bg-primary-container/15 text-primary-container font-semibold"
                : "border-white/10 bg-surface-container-lowest/60 text-on-surface-variant"
            }`}
          >
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}
