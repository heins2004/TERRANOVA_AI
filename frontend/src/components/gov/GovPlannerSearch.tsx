"use client";

import { useRef, useState } from "react";
import { invitePlanner, PlannerSearchItem, reassignPlanner, searchPlanners } from "@/services/gov";

interface GovPlannerSearchProps {
  projectId: number;
  isReassign?: boolean;
  onSuccess: () => void;
  hasArea?: boolean;
}

export function GovPlannerSearch({ projectId, isReassign = false, onSuccess, hasArea = true }: GovPlannerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlannerSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlanner, setSelectedPlanner] = useState<PlannerSearchItem | null>(null);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const actionRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const searchVal = (inputRef.current?.value ?? query).trim();
    console.error("HANDLE_SEARCH_EXECUTED:", searchVal);
    if (searchVal.length < 2) {
      setError("Please enter at least 2 characters to search planners.");
      return;
    }
    setError("");
    setSearching(true);
    setSelectedPlanner(null);

    try {
      const items = await searchPlanners(searchVal);
      setResults(items);
      if (items.length === 0) {
        setError("No active planners found matching your search.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Planner search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSendInvite() {
    if (!selectedPlanner) return;
    if (actionRef.current) return;

    actionRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const deadlineIso = deadline ? new Date(deadline).toISOString() : undefined;
      if (isReassign) {
        await reassignPlanner(projectId, {
          planner_id: selectedPlanner.id,
          planner_deadline: deadlineIso,
        });
      } else {
        await invitePlanner(projectId, {
          planner_id: selectedPlanner.id,
          planner_deadline: deadlineIso,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite planner.");
    } finally {
      actionRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[12px] border border-white/10 bg-surface-container-lowest/80 p-[20px] space-y-[16px]">
      <div>
        <h4 className="font-sans text-[15px] font-semibold text-white">
          {isReassign ? "Reassign Urban Planner" : "Invite an Urban Planner"}
        </h4>
        <p className="mt-[2px] text-[13px] text-on-surface-variant">
          Search qualified planners by name or ID (minimum 2 characters).
        </p>
      </div>

      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 p-[12px] text-danger text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-[10px]">
        <input
          ref={inputRef}
          id="gov-planner-search-input"
          type="text"
          defaultValue=""
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSearch();
            }
          }}
          placeholder="Search planner name or ID..."
          className="flex-1 min-w-0 rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-sm text-white placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          id="gov-planner-search-btn"
          disabled={searching}
          onClick={() => void handleSearch()}
          className="rounded border border-primary-container bg-primary-container/20 px-[16px] py-[8px] font-data-mono text-[12px] font-semibold text-primary uppercase transition-all hover:bg-primary-container/30 disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results List: show name and city ONLY */}
      {results.length > 0 && (
        <div className="space-y-[8px]">
          <p className="font-data-mono text-[11px] text-on-surface-variant uppercase">
            Available Planners ({results.length})
          </p>
          <div className="max-h-[180px] overflow-y-auto space-y-[6px]">
            {results.map((p) => {
              const isSelected = selectedPlanner?.id === p.id;
              return (
                <div
                  key={p.id}
                  id={`gov-planner-result-${p.id}`}
                  onClick={() => setSelectedPlanner(p)}
                  className={`flex cursor-pointer items-center justify-between rounded border p-[10px] transition-all ${
                    isSelected
                      ? "border-primary bg-primary-container/15"
                      : "border-white/10 hover:border-white/30 bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <div className="flex items-center gap-[8px] font-data-mono text-[11px] text-on-surface-variant">
                      <span>City: {p.city ?? "National"}</span>
                      {p.id != null && (
                        <>
                          <span className="text-white/20">•</span>
                          <span id={`gov-planner-id-${p.id}`}>ID {p.id}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`h-4 w-4 rounded-full border ${isSelected ? "border-primary bg-primary" : "border-white/30"}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPlanner && (
        <div className="space-y-[12px] border-t border-white/10 pt-[16px]">
          <div>
            <label className="block font-data-mono text-[11px] text-on-surface-variant uppercase">
              Proposal Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-[4px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] font-data-mono text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          {!hasArea && (
            <p className="rounded border border-warning/30 bg-warning/10 p-[10px] text-xs text-warning">
              Set the site area before inviting a planner.
            </p>
          )}

          <button
            type="button"
            id="gov-invite-planner-submit-btn"
            disabled={submitting || !hasArea}
            onClick={() => void handleSendInvite()}
            className="w-full rounded border border-primary-container bg-primary-container/25 py-[10px] font-data-mono text-[12px] font-semibold text-primary uppercase transition-all hover:bg-primary-container/35 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Dispatching Invitation..."
              : isReassign
              ? `Reassign to ${selectedPlanner.name}`
              : `Send Invitation to ${selectedPlanner.name}`}
          </button>
        </div>
      )}
    </div>
  );
}
