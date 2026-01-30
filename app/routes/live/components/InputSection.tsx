import clsx from "clsx";
import { useState } from "react";

interface Props {
  isConnected: boolean;
  handleSendMessage: (message: string) => void;
}

export default function InputSection({
  isConnected,
  handleSendMessage,
}: Props) {
  const [inputValue, setInputValue] = useState("");

  const submit = () => {
    if (!inputValue.trim()) return;
    handleSendMessage(inputValue);
    setInputValue("");
  };

  return (
    <div className="flex gap-2 w-full max-w-4xl">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
        disabled={!isConnected}
      />
      <button
        onClick={submit}
        disabled={!isConnected || !inputValue.trim()}
        className={clsx(
          "bg-blue-500 text-white px-6 py-2 rounded-lg transition transform shadow-md",
          "hover:bg-blue-600",
          "disabled:bg-gray-600 disabled:cursor-not-allowed",
        )}
      >
        Send
      </button>
    </div>
  );
}
