'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationManager } from '@/services/symptomAssessment/conversationManager';

interface ChatMessage {
  type: 'question' | 'answer' | 'diagnosis' | 'referral';
  content: any;
  timestamp: Date;
}

// Animation variants
const questionVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const optionVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

export default function SymptomAssessmentChat() {
  const [conversationManager] = useState(() => new ConversationManager());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ questionsAsked: 0, confidence: 0, topCondition: '' });
  const [currentDiagnostics, setCurrentDiagnostics] = useState<any>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await conversationManager.initializeEngine();
      const result = conversationManager.startConversation();
      setCurrentQuestion(result.question);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      setError('Unable to load the assessment. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: any) => {
    setMessages(prev => [...prev, {
      type: 'answer',
      content: answer,
      timestamp: new Date()
    }]);

    try {
      const result = conversationManager.processUserResponse(answer);

      if (result.type === 'question') {
        setCurrentQuestion(result.question);
        setProgress(result.progress);
        const diagnostics = conversationManager.getCurrentDiagnostics();
        setCurrentDiagnostics(diagnostics);
      } else if (result.type === 'diagnosis') {
        setMessages(prev => [...prev, {
          type: 'diagnosis',
          content: result,
          timestamp: new Date()
        }]);
        setIsComplete(true);
      } else if (result.type === 'referral') {
        setMessages(prev => [...prev, {
          type: 'referral',
          content: result,
          timestamp: new Date()
        }]);
        setIsComplete(true);
      }
    } catch (err) {
      console.error('Error processing answer:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  const resetChat = () => {
    conversationManager.resetConversation();
    setMessages([]);
    setIsComplete(false);
    setError(null);
    setProgress({ questionsAsked: 0, confidence: 0, topCondition: '' });
    setCurrentDiagnostics(null);
    initializeChat();
  };

  // Loading State
  const renderLoading = () => (
    <motion.div
      className="flex flex-col justify-center items-center h-64 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-blue-400"
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-medium text-gray-700">
          Preparing your assessment
        </span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );

  // Error State
  const renderError = () => (
    <motion.div
      className="bg-red-50 border border-red-200 rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">
            Something went wrong
          </h3>
          <p className="text-red-700 text-sm mb-4">
            {error}
          </p>
          <motion.button
            onClick={initializeChat}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  // Question Rendering
  const renderQuestion = (question: any) => {
    if (!question) return null;

    const isRedFlag = question.red_flag;

    return (
      <motion.div
        key={question.id || question.text}
        variants={questionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`bg-white rounded-xl shadow-sm border p-8 ${isRedFlag ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
      >
        {isRedFlag && (
          <motion.div
            className="flex items-center mb-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <span className="text-red-700 font-medium text-sm">Important Safety Question</span>
          </motion.div>
        )}

        <h3 className={`text-xl font-medium mb-6 leading-relaxed ${isRedFlag ? 'text-red-900' : 'text-gray-900'}`}>
          {question.text}
        </h3>

        {/* Yes/No Buttons - Equal Weight */}
        {question.type === 'yes_no' && (
          <div className="flex gap-4">
            <motion.button
              onClick={() => handleAnswer(true)}
              className="flex-1 min-h-[56px] text-lg bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Yes
            </motion.button>
            <motion.button
              onClick={() => handleAnswer(false)}
              className="flex-1 min-h-[56px] text-lg border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              No
            </motion.button>
          </div>
        )}

        {/* Multiple Choice - Staggered Animation */}
        {question.type === 'multiple_choice' && (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {question.options?.map((option: any, index: number) => (
              <motion.button
                key={index}
                variants={optionVariants}
                onClick={() => handleAnswer(option.value)}
                className="block w-full text-left p-4 font-medium text-gray-800 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-blue-600 mr-3">&#8226;</span>
                {option.text}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Body Selection */}
        {question.type === 'body_selection' && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {question.options?.map((option: any, index: number) => (
              <motion.button
                key={index}
                variants={optionVariants}
                onClick={() => handleAnswer(option.value)}
                className="p-4 text-center font-medium text-gray-800 min-h-[56px] bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {option.text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Thank You / Completion Screen - Patient Friendly (No Probabilities!)
  const renderThankYou = (result: any) => {
    const { recommendations } = result.content;

    return (
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Completion Header with Animation */}
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
            </svg>
          </motion.div>

          <motion.h2
            className="text-2xl font-semibold text-gray-900 mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Thank You for Completing Your Assessment
          </motion.h2>

          <motion.p
            className="text-gray-600 leading-relaxed max-w-lg mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your responses have been recorded and will help your physiotherapist
            create a personalized treatment plan tailored to your needs.
          </motion.p>
        </div>

        {/* What Happens Next */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            What Happens Next
          </h3>

          <ol className="space-y-4">
            {[
              { title: 'Your assessment is shared with your care team', desc: "They'll review your responses before your appointment" },
              { title: 'Your physiotherapist will discuss findings with you', desc: "They'll explain what your symptoms might indicate" },
              { title: 'Together, you\'ll create a treatment plan', desc: 'Based on this assessment and their clinical evaluation' }
            ].map((step, index) => (
              <motion.li
                key={index}
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <span className="bg-gray-100 text-gray-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{step.title}</p>
                  <p className="text-gray-600 text-sm mt-1">{step.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.div>

        {/* Recommendations if available */}
        {recommendations?.nextSteps && recommendations.nextSteps.length > 0 && (
          <motion.div
            className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Recommended Next Steps
            </h3>
            <ul className="space-y-2">
              {recommendations.nextSteps.map((step: string, index: number) => (
                <li key={index} className="flex items-start text-blue-800">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Reassurance Footer */}
        <motion.div
          className="text-center p-4 bg-gray-100 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-600 text-sm">
            Questions? Contact your clinic directly.
            <br />
            <span className="text-red-600 font-medium">
              If you experience sudden worsening of symptoms, seek immediate medical attention.
            </span>
          </p>
        </motion.div>

        {/* Start New Assessment Button */}
        <motion.div
          className="text-center pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <motion.button
            onClick={resetChat}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start New Assessment
          </motion.button>
        </motion.div>
      </motion.div>
    );
  };

  // Referral / Red Flag Screen
  const renderReferral = (result: any) => {
    return (
      <motion.div
        className="bg-red-50 border border-red-200 rounded-xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center mb-6">
          <motion.div
            className="bg-red-600 p-3 rounded-xl mr-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold text-red-900">
            Please Seek Medical Attention
          </h2>
        </div>

        <div className="bg-white border border-red-200 p-6 rounded-xl mb-6">
          <p className="text-red-800 text-lg leading-relaxed">{result.content.message}</p>
        </div>

        <div className="bg-red-100 p-6 rounded-xl border border-red-300">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-700 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p className="font-bold text-red-900 text-lg">
              Contact your doctor immediately or visit the nearest emergency room
            </p>
          </div>
        </div>

        <motion.p
          className="text-center text-gray-600 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Thank you for completing this assessment. Your safety is our priority.
        </motion.p>
      </motion.div>
    );
  };

  // Dev Panel (Collapsible - Testing Only)
  const renderDevPanel = () => (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
      <button
        onClick={() => setShowDevPanel(!showDevPanel)}
        className="w-full p-4 flex items-center justify-between text-left bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <span className="font-semibold text-gray-700 text-sm flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Dev Panel (Testing Only)
        </span>
        <motion.svg
          className="w-5 h-5 text-gray-500"
          animate={{ rotate: showDevPanel ? 180 : 0 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {showDevPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">Live Differential Diagnosis</h4>

              {currentDiagnostics && currentDiagnostics.topConditions.length > 0 ? (
                <div className="space-y-3">
                  {currentDiagnostics.topConditions.map((condition: any, index: number) => {
                    const percentage = Math.round(condition.probability * 100);
                    return (
                      <motion.div
                        key={condition.id}
                        className="border border-gray-200 rounded-lg p-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900 text-sm">{condition.name}</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No diagnostics available yet</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-medium text-gray-900">{progress.questionsAsked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence</span>
                    <span className="font-medium text-blue-600">
                      {currentDiagnostics ? Math.round(currentDiagnostics.confidence * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Main Render
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">{renderLoading()}</div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        {renderError()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Patient Friendly Language */}
      <motion.div
        className="bg-white border-b border-gray-200 p-6 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          Symptom Assessment
        </h1>
        <p className="text-gray-600 mt-1">
          Answer a few questions to help your physiotherapist understand your condition better
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
        {/* Main Content - Questions */}
        <div className="lg:col-span-2">
          {/* Progress Bar - Patient Friendly (No Confidence %) */}
          {!isComplete && progress.questionsAsked > 0 && (
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Question {progress.questionsAsked}
                </span>
                <span className="text-sm text-gray-500">
                  Almost there
                </span>
              </div>
              <div
                className="h-2 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress.questionsAsked}
                aria-valuemin={0}
                aria-valuemax={12}
                aria-label={`Question ${progress.questionsAsked} of approximately 12`}
              >
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((progress.questionsAsked / 12) * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                />
              </div>
            </motion.div>
          )}

          {/* Current Question */}
          <AnimatePresence mode="wait">
            {!isComplete && currentQuestion && renderQuestion(currentQuestion)}
          </AnimatePresence>

          {/* Results */}
          {messages.map((message, index) => (
            <div key={index} className="mb-4">
              {message.type === 'diagnosis' && renderThankYou(message)}
              {message.type === 'referral' && renderReferral(message)}
            </div>
          ))}
        </div>

        {/* Sidebar - Dev Panel Only (Collapsible) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Dev Panel - Collapsible */}
            {renderDevPanel()}

            {/* Safety Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-yellow-800 mb-1">Medical Disclaimer</p>
                  <p className="text-xs text-yellow-700">
                    This tool is for educational purposes only. Always consult a healthcare provider for medical advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Buttons */}
      {!isComplete && currentQuestion && currentQuestion.type === 'yes_no' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-4 max-w-lg mx-auto">
            <motion.button
              onClick={() => handleAnswer(true)}
              className="flex-1 min-h-[56px] text-lg bg-blue-600 text-white rounded-lg font-medium"
              whileTap={{ scale: 0.98 }}
            >
              Yes
            </motion.button>
            <motion.button
              onClick={() => handleAnswer(false)}
              className="flex-1 min-h-[56px] text-lg border border-gray-300 rounded-lg font-medium"
              whileTap={{ scale: 0.98 }}
            >
              No
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
