"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GovProject } from "@/services/gov";
import {
  ProjectConsultation,
  getProjectConsultations,
} from "@/services/projectConsultations";
import {
  GovConsultationFormModal,
  GovConsultationCancelModal,
} from "./GovConsultationModal";

interface Props {
  project: GovProject;
}

export function GovConsultationsManager({ project }: Props) {
  const isEditable = project.stage === "OpenForResponse" || project.stage === "InProgress";
  const [consultations, setConsultations] = useState<ProjectConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectConsultation | null>(null);
  const [cancellingItem, setCancellingItem] = useState<ProjectConsultation | null>(null);

  const refreshConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjectConsultations(project.id);
      setConsultations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load consultations");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    let isCancelled = false;
    getProjectConsultations(project.id)
      .then((data) => {
        if (!isCancelled) setConsultations(data);
      })
      .catch((err) => {
        if (!isCancelled) setError(err instanceof Error ? err.message : "Failed to load consultations");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [project.id]);

  function handleSuccess(msg: string) {
    setSuccessMsg(msg);
    setIsFormOpen(false);
    setEditingItem(null);
    setCancellingItem(null);
    void refreshConsultations();
  }

  return (
    <section className="space-y-[16px] rounded-[12px] border border-white/10 bg-surface-container-lowest/70 p-[20px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-white/10 pb-[12px]">
        <div>
          <h3 className="font-sans text-[18px] font-semibold text-white tracking-wide">
            Consultations Manager
          </h3>
          <p className="font-data-mono text-xs text-on-surface-variant">
            {isEditable
              ? "Create and manage official public or private consultations."
              : "Read-only: stage is not Open for Response or In Progress."}
          </p>
        </div>
        {isEditable && (
          <button
            type="button"
            id="gov-create-consultation-btn"
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="rounded-[6px] bg-cyan-600 px-[14px] py-[6px] font-sans text-xs font-semibold text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            + New Consultation
          </button>
        )}
      </div>

      {successMsg && (
        <div className="rounded border border-cyan-700/60 bg-cyan-950/40 p-[10px] text-xs text-cyan-300 font-data-mono">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-700/60 bg-red-950/40 p-[10px] text-xs text-red-300 font-data-mono">
          {error}
        </div>
      )}

      {/* Consultations List */}
      {loading ? (
        <p className="font-data-mono text-xs text-on-surface-variant py-[16px]">
          LOADING CONSULTATIONS...
        </p>
      ) : consultations.length === 0 ? (
        <p className="text-xs text-on-surface-variant py-[12px]">
          No consultations scheduled yet.
        </p>
      ) : (
        <div className="space-y-[12px]">
          {consultations.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-[12px] rounded border border-white/10 bg-surface-container-lowest/50 p-[14px]"
            >
              <div>
                <div className="flex items-center gap-[8px]">
                  <span className="rounded bg-cyan-950/80 px-[6px] py-[2px] font-data-mono text-[10px] text-cyan-300 border border-cyan-700/50 uppercase">
                    {c.type}
                  </span>
                  <span className="rounded bg-blue-950/80 px-[6px] py-[2px] font-data-mono text-[10px] text-blue-300 border border-blue-700/50 uppercase">
                    {c.visibility}
                  </span>
                  <span
                    className={`rounded px-[6px] py-[2px] font-data-mono text-[10px] uppercase border ${
                      c.status === "Cancelled"
                        ? "bg-red-950/80 text-red-300 border-red-700/60"
                        : "bg-cyan-950/40 text-cyan-400 border-cyan-800/40"
                    }`}
                  >
                    {c.status}
                  </span>
                  <h4 className="font-sans text-sm font-semibold text-white">{c.title}</h4>
                </div>
                <p className="mt-[4px] font-data-mono text-[11px] text-on-surface-variant">
                  {new Date(c.starts_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST •{" "}
                  {c.duration_minutes} mins
                  {c.visibility === "Private" &&
                    c.invited_emails &&
                    ` • ${c.invited_emails.length} citizen(s) invited`}
                </p>
                {c.status === "Cancelled" && c.cancel_reason && (
                  <p className="mt-[2px] text-xs text-red-400">Reason: {c.cancel_reason}</p>
                )}
              </div>
              {isEditable && c.status === "Scheduled" && (
                <div className="flex items-center gap-[8px]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(c);
                      setIsFormOpen(true);
                    }}
                    className="rounded border border-cyan-700/50 px-[10px] py-[4px] font-sans text-xs text-cyan-300 hover:bg-cyan-950/60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancellingItem(c)}
                    className="rounded border border-red-700/50 px-[10px] py-[4px] font-sans text-xs text-red-300 hover:bg-red-950/60"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <GovConsultationFormModal
          projectId={project.id}
          consultation={editingItem}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Cancel Modal */}
      {cancellingItem && (
        <GovConsultationCancelModal
          projectId={project.id}
          consultation={cancellingItem}
          onClose={() => setCancellingItem(null)}
          onSuccess={handleSuccess}
        />
      )}
    </section>
  );
}
