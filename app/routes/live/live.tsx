import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import type {
  DisplayMessage,
  IdentifyMessage,
  ServerMessage,
  UserInfo,
} from "~/types/brunch-presenter.types";
import type { Route } from "./+types/live";
import HeaderSection from "./components/HeaderSection";
import InputSection from "./components/InputSection";
import MessagesSection from "./components/MessagesSection";
import UsersSection from "./components/UsersSection";

export function meta() {
  return [{ title: "Live room" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await requireSession(context, request);
  return { user: session.user };
}

export default function LivePage({ loaderData }: Route.ComponentProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserInfo[]>([]);
  const navigate = useNavigate();

  const { user } = loaderData;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/websocket`);

    ws.addEventListener("open", () => {
      setIsConnected(true);

      const data: IdentifyMessage = {
        type: "identify",
        id: user.id,
        name: user.name,
        image: user.image,
      };
      ws.send(JSON.stringify(data));
    });

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;

        if (data.type === "users") {
          setActiveUsers(data.users || []);
        } else if (data.type === "duplicate_session") {
          navigate("/");
        } else {
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        const fallbackMessage: ServerMessage = {
          type: "message",
          message: event.data,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
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
  }, []);

  const handleSendMessage = useCallback(
    (message: string) => {
      if (socket && isConnected && message.trim()) {
        socket.send(
          JSON.stringify({
            type: "message",
            message: message,
          }),
        );
      }
    },
    [socket, isConnected],
  );

  return (
    <div className="min-h-screen text-gray-100 flex flex-col items-center justify-center gap-8 py-12 px-4">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <HeaderSection isConnected={isConnected} name={user.name} />

      <div className="flex gap-4 w-full max-w-4xl">
        <MessagesSection messages={messages} />
        <UsersSection activeUsers={activeUsers} self={user} socket={socket} />
      </div>

      <InputSection
        handleSendMessage={handleSendMessage}
        isConnected={isConnected}
      />
    </div>
  );
}
