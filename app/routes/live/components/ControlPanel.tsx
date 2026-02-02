import clsx from "clsx";
import { HiEye, HiEyeOff, HiMicrophone, HiTag, HiVolumeUp } from "react-icons/hi";
import type { UserInfo } from "~/types/brunch-presenter.types";

interface Props {
  user: UserInfo | null;
  socket: WebSocket | null;
  isConnected: boolean;
  preferredTags: string[];
  onOpenTagModal: () => void;
}

export default function ControlPanel({
  user,
  socket,
  isConnected,
  preferredTags,
  onOpenTagModal,
}: Props) {
  const handleToggleLurking = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "toggle_lurking" }));
    }
  };

  const handleChangeRole = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "change_role" }));
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 text-sm text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
        Your Controls
      </h3>

      <div className="space-y-3">
        {/* Tag Preferences Button */}
        <button
          onClick={onOpenTagModal}
          disabled={!isConnected}
          className={clsx(
            "w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            preferredTags.length > 0
              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300",
          )}
        >
          <HiTag className="w-5 h-5" />
          <span>
            {preferredTags.length > 0
              ? `Tags (${preferredTags.length})`
              : "Set Tag Preferences"}
          </span>
        </button>

        {/* Show selected tags */}
        {preferredTags.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 bg-gray-900/50 rounded-lg">
            {preferredTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-indigo-600/30 text-indigo-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleToggleLurking}
          disabled={!isConnected}
          title={
            user.isLurking ? "Switch to active mode" : "Switch to lurking mode"
          }
          className={clsx(
            "w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            user.isLurking
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white",
          )}
        >
          {user.isLurking ? (
            <>
              <HiVolumeUp className="w-5 h-5" />
              <span>Listen</span>
            </>
          ) : (
            <>
              <HiEyeOff className="w-5 h-5" />
              <span>Lurk</span>
            </>
          )}
        </button>

        <button
          onClick={handleChangeRole}
          disabled={!isConnected}
          title={
            user.role === "presenter"
              ? "Switch to viewer mode"
              : "Become a presenter"
          }
          className={clsx(
            "w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            user.role === "presenter"
              ? "bg-purple-500 hover:bg-purple-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white",
          )}
        >
          {user.role === "presenter" ? (
            <>
              <HiEye className="w-5 h-5" />
              <span>Viewer</span>
            </>
          ) : (
            <>
              <HiMicrophone className="w-5 h-5" />
              <span>Presenter</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <div
            className={clsx(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500",
            )}
          />
          <span className="text-gray-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </div>
  );
}
