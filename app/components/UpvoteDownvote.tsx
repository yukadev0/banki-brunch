import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface UpvoteDownvoteProps {
  display: number;
  onUpvoteClick: () => void;
  onDownvoteClick: () => void;
  state: "unvote" | "upvote" | "downvote";
}

export default function UpvoteDownvote({
  state,
  display,
  onUpvoteClick,
  onDownvoteClick,
}: UpvoteDownvoteProps) {
  const upvoted = state === "upvote";
  const downvoted = state === "downvote";

  return (
    <div className="flex flex-col items-center gap-2 select-none w-6">
      <button
        onClick={onUpvoteClick}
        aria-label="Upvote"
        className={`transition-colors w-full
          ${upvoted ? "text-green-500" : "text-gray-400 hover:text-green-400"}
        `}
      >
        <FiChevronUp className="w-full h-full" />
      </button>

      <span
        className={`min-w-[2ch] text-center font-medium
          ${
            upvoted
              ? "text-green-400"
              : downvoted
                ? "text-red-400"
                : "text-gray-400"
          }
        `}
      >
        {display}
      </span>

      <button
        onClick={onDownvoteClick}
        aria-label="Downvote"
        className={`transition-colors w-full
          ${downvoted ? "text-red-500" : "text-gray-400 hover:text-red-400"}
        `}
      >
        <FiChevronDown className="w-full h-full" />
      </button>
    </div>
  );
}
