import React, { useState } from "react";
import { useRegisterAdminMutation } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
    <div className="min-h-screen bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* LEFT SIDE - REGISTRATION FORM */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12 order-2 lg:order-1">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-500 text-lg">
              Join the Document Checklist System today
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            
            {/* FULL NAME */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <input
                type="text"
                placeholder="enter your full name"
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg text-gray-700 focus:border-blue-600 focus:ring-0 outline-none transition"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                placeholder="enter your email address"
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
                placeholder="create a strong password"
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-lg text-gray-700 focus:border-blue-600 focus:ring-0 outline-none transition"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Must contain at least 8 characters with uppercase and numbers
              </p>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="rounded w-4 h-4" required />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:underline font-semibold">
                  Terms & Conditions
                </a>
              </span>
            </label>

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
              {isLoading ? "⏳ Creating Account..." : "📝 Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-600">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 font-bold cursor-pointer hover:underline hover:text-blue-700"
            >
              Sign in here
            </span>
          </p>
        </div>

        {/* RIGHT SIDE - VISUAL SHOWCASE */}
        <div className="hidden lg:flex flex-col items-center justify-center text-white order-1 lg:order-2">
          <div className="mb-12 text-center">
            <h2 className="text-5xl font-bold mb-4">Get Started!</h2>
            <p className="text-xl text-blue-100 max-w-sm">
              Join hundreds of professionals managing documents efficiently
            </p>
          </div>

          {/* Benefit Cards */}
          <div className="space-y-5 w-full max-w-md">
            {[
              { icon: "🚀", title: "Fast Setup", desc: "Get started in minutes" },
              { icon: "🛡️", title: "Data Safe", desc: "Enterprise-grade security" },
              { icon: "📱", title: "Any Device", desc: "Access from anywhere" },
              { icon: "✨", title: "Easy to Use", desc: "Intuitive interface" },
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 hover:bg-white/25 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{benefit.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg">{benefit.title}</h3>
                    <p className="text-blue-100 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Note */}
          <div className="mt-12 text-center text-sm text-blue-100">
            <p>✓ Free to register • ✓ No credit card required</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
