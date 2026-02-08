import React, { useEffect } from 'react';

interface AgeModalProps {
  open: boolean;
  onDecision: (confirmed: boolean) => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  denyLabel?: string;
}

export default function AgeModal({
  open,
  onDecision,
  title = 'Xác nhận độ tuổi',
  message = 'Trang web này chứa nội dung rượu. Vui lòng xác nhận bạn đã đủ 18 tuổi trở lên để tiếp tục.',
  confirmLabel = 'Có, tôi đã đủ 18',
  denyLabel = 'Không, tôi chưa đủ 18'
}: AgeModalProps) {
  // Lock scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev || '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="age-modal-title">
      <div className="bg-background text-foreground rounded-lg shadow-lg max-w-md w-full p-6 text-center">
        <h2 id="age-modal-title" className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onDecision(true)}
            className="px-4 py-2 bg-primary text-white rounded-md w-full sm:w-auto"
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>

          <button
            onClick={() => onDecision(false)}
            className="px-4 py-2 bg-primary text-white rounded-md w-full sm:w-auto"
            aria-label={denyLabel}
          >
            {denyLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
