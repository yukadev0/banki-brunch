import type { PollUpdateMessage } from "~/types/brunch-presenter.types";

interface Props {
  option: string;
  pollData: PollUpdateMessage;
  onCastVote: (option: string) => void;
}

export default function Option({ option, pollData, onCastVote }: Props) {
  const count = pollData.votes[option] || 0;
  const isSelected = pollData.userVote === option;

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const percentage = getPercentage(count, pollData.totalVotes);

  return (
    <button
      onClick={() => onCastVote(option)}
      className={`relative overflow-hidden p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? "border-blue-500 bg-blue-500/10"
          : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
      }`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-bold text-white">{option}</span>
          <span className="text-sm text-gray-400">{percentage}%</span>
        </div>
        <div className="text-sm text-gray-400">{count} votes</div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-1 bg-blue-500/30 transition-all"
        style={{ width: `${percentage}%` }}
      />
    </button>
  );
}
