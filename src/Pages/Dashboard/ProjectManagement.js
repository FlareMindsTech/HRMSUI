import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal,
  Dropdown, Spinner, Alert, Nav, Tab
} from 'react-bootstrap';
import {
  FaProjectDiagram, FaTasks, FaRunning, FaPlus, FaRegClock, FaUsers,
  FaEllipsisV, FaEdit, FaTrash, FaArrowLeft, FaTimes, FaExclamationTriangle,
  FaCheckCircle, FaUserPlus, FaInbox, FaCalendarAlt, FaFileAlt, FaPaperPlane
} from 'react-icons/fa';
import { apiFetch } from '../../config/api';
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
  shift: 'First Half',
  title: '',
  description: '',
  preference: 'Work from Office',
  referenceLink: '',
};

const PROJECT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'On Hold'];
const SPRINT_STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed'];
const TASK_STATUS_OPTIONS = ['To Do', 'In Progress', 'Testing', 'Completed'];
const TASK_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const ALL_PROJECT_PERMISSIONS = [
  'project.read', 'project.create', 'project.update',
  'project.delete', 'project.add_member', 'project.remove_member'
];

function ProjectManagement() {
  const { user, permissions, hasPermission } = useAuth();

  // Role & Capability determination
  const userPriority = user?.priority ?? user?.role?.priority;
  const userPermissions = permissions || user?.permissions || [];

  const isOwnerOrAdmin = userPriority === 1 || userPriority === 2 || user?.roleCode === 'OWNER' || user?.roleCode === 'ADMIN' || userPermissions.includes('*');
  const isProjectManager = userPriority === 3 && (
    userPermissions.includes('*') ||
    ALL_PROJECT_PERMISSIONS.every(p => userPermissions.includes(p))
  );
  const isEmployee = !isOwnerOrAdmin && !isProjectManager;

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

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Responsive / Mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  // Filters
  const [sprintFilter, setSprintFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // Feedback banner
  const [feedback, setFeedback] = useState(null);
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    window.clearTimeout(showFeedback._t);
    showFeedback._t = window.setTimeout(() => setFeedback(null), 4000);
  };

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

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

  // ============================================================
  // Fetchers
  // ============================================================
  const fetchProjects = useCallback(async (selectIdAfter) => {
    setProjectsLoading(true);
    setProjectsError('');
    try {
      const endpoint = isOwnerOrAdmin ? '/project/getAllProjects' : '/project/getMyProjects';
      const { ok, data } = await apiFetch(endpoint);
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
      const { ok, data } = await apiFetch('/project/getEligiblePMs');
      if (ok && data.success) setEligiblePMs(data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchProjectDetails = useCallback(async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    try {
      const { ok, data } = await apiFetch(`/project/getProjectDetails/${id}`);
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
  }, []);

  const fetchSprints = useCallback(async (projectId) => {
    if (!projectId) return;
    setSprintsLoading(true);
    try {
      const { ok, data } = await apiFetch(`/sprint/project/${projectId}`);
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
      const { ok, data } = await apiFetch(`/task/project/${projectId}`);
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
      const { ok, data } = await apiFetch('/project/getCompanyUsers');
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
      const { ok, data } = await apiFetch(`/daily-report/project/${projectId}`);
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
      if (isMobile) setMobileView('detail');
    } else {
      setProjectDetails(null);
      setSprints([]);
      setTasks([]);
      setProjectReports([]);
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
      const path = isEdit ? `/project/updateProject/${editingProjectId}` : '/project/create';
      const { ok, data } = await apiFetch(path, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

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
      const { ok, data } = await apiFetch(`/project/deleteProject/${project._id}`, { method: 'DELETE' });
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
      const path = isEdit ? `/sprint/update/${editingSprintId}` : '/sprint/create';
      const body = isEdit ? sprintForm : { ...sprintForm, projectId: selectedProjectId };
      const { ok, data } = await apiFetch(path, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });

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
      const { ok, data } = await apiFetch(`/sprint/delete/${sprint._id}`, { method: 'DELETE' });
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
      const path = isEdit ? `/task/${editingTaskId}` : '/task/create';
      const payload = isEdit ? taskForm : {
        ...taskForm,
        projectId: selectedProjectId,
        sprintId: taskForm.sprintId || undefined,
        assignedTo: taskForm.assignedTo || undefined,
      };

      const { ok, data } = await apiFetch(path, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

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
      const { ok, data } = await apiFetch(`/task/${task._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
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
      const { ok, data } = await apiFetch(`/task/${taskToComplete._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Completed', completionNote }),
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
      const { ok, data } = await apiFetch(`/task/delete/${task._id}`, { method: 'DELETE' });
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
      const { ok, data } = await apiFetch('/project/addMember', {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProjectId,
          newMemberId: memberForm.newMemberId,
        }),
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
      const { ok, data } = await apiFetch('/project/removeMember', {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProjectId,
          memberId: member._id,
          memberRole: member.roleKey,
        }),
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
    if (!dailyReportForm.title.trim() || !dailyReportForm.description.trim()) {
      showFeedback('danger', 'Title and description are required for Daily Report.');
      return;
    }
    setSubmittingReport(true);
    try {
      const payload = {
        ...dailyReportForm,
        projectId: selectedProjectId,
      };
      const { ok, data } = await apiFetch('/daily-report/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
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

        {/* Selected project detail workspace */}
        {showDetail && (
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
                          <span><FaUsers /> {projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}</span>
                          <span><FaRunning /> {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}</span>
                          <span><FaTasks /> {taskCounts.completed}/{taskCounts.total} tasks completed</span>
                        </div>
                      </div>

                      {(isOwnerOrAdmin || (isProjectManager && getId(projectDetails.projectManager) === user?.id)) && (
                        <Dropdown align="end">
                          <Dropdown.Toggle as={Button} variant="light" size="sm" className="border-0 px-2">
                            <FaEllipsisV />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => openEditProject(projectDetails)} className="d-flex align-items-center gap-2">
                              <FaEdit /> Edit Project
                            </Dropdown.Item>
                            {isOwnerOrAdmin && (
                              <Dropdown.Item onClick={() => deleteProject(projectDetails)} className="d-flex align-items-center gap-2 text-danger">
                                <FaTrash /> Delete Project
                              </Dropdown.Item>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </div>
                  </Card.Body>
                </Card>

                {/* Workspace Navigation Tabs */}
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                  <Nav variant="pills" className="bg-white p-2 rounded shadow-sm mb-3 gap-2">
                    <Nav.Item>
                      <Nav.Link eventKey="overview" className="rounded-pill px-3 py-1 small">Overview & Members</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="sprints" className="rounded-pill px-3 py-1 small">Sprints ({sprints.length})</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="tasks" className="rounded-pill px-3 py-1 small">Tasks ({tasks.length})</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="reports" className="rounded-pill px-3 py-1 small">
                        <FaFileAlt className="me-1" /> Daily Reports ({projectReports.length})
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    {/* OVERVIEW & MEMBERS TAB */}
                    <Tab.Pane eventKey="overview">
                      <Card className="border-0 shadow-sm mb-3">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0 text-uppercase small text-muted">Team Members</h6>
                            {(isOwnerOrAdmin || isProjectManager) && (
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
                                {(isOwnerOrAdmin || isProjectManager) && (
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
                            {(isOwnerOrAdmin || isProjectManager) && (
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
                              <Col xs={12} sm={6} lg={4} key={sprint._id}>
                                <div className="pm-sprint-card border rounded p-3 bg-light">
                                  <div className="d-flex justify-content-between align-items-start gap-1 mb-2">
                                    <p className="pm-sprint-name text-truncate fw-bold mb-0" title={sprint.sprintName}>{sprint.sprintName}</p>
                                    {(isOwnerOrAdmin || isProjectManager) && (
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
                            {(isOwnerOrAdmin || isProjectManager) && (
                              <Button
                                size="sm" variant="outline-primary" className="pm-outline-btn d-flex align-items-center gap-1 rounded-pill"
                                onClick={openCreateTask}
                              >
                                <FaPlus size={12} /> New Task
                              </Button>
                            )}
                          </div>

                          <Row className="g-2 mb-3">
                            <Col xs={6} md={4}>
                              <Form.Select size="sm" className="shadow-none" value={sprintFilter} onChange={e => setSprintFilter(e.target.value)}>
                                <option value="all">All Sprints</option>
                                <option value="backlog">Backlog (No Sprint)</option>
                                {sprints.map(s => <option key={s._id} value={s._id}>{s.sprintName}</option>)}
                              </Form.Select>
                            </Col>
                            <Col xs={6} md={4}>
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
                                    <th>Sprint</th>
                                    <th>Assignee</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Completion Info</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredTasks.map(task => {
                                    const isMyTask = task.assignedTo && getId(task.assignedTo) === user?.id;
                                    const canEditTaskDetails = isOwnerOrAdmin || isProjectManager;
                                    const canChangeStatus = isMyTask || canEditTaskDetails;

                                    return (
                                      <tr key={task._id}>
                                        <td>
                                          <div className="fw-bold small">{task.taskName}</div>
                                          {task.description && <div className="text-muted micro-text">{task.description}</div>}
                                        </td>
                                        <td className="small text-muted">{getSprintName(task.sprintId) || 'Backlog'}</td>
                                        <td className="small">{task.assignedTo ? getDisplayName(task.assignedTo) : <span className="text-muted">Unassigned</span>}</td>
                                        <td>{getPriorityBadge(task.priority)}</td>
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
                                        <td className="small">
                                          {task.status === 'Completed' && (
                                            <div className="text-success small">
                                              <div><FaCheckCircle /> {formatDate(task.completedAt)}</div>
                                              {task.completedBy && <div className="text-muted micro-text">By: {getDisplayName(task.completedBy)}</div>}
                                              {task.completionNote && <div className="fst-italic text-dark micro-text">"{task.completionNote}"</div>}
                                            </div>
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

                    {/* DAILY REPORTS TAB */}
                    <Tab.Pane eventKey="reports">
                      <Row className="g-3">
                        <Col xs={12} lg={4}>
                          <Card className="border-0 shadow-sm">
                            <Card.Body className="p-3">
                              <h6 className="fw-bold mb-3 small text-uppercase text-primary d-flex align-items-center gap-2">
                                <FaPaperPlane /> Submit Daily Report
                              </h6>
                              <Form onSubmit={submitProjectDailyReport}>
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold">Project</Form.Label>
                                  <Form.Control type="text" size="sm" readOnly value={projectDetails.projectName} className="bg-light" />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold">Report Date</Form.Label>
                                  <Form.Control type="date" size="sm" value={dailyReportForm.reportDate} onChange={e => setDailyReportForm({ ...dailyReportForm, reportDate: e.target.value })} required />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold">Shift</Form.Label>
                                  <Form.Select size="sm" value={dailyReportForm.shift} onChange={e => setDailyReportForm({ ...dailyReportForm, shift: e.target.value })}>
                                    <option value="First Half">First Half</option>
                                    <option value="Second Half">Second Half</option>
                                    <option value="Full Day">Full Day</option>
                                  </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold">Report Title</Form.Label>
                                  <Form.Control type="text" size="sm" placeholder="Work summary title" value={dailyReportForm.title} onChange={e => setDailyReportForm({ ...dailyReportForm, title: e.target.value })} required />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                  <Form.Label className="small fw-bold">Work Description</Form.Label>
                                  <Form.Control as="textarea" rows={3} size="sm" placeholder="Details of work completed..." value={dailyReportForm.description} onChange={e => setDailyReportForm({ ...dailyReportForm, description: e.target.value })} required />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                  <Form.Label className="small fw-bold">Reference Link (Optional)</Form.Label>
                                  <Form.Control type="url" size="sm" placeholder="https://..." value={dailyReportForm.referenceLink} onChange={e => setDailyReportForm({ ...dailyReportForm, referenceLink: e.target.value })} />
                                </Form.Group>
                                <Button type="submit" variant="primary" size="sm" className="w-100 rounded-pill" disabled={submittingReport}>
                                  {submittingReport ? <Spinner animation="border" size="sm" /> : 'Submit Report'}
                                </Button>
                              </Form>
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col xs={12} lg={8}>
                          <Card className="border-0 shadow-sm">
                            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <h6 className="fw-bold mb-0 small text-uppercase text-muted">
                                  Project Reports ({filteredReports.length})
                                </h6>
                                {(isOwnerOrAdmin || isProjectManager) && projectMembers.length > 0 && (
                                  <Form.Select
                                    size="sm" style={{ width: 'auto' }}
                                    value={selectedMemberFilter}
                                    onChange={e => setSelectedMemberFilter(e.target.value)}
                                  >
                                    <option value="all">All Team Members</option>
                                    {projectMembers.map(m => (
                                      <option key={m._id} value={m._id}>{getDisplayName(m)} ({m.roleLabel})</option>
                                    ))}
                                  </Form.Select>
                                )}
                              </div>

                              {reportsLoading && (
                                <div className="d-flex justify-content-center py-4">
                                  <Spinner animation="border" size="sm" />
                                </div>
                              )}

                              {!reportsLoading && filteredReports.length === 0 && (
                                <p className="text-muted small mb-0">No daily reports submitted for this project yet.</p>
                              )}

                              {!reportsLoading && filteredReports.length > 0 && (
                                <div className="d-flex flex-column gap-2">
                                  {filteredReports.map(report => (
                                    <div key={report._id} className="border rounded p-3 bg-light">
                                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                                        <h6 className="fw-bold small mb-0">{report.title}</h6>
                                        <Badge bg="info" text="dark" className="rounded-pill">{report.shift}</Badge>
                                      </div>
                                      <p className="small text-muted mb-2">{report.description}</p>
                                      <div className="d-flex justify-content-between align-items-center text-muted micro-text" style={{ fontSize: 11 }}>
                                        <span>Submitted by: <strong>{getDisplayName(report.submittedBy)}</strong></span>
                                        <span>Date: {formatDate(report.reportDate)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </>
            )}
          </Col>
        )}
      </Row>

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
                  {eligiblePMs.map(pm => (
                    <option key={pm._id} value={pm._id}>
                      {pm.firstName} {pm.lastName} ({pm.employeeCode || pm.email})
                    </option>
                  ))}
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
                {projectMembers.map(m => <option key={m._id} value={m._id}>{getDisplayName(m)} ({m.roleLabel})</option>)}
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
            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold">Select User</Form.Label>
              {companyUsersLoading ? (
                <div className="d-flex align-items-center gap-2 text-muted small py-2">
                  <Spinner animation="border" size="sm" /> Loading users...
                </div>
              ) : (
                <Form.Select className="shadow-none" value={memberForm.newMemberId} onChange={e => setMemberForm({ ...memberForm, newMemberId: e.target.value })}>
                  <option value="">Select a user...</option>
                  {availableUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.firstName} {u.lastName} {u.role?.roleName ? `— ${u.role.roleName}` : ''}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowMemberModal(false)} disabled={savingMember}>Cancel</Button>
          <Button variant="primary" onClick={addMember} disabled={savingMember || companyUsersLoading} className="pm-primary-btn">
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