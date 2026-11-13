'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import axiosInstance, { getErrorMessage } from '@/services/axios';
import { clearLegacySession } from '@/lib/session';

// ============================================================
// Auth Context — State Management for Authentication
//
// Sessions are owned by the API as HttpOnly cookies. The browser never sees
// an access or refresh token; React state holds only the public user object
// needed for navigation and UI.
// ============================================================

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  completeGoogleLogin: (code: string, state: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  error: string | null;
  clearError: () => void;
}

const initialState: AuthState & { error: string | null } = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (
  state: AuthState & { error: string | null },
  action: AuthAction
): AuthState & { error: string | null } => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: null,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore the session from the API on first mount. The initial render stays
  // logged-out (hydration-safe); the loading flag prevents protected pages
  // from redirecting before the cookie check completes.
  useEffect(() => {
    clearLegacySession();
    let active = true;

    axiosInstance
      .get('/auth/me')
      .then((response) => {
        if (!active) return;
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: response.data.data as User } });
      })
      .catch(() => {
        if (!active) return;
        dispatch({ type: 'LOGOUT' });
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.data.data.user as User },
      });
    } catch (error) {
      const message = getErrorMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axiosInstance.post('/auth/register', data);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.data.data.user as User },
      });
    } catch (error) {
      const message = getErrorMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw new Error(message);
    }
  }, []);

  // Completes the Google OAuth authorization-code flow: exchange the code on
  // the server, which sets the same HttpOnly session cookies as email login.
  const completeGoogleLogin = useCallback(async (code: string, state: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axiosInstance.post('/auth/google/callback', { code, state });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.data.data.user as User },
      });
    } catch (error) {
      const message = getErrorMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // Even if the server call fails, clear local state and legacy tokens.
    } finally {
      clearLegacySession();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        completeGoogleLogin,
        logout,
        updateUser,
        error: state.error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
