import clsx from "clsx";
import { FaCrown } from "react-icons/fa";
import type { UserInfo } from "~/types/brunch-presenter.types";

interface UsersSectionProps {
  activeUsers: UserInfo[];
  isSelf: boolean;
}

interface UserProps {
  user: UserInfo;
  isSelf: boolean;
}

function User({ user, isSelf }: UserProps) {
  const { isLurking, name, image, role } = user;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
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

      <div className="flex-1 min-w-0">
        <div className="flex gap-2">
          {role === "presenter" && <FaCrown className="text-blue-400" />}
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
  );
}

export default function UsersSection({
  activeUsers,
  isSelf,
}: UsersSectionProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
        Active Users ({activeUsers.length})
      </h2>

      {activeUsers.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No active users
        </p>
      ) : (
        <div className="space-y-1">
          {activeUsers.map((user: UserInfo) => (
            <User key={user.name} user={user} isSelf={isSelf} />
          ))}
        </div>
      )}
    </div>
  );
}
