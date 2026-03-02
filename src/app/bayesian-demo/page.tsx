'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PhysioBayesianEngine } from '@/services/symptom-assessment/bayesianEngine';
import {
  RotateCcw,
  FlaskConical,
  ChevronRight,
  Activity,
  Brain,
  BarChart3,
  AlertTriangle,
  Zap,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  phase: string;
  text: string;
  type: string;
  options?: Array<{ value: string; text: string }>;
  tests_symptoms: string[];
  diagnostic_weight: number;
  information_gain_potential?: number;
  red_flag?: boolean;
  clinical_note?: string;
  body_regions?: string[];
}

interface ConditionRow {
  id: string;
  name: string;
  probability: number;
  confidence: string;
}

interface HistoryEntry {
  questionId: string;
  questionText: string;
  answer: string;
  phase: string;
  topConditions: ConditionRow[];
  confidence: number;
  entropy: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function entropyFromProbs(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BayesianDemoPage() {
  const [engine, setEngine] = useState<PhysioBayesianEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current question from engine
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  // Top condition posteriors
  const [topConditions, setTopConditions] = useState<ConditionRow[]>([]);
  // Engine diagnostics
  const [confidence, setConfidence] = useState(0);
  const [phase, setPhase] = useState('safety');
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [entropy, setEntropy] = useState(0);
  // History log
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Done
  const [done, setDone] = useState(false);
  const [diagnosticSummary, setDiagnosticSummary] = useState('');

  const historyEndRef = useRef<HTMLDivElement>(null);

  // ── Load data & init engine ──────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      try {
        const [cptRes, questionsRes, srcCptRes, srcQRes] = await Promise.all([
          fetch('/data/symptom-assessment/cpt-tables.json'),
          fetch('/data/symptom-assessment/questions.json'),
          fetch('/data/symptom-assessment/referral-source-cpt.json'),
          fetch('/data/symptom-assessment/referral-source-questions.json'),
        ]);

        const [cptData, questionData, srcCptData, srcQData] = await Promise.all([
          cptRes.json(),
          questionsRes.json(),
          srcCptRes.json(),
          srcQRes.json(),
        ]);

        const eng = new PhysioBayesianEngine(cptData, questionData, srcCptData, srcQData);
        setEngine(eng);

        const firstQ = eng.getNextQuestion();
        setCurrentQuestion(firstQ as Question | null);
        setPhase(eng.getCurrentPhase());
        setLoading(false);
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
        setLoading(false);
      }
    }
    init();
  }, []);

  // ── Pull diagnostics from engine ─────────────────────────────────────────────

  const pullDiagnostics = useCallback(
    (eng: PhysioBayesianEngine) => {
      const results = eng.getDiagnosticResults();
      setTopConditions(results.topConditions);
      setConfidence(results.confidence);
      setQuestionsAsked(results.questionsAsked);
      setPhase(eng.getCurrentPhase());
      setDiagnosticSummary(results.diagnosticSummary);

      const probs = results.topConditions.map((c) => c.probability);
      setEntropy(entropyFromProbs(probs));
    },
    []
  );

  // ── Answer handler ───────────────────────────────────────────────────────────

  const handleAnswer = useCallback(
    (answer: any, displayAnswer: string) => {
      if (!engine || !currentQuestion) return;

      engine.processAnswer(currentQuestion.id, answer);
      pullDiagnostics(engine);

      const results = engine.getDiagnosticResults();
      const probs = results.topConditions.map((c) => c.probability);

      setHistory((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          answer: displayAnswer,
          phase: currentQuestion.phase,
          topConditions: results.topConditions,
          confidence: results.confidence,
          entropy: entropyFromProbs(probs),
        },
      ]);

      const nextQ = engine.getNextQuestion();
      if (nextQ) {
        setCurrentQuestion(nextQ as Question);
        setPhase(engine.getCurrentPhase());
      } else {
        setCurrentQuestion(null);
        setDone(true);
      }
    },
    [engine, currentQuestion, pullDiagnostics]
  );

  // Auto-scroll history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // ── Reset ────────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (!engine) return;
    engine.reset();
    const firstQ = engine.getNextQuestion();
    setCurrentQuestion(firstQ as Question | null);
    setTopConditions([]);
    setConfidence(0);
    setPhase(engine.getCurrentPhase());
    setQuestionsAsked(0);
    setEntropy(0);
    setHistory([]);
    setDone(false);
    setDiagnosticSummary('');
  }, [engine]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-teal-600" />
          <p className="text-sm text-gray-500">Loading Bayesian engine &amp; CPT tables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-800">
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50">
            <FlaskConical className="h-4 w-4 text-teal-600" />
          </div>
          <span className="text-sm font-semibold">Bayesian Engine Tester</span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            DEV
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-teal-50 hover:text-teal-600"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </header>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Question + History ─────────────────────────────────── */}
        <div className="flex w-1/2 flex-col border-r border-gray-200">
          {/* Current question */}
          <div className="border-b border-gray-100 bg-white px-5 py-4">
            <div className="mb-2 flex items-center gap-2">
              <PhaseBadge phase={phase} />
              <span className="text-[11px] text-gray-400">Q{questionsAsked + 1}</span>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <CheckCircle2 className="h-8 w-8 text-teal-500" />
                <p className="text-center text-sm font-medium text-gray-700">
                  Assessment complete
                </p>
                <p className="max-w-md text-center text-xs text-gray-500">
                  {diagnosticSummary}
                </p>
              </div>
            ) : currentQuestion ? (
              <>
                <p className="mb-3 text-sm font-medium leading-relaxed text-gray-800">
                  {currentQuestion.text}
                </p>

                {currentQuestion.red_flag && (
                  <div className="mb-3 flex items-center gap-1.5 rounded bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    Red flag question
                  </div>
                )}

                {/* Answer buttons */}
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.type === 'yes_no' && (
                    <>
                      <AnswerButton label="Yes" onClick={() => handleAnswer(true, 'Yes')} />
                      <AnswerButton label="No" onClick={() => handleAnswer(false, 'No')} />
                    </>
                  )}

                  {currentQuestion.type === 'multiple_choice' &&
                    currentQuestion.options?.map((opt) => (
                      <AnswerButton
                        key={opt.value}
                        label={opt.text}
                        onClick={() => handleAnswer(opt.value, opt.text)}
                      />
                    ))}

                  {currentQuestion.type === 'body_selection' &&
                    currentQuestion.options?.map((opt) => (
                      <AnswerButton
                        key={opt.value}
                        label={opt.text}
                        onClick={() => handleAnswer(opt.value, opt.text)}
                      />
                    ))}
                </div>

                {/* Question metadata */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
                  <span>ID: {currentQuestion.id}</span>
                  <span>Weight: {currentQuestion.diagnostic_weight}</span>
                  <span>Symptoms: {currentQuestion.tests_symptoms.join(', ')}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">No question available</p>
            )}
          </div>

          {/* History log */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Answer History
            </p>
            {history.length === 0 ? (
              <p className="text-xs text-gray-400">No answers yet — start answering above.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-medium text-gray-400">Q{i + 1}</span>
                          <PhaseBadge phase={h.phase} small />
                        </div>
                        <p className="text-gray-600 leading-relaxed">{h.questionText}</p>
                        <p className="mt-1 font-medium text-teal-700">
                          <ChevronRight className="inline h-3 w-3" /> {h.answer}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 text-[10px] text-gray-400 shrink-0">
                        <span>conf: {pct(h.confidence)}</span>
                        <span>H: {h.entropy.toFixed(3)}</span>
                      </div>
                    </div>

                    {/* Mini posteriors after this answer */}
                    {h.topConditions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {h.topConditions.slice(0, 3).map((c) => (
                          <div key={c.id} className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full bg-gray-100 flex-1">
                              <div
                                className="h-1.5 rounded-full bg-teal-500 transition-all duration-300"
                                style={{ width: `${c.probability * 100}%` }}
                              />
                            </div>
                            <span className="w-24 truncate text-[10px] text-gray-500 text-right">
                              {c.name}
                            </span>
                            <span className="w-10 text-[10px] font-mono text-gray-600 text-right">
                              {pct(c.probability)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={historyEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Live Posteriors Panel ──────────────────────────────── */}
        <div className="flex w-1/2 flex-col bg-white">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-px border-b border-gray-100 bg-gray-100">
            <StatCard icon={<HelpCircle className="h-3.5 w-3.5" />} label="Questions" value={String(questionsAsked)} />
            <StatCard icon={<Brain className="h-3.5 w-3.5" />} label="Phase" value={phase} />
            <StatCard icon={<Activity className="h-3.5 w-3.5" />} label="Confidence" value={pct(confidence)} />
            <StatCard icon={<BarChart3 className="h-3.5 w-3.5" />} label="Entropy" value={entropy.toFixed(3)} />
          </div>

          {/* Posterior distribution */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Posterior Distribution — P(Condition | Evidence)
            </p>

            {topConditions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
                <Zap className="h-6 w-6" />
                <p className="text-xs">Select a body region to initialize priors</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topConditions.map((c, i) => (
                  <div
                    key={c.id}
                    className={`rounded-lg border px-3.5 py-2.5 transition-all ${
                      i === 0
                        ? 'border-teal-200 bg-teal-50/50'
                        : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
                            1
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium ${
                            i === 0 ? 'text-teal-800' : 'text-gray-700'
                          }`}
                        >
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConfidenceBadge level={c.confidence} />
                        <span className="text-sm font-semibold font-mono text-gray-800">
                          {pct(c.probability)}
                        </span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          i === 0 ? 'bg-teal-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(c.probability * 100, 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-gray-400 font-mono">{c.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Source identification result if available */}
          {done && engine && (
            <SourceResult engine={engine} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AnswerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 active:scale-[0.97]"
    >
      {label}
    </button>
  );
}

function PhaseBadge({ phase, small }: { phase: string; small?: boolean }) {
  const colors: Record<string, string> = {
    safety: 'bg-red-100 text-red-700',
    context: 'bg-blue-100 text-blue-700',
    region: 'bg-purple-100 text-purple-700',
    source_identification: 'bg-amber-100 text-amber-700',
    functional: 'bg-cyan-100 text-cyan-700',
    differential: 'bg-teal-100 text-teal-700',
  };
  const cls = colors[phase] || 'bg-gray-100 text-gray-600';

  return (
    <span
      className={`rounded font-semibold uppercase ${cls} ${
        small ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'
      }`}
    >
      {phase.replace('_', ' ')}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    'Very High': 'bg-teal-100 text-teal-700',
    High: 'bg-teal-50 text-teal-600',
    Moderate: 'bg-amber-50 text-amber-600',
    Low: 'bg-gray-100 text-gray-500',
    'Very Low': 'bg-gray-50 text-gray-400',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${colors[level] || 'bg-gray-100 text-gray-500'}`}>
      {level}
    </span>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-white px-3 py-2.5">
      <div className="text-gray-400">{icon}</div>
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-700 capitalize">{value}</span>
    </div>
  );
}

function SourceResult({ engine }: { engine: PhysioBayesianEngine }) {
  const srcResult = engine.getSourceIdentificationResult();
  if (!srcResult) return null;

  return (
    <div className="border-t border-gray-100 px-5 py-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Pain Source Identification
      </p>
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs space-y-1">
        <p>
          <span className="text-gray-500">Site:</span>{' '}
          <span className="font-medium">{srcResult.painSite}</span>
        </p>
        <p>
          <span className="text-gray-500">Top source:</span>{' '}
          <span className="font-medium">{srcResult.topSource.name}</span>{' '}
          ({pct(srcResult.topSource.probability)})
        </p>
        <p>
          <span className="text-gray-500">Local:</span>{' '}
          <span className={srcResult.isLocal ? 'text-teal-600 font-medium' : 'text-amber-600 font-medium'}>
            {srcResult.isLocal ? 'Yes' : 'No — Referred'}
          </span>
        </p>
        {srcResult.shouldSwitchRegion && (
          <p className="text-amber-600 font-medium">
            Suggests switching to: {srcResult.newRegion}
          </p>
        )}
        <p className="text-gray-500 pt-1">{srcResult.clinicalImplication}</p>
      </div>
    </div>
  );
}
