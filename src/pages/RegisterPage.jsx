import React, { useState } from "react";
import { useRegisterAdminMutation } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus } from "react-icons/fi";
import ncbabanklogo from "../assets/ncbabanklogo.png";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [registerAdmin, { isLoading }] = useRegisterAdminMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerAdmin(form).unwrap();
      alert("✅ Admin registered successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      alert(err?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>

      <div className="w-full max-w-md relative z-10 mb-8">
        {/* Premium Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2">
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
              <FiUserPlus className="text-white text-xl" />
            </div>
            <h1 className="text-center text-sm font-bold text-white mt-1">Create Account</h1>
            <p className="text-center text-indigo-100 text-xs mt-0.5">Set up your secure account in minutes</p>
          </div>

          {/* Content */}
          <div className="px-4 py-3">

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* FULL NAME */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 focus:outline-none transition"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 focus:outline-none transition"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-800">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 focus:outline-none transition"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 8 characters with uppercase and numbers
                </p>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input type="checkbox" className="w-3 h-3 cursor-pointer mt-0.5 rounded" required />
                <span className="text-xs text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    Terms & Conditions
                  </a>
                  {" "}and{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    Privacy Policy
                  </a>
                </span>
              </label>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 mt-3 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center gap-2 text-xs ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                  <FiLock className="text-sm" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">Already registered?</span>
              </div>
            </div>

            {/* Login Link */}
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2 text-indigo-600 font-semibold border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition duration-300 text-xs"
            >
              Sign in to Your Account
            </button>

            {/* Security Features */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-base mb-0.5">🔐</div>
                <p className="text-gray-600 font-medium text-xs">Encrypted</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-base mb-0.5">✓</div>
                <p className="text-gray-600 font-medium text-xs">Verified</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-base mb-0.5">🛡️</div>
                <p className="text-gray-600 font-medium text-xs">Secure</p>
              </div>
            </div>

            {/* Footer inside card */}
            <p className="text-center text-gray-400 text-xs mt-6 mb-0">© 2026 Document Checklist & Deferral Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
