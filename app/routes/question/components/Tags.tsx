import clsx from "clsx";
import { useCallback, type Dispatch, type SetStateAction } from "react";

interface Props {
  selectedTags: string[];
  allTags: { id: number; name: string }[];
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
}

export default function Tags({
  allTags,
  selectedTags,
  setSelectedTags,
}: Props) {
  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Tags *</label>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag.name}
            type="button"
            onClick={() => toggleTag(tag.name)}
            className={clsx(
              "px-3 py-1 rounded-full text-sm transition",
              selectedTags.includes(tag.name)
                ? "bg-blue-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600",
            )}
          >
            {tag.name}
          </button>
        ))}

        {selectedTags.map((tag) => (
          <input type="hidden" name="tags" value={tag} key={tag} />
        ))}
      </div>
    </div>
  );
}
