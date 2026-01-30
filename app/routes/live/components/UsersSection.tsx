import type { UserInfo } from "~/types/brunch-presenter";

interface Props {
  activeUsers: UserInfo[];
}

export default function UsersSection({ activeUsers }: Props) {
  return (
    <div className="w-64 bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto flexshrink-0">
      <h2 className="text-lg font-semibold mb-4 sticky -top-4 bg-gray-800 p-2 border-b border-gray-700">
        Active Users ({activeUsers.length})
      </h2>
      {activeUsers.length === 0 ? (
        <p className="text-gray-500 text-sm">No active users</p>
      ) : (
        <div className="space-y-3">
          {activeUsers.map((user, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-400">Online</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
