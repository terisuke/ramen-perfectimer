export interface Product {
  id: string;
  name: string;
  maker: string;
  optimalTime: number;
  reason: string;
  keywords: string[];
  category: string;
}

export interface IdentifyResponse {
  productId: string;
  name: string;
  maker: string;
  optimalTime: number;
  reason: string;
  engine: 'gemma4' | 'gemini' | 'fallback';
}

export interface IdentifyError {
  error: string;
  suggestion?: string;
  message?: string;
}

export interface Quiz {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export type AppStep = 'camera' | 'result' | 'timer';

export interface TimerState {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
}
