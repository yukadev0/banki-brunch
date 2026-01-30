import clsx from "clsx";
import type { UserInfo } from "~/types/brunch-presenter.types";

interface UsersSectionProps {
  activeUsers: UserInfo[];
  self: { id: string };
  socket: WebSocket | null;
}

interface UserProps {
  user: UserInfo;
  isSelf: boolean;
  socket: WebSocket | null;
}

function User({ user, isSelf, socket }: UserProps) {
  const { isLurking, name, image } = user;

  const handleToggleLurking = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "toggle_lurking",
        }),
      );
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-600">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "text-sm font-medium truncate",
            isSelf ? "font-semibold text-green-400" : "text-white",
          )}
        >
          {name}
        </p>
        <div className="flex items-center gap-1">
          <div
            className={clsx(
              "w-2 h-2 rounded-full",
              isLurking ? "bg-red-500" : "bg-green-500",
            )}
          />
          <span className="text-xs text-gray-400">
            {isLurking ? "Lurking" : "Active"}
          </span>
        </div>
      </div>
      {isSelf && (
        <button
          onClick={handleToggleLurking}
          className={clsx(
            "px-2 py-1 text-xs rounded font-medium transition-colors",
            isLurking
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white",
          )}
        >
          {isLurking ? "Listen" : "Lurk"}
        </button>
      )}
    </div>
  );
}

export default function UsersSection({
  activeUsers,
  self,
  socket,
}: UsersSectionProps) {
  return (
    <div className="w-64 bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto flexshrink-0">
      <h2 className="text-lg font-semibold mb-4 sticky -top-4 bg-gray-800 p-2 border-b border-gray-700">
        Active Users ({activeUsers.length})
      </h2>
      {activeUsers.length === 0 ? (
        <p className="text-gray-500 text-sm">No active users</p>
      ) : (
        <div className="space-y-3">
          {activeUsers.map((user: UserInfo) => (
            <User
              key={user.name}
              user={user}
              isSelf={user.id === self.id}
              socket={socket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
