'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface PatientFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: PatientFeedback) => void;
  patientName?: string;
  isSubmitting?: boolean;
}

export interface PatientFeedback {
  rating?: number;
  comment?: string;
  signature?: string;
  skipped: boolean;
}

const SCALE_RATINGS = [
  { value: 1, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '🙂', label: 'Good' },
  { value: 3, emoji: '😊', label: 'Very Good' },
  { value: 4, emoji: '😄', label: 'Excellent' },
  { value: 5, emoji: '🤩', label: 'Delighted' },
];

const COMMENT_PROMPTS: Record<number, string> = {
  1: 'What could we do better next time?',
  2: 'What could we do better next time?',
  3: 'What would have made this session better?',
  4: 'What did you find most helpful?',
  5: 'What did you find most helpful?',
};

const PatientFeedbackModal: React.FC<PatientFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientName,
  isSubmitting = false,
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(null);
      setComment('');
      setSignatureData(null);
      setHasDrawn(false);
      clearCanvas();
    }
  }, [isOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e5f79';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureData(null);
    setHasDrawn(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing && hasDrawn) {
      const canvas = canvasRef.current;
      if (canvas) setSignatureData(canvas.toDataURL('image/png'));
    }
    setIsDrawing(false);
  };

  const handleSubmit = () => {
    onSubmit({
      rating: rating || undefined,
      comment: comment.trim() || undefined,
      signature: signatureData || undefined,
      skipped: false,
    });
  };

  const handleSkip = () => {
    onSubmit({ skipped: true });
  };

  const canSubmit = rating !== null && hasDrawn;
  const commentPlaceholder = rating ? COMMENT_PROMPTS[rating] : 'Share your experience...';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="bg-white w-full max-w-md rounded-md shadow-2xl overflow-hidden border border-gray-200">

        {/* Accent bar + Header */}
        <div className="border-t-[3px] border-t-[#1e5f79]">
          <div className="px-6 pt-5 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">
                Session Feedback
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {patientName ? `${patientName.split(' ')[0]}, how` : 'How'} was your experience today?
              </p>
            </div>
            <button
              onClick={handleSkip}
              aria-label="Dismiss feedback form"
              className="p-1 -mr-1 -mt-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div className="px-6 py-5 space-y-6">

          {/* Rating Scale */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {SCALE_RATINGS.map((item) => {
                const selected = rating === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setRating(item.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded border transition-all duration-75 ${
                      selected
                        ? 'border-[#1e5f79] bg-[#1e5f79]/5 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80'
                    }`}
                  >
                    <span className="text-2xl leading-none">{item.emoji}</span>
                    <span className={`text-[10px] font-medium leading-none mt-1 ${
                      selected ? 'text-[#1e5f79]' : 'text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Box */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Comments <span className="normal-case tracking-normal text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={commentPlaceholder}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/15 focus:border-[#1e5f79] resize-none text-sm text-gray-700 placeholder:text-gray-400"
            />
          </div>

          {/* Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Signature <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mt-0.5">Confirms you received this session</p>
              </div>
              {hasDrawn && (
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            <div
              className={`relative rounded overflow-hidden transition-colors ${
                hasDrawn
                  ? 'border border-[#1e5f79]/30 bg-white'
                  : 'border border-gray-200 bg-gray-50/50'
              }`}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-400 text-xs">Sign here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`w-full py-2.5 rounded font-medium text-sm transition-colors ${
              canSubmit && !isSubmitting
                ? 'bg-[#1e5f79] text-white hover:bg-[#185068]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>
          {!canSubmit && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {!rating && !hasDrawn && 'Select a rating and sign to continue'}
              {!rating && hasDrawn && 'Select a rating to continue'}
              {rating && !hasDrawn && 'Add your signature to continue'}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientFeedbackModal;
