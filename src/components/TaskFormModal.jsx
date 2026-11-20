import React, { useState } from "react";
import { X } from "lucide-react";
import { api } from "../services/api.js";

export default function TaskFormModal({
  user,
  employees,
  initialTask,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(initialTask);

  const [form, setForm] = useState({
    title: initialTask?.title || "",
    description: initialTask?.description || "",
    priority: initialTask?.priority || "MEDIUM",
    dueDate: initialTask?.dueDate
      ? new Date(initialTask.dueDate).toISOString().slice(0, 10)
      : "",
    estimatedHours:
      initialTask?.estimatedHours !== null &&
      initialTask?.estimatedHours !== undefined
        ? String(initialTask.estimatedHours)
        : "",
    assignedToId: initialTask?.assignedToId || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        dueDate: form.dueDate
          ? new Date(`${form.dueDate}T23:59:00.000Z`).toISOString()
          : null,
        estimatedHours:
          form.estimatedHours !== "" ? Number(form.estimatedHours) : null,
      };

      if (isEdit) {
        await api.updateTask(initialTask.id, payload);
        if (
          form.assignedToId &&
          form.assignedToId !== (initialTask.assignedToId || "")
        ) {
          await api.assignTask(initialTask.id, form.assignedToId);
        }
        onSaved("Task updated successfully");
      } else {
        if (form.assignedToId) {
          payload.assignedToId = form.assignedToId;
        }
        await api.createTask(payload);
        onSaved("Task created successfully");
      }
    } catch (err) {
      setError(err.message || "Unable to save task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {isEdit ? "Edit Task Details" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Implement OAuth2 login flow"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Outline requirements, acceptance criteria, and context..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={form.estimatedHours}
                onChange={(e) =>
                  setForm({ ...form, estimatedHours: e.target.value })
                }
                placeholder="e.g. 8"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {(user.role === "ADMIN" || user.role === "MANAGER") && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assign to Employee
                </label>
                <select
                  value={form.assignedToId}
                  onChange={(e) =>
                    setForm({ ...form, assignedToId: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white cursor-pointer"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
