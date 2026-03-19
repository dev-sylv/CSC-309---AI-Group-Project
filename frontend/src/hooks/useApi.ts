import { useState, useCallback } from 'react';
import type { AskResponse, FlagRequest } from '../types';

const API_BASE = 'https://nau-questions-answered.onrender.com/api/v1';

interface UseApiReturn {
  askQuestion: (question: string) => Promise<{ data: AskResponse | null; error: string | null }>;
  flagAnswer: (data: FlagRequest) => Promise<{ success: boolean; error: string | null }>;
  loading: boolean;
}

export function useApi(): UseApiReturn {
  const [loading, setLoading] = useState(false);

  const askQuestion = useCallback(async (question: string) => {
    setLoading(true);
    console.log('[API] Asking question:', question);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      console.log('[API] Response status:', res.status);

      const data = await res.json();
      console.log('[API] Response data:', data);

      if (!res.ok) {
        const errorMsg = data?.message || `Server error (${res.status})`;
        console.error('[API] Error response:', errorMsg);
        return { data: null, error: errorMsg };
      }

      if (data.status !== 'success') {
        console.warn('[API] Unexpected response status:', data.status);
        return { data: null, error: 'Unexpected response from server.' };
      }

      return { data: data as AskResponse, error: null };
    } catch (err) {
      const message = err instanceof TypeError && err.message.includes('fetch')
        ? 'Network error. Please check your internet connection.'
        : err instanceof Error
          ? err.message
          : 'Could not reach the server.';
      console.error('[API] Fetch error:', message, err);
      return { data: null, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const flagAnswer = useCallback(async (data: FlagRequest) => {
    console.log('[API] Flagging answer:', { question: data.question, reason: data.reason });

    try {
      const res = await fetch(`${API_BASE}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      console.log('[API] Flag response status:', res.status);

      const result = await res.json();
      console.log('[API] Flag response data:', result);

      if (!res.ok) {
        const errorMsg = result?.message || `Server error (${res.status})`;
        console.error('[API] Flag error response:', errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true, error: null };
    } catch (err) {
      const message = err instanceof TypeError && err.message.includes('fetch')
        ? 'Network error. Please check your internet connection.'
        : err instanceof Error
          ? err.message
          : 'Could not submit flag.';
      console.error('[API] Flag fetch error:', message, err);
      return { success: false, error: message };
    }
  }, []);

  return { askQuestion, flagAnswer, loading };
}
