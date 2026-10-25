"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import {
  ChatMessage,
  ChatProjectItem,
  getChatMessages,
  getChatProjects,
  pinChatProject,
  sendChatMessage,
  unpinChatProject,
} from "@/services/chat";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ChatProjectList } from "@/components/chat/ChatProjectList";

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady, isAuthenticated } = useAuth();

  const [projects, setProjects] = useState<ChatProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [noPlannerAssigned, setNoPlannerAssigned] = useState(false);

  const inFlightProjectsRef = useRef(false);
  const inFlightMessagesRef = useRef(false);
  const projectsErrorBackoffRef = useRef(0);
  const messagesErrorBackoffRef = useRef(0);
  const selectedProjectRef = useRef<number | null>(null);

  useEffect(() => {
    selectedProjectRef.current = selectedProjectId;
  }, [selectedProjectId]);

  // Authorization check
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const role = user?.role;
    if (role !== "Government Official" && role !== "Urban Planner") {
      router.push("/");
    }
  }, [isReady, isAuthenticated, user, router]);

  // Read ?project= from searchParams on mount or query change
  useEffect(() => {
    const pParam = searchParams.get("project");
    if (pParam) {
      const pid = parseInt(pParam, 10);
      if (!isNaN(pid) && pid > 0) {
        queueMicrotask(() => {
          setSelectedProjectId((prev) => (prev !== pid ? pid : prev));
        });
      }
    }
  }, [searchParams]);

  // Fetch Projects List
  const fetchProjects = useCallback(async (q?: string) => {
    if (inFlightProjectsRef.current) return;
    inFlightProjectsRef.current = true;
    try {
      const list = await getChatProjects(q);
      setProjects(list);
      projectsErrorBackoffRef.current = 0;
    } catch {
      projectsErrorBackoffRef.current = Math.min(30000, (projectsErrorBackoffRef.current || 2000) * 1.5);
    } finally {
      inFlightProjectsRef.current = false;
      setIsLoadingProjects(false);
    }
  }, []);

  // Fetch Messages for selected project
  const fetchMessages = useCallback(
    async (projectId: number, afterId?: number) => {
      if (inFlightMessagesRef.current) return;
      inFlightMessagesRef.current = true;
      try {
        const newMsgs = await getChatMessages(projectId, afterId);
        setNoPlannerAssigned(false);
        setConversationError(null);
        messagesErrorBackoffRef.current = 0;

        if (afterId != null) {
          if (newMsgs.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const filtered = newMsgs.filter((m) => !existingIds.has(m.id));
              return [...prev, ...filtered];
            });
            // Update unread count in project list
            setProjects((prev) =>
              prev.map((p) => (p.id === projectId ? { ...p, unread_count: 0 } : p))
            );
          }
        } else {
          setMessages(newMsgs);
          setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, unread_count: 0 } : p))
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes("409") || errorMsg.includes("planner accepts")) {
          setNoPlannerAssigned(true);
        } else {
          setConversationError(errorMsg);
        }
        messagesErrorBackoffRef.current = Math.min(20000, (messagesErrorBackoffRef.current || 2000) * 1.5);
      } finally {
        inFlightMessagesRef.current = false;
        setIsLoadingMessages(false);
      }
    },
    []
  );

  // Initial fetch and search filter
  useEffect(() => {
    if (!isAuthenticated) return;
    queueMicrotask(() => {
      void fetchProjects(searchQuery);
    });
  }, [isAuthenticated, searchQuery, fetchProjects]);

  // When selected project changes, reset messages and load
  useEffect(() => {
    if (!selectedProjectId) {
      queueMicrotask(() => {
        setMessages([]);
        setNoPlannerAssigned(false);
      });
      return;
    }
    queueMicrotask(() => {
      setIsLoadingMessages(true);
      void fetchMessages(selectedProjectId);
    });
  }, [selectedProjectId, fetchMessages]);

  // Polling: Projects list every 10s, Messages every 4s (with backoff & visibility check)
  useEffect(() => {
    if (!isAuthenticated) return;

    const listInterval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchProjects(searchQuery);
    }, 10000);

    const msgInterval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const pid = selectedProjectRef.current;
      if (!pid) return;

      setMessages((current) => {
        const lastMsgId = current.length > 0 ? current[current.length - 1].id : undefined;
        void fetchMessages(pid, lastMsgId);
        return current;
      });
    }, 4000);

    return () => {
      window.clearInterval(listInterval);
      window.clearInterval(msgInterval);
    };
  }, [isAuthenticated, searchQuery, fetchProjects, fetchMessages]);

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    router.replace(`/chat?project=${id}`);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    router.replace("/chat");
  };

  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    setPinError(null);
    try {
      if (currentPinned) {
        await unpinChatProject(id);
      } else {
        await pinChatProject(id);
      }
      await fetchProjects(searchQuery);
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSendMessage = async (body: string) => {
    if (!selectedProjectId) return;
    const sent = await sendChatMessage(selectedProjectId, body);
    setMessages((prev) => [...prev, sent]);
    await fetchProjects(searchQuery);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId) || null;
  const isReadOnly =
    activeProject?.stage === "Completed" ||
    activeProject?.stage === "Halted" ||
    activeProject?.stage === "Recalled";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopBar />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Project List */}
        <div
          className={`${
            selectedProjectId ? "hidden md:flex" : "flex"
          } w-full md:w-[340px] lg:w-[380px] shrink-0 h-full flex-col`}
        >
          <ChatProjectList
            projects={projects}
            selectedProjectId={selectedProjectId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectProject={handleSelectProject}
            onTogglePin={handleTogglePin}
            pinErrorMessage={pinError}
            isLoading={isLoadingProjects}
          />
        </div>

        {/* Right Column: Active Conversation */}
        <div
          className={`${
            selectedProjectId ? "flex" : "hidden md:flex"
          } flex-1 h-full flex-col min-w-0`}
        >
          <ChatConversation
            project={activeProject}
            currentUserId={user?.id ?? 0}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            isReadOnly={Boolean(isReadOnly)}
            noPlannerAssigned={noPlannerAssigned}
            onSendMessage={handleSendMessage}
            onBack={handleBackToProjects}
            error={conversationError}
          />
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-on-surface font-data-mono">Loading Chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
