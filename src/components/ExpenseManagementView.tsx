import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle2, TrendingDown, TrendingUp, Wallet, ShieldCheck } from 'lucide-react';
import { ExpenseRecord } from '../types';
import { getExpensesBySchool, saveExpenseRecord, getFeePaymentsBySchool } from '../lib/services';

interface Props {
  schoolId: string;
}

export const ExpenseManagementView: React.FC<Props> = ({ schoolId }) => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('UTILITIES');
  const [amount, setAmount] = useState(0);
  const [payee, setPayee] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [expList, payList] = await Promise.all([
      getExpensesBySchool(schoolId),
      getFeePaymentsBySchool(schoolId)
    ]);

    setExpenses(expList);
    const inc = payList.reduce((acc, curr) => acc + curr.amountPaid, 0);
    setTotalIncome(inc);
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveExpenseRecord({
      schoolId,
      category,
      amount,
      payee,
      description,
      expenseDate,
      approvedBy: 'Bursar / Accountant',
      status: 'APPROVED'
    });

    setShowModal(false);
    loadData();
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading School Financial Ledger...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total Income (Fees Collected)
          </span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">GHS {totalIncome.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Total School Expenses
          </span>
          <p className="text-2xl font-bold text-rose-400 font-mono">GHS {totalExpenses.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" /> Net Operating Balance
          </span>
          <p className={`text-2xl font-bold font-mono ${netBalance >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            GHS {netBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-light text-white serif italic">School Expenditure Ledger</h2>
          <p className="text-xs text-slate-400">Track operating expenses, staff salaries, utility bills & maintenance costs</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Record New Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#121420] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Payee / Vendor</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Amount (GHS)</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-[#141724]">
                <td className="p-3 font-mono text-slate-400">{exp.expenseDate}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-[10px] text-blue-300">{exp.category}</span></td>
                <td className="p-3 font-semibold text-white">{exp.payee}</td>
                <td className="p-3 text-slate-300">{exp.description}</td>
                <td className="p-3 text-right font-mono text-rose-400 font-bold">GHS {exp.amount.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
                    {exp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-semibold text-white serif italic">Record School Expense</h3>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="UTILITIES">Electricity / Water / Internet</option>
                  <option value="SALARIES">Staff Salaries & Allowances</option>
                  <option value="MAINTENANCE">Facility Repair & Maintenance</option>
                  <option value="STATIONERY">Printing & Stationery</option>
                  <option value="LAB_SUPPLIES">Science Lab & ICT Equipment</option>
                  <option value="SPORTS">Sports & Cultural Activities</option>
                  <option value="OTHER">Other Operating Expenses</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Payee / Vendor Name</label>
                <input
                  type="text"
                  required
                  value={payee}
                  onChange={e => setPayee(e.target.value)}
                  placeholder="e.g. ECG Power Company / Office Depot"
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Amount (GHS)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief note on expense..."
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#161925] text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
