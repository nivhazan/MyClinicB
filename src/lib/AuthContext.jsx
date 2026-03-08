import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

/**
 * Simplified AuthProvider for self-hosted mode.
 * No external auth service — single-user clinic app.
 * Can be extended later with JWT/session auth if needed.
 */
export const AuthProvider = ({ children }) => {
  const [user] = useState({ name: 'מנהל קליניקה' });
  const [isAuthenticated] = useState(true);
  const [isLoadingAuth] = useState(false);
  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);
  const [appPublicSettings] = useState({});

  const logout = () => {
    // No-op for self-hosted single-user
  };

  const navigateToLogin = () => {
    // No-op for self-hosted single-user
  };

  const checkAppState = async () => {
    // No-op for self-hosted
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
