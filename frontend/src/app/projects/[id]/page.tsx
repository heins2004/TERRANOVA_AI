"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ComplaintForm } from "@/components/citizen/ComplaintForm";
import { FeedbackForm } from "@/components/consultations/FeedbackForm";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { useAuth } from "@/components/layout/auth-provider";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { StatusBadge } from "@/components/projects/StatusBadge";
import { Complaint, createComplaint, getComplaints } from "@/services/complaints";
import { Consultation, createFeedback, getConsultations } from "@/services/consultations";
import {
  getDocumentDownloadUrl,
  getDocuments,
  PlanningDocument,
  uploadDocument,
} from "@/services/documents";
import { getProject, Project, updateProject } from "@/services/projects";

const editorRoles = ["Urban Planner", "Government Official", "Administrator"];

type RelatedState<T> = {
  records: T[];
  loading: boolean;
  unauthorized: boolean;
  error: string;
};

const initialRelated = <T,>(): RelatedState<T> => ({
  records: [],
  loading: true,
  unauthorized: false,
  error: "",
});

type TabKey = "complaints" | "consultations" | "documents";

const TAB_LABELS: Record<TabKey, string> = {
  complaints: "Complaints",
  consultations: "Consultations",
  documents: "Documents",
};

function LoginPrompt({ label }: { label: string }) {
  return (
    <p className="text-sm text-on-surface-variant">
      Log in to view {label} related to this project.{" "}
      <Link className="text-primary" href="/login">
        LOG IN
      </Link>
    </p>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isReady } = useAuth();
  const id = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("complaints");

  const [complaints, setComplaints] = useState<RelatedState<Complaint>>(initialRelated);
  const [consultations, setConsultations] = useState<RelatedState<Consultation>>(initialRelated);
  const [documents, setDocuments] = useState<RelatedState<PlanningDocument>>(initialRelated);

  const canEdit = Boolean(user && editorRoles.includes(user.role));

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError("Invalid project record.");
      return;
    }
    getProject(id)
      .then(setProject)
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Unable to load project."),
      );
  }, [id]);

  useEffect(() => {
    if (!project || !isReady) return;

    if (!user) {
      const prompt = { records: [], loading: false, unauthorized: true, error: "" };
      setComplaints(prompt);
      setConsultations(prompt);
      setDocuments(prompt);
      return;
    }

    function load<T>(request: () => Promise<T[]>, setter: (state: RelatedState<T>) => void) {
      request()
        .then((records) => setter({ records, loading: false, unauthorized: false, error: "" }))
        .catch((caught) => {
          const status = (caught as Error & { status?: number }).status;
          setter({
            records: [],
            loading: false,
            unauthorized: status === 401,
            error: status === 401 ? "" : caught instanceof Error ? caught.message : "Unable to load related records.",
          });
        });
    }

    load(() => getComplaints({ project_id: project.id }), setComplaints);
    load(() => getConsultations({ project_id: project.id }), setConsultations);
    load(() => getDocuments({ project_id: project.id }), setDocuments);
  }, [isReady, project, user]);

  if (error) {
    return (
      <main className="min-h-screen bg-surface-container-lowest p-[32px] text-danger">
        {error}
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-surface-container-lowest p-[32px] font-data-mono text-on-surface-variant">
        LOADING PROJECT RECORD...
      </main>
    );
  }

  const tabCounts: Record<TabKey, number> = {
    complaints: complaints.records.length,
    consultations: consultations.records.length,
    documents: documents.records.length,
  };

  return (
    <main className="min-h-screen bg-surface-container-lowest px-[24px] py-[32px] text-on-surface">
      <div className="mx-auto max-w-5xl">
        <Link className="font-data-mono text-[11px] text-primary" href="/projects">
          &larr; ALL PROJECTS
        </Link>

        <article className="glass-card mt-[20px] rounded-xl p-[28px]">
          <div className="flex flex-wrap items-start justify-between gap-[16px]">
            <div>
              <p className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                {project.category ?? "General planning"}
              </p>
              <h1 className="mt-[8px] font-display-md text-display-md">{project.title}</h1>
            </div>
            <StatusBadge status={project.status} />
          </div>

          <p className="mt-[20px] max-w-3xl leading-7 text-on-surface-variant">
            {project.description ?? "No description recorded."}
          </p>

          <div className="mt-[24px] grid gap-[12px] border-t border-white/10 pt-[20px] font-data-mono text-[11px] text-on-surface-variant sm:grid-cols-2">
            <span>CITY: {project.city ?? "Not assigned"}</span>
            <span>BUDGET: {project.budget ?? "Pending"}</span>
            <span>
              DATES: {project.start_date ?? "TBD"} &mdash; {project.end_date ?? "TBD"}
            </span>
            <span>UPDATED: {new Date(project.updated_at).toLocaleDateString()}</span>
          </div>

          {canEdit && (
            <button
              className="mt-[24px] border border-primary-container/60 px-[14px] py-[10px] font-data-mono text-[11px] text-primary"
              onClick={() => setEditing((current) => !current)}
              type="button"
            >
              {editing ? "CLOSE EDITOR" : "EDIT PROJECT"}
            </button>
          )}
        </article>

        {editing && (
          <div className="mt-[20px]">
            <ProjectForm
              initial={project}
              onSubmit={async (payload) => {
                const updated = await updateProject(project.id, payload);
                setProject(updated);
                setEditing(false);
                router.refresh();
              }}
            />
          </div>
        )}

        {/* Tab selector */}
        <div className="mt-[24px] flex flex-wrap gap-[8px] rounded-xl border border-white/10 bg-surface-bright/10 p-[6px]">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={
                activeTab === key
                  ? "flex-1 rounded-lg bg-primary-container/15 border border-primary-container/60 px-[16px] py-[10px] font-data-mono text-[11px] uppercase tracking-wider text-primary"
                  : "flex-1 rounded-lg border border-transparent px-[16px] py-[10px] font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant hover:border-white/10"
              }
            >
              {TAB_LABELS[key]} ({tabCounts[key]})
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div className="mt-[20px]">
          {activeTab === "complaints" && (
            <RelatedSection title="Complaints" state={complaints} unauthenticatedLabel="complaints">
              {complaints.records.map((complaint) => (
                <article className="glass-card rounded-xl p-[16px]" key={complaint.id}>
                  <div className="flex flex-wrap items-start justify-between gap-[12px]">
                    <h3 className="font-semibold text-on-surface">{complaint.subject}</h3>
                    <span className="font-data-mono text-[11px] text-primary">{complaint.status}</span>
                  </div>
                  <p className="mt-[8px] text-sm text-on-surface-variant">{complaint.description}</p>
                </article>
              ))}
              {user && (
                <ComplaintForm
                  initialProjectId={project.id}
                  projects={[project]}
                  onSubmit={async (payload) => {
                    const created = await createComplaint(payload);
                    setComplaints((current) => ({ ...current, records: [created, ...current.records] }));
                  }}
                />
              )}
            </RelatedSection>
          )}

          {activeTab === "consultations" && (
            <RelatedSection title="Consultations" state={consultations} unauthenticatedLabel="consultations">
              {consultations.records.map((consultation) => (
                <article className="glass-card rounded-xl p-[16px]" key={consultation.id}>
                  <div className="flex flex-wrap items-start justify-between gap-[12px]">
                    <div>
                      <h3 className="font-semibold text-on-surface">{consultation.title}</h3>
                      <p className="mt-[4px] font-data-mono text-[11px] text-on-surface-variant">
                        {new Date(consultation.scheduled_at).toLocaleString()} &middot;{" "}
                        {consultation.location ?? "Location to be confirmed"}
                      </p>
                    </div>
                    <span className="font-data-mono text-[11px] text-primary">{consultation.status}</span>
                  </div>
                  {user && (
                    <div className="mt-[16px]">
                      <FeedbackForm onSubmit={(comment) => createFeedback(consultation.id, comment)} />
                    </div>
                  )}
                </article>
              ))}
            </RelatedSection>
          )}

          {activeTab === "documents" && (
            <RelatedSection title="Documents" state={documents} unauthenticatedLabel="documents">
              {documents.records.map((document) => (
                <article
                  className="glass-card flex flex-wrap items-center justify-between gap-[16px] rounded-xl p-[16px]"
                  key={document.id}
                >
                  <div>
                    <h3 className="font-semibold text-on-surface">{document.title}</h3>
                    <p className="mt-[4px] text-sm text-on-surface-variant">
                      {document.original_filename} &middot; Uploaded by {document.uploaded_by_name}
                    </p>
                  </div>
                  <a
                    className="border border-primary-container/60 px-[14px] py-[10px] font-data-mono text-[11px] text-primary"
                    href={getDocumentDownloadUrl(document.id)}
                  >
                    DOWNLOAD
                  </a>
                </article>
              ))}
              {canEdit && (
                <DocumentUploadForm
                  initialProjectId={project.id}
                  projects={[project]}
                  onSubmit={async (payload) => {
                    const created = await uploadDocument(payload);
                    setDocuments((current) => ({ ...current, records: [created, ...current.records] }));
                  }}
                />
              )}
            </RelatedSection>
          )}
        </div>
      </div>
    </main>
  );
}

function RelatedSection<T>({
  title,
  state,
  unauthenticatedLabel,
  children,
}: {
  title: string;
  state: RelatedState<T>;
  unauthenticatedLabel: string;
  children: React.ReactNode;
}) {
  return (
    <article className="glass-card rounded-xl p-[24px]">
      <h2 className="font-display-md text-[26px] text-on-surface">{title}</h2>
      <div className="mt-[16px] flex flex-col gap-[16px]">
        {state.loading ? (
          <p className="font-data-mono text-[12px] text-on-surface-variant">
            LOADING {title.toUpperCase()}...
          </p>
        ) : state.unauthorized ? (
          <LoginPrompt label={unauthenticatedLabel} />
        ) : state.error ? (
          <p className="text-danger">{state.error}</p>
        ) : state.records.length ? (
          children
        ) : (
          <p className="font-data-mono text-[12px] text-on-surface-variant">
            NO {title.toUpperCase()} ARE LINKED TO THIS PROJECT.
          </p>
        )}
        {!state.loading && !state.unauthorized && !state.error && !state.records.length ? children : null}
      </div>
    </article>
  );
}
