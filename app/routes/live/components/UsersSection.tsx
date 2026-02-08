import clsx from "clsx";
import { FaArrowRight, FaCrown } from "react-icons/fa";
import { HiTag } from "react-icons/hi";
import type {
  QueueUpdateMessage,
  UserInfo,
} from "workers/durableObjects/brunchRoom/types";

interface UsersSectionProps {
  activeUsers: UserInfo[];
  selfId: string | null;
  isPresenter: boolean;
  queueData: QueueUpdateMessage | null;
  onRequestTagChange: (userId: string) => void;
}

interface UserProps {
  user: UserInfo;
  isSelf: boolean;
  isPresenter: boolean;
  isNextInQueue: boolean;
  queuePosition: number | null;
  onRequestTagChange: (userId: string) => void;
}

function User({
  user,
  isSelf,
  isPresenter,
  isNextInQueue,
  queuePosition,
  onRequestTagChange,
}: UserProps) {
  const { isLurking, name, image, role, preferredTags } = user;

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 p-2 rounded-lg transition-colors",
        isNextInQueue
          ? "bg-blue-600/20 border border-blue-500/50"
          : "hover:bg-gray-700/50",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs border-2 border-gray-600">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {queuePosition !== null && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
              {queuePosition + 1}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-2 items-center">
            {role === "presenter" && (
              <FaCrown className="text-blue-400 text-xs" />
            )}
            {isNextInQueue && (
              <FaArrowRight className="text-blue-400 text-xs" />
            )}
            <p
              className={clsx(
                "text-sm font-medium truncate",
                isSelf ? "text-green-400" : "text-white",
              )}
            >
              {name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "w-1.5 h-1.5 rounded-full",
                isLurking ? "bg-red-500" : "bg-green-500",
              )}
            />
            <span className="text-xs text-gray-400 capitalize">{role}</span>
          </div>
        </div>
      </div>

      {isPresenter && role === "viewer" && preferredTags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-11">
          {preferredTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] bg-gray-700 text-gray-300 rounded-full flex items-center gap-1"
            >
              <HiTag className="w-2 h-2" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {isPresenter && role === "viewer" && !isLurking && (
        <button
          onClick={() => onRequestTagChange(user.id)}
          className="ml-11 text-[10px] text-blue-400 hover:text-blue-300 transition-colors text-left"
        >
          Request tag change
        </button>
      )}
    </div>
  );
}

export default function UsersSection({
  activeUsers,
  selfId,
  isPresenter,
  queueData,
  onRequestTagChange,
}: UsersSectionProps) {
  const getQueuePosition = (userId: string): number | null => {
    if (!queueData) return null;
    const index = queueData.queue.indexOf(userId);
    return index >= 0 ? index : null;
  };

  const isNextInQueue = (userId: string): boolean => {
    if (!queueData || queueData.queue.length === 0) return false;
    return queueData.queue[queueData.currentIndex] === userId;
  };

  const sortedUsers = [...activeUsers].sort((a, b) => {
    if (a.role === "presenter" && b.role !== "presenter") return -1;
    if (a.role !== "presenter" && b.role === "presenter") return 1;

    const aPos = getQueuePosition(a.id);
    const bPos = getQueuePosition(b.id);
    if (aPos !== null && bPos === null) return -1;
    if (aPos === null && bPos !== null) return 1;
    if (aPos !== null && bPos !== null) return aPos - bPos;

    return 0;
  });

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
        Active Users ({activeUsers.length})
      </h2>

      {queueData && queueData.queue.length > 0 && (
        <div className="mb-4 p-2 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-400">
            Queue: {queueData.queue.length} viewers
          </p>
        </div>
      )}

      {activeUsers.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No active users
        </p>
      ) : (
        <div className="space-y-1">
          {sortedUsers.map((user: UserInfo) => (
            <User
              key={user.id}
              user={user}
              isSelf={user.id === selfId}
              isPresenter={isPresenter}
              isNextInQueue={isNextInQueue(user.id)}
              queuePosition={getQueuePosition(user.id)}
              onRequestTagChange={onRequestTagChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
