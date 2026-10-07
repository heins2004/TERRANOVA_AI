"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicComment, PublicProject, getProject } from "@/services/publicProjects";
import { postComment } from "@/services/comments";
import { cleanCommentBody, parseCommentError } from "./commentUtils";

type CommentComposerProps = {
  projectId: number;
  onCommentPosted: (comment: PublicComment) => void;
  onProjectUpdated?: (updatedProject: PublicProject) => void;
  setIsClosedLocally: (closed: boolean) => void;
  setLiveMessage: (msg: string) => void;
};

export function CommentComposer({
  projectId,
  onCommentPosted,
  onProjectUpdated,
  setIsClosedLocally,
  setLiveMessage,
}: CommentComposerProps) {
  const router = useRouter();

  const [topStance, setTopStance] = useState<"Support" | "Concern" | "Neutral" | null>(null);
  const [topBody, setTopBody] = useState<string>("");
  const [topStanceError, setTopStanceError] = useState<string | null>(null);
  const [topBodyError, setTopBodyError] = useState<string | null>(null);
  const [topFormError, setTopFormError] = useState<string | null>(null);
  const [isPostingTop, setIsPostingTop] = useState<boolean>(false);
  const isPostingTopRef = useRef<boolean>(false);

  const handlePostTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostingTopRef.current) return;
    setTopStanceError(null);
    setTopBodyError(null);
    setTopFormError(null);

    let hasClientError = false;

    if (!topStance) {
      setTopStanceError("Please select a stance.");
      hasClientError = true;
    }

    const cleaned = cleanCommentBody(topBody);
    if (cleaned.length < 3) {
      setTopBodyError("Comment must be at least 3 characters.");
      hasClientError = true;
    } else if (cleaned.length > 500) {
      setTopBodyError("Comment cannot exceed 500 characters.");
      hasClientError = true;
    }

    if (hasClientError) {
      return;
    }

    isPostingTopRef.current = true;
    setIsPostingTop(true);
    try {
      const created = await postComment(projectId, {
        body: cleaned,
        stance: topStance,
      });

      setTopBody("");
      setTopStance(null);
      onCommentPosted(created);
      setLiveMessage("Comment posted.");

      try {
        const fresh = await getProject(projectId);
        onProjectUpdated?.(fresh);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const parsed = parseCommentError(err);
      if (parsed.is401) {
        router.push("/login");
        return;
      }
      if (parsed.is409Closed) {
        setIsClosedLocally(true);
      }
      setTopFormError(parsed.message);
    } finally {
      setIsPostingTop(false);
      isPostingTopRef.current = false;
    }
  };

  return (
    <form onSubmit={handlePostTopComment} className="flex flex-col gap-[14px]">
      <fieldset className="flex flex-col gap-[6px]">
        <legend className="font-body-md text-[13px] font-semibold text-on-surface">
          Your stance
        </legend>
        <div className="flex items-center gap-[16px] mt-[2px]">
          {(["Support", "Concern", "Neutral"] as const).map((s, idx, arr) => (
            <label
              key={s}
              className="flex items-center gap-[6px] cursor-pointer font-body-md text-[13px] text-on-surface"
            >
              <input
                type="radio"
                name="top-stance"
                value={s}
                checked={topStance === s}
                onChange={() => {
                  setTopStance(s);
                  setTopStanceError(null);
                  setTopFormError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    const cur = topStance ? arr.indexOf(topStance) : -1;
                    const nxt = (cur + 1) % arr.length;
                    setTopStance(arr[nxt]);
                    setTopStanceError(null);
                    setTopFormError(null);
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const cur = topStance ? arr.indexOf(topStance) : 0;
                    const prv = (cur - 1 + arr.length) % arr.length;
                    setTopStance(arr[prv]);
                    setTopStanceError(null);
                    setTopFormError(null);
                  } else if (e.key === " ") {
                    setTopStance(s);
                    setTopStanceError(null);
                    setTopFormError(null);
                  }
                }}
                className="text-primary-container focus:ring-primary-container"
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
        <p className="font-body-md text-[11px] text-on-surface-variant mt-[2px]">
          Your latest stance counts once.
        </p>
        {topStanceError && (
          <p role="alert" className="font-body-md text-[12px] text-danger mt-[2px]">
            {topStanceError}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between">
          <label
            htmlFor="top-comment-body"
            className="font-body-md text-[13px] font-semibold text-on-surface"
          >
            Your comment
          </label>
          <span className="font-data-mono text-[11px] text-on-surface-variant">
            {topBody.length}/500
          </span>
        </div>
        <textarea
          id="top-comment-body"
          rows={3}
          value={topBody}
          onChange={(e) => {
            setTopBody(e.target.value);
            setTopBodyError(null);
            setTopFormError(null);
          }}
          placeholder="Share your perspective on this project..."
          className="w-full rounded-[12px] border border-white/15 bg-white/5 p-[12px] font-body-md text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container focus:outline-none resize-none"
        />
        {topBodyError && (
          <p role="alert" className="font-body-md text-[12px] text-danger">
            {topBodyError}
          </p>
        )}
      </div>

      <div className="flex items-center gap-[12px] flex-wrap">
        <button
          type="submit"
          disabled={isPostingTop}
          className="rounded-full bg-primary-container px-[20px] py-[8px] font-body-md text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {isPostingTop ? "Posting..." : "Post comment"}
        </button>
        {topFormError && (
          <div role="alert" className="font-body-md text-[13px] text-danger">
            {topFormError}
          </div>
        )}
      </div>
    </form>
  );
}
