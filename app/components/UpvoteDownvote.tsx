interface UpvoteDownvoteProps {
  display: number;
  onUpvoteClick: () => void;
  onDownvoteClick: () => void;
  state: "unvoted" | "upvoted" | "downvoted";
}

export default function UpvoteDownvote({
  state,
  display,
  onUpvoteClick,
  onDownvoteClick,
}: UpvoteDownvoteProps) {
  const upvoted = state === "upvoted";
  const downvoted = state === "downvoted";

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <button
        onClick={onUpvoteClick}
        aria-label="Upvote"
        className={`transition-colors
          ${upvoted ? "text-green-500" : "text-gray-400 hover:text-green-400"}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={upvoted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      {/* SCORE */}
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

      {/* DOWNVOTE */}
      <button
        onClick={onDownvoteClick}
        aria-label="Downvote"
        className={`transition-colors
          ${downvoted ? "text-red-500" : "text-gray-400 hover:text-red-400"}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={downvoted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  );
}
