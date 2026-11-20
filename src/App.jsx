import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  UserCircle,
  Sparkles,
  Plus,
  Search,
  LogOut,
  Server,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Calendar,
  Sun,
  Moon,
  TrendingUp,
  Layers,
  AlertTriangle,
} from "lucide-react";
import {
  api,
  getApiBaseUrl,
  setApiBaseUrl,
  getAuthToken,
  setAuthToken,
} from "./services/api.js";
import TaskDetailModal from "./components/TaskDetailModal.jsx";
import TaskFormModal from "./components/TaskFormModal.jsx";
import ApiServerModal from "./components/ApiServerModal.jsx";

export const STATUS_META = {
  TODO: {
    label: "To Do",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badge: "bg-blue-950/80 text-blue-300 border-blue-800/80",
    dot: "bg-blue-400",
  },
  IN_REVIEW: {
    label: "In Review",
    badge: "bg-purple-950/80 text-purple-300 border-purple-800/80",
    dot: "bg-purple-400",
  },
  BLOCKED: {
    label: "Blocked",
    badge: "bg-rose-950/80 text-rose-300 border-rose-800/80",
    dot: "bg-rose-400",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
    dot: "bg-emerald-400",
  },
};

export const PRIORITY_META = {
  LOW: {
    label: "Low",
    badge: "bg-slate-800/80 text-slate-300 border-slate-700",
  },
  MEDIUM: {
    label: "Medium",
    badge: "bg-amber-950/80 text-amber-300 border-amber-800/70",
  },
  HIGH: {
    label: "High",
    badge: "bg-orange-950/80 text-orange-300 border-orange-800/70",
  },
  URGENT: {
    label: "Urgent",
    badge: "bg-red-950/90 text-red-300 border-red-800",
  },
};

export default function App() {
  // Theme state ("dark" | "light")
  const [theme, setTheme] = useState(
    () => localStorage.getItem("taskflow_theme") || "dark"
  );

  // Live Date & Time state
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }
    localStorage.setItem("taskflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "tasks" | "team" | "profile"

  // Server health & URL modal
  const [apiUrl, setApiUrlState] = useState(getApiBaseUrl());
  const [health, setHealth] = useState({ status: "checking", message: "" });
  const [showApiModal, setShowApiModal] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignedToId: "",
    page: 1,
  });
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Users & Workload state (Admin/Manager)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedWorkload, setSelectedWorkload] = useState(null);
  const [workloadLoading, setWorkloadLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Check API health
  const checkServerHealth = useCallback(async () => {
    setHealth({ status: "checking", message: "Checking connection..." });
    try {
      const res = await api.checkHealth();
      setHealth({
        status: "online",
        message: res.message || "Connected to API & PostgreSQL",
      });
    } catch (err) {
      setHealth({
        status: "offline",
        message: err.message || "Cannot reach backend server",
      });
    }
  }, []);

  // Load current user on startup
  const loadCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      const currentUser = res.data?.user || res.data;
      setUser(currentUser);
      setProfileForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
      });
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkServerHealth();
    loadCurrentUser();
  }, [checkServerHealth, loadCurrentUser, apiUrl]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setTasksLoading(true);
    try {
      const res = await api.getTasks({
        page: filters.page,
        limit: 12,
        status: filters.status,
        priority: filters.priority,
        search: filters.search,
        assignedToId:
          user.role !== "EMPLOYEE" ? filters.assignedToId : undefined,
      });
      setTasks(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTasksLoading(false);
    }
  }, [user, filters, showToast]);

  // Fetch users (for Admin & Manager)
  const fetchUsers = useCallback(async () => {
    if (!user || user.role === "EMPLOYEE") return;
    setUsersLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUsersLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      if (user.role === "ADMIN" || user.role === "MANAGER") {
        fetchUsers();
      }
    }
  }, [user, fetchTasks, fetchUsers]);

  // Handle Login / Register
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setSubmittingAuth(true);

    try {
      if (authMode === "register") {
        await api.register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        });
        setAuthSuccess("Account created! Signing you in...");
      }

      const loginRes = await api.login({
        email: authForm.email,
        password: authForm.password,
      });

      const { token, user: loggedInUser } = loginRes.data;
      setAuthToken(token);
      setUser(loggedInUser);
      setProfileForm({
        name: loggedInUser.name || "",
        email: loggedInUser.email || "",
      });
      setAuthForm({ name: "", email: "", password: "" });
      showToast(`Welcome back, ${loggedInUser.name}!`);
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setTasks([]);
    setUsers([]);
    setSelectedTaskId(null);
    setActiveTab("dashboard");
  };

  const handleQuickStatusUpdate = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      showToast(`Status updated to ${STATUS_META[newStatus]?.label || newStatus}`);
      fetchTasks();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleInspectWorkload = async (employeeId) => {
    setWorkloadLoading(true);
    try {
      const res = await api.getWorkload(employeeId);
      setSelectedWorkload(res.data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setWorkloadLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      showToast(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleToggleUserActive = async (targetUser) => {
    try {
      if (targetUser.isActive) {
        await api.deactivateUser(targetUser.id);
        showToast(`${targetUser.name} deactivated`);
      } else {
        await api.reactivateUser(targetUser.id);
        showToast(`${targetUser.name} reactivated`);
      }
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    try {
      const res = await api.updateUser(user.id, {
        name: profileForm.name,
        email: profileForm.email,
      });
      setUser((prev) => ({ ...prev, ...res.data }));
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    }
  };

  const canCreateTasks = user?.role === "ADMIN" || user?.role === "MANAGER";
  const employeesList = users.filter(
    (u) => u.role === "EMPLOYEE" && u.isActive
  );

  // Compute summary metrics from loaded tasks
  const stats = {
    total: pagination.total || tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter(
      (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
    ).length,
    blocked: tasks.filter((t) => t.status === "BLOCKED").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const completionRate =
    tasks.length > 0 ? Math.round((stats.completed / tasks.length) * 100) : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Loading TaskFlow AI...</span>
        </div>
      </div>
    );
  }

  // AUTHENTICATION SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8">
        {/* Top bar with Date/Time, Theme Toggle & API Server Switcher */}
        <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">
                TaskFlow AI
              </span>
              <span className="block text-xs text-slate-400">
                Internal Task & Ticket Tracking
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formattedDate}</span>
              <span className="text-slate-600">•</span>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono">{formattedTime}</span>
            </div>

            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowApiModal(true)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition cursor-pointer"
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
              <span className="font-mono text-slate-300 truncate max-w-[220px]">
                {apiUrl}
              </span>
              <span className="text-indigo-400 font-medium">Change</span>
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="max-w-md w-full mx-auto my-8 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Google Gemini AI
            </div>
            <h1 className="text-2xl font-bold text-white">
              {authMode === "login"
                ? "Sign in to your workspace"
                : "Create an employee account"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {authMode === "login"
                ? "Track tasks, manage workloads, and get AI recommendations."
                : "Register as a team member to receive and collaborate on tasks."}
            </p>
          </div>

          {health.status === "offline" && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Backend server unreachable</p>
                <p className="text-amber-300/80 mt-0.5">
                  Currently pointing to{" "}
                  <code className="font-mono">{apiUrl}</code>.{" "}
                  <button
                    type="button"
                    onClick={() => setShowApiModal(true)}
                    className="underline font-medium text-white cursor-pointer"
                  >
                    Switch API URL
                  </button>
                </p>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                  placeholder="e.g. Damilola Ogunleye"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={authMode === "register" ? 8 : 1}
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
                placeholder={
                  authMode === "register"
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition cursor-pointer"
            >
              {submittingAuth
                ? "Please wait..."
                : authMode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
            {authMode === "login" ? (
              <>
                New employee?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Sign in instead
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Role-Based Task Tracking • Admin, Manager & Employee Portal
        </div>

        {showApiModal && (
          <ApiServerModal
            currentUrl={apiUrl}
            health={health}
            onClose={() => setShowApiModal(false)}
            onSave={(newUrl) => {
              setApiBaseUrl(newUrl);
              setApiUrlState(getApiBaseUrl());
              setShowApiModal(false);
            }}
          />
        )}
      </div>
    );
  }

  // AUTHENTICATED APP SHELL
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/70 border-r border-slate-800/80 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white leading-tight">
                TaskFlow AI
              </div>
              <div className="text-[11px] text-slate-400">
                Ticket & Workload Hub
              </div>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4" />
                <span>
                  {user.role === "EMPLOYEE" ? "My Assigned Tasks" : "All Tasks"}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {stats.total}
              </span>
            </button>

            {(user.role === "ADMIN" || user.role === "MANAGER") && (
              <button
                onClick={() => setActiveTab("team")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  activeTab === "team"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>
                  {user.role === "ADMIN"
                    ? "Users & Workloads"
                    : "Team Workload"}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span>My Profile</span>
            </button>
          </nav>
        </div>

        {/* Bottom user & API status */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <button
            onClick={() => setShowApiModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 text-xs transition cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  health.status === "online"
                    ? "bg-emerald-400"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-slate-400 truncate font-mono text-[11px]">
                {apiUrl.replace(/^https?:\/\//, "")}
              </span>
            </div>
            <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>

          <div className="flex items-center justify-between px-2 py-1">
            <div className="truncate pr-2">
              <div className="text-sm font-semibold text-white truncate">
                {user.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="min-h-16 py-3 border-b border-slate-800/80 bg-slate-900/40 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white capitalize">
              {activeTab === "dashboard" && "Workspace Overview"}
              {activeTab === "tasks" &&
                (user.role === "EMPLOYEE"
                  ? "My Assigned Tasks"
                  : "Task & Ticket Management")}
              {activeTab === "team" &&
                (user.role === "ADMIN"
                  ? "User Management & Employee Workloads"
                  : "Employee Workload Monitor")}
              {activeTab === "profile" && "Account Settings"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Date & Time Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">{formattedDate}</span>
              <span className="text-slate-600">|</span>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono font-semibold text-white">
                {formattedTime}
              </span>
            </div>

            {/* Mobile Nav Tabs */}
            <div className="flex md:hidden items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-2.5 py-1 rounded-lg text-xs ${
                  activeTab === "dashboard"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-2.5 py-1 rounded-lg text-xs ${
                  activeTab === "tasks"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Tasks
              </button>
              {(user.role === "ADMIN" || user.role === "MANAGER") && (
                <button
                  onClick={() => setActiveTab("team")}
                  className={`px-2.5 py-1 rounded-lg text-xs ${
                    activeTab === "team"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400"
                  }`}
                >
                  Team
                </button>
              )}
            </div>

            {/* Light / Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                fetchTasks();
                if (user.role !== "EMPLOYEE") fetchUsers();
              }}
              title="Refresh data"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${tasksLoading ? "animate-spin" : ""}`}
              />
            </button>

            {canCreateTasks && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            )}
          </div>
        </header>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${
              toast.type === "error"
                ? "bg-rose-950 border-rose-800 text-rose-200"
                : "bg-emerald-950 border-emerald-800 text-emerald-200"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Hero Welcome Banner with Live Date/Time & Progress */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      {user.role} WORKSPACE
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      {formattedDate}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-mono text-white">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {formattedTime}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {getGreeting()}, {user.name}! 👋
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Welcome back to your TaskFlow AI command center. You
                    currently have{" "}
                    <strong className="text-white">
                      {stats.inProgress} tasks in progress
                    </strong>
                    ,{" "}
                    <strong className="text-white">
                      {stats.todo} pending in To Do
                    </strong>
                    , and{" "}
                    <strong className="text-emerald-400">
                      {stats.completed} completed
                    </strong>
                    . Use Gemini AI on any task card to summarize discussions or
                    recommend priorities.
                  </p>
                </div>

                {/* Completion Rate Card inside Hero */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 min-w-[240px]">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Completion Rate</span>
                      <span className="font-bold text-white">
                        {completionRate}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      {stats.completed} of {tasks.length} loaded tasks done
                    </div>
                  </div>
                </div>
              </div>

              {/* Polished KPI Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      Total Tasks
                    </div>
                    <div className="text-2xl font-bold text-white mt-1.5">
                      {stats.total}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Accessible in workspace
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      To Do
                    </div>
                    <div className="text-2xl font-bold text-white mt-1.5">
                      {stats.todo}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Awaiting kickoff
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-900/40 flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-blue-400">
                      In Progress
                    </div>
                    <div className="text-2xl font-bold text-blue-400 mt-1.5">
                      {stats.inProgress}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Actively being worked
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-rose-900/40 flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-rose-400">
                      Blocked
                    </div>
                    <div className="text-2xl font-bold text-rose-400 mt-1.5">
                      {stats.blocked}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Needs attention
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-900/40 col-span-2 lg:col-span-1 flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-emerald-400">
                      Completed
                    </div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1.5">
                      {stats.completed}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Delivered & resolved
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Kanban Board Preview */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Interactive Task Board
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click any task card to open discussions, activity history,
                      and Google Gemini AI insights
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-indigo-400 transition cursor-pointer"
                  >
                    Open Full Task List & Filters →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"].map(
                    (statusKey) => {
                      const columnTasks = tasks.filter((t) =>
                        statusKey === "IN_PROGRESS"
                          ? t.status === "IN_PROGRESS" ||
                            t.status === "IN_REVIEW"
                          : t.status === statusKey
                      );
                      const meta = STATUS_META[statusKey];

                      return (
                        <div
                          key={statusKey}
                          className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col min-h-[280px]"
                        >
                          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${meta.dot}`}
                              />
                              <span className="text-xs font-semibold text-slate-200">
                                {meta.label}
                              </span>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                              {columnTasks.length}
                            </span>
                          </div>

                          <div className="space-y-2.5 flex-1">
                            {columnTasks.length === 0 ? (
                              <div className="h-36 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                                No tasks in {meta.label}
                              </div>
                            ) : (
                              columnTasks.map((task) => (
                                <div
                                  key={task.id}
                                  onClick={() => setSelectedTaskId(task.id)}
                                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer group shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                        PRIORITY_META[task.priority]?.badge ||
                                        PRIORITY_META.MEDIUM.badge
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                    {task.estimatedHours && (
                                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {task.estimatedHours}h
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-medium text-white group-hover:text-indigo-400 transition line-clamp-2">
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>
                                      By {task.createdBy?.name || "Manager"}
                                    </span>
                                    <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition">
                                      Inspect →
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: TASKS LIST & FILTERS */}
          {activeTab === "tasks" && (
            <div className="space-y-5">
              {/* Filter Bar */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    placeholder="Search tasks by title or description..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value, page: 1 })
                  }
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priority: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>

                {user.role !== "EMPLOYEE" && employeesList.length > 0 && (
                  <select
                    value={filters.assignedToId}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        assignedToId: e.target.value,
                        page: 1,
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Employees</option>
                    {employeesList.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                )}

                {(filters.search ||
                  filters.status ||
                  filters.priority ||
                  filters.assignedToId) && (
                  <button
                    onClick={() =>
                      setFilters({
                        search: "",
                        status: "",
                        priority: "",
                        assignedToId: "",
                        page: 1,
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Tasks Grid */}
              {tasksLoading ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  Loading tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                  <CheckSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-medium text-slate-300">
                    No matching tasks found
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {canCreateTasks
                      ? "Create a new task using the button in the top right to start tracking work."
                      : "You don't have any assigned tasks matching these filters yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tasks.map((task) => {
                    const statusInfo =
                      STATUS_META[task.status] || STATUS_META.TODO;
                    const priorityInfo =
                      PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;

                    return (
                      <div
                        key={task.id}
                        className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.badge}`}
                            >
                              {statusInfo.label}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${priorityInfo.badge}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h3
                            onClick={() => setSelectedTaskId(task.id)}
                            className="text-base font-semibold text-white hover:text-indigo-400 cursor-pointer transition"
                          >
                            {task.title}
                          </h3>

                          <p className="text-xs text-slate-400 mt-1.5 line-clamp-3">
                            {task.description || "No description provided."}
                          </p>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-slate-800/80 space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>
                              Created by{" "}
                              <strong className="text-slate-200">
                                {task.createdBy?.name || "System"}
                              </strong>
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleQuickStatusUpdate(task.id, e.target.value)
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="TODO">Status: To Do</option>
                              <option value="IN_PROGRESS">
                                Status: In Progress
                              </option>
                              <option value="BLOCKED">Status: Blocked</option>
                              <option value="COMPLETED">
                                Status: Completed
                              </option>
                            </select>

                            <button
                              onClick={() => setSelectedTaskId(task.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Details & AI</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page - 1 })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 text-xs text-slate-300 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={filters.page >= pagination.totalPages}
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page + 1 })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 text-xs text-slate-300 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM & WORKLOADS (ADMIN / MANAGER) */}
          {activeTab === "team" &&
            (user.role === "ADMIN" || user.role === "MANAGER") && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {user.role === "ADMIN"
                          ? "Organization Directory"
                          : "Employees Directory"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {user.role === "ADMIN"
                          ? "Manage user roles, account status, and inspect employee task workloads."
                          : "Select an employee to inspect their current task workload breakdown."}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                      {users.length} users
                    </span>
                  </div>

                  {usersLoading ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                      Loading users...
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-900/40"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white">
                                {u.name}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {u.role}
                              </span>
                              {!u.isActive && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                  Deactivated
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {u.email}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {u.role === "EMPLOYEE" && (
                              <button
                                onClick={() => handleInspectWorkload(u.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition cursor-pointer"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Workload</span>
                              </button>
                            )}

                            {user.role === "ADMIN" && (
                              <>
                                <select
                                  value={u.role}
                                  onChange={(e) =>
                                    handleRoleChange(u.id, e.target.value)
                                  }
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                                >
                                  <option value="EMPLOYEE">EMPLOYEE</option>
                                  <option value="MANAGER">MANAGER</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>

                                {u.id !== user.id && (
                                  <button
                                    onClick={() => handleToggleUserActive(u)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                                      u.isActive
                                        ? "bg-rose-950/60 border-rose-800/80 text-rose-300 hover:bg-rose-900/60"
                                        : "bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60"
                                    }`}
                                  >
                                    {u.isActive ? "Deactivate" : "Reactivate"}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workload Inspector Panel */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 h-fit">
                  <div className="flex items-center gap-2.5 mb-4">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-semibold text-white">
                      Employee Workload
                    </h3>
                  </div>

                  {workloadLoading ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Calculating workload...
                    </div>
                  ) : !selectedWorkload ? (
                    <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl p-4">
                      Click <strong>Workload</strong> next to any employee to
                      view their task status distribution.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="font-semibold text-sm text-white">
                          {selectedWorkload.employee.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {selectedWorkload.employee.email}
                        </div>
                        <div className="mt-2 text-xs text-indigo-300 font-medium">
                          Total Assigned Tasks: {selectedWorkload.totalTasks}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {Object.entries(selectedWorkload.workload || {}).map(
                          ([statusKey, count]) => {
                            const total = selectedWorkload.totalTasks || 1;
                            const pct =
                              selectedWorkload.totalTasks > 0
                                ? Math.round((count / total) * 100)
                                : 0;
                            const meta =
                              STATUS_META[statusKey] || STATUS_META.TODO;

                            return (
                              <div key={statusKey} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-300">
                                    {meta.label}
                                  </span>
                                  <span className="font-semibold text-white">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                                  <div
                                    className={`h-full ${meta.dot}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* TAB 4: PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-xl bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Profile Information
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your name or email address associated with your{" "}
                  {user.role} account.
                </p>
              </div>

              {profileMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs border ${
                    profileMsg.type === "error"
                      ? "bg-rose-950/60 border-rose-800 text-rose-200"
                      : "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.role}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-sm text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Task Modal */}
      {showCreateModal && (
        <TaskFormModal
          user={user}
          employees={employeesList}
          initialTask={editingTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSaved={(msg) => {
            setShowCreateModal(false);
            setEditingTask(null);
            showToast(msg);
            fetchTasks();
          }}
        />
      )}

      {/* Task Detail + Comments + Gemini AI Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          user={user}
          employees={employeesList}
          onClose={() => setSelectedTaskId(null)}
          onEditTask={(taskObj) => {
            setSelectedTaskId(null);
            setEditingTask(taskObj);
            setShowCreateModal(true);
          }}
          onUpdated={() => {
            fetchTasks();
          }}
          showToast={showToast}
        />
      )}

      {/* API Endpoint Switcher Modal */}
      {showApiModal && (
        <ApiServerModal
          currentUrl={apiUrl}
          health={health}
          onClose={() => setShowApiModal(false)}
          onSave={(newUrl) => {
            setApiBaseUrl(newUrl);
            setApiUrlState(getApiBaseUrl());
            setShowApiModal(false);
          }}
        />
      )}
    </div>
  );
}
