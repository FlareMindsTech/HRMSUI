import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Spinner,
  Alert,
  InputGroup,
  Pagination,
  Nav,
} from "react-bootstrap";
import {
  FaUserShield,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
  FaKey,
  FaShieldAlt,
  FaCheckSquare,
  FaSquare,
  FaUserPlus,
  FaCog,
  FaEye,
  FaEyeSlash,
  FaUserCheck,
  FaUserTimes,
  FaSearch,
  FaTimes,
  FaLock,
  FaBuilding,
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchAllRoles,
  fetchAssignableRoles,
  fetchPermissionCatalog,
  fetchAllMenus,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  fetchRoleAccessConfig,
  fetchAllUsers,
  assignUserRole,
  provisionUserAccount,
  updateAccountStatus,
  resetAccountCredentials,
} from "../../services/rbacService";
import { fetchUserAccess, updateUserAccess } from "../../services/accessService";
import {
  fetchOnboardings,
  completeOnboarding,
  activateEmployee,
  provisionOnboardingAccount,
} from "../../Api/Hr/hr";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import BranchAccessSelector from "../../Components/Common/BranchAccessSelector";
import "./UserManagement.css";

const getInitials = (first, last) => {
  const f = (first || "").trim().charAt(0).toUpperCase();
  const l = (last || "").trim().charAt(0).toUpperCase();
  return `${f}${l}` || "U";
};

function UserManagement({ initialTab = "users" }) {
  const { isSystemAdmin, hasPermission, user: currentUser, refreshAuthContext } = useAuth();
  const { organization, branches: contextBranches } = useBranch();

  // ── Tab State: Exclusive rendering ("users" or "roles") ──
  const [activeTab, setActiveTab] = useState(initialTab || "users");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ── Roles & Catalog State ──
  const [roles, setRoles] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [menus, setMenus] = useState([]);
  const [users, setUsers] = useState([]);

  // ── Loading & Notification States ──
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── Create / Edit Custom Role Modal State ──
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({
    roleName: "",
    description: "",
    priority: 3,
    isActive: true,
    selectedMenuIds: [],
    selectedPermissionCodes: [],
  });

  // ── Account Provisioning Modal State ──
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisioningUser, setProvisioningUser] = useState(null);
  const [provisionForm, setProvisionForm] = useState({
    roleId: "",
    password: "Welcome@123",
    isActive: true,
    showPass: false,
  });

  // ── Manage Account Modal State ──
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingUser, setManagingUser] = useState(null);
  const [manageModalTab, setManageModalTab] = useState("account"); // "account" | "access"
  const [manageForm, setManageForm] = useState({
    roleId: "",
    isActive: true,
    isBlocked: false,
    newPassword: "",
    showPass: false,
  });
  const [manageAccessData, setManageAccessData] = useState({
    organizationId: "",
    accessLevel: "ORGANIZATION",
    primaryBranchId: "",
    branchIds: [],
  });
  const [manageAccessValidation, setManageAccessValidation] = useState({ isValid: true, errors: [] });
  const [loadingAccess, setLoadingAccess] = useState(false);

  // ── Search & Filter State: Employee Directory ──
  const [userSearch, setUserSearch] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // ── Search & Filter State: Roles ──
  const [roleSearch, setRoleSearch] = useState("");
  const [roleTypeFilter, setRoleTypeFilter] = useState("all");

  // ── Pagination Constants & State (6 records per page) ──
  const USER_PAGE_SIZE = 6;
  const ROLE_PAGE_SIZE = 6;
  const [userPage, setUserPage] = useState(1);
  const [rolePage, setRolePage] = useState(1);

  // ── Load All RBAC & User Data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [rolesData, assignableData, catalogData, menusData, usersData] = await Promise.all([
        fetchAllRoles().catch(() => []),
        fetchAssignableRoles().catch(() => []),
        fetchPermissionCatalog().catch(() => ({})),
        fetchAllMenus().catch(() => []),
        fetchAllUsers().catch(() => []),
      ]);

      setRoles(rolesData || []);
      setAssignableRoles(assignableData || []);
      setCatalog(catalogData || {});
      setMenus(menusData || []);
      setUsers(usersData || []);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load RBAC data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Open Create Role Modal ──
  const handleOpenCreateRoleModal = () => {
    setEditingRoleId(null);
    setRoleForm({
      roleName: "",
      description: "",
      priority: 3,
      isActive: true,
      selectedMenuIds: [],
      selectedPermissionCodes: [],
    });
    setShowRoleModal(true);
  };

  // ── Open Edit Role Modal ──
  const handleOpenEditRoleModal = async (role) => {
    setEditingRoleId(role._id);
    setModalLoading(true);
    setShowRoleModal(true);

    try {
      const config = await fetchRoleAccessConfig(role._id);
      setRoleForm({
        roleName: role.roleName,
        description: role.description || "",
        priority: role.priority || 3,
        isActive: role.isActive !== false,
        selectedMenuIds: config?.menuIds || [],
        selectedPermissionCodes: config?.permissionCodes || [],
      });
    } catch (err) {
      setErrorMessage("Failed to load role access configuration");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Toggle Module Menu Selection ──
  const toggleMenu = (menuId) => {
    setRoleForm((prev) => {
      const exists = prev.selectedMenuIds.includes(menuId);
      return {
        ...prev,
        selectedMenuIds: exists
          ? prev.selectedMenuIds.filter((id) => id !== menuId)
          : [...prev.selectedMenuIds, menuId],
      };
    });
  };

  // ── Toggle Granular Permission Selection ──
  const togglePermission = (permCode) => {
    setRoleForm((prev) => {
      const exists = prev.selectedPermissionCodes.includes(permCode);
      return {
        ...prev,
        selectedPermissionCodes: exists
          ? prev.selectedPermissionCodes.filter((code) => code !== permCode)
          : [...prev.selectedPermissionCodes, permCode],
      };
    });
  };

  // ── Select All Permissions in a Module ──
  const toggleModulePermissions = (moduleName) => {
    const modulePerms = catalog[moduleName] || [];
    const moduleCodes = modulePerms.map((p) => p.permissionCode);
    const allSelected = moduleCodes.every((code) =>
      roleForm.selectedPermissionCodes.includes(code)
    );

    setRoleForm((prev) => ({
      ...prev,
      selectedPermissionCodes: allSelected
        ? prev.selectedPermissionCodes.filter((c) => !moduleCodes.includes(c))
        : Array.from(new Set([...prev.selectedPermissionCodes, ...moduleCodes])),
    }));
  };

  // ── Save Custom Role ──
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.roleName.trim()) {
      alert("Please enter a role name");
      return;
    }

    setModalLoading(true);
    setErrorMessage("");
    try {
      if (editingRoleId) {
        await updateCustomRole(editingRoleId, {
          roleName: roleForm.roleName,
          description: roleForm.description,
          priority: roleForm.priority,
          isActive: roleForm.isActive,
          menuIds: roleForm.selectedMenuIds,
          permissionCodes: roleForm.selectedPermissionCodes,
        });
        setSuccessMessage(`Role '${roleForm.roleName}' updated successfully.`);
      } else {
        await createCustomRole({
          roleName: roleForm.roleName,
          description: roleForm.description,
          priority: roleForm.priority,
          menuIds: roleForm.selectedMenuIds,
          permissionCodes: roleForm.selectedPermissionCodes,
        });
        setSuccessMessage(`Custom role '${roleForm.roleName}' created successfully.`);
      }

      setShowRoleModal(false);
      await loadData();
      await refreshAuthContext();
    } catch (err) {
      setErrorMessage(err.message || "Failed to save role");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Delete Role ──
  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Are you sure you want to delete role '${role.roleName}'?`)) {
      return;
    }

    try {
      await deleteCustomRole(role._id);
      setSuccessMessage(`Role '${role.roleName}' deleted successfully.`);
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete role");
    }
  };

  // ── Open Provision Account Modal ──
  const handleOpenProvisionModal = (employee) => {
    setProvisioningUser(employee);
    const defaultRole = assignableRoles.find((r) => r.roleCode === "EMPLOYEE") || assignableRoles[0];
    setProvisionForm({
      roleId: defaultRole?._id || "",
      password: "Welcome@123",
      isActive: true,
      showPass: false,
    });
    setShowProvisionModal(true);
  };

  // ── Submit Account Provisioning ──
  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    if (!provisioningUser || !provisionForm.roleId) return;

    setModalLoading(true);
    setErrorMessage("");
    try {
      const empId = provisioningUser._id || provisioningUser.id;

      // If employee is in onboarding lifecycle, attempt activation & provisioning via onboarding
      if (provisioningUser.lifecycleStatus && provisioningUser.lifecycleStatus !== "ACTIVE") {
        try {
          const onboardingsRes = await fetchOnboardings();
          const list = Array.isArray(onboardingsRes) ? onboardingsRes : (onboardingsRes?.data || []);
          const match = list.find((o) => {
            const oEmpId = o.employeeId?._id || o.employeeId || o.employee || o.userId;
            return oEmpId === empId || o._id === empId;
          });
          if (match?._id) {
            try {
              await activateEmployee(match._id);
            } catch (actErr) {
              console.warn("Auto-activation attempt 1:", actErr);
              try {
                await completeOnboarding(match._id);
                await activateEmployee(match._id);
              } catch (compErr) {
                console.warn("Auto-completion prior to activation:", compErr);
              }
            }
            await provisionOnboardingAccount(match._id, {
              roleId: provisionForm.roleId,
              password: provisionForm.password,
              isActive: provisionForm.isActive,
            });
            setSuccessMessage(
              `Login account successfully provisioned for ${provisioningUser.firstName} ${provisioningUser.lastName}.`
            );
            setShowProvisionModal(false);
            await loadData();
            return;
          }
        } catch (onbErr) {
          console.warn("Onboarding provision fallback:", onbErr);
        }
      }

      await provisionUserAccount({
        employeeId: empId,
        roleId: provisionForm.roleId,
        password: provisionForm.password,
        isActive: provisionForm.isActive,
      });

      setSuccessMessage(
        `Login account successfully provisioned for ${provisioningUser.firstName} ${provisioningUser.lastName}.`
      );
      setShowProvisionModal(false);
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to provision login account");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Open Manage Account Modal ──
  const handleOpenManageModal = async (employee) => {
    setManagingUser(employee);
    setManageModalTab("account");
    setManageForm({
      roleId: employee.role?._id || employee.role || "",
      isActive: employee.isActive !== false,
      isBlocked: employee.isBlocked === true,
      newPassword: "",
      showPass: false,
    });
    setShowManageModal(true);

    // Fetch user's current organization/branch access
    const userId = employee._id || employee.id;
    setLoadingAccess(true);
    try {
      const accessRes = await fetchUserAccess(userId);
      const access = accessRes?.data || accessRes || {};
      setManageAccessData({
        organizationId: access.organizationId || employee.organizationId || (organization?._id || ""),
        accessLevel: access.accessLevel || (employee.role?.roleCode === "OWNER" ? "ORGANIZATION" : "BRANCH"),
        primaryBranchId: access.primaryBranchId || employee.primaryBranchId || "",
        branchIds: Array.isArray(access.branchIds)
          ? access.branchIds
          : Array.isArray(employee.branchIds)
          ? employee.branchIds
          : Array.isArray(employee.branches)
          ? employee.branches.map((b) => b._id || b)
          : [],
      });
    } catch (err) {
      console.warn("Failed to load user access config:", err);
      setManageAccessData({
        organizationId: employee.organizationId || (organization?._id || ""),
        accessLevel: employee.accessLevel || (employee.role?.roleCode === "OWNER" ? "ORGANIZATION" : "BRANCH"),
        primaryBranchId: employee.primaryBranchId || "",
        branchIds: employee.branchIds || [],
      });
    } finally {
      setLoadingAccess(false);
    }
  };

  // ── Submit Manage Account Changes ──
  const handleManageSubmit = async (e) => {
    e.preventDefault();
    if (!managingUser) return;

    // Validate branch access if BRANCH mode
    if (manageAccessData.accessLevel === "BRANCH") {
      if (!manageAccessData.primaryBranchId) {
        setErrorMessage("Please select a Primary Branch for branch-specific access.");
        return;
      }
      if (!manageAccessData.branchIds || manageAccessData.branchIds.length === 0) {
        setErrorMessage("Please select at least one branch for branch-specific access.");
        return;
      }
      if (!manageAccessData.branchIds.includes(manageAccessData.primaryBranchId)) {
        setErrorMessage("Primary Branch must be included in the Accessible Branches list.");
        return;
      }
    }

    setModalLoading(true);
    setErrorMessage("");
    try {
      const userId = managingUser._id || managingUser.id;

      // 1. Update role if changed
      const currentRoleId = managingUser.role?._id || managingUser.role;
      if (manageForm.roleId && manageForm.roleId !== currentRoleId) {
        await assignUserRole(userId, manageForm.roleId);
      }

      // 2. Update status if changed
      await updateAccountStatus(userId, {
        isActive: manageForm.isActive,
        isBlocked: manageForm.isBlocked,
      });

      // 3. Reset password if provided
      if (manageForm.newPassword && manageForm.newPassword.trim()) {
        await resetAccountCredentials(userId, manageForm.newPassword.trim());
      }

      // 4. Update Organization & Branch Access
      await updateUserAccess(userId, {
        organizationId: manageAccessData.organizationId || organization?._id,
        accessLevel: manageAccessData.accessLevel,
        primaryBranchId: manageAccessData.accessLevel === "ORGANIZATION" ? null : manageAccessData.primaryBranchId,
        branchIds: manageAccessData.accessLevel === "ORGANIZATION" ? [] : manageAccessData.branchIds,
      });

      setSuccessMessage(
        `Account and access settings updated for ${managingUser.firstName} ${managingUser.lastName}.`
      );
      setShowManageModal(false);
      await loadData();
      await refreshAuthContext();
    } catch (err) {
      setErrorMessage(err.message || "Failed to update account");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Derived Real-Data Metrics (Strictly Dynamic Real Data) ──
  const totalEmployeesCount = users.length;
  const activeLoginsCount = useMemo(() => {
    return users.filter((u) => u.hasLoginAccess && u.isActive && !u.isBlocked).length;
  }, [users]);
  const pendingProvisionCount = useMemo(() => {
    return users.filter((u) => !u.hasLoginAccess).length;
  }, [users]);
  const configuredRolesCount = roles.length;

  // ── Filtered Users List ──
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const empCode = (u.employeeCode || "").toLowerCase();
      const dept = (u.department || "").toLowerCase();
      const search = userSearch.toLowerCase().trim();
      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        email.includes(search) ||
        empCode.includes(search) ||
        dept.includes(search);

      if (!matchesSearch) return false;

      // Status filter
      if (accountStatusFilter === "active" && (!u.hasLoginAccess || !u.isActive || u.isBlocked)) return false;
      if (accountStatusFilter === "no-account" && u.hasLoginAccess) return false;
      if (accountStatusFilter === "blocked" && !u.isBlocked) return false;
      if (accountStatusFilter === "inactive" && (u.isActive || !u.hasLoginAccess)) return false;

      // Role filter
      if (roleFilter !== "all") {
        const uRoleId = u.role?._id || u.role;
        if (uRoleId !== roleFilter) return false;
      }

      return true;
    });
  }, [users, userSearch, accountStatusFilter, roleFilter]);

  // ── Dynamic Pagination for Users ──
  const totalFilteredUsers = filteredUsers.length;
  const totalUserPages = Math.ceil(totalFilteredUsers / USER_PAGE_SIZE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(start, start + USER_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  // Safe boundary check
  useEffect(() => {
    if (userPage > totalUserPages && totalUserPages > 0) {
      setUserPage(totalUserPages);
    }
  }, [totalUserPages, userPage]);

  // ── Filtered Roles List ──
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const search = roleSearch.toLowerCase().trim();
      const roleName = (role.roleName || "").toLowerCase();
      const roleCode = (role.roleCode || "").toLowerCase();
      const description = (role.description || "").toLowerCase();
      const matchesSearch =
        !search ||
        roleName.includes(search) ||
        roleCode.includes(search) ||
        description.includes(search);

      if (!matchesSearch) return false;

      const isSystem = Boolean(
        role.isSystemRole ||
        role.priority <= 2 ||
        ["OWNER", "ADMIN", "HR", "EMPLOYEE"].includes(role.roleCode)
      );

      if (roleTypeFilter === "system" && !isSystem) return false;
      if (roleTypeFilter === "custom" && isSystem) return false;

      return true;
    });
  }, [roles, roleSearch, roleTypeFilter]);

  // ── Dynamic Pagination for Roles ──
  const totalFilteredRoles = filteredRoles.length;
  const totalRolePages = Math.ceil(totalFilteredRoles / ROLE_PAGE_SIZE) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (rolePage - 1) * ROLE_PAGE_SIZE;
    return filteredRoles.slice(start, start + ROLE_PAGE_SIZE);
  }, [filteredRoles, rolePage]);

  // Safe boundary check
  useEffect(() => {
    if (rolePage > totalRolePages && totalRolePages > 0) {
      setRolePage(totalRolePages);
    }
  }, [totalRolePages, rolePage]);

  // Helper for Initials
  const getInitials = (firstName, lastName) => {
    const f = (firstName || "").charAt(0);
    const l = (lastName || "").charAt(0);
    return (f + l).toUpperCase() || "?";
  };

  // ── Employee Directory Pagination Render Component ──
  const renderUserPagination = () => {
    if (totalFilteredUsers === 0) return null;
    const startIdx = (userPage - 1) * USER_PAGE_SIZE + 1;
    const endIdx = Math.min(userPage * USER_PAGE_SIZE, totalFilteredUsers);

    return (
      <div className="user-mgmt-pagination-bar d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 px-md-4 py-2 bg-white border-top">
        <div className="text-muted extra-small">
          Showing <span className="fw-bold text-dark">{startIdx}–{endIdx}</span> of{" "}
          <span className="fw-bold text-dark">{totalFilteredUsers}</span> employees
        </div>
        <Pagination size="sm" className="mb-0 user-mgmt-pagination">
          <Pagination.Prev
            disabled={userPage === 1}
            onClick={() => setUserPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Pagination.Prev>
          {[...Array(totalUserPages)].map((_, i) => {
            const pg = i + 1;
            if (totalUserPages > 7) {
              if (pg !== 1 && pg !== totalUserPages && Math.abs(pg - userPage) > 2) {
                if (pg === 2 || pg === totalUserPages - 1) {
                  return <Pagination.Ellipsis key={`ell-u-${pg}`} disabled />;
                }
                return null;
              }
            }
            return (
              <Pagination.Item
                key={pg}
                active={pg === userPage}
                onClick={() => setUserPage(pg)}
              >
                {pg}
              </Pagination.Item>
            );
          })}
          <Pagination.Next
            disabled={userPage === totalUserPages}
            onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
          >
            Next
          </Pagination.Next>
        </Pagination>
      </div>
    );
  };

  // ── Roles Table Pagination Render Component ──
  const renderRolePagination = () => {
    if (totalFilteredRoles === 0) return null;
    const startIdx = (rolePage - 1) * ROLE_PAGE_SIZE + 1;
    const endIdx = Math.min(rolePage * ROLE_PAGE_SIZE, totalFilteredRoles);

    return (
      <div className="user-mgmt-pagination-bar d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 px-md-4 py-2 bg-white border-top">
        <div className="text-muted extra-small">
          Showing <span className="fw-bold text-dark">{startIdx}–{endIdx}</span> of{" "}
          <span className="fw-bold text-dark">{totalFilteredRoles}</span> roles
        </div>
        <Pagination size="sm" className="mb-0 user-mgmt-pagination">
          <Pagination.Prev
            disabled={rolePage === 1}
            onClick={() => setRolePage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Pagination.Prev>
          {[...Array(totalRolePages)].map((_, i) => {
            const pg = i + 1;
            if (totalRolePages > 7) {
              if (pg !== 1 && pg !== totalRolePages && Math.abs(pg - rolePage) > 2) {
                if (pg === 2 || pg === totalRolePages - 1) {
                  return <Pagination.Ellipsis key={`ell-r-${pg}`} disabled />;
                }
                return null;
              }
            }
            return (
              <Pagination.Item
                key={pg}
                active={pg === rolePage}
                onClick={() => setRolePage(pg)}
              >
                {pg}
              </Pagination.Item>
            );
          })}
          <Pagination.Next
            disabled={rolePage === totalRolePages}
            onClick={() => setRolePage((p) => Math.min(totalRolePages, p + 1))}
          >
            Next
          </Pagination.Next>
        </Pagination>
      </div>
    );
  };

  return (
    <Container fluid className="px-0 user-mgmt-container">
      {/* ── Page Header ── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <FaUserShield className="text-success" /> User & Role Management
          </h4>
          <p className="text-muted small mb-0">
            Provision employee credentials, manage assigned roles, and configure organizational RBAC permissions.
          </p>
        </div>

        {isSystemAdmin && (
          <Button
            variant="success"
            className="user-mgmt-create-btn d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm fw-semibold text-nowrap"
            onClick={handleOpenCreateRoleModal}
          >
            <FaPlus size={11} /> Create Custom Role
          </Button>
        )}
      </div>

      {/* ── Real Data KPI Summary Row ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <div className="user-mgmt-kpi-card">
            <div className="d-flex align-items-center gap-3">
              <div className="user-mgmt-kpi-icon icon-employees">
                <FaUsers />
              </div>
              <div className="min-w-0">
                <div className="user-mgmt-kpi-val text-dark">{totalEmployeesCount}</div>
                <div className="user-mgmt-kpi-lbl">Total Employees</div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="user-mgmt-kpi-card">
            <div className="d-flex align-items-center gap-3">
              <div className="user-mgmt-kpi-icon icon-active">
                <FaUserCheck />
              </div>
              <div className="min-w-0">
                <div className="user-mgmt-kpi-val text-success">{activeLoginsCount}</div>
                <div className="user-mgmt-kpi-lbl">Active Logins</div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="user-mgmt-kpi-card">
            <div className="d-flex align-items-center gap-3">
              <div className="user-mgmt-kpi-icon icon-provision">
                <FaUserPlus />
              </div>
              <div className="min-w-0">
                <div className="user-mgmt-kpi-val text-warning">{pendingProvisionCount}</div>
                <div className="user-mgmt-kpi-lbl">Need Provisioning</div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="user-mgmt-kpi-card">
            <div className="d-flex align-items-center gap-3">
              <div className="user-mgmt-kpi-icon icon-roles">
                <FaShieldAlt />
              </div>
              <div className="min-w-0">
                <div className="user-mgmt-kpi-val text-dark">{configuredRolesCount}</div>
                <div className="user-mgmt-kpi-lbl">Configured Roles</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Alerts ── */}
      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage("")} className="small py-2 mb-3">
          <FaExclamationTriangle className="me-2" />
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage("")} className="small py-2 mb-3">
          <FaCheckCircle className="me-2" />
          {successMessage}
        </Alert>
      )}

      {/* ── Section Navigation Tabs (Exclusive Section View) ── */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-1">
        <div className="user-mgmt-nav-wrapper">
          <button
            type="button"
            className={`user-mgmt-nav-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <FaUsers className="me-1.5" /> Employee Directory & Accounts
            <span className="user-mgmt-tab-count ms-2">({users.length})</span>
          </button>

          {isSystemAdmin && (
            <button
              type="button"
              className={`user-mgmt-nav-tab ${activeTab === "roles" ? "active" : ""}`}
              onClick={() => setActiveTab("roles")}
            >
              <FaShieldAlt className="me-1.5" /> Roles & Permissions Architecture
              <span className="user-mgmt-tab-count ms-2">({roles.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Section 1: Employee Directory & Account Provisioning ── */}
      {activeTab === "users" && (
        <Card className="user-mgmt-table-card border-0 shadow-sm overflow-hidden mb-4">
          {/* Header & Filter Bar */}
          <div className="user-mgmt-filter-header">
            <div className="d-flex align-items-center flex-wrap gap-2">
              {/* Search Bar */}
              <div className="user-mgmt-search-box flex-grow-1" style={{ minWidth: "220px", maxWidth: "380px" }}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-light border-end-0 text-muted">
                    <FaSearch size={12} />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search employee..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    className="shadow-none border-start-0 user-mgmt-ctrl"
                  />
                  {userSearch && (
                    <Button
                      variant="light"
                      className="border border-start-0"
                      onClick={() => {
                        setUserSearch("");
                        setUserPage(1);
                      }}
                    >
                      <FaTimes size={11} className="text-muted" />
                    </Button>
                  )}
                </InputGroup>
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: "160px" }}>
                <Form.Select
                  size="sm"
                  className="shadow-none user-mgmt-ctrl"
                  value={accountStatusFilter}
                  onChange={(e) => {
                    setAccountStatusFilter(e.target.value);
                    setUserPage(1);
                  }}
                >
                  <option value="all">Login Status</option>
                  <option value="active">Active Logins Only</option>
                  <option value="no-account">Need Provisioning (No Account)</option>
                  <option value="blocked">Blocked / Locked</option>
                  <option value="inactive">Inactive / Suspended</option>
                </Form.Select>
              </div>

              {/* Role Filter */}
              <div style={{ minWidth: "160px" }}>
                <Form.Select
                  size="sm"
                  className="shadow-none user-mgmt-ctrl"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                >
                  <option value="all">Role</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roleName} ({r.roleCode})
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Reset Filter Button */}
              {(userSearch || accountStatusFilter !== "all" || roleFilter !== "all") && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="user-mgmt-ctrl d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    setUserSearch("");
                    setAccountStatusFilter("all");
                    setRoleFilter("all");
                    setUserPage(1);
                  }}
                >
                  <FaTimes size={11} /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" size="sm" />
                <div className="small text-muted mt-2">Loading employee directory...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaUsers size={32} className="mb-2 opacity-50" />
                <p className="small mb-0">No employees match your search or filter criteria.</p>
              </div>
            ) : (
              <Table hover align="middle" className="mb-0 small user-mgmt-table">
                <thead className="table-light extra-small text-uppercase text-muted">
                  <tr>
                    <th className="ps-3 ps-md-4" style={{ width: "24%" }}>Employee</th>
                    <th style={{ width: "11%" }}>Employee Code</th>
                    <th style={{ width: "14%" }}>Department / Role</th>
                    <th style={{ width: "18%" }}>Branch Access</th>
                    <th style={{ width: "12%" }}>Login Status</th>
                    <th style={{ width: "11%" }}>Assigned Role</th>
                    <th className="text-end pe-3 pe-md-4" style={{ width: "10%" }}>Account Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => {
                    const hasAccount = u.hasLoginAccess === true;
                    const isOwnerUser = u.role?.priority === 1 || u.role?.roleCode === "OWNER";
                    const canModify =
                      currentUser?.priority === 1 ||
                      (!isOwnerUser && (isSystemAdmin || hasPermission("user.manage_roles")));
                    const initials = getInitials(u.firstName, u.lastName);
                    const isOrgWide = u.accessLevel === "ORGANIZATION" || (!u.accessLevel && isOwnerUser);
                    const branchCount = Array.isArray(u.branchIds)
                      ? u.branchIds.length
                      : Array.isArray(u.branches)
                      ? u.branches.length
                      : 0;
                    const pBranchName =
                      u.primaryBranch?.branchName ||
                      u.primaryBranchId?.branchName ||
                      u.primaryBranchName ||
                      contextBranches.find((b) => b._id === (u.primaryBranchId || u.primaryBranch))?.branchName ||
                      "Branch";

                    return (
                      <tr key={u._id || u.id}>
                        <td className="ps-3 ps-md-4">
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className={`user-mgmt-avatar-chip ${hasAccount ? "account-active" : "account-none"}`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="fw-semibold text-dark text-truncate">
                                {u.firstName} {u.lastName}
                              </div>
                              <div className="extra-small text-muted text-truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code>{u.employeeCode || "—"}</code>
                        </td>
                        <td>
                          <div className="small text-dark fw-medium text-truncate">{u.department || "General"}</div>
                          <div className="extra-small text-muted text-truncate">{u.designation || "Employee"}</div>
                        </td>
                        <td>
                          {isOrgWide ? (
                            <div>
                              <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary-subtle rounded-pill px-2 py-0.5 fw-medium">
                                <FaBuilding size={9} className="me-1" /> All Branches
                              </Badge>
                              <div className="extra-small text-muted mt-0.5">Org-wide Access</div>
                            </div>
                          ) : (
                            <div>
                              <div className="d-flex align-items-center gap-1">
                                <Badge bg="light" text="dark" className="border rounded-pill px-2 py-0.5 fw-medium text-truncate" style={{ maxWidth: "150px" }}>
                                  <FaCodeBranch size={9} className="me-1 text-success" />
                                  {pBranchName}
                                </Badge>
                              </div>
                              {branchCount > 1 ? (
                                <div className="extra-small text-muted mt-0.5">
                                  +{branchCount - 1} additional branch{branchCount - 1 > 1 ? "es" : ""}
                                </div>
                              ) : (
                                <div className="extra-small text-muted mt-0.5">Single Branch</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="text-nowrap">
                          {!hasAccount ? (
                            <span className="app-pill app-pill-warning">
                              No Login Account
                            </span>
                          ) : u.isBlocked ? (
                            <Badge bg="danger" className="rounded-pill px-2 py-1">
                              <FaLock size={10} className="me-1" /> Blocked
                            </Badge>
                          ) : u.isActive ? (
                            <span className="app-pill app-pill-success">
                              <FaUserCheck size={11} /> Active
                            </span>
                          ) : (
                            <span className="app-pill app-pill-muted">
                              <FaUserTimes size={11} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="text-nowrap">
                          {u.role ? (
                            <Badge
                              bg={u.role.priority === 1 ? "danger" : u.role.priority === 2 ? "warning" : "light"}
                              text={u.role.priority <= 2 ? "white" : "dark"}
                              className="border px-2 py-1 rounded-pill"
                            >
                              <FaKey size={10} className="me-1" />
                              {u.role.roleName || "Employee"}
                            </Badge>
                          ) : (
                            <span className="text-muted extra-small">Not Assigned</span>
                          )}
                        </td>
                        <td className="text-end pe-3 pe-md-4 text-nowrap">
                          {!hasAccount ? (
                            (isSystemAdmin || hasPermission("user.provision_account")) && (
                              <Button
                                variant="success"
                                size="sm"
                                className="rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm micro-text text-nowrap"
                                onClick={() => handleOpenProvisionModal(u)}
                              >
                                <FaUserPlus size={11} /> Create Account
                              </Button>
                            )
                          ) : (
                            canModify && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 micro-text text-nowrap"
                                onClick={() => handleOpenManageModal(u)}
                              >
                                <FaCog size={11} /> Manage
                              </Button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredUsers.length > 0 && renderUserPagination()}
        </Card>
      )}

      {/* ── Section 2: Roles & Permissions Architecture (Admin / Owner Only) ── */}
      {isSystemAdmin && activeTab === "roles" && (
        <Card className="user-mgmt-table-card border-0 shadow-sm overflow-hidden mb-4">
          {/* Header & Filter Bar */}
          <div className="user-mgmt-filter-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="fw-bold text-dark fs-6">Configured Organizational Roles</span>
            </div>

            <div className="d-flex align-items-center flex-wrap gap-2">
              {/* Search Role */}
              <div style={{ minWidth: "200px", maxWidth: "280px" }}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-light border-end-0 text-muted">
                    <FaSearch size={12} />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search role..."
                    value={roleSearch}
                    onChange={(e) => {
                      setRoleSearch(e.target.value);
                      setRolePage(1);
                    }}
                    className="shadow-none border-start-0 user-mgmt-ctrl"
                  />
                  {roleSearch && (
                    <Button
                      variant="light"
                      className="border border-start-0"
                      onClick={() => {
                        setRoleSearch("");
                        setRolePage(1);
                      }}
                    >
                      <FaTimes size={11} className="text-muted" />
                    </Button>
                  )}
                </InputGroup>
              </div>

              {/* Role Type Filter */}
              <div style={{ minWidth: "150px" }}>
                <Form.Select
                  size="sm"
                  className="shadow-none user-mgmt-ctrl"
                  value={roleTypeFilter}
                  onChange={(e) => {
                    setRoleTypeFilter(e.target.value);
                    setRolePage(1);
                  }}
                >
                  <option value="all">Role Type</option>
                  <option value="system">System Core</option>
                  <option value="custom">Custom Roles</option>
                </Form.Select>
              </div>

              {/* Reset Filter Button */}
              {(roleSearch || roleTypeFilter !== "all") && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="user-mgmt-ctrl d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    setRoleSearch("");
                    setRoleTypeFilter("all");
                    setRolePage(1);
                  }}
                >
                  <FaTimes size={11} /> Reset
                </Button>
              )}
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" size="sm" />
                <div className="small text-muted mt-2">Loading organizational roles...</div>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaShieldAlt size={32} className="mb-2 opacity-50" />
                <p className="small mb-0">No roles match your search or filter criteria.</p>
              </div>
            ) : (
              <Table hover align="middle" className="mb-0 small user-mgmt-table">
                <thead className="table-light extra-small text-uppercase text-muted">
                  <tr>
                    <th className="ps-3 ps-md-4" style={{ width: "30%" }}>Role</th>
                    <th style={{ width: "15%" }}>Role Code</th>
                    <th style={{ width: "15%" }}>Priority</th>
                    <th style={{ width: "20%" }}>Access Summary</th>
                    <th style={{ width: "10%" }}>Users</th>
                    <th className="text-end pe-3 pe-md-4" style={{ width: "10%" }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.map((role) => {
                    const isSystemRole = Boolean(
                      role.isSystemRole ||
                      role.priority <= 2 ||
                      ["OWNER", "ADMIN", "HR", "EMPLOYEE"].includes(role.roleCode)
                    );
                    const canEdit =
                      !isSystemRole || currentUser?.priority === 1;
                    const canDelete =
                      !isSystemRole &&
                      !["OWNER", "ADMIN", "HR", "EMPLOYEE"].includes(role.roleCode) &&
                      role.priority > 2;

                    return (
                      <tr key={role._id}>
                        <td className="ps-3 ps-md-4">
                          <div className="d-flex align-items-start gap-2">
                            <FaShieldAlt
                              className={`mt-1 flex-shrink-0 ${role.priority <= 2 ? "text-danger" : "text-success"}`}
                              size={14}
                            />
                            <div className="min-w-0">
                              <div className="fw-bold text-dark text-truncate">{role.roleName}</div>
                              {role.description && (
                                <div className="role-desc-clamp extra-small text-muted" title={role.description}>
                                  {role.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-nowrap">
                          <code>{role.roleCode}</code>
                        </td>
                        <td className="text-nowrap">
                          <Badge
                            bg={role.priority === 1 ? "danger" : role.priority === 2 ? "warning" : "secondary"}
                            className="rounded-pill px-2 py-1 fw-medium"
                          >
                            Priority {role.priority} {role.priority === 1 ? "(Owner)" : role.priority === 2 ? "(Admin)" : ""}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <div>
                              {isSystemRole ? (
                                <span className="role-badge-system">System Core</span>
                              ) : (
                                <span className="role-badge-custom">Custom Role</span>
                              )}
                            </div>
                            <div className="extra-small text-muted text-nowrap">
                              <span className="fw-semibold text-dark">{role.menuCount || 0} Modules</span> •{" "}
                              <span className="fw-semibold text-success">{role.permissionCount || 0} Actions</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-nowrap">
                          <Badge bg="light" text="dark" className="border px-2 py-1 rounded-pill">
                            <FaUsers className="me-1 text-muted" /> {role.userCount || 0}
                          </Badge>
                        </td>
                        <td className="text-end pe-3 pe-md-4 text-nowrap">
                          <div className="d-inline-flex align-items-center justify-content-end gap-1.5">
                            {canEdit && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="rounded-pill px-2.5 py-1 micro-text text-nowrap d-inline-flex align-items-center gap-1"
                                onClick={() => handleOpenEditRoleModal(role)}
                              >
                                <FaEdit size={11} /> Edit Access
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="rounded-pill p-1.5 d-inline-flex align-items-center justify-content-center role-delete-btn"
                                onClick={() => handleDeleteRole(role)}
                                title="Delete custom role"
                              >
                                <FaTrash size={11} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredRoles.length > 0 && renderRolePagination()}
        </Card>
      )}

      {/* ========================================================
          MODAL: CREATE LOGIN ACCOUNT (PROVISIONING)
          ======================================================== */}
      <Modal
        show={showProvisionModal}
        onHide={() => setShowProvisionModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
            <FaUserPlus className="text-success" /> Provision Employee Login Account
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleProvisionSubmit}>
          <Modal.Body className="p-4">
            {/* Employee Summary Card */}
            <Card className="bg-light border-0 mb-3 p-3 rounded-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="fw-bold mb-0 text-dark">
                    {provisioningUser?.firstName} {provisioningUser?.lastName}
                  </h6>
                  <span className="extra-small text-muted">{provisioningUser?.email}</span>
                </div>
                <Badge bg="dark">
                  <code>{provisioningUser?.employeeCode}</code>
                </Badge>
              </div>
              <div className="extra-small text-muted mt-2">
                Department: <strong>{provisioningUser?.department || "General"}</strong> | Designation:{" "}
                <strong>{provisioningUser?.designation || "Employee"}</strong>
              </div>
            </Card>

            {/* Role Selection */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Assign Initial Role *</Form.Label>
              <Form.Select
                value={provisionForm.roleId}
                onChange={(e) => setProvisionForm({ ...provisionForm, roleId: e.target.value })}
                required
                className="shadow-none"
              >
                <option value="">-- Select Permitted Role --</option>
                {assignableRoles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roleName} (Level {r.priority})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="extra-small text-muted">
                Available roles are filtered based on your security clearance.
              </Form.Text>
            </Form.Group>

            {/* Initial Password */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Initial Temporary Password *</Form.Label>
              <InputGroup>
                <Form.Control
                  type={provisionForm.showPass ? "text" : "password"}
                  value={provisionForm.password}
                  onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                  placeholder="Enter temporary password (min 6 chars)"
                  required
                  className="shadow-none"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setProvisionForm((p) => ({ ...p, showPass: !p.showPass }))}
                >
                  {provisionForm.showPass ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
              <Form.Text className="extra-small text-muted">
                The employee will use this password to log in and can update it afterwards.
              </Form.Text>
            </Form.Group>

            {/* Account Status */}
            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                id="provisionActiveCheck"
                label="Activate account immediately upon creation"
                checked={provisionForm.isActive}
                onChange={(e) => setProvisionForm({ ...provisionForm, isActive: e.target.checked })}
                className="small fw-semibold"
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" size="sm" onClick={() => setShowProvisionModal(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={modalLoading}>
              {modalLoading ? "Provisioning..." : "Create Login Account"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================
          MODAL: MANAGE ACCOUNT (Role, Status, Password Reset & Branch Access)
          ======================================================== */}
      <Modal
        show={showManageModal}
        onHide={() => setShowManageModal(false)}
        size="lg"
        centered
        backdrop="static"
        scrollable
      >
        <Modal.Header closeButton className="border-bottom pb-3">
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2 mb-0">
            <FaCog className="text-primary" /> Manage Employee Account & Access
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleManageSubmit}>
          <Modal.Body className="p-3 p-md-4">
            {/* User Info Header */}
            <div className="mb-3 p-3 bg-light rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h6 className="fw-bold mb-1 text-dark">
                  {managingUser?.firstName} {managingUser?.lastName}
                </h6>
                <div className="extra-small text-muted">
                  {managingUser?.email} | <code>{managingUser?.employeeCode || "N/A"}</code> | {managingUser?.department || "General"}
                </div>
              </div>
              <Badge bg="secondary" className="px-2.5 py-1.5 rounded-pill fw-medium extra-small">
                {managingUser?.role?.roleName || "Employee"}
              </Badge>
            </div>

            {/* Modal Navigation Tabs */}
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link
                  active={manageModalTab === "account"}
                  onClick={() => setManageModalTab("account")}
                  className="small fw-semibold py-2"
                >
                  <FaKey className="me-1.5 text-primary" /> Account & Credentials
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={manageModalTab === "access"}
                  onClick={() => setManageModalTab("access")}
                  className="small fw-semibold py-2"
                >
                  <FaBuilding className="me-1.5 text-success" /> Organization & Branch Access
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* TAB 1: Account & Credentials */}
            {manageModalTab === "account" && (
              <div>
                {/* Role Reassignment */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Assigned Security Role</Form.Label>
                  <Form.Select
                    value={manageForm.roleId}
                    onChange={(e) => setManageForm({ ...manageForm, roleId: e.target.value })}
                    required
                    className="shadow-none"
                  >
                    <option value="">-- Choose Role --</option>
                    {assignableRoles.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.roleName} (Level {r.priority})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Status Checks */}
                <Row className="g-3 mb-3">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Account Status</Form.Label>
                      <Form.Select
                        value={manageForm.isActive ? "true" : "false"}
                        onChange={(e) => setManageForm({ ...manageForm, isActive: e.target.value === "true" })}
                        className="shadow-none"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive / Suspended</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Access Lock</Form.Label>
                      <Form.Select
                        value={manageForm.isBlocked ? "true" : "false"}
                        onChange={(e) => setManageForm({ ...manageForm, isBlocked: e.target.value === "true" })}
                        className="shadow-none"
                      >
                        <option value="false">Normal Access</option>
                        <option value="true">Blocked / Locked</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Reset Password */}
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold">Reset Password (Optional)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={manageForm.showPass ? "text" : "password"}
                      value={manageForm.newPassword}
                      onChange={(e) => setManageForm({ ...manageForm, newPassword: e.target.value })}
                      placeholder="Leave blank to keep existing password"
                      className="shadow-none"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setManageForm((p) => ({ ...p, showPass: !p.showPass }))}
                    >
                      {manageForm.showPass ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>
              </div>
            )}

            {/* TAB 2: Organization & Branch Access */}
            {manageModalTab === "access" && (
              <div>
                {loadingAccess ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="success" size="sm" />
                    <div className="extra-small text-muted mt-2">Loading user branch access settings...</div>
                  </div>
                ) : (
                  <BranchAccessSelector
                    value={manageAccessData}
                    onChange={setManageAccessData}
                    onValidationChange={setManageAccessValidation}
                  />
                )}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="border-top pt-3">
            <Button variant="light" size="sm" onClick={() => setShowManageModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={modalLoading || (manageModalTab === "access" && !manageAccessValidation.isValid)}
            >
              {modalLoading ? "Saving..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================
          MODAL: CREATE / EDIT CUSTOM ROLE
          ======================================================== */}
      <Modal
        show={showRoleModal}
        onHide={() => setShowRoleModal(false)}
        size="lg"
        centered
        backdrop="static"
        scrollable
      >
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <FaUserShield className="text-success" />
            {editingRoleId ? "Edit Role Access Configuration" : "Create New Custom Role"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {modalLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <div className="small text-muted mt-2">Loading role details...</div>
            </div>
          ) : (
            <Form onSubmit={handleSaveRole}>
              {/* Basic Details */}
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Role Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Senior Project Lead, QA Specialist"
                      value={roleForm.roleName}
                      onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                      required
                      className="shadow-none"
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Priority Hierarchy</Form.Label>
                    <Form.Select
                      value={roleForm.priority}
                      onChange={(e) => setRoleForm({ ...roleForm, priority: Number(e.target.value) })}
                      className="shadow-none"
                    >
                      <option value={3}>Level 3 (Staff / Custom)</option>
                      <option value={2}>Level 2 (Admin Level)</option>
                      {roleForm.priority === 1 && <option value={1}>Level 1 (Owner)</option>}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Status</Form.Label>
                    <Form.Select
                      value={roleForm.isActive ? "true" : "false"}
                      onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.value === "true" })}
                      className="shadow-none"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Description</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Summary of responsibilities and scope of this role"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="shadow-none"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* ── Section 1: Module Access (RoleMenu) ── */}
              <div className="mb-4 p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0 text-dark">
                    1. Application Module Access (Sidebar Visibility)
                  </h6>
                  <span className="extra-small text-muted">
                    Determines which modules appear in the user sidebar
                  </span>
                </div>

                <Row className="g-2 pt-2">
                  {menus.map((menu) => {
                    const isChecked = roleForm.selectedMenuIds.includes(menu._id);
                    return (
                      <Col xs={6} md={4} key={menu._id}>
                        <div
                          className={`p-2 user-mgmt-checkbox-item d-flex align-items-center gap-2 ${
                            isChecked ? "selected text-success fw-bold shadow-sm" : "text-secondary"
                          }`}
                          onClick={() => toggleMenu(menu._id)}
                        >
                          {isChecked ? <FaCheckSquare /> : <FaSquare className="text-muted" />}
                          <span className="small">{menu.menuName}</span>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>

              {/* ── Section 2: Granular Action Permissions (RolePermission) ── */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">
                      2. Granular API Action Permissions
                    </h6>
                    <span className="extra-small text-muted">
                      Backend authorization will strictly enforce these action rights
                    </span>
                  </div>
                </div>

                {Object.keys(catalog).map((moduleName) => {
                  const perms = catalog[moduleName] || [];
                  const moduleCodes = perms.map((p) => p.permissionCode);
                  const isAllSelected = moduleCodes.every((c) =>
                    roleForm.selectedPermissionCodes.includes(c)
                  );

                  return (
                    <Card key={moduleName} className="mb-3 border shadow-none">
                      <Card.Header className="bg-white py-2 d-flex justify-content-between align-items-center border-bottom">
                        <span className="fw-bold text-dark small">
                          📦 {moduleName.toUpperCase()} MODULE
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 extra-small text-decoration-none text-success fw-semibold"
                          onClick={() => toggleModulePermissions(moduleName)}
                        >
                          {isAllSelected ? "Deselect All" : "Select All"}
                        </Button>
                      </Card.Header>
                      <Card.Body className="p-3">
                        <Row className="g-2">
                          {perms.map((p) => {
                            const isSelected = roleForm.selectedPermissionCodes.includes(
                              p.permissionCode
                            );
                            return (
                              <Col md={6} key={p.permissionCode}>
                                <div
                                  className={`p-2 user-mgmt-checkbox-item ${
                                    isSelected
                                      ? "selected text-dark shadow-xs"
                                      : "text-muted"
                                  }`}
                                  onClick={() => togglePermission(p.permissionCode)}
                                >
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    {isSelected ? (
                                      <FaCheckSquare className="text-success" />
                                    ) : (
                                      <FaSquare className="text-muted" />
                                    )}
                                    <span className="small fw-semibold">
                                      {p.permissionName}
                                    </span>
                                  </div>
                                  <div className="extra-small text-muted ps-4">
                                    <code>{p.permissionCode}</code>
                                  </div>
                                </div>
                              </Col>
                            );
                          })}
                        </Row>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                <Button variant="light" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </Button>
                <Button variant="success" type="submit" disabled={modalLoading}>
                  {modalLoading ? "Saving..." : editingRoleId ? "Update Role Access" : "Create Role"}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default UserManagement;