'use client';

import React from 'react';
import { Printer, Download, Loader2 } from 'lucide-react';

interface ReceiptButtonProps {
  onPrint: () => void;
  onDownload: () => void;
  loading?: boolean;
}

const ReceiptButton: React.FC<ReceiptButtonProps> = ({ onPrint, onDownload, loading }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrint}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Printer className="h-3.5 w-3.5" />
        }
        Print
      </button>
      <button
        onClick={onDownload}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-brand-teal rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" />
        }
        Download PDF
      </button>
    </div>
  );
};

export default ReceiptButton;
