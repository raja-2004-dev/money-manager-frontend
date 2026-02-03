import { useState } from "react";
import api from "../api";

export default function EditModal({ transaction, close, refresh }) {

  const [form, setForm] = useState({
    amount: transaction.amount,
    category: transaction.category,
    division: transaction.division,
    description: transaction.description
  });

  const submit = async () => {
    try {
      await api.put(`/transactions/${transaction.id}`, form);
      refresh();
      close();
    } catch (err) {
      alert(err.response?.data || "Edit failed");
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Edit Transaction</h2>
              <p className="text-blue-100 text-sm mt-1">Modify transaction details</p>
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
          
          {/* Transaction Type Badge */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
              transaction.type === "income" 
                ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                : "bg-gradient-to-br from-red-500 to-rose-600"
            }`}>
              {transaction.type === "income" ? "↓" : "↑"}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Transaction Type</p>
              <p className="font-bold text-gray-800 capitalize">{transaction.type}</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
              <input
                type="number"
                className="border-2 border-gray-200 w-full p-3.5 pl-10 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg font-semibold"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <input
              className="border-2 border-gray-200 w-full p-3.5 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            />
          </div>

          {/* Division */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Division
            </label>
            <select
              className="border-2 border-gray-200 p-3.5 rounded-xl w-full focus:border-blue-500 focus:outline-none transition-colors"
              value={form.division}
              onChange={e => setForm({ ...form, division: e.target.value })}
            >
              <option>Personal</option>
              <option>Office</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="border-2 border-gray-200 w-full p-3.5 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              placeholder="Add notes"
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
            className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}