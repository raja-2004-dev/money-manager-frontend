import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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

      if ((accs.data || []).length === 0) {
        setShowAccountSetup(true);
      }
    } catch (err) {
      if (err.response?.status === 401) nav("/");
    }
  }, [nav]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) nav("/");
    else loadData();
  }, [loadData, nav]);

  const createAccount = async () => {
    if (!accountName || !initialBalance) return;

    await api.post("/api/transactions/accounts", {
      name: accountName,
      balance: Number(initialBalance)
    });

    setAccountName("");
    setInitialBalance("");
    setShowAccountSetup(false);
    loadData();
  };

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.account) return;

    await api.post("/api/transactions", newTransaction);

    setNewTransaction({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      account: ""
    });

    setShowAddModal(false);
    loadData();
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/");
  };

  // ---------------- FILTERING ----------------

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchCategory = filterCategory ? t.category === filterCategory : true;

      const matchDate = filterDate
        ? new Date(t.created_at).toISOString().slice(0, 10) === filterDate
        : true;

      return matchCategory && matchDate;
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

  const pieData = [
    { name: "Income", value: totalIncome },
    { name: "Expense", value: totalExpense }
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-2xl font-bold">💰 Money Manager</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
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

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-2">Transaction Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-2">Income vs Expense</h2>
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
          </div>

        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow flex gap-4 mb-4 flex-wrap">

          <select
            className="border p-2 rounded"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            type="date"
            className="border p-2 rounded"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />

          <button
            onClick={() => {
              setFilterCategory("");
              setFilterDate("");
            }}
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
              <div
                key={t.id || t._id}
                className="border p-4 rounded flex justify-between"
              >
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

      {/* ADD BUTTON */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full text-2xl"
      >
        +
      </button>

      {/* ADD TRANSACTION MODAL */}
      {showAddModal && (
        <Modal close={() => setShowAddModal(false)}>
          <input placeholder="Amount" type="number"
            onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            className="input" />

          <input placeholder="Category"
            onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
            className="input" />

          <select
            onChange={e => setNewTransaction({ ...newTransaction, account: e.target.value })}
            className="input"
          >
            <option value="">Select account</option>
            {accounts.map(a => (
              <option key={a.id || a._id}>{a.name}</option>
            ))}
          </select>

          <button onClick={addTransaction} className="btn">Add</button>
        </Modal>
      )}

      {/* ACCOUNT SETUP */}
      {showAccountSetup && (
        <Modal close={() => {}}>
          <input placeholder="Account name"
            className="input"
            value={accountName}
            onChange={e => setAccountName(e.target.value)} />

          <input placeholder="Initial balance"
            type="number"
            className="input"
            value={initialBalance}
            onChange={e => setInitialBalance(e.target.value)} />

          <button onClick={createAccount} className="btn">Create Account</button>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- SMALL UI HELPERS ---------------- */

function Card({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <p className="text-gray-600">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>₹{value.toFixed(2)}</p>
    </div>
  );
}

function Modal({ children, close }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-3">
        {children}
        <button onClick={close} className="text-gray-500">Close</button>
      </div>
    </div>
  );
}
