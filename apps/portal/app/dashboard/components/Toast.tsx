import { useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function Toast({
  show,
  message,
  type = 'success',
  onClose,
}: {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  const bgColor = isSuccess ? 'bg-green-500/10' : isError ? 'bg-red-500/10' : 'bg-yellow-500/10';

  const outlineColor = isSuccess
    ? 'outline-green-500/20'
    : isError
      ? 'outline-red-500/20'
      : 'outline-yellow-500/20';

  const textColor = isSuccess ? 'text-green-300' : isError ? 'text-red-300' : 'text-yellow-300';

  const iconColor = isSuccess ? 'text-green-400' : isError ? 'text-red-400' : 'text-yellow-400';

  const buttonHoverColor = isSuccess
    ? 'text-green-400 hover:bg-green-500/10 focus-visible:ring-green-500 focus-visible:ring-offset-green-900'
    : isError
      ? 'text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500 focus-visible:ring-offset-red-900'
      : 'text-yellow-400 hover:bg-yellow-500/10 focus-visible:ring-yellow-500 focus-visible:ring-offset-yellow-900';

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`rounded-md ${bgColor} p-4 outline ${outlineColor}`}>
        <div className="flex">
          <div className="shrink-0">
            {isError ? (
              <XMarkIcon aria-hidden="true" className={`size-5 ${iconColor}`} />
            ) : (
              <CheckCircleIcon aria-hidden="true" className={`size-5 ${iconColor}`} />
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${buttonHoverColor} focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-hidden`}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
