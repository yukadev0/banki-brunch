import clsx from "clsx";
import { useCallback, useEffect, useRef } from "react";
import type { ServerMessage } from "~/types/brunch-presenter";

interface Props {
  messages: Exclude<ServerMessage, { type: "users" }>[];
}

export default function MessagesSection({ messages }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto no-scrollbar">
      <h2 className="text-lg font-semibold mb-4 sticky -top-4 bg-gray-800 p-2">
        Messages:
      </h2>
      {messages.length === 0 ? (
        <p className="text-gray-500 text-sm">No messages yet...</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={clsx(
                "rounded px-3 py-2 transition animate-chat-message-fade-in text-sm",
                {
                  "bg-gray-900 text-gray-400 italic text-center":
                    msg.type === "system",
                  "bg-purple-900/50 text-purple-200 text-center":
                    msg.type === "count",
                  "bg-gray-700": msg.type !== "system" && msg.type !== "count",
                },
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="wrap-break-word flex-1">
                  {msg.type === "count" ? (
                    `Count updated to: ${msg.value}`
                  ) : msg.type === "message" && msg.user ? (
                    <>
                      <span className="font-semibold text-blue-400">
                        {msg.user.name}:{" "}
                      </span>
                      {msg.message}
                    </>
                  ) : (
                    msg.message
                  )}
                </span>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
