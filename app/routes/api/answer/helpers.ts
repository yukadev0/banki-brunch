import type { FetcherWithComponents } from "react-router";

export async function createAnswer(
  content: string,
  questionId: number,
  fetcher: FetcherWithComponents<any>,
) {
  fetcher.submit(
    { content: content, questionId: questionId },
    { method: "post", action: `/api/answer/create` },
  );
}

export async function updateAnswer(
  content: string,
  answerId: number,
  questionId: number,
  fetcher: FetcherWithComponents<any>,
) {
  fetcher.submit(
    { content: content, questionId: questionId },
    { method: "post", action: `/api/answer/${answerId}/update` },
  );
}

export async function deleteAnswer(
  answerId: number,
  fetcher: FetcherWithComponents<any>,
) {
  fetcher.submit(null, {
    method: "post",
    action: `/api/answer/${answerId}/delete`,
  });
}

export async function voteAnswer(
  answerId: number,
  questionId: number,
  voteType: "upvote" | "downvote",
  fetcher: FetcherWithComponents<any>,
) {
  fetcher.submit(
    { answerId: answerId, questionId: questionId, voteType: voteType },
    { method: "post", action: `/api/answer/${answerId}/vote` },
  );
}
