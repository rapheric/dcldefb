import React, { useState, useEffect } from "react";
import { message } from "antd";
import { MailOutlined, ClockCircleOutlined, RedoOutlined } from "@ant-design/icons";
import { FiLock } from "react-icons/fi";
import ncbabanklogo from "../assets/ncbabanklogo.png";
import "./EmailMFAVerification.css";

/**
 * Email MFA Verification Component
 * Displays email-based MFA code input screen
 */
const EmailMFAVerification = ({
  mfaSessionToken,
  userEmail,
  testCode,
  onVerify,
  onBack,
  isLoading,
  onResendCode,
}) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showTestCodePopup, setShowTestCodePopup] = useState(!!testCode);

  // 🔐 LOG MFA SESSION INFO FOR TESTING
  useEffect(() => {
    console.log("🔐 [MFA VERIFICATION COMPONENT LOADED]");
    console.log("📧 Email:", userEmail);
    console.log("🔑 Session Token:", mfaSessionToken);
    console.log("⏱️  Code expires in 10 minutes. Enter the 6-digit code sent to your email.");
    if (testCode) {
      setShowTestCodePopup(true);
      const timer = setTimeout(() => setShowTestCodePopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [testCode]);

  // Countdown timer for code expiry
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setError("Code expired. Please request a new one.");
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onBack]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCountdown]);

  const handleSubmit = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setError("");
      await onVerify({
        sessionToken: mfaSessionToken,
        code: code,
      });
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await onResendCode(mfaSessionToken);
      message.success("Code resent to your email");
      setCode("");
      setError("");
      setResendCountdown(60); // 60 second cooldown
    } catch (err) {
      message.error(err.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    const maskedUsername = username.substring(0, 2) + "*".repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-6 overflow-y-auto">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>

      {/* Test Code Popup Notification */}
      {showTestCodePopup && testCode && (
        <div className="fixed top-4 right-4 bg-yellow-400 text-yellow-900 px-6 py-4 rounded-lg shadow-2xl border-2 border-yellow-500 z-50 max-w-xs animate-bounce">
          <p className="font-bold text-sm mb-2">🧪 Test Code (Dev Only)</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-center mb-2">{testCode}</p>
          <button
            onClick={() => setShowTestCodePopup(false)}
            className="text-xs text-yellow-700 hover:text-yellow-900 font-semibold float-right"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full max-w-md relative z-10 my-auto mb-8">
        {/* Premium Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2">
            <div className="flex items-center justify-center gap-3">
              {/* NCBA Logo beside the icon */}
              <div className="relative">
                <img
                  src={ncbabanklogo}
                  alt="NCBA Bank"
                  className="relative h-16 w-auto object-contain"
                  style={{
                    filter: "brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                  }}
                />
              </div>
              <MailOutlined className="text-white text-xl" />
            </div>
            <h1 className="text-center text-sm font-bold text-white mt-1">
              Verify Your Email
            </h1>
            <p className="text-center text-blue-100 text-xs">
              Check your inbox for the verification code
            </p>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            {/* Email Display */}
            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600 mb-0.5">Code sent to:</p>
              <p className="text-sm font-semibold text-gray-800">{formatEmail(userEmail)}</p>
            </div>

            {/* Code Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCode(value);
                  setError("");
                }}
                className={`w-full px-3 py-2 border-2 rounded-lg text-center text-2xl font-bold tracking-[0.25em] outline-none transition ${
                  error
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-100 text-red-600"
                    : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-gray-800"
                }`}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <span className="text-sm mt-0.5">⚠️</span>
                  <div>
                    <p className="text-red-700 text-xs font-medium">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center gap-2">
              <ClockCircleOutlined className="text-sm text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Code expires in</p>
                <p className="text-base font-bold text-gray-800 font-mono">{formatTime(timeRemaining)}</p>
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || code.length !== 6}
              className={`w-full py-2 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center gap-2 mb-3 text-xs ${
                isLoading || code.length !== 6
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <FiLock className="text-sm" />
                  Verify Code
                </>
              )}
            </button>

            {/* Resend Section */}
            <div className="mb-4 text-center">
              <p className="text-xs text-gray-600 mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResendCode}
                disabled={isResending || resendCountdown > 0}
                className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg font-semibold border-2 transition text-xs ${
                  resendCountdown > 0
                    ? "text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50"
                    : "text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                <RedoOutlined className="text-sm" />
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : "Resend Code"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">or</span>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={onBack}
              disabled={isLoading}
              className="w-full py-2 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition duration-300 text-xs"
            >
              Back to Login
            </button>

            {/* Security Note */}
            <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
                <FiLock className="text-blue-600" />
                <span>Your code expires after one use</span>
              </p>
            </div>

            {/* Footer inside card */}
            <p className="text-center text-gray-400 text-xs mt-6 mb-0">Check your spam folder if you don't see the email</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailMFAVerification;
