import React, { useState, useEffect } from "react";
import { message } from "antd";
import { MailOutlined, ClockCircleOutlined, RedoOutlined } from "@ant-design/icons";
import { FiLock } from "react-icons/fi";
import ncbabanklogo from "../assets/ncbabanklogo.png";
import "./EmailMFAVerification.css";

/**
 * Email MFA Verification Component
 * Displays email-based MFA code input screen with consistent design
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
  }, [testCode, mfaSessionToken, userEmail]);

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
    <div className="min-h-screen bg-[#F9FBFE] flex">
      {/* Left Side - Enterprise Bank Image with Large Logo */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#0A1929]">
        {/* Premium banking image */}
        <img 
          src="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt="Modern bank corporate office with glass architecture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Darker overlay for better logo visibility */}
        <div className="absolute inset-0 bg-linear-to-b from-[#0A1929]/80 via-[#0A1929]/60 to-[#0A1929]/90"></div>
        
        {/* Large NCBA Logo on side image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <img
              src={ncbabanklogo}
              alt="NCBA Bank"
              className="w-64 h-auto object-contain mx-auto"
              style={{
                filter: "brightness(0) invert(1) drop-shadow(0 10px 20px rgba(0,0,0,0.4))"
              }}
            />
            <h2 className="text-white text-3xl font-bold mt-6 tracking-wide">NCBA BANK</h2>
            <p className="text-white/80 text-lg mt-2">Secure Banking Platform</p>
          </div>
        </div>
        
        {/* Text overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <div className="flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-white/80">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-white/80">ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 md:p-8 overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* Test Code Popup Notification */}
          {showTestCodePopup && testCode && (
            <div className="mb-4 bg-yellow-50 text-yellow-900 px-4 py-3 rounded-lg border-2 border-yellow-200 flex items-start justify-between">
              <div>
                <p className="font-bold text-sm mb-2">🧪 Test Code (Dev Only)</p>
                <p className="text-xl font-mono font-bold tracking-widest text-center">{testCode}</p>
              </div>
              <button
                onClick={() => setShowTestCodePopup(false)}
                className="text-sm text-yellow-700 hover:text-yellow-900 font-semibold"
              >
                ✕
              </button>
            </div>
          )}

          <div className="relative">
            {/* Brand - Logo */}
            <div className="mb-4">
              <img
                src={ncbabanklogo}
                alt="NCBA Bank"
                className="h-24 w-auto object-contain"
              />
            </div>

            {/* Welcome message */}
            <h2 className="text-[#0A1929] text-3xl md:text-4xl font-semibold leading-tight mb-1">
              Verify Email
            </h2>
            <p className="text-[#0A2647] text-base md:text-lg mb-5">
              Enter the code sent to your email
            </p>

            {/* Verification Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              {/* Email Display */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-[#0A1929] text-xs md:text-sm mb-1">Code sent to:</p>
                <p className="text-[#0A1929] font-semibold text-sm md:text-base">{formatEmail(userEmail)}</p>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-[#0A1929] text-sm md:text-base font-semibold mb-2">
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
                  className={`w-full px-4 py-3 border-b-2 text-center text-2xl font-bold tracking-[0.25em] text-[#0A1929] placeholder-[#4A6FA5]/60 focus:outline-none focus:ring-0 transition-colors ${
                    error
                      ? "border-red-500 focus:border-red-600"
                      : "border-[#1E3A6F]/20 focus:border-[#0A1929]"
                  }`}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-xs md:text-sm font-medium">⚠️ {error}</p>
                </div>
              )}

              {/* Timer */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-3">
                <ClockCircleOutlined className="text-[#1E3A6F] text-lg" />
                <div>
                  <p className="text-[#0A1929] text-xs md:text-sm">Code expires in</p>
                  <p className="text-[#0A1929] font-bold font-mono text-base md:text-lg">{formatTime(timeRemaining)}</p>
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  isLoading || code.length !== 6
                    ? "bg-[#4A6FA5]/50 text-white cursor-not-allowed"
                    : "bg-[#0A1929] text-white hover:bg-[#0A2647] shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <FiLock className="text-lg" />
                    Verify Code
                  </>
                )}
              </button>

              {/* Resend Section */}
              <div className="text-center pt-2">
                <p className="text-[#0A1929] text-sm md:text-base mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending || resendCountdown > 0}
                  className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg font-semibold border-2 transition text-sm md:text-base ${
                    resendCountdown > 0
                      ? "text-gray-500 border-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-[#0A1929] border-[#0A1929] hover:bg-[#0A1929]/5"
                  }`}
                >
                  <RedoOutlined className="text-lg" />
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : "Resend Code"}
                </button>
              </div>

              {/* Back Button */}
              <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="w-full py-2 text-[#0A1929] font-semibold rounded-xl border-2 border-[#0A1929] hover:bg-[#0A1929]/5 transition duration-300"
              >
                Back to Login
              </button>
            </form>

            {/* Security Note */}
            <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-[#0A1929] text-xs md:text-sm flex items-center justify-center gap-2">
                <FiLock className="text-[#0A1929]" />
                <span>Your code expires after one use</span>
              </p>
            </div>

            {/* Footer */}
            <p className="text-center text-[#1E3A6F] text-xs md:text-sm mt-6 mb-2">
              © 2026 NCBA Bank. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailMFAVerification;
