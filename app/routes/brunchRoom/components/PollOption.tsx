import type { PollUpdateMessage } from "workers/durableObjects/brunchRoom/types";

type Props = {
  option: string;
  pollData: PollUpdateMessage;
  pollEnded: boolean;
  onCastVote: (option: string) => void;
};

export default function PollOption({
  option,
  pollData,
  onCastVote,
  pollEnded,
}: Props) {
  const count = pollData.votes[option] || 0;
  const isSelected = pollData.userVote === option;

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const percentage = getPercentage(count, pollData.totalVotes);

  return (
    <button
      disabled={pollEnded}
      onClick={() => onCastVote(option)}
      className={`relative overflow-hidden p-4 rounded-lg border-2 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50 ${
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
        className="absolute bottom-0 left-0 h-1 bg-blue-500/30 transition-[width] duration-300"
        style={{ width: `${percentage}%` }}
      />
    </button>
  );
}
