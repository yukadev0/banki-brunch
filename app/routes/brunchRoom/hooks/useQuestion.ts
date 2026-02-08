import { useState } from "react";
import type {
  ClientQuestionInfo,
  ServerMessage,
} from "workers/durableObjects/brunchRoom/types";

export type QuestionManager = ReturnType<typeof useQuestion>;

export default function useQuestion() {
  const [currentQuestion, setCurrentQuestion] =
    useState<ClientQuestionInfo | null>(null);
  const [forUserId, setForUserId] = useState<string | null>(null);

  function handleMessage(data: ServerMessage) {
    switch (data.type) {
      case "targeted_question":
        setForUserId(data.userId);
        setCurrentQuestion(data.question);
        break;
      case "question":
        setForUserId(null);
        setCurrentQuestion(data.question);
        break;
    }
  }

  return {
    forUserId,
    setForUserId,
    handleMessage,
    currentQuestion,
    setCurrentQuestion,
  };
}
