import React from 'react';
import { GraduationCap, ShieldCheck, Zap, BookOpen, Users, Award, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  onLoginClick: (role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPERADMIN') => void;
  onRegisterSchoolClick: () => void;
}

export const LandingPage: React.FC<Props> = ({ onLoginClick, onRegisterSchoolClick }) => {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0a0b10]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl text-white tracking-tight serif italic">ScholarSuite ERP</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block">Next-Gen Multi-School Operating System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLoginClick('ADMIN')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Portal Login
            </button>
            <button
              onClick={onRegisterSchoolClick}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/25"
            >
              Register Your School
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Zap className="w-4 h-4" /> Next-Generation School Management & Examination Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-light text-white serif italic leading-tight">
            Complete Academic Engine, Examinations, Broadsheets & Financial Systems
          </h1>

          <p className="text-base text-slate-400 max-w-3xl mx-auto leading-relaxed">
            ScholarSuite powers basic, secondary and higher educational institutions with automated continuous assessment, terminal broadsheet calculation, printable report cards, multi-gateway fee management, and parent portal access.
          </p>

          {/* Quick Demo Login Triggers */}
          <div className="pt-6 space-y-3">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block">Instant Interactive Demo Logins</span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onLoginClick('ADMIN')}
                className="px-4 py-2.5 bg-[#161925] hover:bg-slate-800 text-white border border-slate-700/80 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Admin Dashboard
              </button>
              <button
                onClick={() => onLoginClick('TEACHER')}
                className="px-4 py-2.5 bg-[#161925] hover:bg-slate-800 text-white border border-slate-700/80 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" /> Teacher Score Entry
              </button>
              <button
                onClick={() => onLoginClick('STUDENT')}
                className="px-4 py-2.5 bg-[#161925] hover:bg-slate-800 text-white border border-slate-700/80 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" /> Student Portal
              </button>
              <button
                onClick={() => onLoginClick('PARENT')}
                className="px-4 py-2.5 bg-[#161925] hover:bg-slate-800 text-white border border-slate-700/80 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-purple-400" /> Parent Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-6 py-16 bg-[#0f111a] border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-light text-white serif italic">Engineered for Academic Rigor & Financial Accuracy</h2>
            <p className="text-xs text-slate-400">Built to handle complex grading rules, ranking ties, broadsheet exports and multi-currency fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl w-fit">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Academic & Examination Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configurable SBA/CA class test percentages, terminal examination weights, grade scale bands, ties handling, class ranking, and bulk report card generation.
              </p>
            </div>

            <div className="p-6 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
              <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">School Finance & Fees Billing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Itemized class fee structures, mobile money & bank transfer receipting, payment balances tracking, financial statements, and expenditure logs.
              </p>
            </div>

            <div className="p-6 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
              <div className="p-3 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Strict Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete data privacy and security. School A can never view or modify data belonging to School B, enforced server-side and via Firestore rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 ScholarSuite ERP. Enterprise School Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};
