import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiCheckCircle,
} from 'react-icons/fi';
import { login, register, fetchAuth, selectAuthError } from '../redux/slices/authSlice';
import { fetchTheme } from '../redux/slices/themeSlice';
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
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [signupErrors, setSignupErrors] = useState({});
  const [signupTouched, setSignupTouched] = useState({});
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirmPass, setShowSignupConfirmPass] = useState(false);
  const [signupFocused, setSignupFocused] = useState(initialMode === 'signup' ? 'fullName' : null);

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Clear pending timers on unmount
  useEffect(() => {
    const timers = timerRefs.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Load active theme on mount
  useEffect(() => {
    dispatch(fetchTheme());
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

  // Form Validation
  const validateSignin = () => {
    const errs = {};
    if (!signinForm.usernameOrEmail.trim()) {
      errs.usernameOrEmail = 'Username or email is required';
    }
    if (!signinForm.password) {
      errs.password = 'Password is required';
    } else if (signinForm.password.length < 6) {
      errs.password = 'Must be at least 6 characters';
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
    if (!signupForm.phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(signupForm.phoneNumber.trim())) {
      errs.phoneNumber = 'Enter a valid phone number';
    }
    if (!signupForm.password) {
      errs.password = 'Password is required';
    } else if (signupForm.password.length < 6) {
      errs.password = 'Must be at least 6 characters';
    }
    if (!signupForm.confirmPassword) {
      errs.confirmPassword = 'Confirm password is required';
    } else if (signupForm.confirmPassword !== signupForm.password) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler for Sign In
  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    if (loading || phase !== 'idle') return;

    setSigninTouched({ usernameOrEmail: true, password: true });
    setGeneralError('');
    setInfoMessage('');

    if (!validateSignin()) return;

    setLoading(true);

    try {
      const result = await dispatch(
        login({ identifier: signinForm.usernameOrEmail, password: signinForm.password })
      );
      if (login.fulfilled.match(result)) {
        setLoading(false);
        onLogin && onLogin();
        void dispatch(fetchAuth({ force: true }));

        const nextAction = result.payload?.nextAction;
        if (nextAction === 'SETUP_ORGANIZATION') {
          navigate('/setup', { replace: true });
        } else if (nextAction === 'RENEW_SUBSCRIPTION') {
          navigate('/subscription-renewal', { replace: true });
        } else if (nextAction === 'OPEN_DASHBOARD' || !nextAction) {
          navigate('/dashboard', { replace: true });
        } else {
          setGeneralError(`Unknown access status (${nextAction}). Please contact system administrator.`);
        }
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
    if (loading || phase !== 'idle') return;

    setSignupTouched({
      fullName: true,
      email: true,
      phoneNumber: true,
      password: true,
    });
    setGeneralError('');
    setInfoMessage('');

    if (!validateSignup()) return;

    setLoading(true);

    try {
      const result = await dispatch(
        register({
          name: signupForm.fullName,
          fullName: signupForm.fullName,
          email: signupForm.email,
          phoneNumber: signupForm.phoneNumber,
          phone: signupForm.phoneNumber,
          password: signupForm.password,
        })
      );

      if (register.fulfilled.match(result)) {
        setLoading(false);
        const data = result.payload;

        if (data?.token) {
          onLogin && onLogin();
          void dispatch(fetchAuth({ force: true }));

          const nextAction = data?.nextAction || 'SETUP_ORGANIZATION';
          if (nextAction === 'SETUP_ORGANIZATION') {
            navigate('/setup', { replace: true });
          } else if (nextAction === 'RENEW_SUBSCRIPTION') {
            navigate('/subscription-renewal', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          // If backend requires sign in or email verification after registration
          setInfoMessage(data?.message || 'Account registered successfully! Please sign in.');
          setSigninForm((prev) => ({
            ...prev,
            usernameOrEmail: signupForm.email,
          }));
          switchMode('signin');
        }
      } else {
        setLoading(false);
        setGeneralError(result.payload || 'Registration failed. Please check your details and try again.');
      }
    } catch (err) {
      setLoading(false);
      setGeneralError('Unable to reach the registration server. Please check your internet connection.');
    }
  };

  return (
    <div className="auth-page">
      {/* Ambient background noise */}
      <div className="auth-bg-noise" aria-hidden="true" />

      {/* Registered Alert if applicable */}
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

      {/* ---------------------------------------------------------------------
          THE AUTH CARD (880x570px, 20px radius, 1px dark green border)
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
                    <div className="auth-error-msg" style={{ fontSize: '11px', padding: '2px 0' }}>
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

                  {/* Field 3: Phone number */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-4 ${signupFocused === 'phoneNumber' ? 'is-active' : ''
                      } ${signupForm.phoneNumber ? 'has-value' : ''}`}
                  >
                    <div className="auth-input-line-wrap">
                      <label htmlFor="auth-signup-phone" className="auth-floating-label">
                        Phone number
                      </label>
                      <input
                        id="auth-signup-phone"
                        type="tel"
                        className="auth-input"
                        value={signupForm.phoneNumber}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, phoneNumber: e.target.value });
                          if (signupErrors.phoneNumber) setSignupErrors({ ...signupErrors, phoneNumber: '' });
                        }}
                        onFocus={() => setSignupFocused('phoneNumber')}
                        onBlur={() => {
                          setSignupFocused(null);
                          setSignupTouched((p) => ({ ...p, phoneNumber: true }));
                          if (!signupForm.phoneNumber.trim()) {
                            setSignupErrors((p) => ({ ...p, phoneNumber: 'Phone number is required' }));
                          } else if (!/^\+?[0-9\s-]{7,15}$/.test(signupForm.phoneNumber.trim())) {
                            setSignupErrors((p) => ({ ...p, phoneNumber: 'Enter a valid phone number' }));
                          }
                        }}
                        autoComplete="tel"
                      />
                      <FiPhone className="auth-input-icon" />
                      <div className="auth-focus-underline" />
                    </div>
                    {signupTouched.phoneNumber && signupErrors.phoneNumber && (
                      <span className="auth-error-msg">{signupErrors.phoneNumber}</span>
                    )}
                  </div>

                  {/* Field 4: Password */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-5 ${signupFocused === 'password' ? 'is-active' : ''
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
                          } else if (signupForm.password.length < 6) {
                            setSignupErrors((p) => ({ ...p, password: 'Must be at least 6 characters' }));
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
                    {signupTouched.password && signupErrors.password && (
                      <span className="auth-error-msg">{signupErrors.password}</span>
                    )}
                  </div>

                  {/* Field 5: Confirm Password */}
                  <div
                    className={`auth-field auth-stagger-item stagger-form-5 ${signupFocused === 'confirmPassword' ? 'is-active' : ''
                      } ${signupForm.confirmPassword ? 'has-value' : ''}`}
                  >
                    <div className="auth-input-line-wrap">
                      <label htmlFor="auth-signup-confpass" className="auth-floating-label">
                        Confirm password
                      </label>
                      <input
                        id="auth-signup-confpass"
                        type={showSignupConfirmPass ? 'text' : 'password'}
                        className="auth-input"
                        value={signupForm.confirmPassword}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, confirmPassword: e.target.value });
                          if (signupErrors.confirmPassword) setSignupErrors({ ...signupErrors, confirmPassword: '' });
                        }}
                        onFocus={() => setSignupFocused('confirmPassword')}
                        onBlur={() => {
                          setSignupFocused(null);
                          setSignupTouched((p) => ({ ...p, confirmPassword: true }));
                          if (!signupForm.confirmPassword) {
                            setSignupErrors((p) => ({ ...p, confirmPassword: 'Confirm password is required' }));
                          } else if (signupForm.confirmPassword !== signupForm.password) {
                            setSignupErrors((p) => ({ ...p, confirmPassword: 'Passwords do not match' }));
                          }
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowSignupConfirmPass(!showSignupConfirmPass)}
                        tabIndex={-1}
                        aria-label={showSignupConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showSignupConfirmPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <div className="auth-focus-underline" />
                    </div>
                    {signupTouched.confirmPassword && signupErrors.confirmPassword && (
                      <span className="auth-error-msg">{signupErrors.confirmPassword}</span>
                    )}
                  </div>

                  {/* Pill Button: Create account */}
                  <div className="auth-stagger-item stagger-form-6">
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading || phase !== 'idle'}
                    >
                      {loading ? 'Creating account…' : 'Create account'}
                    </button>
                  </div>

                  {/* Footer Text */}
                  <div className="auth-footer-text auth-stagger-item stagger-form-7">
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
                    <div className="auth-error-msg" style={{ fontSize: '11px', padding: '2px 0' }}>
                      {generalError}
                    </div>
                  )}
                  {infoMessage && (
                    <div style={{ color: '#059669', fontSize: '11px', fontWeight: 600, padding: '2px 0' }}>
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
                          } else if (signinForm.password.length < 6) {
                            setSigninErrors((p) => ({ ...p, password: 'Must be at least 6 characters' }));
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