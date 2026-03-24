'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, Check, ArrowRight } from 'lucide-react';

interface GapQuestion {
  id: string;
  type: string;
  question: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  reason: string;
}

interface GapQuestionsModeProps {
  mandatory: GapQuestion[];
  recommended: GapQuestion[];
  optional: GapQuestion[];
  autoFilled: Record<string, { value: any; confidence: number; reason: string }>;
  onComplete: (answers: Record<string, any>) => void;
  isLoading?: boolean;
}

export default function GapQuestionsMode({
  mandatory,
  recommended,
  optional,
  autoFilled,
  onComplete,
  isLoading = false,
}: GapQuestionsModeProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [confirmedAutoFills, setConfirmedAutoFills] = useState<Record<string, boolean>>({});
  const [showOptional, setShowOptional] = useState(false);

  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const mandatoryAnswered = mandatory.every(q => answers[q.id] !== undefined);
  const mandatoryCount = mandatory.filter(q => answers[q.id] !== undefined).length;

  const handleFinalize = () => {
    const mergedAnswers: Record<string, any> = {};
    Object.entries(autoFilled).forEach(([key, { value }]) => {
      if (confirmedAutoFills[key] !== false) mergedAnswers[key] = value;
    });
    Object.entries(answers).forEach(([key, value]) => {
      mergedAnswers[key] = value;
    });
    onComplete(mergedAnswers);
  };

  const autoFilledKeys = Object.keys(autoFilled);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Auto-detected section */}
        {autoFilledKeys.length > 0 && (
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-[0.12em] mb-2 font-medium">
              Auto-detected — confirm or edit
            </p>
            <div className="space-y-1.5">
              {Object.entries(autoFilled).map(([key, { value, reason }]) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-3 py-2 border border-gray-100 rounded-lg bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[12.5px] text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[12.5px] text-gray-800 font-semibold ml-2">
                      {formatValue(value)}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{reason}</p>
                  </div>
                  <button
                    onClick={() => setConfirmedAutoFills(prev => ({ ...prev, [key]: true }))}
                    className={`ml-2 w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      confirmedAutoFills[key] === true
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-teal-300'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${confirmedAutoFills[key] === true ? 'text-teal-600' : 'text-gray-300'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mandatory (P0) */}
        {mandatory.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-[12.5px] text-red-600 font-semibold">
                Required — {mandatory.length} question{mandatory.length !== 1 ? 's' : ''}
              </p>
              {mandatoryCount > 0 && (
                <span className="ml-auto text-[11.5px] text-red-400 font-medium tabular-nums">
                  {mandatoryCount}/{mandatory.length} done
                </span>
              )}
            </div>
            <div className="space-y-2">
              {mandatory.map(q => (
                <GapQuestionCard
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={(val) => setAnswer(q.id, val)}
                  variant="mandatory"
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended (P1) */}
        {recommended.length > 0 && (
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-[0.12em] mb-2 font-medium">Recommended</p>
            <div className="space-y-2">
              {recommended.map(q => (
                <GapQuestionCard
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={(val) => setAnswer(q.id, val)}
                  variant="recommended"
                />
              ))}
            </div>
          </div>
        )}

        {/* Optional (P3) */}
        {optional.length > 0 && (
          <div>
            <button
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-600 transition-colors min-h-[44px]"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
              {showOptional ? 'Hide' : 'Show'} optional ({optional.length})
            </button>
            <AnimatePresence>
              {showOptional && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 mt-2 overflow-hidden"
                >
                  {optional.map(q => (
                    <GapQuestionCard
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      onChange={(val) => setAnswer(q.id, val)}
                      variant="optional"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-4 py-3 border-t border-gray-100">
        {mandatory.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-1">
              {mandatory.map((q) => (
                <div
                  key={q.id}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    answers[q.id] !== undefined ? 'bg-teal-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-400">
              <span className="font-semibold text-teal-600 tabular-nums">{mandatoryCount}</span> of {mandatory.length} required
            </span>
          </div>
        )}
        <button
          onClick={handleFinalize}
          disabled={!mandatoryAnswered || isLoading}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mandatoryAnswered && !isLoading
              ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white border border-teal-600'
              : 'bg-gray-100 text-gray-300 border border-gray-100 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Processing...' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </button>
        {!mandatoryAnswered && (
          <p className="text-[12px] text-center text-red-400 mt-2">
            Answer all required questions to continue
          </p>
        )}
      </div>
    </div>
  );
}

// ── Question Card ──
function GapQuestionCard({
  question,
  value,
  onChange,
  variant,
}: {
  question: GapQuestion;
  value: any;
  onChange: (val: any) => void;
  variant: 'mandatory' | 'recommended' | 'optional';
}) {
  const isAnswered = value !== undefined && value !== null && value !== '' &&
    !(Array.isArray(value) && value.length === 0);

  const borderClass = isAnswered
    ? 'border-l-[3px] border-l-teal-500 border border-gray-100'
    : variant === 'mandatory'
    ? 'border-l-[3px] border-l-red-400 border border-red-200'
    : variant === 'recommended'
    ? 'border border-gray-200'
    : 'border border-gray-100';

  const bgClass = isAnswered
    ? 'bg-teal-50/30'
    : variant === 'mandatory'
    ? 'bg-red-50/60'
    : 'bg-gray-50';

  return (
    <div className={`px-3 py-3 rounded-lg ${borderClass} ${bgClass} transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[12.5px] text-gray-700 leading-snug flex-1 pr-2">{question.question}</p>
        {isAnswered && (
          <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* yes_no */}
      {question.type === 'yes_no' && (
        <div className="flex gap-2">
          {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(({ v, l }) => (
            <button
              key={l}
              onClick={() => onChange(v)}
              className={`flex-1 py-2.5 min-h-[44px] rounded-lg text-[13px] font-semibold transition-all border active:scale-[0.98] ${
                value === v
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* single_choice */}
      {question.type === 'single_choice' && question.options && (
        <div className="grid grid-cols-2 gap-2">
          {question.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`py-2 px-3 min-h-[40px] rounded-lg text-[12.5px] text-left transition-all border active:scale-[0.98] ${
                value === opt.value
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* multi_choice / checklist / red_flags */}
      {(question.type === 'multi_choice' || question.type === 'checklist' || question.type === 'red_flags') && question.options && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {question.options.map(opt => {
              const isNoneSelected = Array.isArray(value) && value.includes('none');
              const selected = !isNoneSelected && Array.isArray(value) && value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    const current = Array.isArray(value) ? value.filter((v: string) => v !== 'none') : [];
                    onChange(selected ? current.filter((v: string) => v !== opt.value) : [...current, opt.value]);
                  }}
                  className={`py-2 px-3 min-h-[40px] rounded-lg text-[12.5px] text-left transition-all border active:scale-[0.98] ${
                    selected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {question.type === 'red_flags' && (
            <button
              onClick={() => onChange(['none'])}
              className={`w-full py-2.5 min-h-[40px] rounded-lg text-[12.5px] font-medium transition-all border active:scale-[0.98] ${
                Array.isArray(value) && value.includes('none')
                  ? 'bg-gray-100 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-400 border-gray-200 border-dashed hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              No red flags identified
            </button>
          )}
        </div>
      )}

      {/* slider */}
      {question.type === 'slider' && (
        <div className="space-y-2">
          {value == null ? (
            <button
              onClick={() => onChange(5)}
              className="w-full py-2.5 min-h-[40px] text-[12.5px] text-gray-400 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-600 transition-all bg-white"
            >
              Tap to set score
            </button>
          ) : (
            <>
              <input
                type="range"
                min={question.min ?? 0}
                max={question.max ?? 10}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[12px] text-gray-400">
                <span>{question.min ?? 0}</span>
                <span className="text-2xl font-bold text-gray-800">{value}</span>
                <span>{question.max ?? 10}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* date */}
      {question.type === 'date' && (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 min-h-[40px] rounded-lg border border-gray-200 bg-white text-[12.5px] text-gray-700 focus:outline-none focus:border-teal-400"
        />
      )}

      {/* body_map / text */}
      {(question.type === 'body_map' || question.type === 'text') && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={question.type === 'body_map' ? 'e.g., lower back, left knee' : 'Type your answer...'}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[12.5px] text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-teal-400"
        />
      )}
    </div>
  );
}

function formatValue(value: any): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.map((v: any) => {
      if (typeof v === 'object' && v?.mainRegion) {
        const side = v.laterality && v.laterality !== 'center' ? ` (${v.laterality})` : '';
        return v.mainRegion.replace(/-/g, ' ') + side;
      }
      return String(v).replace(/_/g, ' ');
    }).join(', ');
  }
  if (typeof value === 'object' && value?.mainRegion) {
    const side = value.laterality && value.laterality !== 'center' ? ` (${value.laterality})` : '';
    return value.mainRegion.replace(/-/g, ' ') + side;
  }
  return String(value);
}
