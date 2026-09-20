import { apiFetch } from "../config/api";

// ============================================================
// Organization Service (Multi-Tenant SaaS HRMS)
// ============================================================

/**
 * Helper to serialize query parameters
 */
const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val);
    }
  });
  const qStr = query.toString();
  return qStr ? `?${qStr}` : "";
};

// ─── 1. ORGANIZATION OVERVIEW & PROFILE ───────────────────────────

export const fetchMyOrganization = async () => {
  const res = await apiFetch("/organization/me", { method: "GET" });
  if (!res.ok) {
    // If not found or error, return null so UI can detect no data
    if (res.status === 404) return null;
    throw new Error(res.data?.message || "Failed to fetch organization details");
  }
  return res.data?.data || res.data;
};

export const createOrganization = async (payload) => {
  let res = await apiFetch("/organization", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    res = await apiFetch("/organization/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  if (!res.ok) {
    res = await apiFetch("/organization/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
  if (!res.ok) throw new Error(res.data?.message || "Failed to create organization");
  return res.data;
};

export const updateMyOrganization = async (payload) => {
  const res = await apiFetch("/organization/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update organization profile");
  return res.data;
};

export const fetchOrganizationStructure = async () => {
  const res = await apiFetch("/organization/structure", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch organization structure");
  return res.data?.data;
};

export const fetchReportingTree = async () => {
  const res = await apiFetch("/organization/reporting-tree", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch reporting tree");
  return res.data?.data;
};

// ─── 2. BRANCHES ──────────────────────────────────────────────────

export const fetchBranches = async (params = {}) => {
  const res = await apiFetch(`/branches${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch branches");
  return res.data;
};

export const fetchBranchesDropdown = async () => {
  const res = await apiFetch("/branches/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch branch dropdown");
  return res.data?.data || [];
};

export const fetchBranchById = async (id) => {
  const res = await apiFetch(`/branches/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch branch");
  return res.data?.data;
};

export const createBranch = async (payload) => {
  const res = await apiFetch("/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create branch");
  return res.data;
};

export const updateBranch = async (id, payload) => {
  const res = await apiFetch(`/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update branch");
  return res.data;
};

export const deleteBranch = async (id) => {
  const res = await apiFetch(`/branches/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete branch");
  return res.data;
};

// ─── 3. DEPARTMENTS ───────────────────────────────────────────────

export const fetchDepartments = async (params = {}) => {
  const res = await apiFetch(`/departments${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch departments");
  return res.data;
};

export const fetchDepartmentsDropdown = async (params = {}) => {
  const res = await apiFetch(`/departments/dropdown${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch department dropdown");
  return res.data?.data || [];
};

export const fetchDepartmentById = async (id) => {
  const res = await apiFetch(`/departments/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch department");
  return res.data?.data;
};

export const createDepartment = async (payload) => {
  const res = await apiFetch("/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create department");
  return res.data;
};

export const updateDepartment = async (id, payload) => {
  const res = await apiFetch(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update department");
  return res.data;
};

export const deleteDepartment = async (id) => {
  const res = await apiFetch(`/departments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete department");
  return res.data;
};

// ─── 4. DESIGNATIONS ──────────────────────────────────────────────

export const fetchDesignations = async (params = {}) => {
  const res = await apiFetch(`/designations${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch designations");
  return res.data;
};

export const fetchDesignationsDropdown = async (params = {}) => {
  const res = await apiFetch(`/designations/dropdown${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch designation dropdown");
  return res.data?.data || [];
};

export const fetchDesignationById = async (id) => {
  const res = await apiFetch(`/designations/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch designation");
  return res.data?.data;
};

export const createDesignation = async (payload) => {
  const res = await apiFetch("/designations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create designation");
  return res.data;
};

export const updateDesignation = async (id, payload) => {
  const res = await apiFetch(`/designations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update designation");
  return res.data;
};

export const deleteDesignation = async (id) => {
  const res = await apiFetch(`/designations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete designation");
  return res.data;
};

// ─── 5. TEAMS ─────────────────────────────────────────────────────

export const fetchTeams = async (params = {}) => {
  const res = await apiFetch(`/teams${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch teams");
  return res.data;
};

export const fetchTeamsDropdown = async () => {
  const res = await apiFetch("/teams/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch team dropdown");
  return res.data?.data || [];
};

export const fetchTeamById = async (id) => {
  const res = await apiFetch(`/teams/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch team");
  return res.data?.data;
};

export const createTeam = async (payload) => {
  const res = await apiFetch("/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create team");
  return res.data;
};

export const updateTeam = async (id, payload) => {
  const res = await apiFetch(`/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update team");
  return res.data;
};

export const deleteTeam = async (id) => {
  const res = await apiFetch(`/teams/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete team");
  return res.data;
};

export const fetchTeamProductivity = async (userId) => {
  const res = await apiFetch(`/teams/productivity/${userId}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch team productivity");
  return res.data;
};

// ─── 6. LOCATIONS (GEOFENCED) ─────────────────────────────────────

export const fetchLocations = async (params = {}) => {
  const res = await apiFetch(`/locations${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch locations");
  return res.data;
};

export const fetchLocationsDropdown = async () => {
  const res = await apiFetch("/locations/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch location dropdown");
  return res.data?.data || [];
};

export const fetchLocationById = async (id) => {
  const res = await apiFetch(`/locations/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch location");
  return res.data?.data;
};

export const createLocation = async (payload) => {
  const res = await apiFetch("/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create location");
  return res.data;
};

export const updateLocation = async (id, payload) => {
  const res = await apiFetch(`/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update location");
  return res.data;
};

export const deleteLocation = async (id) => {
  const res = await apiFetch(`/locations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete location");
  return res.data;
};

// ─── 7. REPORTING HIERARCHY ───────────────────────────────────────

export const fetchReportingHierarchies = async (params = {}) => {
  const res = await apiFetch(`/reporting-hierarchy${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch reporting hierarchy");
  return res.data;
};

export const assignReportingManager = async (payload) => {
  const res = await apiFetch("/reporting-hierarchy/assign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to assign reporting manager");
  return res.data;
};

export const fetchUserHierarchy = async (userId) => {
  const res = await apiFetch(`/reporting-hierarchy/user/${userId}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch user hierarchy");
  return res.data?.data;
};

export const fetchDirectReports = async (userId) => {
  const res = await apiFetch(`/reporting-hierarchy/direct-reports/${userId}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch direct reports");
  return res.data?.data;
};

export const removeReportingManager = async (idOrUserId) => {
  const res = await apiFetch(`/reporting-hierarchy/${idOrUserId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to remove reporting relationship");
  return res.data;
};

// ─── 8. JOB GRADES ────────────────────────────────────────────────

export const fetchJobGrades = async (params = {}) => {
  const res = await apiFetch(`/job-grades${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch job grades");
  return res.data;
};

export const fetchJobGradesDropdown = async () => {
  const res = await apiFetch("/job-grades/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch job grade dropdown");
  return res.data?.data || [];
};

export const fetchJobGradeById = async (id) => {
  const res = await apiFetch(`/job-grades/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch job grade");
  return res.data?.data;
};

export const createJobGrade = async (payload) => {
  const res = await apiFetch("/job-grades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create job grade");
  return res.data;
};

export const updateJobGrade = async (id, payload) => {
  const res = await apiFetch(`/job-grades/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update job grade");
  return res.data;
};

export const deleteJobGrade = async (id) => {
  const res = await apiFetch(`/job-grades/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete job grade");
  return res.data;
};

// ─── 9. COST CENTERS ──────────────────────────────────────────────

export const fetchCostCenters = async (params = {}) => {
  const res = await apiFetch(`/cost-centers${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch cost centers");
  return res.data;
};

export const fetchCostCentersDropdown = async () => {
  const res = await apiFetch("/cost-centers/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch cost center dropdown");
  return res.data?.data || [];
};

export const fetchCostCenterById = async (id) => {
  const res = await apiFetch(`/cost-centers/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch cost center");
  return res.data?.data;
};

export const createCostCenter = async (payload) => {
  const res = await apiFetch("/cost-centers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create cost center");
  return res.data;
};

export const updateCostCenter = async (id, payload) => {
  const res = await apiFetch(`/cost-centers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update cost center");
  return res.data;
};

export const deleteCostCenter = async (id) => {
  const res = await apiFetch(`/cost-centers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete cost center");
  return res.data;
};

// ─── 10. WORK CALENDARS ───────────────────────────────────────────

export const fetchWorkCalendars = async (params = {}) => {
  const res = await apiFetch(`/work-calendars${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch work calendars");
  return res.data;
};

export const fetchWorkCalendarsDropdown = async () => {
  const res = await apiFetch("/work-calendars/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch work calendar dropdown");
  return res.data?.data || [];
};

export const fetchWorkCalendarById = async (id) => {
  const res = await apiFetch(`/work-calendars/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch work calendar");
  return res.data?.data;
};

export const createWorkCalendar = async (payload) => {
  const res = await apiFetch("/work-calendars", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create work calendar");
  return res.data;
};

export const updateWorkCalendar = async (id, payload) => {
  const res = await apiFetch(`/work-calendars/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update work calendar");
  return res.data;
};

export const deleteWorkCalendar = async (id) => {
  const res = await apiFetch(`/work-calendars/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete work calendar");
  return res.data;
};

// ─── 11. SHIFTS ───────────────────────────────────────────────────

export const fetchShifts = async (params = {}) => {
  const res = await apiFetch(`/shifts${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch shifts");
  return res.data;
};

export const fetchShiftsDropdown = async () => {
  const res = await apiFetch("/shifts/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch shift dropdown");
  return res.data?.data || [];
};

export const fetchShiftById = async (id) => {
  const res = await apiFetch(`/shifts/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch shift");
  return res.data?.data;
};

export const createShift = async (payload) => {
  const res = await apiFetch("/shifts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create shift");
  return res.data;
};

export const updateShift = async (id, payload) => {
  const res = await apiFetch(`/shifts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update shift");
  return res.data;
};

export const deleteShift = async (id) => {
  const res = await apiFetch(`/shifts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete shift");
  return res.data;
};

// ─── 12. FINANCIAL YEARS ──────────────────────────────────────────

export const fetchFinancialYears = async (params = {}) => {
  const res = await apiFetch(`/financial-years${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch financial years");
  return res.data;
};

export const fetchFinancialYearsDropdown = async () => {
  const res = await apiFetch("/financial-years/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch financial year dropdown");
  return res.data?.data || [];
};

export const fetchFinancialYearById = async (id) => {
  const res = await apiFetch(`/financial-years/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch financial year");
  return res.data?.data;
};

export const createFinancialYear = async (payload) => {
  const res = await apiFetch("/financial-years", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create financial year");
  return res.data;
};

export const updateFinancialYear = async (id, payload) => {
  const res = await apiFetch(`/financial-years/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update financial year");
  return res.data;
};

export const setCurrentFinancialYear = async (id) => {
  const res = await apiFetch(`/financial-years/${id}/set-current`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to set active financial year");
  return res.data;
};

export const deleteFinancialYear = async (id) => {
  const res = await apiFetch(`/financial-years/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete financial year");
  return res.data;
};

// ─── 13. HOLIDAY CALENDARS & HOLIDAYS ──────────────────────────────

export const fetchHolidayCalendars = async (params = {}) => {
  const res = await apiFetch(`/holiday-calendars${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch holiday calendars");
  return res.data;
};

export const fetchHolidayCalendarsDropdown = async () => {
  const res = await apiFetch("/holiday-calendars/dropdown", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch holiday calendar dropdown");
  return res.data?.data || [];
};

export const fetchHolidayCalendarById = async (id) => {
  const res = await apiFetch(`/holiday-calendars/${id}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch holiday calendar");
  return res.data?.data;
};

export const createHolidayCalendar = async (payload) => {
  const res = await apiFetch("/holiday-calendars", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to create holiday calendar");
  return res.data;
};

export const updateHolidayCalendar = async (id, payload) => {
  const res = await apiFetch(`/holiday-calendars/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update holiday calendar");
  return res.data;
};

export const deleteHolidayCalendar = async (id) => {
  const res = await apiFetch(`/holiday-calendars/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to delete holiday calendar");
  return res.data;
};

export const fetchDeclaredHolidays = async (params = {}) => {
  const res = await apiFetch(`/attendance/holidays${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch holidays");
  return res.data;
};

export const declareBulkHoliday = async (payload) => {
  const res = await apiFetch("/attendance/holidays/bulk-apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to declare holiday");
  return res.data;
};

export const cancelDeclaredHoliday = async (id) => {
  const res = await apiFetch(`/attendance/holidays/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to cancel holiday");
  return res.data;
};

// ─── 14. ORGANIZATION SETTINGS ────────────────────────────────────

export const fetchOrganizationSettings = async () => {
  const res = await apiFetch("/organization-settings", { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch organization settings");
  return res.data?.data;
};

export const updateOrganizationSettings = async (payload) => {
  const res = await apiFetch("/organization-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.message || "Failed to update organization settings");
  return res.data;
};

// ─── 15. USERS DROPDOWN (FOR ASSIGNMENTS) ──────────────────────────

export const fetchEmployeesDropdown = async (params = {}) => {
  const res = await apiFetch(`/user/get${buildQuery({ limit: 100, isActive: true, ...params })}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch employee roster");
  return res.data?.data || [];
};
