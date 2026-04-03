'use client';

import { useState, useEffect, useRef } from 'react';
import type { IdentifyResponse } from '@/lib/types';
import productsData from '@/data/products.json';

interface ManualSearchProps {
  onSelected: (data: IdentifyResponse) => void;
  onBack: () => void;
}

export function ManualSearch({ onSelected, onBack }: ManualSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.length >= 1
    ? productsData.products.filter((p) => {
        const searchStr = `${p.name} ${p.maker} ${p.keywords.join(' ')}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
      })
    : productsData.products;

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={onBack} className="text-ramen-500 hover:text-ramen-700">
          ← 戻る
        </button>
        <h2 className="text-lg font-bold text-ramen-700">商品を検索</h2>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="商品名やメーカー名"
        className="w-full rounded-xl border border-ramen-200 bg-white px-4 py-3 text-gray-800 focus:border-ramen-400 focus:outline-none"
      />

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelected({
              productId: p.id,
              name: p.name,
              maker: p.maker,
              optimalTime: p.optimalTime,
              reason: p.reason,
              engine: 'fallback',
            })}
            className="w-full rounded-xl bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-ramen-50"
          >
            <div className="font-medium text-gray-800">{p.name}</div>
            <div className="text-xs text-ramen-500">
              {p.maker} · {Math.floor(p.optimalTime / 60)}分{p.optimalTime % 60}秒
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-ramen-400">該当する商品が見つかりません</p>
        )}
      </div>
    </div>
  );
}
