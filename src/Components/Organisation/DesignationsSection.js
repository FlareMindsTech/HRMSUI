import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Form,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import {
  FaUserTag,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSitemap,
  FaLayerGroup,
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  fetchDepartmentsDropdown,
  fetchJobGradesDropdown,
  fetchBranchesDropdown,
} from "../../services/organizationService";
import { useSelector } from 'react-redux';
import { useHasPermission, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import DataTable from "../Common/DataTable";
import PaginationBar from "../Common/PaginationBar";
import FeedbackAlert from "../Common/FeedbackAlert";
import EmptyState from "../Common/EmptyState";
import SearchInput from "../Common/SearchInput";
import ConfirmModal from "../Common/ConfirmModal";
import CrudModal from "../Common/CrudModal";

function DesignationsSection({ lockedBranchId }) {
  const hasPermission = useHasPermission(); const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobGrades, setJobGrades] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState(lockedBranchId || "");
  const [filterDept, setFilterDept] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDesig, setEditingDesig] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    designationName: "",
    designationCode: "",
    branchId: lockedBranchId || "",
    departmentId: "",
    jobGradeId: "",
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

  const canCreate = isSystemAdmin || hasPermission("designation.create");
  const canUpdate = isSystemAdmin || hasPermission("designation.update");
  const canDelete = isSystemAdmin || hasPermission("designation.delete");

  const loadDesignations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        branchId: lockedBranchId || filterBranch,
        departmentId: filterDept,
        jobGradeId: filterGrade,
        status: filterStatus,
      };
      const res = await fetchDesignations(params);
      if (res.success) {
        setDesignations(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load designations");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBranch, filterDept, filterGrade, filterStatus, lockedBranchId]);

  const loadAuxiliaryData = async (branchForScope) => {
    try {
      const activeBranch = branchForScope || lockedBranchId || filterBranch;
      const [deptList, gradeList, brList] = await Promise.all([
        fetchDepartmentsDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
        fetchJobGradesDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
        fetchBranchesDropdown().catch(() => []),
      ]);
      setDepartments(deptList);
      setJobGrades(gradeList);
      setBranches(brList);
    } catch (err) {
      console.warn("Error loading auxiliary dropdown data:", err);
    }
  };

  useEffect(() => {
    loadDesignations();
  }, [loadDesignations]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [lockedBranchId, filterBranch]);

  // When form branch selection changes, reload scoped departments and job grades
  const handleFormBranchChange = async (selectedBranchId) => {
    setFormData((prev) => ({
      ...prev,
      branchId: selectedBranchId,
      departmentId: "", // reset selected department to prevent invalid cross-branch selection
      jobGradeId: "",
    }));
    try {
      const [deptList, gradeList] = await Promise.all([
        fetchDepartmentsDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
        fetchJobGradesDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
      ]);
      setDepartments(deptList);
      setJobGrades(gradeList);
    } catch (err) {
      console.warn("Failed to reload branch-scoped data:", err);
    }
  };

  const handleOpenCreate = () => {
    setEditingDesig(null);
    setFormData({ ...initialForm, branchId: lockedBranchId || "" });
    setModalError("");
    loadAuxiliaryData(lockedBranchId || "");
    setShowModal(true);
  };

  const handleOpenEdit = (desig) => {
    setEditingDesig(desig);
    const bId = desig.branchId?._id || desig.branchId || lockedBranchId || "";
    setFormData({
      designationName: desig.designationName || "",
      designationCode: desig.designationCode || "",
      branchId: bId,
      departmentId: desig.departmentId?._id || desig.departmentId || "",
      jobGradeId: desig.jobGradeId?._id || desig.jobGradeId || "",
      description: desig.description || "",
      status: desig.status || "ACTIVE",
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
        designationName: formData.designationName.trim(),
        designationCode: formData.designationCode.trim().toUpperCase(),
        branchId: formData.branchId || null,
        departmentId: formData.departmentId || null,
        jobGradeId: formData.jobGradeId || null,
        description: formData.description ? formData.description.trim() : "",
        status: formData.status,
      };

      let res;
      if (editingDesig) {
        res = await updateDesignation(editingDesig._id, payload);
      } else {
        res = await createDesignation(payload);
      }

      if (res.success) {
        setSuccess(editingDesig ? "Designation updated successfully" : "Designation created successfully");
        setShowModal(false);
        loadDesignations();
      }
    } catch (err) {
      setModalError(err.message || "Failed to save designation");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteDesignation(deletingId);
      if (res.success) {
        setSuccess("Designation deleted successfully");
        setShowDeleteModal(false);
        loadDesignations();
      }
    } catch (err) {
      setError(err.message || "Failed to delete designation");
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
            <FaUserTag className="text-success" />
            Designations & Job Titles
          </h4>
          <p className="text-muted small mb-0">
            Define standardized organizational roles, hierarchy levels, and assign to departments.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" size="sm" className="d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenCreate}>
            <FaPlus size={11} /> Add Designation
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
                placeholder="Search designation title / code..."
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
            <Col md={lockedBranchId ? 3 : 2}>
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
            <Col md={lockedBranchId ? 3 : 2}>
              <Form.Select
                size="sm"
                value={filterGrade}
                onChange={(e) => {
                  setFilterGrade(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Job Grades</option>
                {jobGrades.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.gradeName} ({g.gradeCode})
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={lockedBranchId ? 2 : 2}>
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

      {/* ── Table ── */}
      <Card className="org-table-card">
        <DataTable
          responsive
          hover
          className="org-table mb-0 align-middle"
          columns={[
            {
              key: "designation",
              header: "Designation Code & Title",
              render: (desig) => (
                <>
                  <div className="fw-semibold text-dark">{desig.designationName}</div>
                  <div className="small font-monospace text-muted">{desig.designationCode}</div>
                </>
              ),
            },
            {
              key: "branch",
              header: "Branch",
              render: (desig) =>
                desig.branchId ? (
                  <div className="small">
                    <FaCodeBranch className="text-secondary me-1" />
                    {desig.branchId.branchName || "Branch"}
                  </div>
                ) : (
                  <span className="text-muted small">Global / Org-wide</span>
                ),
            },
            {
              key: "department",
              header: "Department",
              render: (desig) =>
                desig.departmentId ? (
                  <div className="small">
                    <FaSitemap className="text-success me-1" />
                    {desig.departmentId.departmentName}
                  </div>
                ) : (
                  <span className="text-muted small">General / Global</span>
                ),
            },
            {
              key: "grade",
              header: "Job Grade",
              render: (desig) =>
                desig.jobGradeId ? (
                  <Badge bg="light" className="text-dark border">
                    <FaLayerGroup className="me-1 text-primary" />
                    {desig.jobGradeId.gradeName || desig.jobGradeId.gradeCode}
                  </Badge>
                ) : (
                  <span className="text-muted small">-</span>
                ),
            },
            {
              key: "description",
              header: "Description",
              render: (desig) => (
                <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: "220px" }}>
                  {desig.description || "N/A"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (desig) => (
                <Badge bg={desig.status === "ACTIVE" ? "success" : "secondary"}>
                  {desig.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              headerClassName: "text-end",
              cellClassName: "text-end",
              render: (desig) => (
                <>
                  {canUpdate && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary p-1"
                      title="Edit Designation"
                      onClick={() => handleOpenEdit(desig)}
                    >
                      <FaEdit />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-1"
                      title="Delete Designation"
                      onClick={() => {
                        setDeletingId(desig._id);
                        setDeletingName(desig.designationName);
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
          rows={designations}
          rowKey={(desig) => desig._id}
          loading={loading}
          loadingComponent={
            <tr>
              <td colSpan={7} className="text-center py-5 text-muted">
                <Spinner animation="border" size="sm" variant="success" className="me-2" />
                Loading designations...
              </td>
            </tr>
          }
          emptyComponent={
            <EmptyState
              variant="table"
              colSpan={7}
              className="text-center py-5 text-muted"
              bodyClassName="p-3"
              title="No designations found."
              titleAs="p"
              titleClassName="mb-2"
              actionLabel={canCreate ? "Add First Designation" : undefined}
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
      <CrudModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={<><FaUserTag className="text-success" />{editingDesig ? "Edit Designation" : "Add New Designation"}</>}
        onSubmit={handleSubmit}
        saving={modalLoading}
        saveLabel="Save Designation"
        modalError={modalError}
      >
        <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Designation Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.designationName}
                    onChange={(e) => setFormData({ ...formData, designationName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Designation Code <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. SR-SWE"
                    value={formData.designationCode}
                    onChange={(e) => setFormData({ ...formData, designationCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Branch {lockedBranchId && <span className="badge bg-secondary ms-1">Locked</span>}
                  </Form.Label>
                  <Form.Select
                    value={formData.branchId}
                    disabled={Boolean(lockedBranchId)}
                    onChange={(e) => handleFormBranchChange(e.target.value)}
                  >
                    {!lockedBranchId && <option value="">-- All Branches / Global --</option>}
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.branchName} ({b.branchCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department (Filtered by Branch)</Form.Label>
                  <Form.Select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">-- All Departments / Global --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.departmentName} ({d.departmentCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Job Grade (Filtered by Branch)</Form.Label>
                  <Form.Select
                    value={formData.jobGradeId}
                    onChange={(e) => setFormData({ ...formData, jobGradeId: e.target.value })}
                  >
                    <option value="">-- Select Job Grade --</option>
                    {jobGrades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.gradeName} ({g.gradeCode}) - Level {g.level || 1}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Role Responsibilities & Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Key responsibilities and prerequisites for this job title"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
      </CrudModal>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={<><FaTrash /> Delete Designation</>}
        message={<>Are you sure you want to delete designation <strong>{deletingName}</strong>?<p className="text-muted small mt-2">Warning: Employees assigned this designation should be re-assigned to prevent onboarding issues.</p></>}
        onConfirm={handleDelete}
        loading={modalLoading}
      />
    </div>
  );
}

export default DesignationsSection;
