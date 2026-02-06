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

  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    account: "",
    description: ""
  });

  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // ---------------- LOAD DATA ----------------

  const loadData = useCallback(async () => {
    const [accs, trans] = await Promise.all([
      api.get("/api/transactions/accounts"),
      api.get("/api/transactions")
    ]);

    setAccounts(accs.data || []);
    setTransactions(trans.data || []);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) nav("/");
    else loadData();
  }, [loadData, nav]);

  // ---------------- ADD ----------------

  const saveTransaction = async () => {
    if (!form.amount || !form.category || !form.account) return;

    if (editing) {
      await api.put(`/api/transactions/${editing.id || editing._id}`, form);
    } else {
      await api.post("/api/transactions", form);
    }

    setForm({ type: "expense", amount: "", category: "", account: "", description: "" });
    setEditing(null);
    setShowAddModal(false);
    loadData();
  };

  // ---------------- DELETE ----------------

  const deleteTransaction = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await api.delete(`/api/transactions/${id}`);
    loadData();
  };

  // ---------------- FILTER ----------------

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const c = filterCategory ? t.category === filterCategory : true;
      const d = filterDate
        ? new Date(t.created_at).toISOString().slice(0, 10) === filterDate
        : true;
      return c && d;
    });
  }, [transactions, filterCategory, filterDate]);

  const categories = [...new Set(transactions.map(t => t.category))];

  // ---------------- SUMMARY ----------------

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalIncome = transactions.filter(t => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // ---------------- CHART DATA ----------------

  const trendData = transactions.map(t => ({
    date: new Date(t.created_at).toLocaleDateString(),
    amount: Number(t.amount)
  }));

  const pieData = [
    { name: "Income", value: totalIncome },
    { name: "Expense", value: totalExpense }
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  // ========================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-2xl font-bold">💰 Money Manager</h1>
        <button
          onClick={() => { localStorage.removeItem("token"); nav("/"); }}
          className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4">

        {/* SUMMARY */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Summary title="Balance" value={totalBalance} color="text-blue-600" />
          <Summary title="Income" value={totalIncome} color="text-green-600" />
          <Summary title="Expense" value={totalExpense} color="text-red-600" />
        </div>

        {/* CHART */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          <Chart title="Trend">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="amount" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Income vs Expense">
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
          </Chart>

        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded shadow flex gap-4 mb-4 flex-wrap">

          <select
            className="border p-2 rounded"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          <input
            type="date"
            className="border p-2 rounded"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />

        </div>

        {/* TRANSACTIONS */}
        <div className="bg-white rounded shadow p-4 space-y-2">

          {filtered.map(t => (
            <div key={t.id || t._id}
              className="flex justify-between items-center border p-3 rounded hover:bg-gray-50">

              <div
                className="cursor-pointer"
                onClick={() => {
                  setEditing(t);
                  setForm({
                    type: t.type,
                    amount: t.amount,
                    category: t.category,
                    account: t.account,
                    description: t.description || ""
                  });
                  setShowAddModal(true);
                }}>
                <p className="font-semibold">{t.category}</p>
                <p className="text-sm text-gray-500">
                  {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className={t.type === "income" ? "text-green-600" : "text-red-600"}>
                  ₹{t.amount}
                </span>

                <button
                  onClick={() => deleteTransaction(t.id || t._id)}
                  className="text-red-500 text-lg">
                  🗑
                </button>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={() => { setEditing(null); setShowAddModal(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full text-2xl shadow-lg">
        +
      </button>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">

            <h2 className="font-bold text-lg">
              {editing ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <select className="input" value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <input className="input" type="number" placeholder="Amount"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} />

            <input className="input" placeholder="Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })} />

            <select className="input"
              value={form.account}
              onChange={e => setForm({ ...form, account: e.target.value })}>
              <option value="">Select account</option>
              {accounts.map(a => (
                <option key={a.id || a._id}>{a.name}</option>
              ))}
            </select>

            <textarea
              className="input"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 rounded p-2">
                Cancel
              </button>

              <button
                onClick={saveTransaction}
                className="flex-1 bg-blue-600 text-white rounded p-2">
                {editing ? "Update" : "Add"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Summary({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <p className="text-gray-600">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>₹{value.toFixed(2)}</p>
    </div>
  );
}

function Chart({ title, children }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="font-bold mb-2">{title}</h2>
      {children}
    </div>
  );
}
