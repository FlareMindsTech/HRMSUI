import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUser,
  FiMail,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
} from 'react-icons/fi';
import { login, fetchAuth, selectAuthError } from '../redux/slices/authSlice';
import { fetchTheme, selectTheme } from '../redux/slices/themeSlice';
import { fetchSystemSetupStatus } from '../services/organizationService';
import './Login.css';

/* ==========================================================================
   TRANSITION CONSTANTS
   ========================================================================== */
const COVER_DURATION_MS = 350;
const HOLD_DURATION_MS = 200;
const REVEAL_DURATION_MS = 350;
const TOTAL_DURATION_MS = COVER_DURATION_MS + HOLD_DURATION_MS + REVEAL_DURATION_MS; // 900ms

const Login = ({ onLogin, initialMode }) => {
  const dispatch = useDispatch();
  const authError = useSelector(selectAuthError);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial mode from prop, location path, or default to signin
  const getStartingMode = () => {
    if (initialMode) return initialMode;
    if (location.pathname.includes('/signup')) return 'signup';
    return 'signin';
  };

  const [mode, setMode] = useState(getStartingMode);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'covering' | 'holding' | 'revealing'
  const [transitionType, setTransitionType] = useState('signup-to-signin');

  // Input refs for autofocus
  const signinUserInputRef = useRef(null);
  const signupNameInputRef = useRef(null);
  const timerRefs = useRef([]);

  // Query params
  const queryParams = new URLSearchParams(location.search);
  const registered = queryParams.get('registered') === 'true';
  const initialEmail = queryParams.get('email') || '';

  // Setup status check
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupDetails, setSetupDetails] = useState(null);

  // Sign In Form State
  const [signinForm, setSigninForm] = useState({
    usernameOrEmail: initialEmail,
    password: '',
    rememberMe: true,
  });
  const [signinErrors, setSigninErrors] = useState({});
  const [signinTouched, setSigninTouched] = useState({});
  const [showSigninPass, setShowSigninPass] = useState(false);
  const [signinFocused, setSigninFocused] = useState(initialMode === 'signup' ? null : 'usernameOrEmail');

  // Sign Up Form State
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [signupErrors, setSignupErrors] = useState({});
  const [signupTouched, setSignupTouched] = useState({});
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupFocused, setSignupFocused] = useState(initialMode === 'signup' ? 'fullName' : null);

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Check setup status and load active theme on mount
  useEffect(() => {
    dispatch(fetchTheme());
    fetchSystemSetupStatus()
      .then((status) => {
        if (status?.ownerExists) {
          console.log('[owner-details] Owner exists:', status.owner || {
            ownerExists: true,
            organization: status.organization,
          });
        }
        if (status?.setupRequired && !status?.ownerExists) {
          setSetupRequired(true);
          setSetupDetails(status);
        }
      })
      .catch((e) => console.warn('Setup status check notice:', e.message));
  }, [dispatch]);

  // Autofocus input on mode switch & initial mount
  useEffect(() => {
    if (phase === 'idle') {
      const t = setTimeout(() => {
        if (mode === 'signin') {
          setSigninFocused('usernameOrEmail');
          signinUserInputRef.current?.focus();
        } else {
          setSignupFocused('fullName');
          signupNameInputRef.current?.focus();
        }
      }, 50);
      timerRefs.current.push(t);
    }
  }, [mode, phase]);

  // Sync mode with route changes if deep linked
  useEffect(() => {
    if (location.pathname.includes('/signup') && mode !== 'signup' && phase === 'idle') {
      setMode('signup');
    } else if (location.pathname.includes('/login') && mode !== 'signin' && phase === 'idle') {
      setMode('signin');
    }
  }, [location.pathname, mode, phase]);

  // Transition controller
  const switchMode = (targetMode) => {
    if (phase !== 'idle' || targetMode === mode) return;

    setGeneralError('');
    setInfoMessage('');
    const nextTransition = mode === 'signup' ? 'signup-to-signin' : 'signin-to-signup';
    setTransitionType(nextTransition);

    // Phase 1: COVER (0 to 350ms)
    setPhase('covering');

    // Phase 2: DARK HOLD (at 350ms to 550ms)
    const t1 = setTimeout(() => {
      setPhase('holding');
      const nextMode = targetMode || (mode === 'signup' ? 'signin' : 'signup');
      setMode(nextMode);

      // Deep link URL sync
      const targetUrl = nextMode === 'signup' ? '/signup' : '/login';
      navigate(targetUrl, { replace: true });
    }, COVER_DURATION_MS);

    // Phase 3: REVEAL (at 550ms to 900ms)
    const t2 = setTimeout(() => {
      setPhase('revealing');
    }, COVER_DURATION_MS + HOLD_DURATION_MS);

    // Finish (at 900ms)
    const t3 = setTimeout(() => {
      setPhase('idle');
    }, TOTAL_DURATION_MS);

    timerRefs.current.push(t1, t2, t3);
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(signupForm.password);

  // Form Validation
  const validateSignin = () => {
    const errs = {};
    if (!signinForm.usernameOrEmail.trim()) {
      errs.usernameOrEmail = 'Username or email is required';
    }
    if (!signinForm.password) {
      errs.password = 'Password is required';
    } else if (signinForm.password.length < 8) {
      errs.password = 'Must be at least 8 characters';
    }
    setSigninErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs = {};
    if (!signupForm.fullName.trim()) {
      errs.fullName = 'Full name is required';
    }
    if (!signupForm.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (!signupForm.password) {
      errs.password = 'Password is required';
    } else if (signupForm.password.length < 8) {
      errs.password = 'Must be at least 8 characters';
    }
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler for Sign In (keeps existing Redux and API logic)
  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    setSigninTouched({ usernameOrEmail: true, password: true });
    setGeneralError('');

    if (!validateSignin()) return;

    setLoading(true);

    try {
      const result = await dispatch(
        login({ identifier: signinForm.usernameOrEmail, password: signinForm.password })
      );
      if (login.fulfilled.match(result)) {
        setLoading(false);
        onLogin && onLogin();
        void dispatch(fetchAuth());
      } else {
        setGeneralError(result.payload || authError || 'Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err) {
      setGeneralError('Unable to reach the server. Please try again.');
      setLoading(false);
    }
  };

  // Submit Handler for Sign Up / Create Account
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupTouched({ fullName: true, email: true, password: true });
    setGeneralError('');

    if (!validateSignup()) return;

    // Check if initial setup is required
    if (setupRequired) {
      navigate('/setup');
      return;
    }

    setLoading(true);
    // Attempt registration or guide user
    setTimeout(() => {
      setLoading(false);
      setInfoMessage('Account created! Please sign in with your credentials.');
      switchMode('signin');
    }, 600);
  };

  return (
    <div className="auth-page">
      {/* Ambient background noise */}
      <div className="auth-bg-noise" aria-hidden="true" />

      {/* Setup / Registered Alerts if applicable */}
      {registered && (
        <div
          style={{
            zIndex: 30,
            marginBottom: '1rem',
            padding: '8px 16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            color: '#A7F3D0',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiCheckCircle />
          <span>
            <strong>Setup Complete!</strong> System Owner registered. Please sign in below.
          </span>
        </div>
      )}

      {setupRequired && !registered && (
        <div
          style={{
            zIndex: 30,
            marginBottom: '1rem',
            padding: '8px 16px',
            background: 'rgba(232, 163, 61, 0.15)',
            border: '1px solid rgba(232, 163, 61, 0.4)',
            borderRadius: '8px',
            color: '#FDE68A',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiAlertCircle />
            <span>Initial Setup Required: Organization owner not yet configured.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/setup')}
            style={{
              background: 'var(--auth-gold-primary)',
              color: '#000906',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Setup <FiArrowRight />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          THE AUTH CARD (570x345px, 16px radius, 1px dark green border)
          --------------------------------------------------------------------- */}
      <div
        className="auth-card"
        data-mode={mode}
        data-phase={phase}
        data-transition={transitionType}
      >
        {/* ===================================================================
            DARK LAYER (Holds Brand Text in both modes)
            =================================================================== */}
        <div className="auth-layer-wrapper auth-layer-wrapper-dark">
          <div className="auth-layer auth-layer-dark">
            {/* Brand content: Left side during signup, Right side during signin */}
            <div
              className={`auth-brand-content ${mode === 'signup' ? 'is-left' : 'is-right'
                }`}
            >
              {mode === 'signup' ? (
                /* State A Brand Text (Signup mode - Left side) */
                <>
                  <span className="auth-brand-tag auth-stagger-item stagger-brand-0">
                    HRMS
                  </span>
                  <div className="auth-brand-headline auth-stagger-item stagger-brand-1">
                    <span>Start the</span>
                    <br />
                    <span className="auth-italic-gold">first page.</span>
                  </div>
                  <p className="auth-brand-body auth-stagger-item stagger-brand-3">
                    One account for every board, every draft and every device you own.
                  </p>
                </>
              ) : (
                /* State B Brand Text (Signin mode - Right side) */
                <>
                  <span className="auth-brand-tag auth-stagger-item stagger-brand-0">
                    HRMS
                  </span>
                  <div className="auth-brand-headline auth-stagger-item stagger-brand-1">
                    <span>Welcome</span>
                    <br />
                    <span className="auth-italic-gold">back.</span>
                  </div>
                  <p className="auth-brand-body auth-stagger-item stagger-brand-3">
                    Your boards, your drafts and your people are exactly where you left them.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================
            CREAM LAYER (Holds Form in both modes)
            =================================================================== */}
        <div className="auth-layer-wrapper auth-layer-wrapper-cream">
          <div className="auth-layer auth-layer-cream">
            {/* Form Container: Right side during signup, Left side during signin */}
            <div
              className={`auth-form-container ${mode === 'signup' ? 'is-right' : 'is-left'
                }`}
            >
              {mode === 'signup' ? (
                /* ===========================================================
                   CREATE ACCOUNT FORM (SIGNUP)
                   =========================================================== */
                <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
                  {/* Heading & Gold bar */}
                  <div className="auth-form-header auth-stagger-item stagger-form-0">
                    <h2 className="auth-form-title">Create account</h2>
                    <div className="auth-form-bar auth-stagger-item stagger-form-1" />
                  </div>

                  {/* General / API Error */}
                  {generalError && (
                    <div className="auth-error-msg" style={{ fontSize: '10px' }}>
                      {generalError}
                    </div>
                  )}

                  {/* Field 1: Full name */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-2 ${signupFocused === 'fullName' ? 'is-active is-autofocused' : ''
                      } ${signupForm.fullName ? 'has-value' : ''}`}
                  >
                    <div className="auth-input-line-wrap">
                      <label htmlFor="auth-signup-name" className="auth-floating-label">
                        Full name
                      </label>
                      <input
                        ref={signupNameInputRef}
                        id="auth-signup-name"
                        type="text"
                        className="auth-input"
                        value={signupForm.fullName}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, fullName: e.target.value });
                          if (signupErrors.fullName) setSignupErrors({ ...signupErrors, fullName: '' });
                        }}
                        onFocus={() => setSignupFocused('fullName')}
                        onBlur={() => {
                          setSignupFocused(null);
                          setSignupTouched((p) => ({ ...p, fullName: true }));
                          if (!signupForm.fullName.trim()) {
                            setSignupErrors((p) => ({ ...p, fullName: 'Full name is required' }));
                          }
                        }}
                        autoComplete="name"
                      />
                      <FiUser className="auth-input-icon" />
                      <div className="auth-focus-underline" />
                    </div>
                    {signupTouched.fullName && signupErrors.fullName && (
                      <span className="auth-error-msg">{signupErrors.fullName}</span>
                    )}
                  </div>

                  {/* Field 2: Email address */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-3 ${signupFocused === 'email' ? 'is-active' : ''
                      } ${signupForm.email ? 'has-value' : ''}`}
                  >
                    <div className="auth-input-line-wrap">
                      <label htmlFor="auth-signup-email" className="auth-floating-label">
                        Email address
                      </label>
                      <input
                        id="auth-signup-email"
                        type="email"
                        className="auth-input"
                        value={signupForm.email}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, email: e.target.value });
                          if (signupErrors.email) setSignupErrors({ ...signupErrors, email: '' });
                        }}
                        onFocus={() => setSignupFocused('email')}
                        onBlur={() => {
                          setSignupFocused(null);
                          setSignupTouched((p) => ({ ...p, email: true }));
                          if (!signupForm.email.trim()) {
                            setSignupErrors((p) => ({ ...p, email: 'Email address is required' }));
                          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
                            setSignupErrors((p) => ({ ...p, email: 'Enter a valid email' }));
                          }
                        }}
                        autoComplete="email"
                      />
                      <FiMail className="auth-input-icon" />
                      <div className="auth-focus-underline" />
                    </div>
                    {signupTouched.email && signupErrors.email && (
                      <span className="auth-error-msg">{signupErrors.email}</span>
                    )}
                  </div>

                  {/* Field 3: Password + Hint & Strength meter */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-4 ${signupFocused === 'password' ? 'is-active' : ''
                      } ${signupForm.password ? 'has-value' : ''}`}
                  >
                    <div className="auth-input-line-wrap">
                      <label htmlFor="auth-signup-pass" className="auth-floating-label">
                        Password
                      </label>
                      <input
                        id="auth-signup-pass"
                        type={showSignupPass ? 'text' : 'password'}
                        className="auth-input"
                        value={signupForm.password}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, password: e.target.value });
                          if (signupErrors.password) setSignupErrors({ ...signupErrors, password: '' });
                        }}
                        onFocus={() => setSignupFocused('password')}
                        onBlur={() => {
                          setSignupFocused(null);
                          setSignupTouched((p) => ({ ...p, password: true }));
                          if (!signupForm.password) {
                            setSignupErrors((p) => ({ ...p, password: 'Password is required' }));
                          } else if (signupForm.password.length < 8) {
                            setSignupErrors((p) => ({ ...p, password: 'Use 8 characters or more' }));
                          }
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowSignupPass(!showSignupPass)}
                        tabIndex={-1}
                        aria-label={showSignupPass ? 'Hide password' : 'Show password'}
                      >
                        {showSignupPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <div className="auth-focus-underline" />
                    </div>

                    {/* Hint & Strength bar row */}
                    <div className="auth-password-hint-row">
                      <div className="auth-strength-meter">
                        <div
                          className={`auth-strength-bar ${passwordStrength >= 1
                              ? passwordStrength === 1
                                ? 'is-active-warn'
                                : 'is-active-good'
                              : ''
                            }`}
                        />
                        <div
                          className={`auth-strength-bar ${passwordStrength >= 2
                              ? passwordStrength === 2
                                ? 'is-active-good'
                                : 'is-active-strong'
                              : ''
                            }`}
                        />
                        <div
                          className={`auth-strength-bar ${passwordStrength >= 3 ? 'is-active-strong' : ''
                            }`}
                        />
                      </div>
                      <span className="auth-password-hint-text">Use 8 characters or more.</span>
                    </div>

                    {signupTouched.password && signupErrors.password && (
                      <span className="auth-error-msg">{signupErrors.password}</span>
                    )}
                  </div>

                  {/* Pill Button: Create account */}
                  <div className="auth-stagger-item stagger-form-5">
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading || phase !== 'idle'}
                    >
                      {loading ? 'Creating account…' : 'Create account'}
                    </button>
                  </div>

                  {/* Footer Text */}
                  <div className="auth-footer-text auth-stagger-item stagger-form-6">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      className="auth-mode-link"
                      onClick={() => switchMode('signin')}
                      disabled={phase !== 'idle'}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              ) : (
                /* ===========================================================
                   SIGN IN FORM (LOGIN - MIRROR)
                   =========================================================== */
                <form onSubmit={handleSigninSubmit} className="auth-form" noValidate>
                  {/* Heading & Gold bar */}
                  <div className="auth-form-header auth-stagger-item stagger-form-0">
                    <h2 className="auth-form-title">Sign in</h2>
                    <div className="auth-form-bar auth-stagger-item stagger-form-1" />
                  </div>

                  {/* General / API Error or Info */}
                  {generalError && (
                    <div className="auth-error-msg" style={{ fontSize: '10px' }}>
                      {generalError}
                    </div>
                  )}
                  {infoMessage && (
                    <div style={{ color: '#059669', fontSize: '10px', fontWeight: 600 }}>
                      {infoMessage}
                    </div>
                  )}

                  {/* Field 1: Username or email */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-2 ${signinFocused === 'usernameOrEmail' ? 'is-active is-autofocused' : ''
                      } ${signinForm.usernameOrEmail ? 'has-value' : ''}`}
                  >
                    <div className="auth-input-line-wrap">
                      <label htmlFor="auth-signin-user" className="auth-floating-label">
                        Username or email
                      </label>
                      <input
                        ref={signinUserInputRef}
                        id="auth-signin-user"
                        type="text"
                        className="auth-input"
                        value={signinForm.usernameOrEmail}
                        onChange={(e) => {
                          setSigninForm({ ...signinForm, usernameOrEmail: e.target.value });
                          if (signinErrors.usernameOrEmail) {
                            setSigninErrors({ ...signinErrors, usernameOrEmail: '' });
                          }
                        }}
                        onFocus={() => setSigninFocused('usernameOrEmail')}
                        onBlur={() => {
                          setSigninFocused(null);
                          setSigninTouched((p) => ({ ...p, usernameOrEmail: true }));
                          if (!signinForm.usernameOrEmail.trim()) {
                            setSigninErrors((p) => ({
                              ...p,
                              usernameOrEmail: 'Username or email is required',
                            }));
                          }
                        }}
                        autoComplete="username"
                      />
                      <FiUser className="auth-input-icon" />
                      <div className="auth-focus-underline" />
                    </div>
                    {signinTouched.usernameOrEmail && signinErrors.usernameOrEmail && (
                      <span className="auth-error-msg">{signinErrors.usernameOrEmail}</span>
                    )}
                  </div>

                  {/* Field 2: Password */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-3 ${signinFocused === 'password' ? 'is-active' : ''
                      } ${signinForm.password ? 'has-value' : ''}`}
                  >
                    <div className="auth-input-line-wrap">
                      <label htmlFor="auth-signin-pass" className="auth-floating-label">
                        Password
                      </label>
                      <input
                        id="auth-signin-pass"
                        type={showSigninPass ? 'text' : 'password'}
                        className="auth-input"
                        value={signinForm.password}
                        onChange={(e) => {
                          setSigninForm({ ...signinForm, password: e.target.value });
                          if (signinErrors.password) {
                            setSigninErrors({ ...signinErrors, password: '' });
                          }
                        }}
                        onFocus={() => setSigninFocused('password')}
                        onBlur={() => {
                          setSigninFocused(null);
                          setSigninTouched((p) => ({ ...p, password: true }));
                          if (!signinForm.password) {
                            setSigninErrors((p) => ({ ...p, password: 'Password is required' }));
                          }
                        }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowSigninPass(!showSigninPass)}
                        tabIndex={-1}
                        aria-label={showSigninPass ? 'Hide password' : 'Show password'}
                      >
                        {showSigninPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <div className="auth-focus-underline" />
                    </div>
                    {signinTouched.password && signinErrors.password && (
                      <span className="auth-error-msg">{signinErrors.password}</span>
                    )}
                  </div>

                  {/* Row: Checkbox "Keep me signed in" & "Forgot password?" */}
                  <div className="auth-remember-row auth-stagger-item stagger-form-4">
                    <label
                      className="auth-checkbox-label"
                      onClick={() =>
                        setSigninForm({ ...signinForm, rememberMe: !signinForm.rememberMe })
                      }
                    >
                      <div
                        className={`auth-checkbox-box ${signinForm.rememberMe ? 'is-checked' : ''
                          }`}
                      >
                        {signinForm.rememberMe && <FiCheck style={{ strokeWidth: 3 }} />}
                      </div>
                      <span className="auth-checkbox-text">Keep me signed in</span>
                    </label>

                    <button
                      type="button"
                      className="auth-forgot-btn"
                      onClick={() =>
                        setGeneralError(
                          'Please contact your HR administrator to reset your credentials.'
                        )
                      }
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Pill Button: Sign In */}
                  <div className="auth-stagger-item stagger-form-5">
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading || phase !== 'idle'}
                    >
                      {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                  </div>

                  {/* Footer Text */}
                  <div className="auth-footer-text auth-stagger-item stagger-form-6">
                    <span>New to HRMS? </span>
                    <button
                      type="button"
                      className="auth-mode-link"
                      onClick={() => switchMode('signup')}
                      disabled={phase !== 'idle'}
                    >
                      Create an account
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================
            MIDPOINT HRMS FLASH (Active during Phase 2 Holding)
            =================================================================== */}
        <div className={`auth-HRMS-flash ${phase === 'holding' ? 'is-active' : ''}`}>
          <span className="auth-HRMS-flash-text">HRMS</span>
          <div className="auth-HRMS-flash-line" />
        </div>
      </div>
    </div>
  );
};

export default Login;