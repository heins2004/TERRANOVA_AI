"use client";

import React from "react";
import { PublicComment, PublicProject } from "@/services/publicProjects";
import { StageTracker } from "./StageTracker";
import { ProjectDetails } from "./ProjectDetails";
import { ProjectConsultationsSection } from "./ProjectConsultationsSection";
import { CommentSection } from "./CommentSection";

type ProjectPanelBodyProps = {
  detail: PublicProject;
  user: unknown;
  isOpen: boolean;
  isGovOfficial: boolean;
  comments: PublicComment[];
  isLoadingComments: boolean;
  hasMoreComments: boolean;
  onLoadMoreComments: () => void;
  postedCommentId: number | null;
  newCommentRef: React.RefObject<HTMLDivElement | null>;
  liveMessage: string;
  setComments: React.Dispatch<React.SetStateAction<PublicComment[]>>;
  setPostedCommentId: React.Dispatch<React.SetStateAction<number | null>>;
  setLiveMessage: React.Dispatch<React.SetStateAction<string>>;
  setIsClosedLocally: React.Dispatch<React.SetStateAction<boolean>>;
  onProjectUpdated?: (updatedProject: PublicProject) => void;
};

export function ProjectPanelBody({
  detail,
  user,
  isOpen,
  isGovOfficial,
  comments,
  isLoadingComments,
  hasMoreComments,
  onLoadMoreComments,
  postedCommentId,
  newCommentRef,
  liveMessage,
  setComments,
  setPostedCommentId,
  setLiveMessage,
  setIsClosedLocally,
  onProjectUpdated,
}: ProjectPanelBodyProps) {
  return (
    <div className="flex-1 min-h-0 mt-[16px] overflow-y-auto md:overflow-hidden md:flex md:flex-row md:gap-[24px] no-scrollbar">
      {/* LEFT (details): stays in place and does not scroll when content fits; fallback overflow-y-auto */}
      <div className="flex flex-col gap-[10px] md:flex-1 md:min-w-0 md:h-full md:overflow-y-auto no-scrollbar">
        <StageTracker
          stage={detail.stage}
          haltReason={detail.halt_reason ?? undefined}
          daysLeft={detail.days_left}
        />
        <ProjectDetails detail={detail} />
        <ProjectConsultationsSection projectId={detail.id} />
      </div>

      {/* RIGHT (comments): normal scroller, inside its own box */}
      <div className="mt-[20px] md:mt-0 flex flex-col md:flex-1 md:min-w-0 md:h-full md:overflow-y-auto no-scrollbar rounded-[14px] border border-white/10 bg-white/[0.02] p-[12px] sm:p-[16px]">
        <CommentSection
          projectId={detail.id}
          user={user}
          isOpen={isOpen}
          isGovOfficial={isGovOfficial}
          comments={comments}
          isLoadingComments={isLoadingComments}
          hasMoreComments={hasMoreComments}
          onLoadMoreComments={onLoadMoreComments}
          postedCommentId={postedCommentId}
          newCommentRef={newCommentRef}
          liveMessage={liveMessage}
          setComments={setComments}
          setPostedCommentId={setPostedCommentId}
          setLiveMessage={setLiveMessage}
          setIsClosedLocally={setIsClosedLocally}
          onProjectUpdated={onProjectUpdated}
        />
      </div>
    </div>
  );
}
