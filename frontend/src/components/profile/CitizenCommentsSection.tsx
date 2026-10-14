"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  UserComment,
  deleteComment,
  getMyComments,
} from "@/services/profile";

const PAGE_SIZE = 10;

type CitizenCommentsSectionProps = {
  onCommentCountChanged?: (newCount: number) => void;
};

export function CitizenCommentsSection({
  onCommentCountChanged,
}: CitizenCommentsSectionProps) {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirm state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isActionInFlightRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getMyComments(PAGE_SIZE, 0);
        if (!isMounted) return;
        setComments(data.items);
        setTotal(data.total);
        setOffset(data.items.length);
        onCommentCountChanged?.(data.total);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load comments.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [onCommentCountChanged]);

  async function handleLoadMore() {
    if (isActionInFlightRef.current || isLoadingMore || offset >= total) return;
    isActionInFlightRef.current = true;
    setIsLoadingMore(true);

    try {
      const data = await getMyComments(PAGE_SIZE, offset);
      setComments((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setOffset((prev) => prev + data.items.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load more comments.");
    } finally {
      setIsLoadingMore(false);
      isActionInFlightRef.current = false;
    }
  }

  async function handleConfirmDelete(commentId: number) {
    if (isActionInFlightRef.current || isDeleting) return;
    isActionInFlightRef.current = true;
    setIsDeleting(true);

    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => {
        const next = Math.max(0, prev - 1);
        onCommentCountChanged?.(next);
        return next;
      });
      setDeleteTargetId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete comment.");
    } finally {
      setIsDeleting(false);
      isActionInFlightRef.current = false;
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-[20px] sm:p-[28px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col gap-[20px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-[14px]">
        <div>
          <h2 className="font-display-md text-[18px] font-semibold text-on-surface">
            My Comments {total > 0 ? `(${total})` : "0"}
          </h2>
          <p className="mt-[2px] font-body-md text-[12px] text-on-surface-variant">
            Feedback and observations submitted across public development projects.
          </p>
        </div>
        <span className="font-data-mono text-[12px] font-semibold text-primary-container">
          Comments {total}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-[8px] rounded-lg border border-danger/40 bg-danger/10 px-[14px] py-[10px] text-[13px] text-danger"
        >
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-[48px]">
          <span
            className="h-[28px] w-[28px] animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[48px] text-center">
          <span
            className="material-symbols-outlined text-[40px] text-on-surface-variant/40"
            aria-hidden="true"
          >
            chat_bubble_outline
          </span>
          <p className="mt-[10px] font-body-md text-[14px] text-on-surface-variant">
            You have not posted any comments yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[14px]">
          {comments.map((comment) => {
            const isTargeted = deleteTargetId === comment.id;
            return (
              <div
                key={comment.id}
                className="flex flex-col justify-between gap-[12px] rounded-xl border border-white/10 bg-white/[0.02] p-[16px] transition-all hover:border-white/20 sm:flex-row sm:items-start"
              >
                <div className="flex flex-col gap-[8px] min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <Link
                      href={`/?project=${comment.project_id}`}
                      className="truncate font-display-md text-[14px] font-semibold text-on-surface hover:text-primary transition-colors"
                    >
                      {comment.project_title}
                    </Link>

                    {comment.stance && (
                      <span
                        className={`rounded px-[8px] py-[1px] font-data-mono text-[10px] uppercase tracking-wider font-semibold ${
                          comment.stance === "Support"
                            ? "bg-success/15 text-success border border-success/30"
                            : comment.stance === "Concern"
                              ? "bg-danger/15 text-danger border border-danger/30"
                              : "bg-white/10 text-on-surface-variant border border-white/20"
                        }`}
                      >
                        {comment.stance}
                      </span>
                    )}

                    <span className="font-data-mono text-[11px] text-on-surface-variant/70">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-body-md text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>

                {/* Delete button with confirm pattern */}
                {comment.can_delete && (
                  <div className="shrink-0 flex items-center pt-[2px]">
                    {isTargeted ? (
                      <div className="flex items-center gap-[6px] rounded-lg border border-danger/40 bg-danger/10 p-[4px]">
                        <span className="px-[6px] font-body-md text-[11px] text-danger">
                          Delete comment?
                        </span>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => void handleConfirmDelete(comment.id)}
                          className="rounded bg-danger px-[8px] py-[3px] font-body-md text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {isDeleting ? "..." : "Delete"}
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setDeleteTargetId(null)}
                          className="rounded border border-white/20 px-[8px] py-[3px] font-body-md text-[11px] text-on-surface transition-colors hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setDeleteTargetId(comment.id)}
                        className="inline-flex h-[32px] items-center gap-[4px] rounded-lg border border-white/10 bg-white/5 px-[10px] font-body-md text-[12px] text-on-surface-variant hover:border-danger/40 hover:bg-danger/10 hover:text-danger transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          delete
                        </span>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {offset < total && (
            <div className="flex justify-center pt-[10px]">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => void handleLoadMore()}
                className="inline-flex h-[38px] items-center gap-[8px] rounded-lg border border-white/15 bg-white/5 px-[20px] font-body-md text-[13px] text-on-surface transition-colors hover:border-primary-container/50 hover:bg-white/10 disabled:opacity-50"
              >
                {isLoadingMore && (
                  <span
                    className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-primary border-t-transparent"
                    aria-hidden="true"
                  />
                )}
                <span>{isLoadingMore ? "Loading..." : "Load more"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
