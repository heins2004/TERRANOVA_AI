"use client";

import { GovProject } from "@/services/gov";
import { GovConsultationsManager } from "./GovConsultationsManager";

interface GovConsultationsTabSectionProps {
  project: GovProject;
}

export function GovConsultationsTabSection({ project }: GovConsultationsTabSectionProps) {
  const isDeployed = ["OpenForResponse", "InProgress", "Completed", "Halted"].includes(project.stage);

  return (
    <div className="space-y-[16px]">
      <h2 className="font-sans text-[18px] font-semibold text-white tracking-wide">
        Consultations
      </h2>
      {isDeployed && <GovConsultationsManager project={project} />}
    </div>
  );
}
