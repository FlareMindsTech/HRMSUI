import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal,
  Dropdown, Spinner, Alert
} from 'react-bootstrap';
import {
  FaProjectDiagram, FaTasks, FaRunning, FaPlus, FaRegClock, FaUsers,
  FaEllipsisV, FaEdit, FaTrash, FaArrowLeft, FaTimes, FaExclamationTriangle,
  FaCheckCircle, FaUserPlus, FaInbox, FaCalendarAlt
} from 'react-icons/fa';
import { apiFetch } from '../../config/api';
import './ProjectManagement.css';

// ============================================================
// Project Management — Project / Sprint / Task module
// Wired to real backend: /project, /sprint, /task, /user routes.
// NOTE (for the team): Login/Auth is owned by another developer.
// This file only reads the token that Login.js is expected to
// save to localStorage under the "token" key (see config/api.js).
// No auth/login logic is touched here.
// ============================================================

const PROJECT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'On Hold'];
const SPRINT_STATUS_OPTIONS = ['Planned', 'Active', 'Completed'];
const TASK_STATUS_OPTIONS = ['To Do', 'In Progress', 'Testing', 'Completed'];
const TASK_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const emptyProjectForm = { projectName: '', description: '', startDate: '', endDate: '', status: 'Pending' };
const emptySprintForm = { sprintName: '', startDate: '', endDate: '', status: 'Planned' };
const emptyTaskForm = { taskName: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '', sprintId: '' };
const emptyMemberForm = { newMemberId: '' };

function ProjectManagement() {
  // ---------- responsive ----------
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ---------- data ----------
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

  // ---------- filters ----------
  const [sprintFilter, setSprintFilter] = useState('all'); // 'all' | 'backlog' | sprintId
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // ---------- feedback (success/error banner) ----------
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'danger', message }
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    window.clearTimeout(showFeedback._t);
    showFeedback._t = window.setTimeout(() => setFeedback(null), 4000);
  };

  // ---------- modals ----------
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

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
      const { ok, data } = await apiFetch('/project/getAllProjects');
      if (ok && data.success) {
        setProjects(data.data || []);
        if (selectIdAfter) setSelectedProjectId(selectIdAfter);
      } else {
        setProjectsError(data.message || 'Failed to load projects.');
      }
    } catch (e) {
      console.error(e);
      setProjectsError('Could not reach the server. Please check your connection.');
    } finally {
      setProjectsLoading(false);
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
      showFeedback('danger', 'Could not reach the server. Please check your connection.');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const fetchSprints = useCallback(async (projectId) => {
    if (!projectId) return;
    setSprintsLoading(true);
    try {
      const { ok, data } = await apiFetch(`/sprint/getByProject/${projectId}`);
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
      const { ok, data } = await apiFetch(`/task/getByProject/${projectId}`);
      if (ok && data.success) setTasks(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // NOTE: /user/get responds with { data, pagination } — no "success" flag,
  // unlike every Project/Sprint/Task endpoint. Handling that shape difference
  // here rather than touching UserController (owned by another dev).
  const fetchCompanyUsers = useCallback(async () => {
    setCompanyUsersLoading(true);
    try {
      const { ok, data } = await apiFetch('/user/get?limit=100');
      if (ok && Array.isArray(data.data)) setCompanyUsers(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCompanyUsersLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
      fetchSprints(selectedProjectId);
      fetchTasks(selectedProjectId);
      setSprintFilter('all');
      setTaskStatusFilter('all');
      if (isMobile) setMobileView('detail');
    } else {
      setProjectDetails(null);
      setSprints([]);
      setTasks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const refreshProjectContext = () => {
    fetchProjects();
    if (selectedProjectId) fetchProjectDetails(selectedProjectId);
  };

  // ============================================================
  // Project handlers
  // ============================================================
  const openCreateProject = () => {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
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
      const path = isEdit ? `/project/updateProject/${editingProjectId}` : '/project/create';
      const { ok, data } = await apiFetch(path, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(projectForm),
      });
      if (ok && data.success) {
        setShowProjectModal(false);
        showFeedback('success', isEdit ? 'Project updated successfully.' : 'Project created successfully.');
        await fetchProjects(data.data._id);
      } else {
        showFeedback('danger', data.message || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong. Please try again.');
    } finally {
      setSavingProject(false);
    }
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.projectName}"? This cannot be undone.`)) return;
    try {
      const { ok, data } = await apiFetch(`/project/deleteProject/${project._id}`, { method: 'DELETE' });
      if (ok && data.success) {
        showFeedback('success', 'Project deleted.');
        if (selectedProjectId === project._id) {
          setSelectedProjectId(null);
          if (isMobile) setMobileView('list');
        }
        fetchProjects();
      } else {
        showFeedback('danger', data.message || 'Failed to delete project.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong. Please try again.');
    }
  };

  // ============================================================
  // Sprint handlers
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
    if (!selectedProjectId) return;
    if (!sprintForm.sprintName.trim() || !sprintForm.startDate || !sprintForm.endDate) {
      showFeedback('danger', 'Sprint name, start date and end date are required.');
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
        setShowSprintModal(false);
        showFeedback('success', isEdit ? 'Sprint updated successfully.' : 'Sprint created successfully.');
        fetchSprints(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong. Please try again.');
    } finally {
      setSavingSprint(false);
    }
  };

  const deleteSprint = async (sprint) => {
    if (!window.confirm(`Delete sprint "${sprint.sprintName}"? Tasks linked to it will remain but lose their sprint tag.`)) return;
    try {
      const { ok, data } = await apiFetch(`/sprint/delete/${sprint._id}`, { method: 'DELETE' });
      if (ok && data.success) {
        showFeedback('success', 'Sprint deleted.');
        fetchSprints(selectedProjectId);
        fetchTasks(selectedProjectId);
        if (sprintFilter === sprint._id) setSprintFilter('all');
      } else {
        showFeedback('danger', data.message || 'Failed to delete sprint.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong. Please try again.');
    }
  };

  // ============================================================
  // Task handlers
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
    if (!selectedProjectId) return;
    if (!taskForm.taskName.trim()) {
      showFeedback('danger', 'Task title is required.');
      return;
    }
    setSavingTask(true);
    try {
      const isEdit = !!editingTaskId;
      const path = isEdit ? `/task/update/${editingTaskId}` : '/task/create';
      const payload = {
        taskName: taskForm.taskName,
        description: taskForm.description,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || undefined,
        assignedTo: taskForm.assignedTo || undefined,
        sprintId: taskForm.sprintId || undefined,
      };
      const body = isEdit ? payload : { ...payload, projectId: selectedProjectId };
      const { ok, data } = await apiFetch(path, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      if (ok && data.success) {
        setShowTaskModal(false);
        showFeedback('success', isEdit ? 'Task updated successfully.' : 'Task created successfully.');
        fetchTasks(selectedProjectId);
      } else {
        showFeedback('danger', data.message || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong. Please try again.');
    } finally {
      setSavingTask(false);
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
      showFeedback('danger', 'Something went wrong. Please try again.');
    }
  };

  const quickStatusChange = async (task, status) => {
    const prevTasks = tasks;
    setTasks(tasks.map(t => t._id === task._id ? { ...t, status } : t)); // optimistic
    try {
      const { ok, data } = await apiFetch(`/task/updateStatus/${task._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!ok || !data.success) {
        setTasks(prevTasks);
        showFeedback('danger', data.message || 'Failed to update status.');
      }
    } catch (e) {
      console.error(e);
      setTasks(prevTasks);
      showFeedback('danger', 'Something went wrong. Please try again.');
    }
  };

  // ============================================================
  // Member handlers
  // ============================================================
  const openAddMember = () => {
    setMemberForm(emptyMemberForm);
    setShowMemberModal(true);
    if (companyUsers.length === 0) fetchCompanyUsers();
  };

  const addMember = async () => {
    if (!selectedProjectId) return;
    if (!memberForm.newMemberId) {
      showFeedback('danger', 'Please select a user to add.');
      return;
    }
    setSavingMember(true);
    try {
      const { ok, data } = await apiFetch('/project/addMember', {
        method: 'POST',
        body: JSON.stringify({ projectId: selectedProjectId, newMemberId: memberForm.newMemberId }),
      });
      if (ok && data.success) {
        setShowMemberModal(false);
        showFeedback('success', 'Member added successfully.');
        fetchProjectDetails(selectedProjectId);
        fetchProjects();
      } else {
        showFeedback('danger', data.message || 'Failed to add member.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('danger', 'Something went wrong. Please try again.');
    } finally {
      setSavingMember(false);
    }
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${getDisplayName(member)} from this project?`)) return;
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
      showFeedback('danger', 'Something went wrong. Please try again.');
    }
  };

  // ============================================================
  // Derived data
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

  // ============================================================
  // Badges & small helpers
  // ============================================================
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

  const backToList = () => {
    setMobileView('list');
  };

  // ============================================================
  // Render
  // ============================================================
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
          <h4 className="fw-bold mb-0 pm-page-title">Project Management</h4>
          <p className="text-muted small mb-0">Oversee projects, manage sprints, and track team tasks seamlessly.</p>
        </Col>
        <Col xs={12} md={5} className="d-flex justify-content-md-end">
          <Button
            variant="primary"
            className="pm-new-project-btn rounded-pill gradient-bg px-4 py-2 shadow-sm d-flex align-items-center gap-2 justify-content-center"
            onClick={openCreateProject}
          >
            <FaPlus /> New Project
          </Button>
        </Col>
      </Row>

      {projectsError && (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between py-2 shadow-sm mb-3">
          <span className="small d-flex align-items-center gap-2"><FaExclamationTriangle /> {projectsError}</span>
          <Button size="sm" variant="outline-danger" onClick={() => fetchProjects()}>Retry</Button>
        </Alert>
      )}

      <Row className="g-3">
        {/* ---------------- Projects list ---------------- */}
        {showList && (
          <Col xs={12} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3">
                <h6 className="fw-bold small text-uppercase text-muted mb-3">All Projects</h6>

                {projectsLoading && (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" size="sm" className="pm-spinner" />
                  </div>
                )}

                {!projectsLoading && !projectsError && projects.length === 0 && (
                  <div className="pm-empty-state">
                    <FaInbox size={28} className="pm-empty-icon" />
                    <p className="small mb-2">No projects yet.</p>
                    <Button size="sm" variant="outline-primary" className="pm-outline-btn" onClick={openCreateProject}>
                      Create your first project
                    </Button>
                  </div>
                )}

                <div className="d-flex flex-column gap-2">
                  {projects.map(project => (
                    <div
                      key={project._id}
                      onClick={() => selectProject(project)}
                      className={`pm-project-card${selectedProjectId === project._id ? ' pm-active' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="flex-grow-1 pm-min-w-0">
                          <p className="pm-project-name text-truncate" title={project.projectName}>{project.projectName}</p>
                          {getStatusBadge(project.status)}
                        </div>
                        <div className="d-flex gap-1 flex-shrink-0">
                          <Button
                            size="sm" variant="light" className="pm-icon-btn"
                            onClick={(e) => { e.stopPropagation(); openEditProject(project); }}
                            title="Edit project"
                          >
                            <FaEdit size={12} />
                          </Button>
                          <Button
                            size="sm" variant="light" className="pm-icon-btn pm-danger"
                            onClick={(e) => { e.stopPropagation(); deleteProject(project); }}
                            title="Delete project"
                          >
                            <FaTrash size={12} />
                          </Button>
                        </div>
                      </div>
                      {project.projectManager && (
                        <p className="pm-project-pm-label">
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

        {/* ---------------- Selected project detail ---------------- */}
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
                  <p className="mb-0">Select a project from the list to view sprints, tasks, and team members.</p>
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
                {/* Project header card */}
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                      <div className="pm-min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h5 className="fw-bold mb-0">{projectDetails.projectName}</h5>
                          {getStatusBadge(projectDetails.status)}
                        </div>
                        {projectDetails.description && (
                          <p className="text-muted small mb-2 mt-1">{projectDetails.description}</p>
                        )}
                        <div className="pm-meta-row">
                          <span className="pm-meta-item"><FaCalendarAlt /> {formatDate(projectDetails.startDate)} — {formatDate(projectDetails.endDate)}</span>
                          <span className="pm-meta-item"><FaUsers /> {projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}</span>
                          <span className="pm-meta-item"><FaRunning /> {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}</span>
                          <span className="pm-meta-item"><FaTasks /> {taskCounts.completed}/{taskCounts.total} tasks done</span>
                        </div>
                      </div>

                      <Dropdown align="end">
                        <Dropdown.Toggle as={Button} variant="light" size="sm" className="border-0 px-2">
                          <FaEllipsisV />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openEditProject(projectDetails)} className="d-flex align-items-center gap-2">
                            <FaEdit /> Edit Project
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => deleteProject(projectDetails)} className="d-flex align-items-center gap-2 text-danger">
                            <FaTrash /> Delete Project
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </Card.Body>
                </Card>

                {/* Members */}
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="pm-section-title">Team Members</h6>
                      <Button
                        size="sm" variant="outline-primary" className="pm-outline-btn d-flex align-items-center gap-1 rounded-pill"
                        onClick={openAddMember}
                      >
                        <FaUserPlus size={12} /> Add
                      </Button>
                    </div>

                    {projectMembers.length === 0 && (
                      <p className="text-muted small mb-0">No members assigned yet.</p>
                    )}

                    <div className="d-flex flex-wrap gap-2">
                      {projectMembers.map((member, idx) => (
                        <div
                          key={`${member.roleKey}-${member._id || idx}`}
                          className="pm-member-chip"
                        >
                          <div className="pm-avatar">
                            {getInitials(member)}
                          </div>
                          <div>
                            <div className="pm-member-name">{getDisplayName(member)}</div>
                            <div className="pm-member-role">{member.roleLabel}</div>
                          </div>
                          <Button
                            size="sm" variant="link" className="p-0 text-muted"
                            onClick={() => removeMember(member)}
                            title="Remove member"
                          >
                            <FaTimes size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>

                {/* Sprints */}
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="pm-section-title">Sprints</h6>
                      <Button
                        size="sm" variant="outline-primary" className="pm-outline-btn d-flex align-items-center gap-1 rounded-pill"
                        onClick={openCreateSprint}
                      >
                        <FaPlus size={12} /> New Sprint
                      </Button>
                    </div>

                    {sprintsLoading && (
                      <div className="d-flex justify-content-center py-3">
                        <Spinner animation="border" size="sm" className="pm-spinner" />
                      </div>
                    )}

                    {!sprintsLoading && sprints.length === 0 && (
                      <p className="text-muted small mb-0">No sprints yet. Create one to start planning work.</p>
                    )}

                    <Row className="g-2">
                      {sprints.map(sprint => (
                        <Col xs={12} sm={6} lg={4} key={sprint._id}>
                          <div className="pm-sprint-card">
                            <div className="d-flex justify-content-between align-items-start gap-1">
                              <p className="pm-sprint-name text-truncate" title={sprint.sprintName}>{sprint.sprintName}</p>
                              <div className="d-flex gap-1 flex-shrink-0">
                                <Button size="sm" variant="light" className="pm-icon-btn" onClick={() => openEditSprint(sprint)} title="Edit sprint">
                                  <FaEdit size={11} />
                                </Button>
                                <Button size="sm" variant="light" className="pm-icon-btn pm-danger" onClick={() => deleteSprint(sprint)} title="Delete sprint">
                                  <FaTrash size={11} />
                                </Button>
                              </div>
                            </div>
                            {getStatusBadge(sprint.status)}
                            <p className="pm-sprint-dates">
                              {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                            </p>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>

                {/* Tasks */}
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h6 className="pm-section-title">Tasks</h6>
                      <Button
                        size="sm" variant="outline-primary" className="pm-outline-btn d-flex align-items-center gap-1 rounded-pill"
                        onClick={openCreateTask}
                      >
                        <FaPlus size={12} /> New Task
                      </Button>
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

                    {/* Desktop/tablet: table. Mobile: stacked cards. */}
                    {!tasksLoading && filteredTasks.length > 0 && !isMobile && (
                      <div className="pm-scroll-x">
                        <Table hover responsive className="align-middle mb-0">
                          <thead>
                            <tr className="text-muted small text-uppercase">
                              <th>Task</th>
                              <th>Sprint</th>
                              <th>Assignee</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Due</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTasks.map(task => (
                              <tr key={task._id}>
                                <td className="fw-bold small">{task.taskName}</td>
                                <td className="small text-muted">{getSprintName(task.sprintId) || 'Backlog'}</td>
                                <td className="small">{task.assignedTo ? getDisplayName(task.assignedTo) : <span className="text-muted">Unassigned</span>}</td>
                                <td>{getPriorityBadge(task.priority)}</td>
                                <td>
                                  <Form.Select
                                    size="sm" className="shadow-none pm-status-select"
                                    value={task.status}
                                    onChange={e => quickStatusChange(task, e.target.value)}
                                  >
                                    {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                  </Form.Select>
                                </td>
                                <td className="small text-muted">{formatDate(task.dueDate)}</td>
                                <td>
                                  <div className="d-flex gap-1 justify-content-end">
                                    <Button size="sm" variant="light" className="pm-icon-btn" onClick={() => openEditTask(task)} title="Edit task">
                                      <FaEdit size={12} />
                                    </Button>
                                    <Button size="sm" variant="light" className="pm-icon-btn pm-danger" onClick={() => deleteTask(task)} title="Delete task">
                                      <FaTrash size={12} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}

                    {!tasksLoading && filteredTasks.length > 0 && isMobile && (
                      <div className="d-flex flex-column gap-2">
                        {filteredTasks.map(task => (
                          <div key={task._id} className="pm-task-card">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <p className="pm-task-title">{task.taskName}</p>
                              <div className="d-flex gap-1 flex-shrink-0">
                                <Button size="sm" variant="light" className="pm-icon-btn" onClick={() => openEditTask(task)} title="Edit task">
                                  <FaEdit size={12} />
                                </Button>
                                <Button size="sm" variant="light" className="pm-icon-btn pm-danger" onClick={() => deleteTask(task)} title="Delete task">
                                  <FaTrash size={12} />
                                </Button>
                              </div>
                            </div>
                            <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                              {getPriorityBadge(task.priority)}
                              <span className="text-muted small">{getSprintName(task.sprintId) || 'Backlog'}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                              <span className="small text-muted">
                                {task.assignedTo ? getDisplayName(task.assignedTo) : 'Unassigned'}
                                {task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ''}
                              </span>
                              <Form.Select
                                size="sm" className="shadow-none pm-task-status-select"
                                value={task.status}
                                onChange={e => quickStatusChange(task, e.target.value)}
                              >
                                {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                              </Form.Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </Col>
        )}
      </Row>

      {/* ============================================================
          Project Modal (Create / Edit)
      ============================================================ */}
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

      {/* ============================================================
          Sprint Modal (Create / Edit)
      ============================================================ */}
      <Modal show={showSprintModal} onHide={() => setShowSprintModal(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingSprintId ? 'Edit Sprint' : 'Create New Sprint'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Sprint Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Sprint 3 - QA" className="shadow-none" value={sprintForm.sprintName} onChange={e => setSprintForm({ ...sprintForm, sprintName: e.target.value })} />
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

      {/* ============================================================
          Task Modal (Create / Edit)
      ============================================================ */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered fullscreen="sm-down">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingTaskId ? 'Edit Task' : 'Assign New Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Task Title</Form.Label>
              <Form.Control type="text" placeholder="What needs to be done?" className="shadow-none" value={taskForm.taskName} onChange={e => setTaskForm({ ...taskForm, taskName: e.target.value })} />
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
              {projectMembers.length === 0 && (
                <Form.Text className="text-muted pm-hint-text">
                  Add team members to this project first to assign tasks.
                </Form.Text>
              )}
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

      {/* ============================================================
          Add Member Modal
      ============================================================ */}
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
              <Form.Text className="text-muted mt-2 d-block pm-hint-text">
                The user's project role (Project Manager / Team Lead / Software Developer / Intern) is taken from
                their assigned HRMS role automatically, based on priority rules — it isn't chosen here.
              </Form.Text>
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

// ============================================================
// Small pure helpers
// ============================================================
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