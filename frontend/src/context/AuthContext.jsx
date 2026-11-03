import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, googleLogin as apiGoogleLogin, updateUserProfile as apiUpdateProfile, updateAdvocateProfile as apiUpdateAdvocateProfile } from '../api/auth';

const AuthContext = createContext();

export const DEFAULT_CLIENT_USER = {
  id: 2,
  name: 'Suresh Thakur',
  email: 'sureshtakur194@gmail.com',
  phone: '+91 98490 11223',
  role: 'client',
  city: 'Hyderabad',
  state: 'Telangana',
  preferred_language: 'English'
};

export const DEFAULT_ADVOCATE_USER = {
  id: 1,
  name: 'Adv. Rajeshwar Rao',
  email: 'advocate@lexadvisor.ai',
  phone: '+91 98491 55443',
  role: 'advocate',
  bar_council_id: 'TS/1402/2014',
  state_bar_council: 'Bar Council of Telangana',
  specialization: 'Civil, Property & Real Estate Litigation',
  verification_status: 'pending', // Pending verification
  consultation_fee: 1500.0,
  city: 'Hyderabad',
  state: 'Telangana'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lexadvisor_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.name === 'Advocate Counsel' || parsed.email === 'advocate@lexadvisor.ai' && parsed.role === 'client')) {
          localStorage.removeItem('lexadvisor_user');
          return DEFAULT_CLIENT_USER;
        }
        return parsed;
      } catch (e) {}
    }
    return DEFAULT_CLIENT_USER;
  });
  const [token, setToken] = useState(localStorage.getItem('lexadvisor_token') || 'demo_token_suresh');

  useEffect(() => {
    const checkAuth = async () => {
      const stored = localStorage.getItem('lexadvisor_token');
      if (stored) {
        try {
          const u = await getCurrentUser();
          if (u && u.id) {
            setUser((prev) => {
              const base = (u.role === 'advocate') ? DEFAULT_ADVOCATE_USER : DEFAULT_CLIENT_USER;
              const merged = { ...base, ...prev, ...u };
              localStorage.setItem('lexadvisor_user', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (e) {
          // Keep active session in case backend offline
        }
      }
    };
    checkAuth();
  }, []);

  const login = (userData, accessToken) => {
    const isAdvocate = userData.role === 'advocate';
    const base = isAdvocate ? DEFAULT_ADVOCATE_USER : DEFAULT_CLIENT_USER;
    const merged = { ...base, ...userData };
    localStorage.setItem('lexadvisor_token', accessToken);
    localStorage.setItem('lexadvisor_user', JSON.stringify(merged));
    setToken(accessToken);
    setUser(merged);
  };

  const switchPortal = (targetRole) => {
    if (targetRole === 'advocate') {
      const advUser = { ...DEFAULT_ADVOCATE_USER, ...user, role: 'advocate' };
      setUser(advUser);
      localStorage.setItem('lexadvisor_user', JSON.stringify(advUser));
    } else {
      const clientUser = { ...DEFAULT_CLIENT_USER, ...user, role: 'client' };
      setUser(clientUser);
      localStorage.setItem('lexadvisor_user', JSON.stringify(clientUser));
    }
  };

  const googleSignIn = async (role = 'client') => {
    try {
      const res = await apiGoogleLogin({
        email: role === 'advocate' ? 'advocate@lexadvisor.ai' : 'sureshtakur194@gmail.com',
        name: role === 'advocate' ? 'Adv. Rajeshwar Rao' : 'Suresh Thakur',
        role: role
      });
      if (res && res.access_token) {
        login(
          {
            id: res.user_id,
            name: res.name,
            email: res.email,
            role: res.role,
            advocate_id: res.advocate_id,
            verification_status: res.verification_status
          },
          res.access_token
        );
        return { success: true, user: res };
      }
    } catch (e) {
      const fallback = role === 'advocate' ? DEFAULT_ADVOCATE_USER : DEFAULT_CLIENT_USER;
      login(fallback, 'demo_token_' + role);
      return { success: true, user: fallback };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (user?.role === 'advocate') {
        const updated = await apiUpdateAdvocateProfile(profileData);
        const merged = { ...user, ...(updated.advocate || updated) };
        setUser(merged);
        localStorage.setItem('lexadvisor_user', JSON.stringify(merged));
        return { success: true, user: merged };
      } else {
        const updated = await apiUpdateProfile(profileData);
        const merged = { ...user, ...updated };
        setUser(merged);
        localStorage.setItem('lexadvisor_user', JSON.stringify(merged));
        return { success: true, user: merged };
      }
    } catch (e) {
      const merged = { ...user, ...profileData };
      setUser(merged);
      localStorage.setItem('lexadvisor_user', JSON.stringify(merged));
      return { success: true, user: merged };
    }
  };

  const logout = () => {
    localStorage.removeItem('lexadvisor_token');
    localStorage.removeItem('lexadvisor_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role || 'client', login, logout, googleSignIn, updateProfile, switchPortal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
