import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type {
  ClientQuestionInfo,
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
import NoMatchingQuestionModal from "./components/NoMatchingQuestionModal";
import QuestionSection from "./components/QuestionSection";
import TagSelectionModal from "./components/TagSelectionModal";
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
  const navigate = useNavigate();

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

        if (data.type === "users") {
          setActiveUsers(data.users || []);
          setSelf(data.users.find((u) => u.id === user.id) || null);
        } else if (data.type === "duplicate_session") {
          navigate("/");
        } else if (data.type === "question") {
          setCurrentQuestion(data.question);
          setQuestionForUser(
            data.forUserId && data.forUserName
              ? { id: data.forUserId, name: data.forUserName }
              : null,
          );
          setPollData(null);
          setNoMatchingQuestion(null);
        } else if (data.type === "poll_update") {
          setPollData(data);
        } else if (data.type === "queue_update") {
          setQueueData(data);
        } else if (data.type === "no_matching_question") {
          setNoMatchingQuestion(data);
        } else if (data.type === "tag_change_requested") {
          setShowTagChangeRequest(true);
          setShowTagModal(true);
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

  const handleGetQuestion = () => {
    if (self?.role === "presenter") {
      socket?.send(JSON.stringify({ type: "get_question" }));
    }
  };

  const handleStartPoll = () => {
    if (self?.role === "presenter") {
      socket?.send(JSON.stringify({ type: "start_poll" }));
    }
  };

  const handleCastVote = (option: string) => {
    socket?.send(JSON.stringify({ type: "cast_vote", option }));
  };

  const handleEndPoll = () => {
    if (self?.role === "presenter") {
      socket?.send(JSON.stringify({ type: "end_poll" }));
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
    if (self?.role === "presenter" && socket) {
      socket.send(JSON.stringify({ type: "request_tag_change", targetUserId }));
    }
  };

  const handleGetRandomForUser = (targetUserId: string) => {
    if (self?.role === "presenter" && socket) {
      socket.send(
        JSON.stringify({ type: "get_random_question_for_user", targetUserId }),
      );
      setNoMatchingQuestion(null);
    }
  };

  const handleSkipUser = () => {
    if (self?.role === "presenter" && socket) {
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

      <div className="max-w-7xl mx-auto">
        <HeaderSection name={user.name} />

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-2 mt-8">
          <UsersSection
            activeUsers={activeUsers}
            selfId={self?.id || null}
            isPresenter={self?.role === "presenter"}
            queueData={queueData}
            onRequestTagChange={handleRequestTagChange}
          />

          <QuestionSection
            isPresenter={self?.role === "presenter"}
            question={currentQuestion}
            questionForUser={questionForUser}
            onGetQuestion={handleGetQuestion}
            pollData={pollData}
            onStartPoll={handleStartPoll}
            onCastVote={handleCastVote}
            onEndPoll={handleEndPoll}
          />

          <ControlPanel
            user={self}
            socket={socket}
            isConnected={isConnected}
            preferredTags={preferredTags}
            onOpenTagModal={() => setShowTagModal(true)}
          />
        </div>
      </div>

      <TagSelectionModal
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

      {noMatchingQuestion && self?.role === "presenter" && (
        <NoMatchingQuestionModal
          data={noMatchingQuestion}
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
    </div>
  );
}
