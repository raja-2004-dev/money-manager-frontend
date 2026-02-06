import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    account: ""
  });

  const nav = useNavigate();

  // Load dashboard data safely
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
      console.error(err);
      if (err.response?.status === 401) nav("/");
    }
  }, [nav]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) nav("/");
    else loadData();
  }, [loadData, nav]);

  const createAccount = async () => {
    if (!accountName || !initialBalance) {
      alert("Please fill all fields");
      return;
    }

    try {
      await api.post("/api/transactions/accounts", {
        name: accountName,
        balance: Number(initialBalance)
      });

      setShowAccountSetup(false);
      setAccountName("");
      setInitialBalance("");
      loadData();
    } catch {
      alert("Failed to create account");
    }
  };

  const addTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.account) {
      alert("Please fill all fields");
      return;
    }

    try {
      await api.post("/api/transactions", newTransaction);

      setShowAddModal(false);
      setNewTransaction({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        account: ""
      });

      loadData();
    } catch {
      alert("Failed to add transaction");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/");
  };

  // ✅ SAFE TOTAL CALCULATIONS (no crashes ever)

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0
  );

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">💰 Money Manager</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ACCOUNT SETUP MODAL */}
      {showAccountSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Your First Account</h2>

            <input
              placeholder="Account Name"
              className="w-full px-4 py-2 border rounded-lg mb-3"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Initial Balance"
              className="w-full px-4 py-2 border rounded-lg"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
            />

            <button
              onClick={createAccount}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-4">

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <p>Total Balance</p>
            <p className="text-3xl font-bold text-blue-600">₹{totalBalance.toFixed(2)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p>Total Income</p>
            <p className="text-3xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p>Total Expense</p>
            <p className="text-3xl font-bold text-red-600">₹{totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* ACCOUNTS */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Accounts</h2>

          {accounts.length === 0 && (
            <p className="text-gray-500">No accounts yet</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acc => (
              <div key={acc.id || acc._id} className="p-4 border rounded-lg">
                <p className="font-semibold">{acc.name}</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{Number(acc.balance || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

          {transactions.length === 0 && (
            <p className="text-gray-500 text-center py-6">
              No transactions yet
            </p>
          )}

          <div className="space-y-2">
            {transactions.slice(0, 10).map(t => (
              <div
                key={t.id || t._id}
                className="p-4 border rounded-lg flex justify-between"
              >
                <div>
                  <p className="font-semibold">{t.category}</p>
                  <p className="text-sm text-gray-600">{t.account}</p>
                </div>

                <p className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "income" ? "+" : "-"}₹{Number(t.amount || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD TRANSACTION BUTTON */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full text-2xl"
      >
        +
      </button>

      {/* ADD TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">

            <select
              className="w-full border p-2 mb-2"
              value={newTransaction.type}
              onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <input
              placeholder="Amount"
              type="number"
              className="w-full border p-2 mb-2"
              value={newTransaction.amount}
              onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            />

            <input
              placeholder="Category"
              className="w-full border p-2 mb-2"
              value={newTransaction.category}
              onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
            />

            <select
              className="w-full border p-2 mb-2"
              value={newTransaction.account}
              onChange={e => setNewTransaction({ ...newTransaction, account: e.target.value })}
            >
              <option value="">Select account</option>
              {accounts.map(acc => (
                <option key={acc.id || acc._id} value={acc.name}>
                  {acc.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Description"
              className="w-full border p-2 mb-3"
              value={newTransaction.description}
              onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 p-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={addTransaction}
                className="flex-1 bg-blue-600 text-white p-2 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
