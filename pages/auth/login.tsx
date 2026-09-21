import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  Loader2,
  Info,
  Share2
} from "lucide-react";
import { validateUserAPI, validatePasswordAPI, terminateSessionsAPI } from "@/utils/authAPI";
import Image from 'next/image';
import Background from '@/components/ui/background';
import AppSidebar from "@/components/ui/sidebar";
import Link from 'next/link';

// Types
interface FormErrors {
  netId?: string;
  password?: string;
  general?: string;
}

interface LoginStatusNotice {
  message: string;
  type: 'warning' | 'info';
}

// Loading skeleton for initial auth check
const LoadingSkeleton = () => (
  <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white flex items-center justify-center">
    <div className="max-w-md w-full mx-auto">
      <div className="bg-[#111111] rounded-xl p-8 border border-[#222222] animate-pulse">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-700 rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-gray-700 rounded w-32 mx-auto" />
        </div>
        <div className="space-y-6">
          <div className="h-12 bg-gray-700 rounded-lg" />
          <div className="h-12 bg-gray-700 rounded-lg" />
          <div className="h-12 bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// Enhanced error display component
const ErrorDisplay = ({ error, type = "error" }: { error: string; type?: "error" | "warning" | "info" }) => {
  const iconMap = {
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />
  };

  const colorMap = {
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${colorMap[type]} border rounded-lg p-3`}
    >
      <div className="flex items-start gap-2">
        {iconMap[type]}
        <p className="text-sm flex-1">{error}</p>
      </div>
    </motion.div>
  );
};

const LoginPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    netId: "",
    password: ""
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [statusNotice, setStatusNotice] = useState<LoginStatusNotice | null>(null);

  const handlePublicNavigate = useCallback((page: string) => {
    if (page === "dashboard") {
      router.push("/");
      return;
    }
    router.push(`/${page}`);
  }, [router]);

  // Input validation
  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'netId':
        if (!value.trim()) return "NetID is required";
        if (value.length < 2) return "NetID must be at least 2 characters";
        // Basic format validation for NetID
        if (!/^[a-zA-Z]{2}\d{4}(@srmist\.edu\.in)?$/.test(value)) {
          return "NetID should be in format: ab1234 or ab1234@srmist.edu.in";
        }
        return undefined;
      case 'password':
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // Real-time validation
  const isFormValid = useMemo(() => {
    return Object.keys(formData).every(key =>
      !validateField(key, formData[key as keyof typeof formData])
    );
  }, [formData, validateField]);

  useEffect(() => {
    let isMounted = true;

    // Completely skip auth check if user was banned to prevent any requests
    if (typeof window !== 'undefined') {
      const isBannedSession = sessionStorage.getItem('logged-out-banned-user')
      const isBannedLocal = localStorage.getItem('logged-out-banned-user')

      if (isBannedSession || isBannedLocal) {
        // Banned user detected; skip auth check silently
        setIsLoading(false);
        return;
      }

      // If there is no auth token cookie, skip the /api/userinfo call to avoid
      // unnecessary prefetches/redirects when unauthenticated.
      const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('token='));
      if (!hasToken) {
        setIsLoading(false);
        return;
      }
    }

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/userinfo', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok && isMounted) {
          router.replace("/");
          return;
        }
      } catch (error) {
        // Ignore auth check errors silently
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Basic input sanitization
    const sanitizedValue = value.trim().replace(/[<>]/g, '');

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(name));

    // Validate field if it's been touched
    if (touchedFields.has(name) || sanitizedValue) {
      const fieldError = validateField(name, sanitizedValue);
      setFormErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    }

    // Clear general error when user starts typing
    if (error) setError("");
  }, [error, validateField, touchedFields]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => new Set(prev).add(name));

    const fieldError = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  }, [validateField]);

  const sanitizeAndFormatInput = useCallback((netId: string, password: string) => {
    // Sanitize inputs
    const cleanNetId = netId.trim().toLowerCase().replace(/[<>]/g, '');
    const cleanPassword = password.replace(/[<>]/g, '');

    // Format email
    const email = cleanNetId.includes("@srmist.edu.in")
      ? cleanNetId
      : `${cleanNetId}@srmist.edu.in`;

    return { email, password: cleanPassword };
  }, []);

  const authenticateWithCredentials = useCallback(async (email: string, password: string) => {
    const userRes = await validateUserAPI(email);
    const userResult = userRes.res || userRes;

    if (userRes.error) {
      return { ok: false, error: userRes.error as string };
    }

    if (userResult.status_code === 400) {
      return { ok: false, error: userResult.message as string };
    }

    if (userResult.status_code === 500) {
      return {
        ok: false,
        error: "Maximum login attempts reached. Please try again later or contact support.",
      };
    }

    if (!userResult.identifier || !userResult.digest) {
      return {
        ok: false,
        error: userResult.message || "Invalid response from server. Please try again.",
      };
    }

    const passRes = await validatePasswordAPI({
      digest: userResult.digest as string,
      identifier: userResult.identifier as string,
      password,
      cookies: userRes.cookies || '',
    });

    const passResult = passRes.res || passRes;
    const passData = passResult.data || passResult;
    const passMeta = passRes.meta || {};

    if (passData.captcha?.required || passResult.captcha?.required) {
      return {
        ok: false,
        error: "CAPTCHA verification required. Please try logging in through the official SRM Academia website first, then return here.",
      };
    }

    if (passData.status_code === 400 || passData.statusCode === 400) {
      return {
        ok: false,
        error: (passData.message as string) || "Invalid credentials. Please check your NetID and password.",
      };
    }

    if (passData.status_code === 500 || passData.statusCode === 500) {
      return {
        ok: false,
        error: (passData.message as string) || "Server error. Please try again later.",
      };
    }

    if (passResult.error) {
      return { ok: false, error: passResult.error as string };
    }

    const isAuthenticated = !!(
      passData.success || passResult.success || passData.token || passResult.isAuthenticated
    );

    if (!isAuthenticated) {
      return {
        ok: false,
        error: "Login failed. Please verify your credentials and try again.",
      };
    }

    return { ok: true, passMeta };
  }, []);

  const hasSessionLimitAfterLogin = useCallback(async (): Promise<boolean> => {
    const response = await fetch('/api/userinfo', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      return false;
    }

    const { parseJsonSafe } = await import('@/utils/parseResponse');
    const errorData = await parseJsonSafe(response).catch(() => ({}));
    return !!errorData?.sessionLimit;
  }, []);

  const handleShare = useCallback(async () => {
    try {
      const shareData = {
        title: 'Studique - Student Companion Platform',
        text: 'Check out Studique for attendance tracking, notes, mess menu and more!',
        url: 'https://studique.in/'
      };

      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Website link copied to clipboard!');
      }
    } catch {
      // ignore share errors silently
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastSubmissionTime < 2000) {
      setError("Please wait before trying again.");
      return;
    }
    setLastSubmissionTime(now);

    setLoginLoading(true);
    setError("");
    setStatusNotice(null);
    setFormErrors({});

    try {
      const { email, password } = sanitizeAndFormatInput(formData.netId, formData.password);

      const authResult = await authenticateWithCredentials(email, password);
      if (!authResult.ok) {
        setError(authResult.error || "Login failed. Please try again.");
        return;
      }

      const recoverySeenInAuth = !!(
        authResult.passMeta?.sessionLimitDetected || authResult.passMeta?.autoRecoveryAttempted
      );

      let sessionLimitDetected = await hasSessionLimitAfterLogin();

      if (recoverySeenInAuth || sessionLimitDetected) {
        setStatusNotice({
          message: 'Sessions full. Auto-terminating old sessions...',
          type: 'warning',
        });
        await new Promise((resolve) => setTimeout(resolve, 2300));
      }

      if (sessionLimitDetected) {
        await terminateSessionsAPI();

        setStatusNotice({
          message: 'Relogging in...',
          type: 'info',
        });
        await new Promise((resolve) => setTimeout(resolve, 1300));

        const reloginResult = await authenticateWithCredentials(email, password);
        if (!reloginResult.ok) {
          setError(reloginResult.error || "Relogin failed. Please try again.");
          return;
        }

        sessionLimitDetected = await hasSessionLimitAfterLogin();
        if (sessionLimitDetected) {
          setError('Session limit is still active. Please try again in a few seconds.');
          return;
        }
      }

      setError("");
      setStatusNotice({
        message: 'Relogging in...',
        type: 'info',
      });
      await new Promise((resolve) => setTimeout(resolve, 900));

      // Wait for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect
      window.location.href = "/";
    } catch (error) {
      // Login error suppressed to avoid console noise

      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError("Network error. Please check your internet connection and try again.");
        } else {
          setError("An unexpected error occurred. Please try again or contact support if the problem persists.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="relative flex min-h-screen">
      <Background />
      <AppSidebar
        onNavigate={handlePublicNavigate}
        currentPage="auth-login"
      />
      <button
        type="button"
        onClick={handleShare}
        className="fixed top-4 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-[#111111] lg:top-6 lg:right-6 lg:h-auto lg:w-auto lg:gap-2 lg:px-4 lg:py-2.5 lg:text-sm lg:font-semibold"
        aria-label="Share Studique website"
        title="Share Studique"
      >
        <Share2 className="h-5 w-5" />
        <span className="hidden lg:inline">Share Studique</span>
      </button>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8 lg:pl-56">
        <AnimatePresence>
          {statusNotice && (
            <motion.div
              initial={{ opacity: 0, x: 30, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: -10 }}
              transition={{ duration: 0.25 }}
              className={`fixed top-4 right-4 z-50 border rounded-lg px-4 py-3 shadow-lg backdrop-blur-md ${statusNotice.type === 'warning'
                ? 'bg-yellow-500/15 border-yellow-400/40 text-yellow-300'
                : 'bg-blue-500/15 border-blue-400/40 text-blue-200'
                }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusNotice.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="max-w-md w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#111111] rounded-xl p-5 sm:p-6 border border-[#222222]"
          >
            {/* Logo and Title */}
            <header className="text-center mb-6">
              <motion.div
                className="flex justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src="/images/qrark.png"
                  alt="Studique Logo"
                  width={75}
                  height={75}
                  className="mx-auto mb-6"
                />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-1">Welcome to Studique</h1>
              <p className="text-gray-400 text-sm">Sign in with your SRM Academia credentials</p>
            </header>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* NetID Field */}
              <div>
                <label htmlFor="netId" className="block text-sm font-medium text-gray-300 mb-2">
                  NetID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="netId"
                    name="netId"
                    value={formData.netId}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${formErrors.netId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-[#222222] focus:ring-orange-500 focus:border-transparent'
                      }`}
                    placeholder="Enter your NetID (e.g., ab1234)"
                    required
                    autoComplete="username"
                    aria-invalid={!!formErrors.netId}
                    aria-describedby={formErrors.netId ? "netId-error" : undefined}
                  />
                  {formData.netId && !formErrors.netId && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    </div>
                  )}
                </div>
                <AnimatePresence>
                  {formErrors.netId && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      id="netId-error"
                      className="mt-1 text-sm text-red-400"
                    >
                      {formErrors.netId}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-12 py-2 bg-[#1a1a1a] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${formErrors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-[#222222] focus:ring-orange-500 focus:border-transparent'
                      }`}
                    placeholder="Enter your Academia password"
                    required
                    autoComplete="current-password"
                    aria-invalid={!!formErrors.password}
                    aria-describedby={formErrors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {formErrors.password && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      id="password-error"
                      className="mt-1 text-sm text-red-400"
                    >
                      {formErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Error Messages */}
              <AnimatePresence>
                {error && (
                  <ErrorDisplay error={error} type="error" />
                )}
              </AnimatePresence>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginLoading || !isFormValid}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#111111]"
                aria-describedby="login-button-description"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In Securely</span>
                )}
              </button>
              <p id="login-button-description" className="sr-only">
                {loginLoading ? "Signing you in, please wait" : "Click to sign in with your SRM credentials"}
              </p>
            </form>
            {/* Unitwise Button - below form  */}

            {/* <Link
            href="/unitwise"
            className="w-full mt-6 flex items-center justify-center gap-2 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-3 rounded-lg border border-orange-300 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-[#111111]"
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Access Unitwise
            </span>
          </Link> */}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
