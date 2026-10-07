import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getMyTasksApi,
  getTasksByProjectApi,
  getAllProjectsApi,
  createTaskApi,
  updateTaskApi,
  updateTaskStatusApi,
  deleteTaskApi,
} from '../../Api/Project/project';

// Stage normalizer for Kanban board
export const STAGES = ['To do', 'In progress', 'In review', 'Done'];

export const normalizeStage = (status) => {
  if (!status) return 'To do';
  const s = String(status).trim().toLowerCase();
  if (s === 'done' || s === 'completed' || s === 'closed' || s === 'finished') return 'Done';
  if (s === 'in review' || s === 'in_review' || s === 'testing' || s === 'review' || s === 'qa') return 'In review';
  if (s === 'in progress' || s === 'in_progress' || s === 'active' || s === 'running' || s === 'ongoing') return 'In progress';
  return 'To do';
};

export const normalizeCategory = (cat, taskName = '') => {
  if (cat) {
    const c = String(cat).trim().toLowerCase();
    if (c.includes('front') || c.includes('ui') || c.includes('react') || c.includes('css')) return 'Frontend';
    if (c.includes('back') || c.includes('api') || c.includes('server') || c.includes('node') || c.includes('db')) return 'Backend';
    if (c.includes('design') || c.includes('ux') || c.includes('figma')) return 'Design';
    if (c.includes('market') || c.includes('seo') || c.includes('launch') || c.includes('email')) return 'Marketing';
    if (c.includes('qa') || c.includes('test') || c.includes('bug')) return 'QA';
  }
  const t = String(taskName).toLowerCase();
  if (t.includes('ui') || t.includes('filter') || t.includes('css') || t.includes('frontend') || t.includes('page') || t.includes('widget') || t.includes('lcp')) return 'Frontend';
  if (t.includes('api') || t.includes('passkey') || t.includes('endpoint') || t.includes('backend') || t.includes('server') || t.includes('monorepo')) return 'Backend';
  if (t.includes('design') || t.includes('screen') || t.includes('brand') || t.includes('illustration')) return 'Design';
  if (t.includes('launch') || t.includes('marketing') || t.includes('onboarding') || t.includes('kickoff')) return 'Marketing';
  if (t.includes('regression') || t.includes('test') || t.includes('qa') || t.includes('pass')) return 'QA';
  return 'Frontend';
};

// Async Thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch user tasks + available projects' tasks to populate the live board
      let allTasks = [];
      try {
        const myRes = await getMyTasksApi();
        if (myRes?.ok && myRes.data?.success && Array.isArray(myRes.data.data)) {
          allTasks.push(...myRes.data.data);
        }
      } catch (err) {
        console.warn('Failed to load my tasks:', err);
      }

      try {
        const projRes = await getAllProjectsApi();
        if (projRes?.ok && projRes.data?.success && Array.isArray(projRes.data.data)) {
          const projects = projRes.data.data.slice(0, 10);
          const taskResults = await Promise.allSettled(
            projects.map((p) => getTasksByProjectApi(p._id))
          );
          taskResults.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value?.ok && r.value.data?.success) {
              const list = Array.isArray(r.value.data.data) ? r.value.data.data : [];
              list.forEach((t) => {
                if (!allTasks.some((existing) => existing._id === t._id)) {
                  allTasks.push({ ...t, project: projects[idx] });
                }
              });
            }
          });
        }
      } catch (err) {
        console.warn('Failed to load project tasks:', err);
      }

      // Map real data into Kanban fields
      return allTasks.map((t) => {
        const stage = normalizeStage(t.status || t.stage);
        const category = normalizeCategory(t.category || t.department?.name, t.taskName || t.title);
        const priority = t.priority || 'Medium';
        const isDone = stage === 'Done';

        return {
          id: t._id || t.id,
          _id: t._id || t.id,
          title: t.taskName || t.title || 'Untitled Task',
          taskName: t.taskName || t.title || 'Untitled Task',
          stage,
          category,
          priority: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
          progress: isDone ? 100 : typeof t.progress === 'number' ? t.progress : (stage === 'In progress' ? 50 : (stage === 'In review' ? 85 : 0)),
          hasProgressBar: stage !== 'To do' || t.progress > 0,
          dueDate: t.dueDate || t.endDate || null,
          completedAt: isDone ? (t.completedAt || t.updatedAt || new Date().toISOString()) : null,
          commentsCount: Array.isArray(t.comments) ? t.comments.length : (t.commentsCount || 0),
          assignees: Array.isArray(t.assignedTo)
            ? t.assignedTo
            : t.assignedTo
            ? [t.assignedTo]
            : [],
          project: t.project || t.projectId || null,
          description: t.description || '',
          order: t.order || 0,
        };
      });
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

export const createNewTask = createAsyncThunk(
  'tasks/createNewTask',
  async (payload, { rejectWithValue }) => {
    try {
      const apiPayload = {
        taskName: payload.title || payload.taskName,
        projectId: payload.projectId,
        sprintId: payload.sprintId || null,
        priority: payload.priority || 'Medium',
        dueDate: payload.dueDate || null,
        description: payload.description || '',
        assignedTo: payload.assignedTo || null,
        status: payload.stage === 'Done' ? 'Completed' : (payload.stage === 'In progress' ? 'In Progress' : (payload.stage === 'In review' ? 'Testing' : 'Pending')),
      };

      const res = await createTaskApi(apiPayload);
      if (res?.ok && res.data?.success) {
        const t = res.data.data;
        const stage = payload.stage || 'To do';
        return {
          id: t._id || t.id || 'task-' + Date.now(),
          _id: t._id || t.id || 'task-' + Date.now(),
          title: t.taskName || payload.title,
          taskName: t.taskName || payload.title,
          stage,
          category: payload.category || normalizeCategory(null, payload.title),
          priority: payload.priority || 'Medium',
          progress: stage === 'Done' ? 100 : (payload.progress || 0),
          hasProgressBar: stage !== 'To do' || payload.progress > 0,
          dueDate: payload.dueDate || null,
          completedAt: stage === 'Done' ? new Date().toISOString() : null,
          commentsCount: 0,
          assignees: payload.assignedUsers || [],
          project: payload.project || null,
          description: payload.description || '',
          order: 0,
        };
      } else {
        // Fallback optimistic card
        return {
          id: 'task-' + Date.now(),
          _id: 'task-' + Date.now(),
          title: payload.title,
          taskName: payload.title,
          stage: payload.stage || 'To do',
          category: payload.category || 'Frontend',
          priority: payload.priority || 'Medium',
          progress: payload.stage === 'Done' ? 100 : 0,
          hasProgressBar: payload.stage !== 'To do',
          dueDate: payload.dueDate || null,
          completedAt: payload.stage === 'Done' ? new Date().toISOString() : null,
          commentsCount: 0,
          assignees: payload.assignedUsers || [],
          project: payload.project || null,
          description: payload.description || '',
          order: 0,
        };
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create task');
    }
  }
);

export const updateTaskStatusAsync = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, toStage }, { rejectWithValue }) => {
    try {
      const backendStatus =
        toStage === 'Done'
          ? 'Completed'
          : toStage === 'In progress'
          ? 'In Progress'
          : toStage === 'In review'
          ? 'Testing'
          : 'Pending';

      await updateTaskStatusApi(id, { status: backendStatus });
      return { id, toStage };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update task status');
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      await deleteTaskApi(taskId);
      return taskId;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete task');
    }
  }
);

const initialState = {
  tasks: [],
  filter: 'all', // 'all' | 'my-tasks' | 'high-priority' | 'due-this-week'
  loading: false,
  error: null,
  search: '',
  draggedTaskId: null,
  dragTarget: null, // { stage, index }
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setDraggedTask: (state, action) => {
      state.draggedTaskId = action.payload;
    },
    setDragTarget: (state, action) => {
      state.dragTarget = action.payload;
    },
    // Main Kanban moveTask action: move task toStage at toIndex
    moveTask: (state, action) => {
      const { id, toStage, toIndex } = action.payload || {};
      if (!id || !toStage) return;

      const taskIndex = state.tasks.findIndex((t) => (t.id || t._id) === id);
      if (taskIndex === -1) return;

      const task = state.tasks[taskIndex];
      const prevStage = task.stage;
      const isMovingToDone = toStage === 'Done';
      const isMovingOutOfDone = prevStage === 'Done' && !isMovingToDone;

      // Update task properties
      task.stage = toStage;
      if (isMovingToDone) {
        task.progress = 100;
        task.hasProgressBar = true;
        task.completedAt = new Date().toISOString();
      } else if (isMovingOutOfDone) {
        task.completedAt = null;
        task.progress = task.progress === 100 ? 50 : task.progress;
      }

      // Reorder tasks in array
      state.tasks.splice(taskIndex, 1);

      // Find all tasks in the destination stage
      const stageTasks = state.tasks.filter((t) => t.stage === toStage);
      let insertGlobalIndex = state.tasks.length;

      if (typeof toIndex === 'number' && toIndex >= 0 && toIndex < stageTasks.length) {
        const referenceTask = stageTasks[toIndex];
        insertGlobalIndex = state.tasks.indexOf(referenceTask);
        if (insertGlobalIndex === -1) insertGlobalIndex = state.tasks.length;
      }

      state.tasks.splice(insertGlobalIndex, 0, task);
    },
    updateTaskDetails: (state, action) => {
      const updated = action.payload;
      const idx = state.tasks.findIndex((t) => (t.id || t._id) === (updated.id || updated._id));
      if (idx !== -1) {
        state.tasks[idx] = { ...state.tasks[idx], ...updated };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload || [];
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Task
      .addCase(createNewTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      // Delete Task
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => (t.id || t._id) !== action.payload);
      });
  },
});

export const {
  setFilter,
  setSearch,
  setDraggedTask,
  setDragTarget,
  moveTask,
  updateTaskDetails,
} = tasksSlice.actions;

// Selectors
export const selectAllTasks = (state) => state.tasks?.tasks || [];
export const selectTasksLoading = (state) => state.tasks?.loading || false;
export const selectTasksFilter = (state) => state.tasks?.filter || 'all';
export const selectTasksSearch = (state) => state.tasks?.search || '';
export const selectDraggedTaskId = (state) => state.tasks?.draggedTaskId;
export const selectDragTarget = (state) => state.tasks?.dragTarget;

export default tasksSlice.reducer;
