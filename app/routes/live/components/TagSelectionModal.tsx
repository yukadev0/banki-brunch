import clsx from "clsx";
import { useState } from "react";
import { HiCheck, HiX } from "react-icons/hi";

interface Props {
  isOpen: boolean;
  availableTags: string[];
  selectedTags: string[];
  onConfirm: (tags: string[]) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function TagSelectionModal({
  isOpen,
  availableTags,
  selectedTags: initialSelectedTags,
  onConfirm,
  onClose,
  title = "Select Your Preferred Tags",
  description = "Choose the topics you're interested in. Questions will be prioritized based on your selections.",
}: Props) {
  const [selectedTags, setSelectedTags] =
    useState<string[]>(initialSelectedTags);

  if (!isOpen) return null;

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedTags);
  };

  const handleSkip = () => {
    onConfirm([]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        </div>

        <div className="p-6">
          {availableTags.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tags available</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      isSelected
                        ? "bg-blue-600 text-white border-2 border-blue-500"
                        : "bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500",
                    )}
                  >
                    {isSelected && <HiCheck className="w-4 h-4" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {selectedTags.length > 0 && (
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Selected:</p>
              <p className="text-sm text-blue-400">{selectedTags.join(", ")}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Confirm {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
