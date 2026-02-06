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
  const [categorySummary, setCategorySummary] = useState([]);

  const [view, setView] = useState("monthly");
  const [summaryData, setSummaryData] = useState([]);

  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const [filterCategory, setFilterCategory] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ================= LOAD DATA =================

  const loadData = useCallback(async () => {
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
  }, [view]);

  useEffect(() => {
    if (!localStorage.getItem("token")) nav("/");
    else loadData();
  }, [loadData, nav]);

  // ================= CREATE ACCOUNT =================

  const createAccount = async () => {
    if (!accountName || !initialBalance) return;

    await api.post("/api/transactions/accounts", {
      name: accountName,
      balance: Number(initialBalance)
    });

    setAccountName("");
    setInitialBalance("");
    loadData();
  };

  // ================= ADD + EDIT =================

  const saveTransaction = async () => {
    if (!form.amount || !form.category || !form.account) return;

    if (editing) {
      await api.put(`/api/transactions/${editing.id}`, form);
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
  };

  // ================= FILTER =================

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.created_at);

      return (
        (!filterCategory || t.category === filterCategory) &&
        (!filterDivision || t.division === filterDivision) &&
        (!fromDate || d >= new Date(fromDate)) &&
        (!toDate || d <= new Date(toDate))
      );
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

  const pieData = summaryData.map(i => ({
    name: i.type,
    value: Number(i.total)
  }));

  const COLORS = ["#22c55e", "#ef4444"];

  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-2xl font-bold">💰 Money Manager</h1>
        <button
          onClick={() => { localStorage.removeItem("token"); nav("/"); }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {!showAccountSetup && (
        <div className="max-w-6xl mx-auto p-4 space-y-6">

          {/* SUMMARY */}
          <div className="grid md:grid-cols-3 gap-4">
            <Summary title="Balance" value={totalBalance} color="text-blue-600"/>
            <Summary title="Income" value={totalIncome} color="text-green-600"/>
            <Summary title="Expense" value={totalExpense} color="text-red-600"/>
          </div>

          {/* VIEW DROPDOWN */}
          <select
            value={view}
            onChange={e => setView(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {/* CHART */}
          <div className="bg-white p-6 rounded shadow">
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

          {/* FILTERS */}
          <div className="bg-white p-4 rounded shadow flex flex-wrap gap-3">
            <select onChange={e=>setFilterCategory(e.target.value)} className="border p-2 rounded">
              <option value="">All Categories</option>
              {categories.map(c=> <option key={c}>{c}</option>)}
            </select>

            <select onChange={e=>setFilterDivision(e.target.value)} className="border p-2 rounded">
              <option value="">All Divisions</option>
              <option value="Personal">Personal</option>
              <option value="Office">Office</option>
            </select>

            <input type="date" onChange={e=>setFromDate(e.target.value)} />
            <input type="date" onChange={e=>setToDate(e.target.value)} />
          </div>

          {/* TRANSACTION HISTORY */}
          <div className="bg-white rounded shadow p-4 space-y-2">
            {filtered.map(t => (
              <div
                key={t.id}
                className="flex justify-between border p-3 rounded cursor-pointer"
                onClick={() => {
                  setEditing(t);
                  setForm(t);
                  setShowAddModal(true);
                }}
              >
                <div>
                  <p className="font-semibold">{t.category} ({t.division})</p>
                  <p className="text-sm text-gray-500">
                    {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={t.type==="income"?"text-green-600":"text-red-600"}>
                  ₹{t.amount}
                </span>
              </div>
            ))}
          </div>

          {/* CATEGORY SUMMARY */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-2">Category Summary</h2>
            {categorySummary.map(c => (
              <div key={c.category} className="flex justify-between">
                <span>{c.category}</span>
                <span>₹{c.total}</span>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ADD BUTTON */}
      {!showAccountSetup && (
        <button
          onClick={() => {
            setEditing(null);
            setForm({
              type:"expense",
              amount:"",
              category:"",
              division:"Personal",
              account:"",
              description:""
            });
            setShowAddModal(true);
          }}
          className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full text-2xl"
        >
          +
        </button>
      )}

      {/* ACCOUNT SETUP */}
      {showAccountSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded space-y-3">
            <input placeholder="Account name" onChange={e=>setAccountName(e.target.value)} />
            <input type="number" placeholder="Initial balance" onChange={e=>setInitialBalance(e.target.value)} />
            <button onClick={createAccount} className="bg-blue-600 text-white px-4 py-2 rounded">
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded space-y-3 w-full max-w-md">

            <select onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <input placeholder="Amount" onChange={e=>setForm({...form,amount:e.target.value})}/>
            <input placeholder="Category" onChange={e=>setForm({...form,category:e.target.value})}/>

            <select onChange={e=>setForm({...form,division:e.target.value})}>
              <option value="Personal">Personal</option>
              <option value="Office">Office</option>
            </select>

            <select onChange={e=>setForm({...form,account:e.target.value})}>
              <option value="">Select account</option>
              {accounts.map(a=><option key={a.id}>{a.name}</option>)}
            </select>

            <textarea placeholder="Description" onChange={e=>setForm({...form,description:e.target.value})}/>

            <button onClick={saveTransaction} className="bg-blue-600 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function Summary({ title, value, color }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-gray-600">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>₹{value.toFixed(2)}</p>
    </div>
  );
}
