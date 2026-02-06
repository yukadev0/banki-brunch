import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type {
  ClientQuestionInfo,
  Hint,
  IdentifyMessage,
  NoMatchingQuestionMessage,
  PollUpdateMessage,
  QueueUpdateMessage,
  ServerMessage,
  UserInfo,
} from "~/types/brunch-presenter.types";
import type { Route } from "./+types/live";
import ControlPanel from "./components/ControlPanel";
import HeaderSection from "./components/HeaderSection";
import HintManager from "./components/HintManager";
import Hints from "./components/Hints";
import NoMatchingQuestionSheet from "./components/NoMatchingQuestionSheet";
import QuestionSection from "./components/QuestionSection";
import TagSelectionDrawer from "./components/TagSelectionDrawer";
import { ToastContainer, useToast } from "./components/Toast";
import UsersSection from "./components/UsersSection";

const STORAGE_KEY = "banki-brunch-preferred-tags";

function getStoredTags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredTags(tags: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

export function meta() {
  return [{ title: "Live room" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await requireSession(context, request);
  const tags = await TagsRepository.getAll(context.db);

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image,
    },
    availableTags: tags.map((tag) => tag.name),
  };
}

export default function LivePage({ loaderData }: Route.ComponentProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserInfo[]>([]);
  const [self, setSelf] = useState<UserInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] =
    useState<ClientQuestionInfo | null>(null);
  const [questionForUser, setQuestionForUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [pollData, setPollData] = useState<PollUpdateMessage | null>(null);
  const [queueData, setQueueData] = useState<QueueUpdateMessage | null>(null);
  const [noMatchingQuestion, setNoMatchingQuestion] =
    useState<NoMatchingQuestionMessage | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showTagChangeRequest, setShowTagChangeRequest] = useState(false);
  const [preferredTags, setPreferredTags] = useState<string[]>([]);
  const [hasShownInitialModal, setHasShownInitialModal] = useState(false);
  const [hints, setHints] = useState<Hint[]>([]);
  const [activeHints, setActiveHints] = useState<Hint[]>([]);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();
  const MAX_HINTS = 3;

  const { user, availableTags } = loaderData;

  useEffect(() => {
    const stored = getStoredTags();
    setPreferredTags(stored);
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/websocket`);

    ws.addEventListener("open", () => {
      setIsConnected(true);

      const storedTags = getStoredTags();
      const data: IdentifyMessage = {
        type: "identify",
        id: user.id,
        name: user.name,
        image: user.image,
        preferredTags: storedTags,
      };
      ws.send(JSON.stringify(data));

      if (storedTags.length === 0 && !hasShownInitialModal) {
        setShowTagModal(true);
        setHasShownInitialModal(true);
      }
    });

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        switch (data.type) {
          case "users":
            setActiveUsers(data.users || []);
            setSelf(data.users.find((u) => u.id === user.id) || null);
            break;

          case "duplicate_session":
            navigate("/");
            break;

          case "question":
            setCurrentQuestion(data.question || null);
            setQuestionForUser(
              data.forUserId && data.forUserName
                ? { id: data.forUserId, name: data.forUserName }
                : null,
            );
            setPollData(null);
            setNoMatchingQuestion(null);
            break;

          case "poll_update":
            setPollData(data);
            break;

          case "queue_update":
            setQueueData(data);
            break;

          case "no_matching_question":
            setNoMatchingQuestion(data);
            break;

          case "tag_change_requested":
            setShowTagChangeRequest(true);
            setShowTagModal(true);
            break;

          case "hints_list":
            setHints(data.hints);
            setIsGeneratingHint(false);
            break;

          case "active_hints":
            setActiveHints(data.hints);
            break;

          case "role_change_rejected":
            addToast(
              `Cannot become presenter. ${data.currentPresenterName} is already the presenter.`,
              "warning",
              6000,
            );
            break;

          case "hint_generating":
            setIsGeneratingHint(true);
            break;

          case "hint_error":
            setIsGeneratingHint(false);
            addToast(`Failed to generate hint: ${data.error}`, "error", 8000);
            break;

          default:
            console.warn("Unknown message type:", (data as ServerMessage).type);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    });

    ws.addEventListener("close", () => {
      setIsConnected(false);
    });

    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  if (!socket || !self || !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link
          to="/"
          className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
        >
          Home
        </Link>
        <h3 className="text-xl">Connecting...</h3>
      </div>
    );
  }

  const isPresenter = self.role === "presenter";

  const handleGetQuestion = () => {
    if (isPresenter) {
      socket.send(JSON.stringify({ type: "get_question" }));
    }
  };

  const handleStartPoll = () => {
    if (isPresenter) {
      socket.send(JSON.stringify({ type: "start_poll" }));
    }
  };

  const handleCastVote = (option: string) => {
    socket.send(JSON.stringify({ type: "cast_vote", option }));
  };

  const handleEndPoll = () => {
    if (isPresenter) {
      socket.send(JSON.stringify({ type: "end_poll" }));
    }
  };

  const handleTagsConfirm = (tags: string[]) => {
    setPreferredTags(tags);
    setStoredTags(tags);
    setShowTagModal(false);
    setShowTagChangeRequest(false);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "set_tag_preferences", tags }));
    }
  };

  const handleRequestTagChange = (targetUserId: string) => {
    if (isPresenter && socket) {
      socket.send(JSON.stringify({ type: "request_tag_change", targetUserId }));
    }
  };

  const handleGetRandomForUser = (targetUserId: string) => {
    if (isPresenter && socket) {
      socket.send(
        JSON.stringify({ type: "get_random_question_for_user", targetUserId }),
      );
      setNoMatchingQuestion(null);
    }
  };

  const handleSkipUser = () => {
    if (isPresenter && socket) {
      socket.send(JSON.stringify({ type: "skip_user" }));
      setNoMatchingQuestion(null);
    }
  };

  return (
    <div className="min-h-screen py-6">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <HeaderSection name={user.name} />

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-2 mt-8">
          <UsersSection
            activeUsers={activeUsers}
            selfId={self.id}
            isPresenter={isPresenter}
            queueData={queueData}
            onRequestTagChange={handleRequestTagChange}
          />

          <QuestionSection
            isPresenter={isPresenter}
            question={currentQuestion}
            questionForUser={questionForUser}
            onGetQuestion={handleGetQuestion}
            pollData={pollData}
            onStartPoll={handleStartPoll}
            onCastVote={handleCastVote}
            onEndPoll={handleEndPoll}
            activeHints={activeHints}
          />

          <ControlPanel
            user={self}
            socket={socket}
            isConnected={isConnected}
            preferredTags={preferredTags}
            onOpenTagModal={() => setShowTagModal(true)}
          />
        </div>

        <Hints activeHints={activeHints} maxHints={MAX_HINTS} />

        {isPresenter && (
          <HintManager
            maxHints={MAX_HINTS}
            hints={hints}
            socket={socket}
            hasQuestion={currentQuestion !== null}
            isGenerating={isGeneratingHint}
          />
        )}
      </div>

      <TagSelectionDrawer
        isOpen={showTagModal}
        availableTags={availableTags}
        selectedTags={preferredTags}
        onConfirm={handleTagsConfirm}
        onClose={() => {
          setShowTagModal(false);
          setShowTagChangeRequest(false);
        }}
        title={
          showTagChangeRequest
            ? "Presenter Requests Tag Change"
            : "Select Your Preferred Tags"
        }
        description={
          showTagChangeRequest
            ? "The presenter is asking you to update your tag preferences for the next question."
            : "Choose the topics you're interested in. Questions will be prioritized based on your selections."
        }
      />

      {noMatchingQuestion && isPresenter && (
        <NoMatchingQuestionSheet
          data={noMatchingQuestion}
          onResetQuestions={() => {
            socket.send(JSON.stringify({ type: "reset_questions" }));
            setNoMatchingQuestion(null);
          }}
          onRequestTagChange={() => {
            handleRequestTagChange(noMatchingQuestion.forUserId);
            setNoMatchingQuestion(null);
          }}
          onGetRandom={() =>
            handleGetRandomForUser(noMatchingQuestion.forUserId)
          }
          onSkip={handleSkipUser}
          onClose={() => setNoMatchingQuestion(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
