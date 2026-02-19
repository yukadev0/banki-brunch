import clsx from "clsx";
import {
  HiEye,
  HiEyeOff,
  HiMicrophone,
  HiTag,
  HiVolumeUp,
} from "react-icons/hi";
import type { UserInfo } from "workers/durableObjects/brunchRoom/types";

type Props = {
  user: UserInfo | null;

  onOpenTagModal: () => void;
  handleSendEmote: () => void;
  handleChangeRole: () => void;
  handleToggleLurking: () => void;
};

export default function ControlPanel({
  user,
  onOpenTagModal,
  handleSendEmote,
  handleChangeRole,
  handleToggleLurking,
}: Props) {
  if (!user) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 text-sm text-center">Loading...</p>
      </div>
    );
  }

  const { preferredTags, isLurking, role } = user;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex-1">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
        Your Controls
      </h3>

      <div className="space-y-3">
        <button
          onClick={onOpenTagModal}
          className={clsx(
            "w-full px-4 py-3 cursor-pointer rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2",
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
          title={isLurking ? "Switch to active mode" : "Switch to lurking mode"}
          className={clsx(
            "w-full px-4 py-3 cursor-pointer rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2",
            isLurking
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white",
          )}
        >
          {isLurking ? (
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
          title={
            role === "presenter"
              ? "Switch to viewer mode"
              : "Become a presenter"
          }
          className={clsx(
            "w-full px-4 py-3 cursor-pointer rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2",
            role === "presenter"
              ? "bg-purple-500 hover:bg-purple-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white",
          )}
        >
          {role === "presenter" ? (
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
        <button
          onClick={handleSendEmote}
          className="w-full px-4 py-3 cursor-pointer rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
        >
          Send Emote
        </button>
      </div>
    </div>
  );
}
