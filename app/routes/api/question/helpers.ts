import type { FetcherWithComponents } from "react-router";

export async function createQuestion(
  title: string,
  content: string,
  tags: string[],
  fetcher: FetcherWithComponents<any>,
) {
  await fetcher.submit(
    {
      title: title,
      content: content,
      tags: JSON.stringify(tags),
    },
    { method: "post", action: "/api/question/create" },
  );
}

export async function updateQuestion(
  questionId: number,
  title: string,
  content: string,
  tags: string[],
  fetcher: FetcherWithComponents<any>,
) {
  await fetcher.submit(
    {
      title: title,
      content: content,
      tags: JSON.stringify(tags),
    },
    { method: "post", action: `/api/question/${questionId}/update` },
  );
}

export async function deleteQuestion(
  questionId: number,
  fetcher: FetcherWithComponents<any>,
) {
  await fetcher.submit(null, {
    method: "post",
    action: `/api/question/${questionId}/delete`,
  });
}

export async function voteQuestion(
  questionId: number,
  voteType: "upvote" | "downvote",
  fetcher: FetcherWithComponents<any>,
) {
  await fetcher.submit(
    { questionId: questionId, voteType: voteType },
    { method: "post", action: `/api/question/${questionId}/vote` },
  );
}
