import { useRef } from "react";
import BrunchRoomApp, { type BrunchRoomAppOptions } from "../BrunchRoomApp";

export default function useBrunchRoomApp(
  userId: string,
  options?: BrunchRoomAppOptions,
) {
  const ref = useRef<BrunchRoomApp | null>(null);

  if (!ref.current) {
    ref.current = new BrunchRoomApp(userId, options);
  }

  const userManager = ref.current.getUserManager();
  const questionManager = ref.current.getQuestionManager();

  const selfUser = userManager.getSelfUser();
  const isPresenter = !!selfUser && selfUser.role === "presenter";

  const targetUserName = questionManager.forUserId
    ? userManager.getUserInfo(questionManager.forUserId)?.name
    : null;

  return {
    selfUser,
    isPresenter,
    userManager,
    targetUserName,
    questionManager,

    pollManager: ref.current.getPollManager(),
    hintManager: ref.current.getHintManager(),
    queueManager: ref.current.getQueueManager(),

    onWebSocketMessage: ref.current.onWebSocketMessage,
  };
}
