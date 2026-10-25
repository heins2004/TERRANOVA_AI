"use client";

import React from "react";
import { ChatProjectItem } from "@/services/chat";
import { formatISTDateTime } from "./chatUtils";

interface ChatProjectListProps {
  projects: ChatProjectItem[];
  selectedProjectId: number | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProject: (id: number) => void;
  onTogglePin: (id: number, currentPinned: boolean) => void;
  pinErrorMessage?: string | null;
  isLoading: boolean;
}

export function ChatProjectList({
  projects,
  selectedProjectId,
  searchQuery,
  onSearchChange,
  onSelectProject,
  onTogglePin,
  pinErrorMessage,
  isLoading,
}: ChatProjectListProps) {
  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border-r border-white/10">
      {/* Search Header */}
      <div className="p-[14px] border-b border-white/10 shrink-0">
        <div className="relative">
          <span
            className="material-symbols-outlined absolute left-[10px] top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none"
            aria-hidden="true"
          >
            search
          </span>
          <input
            id="chat-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="w-full h-[36px] pl-[34px] pr-[12px] rounded-lg border border-white/15 bg-white/5 font-body-md text-[13px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:outline-none transition-colors"
          />
        </div>

        {pinErrorMessage && (
          <div
            id="chat-pin-error"
            role="alert"
            className="mt-[10px] p-[8px] rounded border border-danger/40 bg-danger/10 text-danger text-[11px] font-body-md"
          >
            {pinErrorMessage}
          </div>
        )}
      </div>

      {/* Projects List */}
      <div
        id="chat-project-list"
        role="tablist"
        aria-label="Chat projects"
        className="flex-1 overflow-y-auto divide-y divide-white/5"
      >
        {isLoading && projects.length === 0 ? (
          <div className="py-[32px] text-center font-data-mono text-[12px] text-on-surface-variant">
            Loading chats...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-[40px] px-[20px] text-center">
            <span
              className="material-symbols-outlined text-[32px] text-on-surface-variant/40"
              aria-hidden="true"
            >
              chat_bubble_outline
            </span>
            <p className="mt-[8px] font-data-mono text-[12px] text-on-surface-variant uppercase tracking-wider">
              {searchQuery ? "No matching projects" : "No chats available"}
            </p>
          </div>
        ) : (
          projects.map((project) => {
            const isSelected = project.id === selectedProjectId;
            return (
              <div
                key={project.id}
                id={`chat-project-item-${project.id}`}
                role="tab"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => onSelectProject(project.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectProject(project.id);
                  }
                }}
                className={`group relative p-[12px] flex items-start gap-[10px] cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  isSelected
                    ? "bg-primary-container/15 border-l-2 border-primary"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-[6px]">
                    <h3
                      className={`font-body-md text-[13px] font-semibold truncate ${
                        isSelected ? "text-primary-container" : "text-on-surface"
                      }`}
                    >
                      {project.title}
                    </h3>
                    {project.last_message_time && (
                      <span className="font-data-mono text-[10px] text-on-surface-variant shrink-0">
                        {formatISTDateTime(project.last_message_time)}
                      </span>
                    )}
                  </div>

                  {/* Stage and City */}
                  <div className="mt-[3px] flex items-center gap-[6px] font-data-mono text-[10px] text-on-surface-variant">
                    <span className="px-[5px] py-[1px] rounded bg-white/5 border border-white/10 uppercase">
                      {project.stage}
                    </span>
                    {project.city_name && <span>{project.city_name}</span>}
                  </div>

                  {/* Last Message Preview */}
                  <p className="mt-[6px] font-body-md text-[12px] text-on-surface-variant truncate">
                    {project.last_message_text ? (
                      <>
                        {project.last_message_sender_name && (
                          <span className="text-on-surface/70 font-medium">
                            {project.last_message_sender_name}:{" "}
                          </span>
                        )}
                        <span>{project.last_message_text}</span>
                      </>
                    ) : (
                      <span className="italic text-on-surface-variant/50">No messages yet</span>
                    )}
                  </p>
                </div>

                {/* Right controls: unread count and pin toggle */}
                <div className="flex flex-col items-end gap-[6px] shrink-0 pt-[2px]">
                  <button
                    type="button"
                    id={`chat-pin-btn-${project.id}`}
                    aria-label={project.is_pinned ? "Unpin project" : "Pin project"}
                    title={project.is_pinned ? "Unpin project" : "Pin project"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(project.id, project.is_pinned);
                    }}
                    className={`h-[26px] w-[26px] rounded flex items-center justify-center transition-colors cursor-pointer ${
                      project.is_pinned
                        ? "text-primary-container hover:bg-primary-container/20"
                        : "text-on-surface-variant/40 hover:text-on-surface hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        project.is_pinned ? "fill-current" : ""
                      }`}
                    >
                      push_pin
                    </span>
                  </button>

                  {project.unread_count > 0 && (
                    <span
                      id={`chat-unread-badge-${project.id}`}
                      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full bg-primary text-black font-data-mono text-[10px] font-bold"
                    >
                      {project.unread_count}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
