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
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
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
    if (!ctx) {
      setLoading(false);
      return;
    }

    ctx.drawImage(video, 0, 0, 1280, 960);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');

      try {
        const response = await fetch('/api/identify', { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) {
          const errData = data as IdentifyError;
          if (errData.error === 'NOT_FOUND') {
            setError('カップラーメンのパッケージ写真を撮ってね');
          } else {
            setError('認識に失敗しました。もう一度お試しください');
          }
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
        setError('認識できませんでした。別の写真をお試しください');
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
      <h1 className="mb-4 text-2xl font-bold text-ramen-700">
        ラーメン パーフェクトタイマー
      </h1>

      {!cameraError ? (
        <div className="relative mb-4 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-white/50">
            <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-[3px] border-t-[3px] border-white" />
            <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-[3px] border-t-[3px] border-white" />
            <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-[3px] border-l-[3px] border-white" />
            <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-[3px] border-r-[3px] border-white" />
          </div>
        </div>
      ) : (
        <div className="mb-4 w-full max-w-sm rounded-2xl bg-ramen-50 p-8 text-center">
          <p className="mb-4 text-ramen-700">カメラにアクセスできません</p>
          <label className="inline-block cursor-pointer rounded-xl bg-ramen-500 px-6 py-3 text-white transition-colors hover:bg-ramen-600">
            写真を選択
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <p className="mb-4 text-center text-sm text-red-500">{error}</p>
      )}

      {!cameraError && (
        <button
          onClick={capturePhoto}
          disabled={loading}
          className="h-16 w-16 rounded-full bg-ramen-500 text-2xl text-white shadow-lg transition-all hover:bg-ramen-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block animate-spin">⏳</span>
          ) : '📷'}
        </button>
      )}

      {loading && (
        <p className="mt-3 animate-pulse-soft text-ramen-600">
          パッケージを解析中...
        </p>
      )}

      <button
        onClick={onManualSearch}
        className="mt-4 text-sm text-ramen-500 underline transition-colors hover:text-ramen-700"
      >
        商品名で検索
      </button>
    </div>
  );
}
