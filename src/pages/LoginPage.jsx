
// export default LoginPage;
import React, { useState } from "react";
import { useLoginMutation } from "../api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials, setMFASessionToken } from "../api/authSlice";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import MFAVerification from "../components/MFAVerification";
import SSOLogin from "../components/SSOLogin";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [mfaStep, setMFAStep] = useState(false);
  const [mfaSessionToken, setMFASessionTokenLocal] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Login credentials:", form);
      const res = await login(form).unwrap();

      // Check if MFA is required
      if (res.isMFARequired && res.mfaSessionToken) {
        setMFASessionTokenLocal(res.mfaSessionToken);
        dispatch(setMFASessionToken(res.mfaSessionToken));
        setMFAStep(true);
        return;
      }

      // Login successful without MFA
      dispatch(setCredentials(res));
      redirectUserByRole(res?.user?.role);
    } catch (err) {
      alert(err?.data?.message || "Login failed");
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

  // Show MFA verification if needed
  if (mfaStep) {
    return (
      <MFAVerification
        mfaSessionToken={mfaSessionToken}
        onVerify={handleMFAVerify}
        onBack={() => {
          setMFAStep(false);
          setMFASessionTokenLocal("");
        }}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* LEFT SIDE - LOGIN FORM */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12 order-2 lg:order-1">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Log in to your Account
            </h1>
            <p className="text-gray-500 text-lg">
              Access the Document Checklist System
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-6 mb-8">
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                placeholder="enter your email"
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg text-gray-700 focus:border-blue-600 focus:ring-0 outline-none transition"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <input
                type="password"
                placeholder="enter your password"
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg text-gray-700 focus:border-blue-600 focus:ring-0 outline-none transition"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded w-4 h-4" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-blue-600 hover:underline font-semibold">
                Forgot password?
              </a>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-white font-bold rounded-lg transition duration-300 text-lg ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              }`}
            >
              {isLoading ? "⏳ Signing in..." : "🔓 Sign in"}
            </button>
          </form>

          {/* SSO Login Options */}
          <div className="mb-8">
            <SSOLogin onSuccess={handleSSOSuccess} />
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-600">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 font-bold cursor-pointer hover:underline hover:text-blue-700"
            >
              Sign up here
            </span>
          </p>
        </div>

        {/* RIGHT SIDE - VISUAL SHOWCASE */}
        <div className="hidden lg:flex flex-col items-center justify-center text-white order-1 lg:order-2">
          <div className="mb-12 text-center">
            <h2 className="text-5xl font-bold mb-4">Welcome!</h2>
            <p className="text-xl text-blue-100 max-w-sm">
              Streamline your document workflow with our intelligent checklist system
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-6 w-full max-w-md">
            {[
              { icon: "✓", title: "Quick Review", desc: "Process documents faster" },
              { icon: "🔐", title: "Secure Access", desc: "Advanced security features" },
              { icon: "📊", title: "Track Progress", desc: "Real-time status updates" },
              { icon: "👥", title: "Team Collab", desc: "Work together seamlessly" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 hover:bg-white/25 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className="text-blue-100 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
