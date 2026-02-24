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
          <div className="bg-linear-to-r from-indigo-600 to-blue-600 px-6 py-5">
            <div className="flex items-center justify-center mb-1">
              <FiUserPlus className="text-white text-2xl" />
            </div>
            <h1 className="text-center text-lg font-bold text-white">Create Account</h1>
            <p className="text-center text-indigo-100 text-xs mt-1">Set up your secure account in minutes</p>
          </div>

          {/* Content */}
          <div className="px-6 py-5">

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* FULL NAME */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
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
                    className="w-full pl-12 pr-12 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
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
                <p className="text-xs text-gray-500 mt-2">
                  Must contain at least 8 characters with uppercase and numbers
                </p>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input type="checkbox" className="w-4 h-4 cursor-pointer mt-1 rounded" required />
                <span className="text-sm text-gray-600">
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
                className={`w-full py-3 mt-6 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                  <FiLock className="text-lg" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">Already registered?</span>
              </div>
            </div>

            {/* Login Link */}
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 text-indigo-600 font-semibold border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition duration-300"
            >
              Sign in to Your Account
            </button>

            {/* Security Features */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg mb-1">🔐</div>
                <p className="text-gray-600 font-medium">Encrypted</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg mb-1">✓</div>
                <p className="text-gray-600 font-medium">Verified</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg mb-1">🛡️</div>
                <p className="text-gray-600 font-medium">Secure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6 mb-4">© 2024 Document Checklist & Deferral Management System. All rights reserved.</p>
      </div>
    </div>
  );
};

export default RegisterPage;
