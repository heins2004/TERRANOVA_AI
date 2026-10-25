"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatProjectItem } from "@/services/chat";
import { formatDateSeparator, formatISTDateTime, getDateKey } from "./chatUtils";

interface ChatConversationProps {
  project: ChatProjectItem | null;
  currentUserId: number;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isReadOnly: boolean;
  noPlannerAssigned: boolean;
  onSendMessage: (body: string) => Promise<void>;
  onBack?: () => void;
  error?: string | null;
}

export function ChatConversation({
  project,
  currentUserId,
  messages,
  isLoadingMessages,
  isReadOnly,
  noPlannerAssigned,
  onSendMessage,
  onBack,
  error,
}: ChatConversationProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  // Track if user is scrolled near bottom
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 80;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  // Auto-scroll to bottom on new messages if near bottom
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 1000 || isSending || isReadOnly) return;
    setIsSending(true);
    try {
      await onSendMessage(trimmed);
      setText("");
      isNearBottomRef.current = true;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-[24px] text-center bg-surface-container-lowest">
        <span
          className="material-symbols-outlined text-[48px] text-on-surface-variant/30"
          aria-hidden="true"
        >
          forum
        </span>
        <h3 className="mt-[12px] font-body-md text-[16px] font-medium text-on-surface">
          Select a project
        </h3>
        <p className="mt-[4px] font-body-md text-[13px] text-on-surface-variant">
          Choose a conversation from the left to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest min-w-0">
      {/* Conversation Header */}
      <div
        id="chat-conversation-header"
        className="h-[60px] px-[16px] border-b border-white/10 flex items-center justify-between gap-[12px] shrink-0 bg-surface-container-lowest/80 backdrop-blur-md"
      >
        <div className="flex items-center gap-[10px] min-w-0">
          {onBack && (
            <button
              type="button"
              id="chat-back-button"
              aria-label="Back to project list"
              onClick={onBack}
              className="md:hidden flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-on-surface hover:bg-white/10 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}
          <div className="min-w-0">
            <h2 className="font-body-md text-[14px] font-semibold text-on-surface truncate">
              {project.title}
            </h2>
            <div className="flex items-center gap-[6px] font-data-mono text-[10px] text-on-surface-variant">
              <span className="px-[5px] py-[1px] rounded bg-white/5 border border-white/10 uppercase">
                {project.stage}
              </span>
              {project.city_name && <span>{project.city_name}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-[8px] px-[16px] border-b border-danger/30 bg-danger/10 text-danger font-body-md text-[12px]"
        >
          {error}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="chat-messages-container"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-[16px] md:p-[20px] space-y-[12px]"
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="py-[40px] text-center font-data-mono text-[12px] text-on-surface-variant">
            Loading messages...
          </div>
        ) : noPlannerAssigned ? (
          <div className="py-[60px] px-[20px] text-center max-w-[420px] mx-auto">
            <span
              className="material-symbols-outlined text-[40px] text-primary/40"
              aria-hidden="true"
            >
              hourglass_top
            </span>
            <p className="mt-[12px] font-body-md text-[14px] text-on-surface font-medium">
              Chat starts when the planner accepts the invitation
            </p>
            <p className="mt-[4px] font-body-md text-[12px] text-on-surface-variant">
              Once the invited planner accepts, messaging will be unlocked.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-[60px] text-center text-on-surface-variant">
            <span
              className="material-symbols-outlined text-[36px] text-on-surface-variant/30"
              aria-hidden="true"
            >
              chat
            </span>
            <p className="mt-[8px] font-body-md text-[13px]">No messages yet</p>
            <p className="font-body-md text-[12px] text-on-surface-variant/60">
              Start the collaboration by sending a message below.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender_id === currentUserId;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDateSep =
              !prevMsg || getDateKey(msg.created_at) !== getDateKey(prevMsg.created_at);

            return (
              <React.Fragment key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center justify-center my-[16px]">
                    <span className="px-[10px] py-[3px] rounded-full border border-white/10 bg-white/5 font-data-mono text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}

                <div
                  id={`chat-message-${msg.id}`}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  {/* Sender meta */}
                  <div className="flex items-center gap-[6px] mb-[4px] px-[4px]">
                    <span className="font-body-md text-[11px] font-semibold text-on-surface">
                      {isMine ? "You" : msg.sender_name}
                    </span>
                    <span className="font-data-mono text-[10px] text-primary-container">
                      ({msg.sender_role})
                    </span>
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-[10px] md:p-[12px] text-[13px] font-body-md leading-relaxed whitespace-pre-wrap break-words ${
                      isMine
                        ? "bg-primary-container/20 border border-primary-container/40 text-on-surface rounded-tr-sm"
                        : "bg-white/5 border border-white/10 text-on-surface rounded-tl-sm"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <span
                      className={`block mt-[4px] text-[10px] font-data-mono ${
                        isMine ? "text-right text-on-surface-variant/80" : "text-left text-on-surface-variant/80"
                      }`}
                    >
                      {formatISTDateTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Read-Only Banner OR Composer */}
      {isReadOnly ? (
        <div
          id="chat-readonly-note"
          className="p-[14px] border-t border-white/10 bg-white/[0.02] text-center font-body-md text-[13px] text-on-surface-variant"
        >
          This project is completed or halted. The chat is read-only.
        </div>
      ) : noPlannerAssigned ? null : (
        <div className="p-[14px] border-t border-white/10 bg-surface-container-lowest shrink-0">
          <div className="flex flex-col gap-[8px] rounded-xl border border-white/15 bg-white/5 p-[10px] focus-within:border-primary-container transition-colors">
            <textarea
              id="chat-composer-textarea"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              aria-label="Type message"
              disabled={isSending}
              maxLength={1000}
              className="w-full bg-transparent border-0 font-body-md text-[13px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between pt-[4px] border-t border-white/5">
              <span
                id="chat-char-counter"
                className={`font-data-mono text-[11px] ${
                  text.length > 1000 ? "text-danger" : "text-on-surface-variant/60"
                }`}
              >
                {text.length} / 1000
              </span>
              <button
                type="button"
                id="chat-send-btn"
                disabled={!text.trim() || text.length > 1000 || isSending}
                onClick={() => void handleSend()}
                className="h-[30px] px-[14px] rounded-lg font-data-mono text-[11px] font-semibold uppercase tracking-wider bg-primary text-black hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-[4px]"
              >
                <span>{isSending ? "Sending..." : "Send"}</span>
                <span className="material-symbols-outlined text-[14px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
