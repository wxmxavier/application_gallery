// Report button component for flagging content
import { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportModal from './ReportModal';

interface ReportButtonProps {
  itemId: string;
  itemTitle: string;
  contentUrl?: string;
  variant?: 'icon' | 'text';
  className?: string;
}

export default function ReportButton({
  itemId,
  itemTitle,
  contentUrl,
  variant = 'icon',
  className = '',
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={handleClick}
          className={`p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors ${className}`}
          title="Report this content"
          aria-label="Report this content"
        >
          <Flag className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors ${className}`}
        >
          <Flag className="w-4 h-4" />
          <span>Report</span>
        </button>
      )}

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemId={itemId}
        itemTitle={itemTitle}
        contentUrl={contentUrl}
      />
    </>
  );
}
