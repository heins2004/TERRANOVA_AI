"use client";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { createProject } from "@/services/projects";
export default function NewProjectPage() { const router = useRouter(); return <main className="min-h-screen bg-surface-container-lowest px-[24px] py-[32px] text-on-surface"><div className="mx-auto max-w-3xl"><p className="mb-[20px] font-label-caps text-label-caps tracking-widest text-primary">NEW PLANNING INITIATIVE</p><ProjectForm onSubmit={async (payload) => { const project = await createProject(payload); router.replace(`/projects/${project.id}`); }} /></div></main>; }
