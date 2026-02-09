import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  HiCheckCircle,
  HiExclamation,
  HiInformationCircle,
  HiX,
} from "react-icons/hi";

type Toast = {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
};

type ToastContainerProps = {
  toasts: Toast[];
  onRemove: (id: string) => void;
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const iconMap = {
    info: <HiInformationCircle className="w-5 h-5 text-blue-400" />,
    success: <HiCheckCircle className="w-5 h-5 text-green-400" />,
    warning: <HiExclamation className="w-5 h-5 text-amber-400" />,
    error: <HiX className="w-5 h-5 text-red-400" />,
  };

  const bgMap = {
    info: "bg-blue-900/90 border-blue-500/50",
    success: "bg-green-900/90 border-green-500/50",
    warning: "bg-amber-900/90 border-amber-500/50",
    error: "bg-red-900/90 border-red-500/50",
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm max-w-md transition duration-300",
        bgMap[toast.type],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      {iconMap[toast.type]}
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <HiX className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const MAX_TOASTS = 4;

  const addToast = (message: string, type: Toast["type"], duration: number) => {
    const id = crypto.randomUUID();
    setToasts((prev) =>
      prev.length >= MAX_TOASTS
        ? [...prev.slice(1), { id, message, type, duration }]
        : [...prev, { id, message, type, duration }],
    );
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
