import React, { useState, useEffect } from "react";
import { FiLock } from "react-icons/fi";
import ncbabanklogo from "../assets/ncbabanklogo.png";
import "./MFAVerification.css";

/**
 * MFA Verification Component
 * Displays MFA verification form during login with consistent design
 */
const MFAVerification = ({ mfaSessionToken, onVerify, onBack, isLoading }) => {
  const [code, setCode] = useState("");
  const [method, setMethod] = useState("totp");
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onBack]);

  const handleSubmit = () => {
    if (!code || code.length < 4) {
      setError("Please enter a valid code");
      return;
    }

    onVerify({
      mfaToken: code,
      method: method,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1929]/80 via-[#0A1929]/60 to-[#0A1929]/90"></div>
        
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
              Verify Your Identity
            </h2>
            <p className="text-[#0A2647] text-base md:text-lg mb-5">
              Your session expires in {formatTime(timeRemaining)}
            </p>

            {/* Verification Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              {/* Method Selection */}
              <div>
                <label className="block text-[#0A1929] text-sm md:text-base font-semibold mb-2">
                  Verification Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border-2 border-[#1E3A6F]/20 rounded-lg cursor-pointer hover:border-[#1E3A6F]/40 transition">
                    <input
                      type="radio"
                      name="method"
                      value="totp"
                      checked={method === "totp"}
                      onChange={(e) => {
                        setMethod(e.target.value);
                        setError("");
                      }}
                      className="w-5 h-5 accent-[#0A1929] cursor-pointer"
                    />
                    <span className="text-[#0A1929] text-sm md:text-base font-medium">Authenticator App</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 border-[#1E3A6F]/20 rounded-lg cursor-pointer hover:border-[#1E3A6F]/40 transition">
                    <input
                      type="radio"
                      name="method"
                      value="backup"
                      checked={method === "backup"}
                      onChange={(e) => {
                        setMethod(e.target.value);
                        setError("");
                      }}
                      className="w-5 h-5 accent-[#0A1929] cursor-pointer"
                    />
                    <span className="text-[#0A1929] text-sm md:text-base font-medium">Backup Code</span>
                  </label>
                </div>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-[#0A1929] text-sm md:text-base font-semibold mb-2">
                  {method === "totp" ? "Enter 6-digit code from your authenticator" : "Enter backup code"}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A6F] text-xl" />
                  <input
                    type="text"
                    maxLength={method === "totp" ? "6" : "8"}
                    placeholder={method === "totp" ? "000000" : "XXXXXXXX"}
                    value={code}
                    onChange={(e) => {
                      if (method === "totp") {
                        setCode(e.target.value.replace(/\D/g, ""));
                      } else {
                        setCode(e.target.value.toUpperCase());
                      }
                      if (error) setError("");
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-b-2 border-[#1E3A6F]/20 text-[#0A1929] placeholder-[#4A6FA5]/60 text-base font-mono focus:outline-none focus:ring-0 focus:border-[#0A1929] transition-colors"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-xs md:text-sm font-medium">⚠️ {error}</p>
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || (method === "totp" && code.length !== 6) || code.length < 4}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  isLoading || (method === "totp" && code.length !== 6) || code.length < 4
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
                    Verify
                  </>
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="w-full py-2 text-[#0A1929] font-semibold rounded-xl border-2 border-[#0A1929] hover:bg-[#0A1929]/5 transition duration-300 text-base md:text-lg"
              >
                Back to Login
              </button>
            </form>

            {/* Security Note */}
            <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-[#0A1929] text-xs md:text-sm flex items-center justify-center gap-2">
                <FiLock className="text-[#0A1929]" />
                <span>Your code is encrypted and secure</span>
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

export default MFAVerification;
