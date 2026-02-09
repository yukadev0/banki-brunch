import { useEffect, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import type { Identify } from "workers/durableObjects/brunchRoom/types";
import BrunchRoomApp, { type BrunchRoomAppOptions } from "../BrunchRoomApp";

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

export default function useBrunchRoomApp(
  user: {
    id: string;
    name: string;
    image: string | null | undefined;
  },
  options?: BrunchRoomAppOptions,
) {
  const appRef = useRef<BrunchRoomApp | null>(null);

  if (!appRef.current) {
    appRef.current = new BrunchRoomApp(user.id, options);
  }

  const app = appRef.current;

  const [url, setUrl] = useState<string | null>(null);
  const webSocketHook = useWebSocket(url, {
    onMessage: app.onWebSocketMessage,
    onOpen: () => {
      const data: Identify = {
        type: "identify",
        id: user.id,
        name: user.name,
        image: user.image || null,
        preferredTags: getStoredTags(),
      };
      sendMessage(JSON.stringify(data));
    },
  });

  app.setWebSocketHook(webSocketHook);

  const { sendMessage, getWebSocket, readyState } = webSocketHook;

  const userManager = app.getUserManager();
  const questionManager = app.getQuestionManager();

  const selfUser = userManager.getSelfUser();
  const isSelfPresenter = !!selfUser && selfUser.role === "presenter";

  const targetUserName = questionManager.forUserId
    ? userManager.getUserInfo(questionManager.forUserId)?.name
    : null;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    setUrl(`${protocol}://${window.location.host}/websocket`);
  }, []);

  const pollManager = app.getPollManager();
  const hintManager = app.getHintManager();
  const queueManager = app.getQueueManager();

  return {
    selfUser,
    readyState,
    userManager,
    targetUserName,
    isSelfPresenter,
    questionManager,

    socket: getWebSocket(),
    pollManager,
    hintManager,
    queueManager,

    handleRequestSkipUser: queueManager.handleRequestSkipUser,

    handleRequestQuestion: questionManager.handleRequestQuestion,
    handleRequestResetQuestions: questionManager.handleRequestResetQuestions,

    handleRequestEndPoll: pollManager.handleRequestEndPoll,
    handleRequestCastVote: pollManager.handleRequestCastVote,
    handleRequestStartPoll: pollManager.handleRequestStartPoll,

    handleRequestToggleHintVisibility:
      hintManager.handleRequestToggleHintVisibility,
    handleRequestDeleteHint: hintManager.handleRequestDeleteHint,
    handleRequestGenerateHint: hintManager.handleRequestGenerateHint,
    handleRequestAddCustomHint: hintManager.handleRequestAddCustomHint,

    handleRequestChangeRole: userManager.handleRequestChangeRole,
    handleRequestTagChange: userManager.handleRequestTagChange,
    handleRequestToggleLurking: userManager.handleRequestToggleLurking,
    handleRequestSetTagPreferences: userManager.handleRequestSetTagPreferences,
  };
}
