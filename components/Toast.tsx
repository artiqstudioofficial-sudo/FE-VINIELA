import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

  return (
    <div
      className={`fixed top-5 right-5 z-[101] flex items-center gap-4 px-6 py-4 rounded-lg text-white shadow-lg transition-transform duration-300 ease-in-out ${bgColor} ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <i className={`fa-solid ${icon} fa-lg`}></i>
      <p className="font-semibold">{message}</p>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black/20" aria-label="Close">
        <i className="fa-solid fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;
