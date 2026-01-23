import type { FetcherWithComponents } from "react-router";

export async function createTag(
  name: string,
  fetcher: FetcherWithComponents<any>,
) {
  await fetcher.submit(
    { name: name },
    { method: "post", action: "/api/tag/create" },
  );
}

export async function deleteTag(
  name: string,
  fetcher: FetcherWithComponents<any>,
) {
  await fetcher.submit(null, {
    method: "post",
    action: `/api/tag/${name}/delete`,
  });
}
