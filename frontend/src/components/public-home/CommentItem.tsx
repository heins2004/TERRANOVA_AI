"use client";

import React from "react";
import { PublicComment } from "@/services/publicProjects";

type ReplyTarget = {
  rootId: number;
  clickedId: number;
  authorName: string;
};

type CommentItemProps = {
  comment: PublicComment;
  postedCommentId: number | null;
  newCommentRef: React.RefObject<HTMLDivElement | null>;
  allowReply: boolean;
  activeReplyTarget: ReplyTarget | null;
  onReplyTargetSelect: (target: ReplyTarget | null) => void;
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  replyBodyError: string | null;
  replyFormError: string | null;
  isPostingReply: boolean;
  onPostReply: (e: React.FormEvent) => void;
};

export function CommentItem({
  comment,
  postedCommentId,
  newCommentRef,
  allowReply,
  activeReplyTarget,
  onReplyTargetSelect,
  replyBody,
  onReplyBodyChange,
  replyBodyError,
  replyFormError,
  isPostingReply,
  onPostReply,
}: CommentItemProps) {
  const isNewlyCreatedComment = comment.id === postedCommentId;

  return (
    <div
      data-comment-id={comment.id}
      ref={isNewlyCreatedComment ? newCommentRef : null}
      tabIndex={isNewlyCreatedComment ? -1 : undefined}
      className="pt-[10px] border-t border-white/10 first:border-t-0 first:pt-0 outline-none"
    >
      <div className="flex flex-wrap items-center gap-[8px]">
        <b className="font-body-md text-[14px] text-on-surface">
          {comment.author_name}
        </b>
        {comment.badge && (
          <span className="rounded-full border border-primary-container/60 bg-primary-container/15 px-[8px] py-[2px] font-data-mono text-[10px] uppercase tracking-wider text-primary-container">
            {comment.badge}
          </span>
        )}
        {comment.stance && (
          <span className="font-data-mono text-[11px] text-on-surface-variant">
            {comment.stance}
          </span>
        )}
      </div>

      <div className="mt-[4px] font-body-md text-[14px] text-on-surface/90 whitespace-pre-wrap break-words">
        {comment.body}
      </div>

      {/* Replies inside this thread */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-[8px] flex flex-col gap-[8px]">
          {comment.replies.map((reply) => {
            const isNewlyCreatedReply = reply.id === postedCommentId;
            return (
              <div
                key={reply.id}
                data-comment-id={reply.id}
                ref={isNewlyCreatedReply ? newCommentRef : null}
                tabIndex={isNewlyCreatedReply ? -1 : undefined}
                className="ml-[14px] pl-[12px] border-l-2 border-primary-container/80 outline-none"
              >
                <div className="flex flex-wrap items-center gap-[8px]">
                  <b className="font-body-md text-[13px] text-on-surface">
                    {reply.author_name}
                  </b>
                  {reply.badge && (
                    <span className="rounded-full border border-primary-container/60 bg-primary-container/15 px-[8px] py-[2px] font-data-mono text-[10px] uppercase tracking-wider text-primary-container">
                      {reply.badge}
                    </span>
                  )}
                  {reply.stance && (
                    <span className="font-data-mono text-[11px] text-on-surface-variant">
                      {reply.stance}
                    </span>
                  )}
                </div>
                <div className="mt-[4px] font-body-md text-[13px] text-on-surface/85 whitespace-pre-wrap break-words">
                  {reply.body}
                </div>

                {/* Reply button on a reply */}
                {allowReply && (
                  <div className="mt-[4px]">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeReplyTarget?.clickedId === reply.id) {
                          onReplyTargetSelect(null);
                        } else {
                          onReplyTargetSelect({
                            rootId: comment.id,
                            clickedId: reply.id,
                            authorName: reply.author_name,
                          });
                        }
                      }}
                      aria-label={`Reply to ${reply.author_name}`}
                      className="font-body-md text-[11px] text-primary-container hover:underline cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply button on top-level comment */}
      {allowReply && (
        <div className="mt-[8px]">
          <button
            type="button"
            onClick={() => {
              if (activeReplyTarget?.clickedId === comment.id) {
                onReplyTargetSelect(null);
              } else {
                onReplyTargetSelect({
                  rootId: comment.id,
                  clickedId: comment.id,
                  authorName: comment.author_name,
                });
              }
            }}
            aria-label={`Reply to ${comment.author_name}`}
            className="font-body-md text-[11px] text-primary-container hover:underline cursor-pointer"
          >
            Reply
          </button>
        </div>
      )}

      {/* Inline Reply Box under thread (only one open at a time) */}
      {activeReplyTarget?.rootId === comment.id && (
        <form
          onSubmit={onPostReply}
          className="mt-[12px] ml-[14px] p-[12px] rounded-[10px] border border-white/10 bg-white/5 flex flex-col gap-[8px]"
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor={`reply-box-${comment.id}`}
              className="font-body-md text-[12px] font-semibold text-on-surface"
            >
              Replying to {activeReplyTarget.authorName}
            </label>
            <span className="font-data-mono text-[11px] text-on-surface-variant">
              {replyBody.length}/500
            </span>
          </div>

          <textarea
            id={`reply-box-${comment.id}`}
            rows={2}
            value={replyBody}
            onChange={(e) => onReplyBodyChange(e.target.value)}
            placeholder="Write your reply..."
            className="w-full rounded-[8px] border border-white/15 bg-surface-container-lowest p-[8px] font-body-md text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary-container focus:outline-none resize-none"
          />

          {replyBodyError && (
            <p role="alert" className="font-body-md text-[12px] text-danger">
              {replyBodyError}
            </p>
          )}

          <div className="flex items-center gap-[10px] flex-wrap mt-[4px]">
            <button
              type="submit"
              disabled={isPostingReply}
              className="rounded-full bg-primary-container px-[16px] py-[5px] font-body-md text-[12px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isPostingReply ? "Posting..." : "Post reply"}
            </button>
            <button
              type="button"
              onClick={() => onReplyTargetSelect(null)}
              className="rounded-full border border-white/15 bg-white/5 px-[14px] py-[5px] font-body-md text-[12px] text-on-surface-variant hover:text-on-surface hover:border-white/30 cursor-pointer"
            >
              Cancel
            </button>
            {replyFormError && (
              <div role="alert" className="font-body-md text-[12px] text-danger">
                {replyFormError}
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
