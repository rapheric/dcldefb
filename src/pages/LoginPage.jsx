
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 rounded-xl shadow-lg">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <FiCheckCircle className="text-blue-600" size={32} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-center text-gray-800">
            Document Checklist System
          </h1>
          <p className="text-center text-gray-500 mb-8">
            Secure access for authorized personnel
          </p>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* EMAIL */}
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-white font-semibold rounded-lg transition ${
                isLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* SSO Login Options */}
          <div className="mt-8">
            <SSOLogin onSuccess={handleSSOSuccess} />
          </div>

          {/* Register Link */}
          <p className="text-sm text-center text-gray-600 mt-6">
            Dont have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
            >
              Register here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
