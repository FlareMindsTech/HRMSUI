import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal, OverlayTrigger, Tooltip, Spinner, Alert
} from 'react-bootstrap';
import {
  FaProjectDiagram, FaTasks, FaRunning, FaPlus, FaRegClock, FaUsers, FaEllipsisV
} from 'react-icons/fa';
import { API_BASE_URL, authHeaders } from '../../config/api';

function ProjectManagement() {
  // --- Core data (now loaded from backend, not hardcoded) ---
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [projectDetails, setProjectDetails] = useState(null); // full project doc with populated members
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]); // used for Add Member dropdown

  // --- Loading / error states ---
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [detailsError, setDetailsError] = useState('');

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [newProject, setNewProject] = useState({ projectName: '', description: '', startDate: '', endDate: '' });
  const [newSprint, setNewSprint] = useState({ sprintName: '', startDate: '', endDate: '', status: 'Planned' });
  const [newTask, setNewTask] = useState({ taskName: '', priority: 'High', dueDate: '', assignedTo: '' });
  const [newMember, setNewMember] = useState({ newMemberId: '', role: 'Project Manager' });

  // ----------------------------------------------------------------
  // GET: All projects (left panel list)
  // ----------------------------------------------------------------
  const fetchProjects = useCallback(async (preserveSelectionId) => {
    setLoadingProjects(true);
    setProjectsError('');
    try {
      const res = await fetch(`${API_BASE_URL}/project/getAllProjects`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
        setSelectedProject(prev => {
          const keepId = preserveSelectionId || prev?._id;
          const stillExists = keepId ? data.data.find(p => p._id === keepId) : null;
          return stillExists || data.data[0] || null;
        });
      } else {
        setProjectsError(data.message || "Failed to load projects");
      }
    } catch (e) {
      console.error(e);
      setProjectsError("Unable to reach the server. Please check your connection.");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // GET: Project details (members) + Sprints + Tasks for selected project
  // ----------------------------------------------------------------
  const fetchProjectDetails = useCallback(async (projectId) => {
    if (!projectId) {
      setProjectDetails(null);
      setSprints([]);
      setTasks([]);
      return;
    }
    setLoadingDetails(true);
    setDetailsError('');
    try {
      const [detailsRes, sprintsRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/project/getProjectDetails/${projectId}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/sprint/getByProject/${projectId}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/task/getByProject/${projectId}`, { headers: authHeaders() }),
      ]);

      const detailsData = await detailsRes.json();
      const sprintsData = await sprintsRes.json();
      const tasksData = await tasksRes.json();

      if (detailsData.success) setProjectDetails(detailsData.data);
      else setDetailsError(detailsData.message || "Failed to load project details");

      if (sprintsData.success) setSprints(sprintsData.data);
      if (tasksData.success) setTasks(tasksData.data);
    } catch (e) {
      console.error(e);
      setDetailsError("Unable to reach the server. Please check your connection.");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // GET: Company users (for Add Member dropdown)
  // ----------------------------------------------------------------
  const fetchCompanyUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/get?limit=100`, {
        headers: authHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setCompanyUsers(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchCompanyUsers();
  }, [fetchProjects, fetchCompanyUsers]);

  useEffect(() => {
    fetchProjectDetails(selectedProject?._id);
  }, [selectedProject?._id, fetchProjectDetails]);

  // ----------------------------------------------------------------
  // Derived: real project team members (from populated projectDetails)
  // ----------------------------------------------------------------
  const projectMembers = projectDetails ? [
    ...(projectDetails.projectManager ? [{ ...projectDetails.projectManager, roleLabel: 'Project Manager' }] : []),
    ...(projectDetails.teamLeads || []).filter(m => m.userId).map(m => ({ ...m.userId, roleLabel: 'Team Lead' })),
    ...(projectDetails.softwareDevelopers || []).filter(m => m.userId).map(m => ({ ...m.userId, roleLabel: 'Software Developer' })),
    ...(projectDetails.interns || []).filter(m => m.userId).map(m => ({ ...m.userId, roleLabel: 'Intern' })),
  ] : [];

  const getTeamSize = (proj) => {
    return (proj.projectManager ? 1 : 0)
      + (proj.teamLeads?.length || 0)
      + (proj.softwareDevelopers?.length || 0)
      + (proj.interns?.length || 0);
  };

  // ----------------------------------------------------------------
  // Create actions (unchanged endpoints/logic) — now re-fetch fresh
  // data from the server on success instead of faking local state.
  // ----------------------------------------------------------------
  const handleCreateProject = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/project/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(newProject)
      });
      const data = await res.json();
      if (data.success) {
        setShowProjectModal(false);
        setNewProject({ projectName: '', description: '', startDate: '', endDate: '' });
        fetchProjects(data.data._id);
      } else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleCreateSprint = async () => {
    if (!selectedProject) return alert("Select a project first");
    try {
      const res = await fetch(`${API_BASE_URL}/sprint/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...newSprint, projectId: selectedProject._id })
      });
      const data = await res.json();
      if (data.success) {
        setShowSprintModal(false);
        setNewSprint({ sprintName: '', startDate: '', endDate: '', status: 'Planned' });
        fetchProjectDetails(selectedProject._id);
      } else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleCreateTask = async () => {
    if (!selectedProject) return alert("Select a project first");
    try {
      const res = await fetch(`${API_BASE_URL}/task/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ...newTask, projectId: selectedProject._id })
      });
      const data = await res.json();
      if (data.success) {
        setShowTaskModal(false);
        setNewTask({ taskName: '', priority: 'High', dueDate: '', assignedTo: '' });
        fetchProjectDetails(selectedProject._id);
      } else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleAddMember = async () => {
    if (!selectedProject) return alert("Select a project first");
    try {
      const res = await fetch(`${API_BASE_URL}/project/addMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ projectId: selectedProject._id, newMemberId: newMember.newMemberId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Member added successfully!");
        setShowMemberModal(false);
        setNewMember({ newMemberId: '', role: 'Project Manager' });
        fetchProjectDetails(selectedProject._id);
        fetchProjects(selectedProject._id); // refresh member counts on left panel cards
      } else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return <Badge bg="danger">High</Badge>;
      case 'medium': return <Badge bg="warning" text="dark">Medium</Badge>;
      case 'low': return <Badge bg="info">Low</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <Badge bg="success" className="rounded-pill px-3">Completed</Badge>;
      case 'in progress':
      case 'active':
        return <Badge bg="primary" className="rounded-pill px-3">Active</Badge>;
      case 'planning':
      case 'planned':
      case 'pending':
      case 'to do':
        return <Badge bg="warning" className="rounded-pill px-3 text-dark">{status}</Badge>;
      default: return <Badge bg="secondary" className="rounded-pill px-3">{status}</Badge>;
    }
  };

  return (
    <Container fluid className="p-3 no-scrollbar" style={{ height: 'calc(100vh - var(--header-height))', overflowY: 'auto' }}>

      {/* Header Section */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h4 className="fw-bold mb-0" style={{ color: 'var(--primary-color)' }}>Project Management</h4>
          <p className="text-muted small mb-0">Oversee projects, manage sprints, and track team tasks seamlessly.</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" className="rounded-pill gradient-bg border-0 px-4 py-2 shadow-sm d-flex align-items-center gap-2"
                  style={{ backgroundColor: 'var(--primary-color)' }} onClick={() => setShowProjectModal(true)}>
            <FaPlus /> New Project
          </Button>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Left Side: Projects List */}
        <Col lg={4}>
          <Card className="premium-card border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                  <FaProjectDiagram size={20} />
                </div>
                <h5 className="fw-bold mb-0">My Projects</h5>
              </div>

              {projectsError && (
                <Alert variant="danger" className="small py-2">{projectsError}</Alert>
              )}

              {loadingProjects ? (
                <div className="text-center py-5">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <p className="text-muted small mt-2 mb-0">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-5">
                  <FaProjectDiagram size={32} className="text-muted mb-2 opacity-50" />
                  <p className="text-muted small mb-0">No projects yet. Create your first one!</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {projects.map((proj) => (
                    <div
                      key={proj._id}
                      className={`p-3 rounded-4 border transition-all cursor-pointer ${selectedProject?._id === proj._id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light bg-light hover-bg-white'}`}
                      onClick={() => setSelectedProject(proj)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0 text-dark">{proj.projectName}</h6>
                        {getStatusBadge(proj.status)}
                      </div>
                      <p className="text-muted small mb-3 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {proj.description}
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <FaRegClock /> {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : '—'}
                        </div>
                        <div className="d-flex align-items-center gap-1 text-muted small">
                          <FaUsers /> {getTeamSize(proj)} Members
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side: Project Details (Sprints & Tasks) */}
        <Col lg={8}>
          {selectedProject ? (
            <div className="d-flex flex-column gap-3 h-100">
              {/* Project Stats Banner */}
              <Card className="border-0 shadow-sm bg-white rounded-4 overflow-hidden">
                <div className="p-4 border-bottom border-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="fw-bold mb-1 text-dark">{selectedProject.projectName}</h4>
                      <p className="text-muted small mb-0">{selectedProject.description}</p>
                    </div>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Project Options</Tooltip>}>
                      <Button variant="light" className="rounded-circle p-2 shadow-none"><FaEllipsisV className="text-muted" /></Button>
                    </OverlayTrigger>
                  </div>
                </div>

                {detailsError && (
                  <Alert variant="danger" className="small py-2 m-3 mb-0">{detailsError}</Alert>
                )}

                <div className="d-flex">
                  <div className="flex-fill p-3 border-end border-light text-center">
                     <span className="text-muted small d-block mb-1">Total Sprints</span>
                     <h5 className="fw-bold mb-0 text-dark">{loadingDetails ? '—' : sprints.length}</h5>
                  </div>
                  <div className="flex-fill p-3 border-end border-light text-center">
                     <span className="text-muted small d-block mb-1">Active Tasks</span>
                     <h5 className="fw-bold mb-0 text-primary">{loadingDetails ? '—' : tasks.filter(t => t.status !== 'Completed').length}</h5>
                  </div>
                  <div className="flex-fill p-3 border-end border-light text-center">
                     <span className="text-muted small d-block mb-1">End Date</span>
                     <h5 className="fw-bold mb-0 text-dark">{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : '—'}</h5>
                  </div>
                  <div className="flex-fill p-3 text-center d-flex flex-column align-items-center justify-content-center">
                     <span className="text-muted small d-block mb-2">Team Members</span>
                     <div className="d-flex align-items-center justify-content-center">
                       {projectMembers.slice(0, 3).map((m, i) => (
                         <OverlayTrigger key={m._id || i} placement="top" overlay={<Tooltip>{m.firstName} {m.lastName} - {m.roleLabel}</Tooltip>}>
                           <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center border border-white" style={{width: 32, height: 32, fontSize: '0.8rem', marginLeft: i > 0 ? '-10px' : '0', zIndex: 10 - i, cursor: 'pointer'}}>
                             {m.firstName?.[0]}{m.lastName?.[0]}
                           </div>
                         </OverlayTrigger>
                       ))}
                       {projectMembers.length > 3 && (
                         <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center border border-white" style={{width: 32, height: 32, fontSize: '0.75rem', marginLeft: '-10px', zIndex: 1}}>
                           +{projectMembers.length - 3}
                         </div>
                       )}
                       {projectMembers.length === 0 && !loadingDetails && (
                         <span className="text-muted extra-small me-2">No members yet</span>
                       )}
                       <Button variant="outline-primary" className="rounded-circle p-0 d-flex flex-shrink-0 align-items-center justify-content-center ms-2" style={{width: 32, height: 32, minWidth: 32, minHeight: 32}} onClick={() => setShowMemberModal(true)}>
                         <FaPlus size={12} />
                       </Button>
                     </div>
                  </div>
                </div>
              </Card>

              {/* Workspace Split: Sprints & Tasks */}
              <Row className="g-3 flex-fill">
                {/* Sprints Column */}
                <Col md={12} lg={5} className="d-flex flex-column gap-3">
                  <Card className="premium-card border-0 shadow-sm flex-fill">
                     <Card.Body className="p-4 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success">
                              <FaRunning size={18} />
                            </div>
                            <h6 className="fw-bold mb-0">Sprints</h6>
                          </div>
                          <Button
                            variant="link"
                            className="text-primary p-0 shadow-none small text-decoration-none"
                            onClick={() => setShowSprintModal(true)}
                          >
                            <FaPlus /> New
                          </Button>
                        </div>

                        {loadingDetails ? (
                          <div className="text-center py-4">
                            <Spinner animation="border" size="sm" variant="primary" />
                          </div>
                        ) : sprints.length === 0 ? (
                          <p className="text-muted small text-center py-4 mb-0">No sprints yet for this project.</p>
                        ) : (
                          <div className="d-flex flex-column gap-2 overflow-auto no-scrollbar" style={{maxHeight: '300px'}}>
                            {sprints.map(sprint => (
                              <div key={sprint._id} className="p-3 border rounded-3 bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fw-bold text-dark small">{sprint.sprintName}</span>
                                  {getStatusBadge(sprint.status)}
                                </div>
                                <span className="text-muted extra-small">
                                  {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                     </Card.Body>
                  </Card>
                </Col>

                {/* Tasks Column */}
                <Col md={12} lg={7} className="d-flex flex-column gap-3">
                  <Card className="premium-card border-0 shadow-sm flex-fill">
                     <Card.Body className="p-4 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-info bg-opacity-10 p-2 rounded-3 text-info">
                              <FaTasks size={18} />
                            </div>
                            <h6 className="fw-bold mb-0">Tasks Board</h6>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
                            onClick={() => setShowTaskModal(true)}
                          >
                            <FaPlus /> Task
                          </Button>
                        </div>

                        {loadingDetails ? (
                          <div className="text-center py-4">
                            <Spinner animation="border" size="sm" variant="primary" />
                          </div>
                        ) : tasks.length === 0 ? (
                          <p className="text-muted small text-center py-4 mb-0">No tasks yet for this project.</p>
                        ) : (
                          <div className="table-responsive no-scrollbar flex-fill">
                            <Table borderless hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                              <thead className="text-muted border-bottom">
                                <tr>
                                  <th className="fw-medium py-2">Task</th>
                                  <th className="fw-medium py-2">Assigned</th>
                                  <th className="fw-medium py-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tasks.map(task => (
                                  <tr key={task._id} className="border-bottom-light">
                                    <td className="py-3">
                                      <div className="fw-bold text-dark mb-1">{task.taskName}</div>
                                      <div className="d-flex align-items-center gap-2">
                                        {getPriorityBadge(task.priority)}
                                        <span className="text-muted small px-1"><FaRegClock className="me-1"/>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      {task.assignedTo ? (
                                        <div className="d-flex align-items-center gap-2">
                                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: 28, height: 28, fontSize: '0.75rem'}}>
                                            {task.assignedTo.firstName?.[0]}{task.assignedTo.lastName?.[0]}
                                          </div>
                                          <span className="text-dark fw-medium">{task.assignedTo.firstName}</span>
                                        </div>
                                      ) : (
                                        <span className="text-muted small">Unassigned</span>
                                      )}
                                    </td>
                                    <td className="py-3">
                                      {getStatusBadge(task.status)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                     </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <Card className="border-0 shadow-sm h-100 d-flex align-items-center justify-content-center bg-light">
              <div className="text-center p-5">
                <FaProjectDiagram size={48} className="text-muted mb-3 opacity-50" />
                <h5 className="fw-bold text-dark">{loadingProjects ? 'Loading...' : 'Select a Project'}</h5>
                <p className="text-muted small">Choose a project from the left panel to view its complete details, sprints, and tasks.</p>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* --- Modals for Create Actions --- */}
      {/* Create Project Modal */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Project Name</Form.Label>
              <Form.Control type="text" placeholder="Enter project name" className="shadow-none" value={newProject.projectName} onChange={e => setNewProject({...newProject, projectName: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Description</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Project details..." className="shadow-none" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Start Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">End Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowProjectModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateProject} style={{ backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>Save Project</Button>
        </Modal.Footer>
      </Modal>

      {/* Create Task Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Assign New Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Task Title</Form.Label>
              <Form.Control type="text" placeholder="What needs to be done?" className="shadow-none" value={newTask.taskName} onChange={e => setNewTask({...newTask, taskName: e.target.value})} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Priority</Form.Label>
                  <Form.Select className="shadow-none" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Due Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Assign To</Form.Label>
              <Form.Select className="shadow-none" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}>
                <option value="">Select team member...</option>
                {projectMembers.map(m => (
                  <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.roleLabel})</option>
                ))}
              </Form.Select>
              {projectMembers.length === 0 && (
                <Form.Text className="text-muted mt-2" style={{fontSize: '0.75rem'}}>
                  This project has no members yet — add members first to assign tasks.
                </Form.Text>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowTaskModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateTask} style={{ backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>Create Task</Button>
        </Modal.Footer>
      </Modal>

      {/* Create Sprint Modal */}
      <Modal show={showSprintModal} onHide={() => setShowSprintModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Create New Sprint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Sprint Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Sprint 3 - QA" className="shadow-none" value={newSprint.sprintName} onChange={e => setNewSprint({...newSprint, sprintName: e.target.value})} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Start Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={newSprint.startDate} onChange={e => setNewSprint({...newSprint, startDate: e.target.value})} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">End Date</Form.Label>
                  <Form.Control type="date" className="shadow-none" value={newSprint.endDate} onChange={e => setNewSprint({...newSprint, endDate: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Status</Form.Label>
              <Form.Select className="shadow-none" value={newSprint.status} onChange={e => setNewSprint({...newSprint, status: e.target.value})}>
                <option>Planned</option>
                <option>Active</option>
                <option>Completed</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowSprintModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateSprint} style={{ backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>Create Sprint</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Member Modal */}
      <Modal show={showMemberModal} onHide={() => setShowMemberModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Assign Team Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Select User</Form.Label>
              <Form.Select className="shadow-none" value={newMember.newMemberId} onChange={e => setNewMember({...newMember, newMemberId: e.target.value})}>
                <option value="">Select a user...</option>
                {companyUsers.map(u => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName} — {u.role?.roleName || 'No Role'}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted mt-2" style={{fontSize: '0.75rem'}}>
                The user's actual assigned role (shown above) determines their project access privileges according to HRMS priority rules — the role dropdown below is informational only.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Role (reference)</Form.Label>
              <Form.Select className="shadow-none" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
                <option>Project Manager</option>
                <option>Team Lead</option>
                <option>Software Developer</option>
                <option>Intern</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowMemberModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddMember} style={{ backgroundColor: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>Add Member</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}

export default ProjectManagement;