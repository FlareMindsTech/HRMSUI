export const BASE_URL = "https://hrms-server-4a8n.onrender.com";

export const getToken = () => {
  return sessionStorage.getItem("token") || "";
};

const defaultHeaders = () => ({
  "Content-Type": "application/json",
  "token": getToken()
});

// ===================== USER API =====================
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || `Error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.token) sessionStorage.setItem("token", data.token);
    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logoutUser = async (data = {}) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/logout`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    sessionStorage.removeItem("token");
    return await response.json();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

export const ownerReg = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v1/ownerReg`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error registering owner:", error);
    throw error;
  }
};

export const deleteCurrentCompanyUser = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v2/currentCompany`, {
      method: "DELETE",
      headers: defaultHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting current company user:", error);
    throw error;
  }
};

export const regUser = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v2/reg`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const employeeInternReg = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v2/employeeInternReg`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error mapping intern:", error);
    throw error;
  }
};

export const managementReg = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v2/managementReg`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error management reg:", error);
    throw error;
  }
};

export const updateUserV2 = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v2/update`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUserV2 = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v2/deleteUser`, {
      method: "DELETE",
      headers: defaultHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/get`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getNoOwnerUsers = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/noOwner`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching no owner users:", error);
    throw error;
  }
};

export const getUserByIdV2 = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/v2/getbyid/${id}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching user by id:", error);
    throw error;
  }
};

// ===================== MENU API =====================

export const createMenu = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/menu/create-menu`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating menu:", error);
    throw error;
  }
};

export const getAllMenu = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/menu/getAll-menu`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting menus:", error);
    throw error;
  }
};

export const getMenuById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/menu/getById-menu/${id}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting menu by id:", error);
    throw error;
  }
};

export const updateMenu = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/menu/update-menu`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating menu:", error);
    throw error;
  }
};

export const deleteMenu = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/menu/delete-menu/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting menu:", error);
    throw error;
  }
};

// ===================== EXPERIENCE API =====================

export const addExperience = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/experience/add`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error adding experience:", error);
    throw error;
  }
};

export const getExperienceByUserId = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/experience/get/${userId}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting experience:", error);
    throw error;
  }
};

export const updateExperience = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/experience/update`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating experience:", error);
    throw error;
  }
};

export const deleteExperience = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/experience/delete/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting experience:", error);
    throw error;
  }
};

// ===================== ADDRESS API =====================

export const createAddress = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/address/create`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating address:", error);
    throw error;
  }
};

export const getAddress = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/address/get`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting address:", error);
    throw error;
  }
};

export const updateAddress = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/address/update/${id}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating address:", error);
    throw error;
  }
};

export const deleteAddress = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/address/delete/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting address:", error);
    throw error;
  }
};

// ===================== ROLE API =====================

export const createRole = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/role/createRole`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const getAllRoles = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/role/getAllRoles`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting roles:", error);
    throw error;
  }
};

export const getRoleById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/role/getById/${id}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting role by id:", error);
    throw error;
  }
};

export const updateRole = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/role/updateRole/${id}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/role/deleteRole/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};

// ===================== FAMILY API =====================

export const addFamily = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/family/add`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error adding family:", error);
    throw error;
  }
};

export const getFamilyByUserId = async (userid) => {
  try {
    const response = await fetch(`${BASE_URL}/api/family/get/${userid}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting family by userid:", error);
    throw error;
  }
};

export const getAllFamily = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/family/getAll`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting all family:", error);
    throw error;
  }
};

export const updateFamily = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/family/update`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating family:", error);
    throw error;
  }
};

export const deleteFamily = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/family/delete`, {
      method: "DELETE",
      headers: defaultHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting family:", error);
    throw error;
  }
};

// ===================== ROLEMENU API =====================

export const createRoleMenu = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/rolemenu/create`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating rolemenu:", error);
    throw error;
  }
};

export const getRoleMenus = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/rolemenu/`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting rolemenus:", error);
    throw error;
  }
};

export const getRoleMenuByRoleId = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/rolemenu/role/${id}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting rolemenu by role id:", error);
    throw error;
  }
};

export const updateRoleMenu = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/rolemenu/${id}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating rolemenu:", error);
    throw error;
  }
};

export const deleteRoleMenu = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/rolemenu/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting rolemenu:", error);
    throw error;
  }
};

// ===================== EDUCATION API =====================

export const createEducation = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/education/`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating education:", error);
    throw error;
  }
};

export const getEducationByUserId = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/education/${userId}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting education by userId:", error);
    throw error;
  }
};

export const updateEducation = async (userId, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/education/${userId}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating education:", error);
    throw error;
  }
};

export const deleteEducation = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/education/${userId}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting education:", error);
    throw error;
  }
};

export const getAllEducation = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/education/`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting all education:", error);
    throw error;
  }
};

// ===================== DOCUMENT API =====================

export const createDocument = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/document/create`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};

export const getAllDocuments = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/document/all`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting all documents:", error);
    throw error;
  }
};

export const getDocumentByUserId = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/document/user/${userId}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting document by userId:", error);
    throw error;
  }
};

export const updateDocument = async (userId, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/document/update/${userId}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

export const deleteDocument = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/document/delete/${userId}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// ===================== CURRENT COMPANY API =====================

export const createCurrentCompany = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/currentcompany/`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating current company:", error);
    throw error;
  }
};

export const getCurrentCompanies = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/currentcompany/`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting current companies:", error);
    throw error;
  }
};

export const getCurrentCompanyByUserId = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/currentcompany/${userId}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting current company by userId:", error);
    throw error;
  }
};

export const updateCurrentCompany = async (userId, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/currentcompany/${userId}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating current company:", error);
    throw error;
  }
};

export const deleteCurrentCompany = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/currentcompany/${userId}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting current company:", error);
    throw error;
  }
};

// ===================== LEAVE API =====================

export const applyLeave = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/leave/apply`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error applying leave:", error);
    throw error;
  }
};

export const getAllLeaves = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/leave/all`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting all leaves:", error);
    throw error;
  }
};

export const getLeavesByEmployeeId = async (employeeId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/leave/employee/${employeeId}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting leaves by employee id:", error);
    throw error;
  }
};

export const getLeaveById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/leave/${id}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting leave by id:", error);
    throw error;
  }
};

export const updateLeaveStatus = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/leave/status/${id}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating leave status:", error);
    throw error;
  }
};

export const cancelLeave = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/leave/cancel/${id}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error canceling leave:", error);
    throw error;
  }
};

export const deleteLeave = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/leave/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting leave:", error);
    throw error;
  }
};

// ===================== DAILY REPORT API =====================

export const submitDailyReport = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/daily-report/submit`, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error submitting daily report:", error);
    throw error;
  }
};

export const getMyDailyReports = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/daily-report/my-reports`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting my daily reports:", error);
    throw error;
  }
};

export const getAllDailyReports = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/daily-report/all`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting all daily reports:", error);
    throw error;
  }
};

export const getDailyReportById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/daily-report/${id}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting daily report by id:", error);
    throw error;
  }
};

export const deleteDailyReport = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/daily-report/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting daily report:", error);
    throw error;
  }
};

// ===================== ATTENDANCE API =====================

export const getAllAttendance = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendance/all`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting all attendance:", error);
    throw error;
  }
};

export const getAttendanceByUserId = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendance/user/${userId}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting attendance by userId:", error);
    throw error;
  }
};

export const getAttendanceByUserIdAndMonth = async (userId, month, year) => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendance/user/${userId}/${month}/${year}`, {
      method: "GET",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting attendance by userId, month and year:", error);
    throw error;
  }
};

export const updateAttendanceCorrection = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendance/correction/${id}`, {
      method: "PUT",
      headers: defaultHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating attendance correction:", error);
    throw error;
  }
};

export const deleteAttendance = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendance/delete/${id}`, {
      method: "DELETE",
      headers: defaultHeaders(),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting attendance:", error);
    throw error;
  }
};
