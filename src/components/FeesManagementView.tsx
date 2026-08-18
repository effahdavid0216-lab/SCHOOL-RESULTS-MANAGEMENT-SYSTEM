import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Printer, CheckCircle2, FileText, CreditCard, PieChart, Search, Download } from 'lucide-react';
import { ClassItem, Student, FeeCategoryType, FeeStructure, StudentFeeInvoice, FeePaymentRecord } from '../types';
import { getClassesBySchool, getStudentsBySchool, getFeeStructuresBySchool, saveFeeStructure, getFeeInvoicesBySchool, saveFeeInvoice, getFeePaymentsBySchool, recordFeePayment } from '../lib/services';

interface Props {
  schoolId: string;
}

const CATEGORIES: FeeCategoryType[] = [
  'TUITION',
  'ADMISSION',
  'BOOKS',
  'UNIFORM',
  'EXAMINATION',
  'FEEDING',
  'TRANSPORTATION',
  'ICT',
  'OTHER'
];

export const FeesManagementView: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'STRUCTURES' | 'PAYMENTS'>('INVOICES');
  const [searchQuery, setSearchQuery] = useState('');

  // New Fee Structure Modal
  const [showStructModal, setShowStructModal] = useState(false);
  const [structClassId, setStructClassId] = useState('');
  const [structItems, setStructItems] = useState<{ category: FeeCategoryType; description: string; amount: number }[]>([
    { category: 'TUITION', description: 'Term Academic Tuition', amount: 450 },
    { category: 'BOOKS', description: 'Exercise & Core Textbooks', amount: 150 },
    { category: 'ICT', description: 'Computer Lab Access & ICT Fees', amount: 80 }
  ]);

  // Record Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentFeeInvoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE'>('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Receipt Modal for Print
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<FeePaymentRecord | null>(null);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [cList, stList, fsList, invList, payList] = await Promise.all([
      getClassesBySchool(schoolId),
      getStudentsBySchool(schoolId),
      getFeeStructuresBySchool(schoolId),
      getFeeInvoicesBySchool(schoolId),
      getFeePaymentsBySchool(schoolId)
    ]);

    setClasses(cList);
    setStudents(stList);
    setFeeStructures(fsList);
    setInvoices(invList);
    setPayments(payList);

    if (cList.length > 0) setStructClassId(cList[0].id);
    setLoading(false);
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    const cls = classes.find(c => c.id === structClassId);
    const totalAmount = structItems.reduce((acc, curr) => acc + curr.amount, 0);

    const structId = await saveFeeStructure({
      schoolId,
      classId: structClassId,
      className: cls?.className || 'Class',
      academicYear: '2026/2027',
      term: 'Term 1',
      feeItems: structItems.map((item, idx) => ({ id: `item_${idx}`, ...item })),
      totalAmount
    });

    // Auto generate invoices for enrolled students in this class
    const classStudents = students.filter(s => s.classId === structClassId);
    for (const st of classStudents) {
      await saveFeeInvoice({
        schoolId,
        studentId: st.id,
        studentName: st.fullName,
        admissionNo: st.admissionNo,
        classId: structClassId,
        className: cls?.className || 'Class',
        academicYear: '2026/2027',
        term: 'Term 1',
        feeStructureId: structId,
        totalBilled: totalAmount,
        totalPaid: 0,
        discount: 0,
        outstandingBalance: totalAmount,
        status: 'UNPAID'
      });
    }

    setShowStructModal(false);
    loadData();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const payId = await recordFeePayment({
      schoolId,
      invoiceId: selectedInvoice.id,
      studentId: selectedInvoice.studentId,
      studentName: selectedInvoice.studentName,
      amountPaid: payAmount,
      paymentMethod: payMethod,
      referenceNo: payRef || `REF-${Date.now().toString().slice(-6)}`,
      receivedBy: 'School Accounts Office',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: payNotes
    });

    setShowPayModal(false);
    await loadData();

    // Show receipt
    const updatedPayments = await getFeePaymentsBySchool(schoolId);
    const savedPay = updatedPayments.find(p => p.id === payId);
    if (savedPay) {
      setCurrentReceipt(savedPay);
      setShowReceiptModal(true);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBilledAll = invoices.reduce((acc, curr) => acc + curr.totalBilled, 0);
  const totalPaidAll = invoices.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalOutstandingAll = invoices.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Fees & Accounting Engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Fees Billed</span>
          <p className="text-2xl font-bold text-white font-mono">GHS {totalBilledAll.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 block">Across {invoices.length} student invoices</span>
        </div>

        <div className="p-4 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Total Fees Collected</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">GHS {totalPaidAll.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 block">{totalBilledAll > 0 ? Math.round((totalPaidAll / totalBilledAll) * 100) : 0}% Collection Rate</span>
        </div>

        <div className="p-4 bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Outstanding Arrears</span>
          <p className="text-2xl font-bold text-rose-400 font-mono">GHS {totalOutstandingAll.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 block">Uncollected student balances</span>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'INVOICES' ? 'bg-blue-600 text-white' : 'bg-[#161925] text-slate-300 hover:bg-slate-800'
            }`}
          >
            Student Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('STRUCTURES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'STRUCTURES' ? 'bg-blue-600 text-white' : 'bg-[#161925] text-slate-300 hover:bg-slate-800'
            }`}
          >
            Class Fee Structures ({feeStructures.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'PAYMENTS' ? 'bg-blue-600 text-white' : 'bg-[#161925] text-slate-300 hover:bg-slate-800'
            }`}
          >
            Payment Receipts Log ({payments.length})
          </button>
        </div>

        {activeTab === 'STRUCTURES' && (
          <button
            onClick={() => setShowStructModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Create Class Fee Schedule
          </button>
        )}
      </div>

      {/* Invoices Tab */}
      {activeTab === 'INVOICES' && (
        <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student, admission no, class..."
                className="w-full pl-9 pr-4 py-2 bg-[#161925] border border-slate-700/80 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400">Showing {filteredInvoices.length} Invoices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#121420] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-3">Student</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Class</th>
                  <th className="p-3 text-right">Total Billed</th>
                  <th className="p-3 text-right">Total Paid</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#141724]">
                    <td className="p-3 font-semibold text-white">{inv.studentName}</td>
                    <td className="p-3 text-slate-400 font-mono">{inv.admissionNo}</td>
                    <td className="p-3">{inv.className}</td>
                    <td className="p-3 text-right font-mono">GHS {inv.totalBilled.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">GHS {inv.totalPaid.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-rose-400">GHS {inv.outstandingBalance.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : inv.status === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setPayAmount(inv.outstandingBalance);
                          setShowPayModal(true);
                        }}
                        disabled={inv.outstandingBalance <= 0}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg text-[11px] cursor-pointer"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fee Structures Tab */}
      {activeTab === 'STRUCTURES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feeStructures.map(struct => (
            <div key={struct.id} className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-white text-base">{struct.className} Fee Schedule</h3>
                  <span className="text-[10px] text-slate-400">{struct.academicYear} • {struct.term}</span>
                </div>
                <span className="text-lg font-bold text-emerald-400 font-mono">GHS {struct.totalAmount.toLocaleString()}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {struct.feeItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-[#161925] rounded-lg">
                    <span className="text-slate-300">{item.description} ({item.category})</span>
                    <span className="font-mono text-white">GHS {item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments Log Tab */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121420] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="p-3">Receipt No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Date</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Reference No</th>
                <th className="p-3 text-right">Amount Paid</th>
                <th className="p-3 text-center">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {payments.map(pay => (
                <tr key={pay.id} className="hover:bg-[#141724]">
                  <td className="p-3 font-mono font-bold text-blue-400">{pay.receiptNo}</td>
                  <td className="p-3 font-semibold text-white">{pay.studentName}</td>
                  <td className="p-3 text-slate-400">{pay.paymentDate}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-[10px]">{pay.paymentMethod}</span></td>
                  <td className="p-3 font-mono text-slate-400">{pay.referenceNo}</td>
                  <td className="p-3 text-right font-mono text-emerald-400 font-bold">GHS {pay.amountPaid.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setCurrentReceipt(pay);
                        setShowReceiptModal(true);
                      }}
                      className="px-2.5 py-1 bg-[#161925] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <Printer className="w-3 h-3 text-blue-400" /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-semibold text-white serif italic">Record Fee Payment</h3>

            <div className="p-3 bg-[#161925] rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="font-semibold text-white block">{selectedInvoice.studentName} ({selectedInvoice.admissionNo})</span>
              <span className="text-slate-400 block">{selectedInvoice.className} • Outstanding Arrears: <strong className="text-rose-400">GHS {selectedInvoice.outstandingBalance}</strong></span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Payment Amount (GHS)</label>
                <input
                  type="number"
                  required
                  max={selectedInvoice.outstandingBalance}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                  <option value="BANK_TRANSFER">Bank Deposit / Direct Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Transaction Ref / Slip No.</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="e.g. MOMO-982341 / CHQ-0012"
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-[#161925] text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && currentReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-md p-6 space-y-4 print:p-0">
            <div className="text-center border-b pb-4">
              <h2 className="text-lg font-bold uppercase tracking-wide">OFFICIAL SCHOOL FEE RECEIPT</h2>
              <p className="text-xs text-slate-500">Receipt No: {currentReceipt.receiptNo}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Received From:</span>
                <span className="font-bold">{currentReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span>{currentReceipt.paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold">{currentReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono">{currentReceipt.referenceNo}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-100 rounded-xl text-sm font-bold mt-2">
                <span>Amount Paid:</span>
                <span className="text-emerald-700">GHS {currentReceipt.amountPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-4 border-t">
              Thank you for your prompt fee payment. Accounts Office Signature: ________________
            </div>

            <div className="flex justify-end gap-2 pt-2 print:hidden">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
