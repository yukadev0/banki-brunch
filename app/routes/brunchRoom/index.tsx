import { useEffect, useState } from "react";
import { Link } from "react-router";
import useWebSocket from "react-use-websocket";
import type {
  ClientMessage,
  Identify,
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

  const [url, setUrl] = useState<string | null>(null);
  const { sendMessage, getWebSocket, readyState } = useWebSocket(url, {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        switch (data.type) {
          case "users_snapshot":
            userRegistry.setUsers(data.users);
            break;

          case "queue_update":
            queueManager.setQueueData(data.queue);
            break;

          case "no_matching_question":
            setShowNoMatchingQuestionModal(true);
            break;

          case "tag_change_requested":
            setShowTagChangeRequest(true);
            setShowTagModal(true);
            break;

          case "question":
          case "targeted_question":
            pollManager.reset();
            hintsManager.reset();

            questionManager.handleMessage(data);
            break;

          case "poll_ended":
          case "poll_update":
            pollManager.handleMessage(data);
            break;

          case "hint_error":
          case "hint_generated":
          case "hint_generating":
          case "hints_list_snapshot":
          case "active_hints_snapshot":
            hintsManager.handleMessage(data);
            break;

          case "role_change_rejected":
            if (data.reason === "presenter_exists") {
              addToast(
                `Cannot become presenter. There's already a presenter here.`,
                "warning",
                5000,
              );
            }
            break;

          default:
            console.warn("Unknown message type:", (data as ServerMessage).type);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    },
    onOpen: () => {
      const storedTags = getStoredTags();
      if (storedTags.length === 0) {
        setShowTagModal(true);
      }

      const data: Identify = {
        type: "identify",
        id: user.id,
        name: user.name,
        image: user.image || null,
        preferredTags: storedTags,
      };
      sendMessage(JSON.stringify(data));
    },
  });

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
    setUrl(`${protocol}://${window.location.host}/websocket`);
  }, []);

  const socket = getWebSocket();
  const self = userRegistry.getSelf();
  if (!socket || !self || readyState !== WebSocket.OPEN) {
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

  function sendToServer(message: ClientMessage) {
    try {
      sendMessage(
        JSON.stringify({
          ...message,
        }),
      );
    } catch (err) {
      console.error("Error sending to server:", err);
    }
  }

  const isPresenter = self.role === "presenter";

  function handleGetQuestion() {
    if (isPresenter) {
      sendToServer({ type: "request_question" });
    }
  }

  function handleStartPoll() {
    if (isPresenter) {
      sendToServer({ type: "request_start_poll" });
    }
  }

  function handleCastVote(option: string) {
    if (!pollManager.pollEnded) {
      sendToServer({ type: "request_cast_vote", option });
    }
  }

  function handleEndPoll() {
    if (isPresenter && !pollManager.pollEnded) {
      sendToServer({ type: "request_end_poll" });
    }
  }

  function handleTagsConfirm(tags: string[]) {
    setStoredTags(tags);
    setShowTagModal(false);
    setShowTagChangeRequest(false);

    sendToServer({ type: "request_set_tag_preferences", tags });
  }

  function handleRequestTagChange(userId: string) {
    if (isPresenter) {
      sendToServer({ type: "request_tag_change", userId });
    }
  }

  function handleSkipUser() {
    if (isPresenter) {
      sendToServer({ type: "request_skip_user" });
      setShowNoMatchingQuestionModal(false);
    }
  }

  function handleToggleLurking() {
    sendToServer({ type: "request_toggle_lurking" });
  }

  function handleChangeRole() {
    sendToServer({ type: "request_change_role" });
  }

  function handleGenerateHint() {
    if (hintsManager.hints.length < hintsManager.MAX_HINTS) {
      sendToServer({ type: "request_generate_hint" });
    }
  }

  function handleAddCustomHint(content: string) {
    if (hintsManager.hints.length < hintsManager.MAX_HINTS) {
      content = content.trim();
      if (content) {
        sendToServer({
          type: "request_add_custom_hint",
          content: content.slice(0, 500),
        });
      }
    }
  }

  function handleDeleteHint(hintId: string) {
    if (isPresenter) {
      sendToServer({ type: "request_delete_hint", hintId });
    }
  }

  function handleToggleHint(hintId: string) {
    if (isPresenter) {
      sendToServer({ type: "request_toggle_hint_visibility", hintId });
    }
  }

  function handleResetQuestions() {
    if (isPresenter) {
      sendToServer({ type: "request_reset_questions" });
      setShowNoMatchingQuestionModal(false);
    }
  }

  const targetUserName = questionManager.forUserId
    ? userRegistry.getById(questionManager.forUserId)?.name
    : null;

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
            targetUserName={targetUserName || null}
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
            handleToggleLurking={handleToggleLurking}
            handleChangeRole={handleChangeRole}
            onOpenTagModal={() => setShowTagModal(true)}
            preferredTags={userRegistry.getSelf()?.preferredTags ?? []}
          />
        </div>

        <Hints
          maxHints={hintsManager.MAX_HINTS}
          activeHints={hintsManager.activeHints}
        />

        {isPresenter && (
          <HintManager
            handleAddCustomHint={handleAddCustomHint}
            handleDeleteHint={handleDeleteHint}
            handleGenerateHint={handleGenerateHint}
            handleToggleHint={handleToggleHint}
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
          onResetQuestions={handleResetQuestions}
          onRequestTagChange={() => {
            const user = queueManager.getNextInQueue();
            if (user) {
              handleRequestTagChange(user.id);
            }
            setShowNoMatchingQuestionModal(false);
          }}
          onSkip={handleSkipUser}
          onClose={() => setShowNoMatchingQuestionModal(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
