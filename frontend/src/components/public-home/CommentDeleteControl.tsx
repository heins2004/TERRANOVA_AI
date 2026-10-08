"use client";

import React, { useRef, useState } from "react";
import { deleteComment, CommentApiError } from "@/services/comments";

type CommentDeleteControlProps = {
  commentId: number;
  onDeleted: (commentId: number) => void;
  className?: string;
};

export function CommentDeleteControl({
  commentId,
  onDeleted,
  className = "",
}: CommentDeleteControlProps) {
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDeletingRef = useRef<boolean>(false);

  const handleInitiate = () => {
    setIsConfirming(true);
    setErrorMessage(null);
  };

  const handleCancel = () => {
    if (isDeleting) return;
    setIsConfirming(false);
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteComment(commentId);
      setIsConfirming(false);
      onDeleted(commentId);
    } catch (err: unknown) {
      isDeletingRef.current = false;
      setIsDeleting(false);
      if (err instanceof CommentApiError) {
        setErrorMessage(err.serverMessage);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to delete comment.");
      }
    }
  };

  if (!isConfirming) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={handleInitiate}
          aria-label="Delete comment"
          className="font-body-md text-[11px] text-error hover:underline cursor-pointer transition-colors"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-[4px] mt-[4px] ${className}`}>
      <div className="flex items-center gap-[6px]">
        <span className="font-body-md text-[11px] text-on-surface-variant">
          Delete comment?
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          aria-label="Confirm delete comment"
          className="font-body-md text-[11px] font-semibold text-error hover:underline cursor-pointer disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </button>
        <span className="text-[11px] text-white/30">|</span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isDeleting}
          aria-label="Cancel delete comment"
          className="font-body-md text-[11px] text-on-surface-variant hover:underline cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {errorMessage && (
        <div
          role="alert"
          className="font-body-md text-[11px] text-error bg-error/10 border border-error/30 px-[6px] py-[2px] rounded"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
