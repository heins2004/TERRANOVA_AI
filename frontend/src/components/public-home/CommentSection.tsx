"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicComment, PublicProject, getProject } from "@/services/publicProjects";
import { postComment } from "@/services/comments";
import { cleanCommentBody, parseCommentError } from "./commentUtils";
import { CommentItem } from "./CommentItem";
import { CommentComposer } from "./CommentComposer";

type CommentSectionProps = {
  projectId: number;
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
  setPostedCommentId: (id: number | null) => void;
  setLiveMessage: (msg: string) => void;
  setIsClosedLocally: (closed: boolean) => void;
  onProjectUpdated?: (updatedProject: PublicProject) => void;
};

export function CommentSection({
  projectId,
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
}: CommentSectionProps) {
  const router = useRouter();

  // Reply state
  const [activeReplyTarget, setActiveReplyTarget] = useState<{
    rootId: number;
    clickedId: number;
    authorName: string;
  } | null>(null);
  const [replyBody, setReplyBody] = useState<string>("");
  const [replyBodyError, setReplyBodyError] = useState<string | null>(null);
  const [replyFormError, setReplyFormError] = useState<string | null>(null);
  const [isPostingReply, setIsPostingReply] = useState<boolean>(false);
  const isPostingReplyRef = useRef<boolean>(false);

  const handleReplyTargetSelect = (target: { rootId: number; clickedId: number; authorName: string } | null) => {
    setActiveReplyTarget(target);
    setReplyBody("");
    setReplyBodyError(null);
    setReplyFormError(null);
  };

  // Handle post reply
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyTarget) return;
    if (isPostingReplyRef.current) return;

    setReplyBodyError(null);
    setReplyFormError(null);

    const cleaned = cleanCommentBody(replyBody);
    if (cleaned.length < 3) {
      setReplyBodyError("Comment must be at least 3 characters.");
      return;
    } else if (cleaned.length > 500) {
      setReplyBodyError("Comment cannot exceed 500 characters.");
      return;
    }

    isPostingReplyRef.current = true;
    setIsPostingReply(true);
    try {
      const created = await postComment(projectId, {
        body: cleaned,
        parent_id: activeReplyTarget.clickedId,
      });

      setReplyBody("");
      const targetRootId = activeReplyTarget.rootId;
      setActiveReplyTarget(null);

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === targetRootId || c.id === created.parent_id) {
            const existingReplies = c.replies || [];
            return {
              ...c,
              replies: [
                ...existingReplies,
                {
                  id: created.id,
                  author_name: created.author_name,
                  badge: created.badge,
                  stance: created.stance,
                  body: created.body,
                  created_at: created.created_at,
                  parent_id: created.parent_id,
                },
              ],
            };
          }
          return c;
        })
      );

      setPostedCommentId(created.id);
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
      setReplyFormError(parsed.message);
    } finally {
      setIsPostingReply(false);
      isPostingReplyRef.current = false;
    }
  };

  const handleCommentDeleted = async (deletedId: number) => {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== deletedId)
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== deletedId),
        }))
    );
    setLiveMessage("Comment deleted.");
    try {
      const fresh = await getProject(projectId);
      onProjectUpdated?.(fresh);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-[14px] border border-white/10 bg-white/5 p-[16px]">
      <h4 className="font-body-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-[12px]">
        Public Comments
      </h4>

      {liveMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-[12px] rounded-lg border border-primary-container/40 bg-primary-container/10 px-[12px] py-[8px] font-body-md text-[13px] text-primary-container"
        >
          {liveMessage}
        </div>
      )}

      {/* Comment Form at the top: Guest vs Logged In (Open vs Closed) */}
      <div className="mb-[20px] pb-[16px] border-b border-white/10">
        {!user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[12px]">
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Sign in to join the discussion and share your stance.
            </p>
            <Link
              href="/login"
              className="rounded-full bg-primary-container px-[20px] py-[8px] font-body-md text-[13px] font-semibold text-on-primary hover:opacity-90 transition-all cursor-pointer inline-flex items-center"
            >
              Log in to comment
            </Link>
          </div>
        ) : !isOpen ? (
          <div>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Comments are closed for this project.
            </p>
          </div>
        ) : (
          <CommentComposer
            projectId={projectId}
            onCommentPosted={(created) => {
              setComments((prev) => [created, ...prev]);
              setPostedCommentId(created.id);
            }}
            onProjectUpdated={onProjectUpdated}
            setIsClosedLocally={setIsClosedLocally}
            setLiveMessage={setLiveMessage}
          />
        )}
      </div>

      <div className="flex flex-col gap-[14px]">
        {comments.length === 0 && !isLoadingComments && (
          <p className="font-body-md text-[13px] text-on-surface-variant">
            No comments recorded yet.
          </p>
        )}

        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            postedCommentId={postedCommentId}
            newCommentRef={newCommentRef}
            allowReply={Boolean(user && (isOpen || isGovOfficial))}
            activeReplyTarget={activeReplyTarget}
            onReplyTargetSelect={handleReplyTargetSelect}
            replyBody={replyBody}
            onReplyBodyChange={(val) => {
              setReplyBody(val);
              setReplyBodyError(null);
              setReplyFormError(null);
            }}
            replyBodyError={replyBodyError}
            replyFormError={replyFormError}
            isPostingReply={isPostingReply}
            onPostReply={handlePostReply}
            onCommentDeleted={handleCommentDeleted}
          />
        ))}
      </div>

      {/* Load more comments */}
      {hasMoreComments && comments.length > 0 && (
        <div className="mt-[16px] pt-[8px] text-center border-t border-white/10">
          <button
            type="button"
            onClick={onLoadMoreComments}
            disabled={isLoadingComments}
            className="rounded-full border border-white/15 bg-white/5 px-[16px] py-[6px] font-body-md text-[12px] text-on-surface transition-colors hover:border-primary-container hover:text-primary-container disabled:opacity-50"
          >
            {isLoadingComments ? "Loading..." : "Load more comments"}
          </button>
        </div>
      )}
    </div>
  );
}
