// export default LoginPage;
import React, { useState } from "react";
import { useLoginMutation, useVerifyEmailMFAMutation, useResendMFACodeMutation } from "../api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials, setMFASessionToken } from "../api/authSlice";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import EmailMFAVerification from "../components/EmailMFAVerification";
import MFAVerification from "../components/MFAVerification";
import SSOLogin from "../components/SSOLogin";
import ncbabanklogo from "../assets/ncbabanklogo.png";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [mfaStep, setMFAStep] = useState(false);
  const [mfaMethod, setMFAMethod] = useState(null);
  const [mfaSessionToken, setMFASessionTokenLocal] = useState("");
  const [devTestCode, setDevTestCode] = useState("");
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyEmailMFA, { isLoading: isVerifyingEmailMFA }] = useVerifyEmailMFAMutation();
  const [resendMFACode, { isLoading: isResending }] = useResendMFACodeMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Login credentials:", form);
      const res = await login(form).unwrap();

      console.log("=== FULL API RESPONSE ===");
      console.log("Complete Response:", res);
      console.log("isMFARequired:", res?.isMFARequired);
      console.log("mfaSessionToken:", res?.mfaSessionToken);
      console.log("mFASessionToken:", res?.mFASessionToken);
      console.log("mfaMethod:", res?.mfaMethod);
      console.log("mFAMethod:", res?.mFAMethod);
      console.log("User:", res?.user);
      console.log("Token:", res?.token);
      console.log("========================");

      const sessionToken = res?.mfaSessionToken || res?.mFASessionToken;
      const mfaMethod = res?.mfaMethod || res?.mFAMethod;
      const isMFARequired = res?.isMFARequired;
      const testCode = res?.devTestCode;

      console.log("✅ RESOLVED SESSION TOKEN:", sessionToken);
      console.log("✅ RESOLVED MFA METHOD:", mfaMethod);
      console.log("✅ IS MFA REQUIRED:", isMFARequired);
      console.log("🧪 TEST CODE (DEV ONLY):", testCode);

      if (isMFARequired && sessionToken) {
        console.log("✅ [LOGIN SUCCESS - MFA REQUIRED]");
        console.log("📧 User Email:", form.email);
        console.log("🔑 MFA Session Token:", sessionToken);
        console.log("📤 MFA Method:", mfaMethod);
        console.log("🧪 Test Code:", testCode);
        console.log("⏳ Switching to MFA verification step...");
        
        setMFASessionTokenLocal(sessionToken);
        setMFAMethod(mfaMethod || "EMAIL");
        setDevTestCode(testCode || "");
        dispatch(setMFASessionToken(sessionToken));
        setMFAStep(true);
        return;
      }

      console.log("⚠️ [NO MFA REQUIRED] Logging in without MFA");
      console.log("User Role:", res?.user?.role);
      dispatch(setCredentials(res));
      redirectUserByRole(res?.user?.role);
    } catch (err) {
      console.error("❌ [LOGIN ERROR]", err);
      console.error("Error Details:", err?.data);
      alert(err?.data?.message || "Login failed");
    }
  };

  const handleEmailMFAVerify = async (data) => {
    try { 
      const res = await verifyEmailMFA({
        sessionToken: data.sessionToken,
        code: data.code,
      }).unwrap();

      dispatch(setCredentials(res));
      dispatch(setMFASessionToken(null));
      redirectUserByRole(res?.user?.role);
    } catch (err) {
      throw new Error(err?.data?.message || "MFA verification failed");
    }
  };

  const handleResendCode = async (sessionToken) => {
    try {
      await resendMFACode(sessionToken).unwrap();
      return true;
    } catch (err) {
      throw new Error(err?.data?.message || "Failed to resend code");
    }
  };

  const handleMFAVerify = async (mfaToken) => {
    try {
      const res = await login({
        ...form,
        mfaToken,
        sessionToken: mfaSessionToken,
      }).unwrap();

      dispatch(setCredentials(res));
      dispatch(setMFASessionToken(null));
      redirectUserByRole(res?.user?.role);
    } catch (err) {
      alert(err?.data?.message || "MFA verification failed");
    }
  };

  const handleSSOSuccess = (ssoResponse) => {
    dispatch(setCredentials(ssoResponse));
    redirectUserByRole(ssoResponse?.user?.role);
  };

  const redirectUserByRole = (role) => {
    const roleStr = role?.toLowerCase();
    switch (roleStr) {
      case "admin":
        navigate("/admin");
        break;
      case "cochecker":
        navigate("/cochecker");
        break;
      case "rm":
        navigate("/rm");
        break;
      case "cocreator":
        navigate("/cocreator");
        break;
      case "approver":
        navigate("/approver");
        break;
      default:
        navigate("/register");
        break;
    }
  };

  console.log("🔍 [RENDER CHECK] mfaStep:", mfaStep, "mfaMethod:", mfaMethod);
  if (mfaStep && mfaMethod === "EMAIL") {
    console.log("✅ [RENDERING EMAIL MFA VERIFICATION COMPONENT]");
    return (
      <EmailMFAVerification
        mfaSessionToken={mfaSessionToken}
        userEmail={form.email}
        testCode={devTestCode}
        onVerify={handleEmailMFAVerify}
        onBack={() => {
          setMFAStep(false);
          setMFASessionTokenLocal("");
          setMFAMethod(null);
          setDevTestCode("");
        }}
        isLoading={isVerifyingEmailMFA || isResending}
        onResendCode={handleResendCode}
      />
    );
  }

  if (mfaStep && mfaMethod === "TOTP") {
    return (
      <MFAVerification
        mfaSessionToken={mfaSessionToken}
        onVerify={handleMFAVerify}
        onBack={() => {
          setMFAStep(false);
          setMFASessionTokenLocal("");
          setMFAMethod(null);
        }}
        isLoading={isLoginLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FBFE] flex">
      {/* DEBUG: Show MFA State */}
      {(mfaStep || mfaMethod) && (
        <div className="fixed top-4 right-4 bg-[#0A1929] text-white px-4 py-2 rounded text-sm z-50">
          🔍 DEBUG: mfaStep={String(mfaStep)}, mfaMethod={mfaMethod}
        </div>
      )}

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
              className="w-80 h-auto object-contain mx-auto"
              style={{
                filter: "brightness(0) invert(1) drop-shadow(0 10px 20px rgba(0,0,0,0.4))"
              }}
            />
            <h2 className="text-white text-4xl font-bold mt-8 tracking-wide">NCBA BANK</h2>
            <p className="text-white/80 text-xl mt-3">DOCUMENT CHECKLIST AND DEFERRAL MANAGEMENT SYSTEM</p>
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 md:p-8 overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* No card - floating on background */}
          <div className="relative">
            {/* Brand - only NCBA logo, bigger, no Flinger text */}
            <div className="mb-4">
              <img
                src={ncbabanklogo}
                alt="NCBA Bank"
                className="h-24 w-auto object-contain"
              />
            </div>

            {/* Welcome message - darker text */}
            <h2 className="text-[#0A1929] text-xl md:text-xl font-semibold leading-tight mb-1">
              DCL & Deferral Management System
            </h2>
           
            {/* Login Form - completely borderless */}
            <form onSubmit={handleLoginSubmit} className="space-y-6 mt-6">
              {/* Email - darker text */}
              <div>
                <label className="block text-[#0A1929] text-sm md:text-base font-semibold mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A6F] text-xl" />
                  <input
                    type="email"
                    value={form.email}
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-b-2 border-[#1E3A6F]/20 text-[#0A1929] placeholder-[#4A6FA5]/60 text-base focus:outline-none focus:ring-0 focus:border-[#0A1929] transition-colors"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password - darker text */}
              <div>
                <label className="block text-[#0A1929] text-sm md:text-base font-semibold mb-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A6F] text-xl" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-transparent border-b-2 border-[#1E3A6F]/20 text-[#0A1929] placeholder-[#4A6FA5]/60 text-base focus:outline-none focus:ring-0 focus:border-[#0A1929] transition-colors"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E3A6F] hover:text-[#0A1929] transition"
                  >
                    {showPassword ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password - darker */}
              <div className="flex items-center justify-between text-xs md:text-base pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-2 border-[#1E3A6F] text-[#0A1929] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#0A1929] font-medium">Remember me</span>
                </label>
                <a 
                  href="#" 
                  className="text-[#0A1929] font-semibold hover:text-[#0A2647] transition"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Sign In Button - Navy background with white text */}
              <button
                type="submit"
                disabled={isLoginLoading}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                  isLoginLoading
                    ? "bg-[#4A6FA5]/50 text-white cursor-not-allowed"
                    : "bg-[#0A1929] text-white hover:bg-[#0A2647] shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoginLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* SSO Login */}
            <div className="mt-4">
              <SSOLogin onSuccess={handleSSOSuccess} />
            </div>

            {/* Sign Up link - darker */}
            <div className="mt-5 text-center">
              <p className="text-[#0A1929] text-sm md:text-base">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="font-semibold text-[#0A1929] hover:text-[#0A2647] transition underline underline-offset-2"
                >
                  Sign Up
                </button>
              </p>
            </div>

            {/* Footer - darker */}
            <p className="text-center text-[#1E3A6F] text-xs md:text-sm mt-6">
              © 2026 NCBA Bank. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;