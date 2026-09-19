import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  InputGroup,
  Pagination,
} from "react-bootstrap";
import {
  FaCodeBranch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaClock,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  fetchEmployeesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function BranchesSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [locating, setLocating] = useState(false);

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    branchName: "",
    branchCode: "",
    branchType: "BRANCH_OFFICE",
    branchHeadId: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    latitude: "",
    longitude: "",
    officeRadiusMeters: 200,
    timeZone: "Asia/Kolkata",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("branch.create");
  const canUpdate = isSystemAdmin || hasPermission("branch.update");
  const canDelete = isSystemAdmin || hasPermission("branch.delete");

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        branchType: filterType,
        status: filterStatus,
      };
      const res = await fetchBranches(params);
      if (res.success) {
        setBranches(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    fetchEmployeesDropdown()
      .then((users) => setEmployees(users))
      .catch((e) => console.warn("Failed to load employee dropdown:", e));
  }, []);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData(initialForm);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branchName: branch.branchName || "",
      branchCode: branch.branchCode || "",
      branchType: branch.branchType || "BRANCH_OFFICE",
      branchHeadId: branch.branchHeadId?._id || branch.branchHeadId || "",
      email: branch.email || "",
      phone: branch.phone || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      country: branch.country || "India",
      latitude: branch.latitude !== undefined && branch.latitude !== null ? branch.latitude : "",
      longitude: branch.longitude !== undefined && branch.longitude !== null ? branch.longitude : "",
      officeRadiusMeters: branch.officeRadiusMeters || 200,
      timeZone: branch.timeZone || "Asia/Kolkata",
      workingDays: Array.isArray(branch.workingDays) ? branch.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHoursStart: branch.workingHours?.start || "09:00",
      workingHoursEnd: branch.workingHours?.end || "18:00",
      status: branch.status || "ACTIVE",
    });
    setModalError("");
    setShowModal(true);
  };

  const handleCurrentGPS = () => {
    if (!navigator.geolocation) {
      setModalError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setLocating(false);
      },
      (err) => {
        setModalError("Failed to fetch GPS coordinates: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleDay = (day) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day);
      return {
        ...prev,
        workingDays: exists
          ? prev.workingDays.filter((d) => d !== day)
          : [...prev.workingDays, day],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        branchName: formData.branchName.trim(),
        branchCode: formData.branchCode.trim().toUpperCase(),
        branchType: formData.branchType,
        branchHeadId: formData.branchHeadId || null,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        latitude: formData.latitude !== "" ? Number(formData.latitude) : null,
        longitude: formData.longitude !== "" ? Number(formData.longitude) : null,
        officeRadiusMeters: Number(formData.officeRadiusMeters) || 200,
        timeZone: formData.timeZone,
        workingDays: formData.workingDays,
        workingHours: {
          start: formData.workingHoursStart,
          end: formData.workingHoursEnd,
        },
        status: formData.status,
      };

      if (editingBranch) {
        const res = await updateBranch(editingBranch._id, payload);
        setSuccess(res.message || "Branch updated successfully");
      } else {
        const res = await createBranch(payload);
        setSuccess(res.message || "Branch created successfully");
      }
      setShowModal(false);
      loadBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save branch");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteBranch(deletingId);
      setSuccess(res.message || "Branch deleted successfully");
      setShowDeleteModal(false);
      loadBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete branch");
      setShowDeleteModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div>
          <h3 className="org-section-title">
            <FaCodeBranch className="text-success me-2" /> Branches & Office Hubs
          </h3>
          <p className="org-section-sub">
            Manage headquarters, regional offices, and physical work centers with geofencing.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Branch
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filters & Search ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search by branch name, code, or city..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              >
                <option value="">All Branch Types</option>
                <option value="HEAD_OFFICE">Head Office</option>
                <option value="REGIONAL_OFFICE">Regional Office</option>
                <option value="BRANCH_OFFICE">Branch Office</option>
                <option value="VIRTUAL">Virtual Office</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end text-muted small">
              Total: <strong>{totalRecords}</strong>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Table ── */}
      <Card className="org-table-card">
        <Table responsive hover className="org-table mb-0 align-middle">
          <thead>
            <tr>
              <th>Branch Code & Name</th>
              <th>Type</th>
              <th>Branch Head</th>
              <th>Location & Geofence</th>
              <th>Working Hours</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading branches...
                </td>
              </tr>
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No branches found matching your search.
                </td>
              </tr>
            ) : (
              branches.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="fw-semibold text-dark">{b.branchName}</div>
                    <div className="small font-monospace text-muted">{b.branchCode}</div>
                  </td>
                  <td>
                    <Badge bg="light" className="text-dark border">
                      {b.branchType ? b.branchType.replace("_", " ") : "BRANCH"}
                    </Badge>
                  </td>
                  <td>
                    {b.branchHeadId ? (
                      <div className="d-flex align-items-center gap-1">
                        <FaUserTie className="text-primary small" />
                        <span className="small">{b.branchHeadId.firstName} {b.branchHeadId.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-muted small">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div className="small">
                      <FaMapMarkerAlt className="text-danger me-1" />
                      {b.city ? `${b.city}, ${b.state || b.country}` : b.country || "N/A"}
                    </div>
                    {b.latitude && b.longitude && (
                      <div className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                        GPS: {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)} ({b.officeRadiusMeters || 200}m)
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="small">
                      <FaClock className="text-secondary me-1" />
                      {b.workingHours?.start || "09:00"} - {b.workingHours?.end || "18:00"}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {b.workingDays?.length || 5} days/week
                    </div>
                  </td>
                  <td>
                    <Badge bg={b.status === "ACTIVE" ? "success" : "secondary"}>
                      {b.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Branch"
                        onClick={() => handleOpenEdit(b)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Branch"
                        onClick={() => {
                          setDeletingId(b._id);
                          setDeletingName(b.branchName);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-end p-3 border-top">
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))} />
              {[...Array(totalPages).keys()].map((n) => (
                <Pagination.Item key={n + 1} active={n + 1 === page} onClick={() => setPage(n + 1)}>
                  {n + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))} />
            </Pagination>
          </div>
        )}
      </Card>

      {/* ── Create / Edit Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaCodeBranch className="text-success" />
              {editingBranch ? "Edit Branch" : "Add New Branch"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Bangalore Headquarters"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. BLR-HQ"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Type</Form.Label>
                  <Form.Select
                    value={formData.branchType}
                    onChange={(e) => setFormData({ ...formData, branchType: e.target.value })}
                  >
                    <option value="HEAD_OFFICE">Head Office</option>
                    <option value="REGIONAL_OFFICE">Regional Office</option>
                    <option value="BRANCH_OFFICE">Branch Office</option>
                    <option value="VIRTUAL">Virtual Office</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Head</Form.Label>
                  <Form.Select
                    value={formData.branchHeadId}
                    onChange={(e) => setFormData({ ...formData, branchHeadId: e.target.value })}
                  >
                    <option value="">-- Select Branch Head --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="office@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Contact Phone</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="+91 80 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Physical Street Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {/* Geofencing Coordinates */}
              <Col md={12}>
                <div className="p-3 bg-light rounded border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold text-secondary small">
                      <FaMapMarkerAlt className="text-danger me-1" /> Geofencing Attendance Boundary
                    </span>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      type="button"
                      onClick={handleCurrentGPS}
                      disabled={locating}
                    >
                      <FaCrosshairs className="me-1" />
                      {locating ? "Acquiring GPS..." : "Autofill Current GPS"}
                    </Button>
                  </div>
                  <Row className="g-2">
                    <Col md={4}>
                      <Form.Label className="small text-muted">Latitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        placeholder="12.9716"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small text-muted">Longitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        placeholder="77.5946"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small text-muted">Radius (Meters)</Form.Label>
                      <Form.Control
                        type="number"
                        min="10"
                        placeholder="200"
                        value={formData.officeRadiusMeters}
                        onChange={(e) => setFormData({ ...formData, officeRadiusMeters: e.target.value })}
                      />
                    </Col>
                  </Row>
                </div>
              </Col>

              {/* Working Hours & Schedule */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Working Hours Start</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.workingHoursStart}
                    onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Working Hours End</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.workingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Branch Status</Form.Label>
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
                <Form.Label>Weekly Working Days</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = formData.workingDays.includes(d);
                    return (
                      <Button
                        key={d}
                        size="sm"
                        type="button"
                        variant={isSelected ? "success" : "outline-secondary"}
                        onClick={() => toggleDay(d)}
                      >
                        {isSelected ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                        {d}
                      </Button>
                    );
                  })}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Branch"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Branch
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete branch <strong>{deletingName}</strong>?
          <p className="text-muted small mt-2">
            Warning: Departments, locations, or users linked to this branch must be re-assigned.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={modalLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={modalLoading}>
            {modalLoading ? <Spinner size="sm" animation="border" /> : "Yes, Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default BranchesSection;
