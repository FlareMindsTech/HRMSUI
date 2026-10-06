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
  InputGroup,
} from "react-bootstrap";
import {
  FaUserShield,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
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
  FaTimes,
  FaBuilding,
  FaCodeBranch,
  FaLock,
  FaSave,
} from "react-icons/fa";
import {
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  fetchRoleById,
  fetchRoleAccessConfig,
  assignUserRole,
  provisionUserAccount,
  updateAccountStatus,
  resetAccountCredentials,
  canAssignRole,
  validateRolePayload,
  minCreatablePriority,
} from "../../services/rbacService";
import {
  getAllPasswordResetRules,
  createOrUpdatePasswordResetRule,
  deletePasswordResetRule,
  getPendingPasswordResetApprovals,
  approveOrRejectPasswordReset,
} from "../../services/passwordResetService";
import { fetchUserAccess, updateUserAccess } from "../../services/accessService";
import {
  fetchOnboardings,
  completeOnboarding,
  activateEmployee,
  provisionOnboardingAccount,
} from "../../Api/Hr/hr";
import { useSelector, useDispatch } from 'react-redux';
import { selectAuthUser, useHasPermission, selectIsSystemAdmin, fetchAuth } from '../../redux/slices/authSlice';
import {
  fetchAccessMasters,
  fetchRolesFiltered,
  selectRoles,
  selectAssignableRoles,
  selectPermissionCatalog,
  selectAllMenus,
} from '../../redux/slices/accessSlice';
import {
  fetchDirectory,
  selectAllEmployees,
} from '../../redux/slices/directorySlice';
import { useBranch } from "../../context/BranchContext";
import BranchAccessSelector from "../../Components/Common/BranchAccessSelector";
import LoadingSpinner from "../../Components/Common/LoadingSpinner";
import PaginationBar from "../../Components/Common/PaginationBar";
import ConfirmModal from "../../Components/Common/ConfirmModal";
import AppToast from "../../Components/Common/AppToast";
import SearchInput from "../../Components/Common/SearchInput";
import FilterSelect from "../../Components/Common/FilterSelect";
import "./UserManagement.css";

function UserManagement({ initialTab = "users" }) {
  const currentUser = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const hasPermission = useHasPermission();
  const dispatch = useDispatch();
  // Post-mutation refresh must bypass the fetchAuth TTL so role/permission
  // changes revalidate immediately.
  const refreshAuthContext = () => dispatch(fetchAuth({ force: true }));
  const { organization, branches: contextBranches } = useBranch();

  // ── Tab State: Exclusive rendering ("users" or "roles") ──
  const [activeTab, setActiveTab] = useState(initialTab || "users");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ── Roles & Catalog State ──
  // Shared RBAC masters live in the access slice (single guarded fetch) and
  // the user roster lives in the directory slice (single guarded fetch);
  // role filters, role forms, search/pagination and modals stay local.
  const users = useSelector(selectAllEmployees);
  const roles = useSelector(selectRoles);
  const assignableRoles = useSelector(selectAssignableRoles);
  const catalog = useSelector(selectPermissionCatalog);
  const menus = useSelector(selectAllMenus);

  // ── Loading & Notification States ──
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── Delete Role Confirm Modal State ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Create / Edit Custom Role Modal State ──
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({
    roleName: "",
    description: "",
    priority: 3,
    accessLevel: "BRANCH",
    isActive: true,
    selectedMenuIds: [],
    selectedPermissionCodes: [],
  });

  // ── Password Reset Rules & Approvals State ──
  const [resetRules, setResetRules] = useState([]);
  const [resetApprovals, setResetApprovals] = useState([]);
  const [resetLoading, setResetLoading] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    requesterRole: '',
    approverRole: '',
    approvalRequired: true,
    isActive: true,
  });
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [approvedTokenInfo, setApprovedTokenInfo] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  const loadPasswordResetData = useCallback(async () => {
    if (!isSystemAdmin) return;
    setResetLoading(true);
    try {
      const [rulesRes, approvalsRes] = await Promise.allSettled([
        getAllPasswordResetRules(),
        getPendingPasswordResetApprovals(),
      ]);
      if (rulesRes.status === 'fulfilled') {
        const rList = Array.isArray(rulesRes.value?.data) ? rulesRes.value.data : (Array.isArray(rulesRes.value) ? rulesRes.value : []);
        setResetRules(rList);
      }
      if (approvalsRes.status === 'fulfilled') {
        const aList = Array.isArray(approvalsRes.value?.data) ? approvalsRes.value.data : (Array.isArray(approvalsRes.value) ? approvalsRes.value : []);
        setResetApprovals(aList);
      }
    } catch {
      // Non-blocking
    } finally {
      setResetLoading(false);
    }
  }, [isSystemAdmin]);

  useEffect(() => {
    if (activeTab === "security") {
      loadPasswordResetData();
    }
  }, [activeTab, loadPasswordResetData]);

  const handleApproveReset = async (requestId) => {
    try {
      const res = await approveOrRejectPasswordReset(requestId, 'approve');
      setSuccessMessage("Password reset request approved successfully.");
      if (res?.resetToken) {
        setApprovedTokenInfo({ token: res.resetToken, requestId });
        setShowTokenModal(true);
      }
      loadPasswordResetData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to approve password reset request.");
    }
  };

  const handleRejectReset = async (requestId) => {
    const reason = window.prompt("Enter rejection reason (optional):");
    if (reason === null) return;
    try {
      await approveOrRejectPasswordReset(requestId, 'reject', reason);
      setSuccessMessage("Password reset request rejected.");
      loadPasswordResetData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to reject password reset request.");
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.requesterRole) {
      setErrorMessage("Requester role is required.");
      return;
    }
    setRuleSubmitting(true);
    try {
      await createOrUpdatePasswordResetRule(ruleForm);
      setSuccessMessage("Password reset rule configured successfully.");
      setShowRuleModal(false);
      setEditingRule(null);
      loadPasswordResetData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to save password reset rule.");
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this password reset rule?")) return;
    try {
      await deletePasswordResetRule(ruleId);
      setSuccessMessage("Password reset rule deleted successfully.");
      loadPasswordResetData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete password reset rule.");
    }
  };

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
  // Default view shows completed (Active) accounts only — No Login Account
  // rows are one filter change away (Login Status → All / Need Provisioning).
  const [accountStatusFilter, setAccountStatusFilter] = useState("active");
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
  // Masters (roles, assignable roles, catalog, menus) come from the guarded
  // access slice; `forceMasters` bypasses its TTL cache after role mutations
  // so pickers show the new role immediately. Users come from the guarded
  // directory slice; `forceDirectory` bypasses its TTL cache after mutations
  // that change directory membership (provisioning, role/status changes).
  // Search/filter/pagination/selection stay page-local.
  const loadData = useCallback(async (options = {}) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await Promise.all([
        dispatch(
          fetchDirectory(options.forceDirectory ? { force: true } : undefined)
        ).catch(() => null),
        dispatch(
          fetchAccessMasters(options.forceMasters ? { force: true } : undefined)
        ).catch(() => null),
      ]);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load RBAC data");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Open Create Role Modal ──
  const handleOpenCreateRoleModal = () => {
    setEditingRoleId(null);
    setOriginalPriority(null);
    setFocusedMenuId(null);
    setModuleSearch("");
    setActionSearch("");
    setRoleForm({
      roleName: "",
      description: "",
      priority: 3,
      accessLevel: "BRANCH",
      isActive: true,
      selectedMenuIds: [],
      selectedPermissionCodes: [],
    });
    setShowRoleModal(true);
  };

  // ── Open Edit Role Modal ──
  // Pre-checks the role first: 404 = deleted since list load, 403 = cross-org.
  const handleOpenEditRoleModal = async (role) => {
    setEditingRoleId(role._id);
    setOriginalPriority(role.priority ?? 3);
    setFocusedMenuId(null);
    setModuleSearch("");
    setActionSearch("");
    setModalLoading(true);
    setShowRoleModal(true);

    try {
      const fresh = await fetchRoleById(role._id);
      const liveRole = fresh?.role || fresh || role;
      setOriginalPriority(liveRole.priority ?? 3);
      const config = await fetchRoleAccessConfig(role._id);
      setRoleForm({
        roleName: liveRole.roleName ?? role.roleName,
        description: liveRole.description || "",
        priority: liveRole.priority ?? 3,
        accessLevel: liveRole.accessLevel || "BRANCH",
        isActive: liveRole.isActive !== false,
        selectedMenuIds: (config?.menuIds || []).map(String),
        selectedPermissionCodes: config?.permissionCodes || [],
      });
    } catch (err) {
      setShowRoleModal(false);
      setEditingRoleId(null);
      setErrorMessage(
        err?.status === 404
          ? "This role no longer exists (deleted)."
          : err?.status === 403
            ? "You cannot edit a role from another organization."
            : "Failed to load role access configuration"
      );
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

  // ── Select All Permissions in a Module (scoped union helper) ──
  const toggleModulePermissions = (moduleCodes) => {
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

  // ── Menu ↔ permission-module linkage (Section 1 drives Section 2) ──
  // Menus (menuCode: ATTENDANCE, ASSETS…) and the permission catalog (module
  // keys: ATTENDANCE, ASSET…) use different vocabularies, so an explicit map
  // covers the known pairs and a token matcher covers the rest (menu
  // LEAVE_MGMT ↔ module LEAVE, ASSETS ↔ ASSET, USER_MANAGEMENT ↔ USER…).
  const MENU_TO_MODULES = {
    DASHBOARD: ["DASHBOARD"],
    ATTENDANCE: ["ATTENDANCE"],
    PROJECTS: ["PROJECT"],
    ORGANISATION: ["ORGANISATION", "ORGANIZATION"],
    LEAVE_MGMT: ["LEAVE"],
    REIMBURSEMENT: ["REIMBURSEMENT"],
    USER_MANAGEMENT: ["USER", "ONBOARDING"],
    ROLE_MANAGEMENT: ["ROLE", "APPROVAL"],
    ASSETS: ["ASSET"],
    PAYSLIP: ["PAYSLIP"],
    EPFO: ["EPFO"],
    MIS: ["MIS"],
  };
  const normToken = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, "");
  const getMenuId = (m) => String(m?._id || "");
  const modulesForMenu = (menuCode, catalogKeys) => {
    const direct = MENU_TO_MODULES[String(menuCode || "").toUpperCase()];
    if (direct) return direct.filter((k) => catalogKeys.includes(k));
    // Dynamic fallback: match catalog key against menu tokens, tolerating a
    // trailing S (ASSETS→ASSET) and _MGMT-style suffixes (LEAVE_MGMT→LEAVE).
    const tokens = String(menuCode || "").toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
    return catalogKeys.filter((key) => {
      const nk = normToken(key);
      return tokens.some((t) => nk === t || nk === `${t}S` || t === `${nk}S` || nk.startsWith(t) || t.startsWith(nk));
    });
  };
  // Platform containment for non-platform creators (backend blocks `*` and
  // `platform.*`; the UI stops offering them instead of failing on save).
  const isPlatformCreator =
    String(currentUser?.roleCode || "").toUpperCase() === "SAAS_SUPER_ADMIN" || (currentUser?.priority ?? 99) <= 0;
  const grantablePerms = (perms) =>
    (perms || []).filter((p) => {
      const code = String(p?.permissionCode || "");
      if (!code) return false;
      if (isPlatformCreator) return true;
      return code !== "*" && !code.startsWith("platform.");
    });
  // Modules linked to menus (menuId → catalog module keys). Unmapped catalog
  // modules are still reachable: every catalog key appears under at least one
  // menu via the token fallback, else under the focused menu's own group.
  const catalogKeys = Object.keys(catalog || {});
  const catalogKeySig = catalogKeys.join("|");
  const menuIdToModules = useMemo(() => {
    const map = {};
    (menus || []).forEach((m) => {
      map[getMenuId(m)] = modulesForMenu(m.menuCode, catalogKeys);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus, catalogKeySig]);
  // Accordion state: which Section-1 menu cards are expanded to preview
  // their related API actions inline. Reset whenever the modal opens.
  const [focusedMenuId, setFocusedMenuId] = useState(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  // Original priority of the role being edited (lets an edit KEEP its current
  // priority while still blocking escalation above viewer authority).
  const [originalPriority, setOriginalPriority] = useState(null);
  const minPriority = minCreatablePriority(currentUser);
  // Focused menu drives the right panel: first checked menu, else first menu.
  const focusMenuId =
    focusedMenuId ||
    (menus || []).map(getMenuId).find((id) => roleForm.selectedMenuIds.includes(id)) ||
    getMenuId(menus[0]) ||
    "";
  const focusMenu = (menus || []).find((m) => getMenuId(m) === focusMenuId) || null;
  const focusLinkedModules = menuIdToModules[focusMenuId] || [];
  const focusAllPerms = focusLinkedModules.flatMap((mod) => grantablePerms(catalog[mod] || []));
  const focusVisiblePerms = focusAllPerms.filter((p) => {
    const q = actionSearch.trim().toLowerCase();
    if (!q) return true;
    return `${p.permissionName} ${p.permissionCode}`.toLowerCase().includes(q);
  });
  const focusCodes = focusAllPerms.map((p) => p.permissionCode);
  const focusAllSelected =
    focusCodes.length > 0 && focusCodes.every((c) => roleForm.selectedPermissionCodes.includes(c));
  // Select All scoped to the focused menu's actions only.
  const toggleFocusModulePermissions = () => toggleModulePermissions(focusCodes);
  const visibleMenus = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return menus || [];
    return (menus || []).filter((m) =>
      `${m.menuName || ""} ${m.menuCode || ""}`.toLowerCase().includes(q)
    );
  }, [menus, moduleSearch]);
  // Icon per module (reuses already-imported icons; data keywords only).
  const moduleIcon = (key = "") => {
    const k = String(key).toUpperCase();
    if (k.includes("USER") || k.includes("ONBOARD") || k.includes("EMPLOYEE")) return FaUsers;
    if (k.includes("ROLE")) return FaShieldAlt;
    if (k.includes("APPROV")) return FaCheckCircle;
    if (k.includes("ATTEND")) return FaUserCheck;
    if (k.includes("LEAVE")) return FaUserPlus;
    if (k.includes("REIMBURS") || k.includes("PAYSLIP") || k.includes("FINANC") || k.includes("EPFO")) return FaPlus;
    if (k.includes("ASSET")) return FaCog;
    if (k.includes("PROJECT")) return FaCodeBranch;
    if (k.includes("ORGAN") || k.includes("BRANCH") || k.includes("LOCATION")) return FaBuilding;
    if (k.includes("SHIFT") || k.includes("CALENDAR") || k.includes("HOLIDAY")) return FaCog;
    return FaKey;
  };

  // ── Save Custom Role ──
  // Backend enforces: hierarchy (P1->=2, P2->=3), reserved substrings
  // ADMIN|OWNER|SAAS|PLATFORM|SUPER, and `*`/platform.* containment.
  // Pre-flight here for instant UX; server remains the enforcer.
  // Renders backend 403 keys per the access-denied contract, e.g.
  // "Access denied · needs `role.read`" / "needs menu ROLE_MANAGEMENT".
  const formatRoleError = (err) => {
    const base = err?.message || "Failed to save role";
    const key = err?.requiredPermission
      ? `needs \`${err.requiredPermission}\``
      : err?.requiredMenu
        ? `needs menu ${err.requiredMenu}`
        : err?.requiredPriority !== undefined
          ? `requires priority ${err.requiredPriority}`
          : Array.isArray(err?.requiredAnyPermission) && err.requiredAnyPermission.length > 0
            ? `needs one of ${err.requiredAnyPermission.map((p) => `\`${p}\``).join(", ")}`
            : "";
    return key ? `${base} · ${key}` : base;
  };
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.roleName.trim()) {
      alert("Please enter a role name");
      return;
    }
    const preflight = validateRolePayload(currentUser, {
      roleName: roleForm.roleName,
      priority: roleForm.priority,
      permissionCodes: roleForm.selectedPermissionCodes,
    });
    // Create: always enforced. Edit: enforced only when the priority CHANGED
    // from the role's original (keeping P2 as Admin is fine; dropping P3→P2
    // as Admin is blocked). Server remains the final enforcer.
    if (preflight && (!editingRoleId || roleForm.priority !== originalPriority)) {
      setErrorMessage(preflight);
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
          accessLevel: roleForm.accessLevel,
          menuIds: roleForm.selectedMenuIds,
          permissionCodes: roleForm.selectedPermissionCodes,
        });
        setSuccessMessage(`Role '${roleForm.roleName}' updated successfully.`);
      } else {
        await createCustomRole({
          roleName: roleForm.roleName,
          description: roleForm.description,
          priority: roleForm.priority,
          accessLevel: roleForm.accessLevel,
          menuIds: roleForm.selectedMenuIds,
          permissionCodes: roleForm.selectedPermissionCodes,
        });
        setSuccessMessage(`Custom role '${roleForm.roleName}' created successfully.`);
      }

      setShowRoleModal(false);
      await loadData({ forceMasters: true });
      await refreshAuthContext();
    } catch (err) {
      setErrorMessage(formatRoleError(err));
    } finally {
      setModalLoading(false);
    }
  };

  // ── Delete Role ──
  // Opens the shared ConfirmModal; the actual delete runs in
  // handleConfirmDeleteRole so accept/cancel semantics stay identical
  // to the previous window.confirm flow.
  const handleDeleteRole = (role) => {
    setDeletingRole(role);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingRole(null);
  };

  const handleConfirmDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      setDeleteLoading(true);
      await deleteCustomRole(deletingRole._id);
      setSuccessMessage(`Role '${deletingRole.roleName}' deleted successfully.`);
      setShowDeleteConfirm(false);
      setDeletingRole(null);
      await loadData({ forceMasters: true });
      await refreshAuthContext();
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete role");
    } finally {
      setDeleteLoading(false);
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
    // Pre-flight mirror of backend canAssignRole (server enforces).
    const targetRole = assignableRoles.find((r) => String(r._id) === String(provisionForm.roleId))
      || roles.find((r) => String(r._id) === String(provisionForm.roleId));
    if (targetRole && !canAssignRole(currentUser, targetRole)) {
      setErrorMessage(`You cannot assign role '${targetRole.roleName}' with your authority.`);
      return;
    }

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
            await loadData({ forceDirectory: true });
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
      await loadData({ forceDirectory: true });
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
      await loadData({ forceDirectory: true });
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

  // Locked backend keys: role and menu identity is ALWAYS _id (never id).
  const norm = (v) => String(v || "").toLowerCase().trim();
  const getRoleOptionId = (r) => String(r?._id || "");
  const getUserRoleId = (u) =>
    String(u?.role?._id || u?.roleId || (typeof u?.role === "string" ? u.role : "") || "");
  const getUserRoleCode = (u) => String(u?.role?.roleCode || u?.roleCode || "").toUpperCase();
  const filteredUsers = useMemo(() => {
    const search = norm(userSearch);
    return users.filter((u) => {
      if (search) {
        const hay = [
          `${u.firstName || ""} ${u.lastName || ""}`,
          u.firstName, u.lastName, u.email, u.employeeCode,
          u.department, u.designation,
          u.role?.roleName, u.role?.roleCode,
          u.primaryBranch?.branchName, u.primaryBranchName,
        ].map(norm).join(" | ");
        if (!hay.includes(search)) return false;
      }

      // Status filter
      if (accountStatusFilter === "active" && (!u.hasLoginAccess || !u.isActive || u.isBlocked)) return false;
      if (accountStatusFilter === "no-account" && u.hasLoginAccess) return false;
      if (accountStatusFilter === "blocked" && !u.isBlocked) return false;
      if (accountStatusFilter === "inactive" && (u.isActive || !u.hasLoginAccess)) return false;

      // Role filter (string-safe: populated object, raw id, or _id/id mix;
      // falls back to roleCode so cross-collection id mismatches still match)
      if (roleFilter !== "all") {
        const selected = roles.find((r) => getRoleOptionId(r) === String(roleFilter));
        const selectedCode = String(selected?.roleCode || "").toUpperCase();
        const uRoleId = getUserRoleId(u);
        const uRoleCode = getUserRoleCode(u);
        const idMatch = uRoleId && uRoleId === String(roleFilter);
        const codeMatch = selectedCode && uRoleCode && uRoleCode === selectedCode;
        if (!idMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [users, userSearch, accountStatusFilter, roleFilter, roles]);

  // ── Dynamic Pagination for Users ──
  const totalFilteredUsers = filteredUsers.length;
  const totalUserPages = Math.ceil(totalFilteredUsers / USER_PAGE_SIZE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(start, start + USER_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  // ── Row action visibility (single source for cell + column) ──
  // Account Action column is rendered only when at least one visible row has
  // an actionable button; otherwise the empty column is dropped dynamically.
  // Role-wise priority gate: a button is given only where the viewer holds
  // hierarchy authority over the target role (canAssignRole mirror of the
  // backend table — Owner: all except SAAS/OWNER, Admin: P>2 only, HR:
  // EMPLOYEE only). No authority → no button. Own record stays manageable.
  const canProvision = isSystemAdmin || hasPermission("user.provision_account");
  const rowActionOf = (u) => {
    const hasAccount = u.hasLoginAccess === true;
    const isOwnerUser = u.role?.priority === 1 || u.role?.roleCode === "OWNER" || u.isOwner === true;
    const canModify =
      currentUser?.priority === 1 ||
      (!isOwnerUser && (isSystemAdmin || hasPermission("user.manage_roles")));
    const isOwnRecord = String(u._id || u.id || "") && String(u._id || u.id || "") === String(currentUser?._id || currentUser?.id || "");
    const hasRole = Boolean(u.role?.roleCode || u.role?.roleName);
    const inAuthority = !hasRole || isOwnRecord || canAssignRole(currentUser, u.role);
    if (!hasAccount) return canProvision && inAuthority ? "create" : null;
    return canModify && inAuthority ? "manage" : null;
  };
  const showActionColumn = paginatedUsers.some((u) => rowActionOf(u));

  // Safe boundary check
  useEffect(() => {
    if (userPage > totalUserPages && totalUserPages > 0) {
      setUserPage(totalUserPages);
    }
  }, [totalUserPages, userPage]);

  // ── Filtered Roles List (priority-wise: P0 first, then name) ──
  // Priority NUMBERS come from the backend role records; the colored labels
  // are frontend presentation (see priorityPillClass below).
  const byPriorityThenName = (a, b) =>
    (Number(a.priority ?? 99) - Number(b.priority ?? 99)) ||
    String(a.roleName || "").localeCompare(String(b.roleName || ""));
  // Priority-wise option lists for every role dropdown (filter, provision,
  // manage, reset rules) so pickers always read P0 → P4+.
  const rolesByPriority = useMemo(() => [...roles].sort(byPriorityThenName), [roles]);
  const assignableByPriority = useMemo(
    () => [...assignableRoles].sort(byPriorityThenName),
    [assignableRoles]
  );
  const filteredRoles = useMemo(() => {
    return roles
      .filter((role) => {
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
      })
      .slice()
      .sort(byPriorityThenName);
  }, [roles, roleSearch, roleTypeFilter]);

  // Priority-wise pill: P0 slate (platform), P1 red (owner), P2 orange
  // (admin level), P3 slate-blue (staff), P4+ green (custom). Numbers from
  // backend; colors/labels are frontend-only presentation.
  const priorityPillClass = (role) => {
    const p = Number(role?.priority ?? 99);
    if (p <= 0) return "pri-0";
    if (p === 1) return "pri-1";
    if (p === 2) return "pri-2";
    if (p === 3) return "pri-3";
    return "pri-4";
  };
  const prioritySuffix = (role) => {
    const p = Number(role?.priority ?? 99);
    if (p <= 0) return " · PLATFORM";
    if (p === 1) return " · OWNER";
    if (p === 2) return " · ADMIN LEVEL";
    return "";
  };

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

  // ── Server-side role filters (spec E, debounced) ──
  // Sends search/isSystemRole to GET /role; clearing both restores the full
  // masters list. Client-side filteredRoles stays as a second pass.
  useEffect(() => {
    if (activeTab !== "roles") return undefined;
    const search = roleSearch.trim();
    const hasFilter = search !== "" || roleTypeFilter !== "all";
    const timer = setTimeout(() => {
      if (!hasFilter) {
        dispatch(fetchAccessMasters({ force: true })).catch(() => null);
        return;
      }
      const params = { limit: 100 };
      if (search) params.search = search;
      if (roleTypeFilter === "system") params.isSystemRole = true;
      if (roleTypeFilter === "custom") params.isSystemRole = false;
      setRolePage(1);
      dispatch(fetchRolesFiltered(params)).catch(() => null);
    }, 400);
    return () => clearTimeout(timer);
  }, [roleSearch, roleTypeFilter, activeTab, dispatch]);

  // Helper for Initials
  const getInitials = (firstName, lastName) => {
    const f = (firstName || "").charAt(0);
    const l = (lastName || "").charAt(0);
    return (f + l).toUpperCase() || "?";
  };

  // ── Shared pill vocabularies (single source for this table) ──
  // Theme-driven: colors come from the redux theme CSS variables
  // (--color-success/warning/danger), never hardcoded hex.
  const loginStatusOf = (u) => {
    if (!u.hasLoginAccess) return "NO_ACCOUNT";
    if (u.isBlocked) return "BLOCKED";
    if (u.isActive) return "ACTIVE";
    return "INACTIVE";
  };
  const LOGIN_STATUS_LABEL = {
    NO_ACCOUNT: "No Login Account",
    BLOCKED: "Blocked",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
  };

  // ── Employee Directory Pagination Render Component ──
  const renderUserPagination = () => {
    if (totalFilteredUsers === 0) return null;
    const startIdx = (userPage - 1) * USER_PAGE_SIZE + 1;
    const endIdx = Math.min(userPage * USER_PAGE_SIZE, totalFilteredUsers);

    return (
      <PaginationBar
        size="sm"
        page={userPage}
        totalPages={totalUserPages}
        onPageChange={(pg) => setUserPage(pg)}
        showEllipsis
        ellipsisKeyPrefix="u"
        prevLabel="Previous"
        nextLabel="Next"
        info={
          <div className="text-muted extra-small">
            Showing <span className="fw-bold text-dark">{startIdx}–{endIdx}</span> of{" "}
            <span className="fw-bold text-dark">{totalFilteredUsers}</span> employees
          </div>
        }
        wrapperClassName="user-mgmt-pagination-bar d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 px-md-4 py-2 bg-white border-top"
        paginationClassName="mb-0 user-mgmt-pagination"
      />
    );
  };

  // ── Roles Table Pagination Render Component ──
  const renderRolePagination = () => {
    if (totalFilteredRoles === 0) return null;
    const startIdx = (rolePage - 1) * ROLE_PAGE_SIZE + 1;
    const endIdx = Math.min(rolePage * ROLE_PAGE_SIZE, totalFilteredRoles);

    return (
      <PaginationBar
        size="sm"
        page={rolePage}
        totalPages={totalRolePages}
        onPageChange={(pg) => setRolePage(pg)}
        showEllipsis
        ellipsisKeyPrefix="r"
        prevLabel="Previous"
        nextLabel="Next"
        info={
          <div className="text-muted extra-small">
            Showing <span className="fw-bold text-dark">{startIdx}–{endIdx}</span> of{" "}
            <span className="fw-bold text-dark">{totalFilteredRoles}</span> roles
          </div>
        }
        wrapperClassName="user-mgmt-pagination-bar d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 px-md-4 py-2 bg-white border-top"
        paginationClassName="mb-0 user-mgmt-pagination"
      />
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

        {isSystemAdmin && activeTab === "roles" && (
          <Button
            variant="success"
            className="user-mgmt-create-btn d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm fw-semibold text-nowrap"
            onClick={handleOpenCreateRoleModal}
          >
            <FaPlus size={11} /> Create Custom Role
          </Button>
        )}
      </div>

      {/* ── Real Data KPI Summary Row (click a card to filter) ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <div
            className="user-mgmt-kpi-card user-mgmt-kpi-clickable"
            role="button"
            tabIndex={0}
            title="Show all employees"
            onClick={() => {
              setActiveTab("users");
              setUserSearch("");
              setAccountStatusFilter("all");
              setRoleFilter("all");
              setUserPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab("users");
                setAccountStatusFilter("all");
                setUserPage(1);
              }
            }}
          >
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
          <div
            className="user-mgmt-kpi-card user-mgmt-kpi-clickable"
            role="button"
            tabIndex={0}
            title="Show active logins"
            onClick={() => {
              setActiveTab("users");
              setAccountStatusFilter("active");
              setUserPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab("users");
                setAccountStatusFilter("active");
                setUserPage(1);
              }
            }}
          >
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
          <div
            className="user-mgmt-kpi-card user-mgmt-kpi-clickable"
            role="button"
            tabIndex={0}
            title="Show employees needing provisioning"
            onClick={() => {
              setActiveTab("users");
              setAccountStatusFilter("no-account");
              setUserPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab("users");
                setAccountStatusFilter("no-account");
                setUserPage(1);
              }
            }}
          >
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
          <div
            className="user-mgmt-kpi-card user-mgmt-kpi-clickable"
            role="button"
            tabIndex={0}
            title="Open roles & permissions"
            onClick={() => setActiveTab("roles")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab("roles");
              }
            }}
          >
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

      {/* ── Page alerts as floating popup (single icon, auto-dismiss) ── */}
      <AppToast
        toast={
          errorMessage
            ? { variant: "danger", message: errorMessage }
            : successMessage
              ? { variant: "success", message: successMessage }
              : null
        }
        onClose={() => {
          setErrorMessage("");
          setSuccessMessage("");
        }}
      />

      {/* ── Section Navigation Tabs (Exclusive Section View) ── */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-1">
        <div className="user-mgmt-nav-wrapper">
          <button
            type="button"
            className={`user-mgmt-nav-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <FaUsers className="me-2 flex-shrink-0" /> <span>Employee Directory & Accounts</span>
            <span className="user-mgmt-tab-count ms-2">({users.length})</span>
          </button>

          {isSystemAdmin && (
            <>
              <button
                type="button"
                className={`user-mgmt-nav-tab ${activeTab === "roles" ? "active" : ""}`}
                onClick={() => setActiveTab("roles")}
              >
                <FaShieldAlt className="me-2 flex-shrink-0" /> <span>Roles & Permissions Architecture</span>
                <span className="user-mgmt-tab-count ms-2">({roles.length})</span>
              </button>
              <button
                type="button"
                className={`user-mgmt-nav-tab ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <FaKey className="me-2 flex-shrink-0" /> <span>Password Reset Governance</span>
                {resetApprovals.length > 0 && (
                  <span className="badge bg-warning text-dark ms-2">{resetApprovals.length}</span>
                )}
              </button>
            </>
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
                <SearchInput
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Search employee..."
                  size="sm"
                  inputGroupClassName="user-mgmt-search-group"
                  inputGroupTextClassName="bg-light border-end-0 text-muted"
                  inputClassName="shadow-none border-start-0 user-mgmt-ctrl"
                  ariaLabel="Search employee"
                />
              </div>

              {/* Status Filter */}
              <FilterSelect
                value={accountStatusFilter}
                onChange={(e) => {
                  setAccountStatusFilter(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Login Status"
                className="shadow-none user-mgmt-ctrl"
                options={[
                  { value: "active", label: "Active Logins Only" },
                  { value: "no-account", label: "Need Provisioning (No Account)" },
                  { value: "blocked", label: "Blocked / Locked" },
                  { value: "inactive", label: "Inactive / Suspended" },
                ]}
              />

              {/* Role Filter — authority-scoped: only roles under my own rank.
                  Top-priority roles (P0 platform, P1 owner) never appear here
                  unless the viewer holds them (assignableRoles is backend-
                  scoped; falls back to full list only when empty). */}
              <FilterSelect
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Role"
                className="shadow-none user-mgmt-ctrl"
                options={(assignableByPriority.length ? assignableByPriority : rolesByPriority).map((r) => ({
                  value: getRoleOptionId(r) || r.roleCode,
                  label: `${r.roleName} (${r.roleCode})`,
                }))}
              />

              {/* Reset Filter Button */}
              {(userSearch || accountStatusFilter !== "active" || roleFilter !== "all") && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="user-mgmt-ctrl d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    setUserSearch("");
                    setAccountStatusFilter("active");
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
                <LoadingSpinner color="success" size="sm" />
                <div className="small text-muted mt-2">Loading employee directory...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaUsers size={32} className="mb-2 opacity-50" />
                <p className="small mb-0">No employees match your search or filter criteria.</p>
              </div>
            ) : (
              <Table hover align="middle" className="mb-0 small user-mgmt-table user-mgmt-users-table">
                <thead className="table-light extra-small text-uppercase text-muted">
                  <tr>
                    <th className="ps-3 ps-md-4 text-start user-mgmt-th-emp">Employee</th>
                    <th className="text-start user-mgmt-th-code">Employee Code</th>
                    <th className="text-start user-mgmt-th-dept">Department / Role</th>
                    <th className="text-start user-mgmt-th-branch">Branch Access</th>
                    <th className="text-center user-mgmt-th-status">Login Status</th>
                    <th className="text-start user-mgmt-th-role">Assigned Role</th>
                    {showActionColumn && (
                      <th className="text-end pe-3 pe-md-4 user-mgmt-th-action">Account Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => {
                    const hasAccount = u.hasLoginAccess === true;
                    const action = rowActionOf(u);
                    const initials = getInitials(u.firstName, u.lastName);
                    const isOwnerUser = u.role?.priority === 1 || u.role?.roleCode === "OWNER" || u.isOwner === true;
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
                      contextBranches.find((b) => String(b._id) === String(u.primaryBranchId || u.primaryBranch))?.branchName ||
                      contextBranches.find((b) => String(b._id) === String(u.branchId))?.branchName ||
                      (isOrgWide ? "" : "Unassigned");

                    return (
                      <tr key={u._id || u.id} className="user-mgmt-row">
                        <td className="ps-3 ps-md-4 user-mgmt-cell-emp">
                          <div className="user-mgmt-emp">
                            <div
                              className={`user-mgmt-avatar-chip ${hasAccount ? "account-active" : "account-none"}`}
                            >
                              {initials}
                            </div>
                            <div className="user-mgmt-emp-id">
                              <div className="user-mgmt-emp-name">
                                {u.firstName} {u.lastName}
                              </div>
                              <div className="user-mgmt-emp-email" title={u.email}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="user-mgmt-cell-code">
                          <span className="user-mgmt-emp-code">{u.employeeCode || "—"}</span>
                        </td>
                        <td className="user-mgmt-cell-dept">
                          <div className="small text-dark fw-medium text-truncate">{u.department || "General"}</div>
                          <div className="extra-small text-muted text-truncate">{u.designation || "Employee"}</div>
                        </td>
                        <td className="user-mgmt-cell-branch">
                          {isOrgWide ? (
                            <div>
                              <span className="user-mgmt-org-pill">
                                <FaBuilding size={9} className="me-1" /> ALL BRANCHES
                              </span>
                              <div className="extra-small text-muted mt-0.5">Org-wide Access</div>
                            </div>
                          ) : (
                            <div>
                              <div className="d-flex align-items-center gap-1">
                                <span className="user-mgmt-branch-pill" title={pBranchName}>
                                  <FaCodeBranch size={9} className="me-1 text-success" />
                                  {pBranchName}
                                </span>
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
                        <td className="text-nowrap user-mgmt-cell-status">
                          <span className={`user-mgmt-status status-${loginStatusOf(u).toLowerCase().replace(/_/g, "-")}`}>
                            {LOGIN_STATUS_LABEL[loginStatusOf(u)]}
                          </span>
                        </td>
                        <td className="user-mgmt-cell-role">
                          {u.role ? (
                            <span
                              className={`user-mgmt-role-plain ${u.role.priority === 1 ? "role-p1" : u.role.priority === 2 ? "role-p2" : "role-staff"}`}
                            >
                              <FaKey size={10} className="me-1" />
                              {(u.role.roleName || "Employee").toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-muted extra-small">Not Assigned</span>
                          )}
                        </td>
                        {showActionColumn && (
                        <td className="text-end pe-3 pe-md-4 text-nowrap user-mgmt-cell-action">
                          {action === "create" && (
                              <Button
                                size="sm"
                                className="user-mgmt-action-btn user-mgmt-action-create"
                                onClick={() => handleOpenProvisionModal(u)}
                              >
                                <FaUserPlus size={11} /> Create Account
                              </Button>
                          )}
                          {action === "manage" && (
                              <Button
                                size="sm"
                                className="user-mgmt-action-btn user-mgmt-action-manage"
                                onClick={() => handleOpenManageModal(u)}
                              >
                                <FaCog size={11} /> Manage
                              </Button>
                          )}
                        </td>
                        )}
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
                <SearchInput
                  value={roleSearch}
                  onChange={(e) => {
                    setRoleSearch(e.target.value);
                    setRolePage(1);
                  }}
                  placeholder="Search role..."
                  size="sm"
                  inputGroupClassName="user-mgmt-search-group"
                  inputGroupTextClassName="bg-light border-end-0 text-muted"
                  inputClassName="shadow-none border-start-0 user-mgmt-ctrl"
                  ariaLabel="Search role"
                />
              </div>

              {/* Role Type Filter */}
              <FilterSelect
                value={roleTypeFilter}
                onChange={(e) => {
                  setRoleTypeFilter(e.target.value);
                  setRolePage(1);
                }}
                placeholder="Role Type"
                minWidth={150}
                className="shadow-none user-mgmt-ctrl"
                options={[
                  { value: "system", label: "System Core" },
                  { value: "custom", label: "Custom Roles" },
                ]}
              />

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
                <LoadingSpinner color="success" size="sm" />
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
                          <span className={`user-mgmt-priority-pill ${priorityPillClass(role)}`}>
                            PRIORITY {role.priority ?? "—"}{prioritySuffix(role)}
                          </span>
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

      {/* ── Section 3: Password Reset Rules & Approvals (Admin Only) ── */}
      {isSystemAdmin && activeTab === "security" && (
        <>
          {/* Card 1: Pending Password Reset Approval Requests */}
          <Card className="user-mgmt-table-card border-0 shadow-sm overflow-hidden mb-4">
            <div className="user-mgmt-filter-header d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaKey className="text-warning" /> Pending Password Reset Approvals
                </h6>
                <span className="extra-small text-muted">
                  Authorize password reset tokens requested by employees based on role hierarchy
                </span>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-pill d-flex align-items-center gap-1.5"
                onClick={loadPasswordResetData}
                disabled={resetLoading}
              >
                Refresh
              </Button>
            </div>

            <div className="table-responsive">
              {resetLoading ? (
                <div className="py-4 text-center">
                  <LoadingSpinner variant="table" />
                </div>
              ) : resetApprovals.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No pending password reset requests at this time.
                </div>
              ) : (
                <Table hover className="user-mgmt-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3 ps-md-4">Requester Employee</th>
                      <th>Requester Role</th>
                      <th>Configured Approver Role</th>
                      <th>Requested Date</th>
                      <th>Status</th>
                      <th className="text-end pe-3 pe-md-4">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resetApprovals.map((req) => (
                      <tr key={req._id}>
                        <td className="ps-3 ps-md-4">
                          <div className="fw-bold text-dark">
                            {req.userId?.firstName} {req.userId?.lastName}
                          </div>
                          <div className="extra-small text-muted">{req.userId?.email}</div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border">
                            {req.requesterRole?.roleName || 'Employee'}
                          </Badge>
                        </td>
                        <td>
                          <span className="small text-muted">
                            {req.approverRole?.roleName || 'Direct Admin'}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
                        </td>
                        <td>
                          <Badge bg="warning" text="dark">
                            {req.status}
                          </Badge>
                        </td>
                        <td className="text-end pe-3 pe-md-4">
                          <div className="d-inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              className="rounded-pill px-2.5 py-1 micro-text"
                              onClick={() => handleApproveReset(req._id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="rounded-pill px-2.5 py-1 micro-text"
                              onClick={() => handleRejectReset(req._id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card>

          {/* Card 2: Password Reset Rules Configuration */}
          <Card className="user-mgmt-table-card border-0 shadow-sm overflow-hidden mb-4">
            <div className="user-mgmt-filter-header d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaShieldAlt className="text-primary" /> Role-Based Password Reset Rules
                </h6>
                <span className="extra-small text-muted">
                  Define which higher authority role must approve password reset requests for each role tier
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="rounded-pill d-flex align-items-center gap-1.5"
                onClick={() => {
                  setEditingRule(null);
                  setRuleForm({
                    requesterRole: '',
                    approverRole: '',
                    approvalRequired: true,
                    isActive: true,
                  });
                  setShowRuleModal(true);
                }}
              >
                <FaPlus size={11} /> Configure Rule
              </Button>
            </div>

            <div className="table-responsive">
              {resetLoading ? (
                <div className="py-4 text-center">
                  <LoadingSpinner variant="table" />
                </div>
              ) : resetRules.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  No custom reset rules configured. Click &quot;Configure Rule&quot; to define role hierarchy.
                </div>
              ) : (
                <Table hover className="user-mgmt-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="ps-3 ps-md-4">Requester Role</th>
                      <th>Requires Approval</th>
                      <th>Designated Approver Role</th>
                      <th>Status</th>
                      <th className="text-end pe-3 pe-md-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resetRules.map((rule) => (
                      <tr key={rule._id}>
                        <td className="ps-3 ps-md-4">
                          <div className="fw-bold text-dark">{rule.requesterRole?.roleName}</div>
                          <span className="extra-small text-muted">Priority Level {rule.requesterRole?.priority}</span>
                        </td>
                        <td>
                          <Badge bg={rule.approvalRequired ? "info" : "secondary"}>
                            {rule.approvalRequired ? "Approval Required" : "Direct Reset"}
                          </Badge>
                        </td>
                        <td>
                          {rule.approvalRequired ? (
                            <div>
                              <span className="fw-semibold text-dark">{rule.approverRole?.roleName}</span>
                              <span className="extra-small text-muted d-block">Level {rule.approverRole?.priority} (Higher Authority)</span>
                            </div>
                          ) : (
                            <span className="text-muted small">None (Self-Service)</span>
                          )}
                        </td>
                        <td>
                          <Badge bg={rule.isActive ? "success" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="text-end pe-3 pe-md-4">
                          <div className="d-inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="rounded-pill px-2.5 py-1 micro-text"
                              onClick={() => {
                                setEditingRule(rule);
                                setRuleForm({
                                  requesterRole: rule.requesterRole?._id || rule.requesterRole,
                                  approverRole: rule.approverRole?._id || rule.approverRole || '',
                                  approvalRequired: rule.approvalRequired !== undefined ? rule.approvalRequired : true,
                                  isActive: rule.isActive !== undefined ? rule.isActive : true,
                                });
                                setShowRuleModal(true);
                              }}
                            >
                              <FaEdit size={11} /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="rounded-pill p-1.5"
                              onClick={() => handleDeleteRule(rule._id)}
                              title="Delete Rule"
                            >
                              <FaTrash size={11} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ========================================================
          MODAL: CREATE LOGIN ACCOUNT (PROVISIONING)
          ======================================================== */}
      <Modal
        show={showProvisionModal}
        onHide={() => setShowProvisionModal(false)}
        centered
        backdrop="static"
        contentClassName="user-mgmt-role-modal"
      >
        <Modal.Header closeButton className="rw-head border-0">
          <div className="rw-head-icon">
            <FaUserPlus />
          </div>
          <div className="min-w-0">
            <Modal.Title className="rw-head-title">Provision Employee Login Account</Modal.Title>
            <div className="rw-head-sub">Create credentials and assign an initial role</div>
          </div>
        </Modal.Header>
        <Form onSubmit={handleProvisionSubmit}>
          <Modal.Body className="rw-body">
            {/* Employee Summary Card */}
            <div className="rw-user-card">
              <div className="rw-user-avatar">
                {getInitials(provisioningUser?.firstName, provisioningUser?.lastName)}
              </div>
              <div className="min-w-0 flex-grow-1">
                <div className="rw-user-name">
                  {provisioningUser?.firstName} {provisioningUser?.lastName}
                </div>
                <div className="rw-user-meta">
                  {provisioningUser?.email} · <code>{provisioningUser?.employeeCode || "N/A"}</code> · {provisioningUser?.department || "General"}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <Form.Group className="mb-3">
              <Form.Label className="rw-label">Assign Initial Role *</Form.Label>
              <Form.Select
                value={provisionForm.roleId}
                onChange={(e) => setProvisionForm({ ...provisionForm, roleId: e.target.value })}
                required
                className="shadow-none rw-control"
              >
                <option value="">-- Select Permitted Role --</option>
                {assignableByPriority.map((r) => (
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
              <Form.Label className="rw-label">Initial Temporary Password *</Form.Label>
              <InputGroup>
                <Form.Control
                  type={provisionForm.showPass ? "text" : "password"}
                  value={provisionForm.password}
                  onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                  placeholder="Enter temporary password (min 6 chars)"
                  required
                  className="shadow-none rw-control"
                />
                <Button
                  variant="outline-secondary"
                  className="rw-eye-btn"
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

          <Modal.Footer className="user-mgmt-role-modal-foot rw-foot border-0">
            <div className="rw-foot-actions">
              <Button className="user-mgmt-role-modal-cancel" size="sm" onClick={() => setShowProvisionModal(false)}>
                Cancel
              </Button>
              <Button className="user-mgmt-role-modal-submit" size="sm" type="submit" disabled={modalLoading}>
                {modalLoading ? "Provisioning..." : "Create Login Account"}
              </Button>
            </div>
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
        contentClassName="user-mgmt-role-modal"
      >
        <Modal.Header closeButton className="rw-head border-0">
          <div className="rw-head-icon">
            <FaCog />
          </div>
          <div className="min-w-0">
            <Modal.Title className="rw-head-title">Manage Employee Account & Access</Modal.Title>
            <div className="rw-head-sub">
              {managingUser?.firstName} {managingUser?.lastName} · {managingUser?.employeeCode || "N/A"}
            </div>
          </div>
        </Modal.Header>
        <Form onSubmit={handleManageSubmit}>
          <Modal.Body className="rw-body">
            {/* User Info Header */}
            <div className="rw-user-card">
              <div className="rw-user-avatar">
                {getInitials(managingUser?.firstName, managingUser?.lastName)}
              </div>
              <div className="min-w-0 flex-grow-1">
                <div className="rw-user-name rw-user-name-lg">
                  {managingUser?.firstName} {managingUser?.lastName}
                </div>
                <div className="rw-user-meta">
                  {managingUser?.email} · <code className="rw-user-code">{managingUser?.employeeCode || "N/A"}</code> · {managingUser?.department || "General"}
                </div>
              </div>
              <span className="rw-role-chip">
                {managingUser?.role?.roleCode || managingUser?.role?.roleName || "Employee"}
              </span>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="rw-tabbar" role="tablist" aria-label="Manage account sections">
              <button
                type="button"
                role="tab"
                aria-selected={manageModalTab === "account"}
                className={`rw-tab${manageModalTab === "account" ? " active" : ""}`}
                onClick={() => setManageModalTab("account")}
              >
                <FaKey className="me-2" /> Account & Credentials
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={manageModalTab === "access"}
                className={`rw-tab${manageModalTab === "access" ? " active" : ""}`}
                onClick={() => setManageModalTab("access")}
              >
                <FaBuilding className="me-2" /> Organization & Branch Access
              </button>
            </div>

            {/* TAB 1: Account & Credentials */}
            {manageModalTab === "account" && (
              <div>
                {/* Role Reassignment */}
                <Form.Group className="mb-3">
                  <Form.Label className="rw-label"><FaShieldAlt className="rw-label-icon" /> Assigned Security Role</Form.Label>
                  <Form.Select
                    value={manageForm.roleId}
                    onChange={(e) => setManageForm({ ...manageForm, roleId: e.target.value })}
                    required
                    className="shadow-none rw-control rw-field"
                  >
                    <option value="">-- Choose Role --</option>
                    {assignableByPriority.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.roleName} (Level {r.priority})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Status Checks */}
                <Row className="g-3 mb-3">
                  <Col xs={12} sm={6}>
                    <Form.Group>
                      <Form.Label className="rw-label"><FaUserCheck className="rw-label-icon" /> Account Status</Form.Label>
                      <div className="rw-dot-field">
                        <span className={`rw-dot${manageForm.isActive ? " on" : ""}`} aria-hidden="true" />
                        <Form.Select
                          value={manageForm.isActive ? "true" : "false"}
                          onChange={(e) => setManageForm({ ...manageForm, isActive: e.target.value === "true" })}
                          className="shadow-none rw-control rw-field rw-has-dot"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive / Suspended</option>
                        </Form.Select>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Group>
                      <Form.Label className="rw-label"><FaLock className="rw-label-icon" /> Access Lock</Form.Label>
                      <Form.Select
                        value={manageForm.isBlocked ? "true" : "false"}
                        onChange={(e) => setManageForm({ ...manageForm, isBlocked: e.target.value === "true" })}
                        className="shadow-none rw-control rw-field"
                      >
                        <option value="false">Normal Access</option>
                        <option value="true">Blocked / Locked</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Reset Password */}
                <Form.Group className="mb-2">
                  <Form.Label className="rw-label"><FaKey className="rw-label-icon" /> Reset Password (Optional)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={manageForm.showPass ? "text" : "password"}
                      value={manageForm.newPassword}
                      onChange={(e) => setManageForm({ ...manageForm, newPassword: e.target.value })}
                      placeholder="Leave blank to keep existing password"
                      className="shadow-none rw-control rw-field"
                    />
                    <Button
                      variant="outline-secondary"
                      className="rw-eye-btn"
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
                    <LoadingSpinner color="success" size="sm" />
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

          <Modal.Footer className="user-mgmt-role-modal-foot rw-foot rw-foot-split border-0">
            <Button className="user-mgmt-role-modal-cancel" size="sm" onClick={() => setShowManageModal(false)}>
              Cancel
            </Button>
            <Button
              className="user-mgmt-role-modal-submit"
              size="sm"
              type="submit"
              disabled={modalLoading || (manageModalTab === "access" && !manageAccessValidation.isValid)}
            >
              <FaSave className="me-2" /> {modalLoading ? "Saving..." : "Save Changes"}
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
        size="xl"
        centered
        backdrop="static"
        scrollable
        dialogClassName="user-mgmt-role-modal-dialog"
        contentClassName="user-mgmt-role-modal"
      >
        <Modal.Header closeButton className="rw-head border-0">
          <div className="rw-head-icon">
            <FaUserShield />
          </div>
          <div className="min-w-0">
            <Modal.Title className="rw-head-title">
              {editingRoleId ? "Edit Role Access Configuration" : "Create New Custom Role"}
            </Modal.Title>
            <div className="rw-head-sub">
              Define access level, menus and granular API actions for this role
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="rw-body">
          {modalLoading ? (
            <div className="text-center py-5">
              <LoadingSpinner color="success" />
              <div className="small text-muted mt-2">Loading role details...</div>
            </div>
          ) : (
            <Form onSubmit={handleSaveRole}>
              {/* Role configuration — same fields and values as before */}
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="rw-label">Role Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Senior Project Lead, QA Specialist"
                      value={roleForm.roleName}
                      onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                      required
                      className="shadow-none rw-control"
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="rw-label">Priority Hierarchy</Form.Label>
                    <Form.Select
                      value={roleForm.priority}
                      onChange={(e) => setRoleForm({ ...roleForm, priority: Number(e.target.value) })}
                      className="shadow-none rw-control"
                    >
                      {/* Only levels at/below viewer authority are listed —
                          top levels above it are hidden, not just disabled. */}
                      {[4, 3, 2, 1].map((lvl) => {
                        if (lvl < minPriority && roleForm.priority !== lvl) return null;
                        const label =
                          lvl === 4 ? "Level 4+ (Custom / Branch)"
                          : lvl === 3 ? "Level 3 (Staff / Custom)"
                          : lvl === 2 ? "Level 2 (Admin Level)"
                          : "Level 1 (Owner)";
                        return <option key={lvl} value={lvl}>{label}</option>;
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="rw-label">Access Level</Form.Label>
                    <Form.Select
                      value={roleForm.accessLevel}
                      onChange={(e) => setRoleForm({ ...roleForm, accessLevel: e.target.value })}
                      className="shadow-none rw-control"
                    >
                      <option value="BRANCH">BRANCH</option>
                      <option value="ORGANIZATION">ORGANIZATION</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="rw-label">Status</Form.Label>
                    <div className="rw-status-toggle">
                      <Form.Check
                        type="switch"
                        id="role-status-switch"
                        checked={roleForm.isActive}
                        onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                        aria-label="Role active status"
                      />
                      <span className="small fw-semibold">{roleForm.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="rw-label">Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Summary of responsibilities and scope of this role..."
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="shadow-none rw-control rw-textarea"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* ── Permission workspace: modules (left) + actions (right) ── */}
              {/* Same data, handlers and payload as before: menus from
                  GET /menu/getAll-menu, catalog groups from the permission
                  catalog, toggleMenu / togglePermission, menuIds[] +
                  permissionCodes[] on save. Layout only. */}
              <div className="rw-workspace">
                {/* Left — Application Modules (all loaded modules, searchable) */}
                <div className="rw-modules">
                  <div className="rw-modules-title">1. Application Module Access</div>
                  <div className="rw-modules-sub">Select modules to configure permissions</div>
                  <SearchInput
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Search modules..."
                    size="sm"
                    inputGroupClassName="rw-search"
                    ariaLabel="Search modules"
                  />
                  <div className="rw-module-list" role="listbox" aria-label="Application modules">
                    {visibleMenus.map((menu) => {
                      const menuId = getMenuId(menu);
                      const isChecked = roleForm.selectedMenuIds.includes(menuId);
                      const isFocused = focusMenuId === menuId;
                      const linked = menuIdToModules[menuId] || [];
                      const badge = linked[0] || menu.menuCode || "";
                      const Icon = moduleIcon(linked[0] || menu.menuCode);
                      return (
                        <div
                          key={menuId || menu.menuCode}
                          role="option"
                          aria-selected={isFocused}
                          tabIndex={0}
                          className={`rw-module-row${isFocused ? " focused" : ""}${isChecked ? " enabled" : ""}`}
                          onClick={() => setFocusedMenuId(menuId)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setFocusedMenuId(menuId);
                            }
                          }}
                        >
                          <span
                            className={`rw-module-check${isChecked ? " checked" : ""}`}
                            role="checkbox"
                            aria-checked={isChecked}
                            aria-label={`Enable ${menu.menuName}`}
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(menuId);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleMenu(menuId);
                              }
                            }}
                          />
                          <span className="rw-module-icon"><Icon /></span>
                          <span className="rw-module-name" title={menu.menuName}>{menu.menuName}</span>
                          {badge && <span className="rw-module-badge">{badge}</span>}
                          <span className="rw-module-chev" aria-hidden="true">›</span>
                        </div>
                      );
                    })}
                    {visibleMenus.length === 0 && (
                      <div className="rw-empty-note">No modules match your search.</div>
                    )}
                  </div>
                </div>

                {/* Right — Module API Actions for the focused menu */}
                <div className="rw-actions">
                  {focusMenu ? (
                    <>
                      <div className="rw-actions-head">
                        <span className="rw-actions-icon">
                          {moduleIcon((menuIdToModules[focusMenuId] || [])[0] || focusMenu.menuCode)}
                        </span>
                        <div className="min-w-0 flex-grow-1">
                          <div className="rw-actions-title">
                            {focusMenu.menuName} MODULE
                            {((menuIdToModules[focusMenuId] || [])[0] || focusMenu.menuCode) && (
                              <span className="rw-module-badge">
                                {(menuIdToModules[focusMenuId] || [])[0] || focusMenu.menuCode}
                              </span>
                            )}
                          </div>
                          <div className="rw-actions-sub">
                            {focusAllPerms.length} API actions
                            {focusLinkedModules.length > 1 ? ` · ${focusLinkedModules.join(" · ")}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rw-select-all"
                          onClick={toggleFocusModulePermissions}
                        >
                          <FaCheckSquare /> {focusAllSelected ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                      <div className="rw-actions-bar">
                        <span className="rw-actions-count">API Actions ({focusVisiblePerms.length})</span>
                        <SearchInput
                          value={actionSearch}
                          onChange={(e) => setActionSearch(e.target.value)}
                          placeholder="Search actions..."
                          size="sm"
                          inputGroupClassName="rw-search rw-search-sm"
                          ariaLabel="Search API actions"
                        />
                      </div>
                      <div className="rw-perm-grid">
                        {focusVisiblePerms.map((p) => {
                          const sel = roleForm.selectedPermissionCodes.includes(p.permissionCode);
                          return (
                            <div
                              key={p.permissionCode}
                              className={`rw-perm-card${sel ? " selected" : ""}`}
                              onClick={() => togglePermission(p.permissionCode)}
                              role="checkbox"
                              aria-checked={sel}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  togglePermission(p.permissionCode);
                                }
                              }}
                            >
                              <span className="rw-perm-check">
                                {sel ? <FaCheckSquare /> : <FaSquare />}
                              </span>
                              <span className="rw-perm-text">
                                <span className="rw-perm-name">{p.permissionName}</span>
                                <code className="rw-perm-code">{p.permissionCode}</code>
                                {p.description && (
                                  <span className="rw-perm-desc">{p.description}</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                        {focusAllPerms.length === 0 && (
                          <div className="rw-empty-note">No API actions linked to this module.</div>
                        )}
                        {focusAllPerms.length > 0 && focusVisiblePerms.length === 0 && (
                          <div className="rw-empty-note">No actions match your search.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="rw-empty-note">Select a module to view its API actions.</div>
                  )}
                </div>
              </div>

              <div className="user-mgmt-role-modal-foot rw-foot">
                <div className="rw-counts">
                  <span className="rw-count">
                    <FaCodeBranch className="rw-count-icon" />
                    <span className="rw-count-text">Selected Modules<small>{roleForm.selectedMenuIds.length} module{roleForm.selectedMenuIds.length === 1 ? "" : "s"}</small></span>
                  </span>
                  <span className="rw-count">
                    <FaCog className="rw-count-icon" />
                    <span className="rw-count-text">Selected Actions<small>{roleForm.selectedPermissionCodes.length} action{roleForm.selectedPermissionCodes.length === 1 ? "" : "s"}</small></span>
                  </span>
                </div>
                <div className="rw-foot-actions">
                  <Button
                    className="user-mgmt-role-modal-cancel"
                    onClick={() => setShowRoleModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="user-mgmt-role-modal-submit" type="submit" disabled={modalLoading}>
                    {modalLoading ? "Saving..." : editingRoleId ? "Update Role Access" : "Create Role"}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* ── Configure Password Reset Rule Modal ── */}
      <Modal
        show={showRuleModal}
        onHide={() => setShowRuleModal(false)}
        centered
        contentClassName="user-mgmt-role-modal"
      >
        <Modal.Header closeButton className="rw-head border-0">
          <div className="rw-head-icon">
            <FaKey />
          </div>
          <div className="min-w-0">
            <Modal.Title className="rw-head-title">
              {editingRule ? "Edit Password Reset Rule" : "Configure Password Reset Rule"}
            </Modal.Title>
            <div className="rw-head-sub">Define which roles need approval for password resets</div>
          </div>
        </Modal.Header>
        <Form onSubmit={handleSaveRule}>
          <Modal.Body className="rw-body">
            <Form.Group className="mb-3">
              <Form.Label className="rw-label">Requester Role <span className="text-danger">*</span></Form.Label>
              <Form.Select
                required
                value={ruleForm.requesterRole}
                onChange={(e) => setRuleForm({ ...ruleForm, requesterRole: e.target.value })}
                className="shadow-none rw-control rw-field"
              >
                <option value="">-- Select Target Role --</option>
                {rolesByPriority.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roleName} (Level {r.priority})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="extra-small text-muted">
                The role of users submitting password reset requests.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="ruleApprovalRequired"
                label="Require Higher Authority Approval Before Reset"
                checked={ruleForm.approvalRequired}
                onChange={(e) => setRuleForm({ ...ruleForm, approvalRequired: e.target.checked })}
                className="rw-check"
              />
            </Form.Group>

            {ruleForm.approvalRequired && (
              <Form.Group className="mb-3">
                <Form.Label className="rw-label">Designated Approver Role <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  required={ruleForm.approvalRequired}
                  value={ruleForm.approverRole}
                  onChange={(e) => setRuleForm({ ...ruleForm, approverRole: e.target.value })}
                  className="shadow-none rw-control rw-field"
                >
                  <option value="">-- Select Approver Role --</option>
                  {rolesByPriority
                    .filter((r) => {
                      if (!ruleForm.requesterRole) return true;
                      const reqRoleObj = roles.find((x) => x._id === ruleForm.requesterRole);
                      return reqRoleObj ? r.priority < reqRoleObj.priority : true;
                    })
                    .map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.roleName} (Level {r.priority} - Higher Authority)
                      </option>
                    ))}
                </Form.Select>
                <Form.Text className="extra-small text-muted">
                  Must have higher authority (lower priority number) than the requester role.
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                id="ruleActiveCheck"
                label="Rule Active"
                checked={ruleForm.isActive}
                onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                className="rw-check"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="user-mgmt-role-modal-foot rw-foot border-0">
            <div className="rw-foot-actions">
              <Button className="user-mgmt-role-modal-cancel" onClick={() => setShowRuleModal(false)}>
                Cancel
              </Button>
              <Button className="user-mgmt-role-modal-submit" type="submit" disabled={ruleSubmitting}>
                {ruleSubmitting ? "Saving..." : "Save Rule"}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Approved Reset Token Display Modal ── */}
      <Modal show={showTokenModal} onHide={() => setShowTokenModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-success d-flex align-items-center gap-2">
            <FaCheckCircle /> Password Reset Approved
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="small text-muted mb-2">
            The password reset request has been approved. Provide the one-time authorization reset token below to the employee:
          </p>
          <div className="bg-light p-3 rounded border text-break font-monospace small mb-3 select-all">
            {approvedTokenInfo?.token}
          </div>
          <p className="extra-small text-muted mb-0">
            This token will expire in 15 minutes. The employee can use this token to set a new password.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              if (approvedTokenInfo?.token) {
                navigator.clipboard.writeText(approvedTokenInfo.token);
                setSuccessMessage("Token copied to clipboard!");
              }
            }}
          >
            Copy Token
          </Button>
          <Button variant="success" size="sm" onClick={() => setShowTokenModal(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Role Confirmation ── */}
      <ConfirmModal
        show={showDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDeleteRole}
        loading={deleteLoading}
        title={<><FaTrash /> Delete Role</>}
        message={deletingRole ? (<>Are you sure you want to delete role <strong>{deletingRole.roleName}</strong>?</>) : null}
        confirmLabel="Yes, Delete"
      />
    </Container>
  );
}

export default UserManagement;