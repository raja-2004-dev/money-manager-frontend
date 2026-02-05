import { useState } from "react";
import api from "./api";

export default function AddModal({ close, refresh, accounts }) {

  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    division: "Personal",
    description: "",
    account: accounts[0]?.name || ""
  });

  const submit = async () => {
    if (!form.amount || !form.category) return alert("Fill required fields");

    try {
      await api.post("/transactions", form);
      refresh();
      close();
    } catch {
      alert("Failed to add transaction");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>

      <div className="animate-slideUp bg-white rounded-3xl shadow-2xl w-full max-w-md border border-indigo-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add Transaction</h2>
              <p className="text-indigo-100 text-sm mt-1">Record a new income or expense</p>
            </div>
            <button
              onClick={close}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center justify-center"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`p-4 rounded-xl font-semibold transition-all ${
                  form.type === "expense"
                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setForm({ ...form, type: "expense" })}
              >
                💸 Expense
              </button>
              <button
                className={`p-4 rounded-xl font-semibold transition-all ${
                  form.type === "income"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setForm({ ...form, type: "income" })}
              >
                💰 Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
              <input
                type="number"
                className="border-2 border-gray-200 w-full p-3.5 pl-10 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors text-lg font-semibold"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <input
              className="border-2 border-gray-200 w-full p-3.5 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="e.g., Food, Transport, Salary"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            />
          </div>

          {/* Division & Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Division
              </label>
              <select
                className="border-2 border-gray-200 p-3.5 rounded-xl w-full focus:border-indigo-500 focus:outline-none transition-colors"
                value={form.division}
                onChange={e => setForm({ ...form, division: e.target.value })}
              >
                <option>Personal</option>
                <option>Office</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account
              </label>
              <select
                className="border-2 border-gray-200 p-3.5 rounded-xl w-full focus:border-indigo-500 focus:outline-none transition-colors"
                value={form.account}
                onChange={e => setForm({ ...form, account: e.target.value })}
              >
                {accounts.map(a => (
                  <option key={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="border-2 border-gray-200 w-full p-3.5 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors resize-none"
              placeholder="Add notes (optional)"
              rows="3"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={close}
            className="flex-1 py-3.5 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
}