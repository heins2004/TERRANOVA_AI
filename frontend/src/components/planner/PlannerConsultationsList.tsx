"use client";

import React, { useEffect, useState } from "react";
import {
  ProjectConsultation,
  getProjectConsultations,
} from "@/services/projectConsultations";
import { formatISTDateTime } from "@/lib/dateRules";

interface Props {
  projectId: number;
}

export function PlannerConsultationsList({ projectId }: Props) {
  const [consultations, setConsultations] = useState<ProjectConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    getProjectConsultations(projectId)
      .then((data) => {
        if (!isCancelled) setConsultations(data);
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load consultations");
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  return (
    <section className="glass-card rounded-xl border border-white/10 bg-white/[0.02] p-[24px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
        <div>
          <h3 className="font-sans text-[18px] font-semibold text-white tracking-wide">
            Project Consultations
          </h3>
          <p className="font-data-mono text-xs text-on-surface-variant">
            Official public and private stakeholder consultations for this project (Read-Only).
          </p>
        </div>
        <span className="rounded-full bg-cyan-950/60 px-[10px] py-[3px] font-data-mono text-xs font-semibold text-cyan-400 border border-cyan-800/50">
          {consultations.length} TOTAL
        </span>
      </div>

      {loading ? (
        <p className="font-data-mono text-xs text-on-surface-variant py-[20px]">
          LOADING CONSULTATIONS...
        </p>
      ) : error ? (
        <p className="text-xs text-red-400 font-data-mono py-[16px]">{error}</p>
      ) : consultations.length === 0 ? (
        <p className="text-xs text-on-surface-variant py-[20px]">
          No consultations scheduled yet for this project.
        </p>
      ) : (
        <div className="mt-[16px] space-y-[14px]">
          {consultations.map((c) => {
            const isCancelled = c.status === "Cancelled";
            return (
              <div
                key={c.id}
                className={`rounded-lg border p-[16px] transition-colors ${
                  isCancelled
                    ? "border-red-900/40 bg-red-950/10 text-on-surface-variant"
                    : "border-white/10 bg-surface-container-lowest/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-[10px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <span className="rounded bg-cyan-950/80 px-[6px] py-[2px] font-data-mono text-[10px] text-cyan-300 border border-cyan-700/50 uppercase">
                        {c.type}
                      </span>
                      <span className="rounded bg-blue-950/80 px-[6px] py-[2px] font-data-mono text-[10px] text-blue-300 border border-blue-700/50 uppercase">
                        {c.visibility}
                      </span>
                      <span
                        className={`rounded px-[6px] py-[2px] font-data-mono text-[10px] uppercase border ${
                          isCancelled
                            ? "bg-red-950/80 text-red-300 border-red-700/60"
                            : "bg-cyan-950/40 text-cyan-400 border-cyan-800/40"
                        }`}
                      >
                        {c.status}
                      </span>
                      <h4
                        className={`font-sans text-sm font-semibold ${
                          isCancelled ? "text-gray-300 line-through" : "text-white"
                        }`}
                      >
                        {c.title}
                      </h4>
                    </div>

                    <p className="mt-[6px] text-xs text-on-surface-variant max-w-2xl leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="text-right font-data-mono text-xs">
                    <p className="text-cyan-300">
                      {formatISTDateTime(c.starts_at)}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      Duration: {c.duration_minutes} mins
                    </p>
                    {c.visibility === "Private" && c.invite_count != null && (
                      <p className="text-[11px] text-primary mt-[2px]">
                        {c.invite_count} citizen(s) invited
                      </p>
                    )}
                  </div>
                </div>

                {isCancelled && c.cancel_reason && (
                  <div className="mt-[10px] rounded border border-red-900/50 bg-red-950/20 p-[8px]">
                    <p className="font-data-mono text-[10px] font-semibold text-red-400 uppercase">
                      Cancellation Reason
                    </p>
                    <p className="text-xs text-red-200">{c.cancel_reason}</p>
                  </div>
                )}

                <div className="mt-[12px] flex flex-wrap items-center justify-between gap-[12px] border-t border-white/5 pt-[10px] font-data-mono text-xs">
                  <div>
                    {c.type === "Online" && c.meeting_url && (
                      <div className="flex items-center gap-[6px]">
                        <span className="text-[11px] text-on-surface-variant">Link:</span>
                        {isCancelled ? (
                          <span className="text-gray-500 break-all">{c.meeting_url}</span>
                        ) : (
                          <a
                            href={c.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 underline hover:text-cyan-300 break-all"
                          >
                            {c.meeting_url}
                          </a>
                        )}
                      </div>
                    )}
                    {c.type === "Venue" && c.venue_address && (
                      <div className="flex flex-wrap items-center gap-[8px]">
                        <div className="flex items-start gap-[6px]">
                          <span className="text-[11px] text-on-surface-variant">Venue:</span>
                          <span className="text-white break-words">{c.venue_address}</span>
                        </div>
                        {c.venue_lat != null && c.venue_lng != null && (
                          <a
                            id={`planner-consultation-map-link-${c.id}`}
                            href={`https://www.openstreetmap.org/?mlat=${c.venue_lat}&mlon=${c.venue_lng}#map=17/${c.venue_lat}/${c.venue_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[11px] text-cyan-400 underline hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          >
                            View on map
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {c.max_attendees != null && (
                    <div className="text-[11px] text-on-surface-variant">
                      Capacity:{" "}
                      <span className="text-white font-semibold">
                        {c.max_attendees.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
