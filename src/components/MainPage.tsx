import React, { useState, useEffect } from 'react';
import { Clock, Loader2, Search, Timer } from 'lucide-react';
import { BatchTime, TestCodesResponse } from '../types';

const BATCHES: BatchTime[] = ['7:30 am', '9:00 am', '10:30 am', '7:30 pm'];

function Countdown({ updatedAt }: { updatedAt: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = updatedAt + 24 * 60 * 60 * 1000 - Date.now();
      setTimeLeft(remaining > 0 ? remaining : 0);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  if (timeLeft <= 0) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="mt-6 text-sm font-medium text-amber-600 bg-amber-50/80 px-4 py-2 rounded-full border border-amber-200 flex items-center shadow-sm">
      <Timer className="w-4 h-4 mr-2" />
      <span>Expires in: {hours}h {minutes}m {seconds}s</span>
    </div>
  );
}

export default function MainPage() {
  const [testCodes, setTestCodes] = useState<TestCodesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [hasSelectedBatch, setHasSelectedBatch] = useState<boolean>(() => {
    return !!localStorage.getItem('preferredBatch');
  });

  // Try to load the initial batch from localStorage, default to first batch if not found
  const [selectedBatch, setSelectedBatch] = useState<BatchTime>(() => {
    const saved = localStorage.getItem('preferredBatch');
    if (saved && BATCHES.includes(saved as BatchTime)) {
      return saved as BatchTime;
    }
    return '7:30 am';
  });

  useEffect(() => {
    fetch('/api/test-codes')
      .then((res) => res.json())
      .then((data: Record<string, any>) => {
        const normalized: any = {};
        Object.keys(data).forEach(key => {
          if (typeof data[key] === 'string') {
             normalized[key] = { code: data[key], updatedAt: 0 };
          } else {
             normalized[key] = data[key];
          }
        });
        setTestCodes(normalized as TestCodesResponse);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load test codes', err);
        setLoading(false);
      });
  }, []);

  const handleBatchSelect = (batch: BatchTime) => {
    setSelectedBatch(batch);
    localStorage.setItem('preferredBatch', batch);
    setHasSelectedBatch(true);
  };

  if (!hasSelectedBatch) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 sm:p-10 text-center border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
              Welcome!
            </h2>
            <p className="text-neutral-500">
              Please select your batch timing to continue.
            </p>
          </div>
          <div className="p-6 sm:p-8 space-y-3">
            {BATCHES.map((batch) => (
              <button
                key={batch}
                onClick={() => handleBatchSelect(batch)}
                className="w-full py-4 px-4 rounded-xl flex items-center justify-center space-x-3 text-base font-medium transition-all bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
              >
                <Clock className="w-5 h-5" />
                <span>{batch}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 sm:p-10 text-center border-b border-neutral-100 bg-neutral-50/50 relative">
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <button
              onClick={() => {
                localStorage.removeItem('preferredBatch');
                setHasSelectedBatch(false);
              }}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-600 underline underline-offset-2 transition-colors"
            >
              Change Batch
            </button>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2">
            Today's Test Code
          </h2>
          <p className="text-neutral-500 flex items-center justify-center gap-2">
            Viewing code for batch: 
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
              <Clock className="w-3 h-3 mr-1" />
              {selectedBatch}
            </span>
          </p>
        </div>
        
        <div className="p-6 sm:p-10">
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-neutral-50 rounded-2xl border border-neutral-200/60">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
              Test Code for {selectedBatch}
            </p>
            {loading ? (
              <div className="flex items-center text-neutral-400 space-x-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading code...</span>
              </div>
            ) : (() => {
              const batchData = testCodes?.[selectedBatch];
              const now = Date.now();
              const isExpired = !batchData || (now - batchData.updatedAt > 24 * 60 * 60 * 1000) || batchData.updatedAt === 0;
              const displayCode = isExpired ? 'Not yet updated' : (batchData.code || 'Not set');
              const isNotUpdated = isExpired || !batchData.code;

              return (
                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-4">
                    <Search className={`w-8 h-8 ${isNotUpdated ? 'text-neutral-300' : 'text-indigo-400'}`} />
                    <span className={`font-bold tracking-tight select-all ${isNotUpdated ? 'text-neutral-400 text-2xl sm:text-3xl' : 'text-neutral-900 text-5xl'}`}>
                      {displayCode}
                    </span>
                  </div>
                  {!isExpired && batchData && batchData.updatedAt > 0 && (
                    <Countdown updatedAt={batchData.updatedAt} />
                  )}
                </div>
              );
            })()}
          </div>
          <div className="text-center mt-6">
            <p className="text-[10px] text-neutral-400 tracking-widest uppercase">by abinash</p>
          </div>
        </div>
      </div>
    </div>
  );
}
