import clsx from "clsx";
import { useEffect, useState } from "react";
import { HiCheck, HiX } from "react-icons/hi";

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  selectedTags: string[];
  availableTags: string[];
  onClose: () => void;
  onConfirm: (tags: string[]) => void;
}

export default function TagSelectionDrawer({
  isOpen,
  onClose,
  onConfirm,
  availableTags,
  selectedTags: initialSelectedTags,
  title = "Select Your Preferred Tags",
  description = "Choose the topics you're interested in. Questions will be prioritized based on your selections.",
}: Props) {
  const [selectedTags, setSelectedTags] =
    useState<string[]>(initialSelectedTags);

  useEffect(() => {
    setSelectedTags(initialSelectedTags);
  }, [initialSelectedTags, isOpen]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  return (
    <div className={isOpen ? "pointer-events-auto" : "pointer-events-none"}>
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <div
        className={clsx(
          "fixed inset-y-0 right-0 w-full max-w-md bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="p-6 border-b border-gray-700 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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
        </div>

        <div className="p-6 border-t border-gray-700 space-y-3">
          <button
            onClick={() => {
              onConfirm(selectedTags);
            }}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Confirm {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>
          <button
            onClick={() => {
              onConfirm([]);
            }}
            className="w-full px-4 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
