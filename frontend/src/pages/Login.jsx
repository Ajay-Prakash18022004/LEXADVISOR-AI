import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginUser, registerUser } from '../api/auth';
import { useAuth, DEFAULT_CLIENT_USER, DEFAULT_ADVOCATE_USER } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, googleSignIn } = useAuth();

  // Mode: 'signin' or 'register'
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  // Selected Role: 'client' or 'advocate'
  const [selectedRole, setSelectedRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');

  // Advocate Specific Fields
  const [barCouncilId, setBarCouncilId] = useState('');
  const [stateBarCouncil, setStateBarCouncil] = useState('Bar Council of Telangana');
  const [specialization, setSpecialization] = useState('Civil, Property & Real Estate Litigation');
  const [experienceYears, setExperienceYears] = useState(7);
  const [officeAddress, setOfficeAddress] = useState('Chamber 302, High Court Buildings, Hyderabad');
  const [consultationFee, setConsultationFee] = useState(1500);
  const [languagesSpoken, setLanguagesSpoken] = useState('English, Telugu, Hindi');

  // Fill quick demo credentials on role change
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    setSuccessMsg('');
    if (!isRegister) {
      if (role === 'advocate') {
        setEmail('advocate@lexadvisor.ai');
        setPassword('AdvocatePass@123');
      } else {
        setEmail('sureshtakur194@gmail.com');
        setPassword('ClientPass@2026');
      }
    }
  };

  const handleQuickFill = (role) => {
    setSelectedRole(role);
    if (role === 'advocate') {
      setEmail('advocate@lexadvisor.ai');
      setPassword('AdvocatePass@123');
    } else {
      setEmail('sureshtakur194@gmail.com');
      setPassword('ClientPass@2026');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isRegister) {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
          phone: phone.trim(),
          city: city.trim()
        };

        if (selectedRole === 'advocate') {
          payload.bar_council_id = barCouncilId.trim();
          payload.state_bar_council = stateBarCouncil.trim();
          payload.specialization = specialization.trim();
          payload.experience_years = Number(experienceYears) || 5;
          payload.address = officeAddress.trim();
          payload.consultation_fee = Number(consultationFee) || 1500;
          payload.languages_spoken = languagesSpoken.trim();
        }

        const data = await registerUser(payload);
        login(
          {
            id: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role || selectedRole,
            advocate_id: data.advocate_id,
            verification_status: data.verification_status
          },
          data.access_token
        );

        if (selectedRole === 'advocate') {
          navigate('/advocate/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Sign In
        const data = await loginUser(email.trim().toLowerCase(), password, selectedRole);
        login(
          {
            id: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role || selectedRole,
            advocate_id: data.advocate_id,
            verification_status: data.verification_status
          },
          data.access_token
        );

        if (data.role === 'advocate' || selectedRole === 'advocate') {
          navigate('/advocate/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(detail || (isRegister ? 'Registration failed. Please check your information.' : 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await googleSignIn(selectedRole);
      if (result?.success) {
        if (selectedRole === 'advocate') {
          navigate('/advocate/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Google Sign-In was unable to complete. Please try manual login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{
        maxWidth: selectedRole === 'advocate' && isRegister ? '680px' : '520px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Top Portal Banner */}
        <div style={{
          background: selectedRole === 'advocate'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          padding: '28px 24px',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
            {selectedRole === 'advocate' ? '⚖️ Advocate & Legal Chamber Portal' : '🛡️ Common Person & Client Portal'}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            {isRegister ? 'Create Your Account' : 'Welcome to LexAdvisor AI'}
          </h1>
          <p style={{ fontSize: '13px', margin: 0, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
            {selectedRole === 'advocate'
              ? 'Manage client consultation requests, track hearing dates, case timelines, and internal legal files.'
              : 'Analyze agreements, verify Telangana/AP stamp duties, assess risks, and consult nearby lawyers.'}
          </p>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Role Selection Tabs */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Select Portal Type:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleRoleChange('client')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: selectedRole === 'client' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedRole === 'client' ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '20px' }}>👤</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: selectedRole === 'client' ? '#1e40af' : '#334155' }}>
                    Common Person
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Client / Tenant / Business</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('advocate')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: selectedRole === 'advocate' ? '2px solid #0f172a' : '1px solid #e2e8f0',
                  background: selectedRole === 'advocate' ? '#f1f5f9' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '20px' }}>⚖️</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: selectedRole === 'advocate' ? '#0f172a' : '#334155' }}>
                    Advocate / Lawyer
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Bar Council Practicing</div>
                </div>
              </button>
            </div>
          </div>

          {/* Sign In vs Register Toggle */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: !isRegister ? '2px solid #0f172a' : '2px solid transparent',
                fontWeight: !isRegister ? 700 : 500,
                color: !isRegister ? '#0f172a' : '#64748b',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: isRegister ? '2px solid #0f172a' : '2px solid transparent',
                fontWeight: isRegister ? 700 : 500,
                color: isRegister ? '#0f172a' : '#64748b',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Fill Pill */}
          {!isRegister && (
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Testing {selectedRole === 'advocate' ? 'Advocate' : 'Client'} mode?
              </span>
              <button
                type="button"
                onClick={() => handleQuickFill(selectedRole)}
                style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                Quick Demo Login
              </button>
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {successMsg}
            </div>
          )}

          {/* Registration Notice for Advocates */}
          {isRegister && selectedRole === 'advocate' && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '18px',
              lineHeight: 1.4
            }}>
              ⚖️ <strong>Bar Council Verification Policy:</strong> Newly registered advocate profiles are assigned <strong>Pending Verification</strong> status until Bar Council credentials are authenticated.
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: selectedRole === 'advocate' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder={selectedRole === 'advocate' ? "Adv. Rajeshwar Rao" : "Suresh Thakur"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98490 11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: (isRegister && selectedRole === 'advocate') ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  {selectedRole === 'advocate' ? 'Professional Email *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  placeholder={selectedRole === 'advocate' ? "advocate@lexadvisor.ai" : "sureshtakur194@gmail.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Advocate Registration Additional Fields */}
            {isRegister && selectedRole === 'advocate' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Bar Council Enrollment No. *
                    </label>
                    <input
                      type="text"
                      placeholder="TS/1402/2014"
                      value={barCouncilId}
                      onChange={(e) => setBarCouncilId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      State Bar Council *
                    </label>
                    <select
                      value={stateBarCouncil}
                      onChange={(e) => setStateBarCouncil(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    >
                      <option value="Bar Council of Telangana">Bar Council of Telangana</option>
                      <option value="Bar Council of Andhra Pradesh">Bar Council of Andhra Pradesh</option>
                      <option value="Bar Council of India">Bar Council of India</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Areas of Specialization *
                    </label>
                    <input
                      type="text"
                      placeholder="Civil, Property & Real Estate"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Consultation Fee (₹) *
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Languages Spoken *
                    </label>
                    <input
                      type="text"
                      placeholder="English, Telugu, Hindi"
                      value={languagesSpoken}
                      onChange={(e) => setLanguagesSpoken(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Chamber / Office Address *
                  </label>
                  <input
                    type="text"
                    placeholder="Chamber 204, High Court Road, Hyderabad"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </>
            )}

            {isRegister && selectedRole === 'client' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="Hyderabad, Secunderabad, Visakhapatnam..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '12px',
                borderRadius: '8px',
                background: selectedRole === 'advocate' ? '#0f172a' : '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              {loading ? 'Authenticating...' : isRegister ? (selectedRole === 'advocate' ? 'Register Advocate Account' : 'Create Client Account') : `Sign In as ${selectedRole === 'advocate' ? 'Advocate' : 'Client'}`}
            </button>
          </form>

          {/* Social Sign In */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ position: 'relative', margin: '14px 0' }}>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', fontSize: '12px', color: '#94a3b8' }}>
                OR CONTINUE WITH
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google ({selectedRole === 'advocate' ? 'Advocate' : 'Client'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
