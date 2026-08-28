import { apiFetch } from '../../config/api';

// Project CRUD APIs
export const getAllProjectsApi = async () => {
  return await apiFetch('/project/getAllProjects');
};

export const getMyProjectsApi = async () => {
  return await apiFetch('/project/getMyProjects');
};

export const getEligiblePMsApi = async () => {
  return await apiFetch('/project/getEligiblePMs');
};

export const getCompanyUsersApi = async () => {
  return await apiFetch('/project/getCompanyUsers');
};

export const getProjectDetailsApi = async (projectId) => {
  return await apiFetch(`/project/getProjectDetails/${projectId}`);
};

export const createProjectApi = async (payload) => {
  return await apiFetch('/project/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateProjectApi = async (projectId, payload) => {
  return await apiFetch(`/project/updateProject/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteProjectApi = async (projectId) => {
  return await apiFetch(`/project/deleteProject/${projectId}`, {
    method: 'DELETE',
  });
};

export const updateProjectStatusApi = async (projectId, status) => {
  return await apiFetch(`/project/${projectId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const completeProjectApi = async (projectId, payload = {}) => {
  return await apiFetch(`/project/${projectId}/complete`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const getProjectCompletionStatusApi = async (projectId) => {
  return await apiFetch(`/project/${projectId}/completion-status`);
};

export const getProjectTimeSummaryApi = async (projectId) => {
  return await apiFetch(`/project/${projectId}/time-summary`);
};

export const getProjectMetricsApi = async (projectId) => {
  return await apiFetch(`/project/${projectId}/metrics`);
};

export const getProjectSprintMetricsApi = async (projectId) => {
  return await apiFetch(`/project/${projectId}/sprint-metrics`);
};

// Team Members
export const addProjectMemberApi = async (payload) => {
  return await apiFetch('/project/addMember', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const removeProjectMemberApi = async (payload) => {
  return await apiFetch('/project/removeMember', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Sprints
export const getProjectSprintsApi = async (projectId) => {
  return await apiFetch(`/sprint/project/${projectId}`);
};

export const createSprintApi = async (payload) => {
  return await apiFetch('/sprint/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateSprintApi = async (sprintId, payload) => {
  return await apiFetch(`/sprint/update/${sprintId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const updateSprintStatusApi = async (sprintId, status) => {
  return await apiFetch(`/sprint/${sprintId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const deleteSprintApi = async (sprintId) => {
  return await apiFetch(`/sprint/delete/${sprintId}`, {
    method: 'DELETE',
  });
};

// Tasks
export const getTasksByProjectApi = async (projectId) => {
  return await apiFetch(`/task/project/${projectId}`);
};

export const getTasksBySprintApi = async (sprintId) => {
  return await apiFetch(`/task/sprint/${sprintId}`);
};

export const getMyTasksApi = async () => {
  return await apiFetch('/task/my-tasks');
};

export const getTaskByIdApi = async (taskId) => {
  return await apiFetch(`/task/${taskId}`);
};

export const createTaskApi = async (payload) => {
  return await apiFetch('/task/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateTaskApi = async (taskId, payload) => {
  return await apiFetch(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const updateTaskStatusApi = async (taskId, payload) => {
  return await apiFetch(`/task/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const reassignTaskApi = async (taskId, assignedTo) => {
  return await apiFetch(`/task/${taskId}/reassign`, {
    method: 'PUT',
    body: JSON.stringify({ assignedTo }),
  });
};

export const deleteTaskApi = async (taskId) => {
  return await apiFetch(`/task/delete/${taskId}`, {
    method: 'DELETE',
  });
};

// Daily Reports
export const getProjectDailyReportsApi = async (projectId) => {
  return await apiFetch(`/daily-report/project/${projectId}`);
};

export const submitDailyReportApi = async (payload) => {
  return await apiFetch('/daily-report/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const addDailyReportCommentApi = async (reportId, commentText) => {
  return await apiFetch(`/daily-report/${reportId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ commentText }),
  });
};

const projectApi = {
  //project CRUD
  getAllProjects: getAllProjectsApi,
  getMyProjects: getMyProjectsApi,
  getEligiblePMs: getEligiblePMsApi,
  getCompanyUsers: getCompanyUsersApi,
  getProjectDetails: getProjectDetailsApi,
  createProject: createProjectApi,
  updateProject: updateProjectApi,
  deleteProject: deleteProjectApi,
  updateProjectStatus: updateProjectStatusApi,
  completeProject: completeProjectApi,
  getProjectCompletionStatus: getProjectCompletionStatusApi,
  getProjectTimeSummary: getProjectTimeSummaryApi,
  getProjectMetrics: getProjectMetricsApi,
  getProjectSprintMetrics: getProjectSprintMetricsApi,
  
  //add member
  addMember: addProjectMemberApi,
  removeMember: removeProjectMemberApi,
//sprints
  getProjectSprints: getProjectSprintsApi,
  createSprint: createSprintApi,
  updateSprint: updateSprintApi,
  updateSprintStatus: updateSprintStatusApi,
  deleteSprint: deleteSprintApi,
 //tasks
  getTasksByProject: getTasksByProjectApi,
  getTasksBySprint: getTasksBySprintApi,
  getMyTasks: getMyTasksApi,
  getTaskById: getTaskByIdApi,
  createTask: createTaskApi,
  updateTask: updateTaskApi,
  updateTaskStatus: updateTaskStatusApi,
  reassignTask: reassignTaskApi,
  deleteTask: deleteTaskApi,
  //daily report
  getProjectDailyReports: getProjectDailyReportsApi,
  submitDailyReport: submitDailyReportApi,
  addDailyReportComment: addDailyReportCommentApi,
};

export default projectApi;
