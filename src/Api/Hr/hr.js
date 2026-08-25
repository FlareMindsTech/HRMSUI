/**
 * HR Onboarding & Employee API Service
 * 
 * Provides centralized API integration with the HRMS backend Onboarding & Employee endpoints.
 * Interacts with /api/onboarding/* and /api/user/* using central apiFetch configuration.
 */

import { apiFetch, API_BASE_URL, authHeaders } from "../../config/api";

/**
 * Helper to construct query string from params object
 */
const buildQuery = (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value);
    }
  });
  const qs = queryParams.toString();
  return qs ? `?${qs}` : "";
};

// =========================================================================
// 1. LIFECYCLE & CORE ONBOARDING RECORDS
// =========================================================================

/**
 * Fetch all onboarding records with optional filters and pagination
 * @param {Object} [params] - { page, limit, status, search, department }
 */
export const fetchOnboardings = async (params = {}) => {
  const res = await apiFetch(`/onboarding/all${buildQuery(params)}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load onboarding records.");
  }
  return res.data;
};

/**
 * Fetch single onboarding details by Onboarding ID
 * @param {string} id - Onboarding record ID
 */
export const fetchOnboardingById = async (id) => {
  const res = await apiFetch(`/onboarding/${id}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load onboarding details.");
  }
  return res.data;
};

/**
 * Fetch onboarding details by Employee ID
 * @param {string} employeeId - User/Employee ID
 */
export const fetchOnboardingByEmployeeId = async (employeeId) => {
  const res = await apiFetch(`/onboarding/employee/${employeeId}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load employee onboarding details.");
  }
  return res.data;
};

/**
 * Register User via /user/register with multipart file support (uploadMiddleware.any())
 * @param {FormData|Object} payload - User registration parameters and files
 */
export const registerUserWithFiles = async (payload) => {
  let body = payload;
  const headers = { ...authHeaders() };

  if (!(payload instanceof FormData)) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });
    body = formData;
  }

  const response = await fetch(`${API_BASE_URL}/user/register`, {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `User registration failed with status ${response.status}`);
  }
  return data;
};

/**
 * Initiate onboarding for a new employee
 * @param {Object} payload - Employee information, professional, education, experience, address, family, bank details
 */
export const initiateOnboarding = async (payload) => {
  const res = await apiFetch("/onboarding/initiate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to initiate onboarding.");
  }
  return res.data;
};

// =========================================================================
// 2. EMPLOYEE PROFILE DOMAINS (Personal, Company, Education, Experience, Address, Family, Bank)
// =========================================================================

/**
 * Fetch candidate employee-info (Personal, Professional, Education, Experience, Addresses, Family)
 * @param {string} id - Onboarding record ID
 */
export const fetchEmployeeInfo = async (id) => {
  const res = await apiFetch(`/onboarding/${id}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load employee info.");
  }
  const data = res.data?.data || res.data || {};
  const emp = data.employeeId || data.employee || data.user || {};
  const profDetails = data.profileDetails || {};

  return {
    personal: {
      firstName: emp.firstName || data.firstName || "",
      middleName: emp.middleName || data.middleName || "",
      lastName: emp.lastName || data.lastName || "",
      email: emp.email || data.email || "",
      mobileNo: emp.mobileNo || data.mobileNo || "",
      dob: emp.dob || data.dob || "",
      gender: emp.gender || data.gender || "Male",
      marriageStatus: emp.marriageStatus || data.marriageStatus || "Unmarried",
      bloodGroup: emp.bloodGroup || data.bloodGroup || "O+",
      department: emp.department || data.department || "",
      designation: emp.designation || data.designation || "",
      avatar: emp.avatar || emp.avatarUrl || data.avatar || "",
    },
    professional: (Array.isArray(profDetails.professional) && profDetails.professional.length > 0)
      ? profDetails.professional
      : (profDetails.currentCompany && Object.keys(profDetails.currentCompany).length > 0)
      ? [profDetails.currentCompany]
      : (Array.isArray(emp.professional) && emp.professional.length > 0)
      ? emp.professional
      : (Array.isArray(data.professional) && data.professional.length > 0)
      ? data.professional
      : [],
    currentCompany: profDetails.currentCompany || {},
    education: profDetails.education || emp.education || data.education || [],
    experience: profDetails.experience || emp.experience || data.experience || [],
    addresses: profDetails.addresses || emp.addresses || data.addresses || [],
    family: profDetails.family || emp.family || data.family || null,
    emergencyContact: emp.emergencyContact || data.emergencyContact || {},
    bankDetails: emp.bankDetails || data.bankDetails || {},
    statutoryDetails: emp.statutoryDetails || data.statutoryDetails || {},
  };
};

/**
 * Fetch candidate professional / current company history
 * @param {string} id - Onboarding record ID
 */
export const fetchCandidateProfessional = async (id) => {
  const info = await fetchEmployeeInfo(id);
  return info.professional;
};

/**
 * Create or register Current Company details (/current-company/create or /currentCompany/create)
 * @param {Object|FormData} payload - Current company fields or FormData with files
 */
export const createCurrentCompanyApi = async (payload) => {
  let body = payload;
  let headers = { ...authHeaders() };

  if (payload instanceof FormData) {
    const res = await fetch(`${API_BASE_URL}/current-company/create`, {
      method: "POST",
      headers,
      body,
    }).catch(() => null) || await fetch(`${API_BASE_URL}/currentCompany/create`, {
      method: "POST",
      headers,
      body,
    }).catch(() => null) || await fetch(`${API_BASE_URL}/current-company`, {
      method: "POST",
      headers,
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to create current company.");
    return data;
  }

  const res = await apiFetch("/current-company/create", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => null) || await apiFetch("/currentCompany/create", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => null) || await apiFetch("/current-company", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to create current company.");
  }
  return res.data;
};

/**
 * Fetch Current Company by user ID
 * @param {string} userId - User ID
 */
export const fetchCurrentCompanyByUserId = async (userId) => {
  if (!userId) return null;
  try {
    const res = await apiFetch(`/current-company/get/${userId}`, { method: "GET" }).catch(() => null);
    if (res && res.ok) {
      return res.data?.data || res.data?.currentCompany || res.data || null;
    }
  } catch (e) {
    // Current company data is already loaded via Onboarding profile
  }
  return null;
};

/**
 * Fetch candidate educational qualifications
 * @param {string} id - Onboarding record ID
 */
export const fetchCandidateEducation = async (id) => {
  const info = await fetchEmployeeInfo(id);
  return info.education;
};

/**
 * Fetch candidate past work experience
 * @param {string} id - Onboarding record ID
 */
export const fetchCandidateExperience = async (id) => {
  const info = await fetchEmployeeInfo(id);
  return info.experience;
};

/**
 * Fetch candidate addresses
 * @param {string} id - Onboarding record ID
 */
export const fetchCandidateAddresses = async (id) => {
  const info = await fetchEmployeeInfo(id);
  return info.addresses;
};

/**
 * Create Address record via addressRouter (/api/address/create)
 * @param {Object} payload - { employeeId, addressType, addressLine1, city, state, country, postalCode }
 */
export const createAddressApi = async (payload) => {
  const normalized = {
    userId: payload.userId || payload.employeeId,
    employeeId: payload.employeeId || payload.userId,
    addressType: payload.addressType || "Permanent",
    address1: payload.address1 || payload.addressLine1 || "",
    addressLine1: payload.addressLine1 || payload.address1 || "",
    address2: payload.address2 || payload.addressLine2 || "",
    addressLine2: payload.addressLine2 || payload.address2 || "",
    city: payload.city || "",
    state: payload.state || "",
    country: payload.country || "India",
    pincode: String(payload.pincode || payload.postalCode || "").trim(),
  };

  const res = await apiFetch("/address/create", {
    method: "POST",
    body: JSON.stringify(normalized),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to create address.");
  }
  return res.data;
};

/**
 * Fetch Addresses by Employee ID / User ID
 * @param {string} employeeId - Employee / User ID
 */
export const fetchAddressByEmployeeId = async (employeeId) => {
  if (!employeeId) return [];
  try {
    const endpoints = [
      `/address/get/${employeeId}`,
      `/address/user/${employeeId}`,
      `/address/employee/${employeeId}`,
      `/address/get?userId=${employeeId}`,
      `/address/${employeeId}`,
    ];
    for (const ep of endpoints) {
      try {
        const res = await apiFetch(ep, { method: "GET" });
        if (res && res.ok && res.data) {
          const list = res.data.data || res.data.addresses || res.data.address || res.data;
          if (Array.isArray(list) && list.length > 0) return list;
          if (list && typeof list === "object" && Object.keys(list).length > 0 && !Array.isArray(list)) {
            if (list.address1 || list.addressLine1 || list.city || list.state || list.pincode) {
              return [list];
            }
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }
  } catch (e) {
    console.warn("fetchAddressByEmployeeId notice:", e.message);
  }
  return [];
};

/**
 * Create Family / Emergency Contact Record via FamilyRouter (POST /family/create)
 * @param {Object} payload - { userId, employeeId, name, relationship, phone, email, occupation, isEmergencyContact }
 */
export const createFamilyApi = async (payload) => {
  const normalized = {
    userId: payload.userId || payload.employeeId,
    employeeId: payload.employeeId || payload.userId,
    name: payload.name || payload.fullName || "",
    fullName: payload.fullName || payload.name || "",
    relationship: payload.relationship || "Father",
    phone: payload.phone || payload.mobileNo || payload.mobilePhone || "",
    mobileNo: payload.mobileNo || payload.phone || "",
    mobilePhone: payload.mobilePhone || payload.phone || "",
    email: payload.email || payload.emailAddress || "",
    emailAddress: payload.emailAddress || payload.email || "",
    occupation: payload.occupation || "",
    isEmergencyContact: payload.isEmergencyContact !== false,
  };

  const endpoints = ["/family/create", "/family/createFamily", "/family/add", "/family"];
  for (const ep of endpoints) {
    try {
      const res = await apiFetch(ep, {
        method: "POST",
        body: JSON.stringify(normalized),
      });
      if (res && res.ok) {
        return res.data?.data || res.data?.family || res.data;
      }
    } catch (e) {
      // try next
    }
  }
  return null;
};

/**
 * Fetch Family / Emergency Contacts by Employee / User ID
 * @param {string} userId - Employee / User ID
 */
export const fetchFamilyByUserId = async (userId) => {
  if (!userId) return [];
  try {
    const endpoints = [
      `/family/getFamilyByUserId/${userId}`,
      `/family/user/${userId}`,
      `/family/getByUser/${userId}`,
      `/family/employee/${userId}`,
      `/family/${userId}`,
    ];
    for (const ep of endpoints) {
      try {
        const res = await apiFetch(ep, { method: "GET" });
        if (res && res.ok && res.data) {
          const list = res.data.data || res.data.family || res.data.families || res.data;
          return Array.isArray(list) ? list : [list];
        }
      } catch (e) {
        // try next
      }
    }
  } catch (e) {
    console.warn("fetchFamilyByUserId notice:", e.message);
  }
  return [];
};

/**
 * Fetch candidate bank and statutory details
 * @param {string} id - Onboarding record ID
 */
export const fetchCandidatePayroll = async (id) => {
  const res = await apiFetch(`/onboarding/${id}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load payroll details.");
  }
  const data = res.data?.data || res.data || {};
  const emp = data.employeeId || data.employee || data.user || {};
  return {
    bankDetails: emp.bankDetails || data.bankDetails || {},
    statutoryDetails: emp.statutoryDetails || data.statutoryDetails || {},
  };
};

/**
 * Fetch candidate family and emergency contact details
 * @param {string} id - Onboarding record ID
 */
export const fetchCandidateFamily = async (id) => {
  const info = await fetchEmployeeInfo(id);
  return info.emergencyContact;
};

/**
 * Update candidate personal, contact, address, family, education, experience info
 * @param {string} id - Onboarding record ID
 * @param {Object} payload - Personal/profile fields to update
 */
export const updateEmployeeInfo = async (id, payload) => {
  const res = await apiFetch(`/onboarding/${id}/employee-info`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update employee information.");
  }
  return res.data;
};

/**
 * Update candidate employment parameters (department, designation, role, manager, etc.)
 * @param {string} id - Onboarding record ID
 * @param {Object} payload - Employment fields to update
 */
export const updateEmployment = async (id, payload) => {
  const res = await apiFetch(`/onboarding/${id}/employment`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update employment details.");
  }
  return res.data;
};

/**
 * Update bank & statutory readiness details
 * @param {string} id - Onboarding record ID
 * @param {Object} payload - Bank details & statutory details
 */
export const updatePayroll = async (id, payload) => {
  const res = await apiFetch(`/onboarding/${id}/payroll`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update payroll details.");
  }
  return res.data;
};

/**
 * Update professional / current company experience
 * @param {string} id - Onboarding record ID
 * @param {Array} professional - Array of professional company records
 */
export const updateCandidateProfessional = async (id, professional) => {
  return updateEmployeeInfo(id, { professional });
};

/**
 * Update education qualifications
 * @param {string} id - Onboarding record ID
 * @param {Array} education - Array of education qualification objects
 */
export const updateCandidateEducation = async (id, education) => {
  return updateEmployeeInfo(id, { education });
};

/**
 * Update past work experience
 * @param {string} id - Onboarding record ID
 * @param {Array} experience - Array of past experience objects
 */
export const updateCandidateExperience = async (id, experience) => {
  return updateEmployeeInfo(id, { experience });
};

/**
 * Update address list
 * @param {string} id - Onboarding record ID
 * @param {Array} addresses - Array of address objects (Permanent, Current, etc.)
 */
export const updateCandidateAddresses = async (id, addresses) => {
  return updateEmployeeInfo(id, { addresses });
};

/**
 * Update family and emergency contact details
 * @param {string} id - Onboarding record ID
 * @param {Object} emergencyContact - Emergency contact / family object
 */
export const updateCandidateFamily = async (id, emergencyContact) => {
  return updateEmployeeInfo(id, { emergencyContact });
};

// =========================================================================
// 3. DOCUMENT VERIFICATION & MANAGEMENT
// =========================================================================

/**
 * Fetch candidate documents
 * @param {string} id - Onboarding record ID
 */
export const fetchOnboardingDocuments = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/documents`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load candidate documents.");
  }
  return res.data;
};

/**
 * Verify a candidate document
 * @param {string} id - Onboarding record ID
 * @param {string} documentId - DocumentSystem ID
 */
export const verifyOnboardingDocument = async (id, documentId) => {
  const res = await apiFetch(`/onboarding/${id}/documents/${documentId}/verify`, {
    method: "PUT",
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to verify document.");
  }
  return res.data;
};

/**
 * Reject a candidate document with reason
 * @param {string} id - Onboarding record ID
 * @param {string} documentId - DocumentSystem ID
 * @param {string} rejectionReason - Reason for rejection
 */
export const rejectOnboardingDocument = async (id, documentId, rejectionReason) => {
  const res = await apiFetch(`/onboarding/${id}/documents/${documentId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectionReason }),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to reject document.");
  }
  return res.data;
};

/**
 * Upload a document attachment for candidate using multipart form data
 * @param {string} id - Onboarding record ID
 * @param {FormData} formData - Multipart form data containing file and documentType
 */
export const uploadOnboardingDocument = async (id, formData) => {
  const endpoints = [
    `${API_BASE_URL}/onboarding/${id}/documents`,
    `${API_BASE_URL}/onboarding/${id}/document`,
    `${API_BASE_URL}/onboarding/documents/${id}`,
    `${API_BASE_URL}/onboarding/upload/${id}`,
  ];
  let lastError = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...authHeaders(),
        },
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        return data?.data || data;
      }
      lastError = new Error(data?.message || `Failed with status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to upload document.");
};

/**
 * Upload profile picture for candidate
 * @param {string} id - Onboarding record ID
 * @param {File} file - Profile picture file
 */
export const uploadCandidateProfilePic = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", "PROFILE_PICTURE");
  formData.append("title", "Profile Photo");
  return uploadOnboardingDocument(id, formData);
};

/**
 * Upload professional document (Offer letter, Relieving letter, Payslip, Appointment letter, Experience letter)
 * @param {string} id - Onboarding record ID
 * @param {File} file - Document file
 * @param {string} [companyName] - Company name
 * @param {string} [docType] - OFFER_LETTER | RELIEVING_LETTER | PAYSLIP | APPOINTMENT_LETTER | EXPERIENCE_LETTER
 */
export const uploadProfessionalDocument = async (id, file, companyName = "", docType = "OFFER_LETTER") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", docType);
  formData.append("title", companyName ? `${docType.replace(/_/g, " ")} - ${companyName}` : docType.replace(/_/g, " "));
  return uploadOnboardingDocument(id, formData);
};

/**
 * Upload education degree certificate
 * @param {string} id - Onboarding record ID
 * @param {File} file - Degree / certificate file
 * @param {string} [degreeName] - Name of degree
 */
export const uploadEducationCertificate = async (id, file, degreeName = "") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", "DEGREE_CERTIFICATE");
  formData.append("title", degreeName ? `Certificate - ${degreeName}` : "Degree Certificate");
  return uploadOnboardingDocument(id, formData);
};

/**
 * Upload experience letter, relieving letter, or payslip
 * @param {string} id - Onboarding record ID
 * @param {File} file - Experience letter or payslip file
 * @param {string} [companyName] - Name of previous company
 * @param {string} [docType] - EXPERIENCE_LETTER | PAYSLIP | RELIEVING_LETTER
 */
export const uploadExperienceDocument = async (id, file, companyName = "", docType = "EXPERIENCE_LETTER") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", docType);
  formData.append("title", companyName ? `${docType.replace(/_/g, " ")} - ${companyName}` : docType.replace(/_/g, " "));
  return uploadOnboardingDocument(id, formData);
};

/**
 * Upload bank passbook or cancelled cheque
 * @param {string} id - Onboarding record ID
 * @param {File} file - Passbook or cancelled cheque file
 */
export const uploadBankPassbook = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", "BANK_PASSBOOK");
  formData.append("title", "Bank Passbook / Cancelled Cheque");
  return uploadOnboardingDocument(id, formData);
};

// =========================================================================
// 4. ONBOARDING TASKS
// =========================================================================

/**
 * Fetch onboarding tasks
 * @param {string} id - Onboarding record ID
 */
export const fetchOnboardingTasks = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/tasks`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load onboarding tasks.");
  }
  return res.data;
};

/**
 * Add a new onboarding task
 * @param {string} id - Onboarding record ID
 * @param {Object} taskData - { taskName, description, responsibleGroup, category, priority, dueDate, isMandatory }
 */
export const addOnboardingTask = async (id, taskData) => {
  const res = await apiFetch(`/onboarding/${id}/tasks`, {
    method: "POST",
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to add onboarding task.");
  }
  return res.data;
};

/**
 * Update task status or details
 * @param {string} id - Onboarding record ID
 * @param {string} taskId - Task ID
 * @param {Object} taskData - { status, notes, assignedTo }
 */
export const updateOnboardingTask = async (id, taskId, taskData) => {
  const res = await apiFetch(`/onboarding/${id}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update onboarding task.");
  }
  return res.data;
};

/**
 * Delete an onboarding task
 * @param {string} id - Onboarding record ID
 * @param {string} taskId - Task ID
 */
export const deleteOnboardingTask = async (id, taskId) => {
  const res = await apiFetch(`/onboarding/${id}/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to delete onboarding task.");
  }
  return res.data;
};

// =========================================================================
// 5. ASSET ALLOCATION & INVENTORY LINKING
// =========================================================================

/**
 * Fetch assigned assets
 * @param {string} id - Onboarding record ID
 */
export const fetchOnboardingAssets = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/assets`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load assigned assets.");
  }
  return res.data;
};

/**
 * Assign an available asset to candidate
 * @param {string} id - Onboarding record ID
 * @param {Object} assetData - { assetId, conditionOnAssignment, remarks }
 */
export const assignOnboardingAsset = async (id, assetData) => {
  const res = await apiFetch(`/onboarding/${id}/assets`, {
    method: "POST",
    body: JSON.stringify(assetData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to assign asset.");
  }
  return res.data;
};

/**
 * Unassign/Return an asset
 * @param {string} id - Onboarding record ID
 * @param {string} assetId - Asset ID
 * @param {string} [remarks] - Condition or return notes
 */
export const unassignOnboardingAsset = async (id, assetId, remarks = "") => {
  const res = await apiFetch(`/onboarding/${id}/assets/${assetId}/unassign`, {
    method: "PUT",
    body: JSON.stringify({ remarks }),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to unassign asset.");
  }
  return res.data;
};

// =========================================================================
// 6. SYSTEM ACCESS & TOOL PROVISIONING
// =========================================================================

/**
 * Fetch system access items
 * @param {string} id - Onboarding record ID
 */
export const fetchOnboardingAccess = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/access`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load system access list.");
  }
  return res.data;
};

/**
 * Request new tool or system access
 * @param {string} id - Onboarding record ID
 * @param {Object} accessData - { systemName, accessType, isMandatory }
 */
export const addOnboardingAccess = async (id, accessData) => {
  const res = await apiFetch(`/onboarding/${id}/access`, {
    method: "POST",
    body: JSON.stringify(accessData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to add system access.");
  }
  return res.data;
};

/**
 * Update system access status (REQUESTED, APPROVED, ACTIVE, REVOKED)
 * @param {string} id - Onboarding record ID
 * @param {string} accessId - Access ID
 * @param {Object} updateData - { status, credentialsNote }
 */
export const updateOnboardingAccess = async (id, accessId, updateData) => {
  const res = await apiFetch(`/onboarding/${id}/access/${accessId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update access status.");
  }
  return res.data;
};

// =========================================================================
// 7. ORIENTATION & TRAINING
// =========================================================================

/**
 * Fetch candidate orientations
 * @param {string} id - Onboarding record ID
 */
export const fetchOnboardingTraining = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/training`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load training schedule.");
  }
  return res.data;
};

/**
 * Schedule a training or induction session
 * @param {string} id - Onboarding record ID
 * @param {Object} trainingData - { trainingName, trainer, scheduledDate, mandatory }
 */
export const addOnboardingTraining = async (id, trainingData) => {
  const res = await apiFetch(`/onboarding/${id}/training`, {
    method: "POST",
    body: JSON.stringify(trainingData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to schedule training.");
  }
  return res.data;
};

/**
 * Update orientation status (COMPLETED, IN_PROGRESS, OVERDUE)
 * @param {string} id - Onboarding record ID
 * @param {string} trainingId - Training ID
 * @param {Object} updateData - { status, score, notes }
 */
export const updateOnboardingTraining = async (id, trainingId, updateData) => {
  const res = await apiFetch(`/onboarding/${id}/training/${trainingId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to update training status.");
  }
  return res.data;
};

// =========================================================================
// 8. POLICIES & AGREEMENTS
// =========================================================================

/**
 * Fetch candidate agreements
 * @param {string} id - Onboarding record ID
 */
export const fetchOnboardingAgreements = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/agreements`, { method: "GET" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to load agreements.");
  }
  return res.data;
};

/**
 * Add a policy or NDA agreement requirement
 * @param {string} id - Onboarding record ID
 * @param {Object} agreeData - { agreementType, title, isRequired, documentUrl }
 */
export const addOnboardingAgreement = async (id, agreeData) => {
  const res = await apiFetch(`/onboarding/${id}/agreements`, {
    method: "POST",
    body: JSON.stringify(agreeData),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to add agreement.");
  }
  return res.data;
};

/**
 * Acknowledge or sign agreement
 * @param {string} id - Onboarding record ID
 * @param {string} agreementId - Agreement ID
 * @param {string} status - ACCEPTED | DECLINED
 */
export const acknowledgeOnboardingAgreement = async (id, agreementId, status = "ACCEPTED") => {
  const res = await apiFetch(`/onboarding/${id}/agreements/${agreementId}/acknowledge`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to acknowledge agreement.");
  }
  return res.data;
};

// =========================================================================
// 9. VALIDATION SCAN & ENFORCED LIFECYCLE PROGRESSION
// =========================================================================

/**
 * Run backend validation engine scan on candidate
 * @param {string} id - Onboarding record ID
 */
export const validateOnboarding = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/validate`, { method: "POST" });
  if (!res.ok) {
    // 422 is standard for validation engine reporting pending requirements
    if (res.status === 422 && res.data) {
      return {
        valid: false,
        missingRequirements: res.data?.missingRequirements || [res.data?.message || "Validation requirements pending"],
        sections: res.data?.sections || {},
        ...res.data,
      };
    }
    const err = new Error(res.data?.message || "Validation scan failed.");
    err.missingRequirements = res.data?.missingRequirements || [];
    err.sections = res.data?.sections || {};
    throw err;
  }
  return res.data;
};

/**
 * Mark onboarding record as COMPLETED (Requires validation pass)
 * @param {string} id - Onboarding record ID
 */
export const completeOnboarding = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/complete`, { method: "POST" });
  if (!res.ok) {
    const err = new Error(res.data?.message || "Failed to complete onboarding.");
    err.missingRequirements = res.data?.missingRequirements;
    throw err;
  }
  return res.data;
};

/**
 * Fetch user / employee record by ID
 * @param {string} userId - User ID
 */
export const fetchUserById = async (userId) => {
  if (!userId) return null;
  const res = await apiFetch(`/user/${userId}`, { method: "GET" }).catch(() => null);
  if (!res || !res.ok) {
    return null;
  }
  return res.data;
};

/**
 * Activate employee lifecycle status (ACTIVE)
 * @param {string} id - Onboarding record ID
 */
export const activateEmployee = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/activate`, { method: "POST" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to activate employee.");
  }
  return res.data;
};

/**
 * Provision login account credentials for candidate
 * @param {string} id - Onboarding record ID
 * @param {Object} payload - { roleId, password, isActive }
 */
export const provisionOnboardingAccount = async (id, payload) => {
  const res = await apiFetch(`/onboarding/${id}/provision-account`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to provision login credentials.");
  }
  return res.data;
};

/**
 * Enable employee login access
 * @param {string} id - Onboarding record ID
 */
export const enableLogin = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/enable-login`, { method: "PUT" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to enable login.");
  }
  return res.data;
};

/**
 * Disable employee login access
 * @param {string} id - Onboarding record ID
 */
export const disableLogin = async (id) => {
  const res = await apiFetch(`/onboarding/${id}/disable-login`, { method: "PUT" });
  if (!res.ok) {
    throw new Error(res.data?.message || "Failed to disable login.");
  }
  return res.data;
};
