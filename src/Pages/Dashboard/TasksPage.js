import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Button } from 'react-bootstrap';
import {
  FiPlus,
  FiFlag,
  FiMoreHorizontal,
  FiClock,
  FiMessageSquare,
  FiCheck,
  FiTrash2,
  FiEdit,
  FiArrowRight,
} from 'react-icons/fi';
import {
  fetchTasks,
  createNewTask,
  updateTaskStatusAsync,
  deleteTaskAsync,
  moveTask,
  setFilter,
  selectAllTasks,
  selectTasksLoading,
  selectTasksFilter,
  STAGES,
} from '../../redux/slices/tasksSlice';
import { selectAuthUser, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import { selectTheme } from '../../redux/slices/themeSlice';
import { getAllProjectsApi, getCompanyUsersApi, updateTaskApi } from '../../Api/Project/project';
import FeedbackAlert from '../../Components/Common/FeedbackAlert';
import LoadingSpinner from '../../Components/Common/LoadingSpinner';
import ConfirmModal from '../../Components/Common/ConfirmModal';
import './tasks.css';

// Avatar color map based on initial characters
const getAvatarClass = (initials = '') => {
  const code = initials.toUpperCase();
  if (code.includes('H') || code.includes('K') || code.includes('S')) return 'avatar-lavender';
  if (code.includes('P') || code.includes('R') || code.includes('D')) return 'avatar-pink';
  if (code.includes('M') || code.includes('T') || code.includes('C')) return 'avatar-teal';
  if (code.includes('N') || code.includes('B') || code.includes('G')) return 'avatar-green';
  if (code.includes('L') || code.includes('O') || code.includes('A')) return 'avatar-peach';
  return 'avatar-tan';
};

const getInitials = (user) => {
  if (!user) return 'TM';
  if (typeof user === 'string') {
    const parts = user.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return user.slice(0, 2).toUpperCase();
  }
  const f = user.firstName || user.name || '';
  const l = user.lastName || '';
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  return 'TM';
};

const formatDueText = (dueDate, stage) => {
  if (stage === 'Done') {
    if (!dueDate) return 'Completed';
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) return 'Completed';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (!dueDate) return 'No due date';
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return 'No due date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(due);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 30) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── TASK MENU POPOVER ──
function TaskMenu({ task, isOpen, onClose, onMove, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="tasks-menu-popover" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <div className="small fw-semibold text-muted px-2 py-1" style={{ fontSize: '11px' }}>
        Move to:
      </div>
      {STAGES.map((s) => (
        <button
          key={s}
          type="button"
          className="tasks-menu-item"
          disabled={task.stage === s}
          onClick={() => {
            onMove(task.id || task._id, s);
            onClose();
          }}
        >
          <FiArrowRight size={12} />
          <span>{s}</span>
          {task.stage === s && <FiCheck size={12} className="ms-auto text-success" />}
        </button>
      ))}
      <div className="tasks-menu-divider" />
      <button
        type="button"
        className="tasks-menu-item danger"
        onClick={() => {
          onDelete(task.id || task._id);
          onClose();
        }}
      >
        <FiTrash2 size={12} />
        <span>Delete Task</span>
      </button>
    </div>
  );
}

// ── TASK CARD COMPONENT ──
function TaskCard({
  task,
  isGhost = false,
  onPointerDown,
  onMoveStage,
  onDeleteTask,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef(null);

  const isDone = task.stage === 'Done';
  const categoryClass = `tag-${(task.category || 'other').toLowerCase()}`;
  const priorityClass = `prio-${(task.priority || 'medium').toLowerCase()}`;

  // Assignees initials
  const assigneesList = useMemo(() => {
    if (!task.assignees || task.assignees.length === 0) {
      return ['TM'];
    }
    return task.assignees.slice(0, 2).map((a) => getInitials(a));
  }, [task.assignees]);

  return (
    <div
      ref={cardRef}
      data-task-id={task.id || task._id}
      data-stage={task.stage}
      className={`tasks-card ${isDone ? 'is-done' : ''} ${isGhost ? 'is-ghost' : ''}`}
      onPointerDown={(e) => {
        // Prevent drag initiation if clicking the menu button
        if (e.target.closest('.tasks-menu-btn') || e.target.closest('.tasks-menu-popover')) {
          return;
        }
        onPointerDown && onPointerDown(e, task);
      }}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          setMenuOpen((prev) => !prev);
        }
      }}
      aria-label={`Task: ${task.title}, Stage: ${task.stage}, Priority: ${task.priority}`}
    >
      {/* Top Row: Category + Priority Flag + Menu */}
      <div className="tasks-card-top">
        <div className="tasks-card-meta-left">
          <span className={`tasks-tag-pill ${categoryClass}`}>
            {task.category || 'Frontend'}
          </span>
          <span className={`tasks-prio-wrap ${priorityClass}`}>
            <FiFlag size={12} />
            <span>{task.priority || 'Medium'}</span>
          </span>
        </div>

        <div className="position-relative">
          <button
            type="button"
            className="tasks-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            title="Task options"
            aria-label="Task options"
          >
            <FiMoreHorizontal size={16} />
          </button>

          <TaskMenu
            task={task}
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onMove={onMoveStage}
            onDelete={onDeleteTask}
          />
        </div>
      </div>

      {/* Title */}
      <h4 className="tasks-card-title">{task.title || task.taskName}</h4>

      {/* Optional Progress Bar */}
      {(task.hasProgressBar || isDone || (task.progress > 0 && task.stage !== 'To do')) && (
        <div className="tasks-progress-track">
          <div
            className="tasks-progress-fill"
            style={{ width: `${isDone ? 100 : task.progress || 0}%` }}
          />
        </div>
      )}

      {/* Footer Row: Due Date + Comments + Avatars */}
      <div className="tasks-card-footer">
        <div className="tasks-footer-left">
          <span className="tasks-footer-item">
            <FiClock size={12} />
            <span>{formatDueText(task.dueDate || task.completedAt, task.stage)}</span>
          </span>
          <span className="tasks-footer-item">
            <FiMessageSquare size={12} />
            <span>{task.commentsCount || 0}</span>
          </span>
        </div>

        <div className="tasks-avatars-group">
          {assigneesList.map((initials, idx) => (
            <div
              key={initials + idx}
              className={`tasks-avatar-circle ${getAvatarClass(initials)}`}
              title={`Assigned: ${initials}`}
            >
              {initials}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FILTER BAR COMPONENT ──
function FilterBar({ activeFilter, onSelectFilter, totalCount }) {
  const containerRef = useRef(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 4, width: 48 });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'my-tasks', label: 'My tasks' },
    { id: 'high-priority', label: 'High priority' },
    { id: 'due-this-week', label: 'Due this week' },
  ];

  const updateSlider = useCallback(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector(`.tasks-filter-chip[data-filter="${activeFilter}"]`);
    if (activeBtn) {
      setSliderStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeFilter]);

  useEffect(() => {
    updateSlider();
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [updateSlider]);

  return (
    <div className="tasks-filter-row">
      <div className="tasks-filter-pills" ref={containerRef}>
        <div
          className="tasks-filter-slider"
          style={{ left: `${sliderStyle.left}px`, width: `${sliderStyle.width}px` }}
        />
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            data-filter={f.id}
            className={`tasks-filter-chip ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => onSelectFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="tasks-count-info">
        <span className="tasks-count-bold">{totalCount}</span> tasks shown
      </div>
    </div>
  );
}

// ── NEW TASK MODAL ──
function NewTaskModal({ show, onHide, projects, users, onCreate }) {
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('To do');
  const [category, setCategory] = useState('Frontend');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUserObj = users.find((u) => u._id === assignedTo);
    onCreate({
      title: title.trim(),
      stage,
      category,
      priority,
      dueDate: dueDate || null,
      projectId: projectId || (projects.length > 0 ? projects[0]._id : null),
      assignedTo: assignedTo || null,
      assignedUsers: assignedUserObj ? [assignedUserObj] : [],
      description,
      progress: stage === 'Done' ? 100 : (stage === 'In progress' ? 50 : (stage === 'In review' ? 80 : 0)),
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered className="tasks-modal">
      <Form onSubmit={handleSubmit}>
        <div className="tasks-modal-header d-flex align-items-center justify-content-between">
          <h5 className="tasks-modal-title">Create New Task</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onHide}
            aria-label="Close"
          />
        </div>

        <Modal.Body className="p-3">
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Task Title <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              required
              placeholder="e.g., Cut LCP under 2 seconds"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </Form.Group>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Stage</Form.Label>
                <Form.Select value={stage} onChange={(e) => setStage(e.target.value)}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Category</Form.Label>
                <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="QA">QA</option>
                  <option value="General">General</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Priority</Form.Label>
                <Form.Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Due Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Form.Group>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Project</Form.Label>
                <Form.Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Select Project (Optional)</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.projectName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group>
                <Form.Label className="small fw-semibold">Assignee</Form.Label>
                <Form.Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.firstName || ''} {u.lastName || ''} ({u.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-2">
            <Form.Label className="small fw-semibold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Task details and instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="p-3 border-top">
          <Button variant="outline-secondary" onClick={onHide} className="rounded-pill px-3 py-1 fw-semibold">
            Cancel
          </Button>
          <Button type="submit" className="tasks-new-btn py-1 px-4" style={{ height: '38px' }}>
            <FiPlus size={14} /> Create Task
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ── MAIN TASKS PAGE ──
export default function TasksPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const tasks = useSelector(selectAllTasks);
  const loading = useSelector(selectTasksLoading);
  const filter = useSelector(selectTasksFilter);

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showAlert = useCallback((variant, message) => {
    setAlert({ variant, message });
    setTimeout(() => setAlert(null), 4000);
  }, []);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTaskState] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [dropSlotIndex, setDropSlotIndex] = useState(null);

  const dragRef = useRef({
    active: false,
    taskId: null,
    taskObj: null,
    sourceStage: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    cardRect: null,
    floatingEl: null,
    targetStage: null,
    targetIndex: null,
  });

  const columnsRef = useRef({});

  // Load Real Tasks, Projects and Users on Mount
  useEffect(() => {
    dispatch(fetchTasks());

    getAllProjectsApi()
      .then((res) => {
        if (res?.ok && res.data?.success) setProjects(res.data.data || []);
      })
      .catch((e) => console.error(e));

    getCompanyUsersApi()
      .then((res) => {
        if (res?.ok && res.data?.success) setUsers(res.data.data || []);
      })
      .catch((e) => console.error(e));
  }, [dispatch]);

  // Filtered Tasks according to active filter chip
  const filteredTasks = useMemo(() => {
    const currentUserId = user?._id || user?.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    return tasks.filter((t) => {
      if (filter === 'my-tasks') {
        const assignees = Array.isArray(t.assignees) ? t.assignees : [t.assignees];
        return assignees.some((a) => {
          const aid = typeof a === 'object' ? a?._id || a?.id : a;
          return aid && aid.toString() === currentUserId?.toString();
        });
      }
      if (filter === 'high-priority') {
        const p = (t.priority || '').toLowerCase();
        return p === 'high' || p === 'critical';
      }
      if (filter === 'due-this-week') {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && d >= today && d <= endOfWeek;
      }
      return true;
    });
  }, [tasks, filter, user]);

  // Tasks grouped by Stage
  const stageTasksMap = useMemo(() => {
    const map = {
      'To do': [],
      'In progress': [],
      'In review': [],
      'Done': [],
    };
    filteredTasks.forEach((t) => {
      const st = t.stage || 'To do';
      if (map[st]) map[st].push(t);
      else map['To do'].push(t);
    });
    return map;
  }, [filteredTasks]);

  // Move Task Handler
  const handleMoveStage = useCallback((taskId, toStage) => {
    dispatch(moveTask({ id: taskId, toStage, toIndex: 0 }));
    dispatch(updateTaskStatusAsync({ id: taskId, toStage }))
      .unwrap()
      .then(() => showAlert('success', `Task moved to ${toStage}`))
      .catch(() => showAlert('warning', `Moved locally to ${toStage}`));
  }, [dispatch, showAlert]);

  // Request Delete Task Confirmation
  const handleRequestDelete = useCallback((taskId) => {
    const target = tasks.find((t) => (t.id || t._id) === taskId);
    if (target) {
      setTaskToDelete(target);
    } else {
      dispatch(deleteTaskAsync(taskId));
    }
  }, [tasks, dispatch]);

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      const tid = taskToDelete.id || taskToDelete._id;
      await dispatch(deleteTaskAsync(tid)).unwrap();
      showAlert('success', 'Task deleted successfully');
    } catch (err) {
      showAlert('danger', err || 'Failed to delete task');
    } finally {
      setDeleting(false);
      setTaskToDelete(null);
    }
  };

  // ── CUSTOM POINTER EVENTS DRAG-AND-DROP ENGINE WITH FLIP REFLOW ──
  const handlePointerDown = (e, task) => {
    if (e.button !== 0) return; // Primary left button only
    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();

    dragRef.current = {
      active: false,
      taskId: task.id || task._id,
      taskObj: task,
      sourceStage: task.stage,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      cardRect: rect,
      floatingEl: null,
      targetStage: task.stage,
      targetIndex: null,
    };

    const handlePointerMove = (moveEvt) => {
      const d = dragRef.current;
      if (!d.taskId) return;

      const deltaX = moveEvt.clientX - d.startX;
      const deltaY = moveEvt.clientY - d.startY;
      const distance = Math.hypot(deltaX, deltaY);

      // Threshold: start drag after moving > 4px
      if (!d.active && distance > 4) {
        d.active = true;
        setIsDragging(true);
        setDraggedTaskState(d.taskId);

        // Create floating clone element
        const clone = cardEl.cloneNode(true);
        clone.classList.add('tasks-card-floating');
        clone.style.width = `${d.cardRect.width}px`;
        clone.style.left = `${moveEvt.clientX - d.offsetX}px`;
        clone.style.top = `${moveEvt.clientY - d.offsetY}px`;
        document.body.appendChild(clone);
        d.floatingEl = clone;

        try {
          cardEl.setPointerCapture(moveEvt.pointerId);
        } catch {
          // ignore if setPointerCapture is unsupported
        }
      }

      if (d.active && d.floatingEl) {
        d.floatingEl.style.left = `${moveEvt.clientX - d.offsetX}px`;
        d.floatingEl.style.top = `${moveEvt.clientY - d.offsetY}px`;

        // Check which column the cursor is currently over
        let foundStage = null;
        let foundIndex = 0;

        for (const stage of STAGES) {
          const colEl = columnsRef.current[stage];
          if (!colEl) continue;
          const colRect = colEl.getBoundingClientRect();

          if (
            moveEvt.clientX >= colRect.left &&
            moveEvt.clientX <= colRect.right &&
            moveEvt.clientY >= colRect.top - 40 &&
            moveEvt.clientY <= colRect.bottom + 40
          ) {
            foundStage = stage;

            // Calculate drop insertion index based on card midpoints
            const cardsInCol = Array.from(colEl.querySelectorAll('.tasks-card:not(.is-ghost)'));
            foundIndex = cardsInCol.length;

            for (let i = 0; i < cardsInCol.length; i++) {
              const cRect = cardsInCol[i].getBoundingClientRect();
              const midY = cRect.top + cRect.height / 2;
              if (moveEvt.clientY < midY) {
                foundIndex = i;
                break;
              }
            }
            break;
          }
        }

        d.targetStage = foundStage;
        d.targetIndex = foundIndex;
        setDragOverStage(foundStage);
        setDropSlotIndex(foundIndex);
      }
    };

    const handlePointerUp = (upEvt) => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);

      const d = dragRef.current;
      if (d.active && d.floatingEl) {
        if (d.targetStage) {
          // Perform drop move
          dispatch(
            moveTask({
              id: d.taskId,
              toStage: d.targetStage,
              toIndex: d.targetIndex,
            })
          );
          dispatch(
            updateTaskStatusAsync({
              id: d.taskId,
              toStage: d.targetStage,
            })
          );
        }

        // Clean up floating clone with short settle transition
        d.floatingEl.classList.add('tasks-card-settle');
        setTimeout(() => {
          if (d.floatingEl && d.floatingEl.parentNode) {
            d.floatingEl.parentNode.removeChild(d.floatingEl);
          }
        }, 220);
      }

      setIsDragging(false);
      setDraggedTaskState(null);
      setDragOverStage(null);
      setDropSlotIndex(null);
      dragRef.current = { active: false, taskId: null };
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  };

  const getColDotClass = (stage) => {
    switch (stage) {
      case 'To do': return 'todo';
      case 'In progress': return 'progress';
      case 'In review': return 'review';
      case 'Done': return 'done';
      default: return 'todo';
    }
  };

  return (
    <div className="tasks-page">
      {/* ── FEEDBACK ALERT (HRMS Component) ── */}
      {alert && (
        <div className="mb-3">
          <FeedbackAlert
            variant={alert.variant}
            message={alert.message}
            dismissible
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* ── HEADER ROW ── */}
      <div className="tasks-header-row">
        <div className="tasks-title-wrap">
          <h1 className="tasks-title">Tasks</h1>
          <p className="tasks-subtitle">
            Drag a card to another stage, or use its menu to move it.
          </p>
        </div>

        <button
          type="button"
          className="tasks-new-btn"
          onClick={() => setShowNewModal(true)}
        >
          <FiPlus size={18} />
          <span>+ New Task</span>
        </button>
      </div>

      {/* ── FILTER ROW ── */}
      <FilterBar
        activeFilter={filter}
        onSelectFilter={(f) => dispatch(setFilter(f))}
        totalCount={filteredTasks.length}
      />

      {/* ── LOADING SPINNER (HRMS Component) ── */}
      {loading && tasks.length === 0 ? (
        <div className="py-5 text-center">
          <LoadingSpinner variant="page" message="Loading your tasks..." />
        </div>
      ) : (
        /* ── 4 EQUAL-WIDTH COLUMNS KANBAN BOARD ── */
        <div className="tasks-board">
          {STAGES.map((stage) => {
            const colTasks = stageTasksMap[stage] || [];
            const isOver = isDragging && dragOverStage === stage;
            const isSource = isDragging && dragRef.current.sourceStage === stage;

            // Live count: +1 when hovered, -1 when dragged out
            let liveCount = colTasks.length;
            if (isDragging) {
              if (isOver && !isSource) liveCount += 1;
              if (isSource && !isOver) liveCount = Math.max(0, liveCount - 1);
            }

            return (
              <div
                key={stage}
                ref={(el) => (columnsRef.current[stage] = el)}
                className={`tasks-column ${isOver ? 'is-drag-over' : ''}`}
              >
                {/* Column Header */}
                <div className="tasks-col-header">
                  <div className="tasks-col-title-wrap">
                    <span className={`tasks-col-dot ${getColDotClass(stage)}`} />
                    <h3 className="tasks-col-name">{stage}</h3>
                  </div>
                  <span className={`tasks-col-count-badge ${isOver ? 'count-boost' : ''}`}>
                    {liveCount}
                  </span>
                </div>

                {/* Cards List in Column */}
                <div className="tasks-cards-list">
                  {colTasks.length > 0 ? (
                    colTasks.map((t, idx) => {
                      const isGhost = isDragging && draggedTask === (t.id || t._id);
                      const showDropSlotAbove = isOver && dropSlotIndex === idx && !isGhost;

                      return (
                        <React.Fragment key={t.id || t._id || idx}>
                          {showDropSlotAbove && <div className="tasks-drop-slot" />}
                          <TaskCard
                            task={t}
                            isGhost={isGhost}
                            onPointerDown={handlePointerDown}
                            onMoveStage={handleMoveStage}
                            onDeleteTask={handleRequestDelete}
                          />
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="tasks-empty-col">
                      <span>No tasks in {stage.toLowerCase()}</span>
                      <button
                        type="button"
                        className="tasks-empty-col-btn"
                        onClick={() => setShowNewModal(true)}
                      >
                        + Add task
                      </button>
                    </div>
                  )}

                  {/* Drop slot at the bottom when dragged past last item */}
                  {isOver && dropSlotIndex >= colTasks.length && (
                    <div className="tasks-drop-slot" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── NEW TASK MODAL ── */}
      <NewTaskModal
        show={showNewModal}
        onHide={() => setShowNewModal(false)}
        projects={projects}
        users={users}
        onCreate={(payload) => {
          dispatch(createNewTask(payload))
            .unwrap()
            .then(() => showAlert('success', 'Task created successfully!'))
            .catch((err) => showAlert('danger', err || 'Failed to create task'));
        }}
      />

      {/* ── CONFIRM DELETE MODAL (HRMS Component) ── */}
      <ConfirmModal
        show={!!taskToDelete}
        title={
          <>
            <FiTrash2 /> Delete Task
          </>
        }
        message={
          <>
            Are you sure you want to delete task{' '}
            <strong>{taskToDelete?.title || taskToDelete?.taskName || 'this task'}</strong>?
            This will permanently remove the task from the system.
          </>
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setTaskToDelete(null)}
        loading={deleting}
        confirmLabel="Delete Task"
        confirmVariant="danger"
      />
    </div>
  );
}
