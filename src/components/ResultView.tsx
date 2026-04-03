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

      <h2 className="text-2xl font-bold text-ramen-800 mb-1">{result.name}</h2>
      <p className="text-ramen-600 mb-6">{result.maker}</p>

      <div className="w-40 h-40 rounded-full bg-ramen-100 flex flex-col items-center justify-center mb-6 border-4 border-ramen-300">
        <span className="text-4xl font-bold text-ramen-700">{timeStr}</span>
        <span className="text-sm text-ramen-500">最適待ち時間</span>
      </div>

      <p className="text-sm text-ramen-700/80 max-w-xs mb-8 leading-relaxed">{result.reason}</p>

      <button
        onClick={onStartTimer}
        className="w-full max-w-xs py-4 bg-ramen-500 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-ramen-600 active:scale-95 transition-all"
      >
        🍜 タイマー開始！
      </button>

      <button onClick={onReset} className="mt-4 text-ramen-400 text-sm hover:text-ramen-600 transition-colors">
        写真を撮り直す
      </button>
    </div>
  );
}
