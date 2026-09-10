'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';

export function useToastError() {
  const showError = useCallback((error: unknown, fallback = 'Something went wrong') => {
    toast.error(getErrorMessage(error) || fallback);
  }, []);

  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  return { showError, showSuccess };
}
