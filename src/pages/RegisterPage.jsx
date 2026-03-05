import React, { useState } from "react";
import { useRegisterAdminMutation } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
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
              className="w-80 h-auto object-contain mx-auto"
              style={{
                filter:
                  "brightness(0) invert(1) drop-shadow(0 10px 20px rgba(0,0,0,0.4))",
              }}
            />
            <h2 className="text-white text-4xl font-bold mt-16 tracking-wide">
              NCBA BANK
            </h2>
            <p className="text-white/80 text-2xl mt-16">
              DOCUMENT CHECKLIST AND DEFERRAL MANAGEMENT SYSTEM
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#0A1929]/90 to-transparent py-4">
          <p className="text-center text-white text-sm">
            © 2026 NCBA Bank. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Registration Form - Lifted Higher */}
      <div className="w-full lg:w-1/2 flex items-start justify-center pt-6 pb-8 px-4 md:px-8 md:pt-12 overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* No card - floating on background */}
          <div className="relative">
            <div className="mb-2">
              <img
                src={ncbabanklogo}
                alt="NCBA Bank"
                className="h-24 w-auto object-contain"
              />
            </div>

            {/* Welcome message - darker text */}
            <h2 className="text-[#0A1929] text-xl md:text-xl font-semibold leading-tight mb-1">
              Create Account
            </h2>

            {/* Registration Form - completely borderless */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* FULL NAME */}
              <div>
                <label className="block text-[#0A1929] text-sm md:text-base font-semibold mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A6F] text-xl" />
                  <input
                    type="text"
                    value={form.name}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-b-2 border-[#1E3A6F]/20 text-[#0A1929] placeholder-[#4A6FA5]/60 text-base focus:outline-none focus:border-[#0A1929] transition-colors"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
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
                    className="w-full pl-12 pr-4 py-3 bg-transparent border-b-2 border-[#1E3A6F]/20 text-[#0A1929] placeholder-[#4A6FA5]/60 text-base focus:outline-none focus:border-[#0A1929] transition-colors"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-[#0A1929] text-sm md:text-base font-semibold mb-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A6F] text-xl" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-transparent border-b-2 border-[#1E3A6F]/20 text-[#0A1929] placeholder-[#4A6FA5]/60 text-base focus:outline-none focus:border-[#0A1929] transition-colors"
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E3A6F] hover:text-[#0A1929] transition"
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-xl" />
                    ) : (
                      <FiEye className="text-xl" />
                    )}
                  </button>
                </div>
                <p className="text-[#1E3A6F] text-xs md:text-sm mt-1">
                  Must contain at least 8 characters with uppercase and numbers
                </p>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-1 rounded border-2 border-[#1E3A6F] text-[#0A1929] focus:ring-0 cursor-pointer"
                  required
                />
                <span className="text-[#0A1929] text-xs md:text-sm">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-[#0A1929] font-semibold hover:text-[#0A2647] transition underline underline-offset-2"
                  >
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-[#0A1929] font-semibold hover:text-[#0A2647] transition underline underline-offset-2"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>

              {/* Create Account Button - Navy with white text */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                  isLoading
                    ? "bg-[#4A6FA5]/50 text-white cursor-not-allowed"
                    : "bg-[#0A1929] text-white hover:bg-[#0A2647] shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1E3A6F]/20"></div>
              </div>
              <div className="relative flex justify-center text-sm md:text-base">
                <span className="px-4 bg-[#F9FBFE] text-[#0A1929]">
                  Already registered?
                </span>
              </div>
            </div>

            {/* Login Link - Now Clearly Visible with Navy Background */}
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-[#0A1929] text-white font-semibold rounded-xl hover:bg-[#0A2647] transition duration-300 text-base md:text-lg shadow-lg hover:shadow-xl"
            >
              Sign in to Your Account
            </button>

            {/* Security Features - Minimal design */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="p-2">
                <div className="text-xl mb-1 text-[#0A1929]">🔐</div>
                <p className="text-[#0A1929] font-medium text-xs">Encrypted</p>
              </div>
              <div className="p-2">
                <div className="text-xl mb-1 text-[#0A1929]">✓</div>
                <p className="text-[#0A1929] font-medium text-xs">Verified</p>
              </div>
              <div className="p-2">
                <div className="text-xl mb-1 text-[#0A1929]">🛡️</div>
                <p className="text-[#0A1929] font-medium text-xs">Secure</p>
              </div>
            </div>

            {/* Footer - Darker */}
            <p className="text-center text-[#1E3A6F] text-xs md:text-sm mt-6 mb-2">
              © 2026 NCBA Bank. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
