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

// ============================================================
// Auth Context — State Management for Authentication
// ============================================================

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
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
        token: action.payload.token,
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

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = () => {
      try {
        const token = localStorage.getItem('voss_token');
        const userStr = localStorage.getItem('voss_user');

        if (token && userStr) {
          const user = JSON.parse(userStr) as User;
          setCookie('voss_access_token', token, 60 * 60 * 24 * 7);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('voss_token', accessToken);
      localStorage.setItem('voss_refresh_token', refreshToken);
      localStorage.setItem('voss_user', JSON.stringify(user));
      setCookie('voss_access_token', accessToken, 60 * 60 * 24 * 7);

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: accessToken } });
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
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('voss_token', accessToken);
      localStorage.setItem('voss_refresh_token', refreshToken);
      localStorage.setItem('voss_user', JSON.stringify(user));
      setCookie('voss_access_token', accessToken, 60 * 60 * 24 * 7);

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: accessToken } });
    } catch (error) {
      const message = getErrorMessage(error);
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('voss_token');
    localStorage.removeItem('voss_user');
    localStorage.removeItem('voss_refresh_token');
    removeCookie('voss_access_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem('voss_user', JSON.stringify(user));
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

