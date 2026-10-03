"use client";

import { useEffect, useState } from "react";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { deleteDocument, DocumentUploadPayload, getDocuments, PlanningDocument, uploadDocument } from "@/services/documents";
import { getProjects, Project } from "@/services/projects";

const editorRoles = ["Urban Planner", "Government Official", "Administrator"];

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PlanningDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const canUpload = user ? editorRoles.includes(user.role) : false;

  async function loadDocuments() {
    try {
      setError("");
      setDocuments(await getDocuments());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load documents.");
    }
  }

  useEffect(() => {
    void loadDocuments();
    getProjects().then(setProjects).catch(() => undefined);
  }, []);

  async function submit(payload: DocumentUploadPayload) {
    const document = await uploadDocument(payload);
    setDocuments((current) => [document, ...current]);
  }

  async function remove(id: number) {
    try {
      await deleteDocument(id);
      setDocuments((current) => current.filter((document) => document.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete document.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar user={user} />
      <main className="flex-1 px-[24px] py-[32px]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-[16px]">
            <div>
              <p className="font-label-caps text-label-caps tracking-widest text-primary">
                PUBLIC INFORMATION
              </p>
              <h1 className="mt-[8px] font-display-md text-display-md">
                Planning Documents
              </h1>
              <p className="mt-[8px] text-sm text-on-surface-variant">
                Access current planning materials and public notices.
              </p>
            </div>
          </div>
          {canUpload && (
            <div className="mt-[24px]">
              <DocumentUploadForm projects={projects} onSubmit={submit} />
            </div>
          )}
          {error && <p className="mt-[24px] text-danger">{error}</p>}
          <section className="mt-[32px]">
            <h2 className="font-display-md text-[26px]">Available documents</h2>
            <div className="mt-[16px] grid gap-[16px] md:grid-cols-2">
              {documents.map((document) => (
                <DocumentCard
                  canDelete={Boolean(
                    user && (user.role === "Administrator" || user.id === document.uploaded_by)
                  )}
                  document={document}
                  key={document.id}
                  onDelete={remove}
                />
              ))}
              {!error && !documents.length && (
                <p className="font-data-mono text-sm text-on-surface-variant">
                  NO PLANNING DOCUMENTS ARE AVAILABLE.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
