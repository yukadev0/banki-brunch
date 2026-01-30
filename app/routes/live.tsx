import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import type { Route } from "./+types/live";

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await requireSession(context, request);
  return { user: session.user };
}

interface UserInfo {
  name: string;
  image?: string;
}

interface Message {
  type: "message" | "system" | "count" | "users";
  message?: string;
  value?: number;
  users?: UserInfo[];
  user?: UserInfo;
  timestamp: string;
}

export default function LivePage({ loaderData }: Route.ComponentProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeUsers, setActiveUsers] = useState<UserInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const username = loaderData.user.name;
  const userImage = loaderData.user.image;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/websocket`);

    ws.addEventListener("open", () => {
      setIsConnected(true);

      // Send identification message with user info
      ws.send(
        JSON.stringify({
          type: "identify",
          name: username,
          image: userImage,
        }),
      );
    });

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as Message;

        if (data.type === "users") {
          // Update active users list
          setActiveUsers(data.users || []);
        } else {
          // Add to messages
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            type: "message",
            message: event.data,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    });

    ws.addEventListener("close", () => {
      setIsConnected(false);
    });

    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [username, userImage]);

  const handleSendMessage = () => {
    if (socket && isConnected && inputValue.trim()) {
      socket.send(
        JSON.stringify({
          type: "message",
          message: inputValue,
        }),
      );
      setInputValue("");
    }
  };

  const handleIncreaseCount = () => {
    if (socket && isConnected) {
      socket.send(
        JSON.stringify({
          type: "message",
          message: `${username} increased the count`,
        }),
      );
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col items-center justify-center gap-8 py-12 px-4">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <h1 className="text-4xl font-semibold text-center text-white">
        WebSocket Chat - {username}
      </h1>

      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="flex gap-4 w-full max-w-4xl">
        <div className="flex-1 bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto">
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
                  className={`rounded px-3 py-2 text-sm ${
                    msg.type === "system"
                      ? "bg-gray-900 text-gray-400 italic text-center"
                      : msg.type === "count"
                        ? "bg-purple-900/50 text-purple-200 text-center"
                        : "bg-gray-700"
                  }`}
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
      </div>

      <div className="flex gap-2 w-full max-w-4xl">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !inputValue.trim()}
          className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg transition transform shadow-md"
        >
          Send
        </button>
      </div>

      <button
        onClick={handleIncreaseCount}
        disabled={!isConnected}
        className="bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition transform shadow-md"
      >
        Increase Count
      </button>
    </div>
  );
}
