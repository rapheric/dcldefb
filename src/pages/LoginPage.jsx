
// export default LoginPage;
import React, { useState } from "react";
import { useLoginMutation, useVerifyEmailMFAMutation, useResendMFACodeMutation } from "../api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials, setMFASessionToken } from "../api/authSlice";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import EmailMFAVerification from "../components/EmailMFAVerification";
import MFAVerification from "../components/MFAVerification";
import SSOLogin from "../components/SSOLogin";
import ncbabanklogo from "../assets/ncbabanklogo.png";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [mfaStep, setMFAStep] = useState(false);
  const [mfaMethod, setMFAMethod] = useState(null); // EMAIL or TOTP
  const [mfaSessionToken, setMFASessionTokenLocal] = useState("");
  const [devTestCode, setDevTestCode] = useState(""); // 🧪 For development testing
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

      // 🔍 LOG FULL API RESPONSE FOR DEBUGGING
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

      // 🔍 Try both property name variations
      const sessionToken = res?.mfaSessionToken || res?.mFASessionToken;
      const mfaMethod = res?.mfaMethod || res?.mFAMethod;
      const isMFARequired = res?.isMFARequired;
      const testCode = res?.devTestCode; // 🧪 Get the test code

      console.log("✅ RESOLVED SESSION TOKEN:", sessionToken);
      console.log("✅ RESOLVED MFA METHOD:", mfaMethod);
      console.log("✅ IS MFA REQUIRED:", isMFARequired);
      console.log("🧪 TEST CODE (DEV ONLY):", testCode);

      // Check if MFA is required
      if (isMFARequired && sessionToken) {
        console.log("✅ [LOGIN SUCCESS - MFA REQUIRED]");
        console.log("📧 User Email:", form.email);
        console.log("🔑 MFA Session Token:", sessionToken);
        console.log("📤 MFA Method:", mfaMethod);
        console.log("🧪 Test Code:", testCode);
        console.log("⏳ Switching to MFA verification step...");
        
        setMFASessionTokenLocal(sessionToken);
        setMFAMethod(mfaMethod || "EMAIL"); // Default to EMAIL
        setDevTestCode(testCode || ""); // Store test code
        dispatch(setMFASessionToken(sessionToken));
        setMFAStep(true);
        return;
      }

      // Login successful without MFA
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

      // Full login complete
      dispatch(setCredentials(res));
      dispatch(setMFASessionToken(null)); // sear MFA token
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

      // Full login complete
      dispatch(setCredentials(res));
      dispatch(setMFASessionToken(null)); // Clear MFA token
      redirectUserByRole(res?.user?.role);
    } catch (err) {
      alert(err?.data?.message || "MFA verification failed");
    }
  };

  const handleSSOSuccess = (ssoResponse) => {
    // SSO login successful
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

  // Show EMAIL MFA verification if needed
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

  // Show TOTP MFA verification if needed (fallback for other MFA methods)
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      {/* DEBUG: Show MFA State */}
      {(mfaStep || mfaMethod) && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded text-sm z-50">
          🔍 DEBUG: mfaStep={String(mfaStep)}, mfaMethod={mfaMethod}
        </div>
      )}

      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>

      {/* NCBA Logo Section at the top */}
      <div className="w-full max-w-md relative z-10 mb-4 flex flex-col items-center">
        <img
          src={ncbabanklogo}
          alt="NCBA Bank"
          className="h-16 w-auto object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Premium Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-center mb-1">
              <FiLock className="text-white text-2xl" />
            </div>
            <h1 className="text-center text-lg font-bold text-white">Secure Access Portal</h1>
            <p className="text-center text-blue-100 text-xs mt-1">Sign in to your account to continue</p>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              {/* EMAIL */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-800 transition">
                  <input type="checkbox" className="rounded w-4 h-4 cursor-pointer" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition">
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoginLoading}
                className={`w-full py-3 mt-6 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center gap-2 ${
                  isLoginLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoginLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <FiLock className="text-lg" />
                    Sign in
                  </>
                )}
              </button>
            </form>

            {/* SSO Login Options */}
            <div className="mt-6">
              <SSOLogin onSuccess={handleSSOSuccess} />
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">New user?</span>
              </div>
            </div>

            {/* Register Link */}
            <button
              onClick={() => navigate("/register")}
              className="w-full py-3 text-blue-600 font-semibold border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition duration-300"
            >
              Create an Account
            </button>

            {/* Security Note */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
                <FiLock className="text-blue-600" />
                <span>Secured with 256-bit encryption</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6 mb-4">© 2024 Document Checklist & Deferral Management System. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;
