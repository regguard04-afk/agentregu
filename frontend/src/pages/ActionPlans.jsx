// ActionPlans.jsx — Kanban board for compliance tasks
// =====================================================
import React, { useContext, useMemo } from "react";
import { AppContext } from "../App.jsx";
import {
  Tag,
  Users,
  Calendar,
  AlertTriangle,
  Plus,
} from "lucide-react";

const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Under Review" },
  { id: "completed", title: "Completed" },
];

const TEAM_OPTIONS = ["Engineering", "Legal", "Compliance", "Finance"];

export default function ActionPlans() {
  const { filteredUpdates, loading } = useContext(AppContext);

  // Extract all action tasks from updates and assign to columns
  const tasks = useMemo(() => {
    const allTasks = [];
    filteredUpdates.forEach((update) => {
      if (update.recommended_actions && update.recommended_actions.length > 0) {
        update.recommended_actions.forEach((action, idx) => {
          // Assign column based on priority and position
          let column;
          if (update.status === "actioned" || update.status === "closed") {
            column = "completed";
          } else if (update.status === "in_review") {
            column = "review";
          } else if (idx % 3 === 0) {
            column = "todo";
          } else {
            column = "in_progress";
          }

          // Determine team from suggested_owner
          const owner = (action.suggested_owner || "").toLowerCase();
          let team = "Engineering";
          if (owner.includes("legal") || owner.includes("law")) team = "Legal";
          else if (owner.includes("compliance") || owner.includes("audit")) team = "Compliance";
          else if (owner.includes("finance") || owner.includes("treasury")) team = "Finance";

          // Generate due date
          const daysToAdd = action.suggested_deadline_days || 30;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + daysToAdd);

          const isOverdue = daysToAdd < 0;
          const progress = column === "completed" ? 100 : column === "review" ? 80 : column === "in_progress" ? Math.floor(Math.random() * 40 + 30) : 10;

          allTasks.push({
            id: `${update.id}-${idx}`,
            regulation: update.title,
            title: action.task_description || `Task ${idx + 1}`,
            team,
            priority: action.priority || "P2",
            dueDate,
            isOverdue,
            progress,
            column,
          });
        });
      }
    });
    return allTasks;
  }, [filteredUpdates]);

  // Group by column
  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.column === col.id),
  }));

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton skeleton-line skeleton-line--medium" style={{ marginBottom: 24 }} />
        <div className="kanban-board">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="skeleton skeleton-line skeleton-line--short" style={{ marginBottom: 16 }} />
              {[1, 2].map((j) => (
                <div key={j} className="skeleton-card">
                  <div className="skeleton skeleton-line skeleton-line--title" />
                  <div className="skeleton skeleton-line skeleton-line--medium" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function formatShortDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="animate-fade-in">
      <p className="page-subtitle">
        Manage compliance tasks and track progress across your team.
      </p>

      <div className="kanban-board">
        {columns.map((col) => (
          <div key={col.id} className="kanban-column">
            <div className="kanban-column__header">
              <span className="kanban-column__title">{col.title}</span>
              <span className="kanban-column__count">{col.tasks.length}</span>
            </div>

            {col.tasks.length === 0 ? (
              <div style={{
                padding: "var(--space-xl)",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
              }}>
                No tasks
              </div>
            ) : (
              col.tasks.map((task) => {
                const prioClass = (task.priority || "P2").toLowerCase();
                const teamClass = task.team.toLowerCase();

                return (
                  <div key={task.id} className="kanban-card">
                    <div className="kanban-card__regulation">
                      <Tag size={12} />
                      {task.regulation.length > 30
                        ? task.regulation.slice(0, 30) + "…"
                        : task.regulation}
                    </div>

                    <div className="kanban-card__title">{task.title}</div>

                    <div className="kanban-card__tags">
                      <span className={`kanban-card__team-tag kanban-card__team-tag--${teamClass}`}>
                        <Users size={10} />
                        {task.team}
                      </span>
                      <span className={`priority-tag priority-tag--${prioClass}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className={`kanban-card__due ${task.isOverdue ? "kanban-card__due--overdue" : ""}`}>
                      <Calendar size={12} />
                      Due: {formatShortDate(task.dueDate)}
                      {task.isOverdue && <AlertTriangle size={12} />}
                    </div>

                    <div className="kanban-card__progress">
                      <div
                        className="kanban-card__progress-fill"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      <button className="kanban-add-btn">
        <Plus size={16} />
        Add Task
      </button>
    </div>
  );
}
