"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import {
  getProjectConsultations,
  getPublicProjectConsultations,
} from "@/services/projectConsultations";

interface Props {
  projectId: number;
}

type UnifiedConsultation = {
  id: number;
  title: string;
  description: string;
  starts_at: string;
  duration_minutes: number;
  type: "Online" | "Venue";
  meeting_url: string | null;
  venue_address: string | null;
  max_attendees: number | null;
  visibility?: "Public" | "Private";
  status: "Scheduled" | "Cancelled";
  cancel_reason: string | null;
};

function formatIndiaTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return (
      d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return dateString;
  }
}

export function ProjectConsultationsSection({ projectId }: Props) {
  const { isAuthenticated } = useAuth();
  const [consultations, setConsultations] = useState<UnifiedConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchPromise = isAuthenticated
      ? getProjectConsultations(projectId)
      : getPublicProjectConsultations(projectId);

    fetchPromise
      .then((data) => {
        if (!isCancelled) {
          setConsultations(data as UnifiedConsultation[]);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          // If authenticated fetch fails with 404 or auth issue, fallback to public
          if (isAuthenticated) {
            getPublicProjectConsultations(projectId)
              .then((pubData) => {
                if (!isCancelled) setConsultations(pubData as UnifiedConsultation[]);
              })
              .catch(() => {
                if (!isCancelled) setError("Unable to load consultations.");
              });
          } else {
            setError(err instanceof Error ? err.message : "Unable to load consultations.");
          }
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId, isAuthenticated]);

  return (
    <section aria-labelledby="consultations-heading" className="mt-[24px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-[12px]">
        <div className="flex items-center gap-[10px]">
          <h2
            id="consultations-heading"
            className="font-sans text-[18px] font-semibold text-white tracking-wide"
          >
            Consultations
          </h2>
          <span className="rounded-full bg-cyan-950/60 px-[8px] py-[2px] font-data-mono text-[11px] font-medium text-cyan-400 border border-cyan-800/50">
            {consultations.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-[24px] text-center font-data-mono text-xs text-on-surface-variant">
          LOADING CONSULTATIONS...
        </div>
      ) : error ? (
        <div className="py-[16px] text-xs text-red-400 font-data-mono">{error}</div>
      ) : consultations.length === 0 ? (
        <div
          role="status"
          className="rounded-[12px] border border-white/10 bg-surface-container-lowest/40 p-[24px] text-center mt-[12px]"
        >
          <p className="font-sans text-sm text-on-surface-variant">
            No consultations scheduled yet.
          </p>
        </div>
      ) : (
        <div className="mt-[16px] space-y-[14px]">
          {consultations.map((c) => {
            const isCancelled = c.status === "Cancelled";
            const isPrivate = c.visibility === "Private";

            return (
              <article
                key={c.id}
                tabIndex={0}
                aria-label={`Consultation: ${c.title}`}
                className={`rounded-[12px] border p-[16px] sm:p-[20px] transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  isCancelled
                    ? "border-red-900/40 bg-red-950/10 text-on-surface-variant"
                    : "border-white/10 bg-surface-container-lowest/60 hover:border-cyan-500/30"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-[10px]">
                  <div className="space-y-[4px]">
                    <div className="flex flex-wrap items-center gap-[8px]">
                      <span
                        className={`inline-flex items-center rounded px-[8px] py-[2px] font-data-mono text-[10px] font-semibold uppercase tracking-wider ${
                          c.type === "Online"
                            ? "bg-cyan-950/70 text-cyan-300 border border-cyan-700/50"
                            : "bg-blue-950/70 text-blue-300 border border-blue-700/50"
                        }`}
                      >
                        {c.type}
                      </span>

                      {isPrivate && (
                        <span className="inline-flex items-center rounded border border-cyan-700/60 bg-cyan-950/50 px-[8px] py-[2px] font-data-mono text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">
                          Private
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center rounded px-[8px] py-[2px] font-data-mono text-[10px] font-semibold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-950/80 text-red-300 border border-red-700/60"
                            : "bg-cyan-950/40 text-cyan-400 border border-cyan-800/40"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h3
                      className={`font-sans text-[16px] font-semibold ${
                        isCancelled ? "text-gray-300 line-through" : "text-white"
                      }`}
                    >
                      {c.title}
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="font-data-mono text-xs text-cyan-300">
                      {formatIndiaTime(c.starts_at)}
                    </p>
                    <p className="font-data-mono text-[11px] text-on-surface-variant">
                      Duration: {c.duration_minutes} mins
                    </p>
                  </div>
                </div>

                <p className="mt-[10px] text-xs leading-relaxed text-on-surface-variant sm:text-sm">
                  {c.description}
                </p>

                {isCancelled && c.cancel_reason && (
                  <div className="mt-[12px] rounded border border-red-900/50 bg-red-950/20 p-[10px]">
                    <p className="font-data-mono text-[11px] font-semibold uppercase text-red-400">
                      Cancellation Reason
                    </p>
                    <p className="mt-[2px] text-xs text-red-200">{c.cancel_reason}</p>
                  </div>
                )}

                <div className="mt-[14px] flex flex-wrap items-center justify-between gap-[12px] border-t border-white/5 pt-[12px] text-xs">
                  <div>
                    {c.type === "Online" && c.meeting_url && (
                      <div className="flex items-center gap-[6px]">
                        <span className="font-data-mono text-[11px] text-on-surface-variant">
                          Link:
                        </span>
                        {isCancelled ? (
                          <span className="font-data-mono text-gray-500 break-all">
                            {c.meeting_url}
                          </span>
                        ) : (
                          <a
                            href={c.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-data-mono text-cyan-400 underline hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 break-all"
                          >
                            {c.meeting_url}
                          </a>
                        )}
                      </div>
                    )}

                    {c.type === "Venue" && c.venue_address && (
                      <div className="flex items-start gap-[6px]">
                        <span className="font-data-mono text-[11px] text-on-surface-variant">
                          Address:
                        </span>
                        <span className="text-white break-words">{c.venue_address}</span>
                      </div>
                    )}
                  </div>

                  {c.max_attendees != null && (
                    <div className="font-data-mono text-[11px] text-on-surface-variant">
                      Capacity:{" "}
                      <span className="font-semibold text-white">
                        {c.max_attendees.toLocaleString("en-IN")}
                      </span>{" "}
                      attendees
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
