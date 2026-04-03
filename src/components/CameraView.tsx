'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { IdentifyResponse, IdentifyError } from '@/lib/types';

interface CameraViewProps {
  onIdentified: (data: IdentifyResponse) => void;
  onManualSearch: () => void;
}

export function CameraView({ onIdentified, onManualSearch }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      setCameraError(true);
    }
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 1280, 960);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');

      try {
        const response = await fetch('/api/identify', { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) {
          const errData = data as IdentifyError;
          setError(errData.message || '認識に失敗しました');
          setLoading(false);
          return;
        }
        onIdentified(data as IdentifyResponse);
      } catch {
        setError('通信エラーが発生しました');
        setLoading(false);
      }
    }, 'image/jpeg', 0.8);
  }, [onIdentified]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/identify', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError('認識できませんでした');
        setLoading(false);
        return;
      }
      onIdentified(data as IdentifyResponse);
    } catch {
      setError('通信エラーが発生しました');
      setLoading(false);
    }
  }, [onIdentified]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-ramen-700 mb-4">
        ラーメン パーフェクトタイマー
      </h1>

      {!cameraError ? (
        <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden bg-black mb-4">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-lg" />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm p-8 bg-ramen-50 rounded-2xl mb-4 text-center">
          <p className="text-ramen-700 mb-4">カメラにアクセスできません</p>
          <label className="inline-block px-6 py-3 bg-ramen-500 text-white rounded-xl cursor-pointer hover:bg-ramen-600 transition-colors">
            写真を選択
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-red-500 mb-4 text-center text-sm">{error}</p>}

      {!cameraError && (
        <button
          onClick={capturePhoto}
          disabled={loading}
          className="w-16 h-16 rounded-full bg-ramen-500 text-white text-2xl shadow-lg hover:bg-ramen-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <span className="animate-spin inline-block">⏳</span> : '📷'}
        </button>
      )}

      {loading && <p className="mt-3 text-ramen-600 animate-pulse-soft">パッケージを解析中...</p>}

      <button
        onClick={onManualSearch}
        className="mt-4 text-ramen-500 underline text-sm hover:text-ramen-700 transition-colors"
      >
        商品名で検索
      </button>
    </div>
  );
}
