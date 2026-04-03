'use client';

import type { IdentifyResponse } from '@/lib/types';

interface ResultViewProps {
  result: IdentifyResponse;
  onStartTimer: () => void;
  onReset: () => void;
}

export function ResultView({ result, onStartTimer, onReset }: ResultViewProps) {
  const minutes = Math.floor(result.optimalTime / 60);
  const seconds = result.optimalTime % 60;
  const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mb-2 text-sm text-ramen-500">
        {result.engine === 'gemma4' ? '🔮 Gemma 4 解析結果' :
         result.engine === 'gemini' ? '✨ Gemini 解析結果' : '📋 検索結果'}
      </div>

      <h2 className="mb-1 text-2xl font-bold text-ramen-800">{result.name}</h2>
      <p className="mb-6 text-ramen-600">{result.maker}</p>

      <div className="mb-6 flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-ramen-300 bg-ramen-100">
        <span className="text-4xl font-bold text-ramen-700">{timeStr}</span>
        <span className="text-sm text-ramen-500">最適待ち時間</span>
      </div>

      <p className="mb-8 max-w-xs text-sm leading-relaxed text-ramen-700/80">
        {result.reason}
      </p>

      <button
        onClick={onStartTimer}
        className="w-full max-w-xs rounded-2xl bg-ramen-500 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-ramen-600 active:scale-95"
      >
        🍜 タイマー開始！
      </button>

      <button
        onClick={onReset}
        className="mt-4 text-sm text-ramen-400 transition-colors hover:text-ramen-600"
      >
        写真を撮り直す
      </button>
    </div>
  );
}
