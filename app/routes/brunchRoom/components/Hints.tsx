import clsx from "clsx";
import { useState } from "react";
import { FaChevronDown, FaLightbulb } from "react-icons/fa6";
import type { HintInfo } from "workers/durableObjects/brunchRoom/types";

type Props = {
  maxHints: number;
  activeHints: HintInfo[];
};

export default function Hints({ activeHints, maxHints }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <FaLightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-white">Hints</h3>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
            {activeHints.length}/{maxHints}
          </span>
        </div>
        <FaChevronDown
          className={clsx(
            "w-5 h-5 text-gray-400 transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      <div
        className={clsx(
          "flex flex-col gap-3 transition-[max-height,margin,opacity] overflow-hidden",
          isExpanded
            ? "max-h-500 opacity-100 mt-3 pointer-events-auto select-auto"
            : "max-h-0 opacity-0 pointer-events-none select-none",
        )}
      >
        {activeHints.length > 0 ? (
          activeHints.map((hint, index) => (
            <div
              key={hint.id}
              className="bg-gray-900/50 rounded-lg p-4 border border-gray-600/50"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="text-gray-300 leading-relaxed flex-1 wrap-anywhere">
                  {hint.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No hints available.</p>
        )}
      </div>
    </div>
  );
}
