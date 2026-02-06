import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

export default function Dashboard() {
  const nav = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [newTransaction, setNewTransaction] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    account: ""
  });

  const loadData = useCallback(async () => {
    try {
      const [accs, trans] = await Promise.all([
        api.get("/api/transactions/accounts"),
        api.get("/api/transactions")
      ]);

      setAccounts(accs.data || []);
      setTransactions(trans.data || []);

      if ((accs.data || []).length === 0) setShowAccountSetup(true);
    } catch (err) {
      if (err.response?.status === 401) nav("/");
    }
  }, [nav]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) nav("/");
    else loadData();
  }, [loadData, nav]);

  // ---------------- FILTER ----------------

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const byCategory = filterCategory ? t.category === filterCategory : true;
      const byDate = filterDate
        ? new Date(t.created_at).toISOString().slice(0, 10) === filterDate
        : true;

      return byCategory && byDate;
    });
  }, [transactions, filterCategory, filterDate]);

  const categories = [...new Set(transactions.map(t => t.category))];

  // ---------------- SUMMARY ----------------

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // ---------------- CHART DATA ----------------

  const trendData = transactions.map(t => ({
    date: new Date(t.created_at).toLocaleDateString(),
    amount: Number(t.amount || 0)
  }));

  const incomeExpenseData = [
    { name: "Income", value: totalIncome },
    { name: "Expense", value: totalExpense }
  ];

  // ✅ NEW: Category wise total calculation
  const categoryPieData = categories.map(cat => ({
    name: cat,
    value: transactions
      .filter(t => t.category === cat)
      .reduce((s, t) => s + Number(t.amount || 0), 0)
  }));

  const COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f97316", "#a855f7", "#14b8a6"];

  // ==================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-2xl font-bold">💰 Money Manager</h1>
        <button onClick={() => { localStorage.removeItem("token"); nav("/"); }}
          className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-4">

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card title="Balance" value={totalBalance} color="text-blue-600" />
          <Card title="Income" value={totalIncome} color="text-green-600" />
          <Card title="Expense" value={totalExpense} color="text-red-600" />
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          <ChartBox title="Transaction Trend">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Income vs Expense">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={incomeExpenseData} dataKey="value" outerRadius={90} label>
                  {incomeExpenseData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>

        </div>

        {/* ✅ NEW CATEGORY PIE CHART */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="font-bold mb-3">Spending by Category</h2>

          {categoryPieData.length === 0 ? (
            <p className="text-gray-500">No category data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  dataKey="value"
                  outerRadius={110}
                  label
                >
                  {categoryPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow flex gap-4 mb-4 flex-wrap">

          <select
            className="border p-2 rounded"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          <input
            type="date"
            className="border p-2 rounded"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />

          <button
            onClick={() => { setFilterCategory(""); setFilterDate(""); }}
            className="bg-gray-200 px-4 rounded"
          >
            Clear
          </button>
        </div>

        {/* TRANSACTIONS */}
        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-bold mb-4">Transactions</h2>

          {filteredTransactions.length === 0 && (
            <p className="text-gray-500 text-center">No transactions found</p>
          )}

          <div className="space-y-2">
            {filteredTransactions.map(t => (
              <div key={t.id || t._id}
                className="border p-4 rounded flex justify-between">

                <div>
                  <p className="font-semibold">{t.category}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>

                <p className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "income" ? "+" : "-"}₹{Number(t.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Card({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <p className="text-gray-600">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>₹{value.toFixed(2)}</p>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="font-bold mb-2">{title}</h2>
      {children}
    </div>
  );
}
