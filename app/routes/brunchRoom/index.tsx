import { useEffect, useState } from "react";
import { Link } from "react-router";
import type {
  IdentifyMessage,
  ServerMessage,
} from "workers/durableObjects/brunchRoom/types";
import { requireSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types";
import ControlPanel from "./components/ControlPanel";
import HeaderSection from "./components/HeaderSection";
import HintManager from "./components/HintManager";
import Hints from "./components/Hints";
import NoMatchingQuestionSheet from "./components/NoMatchingQuestionSheet";
import QuestionSection from "./components/QuestionSection";
import TagSelectionDrawer from "./components/TagSelectionDrawer";
import { ToastContainer, useToast } from "./components/Toast";
import UsersSection from "./components/UsersSection";
import useHints from "./hooks/useHints";
import usePoll from "./hooks/usePoll";
import useQuestion from "./hooks/useQuestion";
import useQueue from "./hooks/useQueue";
import useUserRegistry from "./hooks/useUserRegistry";

const STORAGE_KEY = "banki-brunch-preferred-tags";

function getStoredTags() {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredTags(tags: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

export function meta() {
  return [{ title: "Brunch Room" }];
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

export default function BrunchRoomPage({ loaderData }: Route.ComponentProps) {
  const { user, availableTags } = loaderData;

  const [socket, setSocket] = useState<WebSocket | null>(null);

  const pollManager = usePoll();
  const questionManager = useQuestion();
  const userRegistry = useUserRegistry(user.id);
  const queueManager = useQueue(userRegistry.users);
  const hintsManager = useHints((message) => addToast(message, "error", 5000));

  const [showTagModal, setShowTagModal] = useState(false);
  const [showTagChangeRequest, setShowTagChangeRequest] = useState(false);
  const [showNoMatchingQuestionModal, setShowNoMatchingQuestionModal] =
    useState(false);

  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/websocket`);

    ws.addEventListener("open", () => {
      const storedTags = getStoredTags();
      if (storedTags.length === 0) {
        setShowTagModal(true);
      }

      const data: IdentifyMessage = {
        type: "identify",
        id: user.id,
        name: user.name,
        image: user.image || null,
        preferredTags: storedTags,
      };
      ws.send(JSON.stringify(data));
    });

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        switch (data.type) {
          case "users_snapshot":
            {
              userRegistry.setUsers(data.users);
            }
            break;

          case "queue_update":
            {
              queueManager.setQueueData(data);
            }
            break;

          case "no_matching_question":
            {
              setShowNoMatchingQuestionModal(true);
            }
            break;

          case "tag_change_requested":
            {
              setShowTagChangeRequest(true);
              setShowTagModal(true);
            }
            break;

          case "question":
          case "targeted_question":
            {
              pollManager.reset();
              hintsManager.setHints([]);

              questionManager.handleMessage(data);
            }
            break;

          case "poll_ended":
          case "poll_update":
            {
              pollManager.handleMessage(data);
            }
            break;

          case "hints_list":
          case "hint_error":
          case "active_hints":
          case "hint_generated":
          case "hint_generating":
            {
              hintsManager.handleMessage(data);
            }
            break;

          case "role_change_rejected":
            {
              if (data.reason === "presenter_exists") {
                addToast(
                  `Cannot become presenter. There's already a presenter here.`,
                  "warning",
                  5000,
                );
              }
            }
            break;

          default:
            console.warn("Unknown message type:", (data as ServerMessage).type);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    });

    ws.addEventListener("close", () => {
      setSocket(null);
    });

    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const self = userRegistry.getSelf();

  if (!socket || !self) {
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
    if (!pollManager.pollEnded) {
      socket.send(JSON.stringify({ type: "cast_vote", option }));
    }
  };

  const handleEndPoll = () => {
    if (isPresenter && !pollManager.pollEnded) {
      socket.send(JSON.stringify({ type: "end_poll" }));
    }
  };

  const handleTagsConfirm = (tags: string[]) => {
    setStoredTags(tags);
    setShowTagModal(false);
    setShowTagChangeRequest(false);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "set_tag_preferences", tags }));
    }
  };

  const handleRequestTagChange = (userId: string) => {
    if (isPresenter && socket) {
      socket.send(JSON.stringify({ type: "request_tag_change", userId }));
    }
  };

  const handleGetRandomForUser = (userId: string) => {
    if (isPresenter && socket) {
      socket.send(
        JSON.stringify({
          type: "get_random_question_for_user",
          userId,
        }),
      );
      setShowNoMatchingQuestionModal(false);
    }
  };

  const handleSkipUser = () => {
    if (isPresenter && socket) {
      socket.send(JSON.stringify({ type: "skip_user" }));
      setShowNoMatchingQuestionModal(false);
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
            getQueuePosition={queueManager.getQueuePosition}
            isNextInQueue={queueManager.isNextInQueue}
            activeUsers={userRegistry.users}
            selfId={self?.id}
            isPresenter={isPresenter}
            queueData={queueManager.queueData}
            onRequestTagChange={handleRequestTagChange}
          />

          <QuestionSection
            isPresenter={isPresenter}
            question={questionManager.currentQuestion}
            onGetQuestion={handleGetQuestion}
            pollData={pollManager.pollData}
            pollEnded={pollManager.pollEnded}
            onStartPoll={handleStartPoll}
            onCastVote={handleCastVote}
            onEndPoll={handleEndPoll}
          />

          <ControlPanel
            user={self}
            socket={socket}
            preferredTags={userRegistry.getSelf()?.preferredTags ?? []}
            onOpenTagModal={() => setShowTagModal(true)}
          />
        </div>

        <Hints
          maxHints={hintsManager.MAX_HINTS}
          activeHints={hintsManager.activeHints}
        />

        {isPresenter && (
          <HintManager
            socket={socket}
            hints={hintsManager.hints}
            maxHints={hintsManager.MAX_HINTS}
            hasQuestion={questionManager.currentQuestion !== null}
            isGenerating={hintsManager.isGenerating}
          />
        )}
      </div>

      <TagSelectionDrawer
        isOpen={showTagModal}
        availableTags={availableTags}
        selectedTags={userRegistry.getSelf()?.preferredTags ?? []}
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

      {showNoMatchingQuestionModal && isPresenter && (
        <NoMatchingQuestionSheet
          queueManager={queueManager}
          onResetQuestions={() => {
            socket.send(JSON.stringify({ type: "reset_questions" }));
            setShowNoMatchingQuestionModal(false);
          }}
          onRequestTagChange={() => {
            const user = queueManager.getNextInQueue();
            if (user) {
              handleRequestTagChange(user.id);
            }
            setShowNoMatchingQuestionModal(false);
          }}
          onGetRandom={() => {
            const user = queueManager.getNextInQueue();
            if (user) {
              handleGetRandomForUser(user.id);
            }
          }}
          onSkip={handleSkipUser}
          onClose={() => setShowNoMatchingQuestionModal(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
