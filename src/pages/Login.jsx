import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const login = async () => {
    // Clear previous error
    setError("");

    // Validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', { email });
      
      const res = await api.post("/api/auth/login", {
        email,
        password
      });

      console.log('Login successful:', res.data);

      // Save token
      localStorage.setItem("token", res.data.token);
      
      // Redirect to dashboard
      nav("/dashboard");
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        // Server responded with error
        setError(err.response.data.error || "Login failed");
      } else if (err.request) {
        // Request made but no response
        setError("Cannot connect to server. Please check your internet connection.");
      } else {
        // Other errors
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .login-card {
          animation: fadeIn 0.6s ease-out;
        }
        
        .float-icon {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-100">
        
        {/* LEFT SIDE - Branding */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-indigo-600 to-purple-600 p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 text-center">
            <div className="float-icon inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl mb-6 shadow-xl">
              <span className="text-6xl">💰</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Money Manager</h2>
            <p className="text-indigo-100 text-lg">Track your finances with ease</p>
            <div className="mt-8 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
                <span className="text-sm">Smart expense tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
                <span className="text-sm">Real-time insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
                <span className="text-sm">Multiple accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="login-card p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="border-2 border-gray-200 p-4 w-full rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && login()}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="border-2 border-gray-200 p-4 w-full rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && login()}
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-full py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{" "}
              <span
                className="text-indigo-600 font-semibold cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => nav("/signup")}
              >
                Create one
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}