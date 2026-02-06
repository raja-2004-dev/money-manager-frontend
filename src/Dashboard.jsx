import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

export default function Dashboard() {
  const nav = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("monthly");
  const [summaryData, setSummaryData] = useState([]);

  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    division: "Personal",
    account: "",
    description: ""
  });

  const [transferForm, setTransferForm] = useState({
    fromAccount: "",
    toAccount: "",
    amount: ""
  });

  const [filterCategory, setFilterCategory] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Predefined categories
  const CATEGORIES = {
    expense: ["Fuel", "Food", "Movie", "Medical", "Loan", "Rent", "Shopping", "Transport", "Utilities", "Other"],
    income: ["Salary", "Freelance", "Investment", "Gift", "Other"]
  };

  // ================= LOAD DATA =================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accs, trans, summary, cats] = await Promise.all([
        api.get("/api/transactions/accounts"),
        api.get("/api/transactions"),
        api.get(`/api/transactions/summary/${view}`),
        api.get("/api/transactions/summary/category")
      ]);

      setAccounts(accs.data || []);
      setTransactions(trans.data || []);
      setSummaryData(summary.data || []);
      setCategorySummary(cats.data || []);

      if ((accs.data || []).length === 0) setShowAccountSetup(true);
      else setShowAccountSetup(false);
    } catch (err) {
      console.error("Load data error:", err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (!localStorage.getItem("token")) nav("/");
    else loadData();
  }, [loadData, nav]);

  // ================= CREATE ACCOUNT =================

  const createAccount = async () => {
    if (!accountName.trim() || !initialBalance) {
      alert("Please fill all fields");
      return;
    }

    try {
      await api.post("/api/transactions/accounts", {
        name: accountName,
        balance: Number(initialBalance)
      });

      setAccountName("");
      setInitialBalance("");
      loadData();
    } catch (err) {
      alert("Failed to create account");
    }
  };

  // ================= TRANSFER MONEY =================

  const transferMoney = async () => {
    console.log("Transfer form:", transferForm);

    if (!transferForm.fromAccount || !transferForm.toAccount || !transferForm.amount) {
      alert("Please fill all fields");
      return;
    }

    if (transferForm.fromAccount === transferForm.toAccount) {
      alert("Cannot transfer to same account");
      return;
    }

    const amount = Number(transferForm.amount);
    if (amount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    try {
      // Add expense from source account
      await api.post("/api/transactions", {
        type: "expense",
        amount: amount,
        category: "Transfer Out",
        division: "Personal",
        account: transferForm.fromAccount,
        description: `Transfer to ${transferForm.toAccount}`
      });

      // Add income to destination account
      await api.post("/api/transactions", {
        type: "income",
        amount: amount,
        category: "Transfer In",
        division: "Personal",
        account: transferForm.toAccount,
        description: `Transfer from ${transferForm.fromAccount}`
      });

      setTransferForm({ fromAccount: "", toAccount: "", amount: "" });
      setShowTransferModal(false);
      loadData();
      alert("Transfer successful!");
    } catch (err) {
      console.error("Transfer error:", err);
      alert("Transfer failed");
    }
  };

  // ================= CHECK IF EDITABLE (12 HOURS) =================

  const isEditable = (transaction) => {
    const createdAt = new Date(transaction.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    return hoursDiff <= 12;
  };

  // ================= ADD + EDIT =================

  const saveTransaction = async () => {
    if (!form.amount || !form.category || !form.account) {
      alert("Please fill required fields");
      return;
    }

    try {
      if (editing) {
        if (!isEditable(editing)) {
          alert("Cannot edit transactions older than 12 hours");
          return;
        }
        await api.put(`/api/transactions/${editing.id}`, {
          amount: form.amount,
          category: form.category,
          division: form.division,
          description: form.description
        });
      } else {
        await api.post("/api/transactions", form);
      }

      setForm({
        type: "expense",
        amount: "",
        category: "",
        division: "Personal",
        account: "",
        description: ""
      });

      setEditing(null);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert("Failed to save transaction");
    }
  };

  // ================= FILTER =================

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.created_at);
      const matchCategory = !filterCategory || t.category === filterCategory;
      const matchDivision = !filterDivision || t.division === filterDivision;
      const matchFrom = !fromDate || d >= new Date(fromDate);
      const matchTo = !toDate || d <= new Date(toDate + "T23:59:59");
      return matchCategory && matchDivision && matchFrom && matchTo;
    });
  }, [transactions, filterCategory, filterDivision, fromDate, toDate]);

  const categories = [...new Set(transactions.map(t => t.category))];

  // ================= SUMMARY =================

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // ================= CHART DATA =================

  const pieData = summaryData.map(i => ({
    name: i.type === "income" ? "Income" : "Expense",
    value: Number(i.total)
  }));

  // Daily breakdown for line chart
  const dailyData = useMemo(() => {
    const grouped = {};
    filtered.forEach(t => {
      const date = new Date(t.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = { date, income: 0, expense: 0 };
      if (t.type === "income") grouped[date].income += Number(t.amount);
      else grouped[date].expense += Number(t.amount);
    });
    return Object.values(grouped).slice(-30);
  }, [filtered]);

  const COLORS = ["#22c55e", "#ef4444"];

  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
              💰
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Money Manager</h1>
              <p className="text-indigo-100 text-sm">Track your finances effortlessly</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem("token"); nav("/"); }}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {!showAccountSetup && (
        <div className="max-w-7xl mx-auto p-4 space-y-6">

          {/* SUMMARY CARDS */}
          <div className="grid md:grid-cols-3 gap-4 animate-slide-in">
            <SummaryCard 
              title="Total Balance" 
              value={totalBalance} 
              color="blue"
              icon="💵"
            />
            <SummaryCard 
              title="Total Income" 
              value={totalIncome} 
              color="green"
              icon="📈"
            />
            <SummaryCard 
              title="Total Expense" 
              value={totalExpense} 
              color="red"
              icon="📉"
            />
          </div>

          {/* ACCOUNTS */}
          <div className="glass rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">💳 Your Accounts</h2>
              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                Transfer Money
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {accounts.length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-4">No accounts yet</p>
              )}
              {accounts.map(acc => (
                <div key={acc.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-gray-600 text-sm font-medium">{acc.name}</p>
                  <p className="text-2xl font-bold text-indigo-600">₹{Number(acc.balance).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* VIEW SELECTOR & CHARTS */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* PIE CHART */}
            <div className="glass rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Income vs Expense</h2>
                <select
                  value={view}
                  onChange={e => setView(e.target.value)}
                  className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" outerRadius={90} label>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data for this period
                </div>
              )}
            </div>

            {/* LINE CHART */}
            <div className="glass rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Daily Trend</h2>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No transactions yet
                </div>
              )}
            </div>
          </div>

          {/* FILTERS */}
          <div className="glass rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 Filters</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)} 
                className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                value={filterDivision}
                onChange={e => setFilterDivision(e.target.value)} 
                className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Divisions</option>
                <option value="Personal">Personal</option>
                <option value="Office">Office</option>
              </select>

              <input 
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="From Date"
              />
              
              <input 
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="To Date"
              />
            </div>
          </div>

          {/* TRANSACTION HISTORY */}
          <div className="glass rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📜 Transaction History</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-center text-gray-500 py-8">No transactions found</p>
              )}
              {filtered.map(t => {
                const canEdit = isEditable(t);
                return (
                  <div
                    key={t.id}
                    className={`flex justify-between items-center border border-gray-200 p-4 rounded-xl hover:shadow-md transition-all ${canEdit ? 'cursor-pointer hover:border-indigo-300' : 'opacity-60'}`}
                    onClick={() => {
                      if (canEdit) {
                        setEditing(t);
                        setForm({...t});
                        setShowAddModal(true);
                      } else {
                        alert("Cannot edit transactions older than 12 hours");
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                        <span className="text-xl">{t.type === "income" ? "📥" : "📤"}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{t.category}</p>
                        <p className="text-sm text-gray-500">
                          {t.division} • {t.account} • {new Date(t.created_at).toLocaleString()}
                        </p>
                        {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "income" ? "+" : "-"}₹{Number(t.amount).toFixed(2)}
                      </p>
                      {!canEdit && <p className="text-xs text-gray-400">Cannot edit</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CATEGORY SUMMARY */}
          <div className="glass rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Category Summary (Expenses)</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {categorySummary.length === 0 && (
                <p className="text-gray-500 col-span-2 text-center py-4">No expense data yet</p>
              )}
              {categorySummary.map(c => (
                <div key={c.category} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-700">{c.category}</span>
                  <span className="font-bold text-red-600">₹{Number(c.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ADD BUTTON */}
      {!showAccountSetup && (
        <button
          onClick={() => {
            setEditing(null);
            setForm({
              type: "expense",
              amount: "",
              category: "",
              division: "Personal",
              account: "",
              description: ""
            });
            setShowAddModal(true);
          }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-16 h-16 rounded-full text-3xl shadow-2xl hover:shadow-3xl hover:scale-110 transition-all"
        >
          +
        </button>
      )}

      {/* ACCOUNT SETUP MODAL */}
      {showAccountSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-in">
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Your First Account
            </h2>
            <div className="space-y-4">
              <input
                placeholder="Account name (e.g., Cash, Bank)"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Initial balance"
                value={initialBalance}
                onChange={e => setInitialBalance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={createAccount}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {editing ? "Edit Transaction" : "Add Transaction"}
            </h2>

            {/* TYPE TABS */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setForm({...form, type: "expense", category: ""})}
                disabled={editing}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  form.type === "expense" 
                    ? "bg-red-500 text-white shadow-lg" 
                    : "bg-gray-200 text-gray-600"
                } ${editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                💸 Expense
              </button>
              <button
                onClick={() => setForm({...form, type: "income", category: ""})}
                disabled={editing}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  form.type === "income" 
                    ? "bg-green-500 text-white shadow-lg" 
                    : "bg-gray-200 text-gray-600"
                } ${editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                💰 Income
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />

              <select
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Category</option>
                {CATEGORIES[form.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={form.division}
                onChange={e => setForm({...form, division: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Personal">Personal</option>
                <option value="Office">Office</option>
              </select>

              <select
                value={form.account}
                onChange={e => setForm({...form, account: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={editing}
              >
                <option value="">Select Account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>

              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditing(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveTransaction}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {editing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slide-in">
            <h2 className="text-2xl font-bold mb-4 text-center">💸 Transfer Money</h2>
            <p className="text-gray-600 text-sm text-center mb-6">
              Move money between your accounts
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
                <select
                  value={transferForm.fromAccount}
                  onChange={e => setTransferForm({...transferForm, fromAccount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select source account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.name}>
                      {a.name} (Balance: ₹{Number(a.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-3xl py-2">⬇️</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Account</label>
                <select
                  value={transferForm.toAccount}
                  onChange={e => setTransferForm({...transferForm, toAccount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select destination account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.name}>
                      {a.name} (Balance: ₹{Number(a.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount to transfer"
                  value={transferForm.amount}
                  onChange={e => setTransferForm({...transferForm, amount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferForm({ fromAccount: "", toAccount: "", amount: "" });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={transferMoney}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function SummaryCard({ title, value, color, icon }) {
  const colors = {
    blue: "from-blue-500 to-indigo-500",
    green: "from-green-500 to-emerald-500",
    red: "from-red-500 to-pink-500"
  };

  return (
    <div className={`glass rounded-2xl shadow-xl p-6 bg-gradient-to-br ${colors[color]} text-white`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/90 font-medium">{title}</p>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">₹{Number(value || 0).toFixed(2)}</p>
    </div>
  );
}