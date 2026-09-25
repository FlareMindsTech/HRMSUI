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

/**
 * Normalizes any organization response object from the backend into a standardized schema
 */
export const normalizeOrganization = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  // Unnest if wrapped in { organization: ... } or { org: ... }
  let org = raw;
  if (org.organization && typeof org.organization === "object" && !org.organizationName && !org.name) {
    org = { ...org.organization, stats: org.stats || org.organization.stats || {} };
  } else if (org.org && typeof org.org === "object" && !org.organizationName && !org.name) {
    org = { ...org.org, stats: org.stats || org.org.stats || {} };
  }

  const addr = org.address;
  const addrObj = typeof addr === "object" && addr !== null ? addr : {};
  const street = typeof addr === "string" ? addr : (addrObj.street || addrObj.addressLine1 || addrObj.line1 || org.street || org.addressLine1 || "");
  const city = org.city || addrObj.city || "";
  const state = org.state || addrObj.state || "";
  const country = org.country || addrObj.country || "India";
  const pincode = org.pincode || org.pinCode || org.zip || org.postalCode || addrObj.pincode || addrObj.pinCode || addrObj.zip || addrObj.postalCode || "";

  const orgName = org.organizationName || org.name || org.orgName || org.companyName || org.displayName || org.legalName || org.title || "";
  const orgCode = org.organizationCode || org.code || org.orgCode || org.companyCode || org.tenantCode || org.shortCode || "";
  const legalName = org.legalName || org.registeredName || org.legalRegisteredName || org.companyName || orgName;
  const displayName = org.displayName || org.brandName || org.tradeName || org.shortName || orgName;

  let incDate = org.incorporationDate || org.dateOfIncorporation || org.foundedDate || org.establishmentDate || org.establishedDate || org.createdDate || org.createdAt || "";
  if (incDate) {
    try {
      const d = new Date(incDate);
      if (!isNaN(d.getTime())) {
        incDate = d.toISOString().split("T")[0];
      }
    } catch (e) {}
  }

  let fyStart = org.financialYearStart || org.financialYearPeriod || org.fyStart || org.financialYear || "04-01";
  if (typeof fyStart === "object" && fyStart !== null) {
    if (fyStart.month !== undefined && fyStart.day !== undefined) {
      fyStart = `${String(fyStart.month).padStart(2, "0")}-${String(fyStart.day).padStart(2, "0")}`;
    }
  }

  const addressLine2 = org.addressLine2 || addrObj.addressLine2 || org.street2 || addrObj.street2 || "";
  const landmark = org.landmark || addrObj.landmark || "";

  return {
    ...org,
    _id: org._id || org.id,
    id: org.id || org._id,
    organizationName: orgName,
    organizationCode: orgCode,
    legalName: legalName,
    displayName: displayName,
    organizationType: org.organizationType || org.orgType || org.entityType || org.companyType || org.type || "COMPANY",
    industry: org.industry || org.industryType || org.domain || org.sector || org.businessType || "",
    description: org.description || org.about || org.bio || "",
    status: org.status || org.orgStatus || org.state || (org.isActive === false ? "INACTIVE" : "ACTIVE"),
    registrationNumber: org.registrationNumber || org.registrationNo || org.cin || org.cinNo || org.regNo || org.companyRegistrationNumber || org.regNumber || "",
    pan: org.pan || org.panNumber || org.panNo || org.taxId || org.pan_no || "",
    tan: org.tan || org.tanNumber || org.tanNo || org.tan_no || "",
    gstin: org.gstin || org.gstNo || org.gstNumber || org.gst || org.vatNo || org.taxNumber || org.gst_no || "",
    pfNumber: org.pfNumber || org.epfoNumber || org.pfRegistrationNumber || org.pfNo || "",
    esiNumber: org.esiNumber || org.esicNumber || org.esiRegistrationNumber || org.esiNo || "",
    msmeNumber: org.msmeNumber || org.udyamNumber || org.msmeRegistrationNumber || org.udyamNo || "",
    lin: org.lin || org.labourIdentificationNumber || org.linNumber || "",
    professionalTaxNumber: org.professionalTaxNumber || org.ptNumber || org.ptRegistrationNumber || "",
    incorporationDate: incDate,
    financialYearStart: fyStart,
    currency: org.currency || org.defaultCurrency || org.currencyCode || org.baseCurrency || "INR",
    timeZone: org.timeZone || org.timezone || org.timeZoneId || org.time_zone || "Asia/Kolkata",
    email: org.email || org.officialEmail || org.corporateEmail || org.contactEmail || org.companyEmail || org.emailId || "",
    phone: org.phone || org.phoneNumber || org.contactPhone || org.telephone || org.mobile || org.contactNumber || org.phoneNo || "",
    altPhone: org.altPhone || org.secondaryPhone || org.alternatePhone || "",
    website: org.website || org.websiteUrl || org.url || org.companyWebsite || org.domainUrl || "",
    address: street,
    addressLine2: addressLine2,
    landmark: landmark,
    city: city,
    state: state,
    country: country,
    pincode: pincode,
    contactPersonName: org.contactPersonName || org.contactPerson?.name || org.primaryContact?.name || "",
    contactPersonDesignation: org.contactPersonDesignation || org.contactPerson?.designation || org.primaryContact?.designation || "",
    contactPersonEmail: org.contactPersonEmail || org.contactPerson?.email || org.primaryContact?.email || "",
    contactPersonPhone: org.contactPersonPhone || org.contactPerson?.phone || org.primaryContact?.phone || "",
    logo: typeof org.logo === "object" && org.logo !== null ? org.logo.url || org.logo.path || "" : (org.logo || org.logoUrl || ""),
    stats: org.stats || {},
  };
};

// In-memory cache for ultra-fast instantaneous responses
let cachedOrganization = null;

export const fetchMyOrganization = async (forceRefresh = false) => {
  // Return in-memory cache instantly if available and not forced
  if (!forceRefresh && cachedOrganization) {
    return cachedOrganization;
  }

  // Check localStorage cache for instant zero-latency loading
  if (!forceRefresh) {
    try {
      const saved = localStorage.getItem("cached_org_profile");
      if (saved) {
        cachedOrganization = JSON.parse(saved);
        return cachedOrganization;
      }
    } catch (e) {}
  }

  const storedOrgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");

  const fastEndpoints = [
    "/organization/structure",
    "/organization/me",
    "/organization",
    "/organizations",
  ];

  if (storedOrgId) {
    fastEndpoints.push(`/organization/${storedOrgId}`);
  }

  let foundOrg = null;

  try {
    // Run all candidate endpoints in parallel
    const results = await Promise.allSettled(
      fastEndpoints.map((ep) => apiFetch(ep, { method: "GET" }))
    );

    for (const resObj of results) {
      if (resObj.status === "fulfilled" && resObj.value?.ok && resObj.value?.data) {
        const rawData = resObj.value.data.data !== undefined ? resObj.value.data.data : resObj.value.data;
        let org = rawData?.organization || rawData?.org || rawData?.organizations?.[0] || rawData?.orgs?.[0] || rawData?.result || rawData?.results?.[0] || rawData;
        if (Array.isArray(org)) org = org[0];
        if (org && (org.organizationName || org.name || org.orgName || org.companyName || org.legalName || org.displayName || org._id || org.id)) {
          foundOrg = normalizeOrganization(org);
          break;
        }
      }
    }
  } catch (e) {
    console.warn("Fast parallel org fetch failed:", e);
  }

  // Fallback to user object if still not found
  if (!foundOrg) {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.organization && typeof parsed.organization === "object") {
          foundOrg = normalizeOrganization(parsed.organization);
        } else if (parsed.tenant && typeof parsed.tenant === "object") {
          foundOrg = normalizeOrganization(parsed.tenant);
        }
      }
    } catch (e) {}
  }

  if (foundOrg) {
    cachedOrganization = foundOrg;
    try {
      localStorage.setItem("cached_org_profile", JSON.stringify(foundOrg));
    } catch (e) {}
    const orgId = foundOrg._id || foundOrg.id;
    if (orgId) {
      localStorage.setItem("organizationId", orgId);
      localStorage.setItem("tenantId", orgId);
    }
  }

  return foundOrg || cachedOrganization || null;
};

export const createOrganization = async (payload) => {
  let res = await apiFetch("/organization", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 404) {
      res = await apiFetch("/organization/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) {
      throw new Error(res.data?.message || "Failed to create organization");
    }
  }
  const resultData = res.data?.data || res.data;
  let org = resultData?.organization || resultData?.org || resultData;
  if (Array.isArray(org)) org = org[0];
  if (org?.organization) org = org.organization;

  const normalized = normalizeOrganization(org || resultData);

  const orgId = normalized?._id || normalized?.id;
  if (orgId) {
    localStorage.setItem("organizationId", orgId);
    localStorage.setItem("tenantId", orgId);
    try {
      const uStr = localStorage.getItem("user");
      if (uStr) {
        const u = JSON.parse(uStr);
        u.organizationId = orgId;
        u.tenantId = orgId;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (e) {}
  }
  return normalized || resultData;
};

export const updateMyOrganization = async (payload, orgIdOverride = null) => {
  const storedOrgId =
    orgIdOverride ||
    localStorage.getItem("organizationId") ||
    localStorage.getItem("tenantId") ||
    cachedOrganization?._id ||
    cachedOrganization?.id;

  const candidateEndpoints = [
    { path: "/organization/structure", method: "PUT" },
    { path: "/organization/me", method: "PUT" },
    { path: "/organization", method: "PUT" },
    { path: "/organization/update", method: "PUT" },
    { path: "/organization/update", method: "POST" },
  ];

  if (storedOrgId) {
    candidateEndpoints.splice(2, 0, { path: `/organization/${storedOrgId}`, method: "PUT" });
  }

  let res = null;
  let lastErrorMsg = "";

  for (const ep of candidateEndpoints) {
    try {
      res = await apiFetch(ep.path, {
        method: ep.method,
        body: JSON.stringify(payload),
      });
      if (res.ok) break;
      if (res.data?.message) {
        lastErrorMsg = res.data.message;
      }
    } catch (e) {
      lastErrorMsg = e.message || lastErrorMsg;
    }
  }

  if (!res || !res.ok) {
    throw new Error(lastErrorMsg || res?.data?.message || "Failed to update organization profile");
  }

  const rawData = res.data?.data !== undefined ? res.data?.data : res.data;
  let org = rawData?.organization || rawData?.org || rawData;
  if (Array.isArray(org)) org = org[0];
  if (org?.organization) org = org.organization;

  const normalized = normalizeOrganization(org || rawData || payload);
  if (normalized) {
    cachedOrganization = normalized;
    try {
      localStorage.setItem("cached_org_profile", JSON.stringify(normalized));
    } catch (e) {}
    const newId = normalized._id || normalized.id;
    if (newId) {
      localStorage.setItem("organizationId", newId);
      localStorage.setItem("tenantId", newId);
    }
  }
  return normalized || org || rawData;
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
export const fetchMyOrganizationsList = async () => {
  const res = await apiFetch("/organization/list", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to fetch organizations list");
  }
  return res.data?.data || [];
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

// ─── 15. USERS & ONBOARDING MEMBER ASSIGNMENTS ─────────────────────

export const fetchEmployeesDropdown = async (params = {}) => {
  const res = await apiFetch(`/user/get${buildQuery({ limit: 100, isActive: true, ...params })}`, { method: "GET" });
  if (!res.ok) throw new Error(res.data?.message || "Failed to fetch employee roster");
  return res.data?.data || [];
};

/**
 * Fetches all onboarded and active employees within the organization for branch assignment
 */
export const fetchOnboardedEmployees = async (params = {}) => {
  let list = [];
  try {
    const res = await apiFetch(`/user/get${buildQuery({ limit: 200, ...params })}`, { method: "GET" });
    if (res.ok && Array.isArray(res.data?.data)) {
      list = res.data.data;
    } else if (res.ok && Array.isArray(res.data)) {
      list = res.data;
    }
  } catch (e) {
    console.warn("fetchOnboardedEmployees error:", e);
  }

  if (!list || list.length === 0) {
    try {
      const res = await apiFetch(`/users${buildQuery({ limit: 200, ...params })}`, { method: "GET" });
      if (res.ok && Array.isArray(res.data?.data)) {
        list = res.data.data;
      }
    } catch (e) {}
  }

  // Normalize employee list
  return list.map((u) => {
    const primaryB = u.primaryBranchId?._id || u.primaryBranchId || u.branchId?._id || u.branchId || null;
    const bIds = Array.isArray(u.branchIds)
      ? u.branchIds.map((b) => (typeof b === "object" && b !== null ? b._id || b.id : b)).filter(Boolean)
      : (primaryB ? [primaryB] : []);

    const name = u.fullName || u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Employee";
    const status = (u.onboardingStatus || (u.isActive ? "COMPLETED" : "PENDING")).toUpperCase();

    return {
      _id: u._id || u.id,
      id: u._id || u.id,
      firstName: u.firstName || name.split(" ")[0] || "",
      lastName: u.lastName || name.split(" ").slice(1).join(" ") || "",
      fullName: name,
      email: u.email || "",
      phone: u.phone || u.phoneNumber || "",
      employeeId: u.employeeId || u.empId || u.code || "",
      designation: typeof u.designation === "object" && u.designation !== null ? u.designation.name || u.designation.title : (u.designation || u.jobTitle || "Staff"),
      department: typeof u.department === "object" && u.department !== null ? u.department.name || u.department.departmentName : (u.department || "General"),
      primaryBranchId: primaryB,
      branchIds: bIds,
      onboardingStatus: status,
      isOnboarded: status === "COMPLETED" || status === "APPROVED" || status === "ACTIVE" || u.isOnboarded === true || u.hasCompletedOnboarding === true,
      isActive: u.isActive !== false && u.status !== "INACTIVE" && u.status !== "BLOCKED",
      roleCode: u.roleCode || u.role?.roleCode || u.role || "EMPLOYEE",
      avatar: u.profileImage || u.avatar || "",
    };
  });
};

/**
 * Assigns a batch of onboarded employees to a branch
 */
export const assignEmployeesToBranch = async (branchId, userIds = [], makePrimary = true) => {
  if (!branchId) throw new Error("Branch ID is required for assignment");
  if (!Array.isArray(userIds) || userIds.length === 0) return { success: true, count: 0 };

  const orgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");

  const results = await Promise.allSettled(
    userIds.map(async (uid) => {
      // 1. Try dedicated access update endpoint
      const payload = {
        organizationId: orgId || undefined,
        accessLevel: "BRANCH",
        primaryBranchId: makePrimary ? branchId : undefined,
        branchIds: [branchId],
      };

      let res = await apiFetch(`/users/${uid}/access`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await apiFetch(`/user/${uid}/access`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        res = await apiFetch(`/user/${uid}`, {
          method: "PUT",
          body: JSON.stringify({
            primaryBranchId: branchId,
            branchId: branchId,
          }),
        });
      }

      return res.ok;
    })
  );

  const successful = results.filter((r) => r.status === "fulfilled" && r.value).length;
  return {
    success: successful > 0,
    total: userIds.length,
    assignedCount: successful,
  };
};

/**
 * Removes an employee from a branch
 */
export const removeEmployeeFromBranch = async (branchId, userId) => {
  if (!branchId || !userId) throw new Error("Branch ID and User ID are required");

  const orgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");
  const payload = {
    organizationId: orgId || undefined,
    accessLevel: "ORGANIZATION",
    primaryBranchId: null,
    branchIds: [],
  };

  let res = await apiFetch(`/users/${userId}/access`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    res = await apiFetch(`/user/${userId}/access`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    res = await apiFetch(`/user/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ primaryBranchId: null }),
    });
  }

  return res.ok;
};

// ─── 16. SYSTEM SETUP & OWNER INITIALIZATION ──────────────────────

/**
 * Checks system setup status from GET /api/system/setup-status
 * Returns: { setupRequired: boolean, organizationExists: boolean, ownerExists: boolean, organization, subscription }
 */
export const fetchSystemSetupStatus = async () => {
  const res = await apiFetch("/system/setup-status", { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to fetch system setup status");
  }
  return res.data;
};

/**
 * Registers the initial organization owner via POST /api/auth/register-owner
 * Payload: { organizationId, firstName, lastName, email, password, mobileNo, ... }
 */
export const registerSystemOwner = async (payload) => {
  const res = await apiFetch("/auth/register-owner", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to register owner account");
  }
  return res.data;
};

