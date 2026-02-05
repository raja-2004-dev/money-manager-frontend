import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const signup = async () => {
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be 6+ characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/signup", { name, email, password });
      alert("Account created! Please login.");
      nav("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Create Account</h2>
        <p className="text-gray-600 text-center mb-6">Join us today</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && signup()}
              disabled={loading}
            />
            {confirmPassword && password !== confirmPassword && <p className="text-red-500 text-xs mt-1">Passwords don't match</p>}
            {confirmPassword && password === confirmPassword && <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>}
          </div>
        </div>
        
        <button
          onClick={signup}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
        
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <span onClick={() => nav("/")} className="text-purple-600 font-semibold cursor-pointer hover:underline">Sign in</span>
        </p>
      </div>
    </div>
  );
}