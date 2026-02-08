'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Smile, Frown, Meh, ThumbsUp, Heart, RotateCcw } from 'lucide-react';

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

const EMOJI_RATINGS = [
  { value: 1, emoji: '😞', label: 'Very Poor', color: 'text-red-500' },
  { value: 2, emoji: '😕', label: 'Poor', color: 'text-orange-500' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'text-yellow-500' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'text-lime-500' },
  { value: 5, emoji: '😄', label: 'Great', color: 'text-green-500' },
];

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(null);
      setComment('');
      setSignatureData(null);
      setHasDrawn(false);
      clearCanvas();
    }
  }, [isOpen]);

  // Initialize canvas
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
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
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
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing && hasDrawn) {
      const canvas = canvasRef.current;
      if (canvas) {
        setSignatureData(canvas.toDataURL('image/png'));
      }
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
    onSubmit({
      skipped: true,
    });
  };

  const canSubmit = rating !== null && hasDrawn;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1e5f79] to-[#2a7a9a] text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Session Complete!</h2>
              <p className="text-sm text-white/80 mt-1">
                {patientName ? `${patientName}, please` : 'Please'} share your feedback
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Emoji Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How was your session today? <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-between gap-2">
              {EMOJI_RATINGS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setRating(item.value)}
                  className={`flex-1 flex flex-col items-center p-3 rounded-md transition-all ${
                    rating === item.value
                      ? 'bg-[#1e5f79]/10 border-2 border-[#1e5f79] scale-105'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-3xl mb-1">{item.emoji}</span>
                  <span className={`text-xs font-medium ${rating === item.value ? 'text-[#1e5f79]' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Box */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Any comments? <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e5f79]/20 focus:border-[#1e5f79] resize-none text-sm"
            />
          </div>

          {/* Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Your Signature <span className="text-red-500">*</span>
              </label>
              {hasDrawn && (
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1e5f79] transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            <div className="relative border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
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
                  <p className="text-gray-400 text-sm">Sign here with your finger or mouse</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your signature confirms you received this session
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-all ${
                canSubmit && !isSubmitting
                  ? 'bg-[#1e5f79] text-white hover:bg-[#1e5f79]/90'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>

          {!canSubmit && (
            <p className="text-center text-xs text-gray-500">
              {!rating && !hasDrawn && 'Please select a rating and sign to continue'}
              {!rating && hasDrawn && 'Please select a rating to continue'}
              {rating && !hasDrawn && 'Please add your signature to continue'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientFeedbackModal;
