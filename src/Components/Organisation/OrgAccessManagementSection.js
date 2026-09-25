import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Row, Col, Card, Table, Button, Badge, Form, InputGroup, Spinner, Alert, Modal } from "react-bootstrap";
import {
  FaShieldAlt,
  FaSearch,
  FaBuilding,
  FaCodeBranch,
  FaSave,
  FaEdit,
  FaUsers,
  FaStar,
} from "react-icons/fa";
import { fetchAllUsers } from "../../services/rbacService";
import { fetchBranchesDropdown } from "../../services/organizationService";
import { updateUserAccess } from "../../services/accessService";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import BranchAccessSelector from "../Common/BranchAccessSelector";

export default function OrgAccessManagementSection() {
  const { isSystemAdmin, hasPermission, user: currentUser } = useAuth();
  const { organization, branches: contextBranches, refreshBranches } = useBranch();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAccess, setFilterAccess] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessLevel, setAccessLevel] = useState("ORGANIZATION");
  const [primaryBranchId, setPrimaryBranchId] = useState("");
  const [branchIds, setBranchIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");

  const canManageAccess = isSystemAdmin || hasPermission("organization.access.manage") || hasPermission("user.update") || currentUser?.roleCode === "OWNER";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [uRes, bRes] = await Promise.all([
        fetchAllUsers({ limit: 200 }).catch(() => ({ data: [] })),
        fetchBranchesDropdown().catch(() => []),
      ]);

      setUsers(uRes?.data || []);
      setBranches(bRes.length > 0 ? bRes : contextBranches || []);
    } catch (err) {
      setError(err.message || "Failed to load user access list");
    } finally {
      setLoading(false);
    }
  }, [contextBranches]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.roleName || u.roleCode || "").toLowerCase();
      const matchesSearch = !search || name.includes(q) || email.includes(q) || role.includes(q);

      const uAccess = u.accessLevel || (u.primaryBranchId || (Array.isArray(u.branchIds) && u.branchIds.length > 0) ? "BRANCH" : "ORGANIZATION");
      const matchesAccess = !filterAccess || uAccess === filterAccess;

      const pBId = String(u.primaryBranchId?._id || u.primaryBranchId || "");
      const matchesBranch = !filterBranch || pBId === filterBranch;

      return matchesSearch && matchesAccess && matchesBranch;
    });
  }, [users, search, filterAccess, filterBranch]);

  const handleOpenEditAccess = (userItem) => {
    setSelectedUser(userItem);
    const lvl = userItem.accessLevel || (userItem.primaryBranchId || (Array.isArray(userItem.branchIds) && userItem.branchIds.length > 0) ? "BRANCH" : "ORGANIZATION");
    setAccessLevel(lvl);

    const pBId = String(userItem.primaryBranchId?._id || userItem.primaryBranchId || "");
    setPrimaryBranchId(pBId);

    const bList = Array.isArray(userItem.branchIds)
      ? userItem.branchIds.map((b) => (typeof b === "object" && b !== null ? String(b._id || b.id) : String(b))).filter(Boolean)
      : (pBId ? [pBId] : []);
    setBranchIds(bList);

    setModalError("");
    setShowAccessModal(true);
  };

  const handleSaveAccess = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Strict Frontend Validations as per Requirement #21
    if (accessLevel === "BRANCH") {
      if (!primaryBranchId) {
        setModalError("Primary Branch is mandatory for Branch-specific access.");
        return;
      }
      if (!branchIds.includes(primaryBranchId)) {
        setModalError("Primary Branch must be included in the selected Authorized Branches.");
        return;
      }
    }

    try {
      setSaving(true);
      setModalError("");

      const payload = {
        organizationId: organization?._id || organization?.id || localStorage.getItem("organizationId"),
        accessLevel: accessLevel,
        primaryBranchId: accessLevel === "BRANCH" ? primaryBranchId : null,
        branchIds: accessLevel === "BRANCH" ? branchIds : [],
      };

      const userId = selectedUser._id || selectedUser.id;
      const res = await updateUserAccess(userId, payload);

      setSuccess(res?.message || `Access updated for ${selectedUser.firstName || selectedUser.email}`);
      setShowAccessModal(false);
      await loadData();
      if (refreshBranches) refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to update user access level");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="org-access-section">
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <FaShieldAlt className="text-success" /> Organization Access & Scoping
          </h3>
          <p className="text-muted small mb-0">
            Define organizational boundaries and authorized branch scoping for all enterprise team members and administrators.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Badge bg="light" text="dark" className="border px-3 py-2">
            <FaBuilding className="me-1 text-primary" /> {organization?.organizationName || "Your Organization"}
          </Badge>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filter Bar ── */}
      <Card className="border shadow-sm mb-4 bg-white">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  className="border-start-0 ps-0"
                  placeholder="Search user name, email, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={3}>
              <Form.Select value={filterAccess} onChange={(e) => setFilterAccess(e.target.value)}>
                <option value="">All Access Levels</option>
                <option value="ORGANIZATION">Organization-Wide Access</option>
                <option value="BRANCH">Branch-Specific Access</option>
              </Form.Select>
            </Col>

            <Col md={4}>
              <Form.Select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                <option value="">Filter by Primary Branch</option>
                {branches.map((b) => (
                  <option key={b._id || b.id} value={b._id || b.id}>
                    {b.branchName} ({b.city})
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Users Access Table ── */}
      <Card className="border shadow-sm bg-white">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3 text-muted">Loading user access list...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <FaUsers className="text-muted fs-1 mb-2 opacity-50" />
              <h6 className="fw-bold text-dark">No Users Found</h6>
              <p className="text-muted small">No staff members match the selected access criteria.</p>
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light text-secondary small">
                <tr>
                  <th className="ps-4">User Details</th>
                  <th>Role</th>
                  <th>Access Scope</th>
                  <th>Primary Branch</th>
                  <th>Authorized Branches</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const uAccess = u.accessLevel || (u.primaryBranchId || (Array.isArray(u.branchIds) && u.branchIds.length > 0) ? "BRANCH" : "ORGANIZATION");
                  const pBranchObj = branches.find((b) => String(b._id || b.id) === String(u.primaryBranchId?._id || u.primaryBranchId));
                  const bCount = Array.isArray(u.branchIds) ? u.branchIds.length : (u.primaryBranchId ? 1 : 0);

                  return (
                    <tr key={u._id || u.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "var(--primary-gradient)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                              flexShrink: 0,
                            }}
                          >
                            {(u.firstName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">
                              {u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.email}
                            </div>
                            <div className="small text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {u.roleName || u.roleCode || "Staff"}
                        </Badge>
                      </td>

                      <td>
                        {uAccess === "ORGANIZATION" ? (
                          <Badge bg="success" className="d-flex align-items-center gap-1" style={{ width: "fit-content" }}>
                            <FaBuilding size={10} /> Organization-Wide
                          </Badge>
                        ) : (
                          <Badge bg="primary" className="d-flex align-items-center gap-1" style={{ width: "fit-content" }}>
                            <FaCodeBranch size={10} /> Branch-Specific
                          </Badge>
                        )}
                      </td>

                      <td>
                        {uAccess === "ORGANIZATION" ? (
                          <span className="text-muted small">All Branches Allowed</span>
                        ) : pBranchObj ? (
                          <span className="fw-semibold text-dark d-flex align-items-center gap-1">
                            <FaStar className="text-warning small" /> {pBranchObj.branchName}
                          </span>
                        ) : (
                          <span className="text-danger small">Not Configured</span>
                        )}
                      </td>

                      <td>
                        {uAccess === "ORGANIZATION" ? (
                          <span className="badge bg-light text-success border border-success-subtle">
                            Global ({branches.length} Branches)
                          </span>
                        ) : (
                          <span className="badge bg-light text-dark border">
                            {bCount} Branch{bCount !== 1 ? "es" : ""} Selected
                          </span>
                        )}
                      </td>

                      <td className="text-end pe-4">
                        {canManageAccess && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="d-inline-flex align-items-center gap-1"
                            onClick={() => handleOpenEditAccess(u)}
                          >
                            <FaEdit /> Manage Access
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* ── Access Configuration Modal ── */}
      <Modal show={showAccessModal} onHide={() => setShowAccessModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSaveAccess}>
          <Modal.Header closeButton className="border-bottom px-4 py-3">
            <Modal.Title className="fs-5 fw-bold d-flex align-items-center gap-2">
              <FaShieldAlt className="text-success" /> Configure Organization Access Scoping
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {modalError && <Alert variant="danger" dismissible onClose={() => setModalError("")}>{modalError}</Alert>}

            {selectedUser && (
              <div className="p-3 bg-light rounded border mb-4 d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-bold text-dark">
                    {selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ""}` : selectedUser.email}
                  </div>
                  <div className="small text-muted">{selectedUser.email} • Role: <strong>{selectedUser.roleName || selectedUser.roleCode}</strong></div>
                </div>
                <Badge bg="light" text="dark" className="border">
                  Organization: {organization?.organizationName || "Current Organization"}
                </Badge>
              </div>
            )}

            <BranchAccessSelector
              organization={organization}
              accessLevel={accessLevel}
              primaryBranchId={primaryBranchId}
              branchIds={branchIds}
              branches={branches}
              onChange={({ accessLevel: newLvl, primaryBranchId: newP, branchIds: newB }) => {
                setAccessLevel(newLvl);
                setPrimaryBranchId(newP);
                setBranchIds(newB);
              }}
              disabled={saving}
            />
          </Modal.Body>

          <Modal.Footer className="bg-light px-4 py-3 border-top">
            <Button variant="secondary" size="sm" onClick={() => setShowAccessModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={saving} className="d-flex align-items-center gap-1 px-3 fw-semibold">
              {saving ? <Spinner animation="border" size="sm" /> : <FaSave />} Save Access Permissions
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
