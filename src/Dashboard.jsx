import { useEffect, useState, useCallback } from "react";
import api from "./api";
import AddModal from "./AddModal";
import EditModal from "./components/EditModal";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Dashboard() {

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const [view, setView] = useState("monthly");

  const [filters, setFilters] = useState({
    category: "",
    division: "",
    from: "",
    to: ""
  });

  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [initialAccount, setInitialAccount] = useState({
    name: "",
    balance: ""
  });

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  /* ================= LOAD DATA ================= */

  const loadData = useCallback(async () => {
    try {
      const t = await api.get("/transactions");
      const s = await api.get(`/transactions/summary/${view}`);
      const c = await api.get("/transactions/summary/category");
      const a = await api.get("/transactions/accounts");

      setTransactions(Array.isArray(t.data) ? t.data : []);
      setSummary(Array.isArray(s.data) ? s.data : []);
      setCategoryData(Array.isArray(c.data) ? c.data : []);
      
      const accountsList = Array.isArray(a.data) ? a.data : [];
      setAccounts(accountsList);
      
      if (accountsList.length === 0) {
        setShowInitialSetup(true);
      }
    } catch (err) {
      console.log(err);
    }
  }, [view]);

  useEffect(() => {
    loadData();
  }, [view, loadData]);

  /* ================= FILTER ================= */

  const applyFilter = async () => {
    const res = await api.get("/transactions/filter", { params: filters });
    setTransactions(Array.isArray(res.data) ? res.data : []);
  };

  /* ================= CREATE INITIAL ACCOUNT ================= */

  const createInitialAccount = async () => {
    if (!initialAccount.name || !initialAccount.balance) {
      return alert("Please fill in both account name and initial balance");
    }

    try {
      await api.post("/transactions/accounts", initialAccount);
      setInitialAccount({ name: "", balance: "" });
      setShowInitialSetup(false);
      loadData();
    } catch (err) {
      alert("Failed to create account");
    }
  };

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
  const totalIncome = summary.find(s => s.type === 'income')?.total || 0;
  const totalExpense = summary.find(s => s.type === 'expense')?.total || 0;

  // Show initial setup screen for new users
  if (showInitialSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
          * { font-family: 'Outfit', sans-serif; }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out;
          }
          
          .setup-card {
            animation: fadeInUp 0.8s ease-out;
          }
        `}</style>
        
        <div className="setup-card bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-indigo-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-4xl">💰</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome Aboard!
            </h1>
            <p className="text-gray-500 text-sm">Let's create your first account to get started</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Name
              </label>
              <input
                className="border-2 border-gray-200 w-full p-3.5 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="e.g., Main Account, Cash, Savings"
                value={initialAccount.name}
                onChange={e =>
                  setInitialAccount({ ...initialAccount, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Initial Balance
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                <input
                  type="number"
                  className="border-2 border-gray-200 w-full p-3.5 pl-8 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="0.00"
                  value={initialAccount.balance}
                  onChange={e =>
                    setInitialAccount({ ...initialAccount, balance: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <button
            onClick={createInitialAccount}
            className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-full py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Create Account & Continue
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              window.location = "/";
            }}
            className="mt-3 text-gray-400 w-full text-sm hover:text-gray-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
        
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        
        .gradient-border {
          position: relative;
          background: white;
        }
        
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      `}</style>

      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-indigo-100 sticky top-0 z-40 animate-slideDown">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Money Manager
              </h1>
              <p className="text-xs text-gray-500">Track your finances smartly</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpenAdd(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Add Transaction
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                window.location = "/";
              }}
              className="border-2 border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {openAdd && (
        <AddModal
          close={() => setOpenAdd(false)}
          refresh={loadData}
          accounts={accounts}
        />
      )}

      {editing && (
        <EditModal
          transaction={editing}
          close={() => setEditing(null)}
          refresh={loadData}
        />
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* TOTAL BALANCE HERO */}
        <section className="gradient-border rounded-3xl p-8 text-center animate-scaleIn">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Balance</p>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className="flex justify-center gap-8 mt-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Income</p>
              <p className="text-lg font-bold text-green-600">+₹{totalIncome}</p>
            </div>
            <div className="w-px bg-gray-200"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Expense</p>
              <p className="text-lg font-bold text-red-600">-₹{totalExpense}</p>
            </div>
          </div>
        </section>

        {/* ACCOUNTS GRID */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded"></span>
            Your Accounts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {accounts.map((a, idx) => (
              <div 
                key={a.id} 
                className="card-hover bg-white p-6 rounded-2xl shadow-sm border border-indigo-50"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                    idx % 4 === 0 ? 'from-indigo-500 to-purple-500' :
                    idx % 4 === 1 ? 'from-purple-500 to-pink-500' :
                    idx % 4 === 2 ? 'from-pink-500 to-rose-500' :
                    'from-indigo-500 to-blue-500'
                  }`}></div>
                  <p className="font-semibold text-gray-700 text-sm">{a.name}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">₹{parseFloat(a.balance).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* VIEW SELECTOR & SUMMARY */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
            <label className="text-sm font-semibold text-gray-600 mb-3 block">View Summary</label>
            <select
              className="border-2 border-gray-200 p-3 rounded-xl w-full font-semibold focus:border-indigo-500 focus:outline-none transition-colors"
              value={view}
              onChange={e => setView(e.target.value)}
            >
              <option value="weekly">📅 Weekly</option>
              <option value="monthly">📊 Monthly</option>
              <option value="yearly">📈 Yearly</option>
            </select>
          </div>

          {summary.map((s) => (
            <div
              key={s.type}
              className={`card-hover p-6 rounded-2xl text-white relative overflow-hidden ${
                s.type === "income" 
                  ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                  : "bg-gradient-to-br from-red-500 to-rose-600"
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className="absolute inset-0 bg-white rounded-full blur-2xl"></div>
              </div>
              <p className="text-sm font-semibold uppercase opacity-90 mb-1">{s.type}</p>
              <p className="text-3xl font-bold">₹{s.total}</p>
              <div className="mt-2 text-xs opacity-75">This {view.replace('ly', '')}</div>
            </div>
          ))}
        </section>

        {/* FILTER */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Filter Transactions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="Category"
              onChange={e =>
                setFilters({ ...filters, category: e.target.value })
              }
            />

            <select
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
              onChange={e =>
                setFilters({ ...filters, division: e.target.value })
              }
            >
              <option value="">All Divisions</option>
              <option>Personal</option>
              <option>Office</option>
            </select>

            <input
              type="date"
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
              onChange={e =>
                setFilters({ ...filters, from: e.target.value })
              }
            />

            <input
              type="date"
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
              onChange={e =>
                setFilters({ ...filters, to: e.target.value })
              }
            />

            <button
              onClick={applyFilter}
              className="bg-gray-900 text-white px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </section>

        {/* CHARTS */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 card-hover">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Income vs Expense
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary}>
                <XAxis dataKey="type" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: '600' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Bar dataKey="total" fill="url(#colorGradient)" radius={[12, 12, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 card-hover">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🥧</span>
              Expense by Category
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData.map(d => ({
                    ...d,
                    total: Number(d.total)
                  }))}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category}: ₹${entry.total}`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* TRANSACTION HISTORY */}
        <section className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">📜</span>
              Transaction History
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="text-5xl mb-4">💸</div>
                <p className="font-semibold">No transactions yet</p>
                <p className="text-sm">Add your first transaction to get started</p>
              </div>
            ) : (
              transactions.map((t) => {
                const created = new Date(t.created_at);
                const hoursPassed = (new Date() - created) / (1000 * 60 * 60);

                return (
                  <div 
                    key={t.id} 
                    className="flex justify-between items-center p-5 hover:bg-indigo-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                        t.type === "income" 
                          ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                          : "bg-gradient-to-br from-red-500 to-rose-600"
                      }`}>
                        {t.type === "income" ? "↓" : "↑"}
                      </div>
                      
                      <div>
                        <p className="font-semibold text-gray-800">{t.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                            {t.category}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{t.division}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className={`text-xl font-bold ${
                          t.type === "income" ? "text-green-600" : "text-red-600"
                        }`}>
                          {t.type === "income" ? "+" : "-"}₹{t.amount}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(t.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      {hoursPassed <= 12 && (
                        <button
                          className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                          onClick={() => setEditing(t)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}