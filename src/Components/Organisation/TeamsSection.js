import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Form,
  Row,
  Col,
  Spinner,
  Modal,
} from "react-bootstrap";
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaSitemap,
  FaCodeBranch,
  FaCheck,
} from "react-icons/fa";
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchDepartmentsDropdown,
  fetchBranchesDropdown,
  fetchEmployeesDropdown,
} from "../../services/organizationService";
import { useSelector } from 'react-redux';
import { useHasPermission, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import DataTable from "../Common/DataTable";
import EmptyState from "../Common/EmptyState";
import SearchInput from "../Common/SearchInput";
import PaginationBar from "../Common/PaginationBar";
import FeedbackAlert from "../Common/FeedbackAlert";
import ConfirmModal from "../Common/ConfirmModal";
import "./TeamsSection.css";

function TeamsSection({ lockedBranchId }) {
  const hasPermission = useHasPermission(); const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterBranch, setFilterBranch] = useState(lockedBranchId || "");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    teamName: "",
    teamCode: "",
    departmentId: "",
    branchId: lockedBranchId || "",
    teamLeadId: "",
    teamManagerId: "",
    description: "",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (lockedBranchId) {
      setFilterBranch(lockedBranchId);
      setFormData((prev) => ({ ...prev, branchId: lockedBranchId }));
    }
  }, [lockedBranchId]);

  const canCreate = isSystemAdmin || hasPermission("team.create");
  const canUpdate = isSystemAdmin || hasPermission("team.update");
  const canDelete = isSystemAdmin || hasPermission("team.delete");

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        departmentId: filterDept,
        branchId: lockedBranchId || filterBranch,
        status: filterStatus,
      };
      const res = await fetchTeams(params);
      if (res.success) {
        setTeams(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterBranch, filterStatus, lockedBranchId]);

  const loadAuxiliaryData = async (branchForScope) => {
    try {
      const activeBranch = branchForScope || lockedBranchId || filterBranch;
      const [deptList, brList, empList] = await Promise.all([
        fetchDepartmentsDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
        fetchBranchesDropdown().catch(() => []),
        fetchEmployeesDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
      ]);
      setDepartments(deptList);
      setBranches(brList);
      setEmployees(empList);
    } catch (err) {
      console.warn("Error loading auxiliary dropdown data:", err);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [lockedBranchId, filterBranch]);

  const handleFormBranchChange = async (selectedBranchId) => {
    setFormData((prev) => ({
      ...prev,
      branchId: selectedBranchId,
      departmentId: "", // reset selected department when branch changes
      teamLeadId: "",
      teamManagerId: "",
    }));
    try {
      const [deptList, empList] = await Promise.all([
        fetchDepartmentsDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
        fetchEmployeesDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
      ]);
      setDepartments(deptList);
      setEmployees(empList);
    } catch (err) {
      console.warn("Failed to reload branch-scoped data:", err);
    }
  };

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({ ...initialForm, branchId: lockedBranchId || "" });
    setModalError("");
    loadAuxiliaryData(lockedBranchId || "");
    setShowModal(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    const bId = team.branchId?._id || team.branchId || lockedBranchId || "";
    setFormData({
      teamName: team.teamName || "",
      teamCode: team.teamCode || "",
      departmentId: team.departmentId?._id || team.departmentId || "",
      branchId: bId,
      teamLeadId: team.teamLeadId?._id || team.teamLeadId || "",
      teamManagerId: team.teamManagerId?._id || team.teamManagerId || "",
      description: team.description || "",
      status: team.status || "ACTIVE",
    });
    setModalError("");
    loadAuxiliaryData(bId);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        teamName: formData.teamName.trim(),
        teamCode: formData.teamCode.trim().toUpperCase(),
        departmentId: formData.departmentId || null,
        branchId: formData.branchId || null,
        teamLeadId: formData.teamLeadId || null,
        teamManagerId: formData.teamManagerId || null,
        description: formData.description ? formData.description.trim() : "",
        status: formData.status,
      };

      if (editingTeam) {
        const res = await updateTeam(editingTeam._id, payload);
        setSuccess(res.message || "Team updated successfully");
      } else {
        const res = await createTeam(payload);
        setSuccess(res.message || "Team created successfully");
      }
      setShowModal(false);
      loadTeams();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save team");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteTeam(deletingId);
      setSuccess(res.message || "Team deleted successfully");
      setShowDeleteModal(false);
      loadTeams();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete team");
      setShowDeleteModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="org-sub-section">
      {/* ── Section Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FaUsers className="text-success" />
            Teams & Working Groups
          </h4>
          <p className="text-muted small mb-0">
            Organize functional units, cross-department squads, and project pods under branches.
          </p>
        </div>
        {canCreate && (
          <Button
            size="sm"
            className="d-flex align-items-center gap-1 shadow-sm team-modal-btn-save"
            style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
            onClick={handleOpenCreate}
          >
            <FaPlus size={11} /> Add Team
          </Button>
        )}
      </div>

      {/* ── Alerts ── */}
      <FeedbackAlert variant="danger" dismissible onClose={() => setError("")} message={error} />
      <FeedbackAlert variant="success" dismissible onClose={() => setSuccess("")} message={success} />

      {/* ── Filters Toolbar ── */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-2">
          <Row className="g-2 align-items-center">
            <Col md={lockedBranchId ? 4 : 3}>
              <SearchInput
                size="sm"
                iconClassName="text-muted"
                placeholder="Search team name or code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </Col>
            {!lockedBranchId && (
              <Col md={3}>
                <Form.Select
                  size="sm"
                  value={filterBranch}
                  onChange={(e) => {
                    setFilterBranch(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.branchName}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}
            <Col md={lockedBranchId ? 4 : 3}>
              <Form.Select
                size="sm"
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.departmentName}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={lockedBranchId ? 4 : 3}>
              <Form.Select
                size="sm"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Teams Table ── */}
      <Card className="org-table-card">
        <DataTable
          responsive
          hover
          className="org-table mb-0 align-middle"
          columns={[
            {
              key: "team",
              header: "Team Code & Name",
              render: (t) => (
                <>
                  <div className="fw-semibold text-dark">{t.teamName}</div>
                  <div className="small font-monospace text-muted">{t.teamCode}</div>
                </>
              ),
            },
            {
              key: "branch",
              header: "Branch",
              render: (t) =>
                t.branchId ? (
                  <div className="small">
                    <FaCodeBranch className="text-secondary me-1" />
                    {t.branchId.branchName || "Branch"}
                  </div>
                ) : (
                  <span className="text-muted small">Global / Virtual</span>
                ),
            },
            {
              key: "department",
              header: "Department",
              render: (t) =>
                t.departmentId ? (
                  <div className="small">
                    <FaSitemap className="text-success me-1" />
                    {t.departmentId.departmentName}
                  </div>
                ) : (
                  <span className="text-muted small">Cross-Department</span>
                ),
            },
            {
              key: "lead",
              header: "Team Lead",
              render: (t) =>
                t.teamLeadId ? (
                  <div className="d-flex align-items-center gap-1">
                    <FaUserTie className="text-primary small" />
                    <span className="small">{t.teamLeadId.firstName} {t.teamLeadId.lastName}</span>
                  </div>
                ) : (
                  <span className="text-muted small">Unassigned</span>
                ),
            },
            {
              key: "manager",
              header: "Manager",
              render: (t) =>
                t.teamManagerId ? (
                  <div className="d-flex align-items-center gap-1">
                    <FaUserTie className="text-dark small" />
                    <span className="small">{t.teamManagerId.firstName} {t.teamManagerId.lastName}</span>
                  </div>
                ) : (
                  <span className="text-muted small">Unassigned</span>
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (t) => (
                <Badge bg={t.status === "ACTIVE" ? "success" : "secondary"}>
                  {t.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              headerClassName: "text-end",
              cellClassName: "text-end",
              render: (t) => (
                <>
                  {canUpdate && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary p-1"
                      title="Edit Team"
                      onClick={() => handleOpenEdit(t)}
                    >
                      <FaEdit />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-1"
                      title="Delete Team"
                      onClick={() => {
                        setDeletingId(t._id);
                        setDeletingName(t.teamName);
                        setShowDeleteModal(true);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  )}
                </>
              ),
            },
          ]}
          rows={teams}
          rowKey={(t) => t._id}
          loading={loading}
          loadingComponent={
            <tr>
              <td colSpan={7} className="text-center py-5 text-muted">
                <Spinner animation="border" size="sm" variant="success" className="me-2" />
                Loading teams...
              </td>
            </tr>
          }
          emptyComponent={
            <EmptyState
              variant="table"
              colSpan={7}
              className="text-center py-5 text-muted"
              bodyClassName="p-3"
              title="No teams found."
              titleAs="p"
              titleClassName="mb-2"
              actionLabel={canCreate ? "Add First Team" : undefined}
              onAction={handleOpenCreate}
              actionVariant="outline-success"
              actionIcon={<FaPlus className="me-1" />}
            />
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationBar
            size="sm"
            page={page}
            totalPages={totalPages}
            onPageChange={(pg) => setPage(pg)}
            wrapperClassName="d-flex justify-content-end p-3 border-top"
            paginationClassName="mb-0"
          />
        )}
      </Card>

      {/* ── Create / Edit Modal ── */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        dialogClassName="team-luxury-modal"
      >
        <Modal.Header closeButton>
          <div className="d-flex align-items-center gap-3">
            <div className="team-modal-icon-badge">
              <FaUsers />
            </div>
            <div>
              <Modal.Title className="modal-title mb-0">
                {editingTeam ? "Edit Team" : "Add New Team"}
              </Modal.Title>
              <div className="modal-subtitle">
                {editingTeam
                  ? `Update team structure, leadership, and operational domain for ${editingTeam.teamName}`
                  : "Configure functional squad, leadership, and operational scope"}
              </div>
            </div>
          </div>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body className="modal-body">
            <FeedbackAlert variant="danger" dismissible onClose={() => setModalError("")} message={modalError} />

            {lockedBranchId && (
              <div className="team-modal-notice">
                <div className="d-flex align-items-center gap-2">
                  <FaCodeBranch style={{ color: "#c49a55" }} />
                  <div>
                    <strong className="text-dark small">Branch-Scoped Team:</strong>{" "}
                    <span className="small text-muted">
                      This squad is bound to{" "}
                      <strong>
                        {branches.find((b) => b._id === lockedBranchId)?.branchName || "Current Branch"}
                      </strong>.
                    </span>
                  </div>
                </div>
                <span className="badge" style={{ background: "#c49a55", color: "#1c1d1d", fontWeight: 700 }}>
                  LOCKED
                </span>
              </div>
            )}
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <label className="team-modal-label">
                Team Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                className="team-modal-input"
                placeholder="e.g. Core Platform Team"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <label className="team-modal-label">
                Team Code <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                className="team-modal-input font-monospace text-uppercase"
                placeholder="e.g. CORE-PLAT"
                value={formData.teamCode}
                onChange={(e) => setFormData({ ...formData, teamCode: e.target.value.toUpperCase() })}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <label className="team-modal-label">
                Branch {lockedBranchId && <span className="badge bg-secondary ms-1">Locked</span>}
              </label>
              <select
                className="team-modal-select"
                value={formData.branchId}
                disabled={Boolean(lockedBranchId)}
                onChange={(e) => handleFormBranchChange(e.target.value)}
              >
                {!lockedBranchId && <option value="">-- All Branches / Virtual --</option>}
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <label className="team-modal-label">Department (Filtered by Branch)</label>
              <select
                className="team-modal-select"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">-- Cross-Department / None --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.departmentName} ({d.departmentCode})
                  </option>
                ))}
              </select>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <label className="team-modal-label">Team Lead (Filtered by Branch)</label>
              <select
                className="team-modal-select"
                value={formData.teamLeadId}
                onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
              >
                <option value="">-- Select Team Lead --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <label className="team-modal-label">Team Manager</label>
              <select
                className="team-modal-select"
                value={formData.teamManagerId}
                onChange={(e) => setFormData({ ...formData, teamManagerId: e.target.value })}
              >
                <option value="">-- Select Team Manager --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </Form.Group>
          </Col>

          <Col md={12}>
            <Form.Group>
              <label className="team-modal-label">Description</label>
              <textarea
                rows={2}
                className="team-modal-textarea"
                placeholder="Team purpose and domain"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <label className="team-modal-label">Status</label>
              <select
                className="team-modal-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Form.Group>
          </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className="modal-footer">
            <button
              type="button"
              className="team-modal-btn-cancel"
              onClick={() => setShowModal(false)}
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="team-modal-btn-save"
              disabled={modalLoading}
            >
              {modalLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaCheck size={12} />
                  <span>{editingTeam ? "Update Team" : "Save Team"}</span>
                </>
              )}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={<><FaTrash /> Delete Team</>}
        message={<>Are you sure you want to delete team <strong>{deletingName}</strong>?<p className="text-muted small mt-2">Team assignments for members will be cleared.</p></>}
        onConfirm={handleDelete}
        loading={modalLoading}
      />
    </div>
  );
}

export default TeamsSection;
