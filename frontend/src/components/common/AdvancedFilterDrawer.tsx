import React, { ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}

const AdvancedFilterDrawer: React.FC<Props> = ({
  open,
  title,
  onClose,
  children,
  widthClassName = 'w-full max-w-md',
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Close filters"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className={`absolute right-0 top-0 h-full ${widthClassName} glass-panel premium-slide-in p-5 overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-200 hover:bg-slate-700/40"
          >
            Close
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </aside>
    </div>
  );
};

export default AdvancedFilterDrawer;

