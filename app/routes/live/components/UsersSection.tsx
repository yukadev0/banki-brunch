import clsx from "clsx";
import { HiEye, HiEyeOff, HiMicrophone, HiVolumeUp } from "react-icons/hi";
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
  const { isLurking, name, image, role } = user;

  const handleToggleLurking = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "toggle_lurking",
        }),
      );
    }
  };

  const handleChangeRole = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "change_role",
        }),
      );
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors">
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
      <div className="flex flex-col gap-2 text-center">
        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              "text-sm font-medium truncate",
              isSelf ? "font-semibold text-green-400" : "text-white",
            )}
          >
            {name}
          </p>
          <div className="flex items-center justify-center gap-1">
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
          <span className="text-xs text-gray-400">{role}</span>
        </div>
        {isSelf && (
          <div className="flex flex-row gap-2 ml-2">
            <button
              onClick={handleToggleLurking}
              title={
                isLurking ? "Switch to active mode" : "Switch to lurking mode"
              }
              className={clsx(
                "px-3 py-1.5 text-xs rounded-md font-medium transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md",
                isLurking
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white",
              )}
            >
              {isLurking ? (
                <>
                  <HiVolumeUp className="w-4 h-4" />
                  <span>Listen</span>
                </>
              ) : (
                <>
                  <HiEyeOff className="w-4 h-4" />
                  <span>Lurk</span>
                </>
              )}
            </button>
            <button
              onClick={handleChangeRole}
              title={
                role === "presenter"
                  ? "Switch to viewer mode"
                  : "Become a presenter"
              }
              className={clsx(
                "px-3 py-1.5 text-xs rounded-md font-medium transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md",
                role === "presenter"
                  ? "bg-purple-500 hover:bg-purple-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white",
              )}
            >
              {role === "presenter" ? (
                <>
                  <HiEye className="w-4 h-4" />
                  <span>Viewer</span>
                </>
              ) : (
                <>
                  <HiMicrophone className="w-4 h-4" />
                  <span>Presenter</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersSection({
  activeUsers,
  self,
  socket,
}: UsersSectionProps) {
  return (
    <div className="basis-80 bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto shrink-0">
      <h2 className="text-lg font-semibold mb-4 sticky -top-4 bg-gray-800 p-2 border-b border-gray-700">
        Active Users ({activeUsers.length})
      </h2>
      {activeUsers.length === 0 ? (
        <p className="text-gray-500 text-sm">No active users</p>
      ) : (
        <div className="space-y-2">
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
