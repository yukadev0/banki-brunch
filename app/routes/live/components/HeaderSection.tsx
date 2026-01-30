import clsx from "clsx";

interface Props {
  isConnected: boolean;
  name: string;
}

export default function HeaderSection({ isConnected, name }: Props) {
  return (
    <>
      <h1 className="text-4xl font-semibold text-center text-white">
        WebSocket Chat - {name}
      </h1>

      <div className="flex items-center gap-2">
        <div
          className={clsx(
            "w-3 h-3 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500",
          )}
        />
        <span className="text-sm">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </>
  );
}
