import { useState } from "react";
import { Link } from "react-router";
import type {
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
    socket,
    selfUser,
    readyState,
    hintManager,
    pollManager,
    sendMessage,
    userManager,
    queueManager,
    targetUserName,
    isSelfPresenter,
    questionManager,
    handleRequestEndPoll,
    handleRequestCastVote,
    handleRequestSkipUser,
    handleRequestQuestion,
    handleRequestStartPoll,
    handleRequestTagChange,
    handleRequestDeleteHint,
    handleRequestChangeRole,
    handleRequestGenerateHint,
    handleRequestAddCustomHint,
    handleRequestToggleLurking,
    handleRequestResetQuestions,
    handleRequestSetTagPreferences,
    handleRequestToggleHintVisibility,
  } = useBrunchRoomApp(user, {
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

  const [showTagModal, setShowTagModal] = useState(false);
  const [showTagChangeRequest, setShowTagChangeRequest] = useState(false);
  const [showNoMatchingQuestionModal, setShowNoMatchingQuestionModal] =
    useState(false);

  const { toasts, addToast, removeToast } = useToast();

  function handleSendEmote() {
    sendMessage(
      JSON.stringify({
        type: "request_reaction",
        reaction: "like",
        userId: user.id,
      }),
    );
  }

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
            selfId={selfUser.id}
            isPresenter={isSelfPresenter}
            queueData={queueManager.queueData}
            activeUsers={userManager.getUsers()}
            onRequestTagChange={handleRequestTagChange}
            getQueuePosition={(userId: UserId) =>
              queueManager.getQueuePosition(userId)
            }
            isNextInQueue={(userId: UserId) =>
              queueManager.isNextInQueue(userId)
            }
          />

          <QuestionSection
            isPresenter={isSelfPresenter}
            pollData={pollManager.pollData}
            pollEnded={pollManager.isEnded}
            onEndPoll={handleRequestEndPoll}
            onCastVote={handleRequestCastVote}
            onStartPoll={handleRequestStartPoll}
            onGetQuestion={handleRequestQuestion}
            targetUserName={targetUserName || null}
            question={questionManager.currentQuestion}
          />

          <ControlPanel
            user={selfUser}
            handleSendEmote={handleSendEmote}
            handleChangeRole={handleRequestChangeRole}
            onOpenTagModal={() => setShowTagModal(true)}
            handleToggleLurking={handleRequestToggleLurking}
          />
        </div>

        <Hints
          maxHints={hintManager.MAX_HINTS}
          activeHints={hintManager.activeHints}
        />

        {isSelfPresenter && (
          <PresenterHints
            hintManager={hintManager}
            maxHints={hintManager.MAX_HINTS}
            isGenerating={hintManager.isGenerating}
            handleDeleteHint={handleRequestDeleteHint}
            handleGenerateHint={handleRequestGenerateHint}
            handleAddCustomHint={handleRequestAddCustomHint}
            handleToggleHint={handleRequestToggleHintVisibility}
            hasQuestion={questionManager.currentQuestion !== null}
          />
        )}
      </div>

      <TagSelectionDrawer
        isOpen={showTagModal}
        availableTags={availableTags}
        onConfirm={(tags: string[]) => {
          setStoredTags(tags);
          setShowTagModal(false);
          setShowTagChangeRequest(false);
          handleRequestSetTagPreferences(tags);
        }}
        onClose={() => {
          setShowTagModal(false);
          setShowTagChangeRequest(false);
        }}
        selectedTags={selfUser.preferredTags ?? []}
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

      {showNoMatchingQuestionModal && isSelfPresenter && (
        <NoMatchingQuestionSheet
          usersManager={userManager}
          queueManager={queueManager}
          onResetQuestions={() => {
            handleRequestResetQuestions(() =>
              setShowNoMatchingQuestionModal(false),
            );
          }}
          onRequestTagChange={() => {
            const userId = queueManager.getNextUserId();
            if (userId) {
              handleRequestTagChange(userId);
            }
            setShowNoMatchingQuestionModal(false);
          }}
          onClose={() => setShowNoMatchingQuestionModal(false)}
          onSkipUser={() => {
            handleRequestSkipUser(() => setShowNoMatchingQuestionModal(false));
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
