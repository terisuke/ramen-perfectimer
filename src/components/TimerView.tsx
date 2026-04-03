'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import quizzesData from '@/data/quizzes.json';

interface TimerViewProps {
  totalSeconds: number;
  productName: string;
  onComplete: () => void;
}

export function TimerView({ totalSeconds, productName, onComplete }: TimerViewProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isComplete, setIsComplete] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizzes] = useState(() => {
    const shuffled = [...quizzesData.quizzes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });
  const endTimeRef = useRef<number>(0);

  useEffect(() => {
    endTimeRef.current = Date.now() + totalSeconds * 1000;
  }, [totalSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newRemaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen');
        }
      } catch { /* ignore */ }
    };
    requestWakeLock();
    return () => { lock?.release(); };
  }, []);

  useEffect(() => {
    if (isComplete && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('ラーメン パーフェクトタイマー', { body: '完璧な一杯のできあがり！' });
    }
  }, [isComplete]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  }, [selectedAnswer]);

  const handleNextQuiz = useCallback(() => {
    if (currentQuiz < quizzes.length - 1) {
      setCurrentQuiz(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }, [currentQuiz, quizzes.length]);

  const progress = remaining / totalSeconds;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  if (isComplete) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">🍜</div>
        <h2 className="text-3xl font-bold text-ramen-600 mb-2">完璧な一杯のできあがり！</h2>
        <p className="text-ramen-500 mb-8">{productName}</p>
        <button onClick={onComplete} className="px-8 py-3 bg-ramen-500 text-white font-bold rounded-2xl hover:bg-ramen-600 active:scale-95 transition-all">
          もう一杯！
        </button>
      </div>
    );
  }

  const quiz = quizzes[currentQuiz];

  return (
    <div className="flex flex-1 flex-col items-center p-4">
      <div className="relative w-52 h-52 mb-4">
        <svg className="timer-ring w-full h-full" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#FFEFD5" strokeWidth="8" />
          <circle
            className="timer-ring__circle"
            cx="100" cy="100" r="90"
            fill="none"
            stroke={progress > 0.3 ? '#FF8C00' : progress > 0.1 ? '#FFA53B' : '#EF4444'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-ramen-700 tabular-nums">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-ramen-400">残り</span>
        </div>
      </div>

      <p className="text-sm text-ramen-500 mb-4">{productName}</p>

      <div className="w-full bg-white rounded-2xl shadow-md p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-ramen-600">クイズ {currentQuiz + 1}/{quizzes.length}</span>
          <span className="text-xs text-ramen-400">待ってる間に解いてみよう！</span>
        </div>
        <p className="text-sm font-medium text-gray-800 mb-3">{quiz.question}</p>
        <div className="space-y-2">
          {quiz.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selectedAnswer !== null}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                selectedAnswer === null
                  ? 'bg-ramen-50 hover:bg-ramen-100 text-gray-700'
                  : selectedAnswer === i
                    ? i === quiz.answer
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                    : i === quiz.answer
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {showExplanation && (
          <div className="mt-3 p-3 bg-ramen-50 rounded-xl">
            <p className="text-xs text-ramen-700 leading-relaxed">{quiz.explanation}</p>
            {currentQuiz < quizzes.length - 1 && (
              <button onClick={handleNextQuiz} className="mt-2 text-xs text-ramen-500 underline hover:text-ramen-700">
                次のクイズ →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
