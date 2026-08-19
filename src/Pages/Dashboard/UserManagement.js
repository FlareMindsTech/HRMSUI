import React, { useState, useEffect, useCallback } from "react";
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
  Tabs,
  Tab,
  InputGroup,
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
import { useAuth } from "../../context/AuthContext";

function UserManagement() {
  const { isSystemAdmin, hasPermission, user: currentUser, refreshAuthContext } = useAuth();

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState(isSystemAdmin ? "roles" : "users");

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
  const [manageForm, setManageForm] = useState({
    roleId: "",
    isActive: true,
    isBlocked: false,
    newPassword: "",
    showPass: false,
  });

  // ── Search State ──
  const [userSearch, setUserSearch] = useState("");

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
    // Find default employee role or first assignable role
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
      await provisionUserAccount({
        employeeId: provisioningUser._id || provisioningUser.id,
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
  const handleOpenManageModal = (employee) => {
    setManagingUser(employee);
    setManageForm({
      roleId: employee.role?._id || employee.role || "",
      isActive: employee.isActive !== false,
      isBlocked: employee.isBlocked === true,
      newPassword: "",
      showPass: false,
    });
    setShowManageModal(true);
  };

  // ── Submit Manage Account Changes ──
  const handleManageSubmit = async (e) => {
    e.preventDefault();
    if (!managingUser) return;

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

      setSuccessMessage(
        `Account settings updated for ${managingUser.firstName} ${managingUser.lastName}.`
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

  // ── Filtered Users List ──
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const empCode = (u.employeeCode || "").toLowerCase();
    const dept = (u.department || "").toLowerCase();
    const search = userSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search) || empCode.includes(search) || dept.includes(search);
  });

  return (
    <Container fluid className="p-3">
      {/* ── Header ── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <FaUserShield className="text-success" /> User & Access Management
          </h4>
          <p className="text-muted small mb-0">
            Provision employee login accounts, manage assigned roles, and configure system RBAC permissions.
          </p>
        </div>

        {isSystemAdmin && activeTab === "roles" && (
          <Button
            variant="success"
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm fw-semibold"
            onClick={handleOpenCreateRoleModal}
          >
            <FaPlus /> Create Custom Role
          </Button>
        )}
      </div>

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

      {/* ── Main Navigation Tabs ── */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        {/* ── Tab 1: Employee Directory & Account Provisioning ── */}
        <Tab eventKey="users" title="Employee Directory & Account Provisioning">
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Header className="bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <span className="fw-bold text-dark">Employee Accounts Directory</span>
                <span className="text-muted extra-small ms-2">({filteredUsers.length} employees)</span>
              </div>
              <div style={{ width: 320 }}>
                <Form.Control
                  type="search"
                  placeholder="Search by name, code, email, department..."
                  size="sm"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="rounded-pill"
                />
              </div>
            </Card.Header>

            <div className="table-responsive">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                  <div className="small text-muted mt-2">Loading employee directory...</div>
                </div>
              ) : (
                <Table hover align="middle" className="mb-0">
                  <thead className="table-light extra-small text-uppercase text-muted">
                    <tr>
                      <th className="ps-4">Employee</th>
                      <th>Employee Code</th>
                      <th>Department / Role</th>
                      <th>Login Status</th>
                      <th>Assigned Role</th>
                      <th className="text-end pe-4">Account Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const hasAccount = u.hasLoginAccess === true;
                      const isOwnerUser = u.role?.priority === 1 || u.role?.roleCode === "OWNER";
                      const canModify = currentUser?.priority === 1 || (!isOwnerUser && (isSystemAdmin || hasPermission("user.manage_roles")));

                      return (
                        <tr key={u._id || u.id}>
                          <td className="ps-4">
                            <div className="fw-semibold text-dark">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="extra-small text-muted">{u.email}</div>
                          </td>
                          <td>
                            <code>{u.employeeCode || "—"}</code>
                          </td>
                          <td>
                            <div className="small text-dark fw-medium">{u.department || "General"}</div>
                            <div className="extra-small text-muted">{u.designation || "Employee"}</div>
                          </td>
                          <td>
                            {!hasAccount ? (
                              <Badge bg="warning" text="dark" className="px-2 py-1 rounded-pill">
                                No Login Account
                              </Badge>
                            ) : u.isBlocked ? (
                              <Badge bg="danger" className="px-2 py-1 rounded-pill">
                                Blocked
                              </Badge>
                            ) : u.isActive ? (
                              <Badge bg="success" className="px-2 py-1 rounded-pill">
                                <FaUserCheck className="me-1" /> Active Login
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="px-2 py-1 rounded-pill">
                                <FaUserTimes className="me-1" /> Inactive
                              </Badge>
                            )}
                          </td>
                          <td>
                            {u.role ? (
                              <Badge
                                bg={u.role.priority === 1 ? "danger" : u.role.priority === 2 ? "warning" : "light"}
                                text={u.role.priority <= 2 ? "white" : "dark"}
                                className="border px-2 py-1 rounded-pill"
                              >
                                <FaKey className="me-1" />
                                {u.role.roleName || "Employee"}
                              </Badge>
                            ) : (
                              <span className="text-muted small">Not Assigned</span>
                            )}
                          </td>
                          <td className="text-end pe-4">
                            {!hasAccount ? (
                              (isSystemAdmin || hasPermission("user.provision_account")) && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  className="rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                                  onClick={() => handleOpenProvisionModal(u)}
                                >
                                  <FaUserPlus /> Create Login Account
                                </Button>
                              )
                            ) : (
                              canModify && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                                  onClick={() => handleOpenManageModal(u)}
                                >
                                  <FaCog /> Manage Account
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
          </Card>
        </Tab>

        {/* ── Tab 2: Roles & Permissions Architecture (Admin / Owner Only) ── */}
        {isSystemAdmin && (
          <Tab eventKey="roles" title="Organizational Roles & RBAC Architecture">
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <span className="fw-bold text-dark">Configured Roles</span>
                <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                  Total Roles: {roles.length}
                </Badge>
              </Card.Header>

              <div className="table-responsive">
                <Table hover align="middle" className="mb-0">
                  <thead className="table-light extra-small text-uppercase text-muted">
                    <tr>
                      <th className="ps-4">Role Name</th>
                      <th>Role Code</th>
                      <th>Priority Level</th>
                      <th>Type</th>
                      <th>Modules</th>
                      <th>Permissions</th>
                      <th>Assigned Users</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role._id}>
                        <td className="ps-4 fw-semibold text-dark">
                          <div className="d-flex align-items-center gap-2">
                            <FaShieldAlt className={role.priority <= 2 ? "text-danger" : "text-success"} />
                            <span>{role.roleName}</span>
                          </div>
                          {role.description && (
                            <div className="extra-small text-muted">{role.description}</div>
                          )}
                        </td>
                        <td>
                          <code>{role.roleCode}</code>
                        </td>
                        <td>
                          <Badge bg={role.priority === 1 ? "danger" : role.priority === 2 ? "warning" : "secondary"}>
                            Priority {role.priority} {role.priority === 1 ? "(Owner)" : role.priority === 2 ? "(Admin)" : ""}
                          </Badge>
                        </td>
                        <td>
                          {role.isSystemRole || role.priority <= 2 || ["OWNER", "ADMIN", "HR", "EMPLOYEE"].includes(role.roleCode) ? (
                            <Badge bg="info" className="px-2 py-1">System Core</Badge>
                          ) : (
                            <Badge bg="light" text="dark" className="border px-2 py-1">Custom Role</Badge>
                          )}
                        </td>
                        <td>
                          <span className="fw-bold text-dark">{role.menuCount || 0}</span>
                          <span className="extra-small text-muted"> modules</span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">{role.permissionCount || 0}</span>
                          <span className="extra-small text-muted"> actions</span>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border">
                            <FaUsers className="me-1" /> {role.userCount || 0}
                          </Badge>
                        </td>
                        <td className="text-end pe-4">
                          {((!role.isSystemRole && !["OWNER", "ADMIN", "HR", "EMPLOYEE"].includes(role.roleCode)) || currentUser?.priority === 1) && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2 rounded-pill px-3"
                              onClick={() => handleOpenEditRoleModal(role)}
                            >
                              <FaEdit className="me-1" /> Edit Access
                            </Button>
                          )}
                          {!role.isSystemRole && !["OWNER", "ADMIN", "HR", "EMPLOYEE"].includes(role.roleCode) && role.priority > 2 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="rounded-pill px-2"
                              onClick={() => handleDeleteRole(role)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </Tab>
        )}
      </Tabs>

      {/* ========================================================
          MODAL: CREATE LOGIN ACCOUNT (PROVISIONING)
          ======================================================== */}
      <Modal
        show={showProvisionModal}
        onHide={() => setShowProvisionModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
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
                <Badge bg="dark"><code>{provisioningUser?.employeeCode}</code></Badge>
              </div>
              <div className="extra-small text-muted mt-2">
                Department: <strong>{provisioningUser?.department || "General"}</strong> | Designation: <strong>{provisioningUser?.designation || "Employee"}</strong>
              </div>
            </Card>

            {/* Role Selection */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Assign Initial Role *</Form.Label>
              <Form.Select
                value={provisionForm.roleId}
                onChange={(e) => setProvisionForm({ ...provisionForm, roleId: e.target.value })}
                required
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

          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowProvisionModal(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={modalLoading}>
              {modalLoading ? "Provisioning..." : "Create Login Account"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================
          MODAL: MANAGE ACCOUNT (Role, Status, Password Reset)
          ======================================================== */}
      <Modal
        show={showManageModal}
        onHide={() => setShowManageModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
            <FaCog className="text-primary" /> Manage Employee Account
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleManageSubmit}>
          <Modal.Body className="p-4">
            <div className="mb-3 p-3 bg-light rounded-3">
              <h6 className="fw-bold mb-0 text-dark">
                {managingUser?.firstName} {managingUser?.lastName}
              </h6>
              <div className="extra-small text-muted">
                {managingUser?.email} | <code>{managingUser?.employeeCode}</code>
              </div>
            </div>

            {/* Role Reassignment */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Assigned Role</Form.Label>
              <Form.Select
                value={manageForm.roleId}
                onChange={(e) => setManageForm({ ...manageForm, roleId: e.target.value })}
                required
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
            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Account Status</Form.Label>
                  <Form.Select
                    value={manageForm.isActive ? "true" : "false"}
                    onChange={(e) => setManageForm({ ...manageForm, isActive: e.target.value === "true" })}
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
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setManageForm((p) => ({ ...p, showPass: !p.showPass }))}
                >
                  {manageForm.showPass ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowManageModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={modalLoading}>
              {modalLoading ? "Saving..." : "Save Account Changes"}
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
                    />
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Priority Hierarchy</Form.Label>
                    <Form.Select
                      value={roleForm.priority}
                      onChange={(e) => setRoleForm({ ...roleForm, priority: Number(e.target.value) })}
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
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* ── Section 1: Module Access (RoleMenu) ── */}
              <div className="mb-4 p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0 text-dark">
                    1. Application Module Access (RoleMenu)
                  </h6>
                  <span className="extra-small text-muted">
                    Determines which pages appear in the user's sidebar
                  </span>
                </div>

                <Row className="g-2 pt-2">
                  {menus.map((menu) => {
                    const isChecked = roleForm.selectedMenuIds.includes(menu._id);
                    return (
                      <Col xs={6} md={4} key={menu._id}>
                        <div
                          className={`p-2 rounded border cursor-pointer d-flex align-items-center gap-2 ${
                            isChecked ? "bg-white border-success text-success fw-bold" : "bg-white text-secondary"
                          }`}
                          onClick={() => toggleMenu(menu._id)}
                          style={{ cursor: "pointer", transition: "all 0.15s" }}
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
                      2. Granular API Action Permissions (RolePermission)
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
                      <Card.Header className="bg-white py-2 d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark small">
                          📦 {moduleName} MODULE
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 extra-small text-decoration-none text-success"
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
                                  className={`p-2 rounded border cursor-pointer ${
                                    isSelected
                                      ? "bg-light border-success text-dark"
                                      : "bg-white text-muted"
                                  }`}
                                  onClick={() => togglePermission(p.permissionCode)}
                                  style={{ cursor: "pointer" }}
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
                <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
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