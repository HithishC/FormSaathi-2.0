'use client';

import { useState, useCallback } from 'react';
import { ApiError } from '@/types';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await apiCall();
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (err: unknown) {
      const apiError: ApiError = {
        message: (err as ApiError)?.message || 'An unexpected error occurred',
        status: (err as ApiError)?.status || 500,
        detail: (err as ApiError)?.detail,
      };
      setState({ data: null, isLoading: false, error: apiError });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
