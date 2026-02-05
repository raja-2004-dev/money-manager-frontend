import { useState, useEffect, useCallback } from "react"; // FIX: added useCallback
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function Dashboard() {
  const [user] = useState(null); // FIX: removed unused setUser
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

  // FIX: wrapped in useCallback so ESLint dependency rule is satisfied
  const loadData = useCallback(async () => {
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
  }, [nav]);

  // FIX: dependencies now correct
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
        balance: parseFloat(initialBalance)
      });
      setShowAccountSetup(false);
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

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    /* YOUR UI JSX — unchanged */
    <div className="min-h-screen bg-gray-50">
      {/* everything else exactly same as your original */}
    </div>
  );
}
