import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  MessageSquare,
  Activity,
  Send,
  Trash2,
  Edit3,
  Clock,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api } from "../services/api.js";
import { STATUS_META, PRIORITY_META } from "../App.jsx";

export default function TaskDetailModal({
  taskId,
  user,
  employees,
  onClose,
  onEditTask,
  onUpdated,
  showToast,
}) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Gemini AI state
  const [aiLoading, setAiLoading] = useState(""); // "summary" | "status" | "priority" | "effort" | ""
  const [aiError, setAiError] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [aiStatusRec, setAiStatusRec] = useState(null);
  const [aiPriorityRec, setAiPriorityRec] = useState(null);
  const [aiEffortRec, setAiEffortRec] = useState(null);

  const loadTaskDetails = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const [taskRes, commentRes] = await Promise.all([
          api.getTaskById(taskId),
          api.getComments(taskId, 1, 50),
        ]);
        setTask(taskRes.data);
        setComments(commentRes.data || []);
      } catch (err) {
        showToast?.(err.message, "error");
        onClose?.();
      } finally {
        setLoading(false);
      }
    },
    [taskId]
  );

  useEffect(() => {
    loadTaskDetails(true);
  }, [loadTaskDetails]);

  const canManage =
    user.role === "ADMIN" ||
    (user.role === "MANAGER" && task?.createdById === user.id);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      showToast(`Status updated to ${newStatus}`);
      loadTaskDetails();
      onUpdated();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAssignChange = async (assignedToId) => {
    if (!assignedToId) return;
    try {
      await api.assignTask(taskId, assignedToId);
      showToast("Task assigned successfully");
      loadTaskDetails();
      onUpdated();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(taskId);
      showToast("Task deleted");
      onUpdated();
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Comments handlers
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await api.addComment(taskId, commentText.trim());
      setCommentText("");
      loadTaskDetails();
      showToast("Comment added");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveCommentEdit = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      await api.updateComment(commentId, editingCommentText.trim());
      setEditingCommentId(null);
      loadTaskDetails();
      showToast("Comment updated");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(commentId);
      loadTaskDetails();
      showToast("Comment deleted");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Gemini AI actions
  const runAiAction = async (type) => {
    setAiLoading(type);
    setAiError("");
    try {
      if (type === "summary") {
        const res = await api.aiSummarize(taskId);
        setAiSummary(res.data);
      } else if (type === "status") {
        const res = await api.aiRecommendStatus(taskId);
        setAiStatusRec(res.data);
      } else if (type === "priority") {
        const res = await api.aiRecommendPriority(taskId);
        setAiPriorityRec(res.data);
      } else if (type === "effort") {
        const res = await api.aiEstimateEffort(taskId);
        setAiEffortRec(res.data);
      }
    } catch (err) {
      setAiError(err.message || "AI request failed");
    } finally {
      setAiLoading("");
    }
  };

  const applyRecommendedPriority = async (priority) => {
    try {
      await api.updateTask(taskId, { priority });
      showToast(`Applied AI priority: ${priority}`);
      loadTaskDetails();
      onUpdated();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const applyRecommendedEffort = async (estimatedHours) => {
    try {
      await api.updateTask(taskId, { estimatedHours: Number(estimatedHours) });
      showToast(`Applied AI effort estimate: ${estimatedHours}h`);
      loadTaskDetails();
      onUpdated();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          {loading || !task ? (
            <div className="text-sm text-slate-400">Loading task...</div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_META[task.status]?.badge || STATUS_META.TODO.badge
                  }`}
              >
                {STATUS_META[task.status]?.label || task.status}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${PRIORITY_META[task.priority]?.badge ||
                  PRIORITY_META.MEDIUM.badge
                  }`}
              >
                {task.priority} PRIORITY
              </span>
              <span className="text-xs text-slate-500 font-mono">
                #{task.id.slice(0, 8)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {canManage && task && (
              <>
                <button
                  onClick={() => onEditTask(task)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900/70 border border-rose-800/70 text-xs text-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading || !task ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Loading task details...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Task Info + Gemini AI + Discussion */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">{task.title}</h2>
                <p className="text-sm text-slate-300 mt-2 whitespace-pre-line leading-relaxed">
                  {task.description || "No description provided for this task."}
                </p>
              </div>

              {/* GEMINI AI ASSISTANT PANEL */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-950 border border-indigo-500/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Google Gemini AI Assistant
                    </h3>
                  </div>
                  <span className="text-[11px] text-indigo-300/80">
                    Recommendations require your confirmation before applying
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => runAiAction("summary")}
                    disabled={Boolean(aiLoading)}
                    className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading === "summary"
                      ? "Summarizing..."
                      : "✨ Summarize Discussion"}
                  </button>
                  <button
                    onClick={() => runAiAction("status")}
                    disabled={Boolean(aiLoading)}
                    className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading === "status"
                      ? "Analyzing..."
                      : "🎯 Recommend Status"}
                  </button>
                  <button
                    onClick={() => runAiAction("priority")}
                    disabled={Boolean(aiLoading)}
                    className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading === "priority"
                      ? "Evaluating..."
                      : "⚡ Recommend Priority"}
                  </button>
                  <button
                    onClick={() => runAiAction("effort")}
                    disabled={Boolean(aiLoading)}
                    className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading === "effort"
                      ? "Estimating..."
                      : "⏱️ Estimate Effort"}
                  </button>
                </div>

                {aiError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                    {aiError}
                  </div>
                )}

                {/* AI Summary Result */}
                {aiSummary && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                    <div className="font-semibold text-indigo-300">
                      AI Discussion Summary
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {aiSummary.summary}
                    </p>
                    {aiSummary.keyPoints?.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-300">
                          Key Points:
                        </span>
                        <ul className="list-disc list-inside text-slate-300 mt-1 space-y-0.5">
                          {aiSummary.keyPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSummary.blockers?.length > 0 && (
                      <div>
                        <span className="font-semibold text-rose-300">
                          Identified Blockers:
                        </span>
                        <ul className="list-disc list-inside text-rose-200 mt-1 space-y-0.5">
                          {aiSummary.blockers.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSummary.nextActions?.length > 0 && (
                      <div>
                        <span className="font-semibold text-emerald-300">
                          Suggested Next Actions:
                        </span>
                        <ul className="list-disc list-inside text-emerald-200 mt-1 space-y-0.5">
                          {aiSummary.nextActions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Status Recommendation */}
                {aiStatusRec && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-300">
                          Recommended Status:
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-white font-semibold">
                          {aiStatusRec.recommendedStatus}
                        </span>
                        <span className="text-slate-400">
                          (Confidence: {aiStatusRec.confidence})
                        </span>
                      </div>
                      <p className="text-slate-300">{aiStatusRec.reason}</p>
                    </div>
                    {aiStatusRec.recommendedStatus !== task.status &&
                      ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"].includes(
                        aiStatusRec.recommendedStatus
                      ) && (
                        <button
                          onClick={() =>
                            handleStatusChange(aiStatusRec.recommendedStatus)
                          }
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                        >
                          Apply Status
                        </button>
                      )}
                  </div>
                )}

                {/* AI Priority Recommendation */}
                {aiPriorityRec && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-300">
                          Recommended Priority:
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-white font-semibold">
                          {aiPriorityRec.recommendedPriority}
                        </span>
                        <span className="text-slate-400">
                          (Confidence: {aiPriorityRec.confidence})
                        </span>
                      </div>
                      <p className="text-slate-300">{aiPriorityRec.reason}</p>
                    </div>
                    {canManage &&
                      aiPriorityRec.recommendedPriority !== task.priority && (
                        <button
                          onClick={() =>
                            applyRecommendedPriority(
                              aiPriorityRec.recommendedPriority
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                        >
                          Apply Priority
                        </button>
                      )}
                  </div>
                )}

                {/* AI Effort Estimate */}
                {aiEffortRec && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-300">
                          Estimated Effort:
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-white font-semibold">
                          {aiEffortRec.estimatedHours} hours
                        </span>
                        <span className="text-slate-400">
                          (Confidence: {aiEffortRec.confidence})
                        </span>
                      </div>
                      <p className="text-slate-300">{aiEffortRec.reason}</p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() =>
                          applyRecommendedEffort(aiEffortRec.estimatedHours)
                        }
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                      >
                        Apply Estimate
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* DISCUSSION COMMENTS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Discussion & Collaboration ({comments.length})
                  </h3>
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a progress update, question, or blocker..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>

                <div className="space-y-2.5">
                  {comments.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
                      No comments yet. Start the discussion above!
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isOwner = c.authorId === user.id;
                      const canDelete = isOwner || user.role === "ADMIN";

                      return (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                {c.author?.name || "Team Member"}
                              </span>
                              {c.author?.role && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {c.author.role}
                                </span>
                              )}
                              <span className="text-slate-500 text-[11px]">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isOwner && (
                                <button
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditingCommentText(c.content);
                                  }}
                                  className="text-slate-400 hover:text-indigo-400 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {editingCommentId === c.id ? (
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                value={editingCommentText}
                                onChange={(e) =>
                                  setEditingCommentText(e.target.value)
                                }
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                              />
                              <button
                                onClick={() => handleSaveCommentEdit(c.id)}
                                className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line">
                              {c.content}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Controls, Metadata & Activity Log */}
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Update Status
                  </label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TODO">To Do (TODO)</option>
                    <option value="IN_PROGRESS">
                      In Progress (IN_PROGRESS)
                    </option>
                    <option value="BLOCKED">Blocked (BLOCKED)</option>
                    <option value="COMPLETED">Completed (COMPLETED)</option>
                  </select>
                </div>

                {canManage && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Assigned Employee
                    </label>
                    <select
                      value={task.assignedToId || ""}
                      onChange={(e) => handleAssignChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="" disabled>
                        Select employee to assign...
                      </option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned To:</span>
                    <span className="text-slate-200 font-medium">
                      {task.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created By:</span>
                    <span className="text-slate-200 font-medium">
                      {task.createdBy?.name || "Admin"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Effort:</span>
                    <span className="text-slate-200 font-medium">
                      {task.estimatedHours
                        ? `${task.estimatedHours} hours`
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Due Date:</span>
                    <span className="text-slate-200 font-medium">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "No deadline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Activity Log
                  </h4>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {!task.activities || task.activities.length === 0 ? (
                    <div className="text-xs text-slate-500">
                      No recorded activity yet.
                    </div>
                  ) : (
                    task.activities.map((act) => (
                      <div
                        key={act.id}
                        className="text-xs border-l-2 border-indigo-500/40 pl-3 py-0.5"
                      >
                        <div className="text-slate-200">
                          {act.details || act.action}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(act.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
