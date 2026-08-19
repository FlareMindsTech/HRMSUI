import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
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
} from "react-bootstrap";
import {
  FaPlus,
  FaSearch,
  FaRedo,
  FaLaptop,
  FaDesktop,
  FaMobileAlt,
  FaTv,
  FaKeyboard,
  FaCar,
  FaBox,
  FaExchangeAlt,
  FaUndoAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt,
  FaBarcode,
  FaUser,
} from "react-icons/fa";
import { MdDevices } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import {
  getAssets,
  createAsset,
  assignAsset,
  returnAsset,
} from "../../services/assetService";
import { fetchAllUsers } from "../../services/rbacService";

// Helper for category badge icons
const getCategoryIcon = (category) => {
  switch (category) {
    case "LAPTOP":
      return <FaLaptop className="me-1" />;
    case "DESKTOP":
      return <FaDesktop className="me-1" />;
    case "MOBILE":
      return <FaMobileAlt className="me-1" />;
    case "MONITOR":
      return <FaTv className="me-1" />;
    case "PERIPHERAL":
      return <FaKeyboard className="me-1" />;
    case "VEHICLE":
      return <FaCar className="me-1" />;
    default:
      return <FaBox className="me-1" />;
  }
};

// Helper for status badge styling
const getStatusBadge = (status) => {
  switch (status) {
    case "AVAILABLE":
      return (
        <Badge
          bg="success"
          className="px-2 py-1"
          style={{ backgroundColor: "#10b981", fontSize: "0.75rem" }}
        >
          ● Available
        </Badge>
      );
    case "ASSIGNED":
      return (
        <Badge
          bg="primary"
          className="px-2 py-1"
          style={{ backgroundColor: "#3b82f6", fontSize: "0.75rem" }}
        >
          ● Assigned
        </Badge>
      );
    case "DAMAGED":
      return (
        <Badge
          bg="danger"
          className="px-2 py-1"
          style={{ backgroundColor: "#ef4444", fontSize: "0.75rem" }}
        >
          ● Damaged
        </Badge>
      );
    case "UNDER_REPAIR":
      return (
        <Badge
          bg="warning"
          className="px-2 py-1 text-dark"
          style={{ backgroundColor: "#f59e0b", fontSize: "0.75rem" }}
        >
          ● Under Repair
        </Badge>
      );
    case "RETIRED":
      return (
        <Badge
          bg="secondary"
          className="px-2 py-1"
          style={{ backgroundColor: "#64748b", fontSize: "0.75rem" }}
        >
          ● Retired
        </Badge>
      );
    default:
      return <Badge bg="secondary">{status || "Unknown"}</Badge>;
  }
};

function AssetManagement() {
  const { hasMenu, hasPermission, loading: authLoading } = useAuth();

  // ── Inventory & Filter State ──
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ totalPages: 1, totalRecords: 0 });

  // ── Employee List State for Assign Modal ──
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // ── Create Modal State ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    category: "LAPTOP",
    serialNumber: "",
    modelName: "",
    manufacturer: "",
    purchaseDate: "",
    warrantyExpiryDate: "",
  });
  const [createError, setCreateError] = useState(null);

  // ── Assign Modal State ──
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [selectedAssetForAssign, setSelectedAssetForAssign] = useState(null);
  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    conditionOnAssign: "NEW",
    remarks: "",
  });
  const [assignError, setAssignError] = useState(null);

  // ── Return Modal State ──
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [selectedAssetForReturn, setSelectedAssetForReturn] = useState(null);
  const [returnForm, setReturnForm] = useState({
    conditionOnReturn: "GOOD",
    remarks: "",
  });
  const [returnError, setReturnError] = useState(null);

  // Auto-dismiss feedback notifications
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ── Fetch Assets ──
  const loadAssets = useCallback(async (page = 1) => {
    if (!hasPermission("asset.read")) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
      };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await getAssets(params);
      if (res && res.data) {
        setAssets(res.data);
        if (res.pagination) {
          setPaginationInfo({
            totalPages: res.pagination.totalPages || 1,
            totalRecords: res.pagination.totalRecords || res.data.length,
          });
        }
      } else {
        setAssets([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load assets from server.");
    } finally {
      setLoading(false);
    }
  }, [hasPermission, statusFilter, categoryFilter]);

  // Initial and reactive load
  useEffect(() => {
    if (!authLoading && hasMenu("ASSETS")) {
      loadAssets(currentPage);
    }
  }, [authLoading, hasMenu, loadAssets, currentPage]);

  // ── Fetch Employee Directory for Assign Modal ──
  const loadEmployees = useCallback(async () => {
    if (employees.length > 0) return;
    setLoadingEmployees(true);
    try {
      const usersData = await fetchAllUsers();
      if (Array.isArray(usersData)) {
        setEmployees(usersData);
      } else if (usersData && Array.isArray(usersData.users)) {
        setEmployees(usersData.users);
      }
    } catch (err) {
      console.warn("Could not load employee directory for assignment:", err.message);
    } finally {
      setLoadingEmployees(false);
    }
  }, [employees.length]);

  // ── Client-side Search Filtering ──
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase().trim();
    return assets.filter((asset) => {
      const assetCode = asset.assetCode?.toLowerCase() || "";
      const name = asset.name?.toLowerCase() || "";
      const serial = asset.serialNumber?.toLowerCase() || "";
      const model = asset.modelName?.toLowerCase() || "";
      const manufacturer = asset.manufacturer?.toLowerCase() || "";
      const assigneeName = asset.currentAssignee
        ? `${asset.currentAssignee.firstName || ""} ${asset.currentAssignee.lastName || ""}`.toLowerCase()
        : "";
      const assigneeCode = asset.currentAssignee?.employeeCode?.toLowerCase() || "";

      return (
        assetCode.includes(q) ||
        name.includes(q) ||
        serial.includes(q) ||
        model.includes(q) ||
        manufacturer.includes(q) ||
        assigneeName.includes(q) ||
        assigneeCode.includes(q)
      );
    });
  }, [assets, searchQuery]);

  // ── Calculated Inventory Counts (from current inventory state) ──
  const counts = useMemo(() => {
    const total = paginationInfo.totalRecords || assets.length;
    const available = assets.filter((a) => a.status === "AVAILABLE").length;
    const assigned = assets.filter((a) => a.status === "ASSIGNED").length;
    const damaged = assets.filter((a) => a.status === "DAMAGED").length;
    return { total, available, assigned, damaged };
  }, [assets, paginationInfo.totalRecords]);

  // ── Handle Create Asset ──
  const handleOpenCreateModal = () => {
    setCreateForm({
      name: "",
      category: "LAPTOP",
      serialNumber: "",
      modelName: "",
      manufacturer: "",
      purchaseDate: "",
      warrantyExpiryDate: "",
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.category || !createForm.serialNumber) {
      setCreateError("Name, Category, and Serial Number are required fields.");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const payload = {
        name: createForm.name.trim(),
        category: createForm.category,
        serialNumber: createForm.serialNumber.trim(),
        modelName: createForm.modelName.trim(),
        manufacturer: createForm.manufacturer.trim(),
        purchaseDate: createForm.purchaseDate || null,
        warrantyExpiryDate: createForm.warrantyExpiryDate || null,
      };

      const res = await createAsset(payload);
      setShowCreateModal(false);
      setSuccessMessage(
        `Asset '${res.data?.assetCode || createForm.name}' created successfully.`
      );
      loadAssets(currentPage);
    } catch (err) {
      setCreateError(err.message || "Failed to create asset.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ── Handle Assign Asset ──
  const handleOpenAssignModal = (asset) => {
    setSelectedAssetForAssign(asset);
    setAssignForm({
      employeeId: "",
      conditionOnAssign: "NEW",
      remarks: "",
    });
    setAssignError(null);
    setShowAssignModal(true);
    loadEmployees();
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetForAssign || !assignForm.employeeId) {
      setAssignError("Please select an employee to allocate this asset.");
      return;
    }

    setAssignSubmitting(true);
    setAssignError(null);
    try {
      await assignAsset({
        assetId: selectedAssetForAssign._id,
        employeeId: assignForm.employeeId,
        conditionOnAssign: assignForm.conditionOnAssign,
        remarks: assignForm.remarks.trim(),
      });

      setShowAssignModal(false);
      setSuccessMessage(
        `Asset ${selectedAssetForAssign.assetCode} assigned successfully.`
      );
      loadAssets(currentPage);
    } catch (err) {
      setAssignError(err.message || "Failed to assign asset.");
    } finally {
      setAssignSubmitting(false);
    }
  };

  // ── Handle Return Asset ──
  const handleOpenReturnModal = (asset) => {
    setSelectedAssetForReturn(asset);
    setReturnForm({
      conditionOnReturn: "GOOD",
      remarks: "",
    });
    setReturnError(null);
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetForReturn) return;

    setReturnSubmitting(true);
    setReturnError(null);
    try {
      await returnAsset(selectedAssetForReturn._id, {
        conditionOnReturn: returnForm.conditionOnReturn,
        remarks: returnForm.remarks.trim(),
      });

      setShowReturnModal(false);
      setSuccessMessage(
        `Asset ${selectedAssetForReturn.assetCode} returned to inventory successfully.`
      );
      loadAssets(currentPage);
    } catch (err) {
      setReturnError(err.message || "Failed to return asset.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  // ── Access Checks & Guard ──
  if (authLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-2 text-muted">Loading access context...</p>
      </Container>
    );
  }

  // Page Access Guard
  if (!hasMenu("ASSETS")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container fluid className="py-3 px-3 px-md-4">
      {/* ── 1. Page Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(45,197,138,0.2) 0%, rgba(32,166,115,0.3) 100%)",
              border: "1px solid rgba(45, 197, 138, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdDevices style={{ fontSize: 26, color: "#2DC58A" }} />
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: "#1e293b" }}>
              Asset Management
            </h4>
            <small className="text-muted">
              Manage company asset inventory, hardware allocations, and lifecycle returns
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="light"
            className="border d-flex align-items-center gap-2 shadow-sm rounded-3 px-3 py-2"
            onClick={() => loadAssets(currentPage)}
            disabled={loading}
            title="Refresh Inventory"
          >
            <FaRedo className={loading ? "fa-spin" : ""} style={{ fontSize: 13 }} />
            <span className="d-none d-sm-inline">Refresh</span>
          </Button>

          {/* Add Asset Action: Permission Guarded */}
          {hasPermission("asset.create") && (
            <Button
              className="d-flex align-items-center gap-2 shadow-sm rounded-3 px-3 py-2 fw-semibold"
              style={{
                backgroundColor: "#2DC58A",
                borderColor: "#2DC58A",
                color: "#ffffff",
              }}
              onClick={handleOpenCreateModal}
            >
              <FaPlus style={{ fontSize: 13 }} />
              <span>Add Asset</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Alerts & Feedback ── */}
      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage(null)}
          className="d-flex align-items-center gap-2 shadow-sm border-0 rounded-3"
          style={{ backgroundColor: "rgba(45, 197, 138, 0.15)", color: "#065f46" }}
        >
          <FaCheckCircle className="flex-shrink-0" />
          <div>{successMessage}</div>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="d-flex align-items-center gap-2 shadow-sm border-0 rounded-3"
        >
          <FaExclamationTriangle className="flex-shrink-0" />
          <div>{error}</div>
        </Alert>
      )}

      {/* ── 2. Summary KPI Cards ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-medium">Total Assets</span>
                <h3 className="mb-0 fw-bold mt-1" style={{ color: "#1e293b" }}>
                  {counts.total}
                </h3>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MdDevices style={{ fontSize: 22, color: "#3b82f6" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-medium">Available</span>
                <h3 className="mb-0 fw-bold mt-1" style={{ color: "#10b981" }}>
                  {counts.available}
                </h3>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaCheckCircle style={{ fontSize: 20, color: "#10b981" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-medium">Assigned</span>
                <h3 className="mb-0 fw-bold mt-1" style={{ color: "#3b82f6" }}>
                  {counts.assigned}
                </h3>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaUser style={{ fontSize: 18, color: "#3b82f6" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 p-3" style={{ background: "#ffffff" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-medium">Damaged</span>
                <h3 className="mb-0 fw-bold mt-1" style={{ color: "#ef4444" }}>
                  {counts.damaged}
                </h3>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaExclamationTriangle style={{ fontSize: 18, color: "#ef4444" }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── 3. Filters & Search Control Bar ── */}
      <Card className="border-0 shadow-sm rounded-4 mb-4 p-3" style={{ background: "#ffffff" }}>
        <Row className="g-2 align-items-center">
          <Col xs={12} md={5}>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0 text-muted rounded-start-3">
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by code, name, serial, assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-start-0 shadow-none rounded-end-3"
              />
            </InputGroup>
          </Col>

          <Col xs={6} md={3}>
            <Form.Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-3 shadow-none border"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="DAMAGED">Damaged</option>
              <option value="UNDER_REPAIR">Under Repair</option>
              <option value="RETIRED">Retired</option>
            </Form.Select>
          </Col>

          <Col xs={6} md={3}>
            <Form.Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-3 shadow-none border"
            >
              <option value="">All Categories</option>
              <option value="LAPTOP">Laptop</option>
              <option value="DESKTOP">Desktop</option>
              <option value="MOBILE">Mobile</option>
              <option value="MONITOR">Monitor</option>
              <option value="PERIPHERAL">Peripheral</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="OTHER">Other</option>
            </Form.Select>
          </Col>

          <Col xs={12} md={1} className="text-md-end">
            {(searchQuery || statusFilter || categoryFilter) && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100 rounded-3 py-2"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setCategoryFilter("");
                  setCurrentPage(1);
                }}
                title="Clear Filters"
              >
                Clear
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* ── 4. Main Inventory Table ── */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: "#ffffff" }}>
        {!hasPermission("asset.read") ? (
          <div className="p-5 text-center text-muted">
            <FaInfoCircle className="mb-2 text-warning" style={{ fontSize: 32 }} />
            <h5>Read Access Restricted</h5>
            <p className="mb-0">You do not have permission ('asset.read') to view the asset catalog.</p>
          </div>
        ) : loading ? (
          <div className="p-5 text-center">
            <Spinner animation="border" variant="success" />
            <p className="mt-2 text-muted mb-0">Loading company assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <div
              className="mx-auto mb-3"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(100, 116, 139, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdDevices style={{ fontSize: 30, color: "#64748b" }} />
            </div>
            {searchQuery || statusFilter || categoryFilter ? (
              <>
                <h6 className="fw-bold mb-1">No Matching Assets Found</h6>
                <p className="small mb-0">Try adjusting or clearing your search and filter criteria.</p>
              </>
            ) : (
              <>
                <h6 className="fw-bold mb-1">No Assets in Inventory</h6>
                <p className="small mb-3">Get started by registering company hardware and equipment.</p>
                {hasPermission("asset.create") && (
                  <Button
                    size="sm"
                    className="fw-semibold px-3 py-2 rounded-3"
                    style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
                    onClick={handleOpenCreateModal}
                  >
                    <FaPlus className="me-1" /> Add First Asset
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover className="align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead style={{ backgroundColor: "#f8fafc", color: "#64748b" }}>
                  <tr>
                    <th className="py-3 px-3">Asset Code</th>
                    <th className="py-3 px-3">Asset Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Serial Number</th>
                    <th className="py-3 px-3">Model / Manufacturer</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Current Assignee</th>
                    <th className="py-3 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset._id}>
                      {/* Asset Code */}
                      <td className="px-3 py-3">
                        <span
                          className="badge bg-light text-dark border fw-bold px-2 py-1"
                          style={{ letterSpacing: "0.5px" }}
                        >
                          {asset.assetCode}
                        </span>
                      </td>

                      {/* Asset Name */}
                      <td className="px-3 py-3">
                        <div className="fw-bold text-dark">{asset.name}</div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3">
                        <span className="text-secondary d-flex align-items-center">
                          {getCategoryIcon(asset.category)}
                          {asset.category}
                        </span>
                      </td>

                      {/* Serial Number */}
                      <td className="px-3 py-3">
                        <span
                          className="font-monospace text-muted small"
                          style={{ letterSpacing: "0.5px" }}
                        >
                          {asset.serialNumber}
                        </span>
                      </td>

                      {/* Model / Manufacturer */}
                      <td className="px-3 py-3">
                        <div className="text-dark">{asset.modelName || "—"}</div>
                        {asset.manufacturer && (
                          <small className="text-muted">{asset.manufacturer}</small>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">{getStatusBadge(asset.status)}</td>

                      {/* Current Assignee */}
                      <td className="px-3 py-3">
                        {asset.currentAssignee ? (
                          <div>
                            <div className="fw-medium text-dark">
                              {asset.currentAssignee.firstName} {asset.currentAssignee.lastName}
                            </div>
                            <small className="text-muted">
                              {asset.currentAssignee.employeeCode || asset.currentAssignee.email}
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted small">Unassigned</span>
                        )}
                      </td>

                      {/* Actions: Permission Guarded */}
                      <td className="px-3 py-3 text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {/* Assign Action */}
                          {hasPermission("asset.assign") && asset.status === "AVAILABLE" && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="d-flex align-items-center gap-1 rounded-2 px-2 py-1"
                              onClick={() => handleOpenAssignModal(asset)}
                              title="Assign asset to employee"
                            >
                              <FaExchangeAlt style={{ fontSize: 11 }} />
                              <span>Assign</span>
                            </Button>
                          )}

                          {/* Return Action */}
                          {hasPermission("asset.return") && asset.status === "ASSIGNED" && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="d-flex align-items-center gap-1 rounded-2 px-2 py-1"
                              onClick={() => handleOpenReturnModal(asset)}
                              title="Return asset to inventory"
                            >
                              <FaUndoAlt style={{ fontSize: 11 }} />
                              <span>Return</span>
                            </Button>
                          )}

                          {/* Fallback for read-only view or terminal statuses */}
                          {(!hasPermission("asset.assign") && !hasPermission("asset.return")) ||
                          (asset.status !== "AVAILABLE" && asset.status !== "ASSIGNED") ? (
                            <span className="text-muted small px-2">—</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {paginationInfo.totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <small className="text-muted">
                  Page {currentPage} of {paginationInfo.totalPages} ({paginationInfo.totalRecords} total assets)
                </small>
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  />
                  {[...Array(paginationInfo.totalPages).keys()].map((n) => (
                    <Pagination.Item
                      key={n + 1}
                      active={n + 1 === currentPage}
                      onClick={() => setCurrentPage(n + 1)}
                    >
                      {n + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage === paginationInfo.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── CREATE ASSET MODAL ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <Modal
        show={showCreateModal}
        onHide={() => !createSubmitting && setShowCreateModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton={!createSubmitting} className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5">
            <FaPlus className="me-2 text-success" /> Add New Asset
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="pt-3">
            {createError && (
              <Alert variant="danger" className="py-2 small">
                {createError}
              </Alert>
            )}

            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">
                    Asset Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. MacBook Pro 16, Dell UltraSharp 27"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    required
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="DESKTOP">Desktop</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="PERIPHERAL">Peripheral</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">
                    Serial Number <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. C02G789HKL"
                    value={createForm.serialNumber}
                    onChange={(e) => setCreateForm({ ...createForm, serialNumber: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Manufacturer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Apple, Dell, Lenovo"
                    value={createForm.manufacturer}
                    onChange={(e) => setCreateForm({ ...createForm, manufacturer: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Model Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. M3 Max, Latitude 5420"
                    value={createForm.modelName}
                    onChange={(e) => setCreateForm({ ...createForm, modelName: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Purchase Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={createForm.purchaseDate}
                    onChange={(e) => setCreateForm({ ...createForm, purchaseDate: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Warranty Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={createForm.warrantyExpiryDate}
                    onChange={(e) => setCreateForm({ ...createForm, warrantyExpiryDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3 p-2 bg-light rounded text-muted small">
              <FaInfoCircle className="me-1 text-primary" />
              Asset code (e.g. AST0001) and initial status (AVAILABLE) will be automatically generated by the backend.
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={() => setShowCreateModal(false)}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSubmitting}
              style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
            >
              {createSubmitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Creating...
                </>
              ) : (
                "Save Asset"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── ASSIGN ASSET MODAL ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <Modal
        show={showAssignModal}
        onHide={() => !assignSubmitting && setShowAssignModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton={!assignSubmitting} className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5">
            <FaExchangeAlt className="me-2 text-primary" /> Assign Asset to Employee
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAssignSubmit}>
          <Modal.Body className="pt-3">
            {assignError && (
              <Alert variant="danger" className="py-2 small">
                {assignError}
              </Alert>
            )}

            {selectedAssetForAssign && (
              <Card className="bg-light border-0 p-3 mb-3 rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark">{selectedAssetForAssign.name}</span>
                  <Badge bg="light" className="text-dark border">
                    {selectedAssetForAssign.assetCode}
                  </Badge>
                </div>
                <small className="text-muted">
                  Serial: <span className="font-monospace">{selectedAssetForAssign.serialNumber}</span> | Category: {selectedAssetForAssign.category}
                </small>
              </Card>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">
                Select Employee <span className="text-danger">*</span>
              </Form.Label>
              {loadingEmployees ? (
                <div className="py-2 text-muted small">
                  <Spinner size="sm" animation="border" className="me-1" /> Loading employee directory...
                </div>
              ) : (
                <Form.Select
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : `(${emp.email})`}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Condition on Assignment</Form.Label>
              <Form.Select
                value={assignForm.conditionOnAssign}
                onChange={(e) => setAssignForm({ ...assignForm, conditionOnAssign: e.target.value })}
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="DAMAGED">Damaged</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Remarks / Allocation Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g. Primary workstation allocation for developer"
                value={assignForm.remarks}
                onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={() => setShowAssignModal(false)}
              disabled={assignSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={assignSubmitting || !assignForm.employeeId}
            >
              {assignSubmitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Assigning...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── RETURN ASSET MODAL ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <Modal
        show={showReturnModal}
        onHide={() => !returnSubmitting && setShowReturnModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton={!returnSubmitting} className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5">
            <FaUndoAlt className="me-2 text-success" /> Return Asset to Inventory
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReturnSubmit}>
          <Modal.Body className="pt-3">
            {returnError && (
              <Alert variant="danger" className="py-2 small">
                {returnError}
              </Alert>
            )}

            {selectedAssetForReturn && (
              <Card className="bg-light border-0 p-3 mb-3 rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark">{selectedAssetForReturn.name}</span>
                  <Badge bg="light" className="text-dark border">
                    {selectedAssetForReturn.assetCode}
                  </Badge>
                </div>
                <div className="small text-muted mb-1">
                  Assigned To:{" "}
                  <strong>
                    {selectedAssetForReturn.currentAssignee?.firstName}{" "}
                    {selectedAssetForReturn.currentAssignee?.lastName}
                  </strong>{" "}
                  ({selectedAssetForReturn.currentAssignee?.employeeCode || selectedAssetForReturn.currentAssignee?.email})
                </div>
                <small className="text-muted">
                  Serial: <span className="font-monospace">{selectedAssetForReturn.serialNumber}</span>
                </small>
              </Card>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Condition on Return</Form.Label>
              <Form.Select
                value={returnForm.conditionOnReturn}
                onChange={(e) => setReturnForm({ ...returnForm, conditionOnReturn: e.target.value })}
              >
                <option value="GOOD">Good (Asset becomes Available)</option>
                <option value="DAMAGED">Damaged (Asset marked Damaged)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Inspection & Return Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g. Device returned in clean working order, wiped clean"
                value={returnForm.remarks}
                onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={() => setShowReturnModal(false)}
              disabled={returnSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={returnSubmitting}
            >
              {returnSubmitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Returning...
                </>
              ) : (
                "Process Return"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default AssetManagement;
