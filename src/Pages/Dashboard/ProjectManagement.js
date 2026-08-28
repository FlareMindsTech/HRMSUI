import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal,
  Dropdown, Spinner, Alert, Nav, Tab
} from 'react-bootstrap';
import {
  FaProjectDiagram, FaPlus,
  FaEllipsisV, FaEdit, FaTrash, FaArrowLeft, FaTimes, FaExclamationTriangle,
  FaCheckCircle, FaUserPlus, FaInbox, FaCalendarAlt, FaPaperPlane,
  FaSyncAlt, FaComments
} from 'react-icons/fa';
import {
  getAllProjectsApi,
  getMyProjectsApi,
  getEligiblePMsApi,
  getCompanyUsersApi,
  getProjectDetailsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
  addProjectMemberApi,
  removeProjectMemberApi,
  getProjectSprintsApi,
  createSprintApi,
  updateSprintApi,
  deleteSprintApi,
  getTasksByProjectApi,
  createTaskApi,
  updateTaskApi,
  updateTaskStatusApi,
  deleteTaskApi,
  getProjectDailyReportsApi,
  submitDailyReportApi,
  addDailyReportCommentApi,
} from '../../Api/Project/project';
import { useAuth } from '../../context/AuthContext';
import './ProjectManagement.css';

// ============================================================
// Constants - Empty form templates & status/priority options
// ============================================================
const emptyProjectForm = {
  projectName: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'Pending',
  projectManager: '',
};

const emptySprintForm = {
  sprintName: '',
  startDate: '',
  endDate: '',
  status: 'Planned',
};

const emptyTaskForm = {
  taskName: '',
  description: '',
  priority: 'Medium',
  dueDate: '',
  assignedTo: '',
  sprintId: '',
};

const emptyMemberForm = {
  newMemberId: '',
};

const emptyDailyReportForm = {
  reportDate: new Date().toISOString().slice(0, 10),
  shift: 'FULL_DAY',
  title: '',
  description: '',
  preference: 1,
  referenceLink: '',
};

const PROJECT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'On Hold'];
const SPRINT_STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed'];
const TASK_STATUS_OPTIONS = ['To Do', 'In Progress', 'Testing', 'Completed'];
const TASK_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

function ProjectManagement() {
  const { user, permissions, hasPermission } = useAuth();

  // Role & Capability determination
  const userPriority = user?.priority ?? user?.role?.priority;
  const userPermissions = permissions || user?.permissions || [];
  const userRoleCode = user?.roleCode || user?.role?.roleCode;

  const isOwnerOrAdmin = userPriority === 1 || userPriority === 2 || userRoleCode === 'OWNER' || userRoleCode === 'ADMIN' || userPermissions.includes('*');
  const isDefaultPMRole = userRoleCode === 'PROJECT_MANAGER';
  const isProjectManager = isDefaultPMRole;
  const isEmployee = !isOwnerOrAdmin && !isDefaultPMRole;

  // --- Core data ---
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [sprints, setSprints] = useState([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [companyUsers, setCompanyUsers] = useState([]);
  const [companyUsersLoading, setCompanyUsersLoading] = useState(false);

  const [eligiblePMs, setEligiblePMs] = useState([]);

  // Daily Reports for selected project
  const [projectReports, setProjectReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');
  const [dailyReportForm, setDailyReportForm] = useState(emptyDailyReportForm);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [commentTextMap, setCommentTextMap] = useState({});
  const [submittingCommentMap, setSubmittingCommentMap] = useState({});

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState('reports');

  // Responsive / Mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  // Filters
  const [sprintFilter, setSprintFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // Feedback banner
  const [feedback, setFeedback] = useState(null);
  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    window.clearTimeout(showFeedback._t);
    showFeedback._t = window.setTimeout(() => setFeedback(null), 4000);
  }, []);

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');

  // Task Completion Modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [savingCompletion, setSavingCompletion] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [sprintForm, setSprintForm] = useState(emptySprintForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);

  const [savingProject, setSavingProject] = useState(false);
  const [savingSprint, setSavingSprint] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  // --- Selected Project Authorization & Capabilities (NOW AFTER STATE DECLARATIONS) ---
  const currentUserId = user?._id || user?.id;
  const isCurrentProjectPM = Boolean(
    projectDetails && (
      (projectDetails.projectManager?._id && projectDetails.projectManager._id.toString() === currentUserId?.toString()) ||
      (projectDetails.projectManager && projectDetails.projectManager.toString() === currentUserId?.toString())
    )
  );
  const canEditProject = (isOwnerOrAdmin || isCurrentProjectPM) && hasPermission('project.update');
  const canDeleteProject = (isOwnerOrAdmin || isCurrentProjectPM) && hasPermission('project.delete');
  const canAddMember = (isOwnerOrAdmin || isCurrentProjectPM) && hasPermission('project.add_member');
  const canRemoveMember = (isOwnerOrAdmin || isCurrentProjectPM) && hasPermission('project.remove_member');
  const canManageSprints = (isOwnerOrAdmin || isCurrentProjectPM) && (hasPermission('project.update') || hasPermission('*'));
  const canManageTasks = (isOwnerOrAdmin || isCurrentProjectPM) && (hasPermission('project.update') || hasPermission('*'));

  // ============================================================
  // Fetchers
  // ============================================================
  const fetchProjects = useCallback(async (selectIdAfter) => {
    setProjectsLoading(true);
    setProjectsError('');
    try {
      const { ok, data } = isOwnerOrAdmin ? await getAllProjectsApi() : await getMyProjectsApi();
      if (ok && data.success) {
        setProjects(data.data || []);
        if (selectIdAfter) {
          setSelectedProjectId(selectIdAfter);
        } else if (data.data && data.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.data[0]._id);
        }
      } else {
        setProjectsError(data.message || 'Failed to load projects.');
      }
    } catch (e) {
      console.error(e);
      setProjectsError('Could not reach the server. Please check your connection.');
    } finally {
      setProjectsLoading(false);
    }
  }, [isOwnerOrAdmin, selectedProjectId]);

  const fetchEligiblePMs = useCallback(async () => {
    try {
      const { ok, data } = await getEligiblePMsApi();
      if (ok && data.success) setEligiblePMs(data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchProjectDetails = useCallback(async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    try {
      const { ok, data } = await getProjectDetailsApi(id);
      if (ok && data.success) {
        setProjectDetails(data.data);
      } else {
        showFeedback('danger', data.message || 'Failed to load project details.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Could not reach the server.');
    } finally {
      setDetailsLoading(false);
    }
  }, [showFeedback]);

  const fetchSprints = useCallback(async (projectId) => {
    if (!projectId) return;
    setSprintsLoading(true);
    try {
      const { ok, data } = await getProjectSprintsApi(projectId);
      if (ok && data.success) setSprints(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSprintsLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (projectId) => {
    if (!projectId) return;
    setTasksLoading(true);
    try {
      const { ok, data } = await getTasksByProjectApi(projectId);
      if (ok && data.success) setTasks(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const fetchCompanyUsers = useCallback(async () => {
    setCompanyUsersLoading(true);
    try {
      const { ok, data } = await getCompanyUsersApi();
      if (ok && Array.isArray(data.data)) setCompanyUsers(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCompanyUsersLoading(false);
    }
  }, []);

  const fetchProjectReports = useCallback(async (projectId) => {
    if (!projectId) return;
    setReportsLoading(true);
    try {
      const { ok, data } = await getProjectDailyReportsApi(projectId);
      if (ok && data.success) setProjectReports(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    if (isOwnerOrAdmin) fetchEligiblePMs();
  }, [fetchProjects, isOwnerOrAdmin, fetchEligiblePMs]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
      fetchSprints(selectedProjectId);
      fetchTasks(selectedProjectId);
      fetchProjectReports(selectedProjectId);
      setSprintFilter('all');
      setTaskStatusFilter('all');
      setSelectedMemberFilter('all');
      setActiveTab('overview');
      setShowChatDrawer(false);
      if (isMobile) setMobileView('detail');
    } else {
      setProjectDetails(null);
      setSprints([]);
      setTasks([]);
      setProjectReports([]);
      setShowChatDrawer(false);
    }
  }, [selectedProjectId, fetchProjectDetails, fetchSprints, fetchTasks, fetchProjectReports, isMobile]);

  // ============================================================
  // Project Handlers
  // ============================================================
  const openCreateProject = () => {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    if (isOwnerOrAdmin || isProjectManager) fetchEligiblePMs();
    setShowProjectModal(true);
  };

  const openEditProject = (project) => {
    setEditingProjectId(project._id);
    setProjectForm({
      projectName: project.projectName || '',
      description: project.description || '',
      startDate: toDateInput(project.startDate),
      endDate: toDateInput(project.endDate),
      status: project.status || 'Pending',
      projectManager: getId(project.projectManager) || '',
    });
    setShowProjectModal(true);
  };

  const saveProject = async () => {
    if (!projectForm.projectName.trim()) {
      showFeedback('danger', 'Project name is required.');
      return;
    }
    setSavingProject(true);
    try {
      const isEdit = !!editingProjectId;
      const payload = { ...projectForm };
      if (!isEdit && !payload.projectManager && isProjectManager && user) {
        payload.projectManager = user._id || user.id;
      }
      const { ok, data } = isEdit
        ? await updateProjectApi(editingProjectId, payload)
        : await createProjectApi(payload);

      if (ok && data.success) {
        showFeedback('success', isEdit ? 'Project updated successfully.' : 'Project created successfully.');
        setShowProjectModal(false);
        fetchProjects(isEdit ? selectedProjectId : data.data._id);
      } else {
        showFeedback('danger', data.message || 'Failed to save project.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong while saving project.');
    } finally {
      setSavingProject(false);
    }
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.projectName}"?`)) return;
    try {
      const { ok, data } = await deleteProjectApi(project._id);
      if (ok && data.success) {
        showFeedback('success', 'Project deleted.');
        if (selectedProjectId === project._id) setSelectedProjectId(null);
        fetchProjects();
      } else {
        showFeedback('danger', data.message || 'Failed to delete project.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong.');
    }
  };

  // ============================================================
  // Sprint Handlers
  // ============================================================
  const openCreateSprint = () => {
    setEditingSprintId(null);
    setSprintForm(emptySprintForm);
    setShowSprintModal(true);
  };

  const openEditSprint = (sprint) => {
    setEditingSprintId(sprint._id);
    setSprintForm({
      sprintName: sprint.sprintName || '',
      startDate: toDateInput(sprint.startDate),
      endDate: toDateInput(sprint.endDate),
      status: sprint.status || 'Planned',
    });
    setShowSprintModal(true);
  };

  const saveSprint = async () => {
    if (!sprintForm.sprintName.trim() || !sprintForm.startDate || !sprintForm.endDate) {
      showFeedback('danger', 'Sprint name, start date, and end date are required.');
      return;
    }
    setSavingSprint(true);
    try {
      const isEdit = !!editingSprintId;
      const body = isEdit ? sprintForm : { ...sprintForm, projectId: selectedProjectId };
      const { ok, data } = isEdit
        ? await updateSprintApi(editingSprintId, body)
        : await createSprintApi(body);

      if (ok && data.success) {
        showFeedback('success', isEdit ? 'Sprint updated.' : 'Sprint created.');
        setShowSprintModal(false);
        fetchSprints(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to save sprint.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong.');
    } finally {
      setSavingSprint(false);
    }
  };

  const deleteSprint = async (sprint) => {
    if (!window.confirm(`Delete sprint "${sprint.sprintName}"?`)) return;
    try {
      const { ok, data } = await deleteSprintApi(sprint._id);
      if (ok && data.success) {
        showFeedback('success', 'Sprint deleted.');
        fetchSprints(selectedProjectId);
        fetchTasks(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to delete sprint.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong.');
    }
  };

  // ============================================================
  // Task Handlers
  // ============================================================
  const openCreateTask = () => {
    setEditingTaskId(null);
    setTaskForm(emptyTaskForm);
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      taskName: task.taskName || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      dueDate: toDateInput(task.dueDate),
      assignedTo: getId(task.assignedTo) || '',
      sprintId: getId(task.sprintId) || '',
    });
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    if (!taskForm.taskName.trim()) {
      showFeedback('danger', 'Task title is required.');
      return;
    }
    setSavingTask(true);
    try {
      const isEdit = !!editingTaskId;
      const payload = isEdit ? taskForm : {
        ...taskForm,
        projectId: selectedProjectId,
        sprintId: taskForm.sprintId || undefined,
        assignedTo: taskForm.assignedTo || undefined,
      };

      const { ok, data } = isEdit
        ? await updateTaskApi(editingTaskId, payload)
        : await createTaskApi(payload);

      if (ok && data.success) {
        showFeedback('success', isEdit ? 'Task updated.' : 'Task created and assigned.');
        setShowTaskModal(false);
        fetchTasks(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to save task.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong.');
    } finally {
      setSavingTask(false);
    }
  };

  const quickStatusChange = async (task, newStatus) => {
    if (newStatus === 'Completed') {
      setTaskToComplete(task);
      setCompletionNote('');
      setShowCompletionModal(true);
      return;
    }

    try {
      const { ok, data } = await updateTaskStatusApi(task._id, { status: newStatus });
      if (ok && data.success) {
        showFeedback('success', `Task status changed to ${newStatus}`);
        fetchTasks(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to update task status.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Failed to update status.');
    }
  };

  const submitTaskCompletion = async () => {
    if (!taskToComplete) return;
    setSavingCompletion(true);
    try {
      const { ok, data } = await updateTaskStatusApi(taskToComplete._id, {
        status: 'Completed',
        completionNote,
      });
      if (ok && data.success) {
        showFeedback('success', 'Task marked as Completed!');
        setShowCompletionModal(false);
        setTaskToComplete(null);
        fetchTasks(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to complete task.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Error submitting task completion.');
    } finally {
      setSavingCompletion(false);
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.taskName}"?`)) return;
    try {
      const { ok, data } = await deleteTaskApi(task._id);
      if (ok && data.success) {
        showFeedback('success', 'Task deleted.');
        fetchTasks(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to delete task.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong.');
    }
  };

  // ============================================================
  // Member Handlers
  // ============================================================
  const openAddMember = () => {
    setMemberForm(emptyMemberForm);
    setMemberRoleFilter('all');
    fetchCompanyUsers();
    setShowMemberModal(true);
  };

  const addMember = async () => {
    if (!memberForm.newMemberId) {
      showFeedback('danger', 'Please select a user to add.');
      return;
    }
    setSavingMember(true);
    try {
      const { ok, data } = await addProjectMemberApi({
        projectId: selectedProjectId,
        newMemberId: memberForm.newMemberId,
      });

      if (ok && data.success) {
        showFeedback('success', 'Team member added.');
        setShowMemberModal(false);
        fetchProjectDetails(selectedProjectId);
        fetchProjects();
      } else {
        showFeedback('danger', data.message || 'Failed to add member.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong.');
    } finally {
      setSavingMember(false);
    }
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${getDisplayName(member)} from project?`)) return;
    try {
      const { ok, data } = await removeProjectMemberApi({
        projectId: selectedProjectId,
        memberId: member._id,
        memberRole: member.roleKey,
      });
      if (ok && data.success) {
        showFeedback('success', 'Member removed.');
        fetchProjectDetails(selectedProjectId);
        fetchProjects();
      } else {
        showFeedback('danger', data.message || 'Failed to remove member.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong.');
    }
  };

  // ============================================================
  // Daily Report Handlers
  // ============================================================
  const submitProjectDailyReport = async (e) => {
    e.preventDefault();
    if (!dailyReportForm.description.trim()) {
      showFeedback('danger', 'Work details/description are required for Daily Report.');
      return;
    }
    setSubmittingReport(true);
    try {
      const payload = {
        ...dailyReportForm,
        projectId: selectedProjectId,
        title: dailyReportForm.title.trim() || 'Work Update',
      };
      const { ok, data } = await submitDailyReportApi(payload);
      if (ok && data.success) {
        showFeedback('success', 'Daily Report submitted successfully for this project!');
        setDailyReportForm(emptyDailyReportForm);
        fetchProjectReports(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to submit Daily Report.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Error submitting Daily Report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleAddComment = async (reportId) => {
    const text = (commentTextMap[reportId] || '').trim();
    if (!text) return;

    setSubmittingCommentMap(prev => ({ ...prev, [reportId]: true }));
    try {
      const { ok, data } = await addDailyReportCommentApi(reportId, text);
      if (ok && data.success) {
        setCommentTextMap(prev => ({ ...prev, [reportId]: '' }));
        fetchProjectReports(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Failed to post comment.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Error posting comment.');
    } finally {
      setSubmittingCommentMap(prev => ({ ...prev, [reportId]: false }));
    }
  };

  // ============================================================
  // Derived Data
  // ============================================================
  const projectMembers = projectDetails ? [
    ...(projectDetails.projectManager ? [{ ...projectDetails.projectManager, roleLabel: 'Project Manager', roleKey: 'projectManager' }] : []),
    ...(projectDetails.teamLeads || []).filter(m => m.userId).map(m => ({ ...m.userId, roleLabel: 'Team Lead', roleKey: 'teamLeads' })),
    ...(projectDetails.softwareDevelopers || []).filter(m => m.userId).map(m => ({ ...m.userId, roleLabel: 'Software Developer', roleKey: 'softwareDevelopers' })),
    ...(projectDetails.interns || []).filter(m => m.userId).map(m => ({ ...m.userId, roleLabel: 'Intern', roleKey: 'interns' })),
  ] : [];

  const memberIds = new Set(projectMembers.map(m => m._id));
  const availableUsers = companyUsers.filter(u => !memberIds.has(u._id));
  const availableRoles = Array.from(
    new Set(availableUsers.map(u => u.role?.roleName || u.roleCode || 'Other').filter(Boolean))
  ).sort();

  const filteredAvailableUsers = availableUsers.filter(u => {
    if (memberRoleFilter === 'all') return true;
    const r = u.role?.roleName || u.roleCode || 'Other';
    return r === memberRoleFilter;
  });

  const filteredTasks = tasks.filter(t => {
    const sid = getId(t.sprintId);
    const sprintMatch = sprintFilter === 'all'
      ? true
      : sprintFilter === 'backlog'
        ? !sid
        : sid === sprintFilter;
    const statusMatch = taskStatusFilter === 'all' ? true : t.status === taskStatusFilter;
    return sprintMatch && statusMatch;
  });

  const filteredReports = projectReports.filter(r => {
    if (selectedMemberFilter === 'all') return true;
    const reporterId = getId(r.submittedBy);
    return reporterId === selectedMemberFilter;
  });

  const getSprintName = (sprintId) => {
    const sid = getId(sprintId);
    if (!sid) return null;
    const s = sprints.find(sp => sp._id === sid);
    return s ? s.sprintName : null;
  };

  const taskCounts = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
  };

  // Badges
  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'critical': return <Badge bg="dark">Critical</Badge>;
      case 'high': return <Badge bg="danger">High</Badge>;
      case 'medium': return <Badge bg="warning" text="dark">Medium</Badge>;
      case 'low': return <Badge bg="info">Low</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed': return <Badge bg="success" className="rounded-pill px-3">Completed</Badge>;
      case 'in progress':
      case 'active':
        return <Badge bg="primary" className="rounded-pill px-3">{status}</Badge>;
      case 'testing': return <Badge bg="info" text="dark" className="rounded-pill px-3">Testing</Badge>;
      case 'planned':
      case 'pending':
      case 'to do':
        return <Badge bg="warning" className="rounded-pill px-3 text-dark">{status}</Badge>;
      case 'on hold': return <Badge bg="secondary" className="rounded-pill px-3">On Hold</Badge>;
      default: return <Badge bg="secondary" className="rounded-pill px-3">{status || 'Unknown'}</Badge>;
    }
  };

  const selectProject = (project) => setSelectedProjectId(project._id);
  const backToList = () => setMobileView('list');

  const showList = !isMobile || mobileView === 'list';
  const showDetail = !isMobile || mobileView === 'detail';

  return (
    <Container fluid className="p-3 no-scrollbar pm-wrapper">

      {feedback && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback(null)}
          dismissible
          className="d-flex align-items-center gap-2 py-2 shadow-sm mb-3"
        >
          {feedback.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span className="small">{feedback.message}</span>
        </Alert>
      )}

      {/* Header */}
      <Row className="mb-3 g-2 align-items-center">
        <Col xs={12} md={7}>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold mb-0 pm-page-title">Project Management</h4>
            {isOwnerOrAdmin && <Badge bg="primary" className="rounded-pill">Admin View</Badge>}
            {isProjectManager && <Badge bg="info" text="dark" className="rounded-pill">PM View</Badge>}
            {isEmployee && <Badge bg="secondary" className="rounded-pill">Team View</Badge>}
          </div>
          <p className="text-muted small mb-0">Oversee projects, manage sprints, and track team tasks seamlessly.</p>
        </Col>
        <Col xs={12} md={5} className="d-flex justify-content-md-end">
          {(isOwnerOrAdmin || isProjectManager || hasPermission('project.create')) && (
            <Button
              variant="primary"
              className="pm-new-project-btn rounded-pill gradient-bg px-4 py-2 shadow-sm d-flex align-items-center gap-2 justify-content-center"
              onClick={openCreateProject}
            >
              <FaPlus /> New Project
            </Button>
          )}
        </Col>
      </Row>

      {projectsError && (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between py-2 shadow-sm mb-3">
          <span className="small d-flex align-items-center gap-2"><FaExclamationTriangle /> {projectsError}</span>
          <Button size="sm" variant="outline-danger" onClick={() => fetchProjects()}>Retry</Button>
        </Alert>
      )}

      <Row className="g-3">
        {/* Projects list */}
        {showList && (
          <Col xs={12} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3">
                <h6 className="fw-bold small text-uppercase text-muted mb-3">
                  {isOwnerOrAdmin ? 'All Projects' : 'My Projects'}
                </h6>

                {projectsLoading && (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" size="sm" className="pm-spinner" />
                  </div>
                )}

                {!projectsLoading && !projectsError && projects.length === 0 && (
                  <div className="pm-empty-state text-center py-4">
                    <FaInbox size={28} className="pm-empty-icon mb-2 opacity-50" />
                    <p className="small text-muted mb-2">No projects assigned.</p>
                    {(isOwnerOrAdmin || isProjectManager || hasPermission('project.create')) && (
                      <Button size="sm" variant="outline-primary" className="pm-outline-btn" onClick={openCreateProject}>
                        Create first project
                      </Button>
                    )}
                  </div>
                )}

                <div className="d-flex flex-column gap-2">
                  {projects.map(project => (
                    <div
                      key={project._id}
                      onClick={() => selectProject(project)}
                      className={`pm-project-card p-2 rounded cursor-pointer border ${selectedProjectId === project._id ? 'pm-active border-primary bg-light' : 'border-light'}`}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="flex-grow-1 pm-min-w-0">
                          <p className="pm-project-name text-truncate fw-bold mb-1" title={project.projectName}>{project.projectName}</p>
                          {getStatusBadge(project.status)}
                        </div>
                        {isOwnerOrAdmin && (
                          <div className="d-flex gap-1 flex-shrink-0">
                            <Button
                              size="sm" variant="light" className="pm-icon-btn p-1"
                              onClick={(e) => { e.stopPropagation(); openEditProject(project); }}
                              title="Edit project"
                            >
                              <FaEdit size={12} />
                            </Button>
                            <Button
                              size="sm" variant="light" className="pm-icon-btn pm-danger p-1 text-danger"
                              onClick={(e) => { e.stopPropagation(); deleteProject(project); }}
                              title="Delete project"
                            >
                              <FaTrash size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                      {project.projectManager && (
                        <p className="pm-project-pm-label text-muted small mt-2 mb-0">
                          PM: {getDisplayName(project.projectManager)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Selected project detail workspace - Main Column */}
        {showDetail && (
          <>
            {/* Main Workspace Column: Overview, Team Members, Sprints, Tasks */}
            <Col xs={12} lg={9}>
              {isMobile && selectedProjectId && (
                <Button variant="light" size="sm" className="mb-2 d-flex align-items-center gap-2" onClick={backToList}>
                  <FaArrowLeft /> Back to projects
                </Button>
              )}

              {!selectedProjectId && (
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center py-5 text-muted">
                    <FaProjectDiagram size={40} className="mb-3 opacity-50" />
                    <p className="mb-0">Select a project from the list to view details, sprints, tasks, and daily reports.</p>
                  </Card.Body>
                </Card>
              )}

              {selectedProjectId && detailsLoading && !projectDetails && (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" className="pm-spinner" />
                </div>
              )}

              {selectedProjectId && projectDetails && (
                <>
                  {/* Project Header Card */}
                  <Card className="border-0 shadow-sm mb-3">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                        <div className="pm-min-w-0">
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <h5 className="fw-bold mb-0">{projectDetails.projectName}</h5>
                            {getStatusBadge(projectDetails.status)}
                          </div>
                          {projectDetails.description && (
                            <p className="text-muted small mb-2">{projectDetails.description}</p>
                          )}
                          <div className="pm-meta-row d-flex flex-wrap gap-3 text-muted small">
                            <span><FaCalendarAlt /> {formatDate(projectDetails.startDate)} — {formatDate(projectDetails.endDate)}</span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="rounded-pill d-flex align-items-center gap-1 micro-text fw-bold"
                            onClick={() => {
                              setShowChatDrawer(true);
                              fetchProjectReports(selectedProjectId);
                            }}
                          >
                            <FaComments size={13} /> Daily Reports Chat
                          </Button>

                          {(canEditProject || canDeleteProject) && (
                            <Dropdown align="end">
                              <Dropdown.Toggle as={Button} variant="light" size="sm" className="border-0 px-2">
                                <FaEllipsisV />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {canEditProject && (
                                  <Dropdown.Item onClick={() => openEditProject(projectDetails)} className="d-flex align-items-center gap-2">
                                    <FaEdit /> Edit Project
                                  </Dropdown.Item>
                                )}
                                {canDeleteProject && (
                                  <Dropdown.Item onClick={() => deleteProject(projectDetails)} className="d-flex align-items-center gap-2 text-danger">
                                    <FaTrash /> Delete Project
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Workspace Navigation Tabs (Top of Middle Column) */}
                  <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Nav variant="pills" className="bg-white p-2 rounded shadow-sm mb-3 gap-1 flex-nowrap overflow-auto no-scrollbar">
                      <Nav.Item>
                        <Nav.Link eventKey="overview" className="rounded-pill px-3 py-1 small">Project Overview</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="members" className="rounded-pill px-3 py-1 small">Team Members ({projectMembers.length})</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="sprints" className="rounded-pill px-3 py-1 small">Sprints ({sprints.length})</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="tasks" className="rounded-pill px-3 py-1 small">Tasks ({tasks.length})</Nav.Link>
                      </Nav.Item>
                    </Nav>

                    <Tab.Content>
                      {/* PROJECT OVERVIEW TAB */}
                      <Tab.Pane eventKey="overview">
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Body className="p-3">
                            <h6 className="fw-bold mb-3 text-uppercase small text-muted">Project Overview & Metrics</h6>
                            <Row className="g-2 mb-3">
                              <Col xs={4}>
                                <div className="p-2 border rounded text-center bg-light">
                                  <div className="fw-bold text-primary fs-5">{projectMembers.length}</div>
                                  <div className="text-muted micro-text">Members</div>
                                </div>
                              </Col>
                              <Col xs={4}>
                                <div className="p-2 border rounded text-center bg-light">
                                  <div className="fw-bold text-primary fs-5">{sprints.length}</div>
                                  <div className="text-muted micro-text">Sprints</div>
                                </div>
                              </Col>
                              <Col xs={4}>
                                <div className="p-2 border rounded text-center bg-light">
                                  <div className="fw-bold text-primary fs-5">{taskCounts.completed}/{taskCounts.total}</div>
                                  <div className="text-muted micro-text">Tasks Done</div>
                                </div>
                              </Col>
                            </Row>
                            <div className="table-responsive">
                              <Table hover className="align-middle mb-0 small">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold text-muted w-25">Project Manager</td>
                                    <td>{projectDetails.projectManager ? getDisplayName(projectDetails.projectManager) : <span className="text-muted">Unassigned</span>}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold text-muted">Status</td>
                                    <td>{getStatusBadge(projectDetails.status)}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold text-muted">Timeline</td>
                                    <td>{formatDate(projectDetails.startDate)} — {formatDate(projectDetails.endDate)}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold text-muted">Description</td>
                                    <td>{projectDetails.description || 'No description provided.'}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </div>
                          </Card.Body>
                        </Card>
                      </Tab.Pane>

                      {/* TEAM MEMBERS TAB */}
                      <Tab.Pane eventKey="members">
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="fw-bold mb-0 text-uppercase small text-muted">Team Members</h6>
                              {canAddMember && (
                                <Button
                                  size="sm" variant="outline-primary" className="pm-outline-btn d-flex align-items-center gap-1 rounded-pill"
                                  onClick={openAddMember}
                                >
                                  <FaUserPlus size={12} /> Add Member
                                </Button>
                              )}
                            </div>

                            {projectMembers.length === 0 && (
                              <p className="text-muted small mb-0">No members assigned yet.</p>
                            )}

                            <div className="d-flex flex-wrap gap-2">
                              {projectMembers.map((member, idx) => (
                                <div key={`${member.roleKey}-${member._id || idx}`} className="pm-member-chip border rounded p-2 d-flex align-items-center gap-2 bg-light">
                                  <div className="pm-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 32, height: 32, fontSize: 12 }}>
                                    {getInitials(member)}
                                  </div>
                                  <div>
                                    <div className="pm-member-name fw-bold small">{getDisplayName(member)}</div>
                                    <div className="pm-member-role text-muted micro-text" style={{ fontSize: 10 }}>{member.roleLabel}</div>
                                  </div>
                                  {canRemoveMember && (
                                    <Button
                                      size="sm" variant="link" className="p-0 text-muted ms-1"
                                      onClick={() => removeMember(member)}
                                      title="Remove member"
                                    >
                                      <FaTimes size={12} />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Card.Body>
                        </Card>
                      </Tab.Pane>

                      {/* SPRINTS TAB */}
                      <Tab.Pane eventKey="sprints">
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="fw-bold mb-0 text-uppercase small text-muted">Sprints</h6>
                              {canManageSprints && (
                                <Button
                                  size="sm" variant="outline-primary" className="pm-outline-btn d-flex align-items-center gap-1 rounded-pill"
                                  onClick={openCreateSprint}
                                >
                                  <FaPlus size={12} /> New Sprint
                                </Button>
                              )}
                            </div>

                            {sprintsLoading && (
                              <div className="d-flex justify-content-center py-3">
                                <Spinner animation="border" size="sm" className="pm-spinner" />
                              </div>
                            )}

                            {!sprintsLoading && sprints.length === 0 && (
                              <p className="text-muted small mb-0">No sprints yet.</p>
                            )}

                            <Row className="g-2">
                              {sprints.map(sprint => (
                                <Col xs={12} key={sprint._id}>
                                  <div className="pm-sprint-card border rounded p-3 bg-light">
                                    <div className="d-flex justify-content-between align-items-start gap-1 mb-2">
                                      <p className="pm-sprint-name text-truncate fw-bold mb-0" title={sprint.sprintName}>{sprint.sprintName}</p>
                                      {canManageSprints && (
                                        <div className="d-flex gap-1 flex-shrink-0">
                                          <Button size="sm" variant="light" className="pm-icon-btn p-1" onClick={() => openEditSprint(sprint)} title="Edit sprint">
                                            <FaEdit size={11} />
                                          </Button>
                                          <Button size="sm" variant="light" className="pm-icon-btn pm-danger p-1 text-danger" onClick={() => deleteSprint(sprint)} title="Delete sprint">
                                            <FaTrash size={11} />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    {getStatusBadge(sprint.status)}
                                    <p className="pm-sprint-dates text-muted small mt-2 mb-0">
                                      {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                                    </p>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </Card.Body>
                        </Card>
                      </Tab.Pane>

                      {/* TASKS TAB */}
                      <Tab.Pane eventKey="tasks">
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                              <h6 className="fw-bold mb-0 text-uppercase small text-muted">Tasks</h6>
                              {canManageTasks && (
                                <Button
                                  size="sm" variant="outline-primary" className="pm-outline-btn d-flex align-items-center gap-1 rounded-pill"
                                  onClick={openCreateTask}
                                >
                                  <FaPlus size={12} /> New Task
                                </Button>
                              )}
                            </div>

                            <Row className="g-2 mb-3">
                              <Col xs={6}>
                                <Form.Select size="sm" className="shadow-none" value={sprintFilter} onChange={e => setSprintFilter(e.target.value)}>
                                  <option value="all">All Sprints</option>
                                  <option value="backlog">Backlog (No Sprint)</option>
                                  {sprints.map(s => <option key={s._id} value={s._id}>{s.sprintName}</option>)}
                                </Form.Select>
                              </Col>
                              <Col xs={6}>
                                <Form.Select size="sm" className="shadow-none" value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value)}>
                                  <option value="all">All Statuses</option>
                                  {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                              </Col>
                            </Row>

                            {tasksLoading && (
                              <div className="d-flex justify-content-center py-3">
                                <Spinner animation="border" size="sm" className="pm-spinner" />
                              </div>
                            )}

                            {!tasksLoading && filteredTasks.length === 0 && (
                              <p className="text-muted small mb-0">No tasks match this view.</p>
                            )}

                            {!tasksLoading && filteredTasks.length > 0 && (
                              <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                  <thead>
                                    <tr className="text-muted small text-uppercase">
                                      <th>Task</th>
                                      <th>Assignee</th>
                                      <th>Status</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredTasks.map(task => {
                                      const isMyTask = task.assignedTo && getId(task.assignedTo) === user?.id;
                                      const canEditTaskDetails = canManageTasks;
                                      const canChangeStatus = isMyTask || canEditTaskDetails;

                                      return (
                                        <tr key={task._id}>
                                          <td>
                                            <div className="fw-bold small">{task.taskName}</div>
                                            <div className="d-flex align-items-center gap-2 mt-1">
                                              <span className="text-muted micro-text">{getSprintName(task.sprintId) || 'Backlog'}</span>
                                              {getPriorityBadge(task.priority)}
                                            </div>
                                          </td>
                                          <td className="small">{task.assignedTo ? getDisplayName(task.assignedTo) : <span className="text-muted">Unassigned</span>}</td>
                                          <td>
                                            {canChangeStatus ? (
                                              <Form.Select
                                                size="sm" className="shadow-none pm-status-select"
                                                value={task.status}
                                                onChange={e => quickStatusChange(task, e.target.value)}
                                              >
                                                {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                              </Form.Select>
                                            ) : (
                                              getStatusBadge(task.status)
                                            )}
                                          </td>
                                          <td>
                                            <div className="d-flex gap-1">
                                              {canEditTaskDetails && (
                                                <>
                                                  <Button size="sm" variant="light" className="pm-icon-btn p-1" onClick={() => openEditTask(task)} title="Edit task">
                                                    <FaEdit size={12} />
                                                  </Button>
                                                  <Button size="sm" variant="light" className="pm-icon-btn pm-danger p-1 text-danger" onClick={() => deleteTask(task)} title="Delete task">
                                                    <FaTrash size={12} />
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </Table>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </>
              )}
            </Col>

          </>
        )}
      </Row>

      {/* Floating Daily Reports Chat Trigger Button */}
      {selectedProjectId && !showChatDrawer && (
        <Button
          className="pm-floating-chat-btn shadow-lg d-flex align-items-center gap-2 rounded-pill px-3 py-2"
          onClick={() => {
            setShowChatDrawer(true);
            fetchProjectReports(selectedProjectId);
          }}
          title="Open Daily Reports Chat"
        >
          <FaComments size={18} />
          <span className="fw-bold small d-none d-sm-inline">Daily Reports Chat</span>
          {projectReports.length > 0 && (
            <Badge bg="light" text="dark" className="rounded-pill ms-1">
              {projectReports.length}
            </Badge>
          )}
        </Button>
      )}

      {/* Floating Daily Reports Chat Widget Window */}
      {selectedProjectId && showChatDrawer && (
        <div className="pm-floating-chat-widget shadow-lg">
          {/* Chat Header */}
          <div className="pm-chat-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <FaComments className="text-success" size={16} />
              <h6 className="fw-bold mb-0 text-uppercase small text-dark">
                DAILY REPORTS CHAT
              </h6>
            </div>
            <div className="d-flex align-items-center gap-1">
              {(isOwnerOrAdmin || isCurrentProjectPM || isDefaultPMRole) && projectMembers.length > 0 && (
                <Form.Select
                  size="sm"
                  style={{ width: '100px', fontSize: '11px' }}
                  className="py-0 px-1 shadow-none"
                  value={selectedMemberFilter}
                  onChange={e => setSelectedMemberFilter(e.target.value)}
                >
                  <option value="all">All Members</option>
                  {projectMembers.map(m => (
                    <option key={m._id} value={m._id}>{getDisplayName(m)}</option>
                  ))}
                </Form.Select>
              )}
              <Button
                size="sm"
                variant="outline-success"
                className="d-flex align-items-center gap-1 rounded-pill px-2 py-0 micro-text fw-bold"
                onClick={() => fetchProjectReports(selectedProjectId)}
                title="Click to manually refresh daily reports"
                disabled={reportsLoading}
              >
                <FaSyncAlt className={reportsLoading ? 'pm-spin' : ''} size={11} /> Refresh
              </Button>
              <Button
                size="sm"
                variant="light"
                className="pm-icon-btn p-1 text-muted ms-1"
                onClick={() => setShowChatDrawer(false)}
                title="Close Chat"
              >
                <FaTimes size={13} />
              </Button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="pm-chat-messages">
            {reportsLoading && (
              <div className="d-flex justify-content-center py-4">
                <Spinner animation="border" size="sm" className="pm-spinner" />
              </div>
            )}

            {!reportsLoading && filteredReports.length === 0 && (
              <div className="text-center text-muted py-5 small">
                <p className="mb-1 fw-bold">No daily reports yet</p>
                <span className="micro-text text-muted">Post your work status update using the message box below!</span>
              </div>
            )}

            {!reportsLoading && filteredReports.map((report) => {
              const submitter = report.submittedBy || report.user;
              const senderId = getId(submitter);
              const isSelf = senderId === user?.id;
              const empCode = submitter?.employeeCode || (typeof submitter === 'object' ? submitter.employeeCode : '');
              const reportId = report._id;

              return (
                <div key={reportId} className={`pm-chat-bubble ${isSelf ? 'pm-chat-bubble-self' : 'pm-chat-bubble-other'} mb-3 p-3 rounded border`}>
                  <div className="d-flex justify-content-between align-items-center mb-1 gap-2 border-bottom pb-1">
                    <span className="fw-bold micro-text text-success d-flex align-items-center gap-1">
                      {getDisplayName(submitter)} {empCode && <span className="text-muted fw-normal">({empCode})</span>}
                    </span>
                    <span className="micro-text text-muted">
                      {formatDate(report.reportDate || report.createdAt)} • Shift: {report.shift || 'FULL_DAY'}
                    </span>
                  </div>
                  
                  {report.title && report.title !== "Work Update" && (
                    <div className="fw-bold small mb-1 text-primary">{report.title}</div>
                  )}
                  
                  <div className="small text-secondary mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                    {report.description}
                  </div>

                  {report.referenceLink && (
                    <div className="mb-2 micro-text">
                      <a href={report.referenceLink} target="_blank" rel="noreferrer" className="text-decoration-underline text-success">
                        Reference Link
                      </a>
                    </div>
                  )}

                  {/* Comments / PM Replies Section */}
                  <div className="mt-2 pt-2 border-top">
                    {report.comments && report.comments.length > 0 && (
                      <div className="mb-2">
                        <div className="micro-text fw-bold text-muted mb-1">Comments / PM Replies:</div>
                        {report.comments.map((c, idx) => (
                          <div key={idx} className="bg-light rounded p-2 mb-1 micro-text border">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark">
                                {getDisplayName(c.commentedBy || c.user)} {c.commentedBy?.role?.roleName ? <span className="text-primary micro-text">({c.commentedBy.role.roleName})</span> : ''}
                              </span>
                              <span className="text-muted micro-text">
                                {formatDate(c.createdAt)}
                              </span>
                            </div>
                            <div className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{c.commentText}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    <div className="d-flex gap-1 mt-2">
                      <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Write a reply/comment..."
                        value={commentTextMap[reportId] || ''}
                        onChange={e => setCommentTextMap({ ...commentTextMap, [reportId]: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(reportId);
                          }
                        }}
                        style={{ fontSize: '12px' }}
                      />
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="px-2 py-0 d-flex align-items-center micro-text fw-bold"
                        onClick={() => handleAddComment(reportId)}
                        disabled={submittingCommentMap[reportId] || !(commentTextMap[reportId] || '').trim()}
                      >
                        {submittingCommentMap[reportId] ? <Spinner animation="border" size="sm" /> : 'Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input Bar */}
          <div className="pm-chat-input-bar">
            <Form onSubmit={submitProjectDailyReport}>
              <Form.Group className="mb-2">
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Report Title (Optional - default: Work Update)..."
                  value={dailyReportForm.title}
                  onChange={e => setDailyReportForm({ ...dailyReportForm, title: e.target.value })}
                />
              </Form.Group>
              <div className="d-flex gap-2">
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  placeholder="Type your daily work details..."
                  value={dailyReportForm.description}
                  onChange={e => setDailyReportForm({ ...dailyReportForm, description: e.target.value })}
                  required
                />
                <Button type="submit" variant="primary" size="sm" className="pm-primary-btn d-flex align-items-center justify-content-center px-3" disabled={submittingReport}>
                  {submittingReport ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingProjectId ? 'Edit Project' : 'Create New Project'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Project Name</Form.Label>
              <Form.Control type="text" placeholder="Enter project name" className="shadow-none" value={projectForm.projectName} onChange={e => setProjectForm({ ...projectForm, projectName: e.target.value })} />
            </Form.Group>

            {isOwnerOrAdmin && !editingProjectId && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Assign Project Manager</Form.Label>
                <Form.Select
                  className="shadow-none"
                  value={projectForm.projectManager}
                  onChange={e => setProjectForm({ ...projectForm, projectManager: e.target.value })}
                >
                  <option value="">Select Project Manager...</option>
                  {(() => {
                    const grouped = {};
                    eligiblePMs.forEach(pm => {
                      const roleName = pm.role?.roleName || pm.roleCode || 'Other';
                      if (!grouped[roleName]) grouped[roleName] = [];
                      grouped[roleName].push(pm);
                    });
                    return Object.entries(grouped).map(([roleName, pms]) => (
                      <optgroup key={roleName} label={roleName.toUpperCase()}>
                        {pms.map(pm => (
                          <option key={pm._id} value={pm._id}>
                            {pm.firstName} {pm.lastName} ({pm.employeeCode || pm.email})
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </Form.Select>
                <Form.Text className="text-muted micro-text">
                  Only Level 3 users with all 6 Project permissions are listed.
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Description</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Project details..." className="shadow-none" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
            </Form.Group>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Start Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={projectForm.startDate} onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">End Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={projectForm.endDate} onChange={e => setProjectForm({ ...projectForm, endDate: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            {editingProjectId && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Status</Form.Label>
                <Form.Select className="shadow-none" value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}>
                  {PROJECT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowProjectModal(false)} disabled={savingProject}>Cancel</Button>
          <Button variant="primary" onClick={saveProject} disabled={savingProject} className="pm-primary-btn">
            {savingProject ? <Spinner animation="border" size="sm" /> : (editingProjectId ? 'Save Changes' : 'Save Project')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sprint Modal */}
      <Modal show={showSprintModal} onHide={() => setShowSprintModal(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingSprintId ? 'Edit Sprint' : 'Create New Sprint'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Sprint Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Sprint 1" className="shadow-none" value={sprintForm.sprintName} onChange={e => setSprintForm({ ...sprintForm, sprintName: e.target.value })} />
            </Form.Group>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Start Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={sprintForm.startDate} onChange={e => setSprintForm({ ...sprintForm, startDate: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">End Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={sprintForm.endDate} onChange={e => setSprintForm({ ...sprintForm, endDate: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Status</Form.Label>
              <Form.Select className="shadow-none" value={sprintForm.status} onChange={e => setSprintForm({ ...sprintForm, status: e.target.value })}>
                {SPRINT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowSprintModal(false)} disabled={savingSprint}>Cancel</Button>
          <Button variant="primary" onClick={saveSprint} disabled={savingSprint} className="pm-primary-btn">
            {savingSprint ? <Spinner animation="border" size="sm" /> : (editingSprintId ? 'Save Changes' : 'Create Sprint')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Task Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingTaskId ? 'Edit Task' : 'Assign New Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Task Title</Form.Label>
              <Form.Control type="text" placeholder="Task summary" className="shadow-none" value={taskForm.taskName} onChange={e => setTaskForm({ ...taskForm, taskName: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Description</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="Task details..." className="shadow-none" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </Form.Group>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Priority</Form.Label>
                  <Form.Select className="shadow-none" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {TASK_PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Due Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Sprint</Form.Label>
              <Form.Select className="shadow-none" value={taskForm.sprintId} onChange={e => setTaskForm({ ...taskForm, sprintId: e.target.value })}>
                <option value="">Backlog (No Sprint)</option>
                {sprints.map(s => <option key={s._id} value={s._id}>{s.sprintName}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Assign To</Form.Label>
              <Form.Select className="shadow-none" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {(() => {
                  const grouped = {};
                  projectMembers.forEach(m => {
                    const roleLabel = (m.roleLabel || 'Member').toUpperCase();
                    if (!grouped[roleLabel]) grouped[roleLabel] = [];
                    grouped[roleLabel].push(m);
                  });
                  return Object.entries(grouped).map(([roleLabel, members]) => (
                    <optgroup key={roleLabel} label={`— ${roleLabel} (${members.length}) —`}>
                      {members.map(m => (
                        <option key={m._id} value={m._id}>
                          {getDisplayName(m)} {m.employeeCode ? `(${m.employeeCode})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowTaskModal(false)} disabled={savingTask}>Cancel</Button>
          <Button variant="primary" onClick={saveTask} disabled={savingTask} className="pm-primary-btn">
            {savingTask ? <Spinner animation="border" size="sm" /> : (editingTaskId ? 'Save Changes' : 'Create Task')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Task Completion Modal */}
      <Modal show={showCompletionModal} onHide={() => setShowCompletionModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-success d-flex align-items-center gap-2">
            <FaCheckCircle /> Mark Task as Completed
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            You are completing <strong>"{taskToComplete?.taskName}"</strong>. Please enter an optional completion note below.
          </p>
          <Form.Group>
            <Form.Label className="small fw-bold">Completion Note / Remarks (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Summary of work delivered, PR links, test status, etc."
              value={completionNote}
              onChange={e => setCompletionNote(e.target.value)}
              className="shadow-none"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowCompletionModal(false)} disabled={savingCompletion}>Cancel</Button>
          <Button variant="success" onClick={submitTaskCompletion} disabled={savingCompletion} className="rounded-pill px-4">
            {savingCompletion ? <Spinner animation="border" size="sm" /> : 'Mark Completed'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Member Modal */}
      <Modal show={showMemberModal} onHide={() => setShowMemberModal(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Assign Team Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {companyUsersLoading ? (
              <div className="d-flex align-items-center gap-2 text-muted small py-3">
                <Spinner animation="border" size="sm" /> Loading company users...
              </div>
            ) : (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Filter by Role</Form.Label>
                  <Form.Select
                    className="shadow-none"
                    value={memberRoleFilter}
                    onChange={e => {
                      setMemberRoleFilter(e.target.value);
                      setMemberForm({ ...memberForm, newMemberId: '' });
                    }}
                  >
                    <option value="all">All Roles ({availableUsers.length} available users)</option>
                    {availableRoles.map(role => {
                      const count = availableUsers.filter(u => (u.role?.roleName || u.roleCode || 'Other') === role).length;
                      return (
                        <option key={role} value={role}>
                          {role.toUpperCase()} ({count} users)
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold">Select Team Member</Form.Label>
                  <Form.Select
                    className="shadow-none"
                    value={memberForm.newMemberId}
                    onChange={e => setMemberForm({ ...memberForm, newMemberId: e.target.value })}
                  >
                    <option value="">Select a user...</option>
                    {(() => {
                      const grouped = {};
                      filteredAvailableUsers.forEach(u => {
                        const roleTitle = (u.role?.roleName || u.roleCode || 'Other').toUpperCase();
                        if (!grouped[roleTitle]) grouped[roleTitle] = [];
                        grouped[roleTitle].push(u);
                      });

                      return Object.entries(grouped).map(([roleTitle, users]) => (
                        <optgroup key={roleTitle} label={`— ${roleTitle} (${users.length}) —`}>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>
                              {u.firstName} {u.lastName} {u.employeeCode ? `(${u.employeeCode})` : (u.email ? `(${u.email})` : '')}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </Form.Select>
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowMemberModal(false)} disabled={savingMember}>Cancel</Button>
          <Button variant="primary" onClick={addMember} disabled={savingMember || companyUsersLoading || !memberForm.newMemberId} className="pm-primary-btn">
            {savingMember ? <Spinner animation="border" size="sm" /> : 'Add Member'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}

// Helper functions
function getId(value) {
  if (!value) return '';
  return typeof value === 'object' ? value._id : value;
}

function getDisplayName(user) {
  if (!user) return 'Unknown';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
}

function getInitials(user) {
  if (!user) return '?';
  const f = (user.firstName || '').charAt(0);
  const l = (user.lastName || '').charAt(0);
  return (f + l).toUpperCase() || '?';
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default ProjectManagement;