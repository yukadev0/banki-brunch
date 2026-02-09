import { useEffect, useState } from "react";
import { Link } from "react-router";
import useWebSocket from "react-use-websocket";
import type {
  ClientMessage,
  Identify,
  RoleChangeRejectedReason,
  UserId,
} from "workers/durableObjects/brunchRoom/types";
import { requireSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types";
import ControlPanel from "./components/ControlPanel";
import HeaderSection from "./components/HeaderSection";
import Hints from "./components/Hints";
import NoMatchingQuestionSheet from "./components/NoMatchingQuestionSheet";
import PresenterHints from "./components/PresenterHints";
import QuestionSection from "./components/QuestionSection";
import TagSelectionDrawer from "./components/TagSelectionDrawer";
import { ToastContainer, useToast } from "./components/Toast";
import UsersSection from "./components/UsersSection";
import useBrunchRoomApp from "./hooks/useBrunchRoomApp";

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

  const {
    selfUser,
    isPresenter,
    hintManager,
    pollManager,
    userManager,
    queueManager,
    targetUserName,
    questionManager,
    onWebSocketMessage,
  } = useBrunchRoomApp(user.id, {
    onNoMatchingQuestion: () => {
      setShowNoMatchingQuestionModal(true);
    },
    onTagChangeRequested: () => {
      setShowTagModal(true);
      setShowTagChangeRequest(true);
    },
    onRoleChangeRejected: (reason: RoleChangeRejectedReason) => {
      if (reason === "presenter_exists") {
        addToast(
          `Cannot become presenter. There's already a presenter here.`,
          "warning",
          5000,
        );
      }
    },
    onHintError: (message: string) => {
      addToast(message, "error", 5000);
    },
  });

  const [url, setUrl] = useState<string | null>(null);
  const { sendMessage, getWebSocket, readyState } = useWebSocket(url, {
    onMessage: onWebSocketMessage,
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
  if (!socket || !selfUser || readyState !== WebSocket.OPEN) {
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
    if (!pollManager.isEnded) {
      sendToServer({ type: "request_cast_vote", option });
    }
  }

  function handleEndPoll() {
    if (isPresenter && !pollManager.isEnded) {
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
    if (hintManager.hintCount() < hintManager.MAX_HINTS) {
      sendToServer({ type: "request_generate_hint" });
    }
  }

  function handleAddCustomHint(content: string) {
    if (hintManager.hintCount() < hintManager.MAX_HINTS) {
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
            getQueuePosition={(userId: UserId) =>
              queueManager.getQueuePosition(userId)
            }
            isNextInQueue={(userId: UserId) =>
              queueManager.isNextInQueue(userId)
            }
            activeUsers={userManager.getUsers()}
            selfId={selfUser.id}
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
            pollEnded={pollManager.isEnded}
            onStartPoll={handleStartPoll}
            onCastVote={handleCastVote}
            onEndPoll={handleEndPoll}
          />

          <ControlPanel
            user={selfUser}
            handleToggleLurking={handleToggleLurking}
            handleChangeRole={handleChangeRole}
            onOpenTagModal={() => setShowTagModal(true)}
          />
        </div>

        <Hints
          maxHints={hintManager.MAX_HINTS}
          activeHints={hintManager.activeHints}
        />

        {isPresenter && (
          <PresenterHints
            handleAddCustomHint={handleAddCustomHint}
            handleDeleteHint={handleDeleteHint}
            handleGenerateHint={handleGenerateHint}
            handleToggleHint={handleToggleHint}
            hintManager={hintManager}
            maxHints={hintManager.MAX_HINTS}
            hasQuestion={questionManager.currentQuestion !== null}
            isGenerating={hintManager.isGenerating}
          />
        )}
      </div>

      <TagSelectionDrawer
        isOpen={showTagModal}
        availableTags={availableTags}
        selectedTags={selfUser.preferredTags ?? []}
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
          usersManager={userManager}
          onResetQuestions={handleResetQuestions}
          onRequestTagChange={() => {
            const userId = queueManager.getNextUserId();
            if (userId) {
              handleRequestTagChange(userId);
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
