'use client';

import { useState, useCallback } from 'react';
import { CameraView } from '@/components/CameraView';
import { ResultView } from '@/components/ResultView';
import { TimerView } from '@/components/TimerView';
import { ManualSearch } from '@/components/ManualSearch';
import type { IdentifyResponse, AppStep } from '@/lib/types';

export default function Home() {
  const [step, setStep] = useState<AppStep>('camera');
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [showManual, setShowManual] = useState(false);

  const handleIdentified = useCallback((data: IdentifyResponse) => {
    setResult(data);
    setStep('result');
  }, []);

  const handleStartTimer = useCallback(() => {
    setStep('timer');
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setStep('camera');
    setShowManual(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {step === 'camera' && !showManual && (
        <CameraView
          onIdentified={handleIdentified}
          onManualSearch={() => setShowManual(true)}
        />
      )}
      {step === 'camera' && showManual && (
        <ManualSearch
          onSelected={handleIdentified}
          onBack={() => setShowManual(false)}
        />
      )}
      {step === 'result' && result && (
        <ResultView
          result={result}
          onStartTimer={handleStartTimer}
          onReset={handleReset}
        />
      )}
      {step === 'timer' && result && (
        <TimerView
          totalSeconds={result.optimalTime}
          productName={result.name}
          onComplete={handleReset}
        />
      )}
    </div>
  );
}
