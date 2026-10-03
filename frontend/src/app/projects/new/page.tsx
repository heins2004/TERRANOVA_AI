"use client";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { createProject } from "@/services/projects";

export default function NewProjectPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <TopBar />
      <main className="flex-1 px-[24px] py-[32px]">
        <div className="mx-auto max-w-3xl">
          <p className="mb-[20px] font-label-caps text-label-caps tracking-widest text-primary">
            NEW PLANNING INITIATIVE
          </p>
          <ProjectForm
            onSubmit={async (payload) => {
              const project = await createProject(payload);
              router.replace(`/projects/${project.id}`);
            }}
          />
        </div>
      </main>
    </div>
  );
}
