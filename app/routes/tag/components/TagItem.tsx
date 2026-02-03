import { useCallback } from "react";
import { useFetcher } from "react-router";
import { deleteTag } from "~/routes/api/tag/helpers";

type Props = {
  tag: string;
};

export function TagItem({ tag }: Props) {
  const fetcher = useFetcher();

  const onDeleteTag = useCallback(() => {
    deleteTag(tag, fetcher);
  }, [tag]);

  return (
    <span>
      <button
        onClick={onDeleteTag}
        className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
      >
        {tag}
      </button>
    </span>
  );
}
