import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ type: "expense", amount: "", category: "", description: "", account: "" });
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) nav("/");
    else loadData();
  }, [loadData, nav]);

  const loadData = async () => {
    try {
      const [accs, trans] = await Promise.all([
        api.get("/api/transactions/accounts"),
        api.get("/api/transactions")
      ]);
      setAccounts(accs.data);
      setTransactions(trans.data);
      if (accs.data.length === 0) setShowAccountSetup(true);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) nav("/");
    }
  };

  const createAccount = async () => {
    if (!accountName || !initialBalance) {
      alert("Please fill all fields");
      return;
    }
    try {
      await api.post("/api/transactions/accounts", { name: accountName, balance: parseFloat(initialBalance) });
      setShowAccountSetup(false);
      loadData();
    } catch (err) {
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
      setNewTransaction({ type: "expense", amount: "", category: "", description: "", account: "" });
      loadData();
    } catch (err) {
      alert("Failed to add transaction");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/");
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">💰 Money Manager</h1>
          <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Logout</button>
        </div>
      </div>

      {/* Account Setup Modal */}
      {showAccountSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Your First Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <input
                  placeholder="e.g., Cash, Bank"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Balance</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={initialBalance}
                  onChange={e => setInitialBalance(e.target.value)}
                />
              </div>
            </div>
            <button onClick={createAccount} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Create Account</button>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Transaction</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTransaction({...newTransaction, type: "expense"})}
                  className={`flex-1 py-2 rounded-lg font-semibold ${newTransaction.type === "expense" ? "bg-red-500 text-white" : "bg-gray-200"}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setNewTransaction({...newTransaction, type: "income"})}
                  className={`flex-1 py-2 rounded-lg font-semibold ${newTransaction.type === "income" ? "bg-green-500 text-white" : "bg-gray-200"}`}
                >
                  Income
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newTransaction.amount}
                  onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  placeholder="Food, Rent, Salary..."
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newTransaction.category}
                  onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newTransaction.account}
                  onChange={e => setNewTransaction({...newTransaction, account: e.target.value})}
                >
                  <option value="">Select account</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <input
                  placeholder="Add notes..."
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg font-semibold">Cancel</button>
              <button onClick={addTransaction} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-600 text-sm">Total Balance</p>
            <p className="text-3xl font-bold text-blue-600">₹{totalBalance.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-600 text-sm">Total Income</p>
            <p className="text-3xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-600 text-sm">Total Expense</p>
            <p className="text-3xl font-bold text-red-600">₹{totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="p-4 border rounded-lg">
                <p className="font-semibold">{acc.name}</p>
                <p className="text-2xl font-bold text-blue-600">₹{parseFloat(acc.balance).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg text-2xl hover:bg-blue-700"
        >
          +
        </button>

        {/* Transactions */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-2">
            {transactions.slice(0, 10).map(t => (
              <div key={t.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{t.category}</p>
                  <p className="text-sm text-gray-600">{t.account} • {new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <p className={`text-xl font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "income" ? "+" : "-"}₹{parseFloat(t.amount).toFixed(2)}
                </p>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-center text-gray-500 py-8">No transactions yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}