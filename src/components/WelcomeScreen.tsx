import React from 'react';
import {
  GraduationCap,
  Users,
  UserCheck,
  BookOpen,
  Award,
  Calendar,
  ShieldCheck,
  ArrowRight,
  School,
  FileSpreadsheet,
  MessageSquare,
  Facebook,
  Loader2
} from 'lucide-react';

interface Props {
  onGetStarted: () => void;
  onOpenSuperAdmin: () => void;
  onOpenLogin: () => void;
  isSuperAdminLoading?: boolean;
}

export const WelcomeScreen: React.FC<Props> = ({
  onGetStarted,
  onOpenSuperAdmin,
  onOpenLogin,
  isSuperAdminLoading = false
}) => {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-[#0f111a] border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-md">
              <span className="text-white font-bold text-lg italic">E</span>
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight text-white serif italic block leading-tight">
                EduMaster <span className="text-blue-500 not-italic font-light">Pro</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#161925] hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Portal Login
            </button>
            <button
              onClick={onOpenSuperAdmin}
              disabled={isSuperAdminLoading}
              className="px-4 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 rounded-lg transition-all flex items-center gap-2 border border-blue-500/30 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
            >
              {isSuperAdminLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Super Admin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#111420] via-[#0a0b10] to-[#0a0b10] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-slate-800/80">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase tracking-widest font-bold mb-6">
              <School className="w-3.5 h-3.5" /> Professional Multi-School Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white serif italic mb-6 leading-tight">
              Welcome to <span className="text-blue-400 font-normal">EduMaster Pro</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Your Complete School Management Solution for modern basic schools, Junior High Schools (JHS), and educational institutions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>VERIFY & ACTIVATE SCHOOL</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold block mb-2">Core Capabilities</span>
            <h2 className="text-3xl font-light text-white serif italic mb-3">
              Comprehensive Operations Management
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Everything your school requires to manage academic setups, staff records, student admissions, subjects, classes, and administrative oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Student Management</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Complete student records including admission details, class placement, stream assignment, parent/guardian contact info, and emergency contact details.
              </p>
            </div>

            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Teacher & Staff Setup</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Staff ID profiles, class teacher assignments, subject workloads, periods tracking, digital signature uploads, and secure access permissions.
              </p>
            </div>

            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Subject Management</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Categorize subjects as CORE, ELECTIVE, or LANGUAGE. Filter automatically between PRIMARY and JHS levels to ensure academic precision.
              </p>
            </div>

            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <School className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Classes & Streams</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Manage KG, Basic 1-6, JHS 1-3, custom stream divisions (e.g., JHS 1A, 1B), capacity limits, and dedicated class teacher assignments.
              </p>
            </div>

            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Grading Engines</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Configurable grading scales including BECE, WAEC, and GPA standards with custom score ranges, point values, and remarks.
              </p>
            </div>

            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Academic Calendar</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Set academic years, active terms, reopening dates, closing dates, and vacation periods with complete school-level data isolation.
              </p>
            </div>
          </div>
        </section>

        {/* Action Banner */}
        <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
              Ready to Activate Your School?
            </h3>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
              If you received your School ID, Activation Code, Token, and Licensing Key, click below to begin verification.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ACTIVATE SCHOOL NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center space-y-5">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-xs sm:text-sm text-slate-800 font-bold uppercase tracking-wider">
            Need School Registration or License Renewal? Contact Developer / Super Admin
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-700">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              📞 Phone: <a href="tel:0592005260" className="text-slate-900 font-bold hover:text-blue-600 transition-colors">0592005260</a> / <a href="tel:0540712524" className="text-slate-900 font-bold hover:text-blue-600 transition-colors">0540712524</a>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              ✉️ Email: <a href="mailto:effahdavid45@gmail.com" className="text-blue-600 font-bold hover:underline">effahdavid45@gmail.com</a>
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-900">
              💬 WhatsApp: <a href="https://wa.me/233592005260" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">0592005260</a>
            </span>
          </div>

          {/* Social Media Handles as Functional SVG Icon Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <span className="text-slate-700 font-bold text-xs uppercase tracking-wider mr-1">Social Media Handles:</span>
            
            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/1CK2w7tBZT/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit EduMaster Pro on Facebook"
              className="p-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm flex items-center gap-2 cursor-pointer group"
              title="Visit EduMaster Pro on Facebook"
            >
              <Facebook className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-semibold text-xs">Facebook</span>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@kindav44?_r=1&_t=ZS-98kantth0Eu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow EduMaster Pro on TikTok"
              className="p-2.5 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-300 hover:border-slate-900 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm flex items-center gap-2 cursor-pointer group"
              title="Follow EduMaster Pro on TikTok"
            >
              <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.34 1.51-1.4 2.5-.07.96.34 1.93 1.07 2.56.82.72 2.01.91 3.03.53.95-.33 1.68-1.14 1.92-2.11.14-.62.14-1.28.14-1.92V.02z"/>
              </svg>
              <span className="font-semibold text-xs">TikTok</span>
            </a>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em] pt-3 border-t border-slate-200">
          Secure Multi-Tenant Encrypted SaaS Platform &copy; {new Date().getFullYear()} EduMaster Pro
        </p>
      </footer>
    </div>
  );
};
