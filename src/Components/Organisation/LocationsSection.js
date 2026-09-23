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
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCrosshairs,
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  fetchBranchesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function LocationsSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [locations, setLocations] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [locating, setLocating] = useState(false);

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    locationName: "",
    locationCode: "",
    locationType: "OFFICE",
    branchId: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    latitude: "",
    longitude: "",
    radiusMeters: 200,
    timeZone: "Asia/Kolkata",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("location.create");
  const canUpdate = isSystemAdmin || hasPermission("location.update");
  const canDelete = isSystemAdmin || hasPermission("location.delete");

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        locationType: filterType,
        branchId: filterBranch,
        status: filterStatus,
      };
      const res = await fetchLocations(params);
      if (res.success) {
        setLocations(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterBranch, filterStatus]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    fetchBranchesDropdown()
      .then((brList) => setBranches(brList))
      .catch((e) => console.warn("Failed to load branch dropdown:", e));
  }, []);

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setFormData(initialForm);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setFormData({
      locationName: loc.locationName || "",
      locationCode: loc.locationCode || "",
      locationType: loc.locationType || "OFFICE",
      branchId: loc.branchId?._id || loc.branchId || "",
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      pincode: loc.pincode || "",
      country: loc.country || "India",
      latitude: loc.latitude !== undefined && loc.latitude !== null ? loc.latitude : "",
      longitude: loc.longitude !== undefined && loc.longitude !== null ? loc.longitude : "",
      radiusMeters: loc.radiusMeters || 200,
      timeZone: loc.timeZone || "Asia/Kolkata",
      status: loc.status || "ACTIVE",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      if (formData.latitude === "" || formData.longitude === "") {
        setModalError("Latitude and Longitude are required for geofenced attendance locations");
        setModalLoading(false);
        return;
      }

      const payload = {
        locationName: formData.locationName.trim(),
        locationCode: formData.locationCode.trim().toUpperCase(),
        locationType: formData.locationType,
        branchId: formData.branchId || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        radiusMeters: Number(formData.radiusMeters) || 200,
        timeZone: formData.timeZone,
        status: formData.status,
      };

      if (editingLocation) {
        const res = await updateLocation(editingLocation._id, payload);
        setSuccess(res.message || "Location updated successfully");
      } else {
        const res = await createLocation(payload);
        setSuccess(res.message || "Location created successfully");
      }
      setShowModal(false);
      loadLocations();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save location");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteLocation(deletingId);
      setSuccess(res.message || "Location deleted successfully");
      setShowDeleteModal(false);
      loadLocations();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete location");
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
            <FaMapMarkerAlt className="text-danger me-2" /> Geofenced Locations & Sites
          </h3>
          <p className="org-section-sub">
            Configure physical office sites, client locations, and work radii for geofenced mobile & desktop attendance punch.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Location
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filters & Search ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search location name, code, or city..."
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
                <option value="">All Location Types</option>
                <option value="OFFICE">Office</option>
                <option value="CLIENT_SITE">Client Site</option>
                <option value="PROJECT_SITE">Project Site</option>
                <option value="WAREHOUSE">Warehouse</option>
                <option value="FACTORY">Factory</option>
                <option value="REMOTE">Remote Work Hub</option>
                <option value="OTHER">Other</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                size="sm"
                value={filterBranch}
                onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.branchName}</option>
                ))}
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
            <Col md={1} className="text-end text-muted small">
              <strong>{totalRecords}</strong>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Table ── */}
      <Card className="org-table-card">
        <Table responsive hover className="org-table mb-0 align-middle">
          <thead>
            <tr>
              <th>Location Code & Name</th>
              <th>Type</th>
              <th>Branch</th>
              <th>City / Address</th>
              <th>GPS & Geofence Radius</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading locations...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No geofenced locations found.
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc._id}>
                  <td>
                    <div className="fw-semibold text-dark">{loc.locationName}</div>
                    <div className="small font-monospace text-muted">{loc.locationCode}</div>
                  </td>
                  <td>
                    <Badge bg="light" className="text-dark border">
                      {loc.locationType ? loc.locationType.replace("_", " ") : "OFFICE"}
                    </Badge>
                  </td>
                  <td>
                    {loc.branchId ? (
                      <div className="small">
                        <FaCodeBranch className="text-secondary me-1" />
                        {loc.branchId.branchName}
                      </div>
                    ) : (
                      <span className="text-muted small">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div className="small">
                      {typeof loc.city === 'string' ? loc.city : (loc.address?.city || "")}
                      {(loc.city || loc.address?.city) ? ", " : ""}
                      {typeof loc.state === 'string' ? loc.state : (typeof loc.country === 'string' ? loc.country : (loc.address?.country || loc.address?.state || ""))}
                    </div>
                    <div className="text-muted text-truncate small" style={{ maxWidth: "200px" }}>
                      {typeof loc.address === 'string' ? loc.address : (loc.address?.street || "-")}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1 font-monospace small">
                      <FaMapMarkerAlt className="text-danger" />
                      <span>{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</span>
                    </div>
                    <Badge bg="info" className="text-dark border mt-1 font-monospace" style={{ fontSize: "0.7rem" }}>
                      Radius: {loc.radiusMeters || 200}m
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={loc.status === "ACTIVE" ? "success" : "secondary"}>
                      {loc.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Location"
                        onClick={() => handleOpenEdit(loc)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Location"
                        onClick={() => {
                          setDeletingId(loc._id);
                          setDeletingName(loc.locationName);
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
              <FaMapMarkerAlt className="text-danger" />
              {editingLocation ? "Edit Geofenced Location" : "Add Geofenced Location"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Bangalore Tech Park Building A"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. BLR-TP-BLDA"
                    value={formData.locationCode}
                    onChange={(e) => setFormData({ ...formData, locationCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location Type</Form.Label>
                  <Form.Select
                    value={formData.locationType}
                    onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  >
                    <option value="OFFICE">Office Campus</option>
                    <option value="CLIENT_SITE">Client Office / Site</option>
                    <option value="PROJECT_SITE">Project Field Site</option>
                    <option value="WAREHOUSE">Warehouse / Logistics</option>
                    <option value="FACTORY">Manufacturing Unit</option>
                    <option value="REMOTE">Remote Hub</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Associated Branch</Form.Label>
                  <Form.Select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  >
                    <option value="">-- None / Standalone Site --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.branchName} ({b.branchCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Geofencing Coordinates */}
              <Col md={12}>
                <div className="p-3 bg-light rounded border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold text-secondary small">
                      <FaMapMarkerAlt className="text-danger me-1" /> GPS Coordinates & Geofencing Perimeter
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
                      <Form.Label className="small text-muted">Latitude <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 12.9716"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small text-muted">Longitude <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 77.5946"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small text-muted">Radius (Meters)</Form.Label>
                      <Form.Control
                        type="number"
                        min="10"
                        placeholder="e.g. 200"
                        value={formData.radiusMeters}
                        onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
                      />
                    </Col>
                  </Row>
                </div>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="e.g. Campus 2A, Sarjapur-Marathahalli Ring Road"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    placeholder="e.g. 560103"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Timezone</Form.Label>
                  <Form.Select
                    value={formData.timeZone}
                    onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
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
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Location"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Location
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete geofenced location <strong>{deletingName}</strong>?
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

export default LocationsSection;
