import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const signup = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/signup", { name, email, password });
      alert("Account created successfully! Please login.");
      nav("/");
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.error || "Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        * { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-100">
        
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 to-indigo-600 p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl mb-6">
              <span className="text-6xl">🚀</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Start Your Journey</h2>
            <p className="text-purple-100 text-lg">Join thousands managing finances better</p>
          </div>
        </div>

        <div className="p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Create Account
            </h2>
            <p className="text-gray-500">Get started with your financial journey</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                placeholder="John Doe"
                className="border-2 border-gray-200 p-4 w-full rounded-xl focus:border-purple-500 focus:outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="border-2 border-gray-200 p-4 w-full rounded-xl focus:border-purple-500 focus:outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="border-2 border-gray-200 p-4 w-full rounded-xl focus:border-purple-500 focus:outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1.5">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`border-2 p-4 w-full rounded-xl focus:outline-none ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-400'
                    : 'border-gray-200'
                }`}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && signup()}
                disabled={loading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5">⚠️ Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 mt-1.5">✓ Passwords match</p>
              )}
            </div>
          </div>

          <button
            onClick={signup}
            disabled={loading}
            className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-full py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{" "}
              <span
                className="text-purple-600 font-semibold cursor-pointer hover:text-purple-700"
                onClick={() => nav("/")}
              >
                Sign in
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}