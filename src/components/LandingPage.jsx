import React from "react";
import {
  Sparkles,
  CheckSquare,
  Users,
  Shield,
  BarChart3,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sun,
  Moon,
  Server,
  Layers,
  Zap,
  Activity,
} from "lucide-react";

export default function LandingPage({
  theme,
  onToggleTheme,
  apiUrl,
  health,
  onOpenApiModal,
  onSignIn,
  onRegister,
  LiveClockComponent,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">
                TaskFlow AI
              </span>
              <span className="hidden sm:block text-[11px] text-slate-400">
                Internal Task & Ticket Tracking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {LiveClockComponent}

            <button
              onClick={onOpenApiModal}
              title="Backend API Server"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health.status === "online"
                    ? "bg-emerald-400"
                    : health.status === "checking"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline font-mono text-[11px] text-slate-300 truncate max-w-[160px]">
                {apiUrl.replace(/^https?:\/\//, "")}
              </span>
            </button>

            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            <button
              onClick={onSignIn}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm font-medium text-white transition cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={onRegister}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Google Gemini AI & Prisma ORM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Smarter Internal Task & Ticket Tracking for{" "}
              <span className="text-indigo-400">High-Velocity Teams</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Assign responsibilities, balance employee workloads, collaborate on
              tickets in real time, and let Google Gemini AI summarize long
              discussions, recommend priorities, and estimate effort hours.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onSignIn}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition cursor-pointer"
              >
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onRegister}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-sm transition cursor-pointer"
              >
                <span>Create Employee Account</span>
              </button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 max-w-lg border-t border-slate-800/80 text-xs">
              <div>
                <div className="font-bold text-base text-white">3 Roles</div>
                <div className="text-slate-400">Admin, Manager, Employee</div>
              </div>
              <div>
                <div className="font-bold text-base text-white">4 AI Tools</div>
                <div className="text-slate-400">Summary, Status, Priority, Effort</div>
              </div>
              <div>
                <div className="font-bold text-base text-white">100% RBAC</div>
                <div className="text-slate-400">JWT & Ownership Protected</div>
              </div>
            </div>
          </div>

          {/* Interactive Preview Card */}
          <div className="lg:col-span-5">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    Live Ticket Preview
                  </span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-800/70 font-semibold">
                  HIGH PRIORITY
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">#TASK-204</span>
                  <span className="flex items-center gap-1 text-blue-300">
                    <Clock className="w-3.5 h-3.5" /> 6h estimated
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Configure Production Database & Role-Based API Security
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Verify PostgreSQL connection pool, apply Prisma schema
                  migrations, and test JWT authorization rules across endpoints.
                </p>
              </div>

              {/* Simulated Gemini AI Insight Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/70 via-slate-950 to-slate-950 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Status Recommendation</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-white font-semibold">
                    Confidence: HIGH
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  “Database migrations and SSL endpoints are verified. Recommend
                  moving status to <strong>IN_PROGRESS</strong> while final
                  integration tests complete.”
                </p>
              </div>

              <button
                onClick={onSignIn}
                className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition cursor-pointer"
              >
                Open Interactive Workspace →
              </button>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="border-t border-slate-800/80 bg-slate-900/30 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Everything Your Team Needs in One Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Built to streamline internal operations with strict role
                permissions and AI-assisted decision making.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Gemini AI Assistant
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Summarize task discussions, identify blockers, recommend task
                  status & priority, and estimate completion hours on demand.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Role-Based Access
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Admins oversee the organization, Managers create and assign
                  team tasks, and Employees focus on their assigned deliverables.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Workload Monitoring
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inspect live employee task distributions across To Do, In
                  Progress, Blocked, and Completed to prevent bottlenecks.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Discussion & Audit Log
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Collaborate via threaded task comments while every status
                  change, assignment, and update is recorded in the activity
                  log.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            TaskFlow AI — Internal Task & Ticket Tracking System
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={onSignIn}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onRegister}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
