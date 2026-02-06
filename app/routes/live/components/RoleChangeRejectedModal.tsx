import { HiX } from "react-icons/hi";

interface Props {
  presenterName: string;
  onClose: () => void;
}

export default function RoleChangeRejectedModal({
  onClose,
  presenterName,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Role Change Rejected
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Cannot become presenter. {presenterName} is already the presenter.
          </p>
        </div>
      </div>
    </div>
  );
}
