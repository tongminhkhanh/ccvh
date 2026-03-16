import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppData } from './hooks/useAppData';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Tab Components
import { Dashboard } from './components/dashboard/Dashboard';
import { Attendance } from './components/attendance/Attendance';
import { Students } from './components/students/Students';
import { History } from './components/history/History';
import { Reports } from './components/reports/Reports';
import { Payments } from './components/payments/Payments';
import { Settings } from './components/settings/Settings';

// Common/Other Components
import { RechargeModal } from './components/students/RechargeModal';
import { AIChatPopup } from './components/common/AIChatPopup';
import { formatCurrency } from './utils/helpers';

export default function App() {
  const {
    activeTab, setActiveTab,
    loading,
    students, stats, attendance, reportData, payments, paymentStats, config, setConfig, financialAnalytics,
    selectedDate, setSelectedDate,
    searchTerm, setSearchTerm,
    startDate, setStartDate,
    endDate, setEndDate,
    paymentStartDate, setPaymentStartDate,
    paymentEndDate, setPaymentEndDate,
    paymentFilter, setPaymentFilter,
    isMobileMenuOpen, setIsMobileMenuOpen,
    selectedStudentIds, setSelectedStudentIds,
    rechargeModal, setRechargeModal,
    rechargeAmount, setRechargeAmount,
    rechargeNote, setRechargeNote,
    rechargeTab, setRechargeTab,
    transactions, isLoadingTransactions, fetchTransactions, handleRecharge, handleDeleteTransaction,
    newStudent, setNewStudent, handleAddStudent, handleDeleteStudent, handleBatchDeleteStudents, handleImport,
    toggleAttendance, markAllPresent, markAllAbsent,
    handleGeneratePayments, handleTogglePayment, handleRemind,
    handleExportPayments, handleExportReport, handleExportMatrixReport,
    handlePrint, printingPayments,
    handleSaveSettings
  } = useAppData();

  return (
    <>
      <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-900">
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main className="md:ml-64 p-4 md:p-8 pb-8">
          <Header
            activeTab={activeTab}
            loading={loading}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            setActiveTab={setActiveTab}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  config={config}
                  financialAnalytics={financialAnalytics}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === 'attendance' && (
                <Attendance
                  students={students}
                  attendance={attendance}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  toggleAttendance={toggleAttendance}
                  markAllPresent={markAllPresent}
                  markAllAbsent={markAllAbsent}
                />
              )}
              {activeTab === 'students' && (
                <Students
                  students={students}
                  newStudent={newStudent}
                  setNewStudent={setNewStudent}
                  handleAddStudent={handleAddStudent}
                  handleDeleteStudent={handleDeleteStudent}
                  selectedStudentIds={selectedStudentIds}
                  setSelectedStudentIds={setSelectedStudentIds}
                  handleBatchDeleteStudents={handleBatchDeleteStudents}
                  handleImport={handleImport}
                  setRechargeModal={setRechargeModal}
                  loading={loading}
                />
              )}
              {activeTab === 'history' && (
                <History
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  attendance={attendance}
                  config={config}
                />
              )}
              {activeTab === 'reports' && (
                <Reports
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  reportData={reportData}
                  handleExportReport={handleExportReport}
                  handleExportMatrixReport={handleExportMatrixReport}
                />
              )}
              {activeTab === 'payments' && (
                <Payments
                  paymentStartDate={paymentStartDate}
                  setPaymentStartDate={setPaymentStartDate}
                  paymentEndDate={paymentEndDate}
                  setPaymentEndDate={setPaymentEndDate}
                  handleGeneratePayments={handleGeneratePayments}
                  handleExportPayments={handleExportPayments}
                  payments={payments}
                  paymentStats={paymentStats}
                  paymentFilter={paymentFilter}
                  setPaymentFilter={setPaymentFilter}
                  handleTogglePayment={handleTogglePayment}
                  handleRemind={handleRemind}
                  handlePrint={handlePrint}
                  loading={loading}
                />
              )}
              {activeTab === 'settings' && (
                <Settings
                  config={config}
                  setConfig={setConfig}
                  handleSaveSettings={handleSaveSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <RechargeModal
        isOpen={rechargeModal.isOpen}
        studentId={rechargeModal.studentId}
        studentName={rechargeModal.studentName}
        onClose={() => setRechargeModal({ ...rechargeModal, isOpen: false })}
        rechargeTab={rechargeTab}
        setRechargeTab={setRechargeTab}
        rechargeAmount={rechargeAmount}
        setRechargeAmount={setRechargeAmount}
        rechargeNote={rechargeNote}
        setRechargeNote={setRechargeNote}
        isLoading={loading}
        handleRecharge={handleRecharge}
        transactions={transactions}
        isLoadingTransactions={isLoadingTransactions}
        fetchTransactions={fetchTransactions}
        handleDeleteTransaction={handleDeleteTransaction}
      />

      {/* Printing Area */}
      {printingPayments.length > 0 && (
        <div id="print-area" className="hidden print:block absolute top-0 left-0 w-full bg-white print:p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
            {printingPayments.map((p, index) => (
              <div key={`${p.id}-${index}`} className="border-2 border-slate-800 p-6 rounded-xl flex flex-col gap-4 text-black break-inside-avoid">
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="font-bold text-lg uppercase tracking-tight">TRƯỜNG TIỂU HỌC TÔ HIỆU</h2>
                    <p className="text-sm font-medium">Lớp: {p.class_name}</p>
                    <p className="text-sm">GV: Cô Việt Hồng</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm italic opacity-70">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <div className="text-center py-2">
                  <h1 className="text-xl font-black uppercase">Phiếu Thu Tiền Ăn</h1>
                  <p className="text-xs font-bold mt-1 opacity-60 italic">Từ {paymentStartDate} đến {paymentEndDate}</p>
                </div>
                <div className="flex flex-col gap-3 py-2">
                  <div className="flex text-lg border-b border-dotted border-slate-300 pb-1">
                    <span className="w-40 font-semibold text-slate-600">Học sinh:</span>
                    <span className="font-black uppercase flex-1">{p.name}</span>
                  </div>
                  <div className="flex text-lg border-b border-dotted border-slate-300 pb-1">
                    <span className="w-40 font-semibold text-slate-600">Số bữa ăn:</span>
                    <span className="font-bold flex-1">{p.total_meals} bữa</span>
                  </div>
                  <div className="flex text-lg border-b border-dotted border-slate-300 pb-1">
                    <span className="w-40 font-semibold text-slate-600">Đơn giá:</span>
                    <span className="flex-1 font-medium">{formatCurrency(p.meal_price)}/bữa</span>
                  </div>
                  <div className="flex text-2xl mt-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="w-40 font-black uppercase text-slate-700">Thành Tiền:</span>
                    <span className="font-black flex-1 text-right text-3xl">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-start mt-8">
                  <div className="text-center w-48">
                    <p className="font-bold mb-12">Người nộp tiền</p>
                    <p className="text-xs italic text-slate-400">(Ký và ghi rõ họ tên)</p>
                  </div>
                  <div className="text-center w-48">
                    <p className="font-bold mb-12">GV lập phiếu</p>
                    <p className="font-bold italic text-slate-900 border-b-2 border-slate-900 inline-block px-4">Việt Hồng</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AIChatPopup />
    </>
  );
}
