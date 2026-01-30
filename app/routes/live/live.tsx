import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import type {
  ClientQuestionInfo,
  IdentifyMessage,
  ServerMessage,
  UserInfo,
} from "~/types/brunch-presenter.types";
import type { Route } from "./+types/live";
import ControlPanel from "./components/ControlPanel";
import HeaderSection from "./components/HeaderSection";
import QuestionSection from "./components/QuestionSection";
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
  const [activeUsers, setActiveUsers] = useState<UserInfo[]>([]);
  const [self, setSelf] = useState<UserInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] =
    useState<ClientQuestionInfo | null>(null);
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
          setSelf(data.users.find((u) => u.id === user.id) || null);
        } else if (data.type === "duplicate_session") {
          navigate("/");
        } else if (data.type === "question") {
          setCurrentQuestion(data.question);
        }
      } catch (err) {}
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

  const handleGetQuestion = () => {
    if (self?.role === "presenter") {
      socket?.send(JSON.stringify({ type: "get_question" }));
    }
  };

  return (
    <div className="min-h-screen py-6">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <div className="max-w-7xl mx-auto">
        <HeaderSection name={user.name} />

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-2 mt-8">
          <UsersSection
            activeUsers={activeUsers}
            isSelf={self?.id === user.id}
          />

          <div className="flex flex-col gap-6 shrink-0">
            <QuestionSection
              isPresenter={self?.role === "presenter"}
              question={currentQuestion}
              onGetQuestion={handleGetQuestion}
            />
          </div>

          <ControlPanel user={self} socket={socket} isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
}
