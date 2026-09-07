import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
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
import "./AssetManagement.css";

// Helper for category badge icons
const getCategoryIcon = (category) => {
  switch (category) {
    case "LAPTOP":
      return <FaLaptop className="text-primary" />;
    case "DESKTOP":
      return <FaDesktop className="text-primary" />;
    case "MOBILE":
      return <FaMobileAlt className="text-success" />;
    case "MONITOR":
      return <FaTv className="text-info" />;
    case "PERIPHERAL":
      return <FaKeyboard className="text-secondary" />;
    case "VEHICLE":
      return <FaCar className="text-warning" />;
    default:
      return <FaBox className="text-muted" />;
  }
};

// Helper for status badge styling
const getStatusBadge = (status) => {
  switch (status) {
    case "AVAILABLE":
      return (
        <span className="asset-status-pill asset-status-pill--available">
          ● Available
        </span>
      );
    case "ASSIGNED":
      return (
        <span className="asset-status-pill asset-status-pill--assigned">
          ● Assigned
        </span>
      );
    case "DAMAGED":
      return (
        <span className="asset-status-pill asset-status-pill--damaged">
          ● Damaged
        </span>
      );
    case "UNDER_REPAIR":
      return (
        <span className="asset-status-pill asset-status-pill--under-repair">
          ● Under Repair
        </span>
      );
    case "RETIRED":
      return (
        <span className="asset-status-pill asset-status-pill--retired">
          ● Retired
        </span>
      );
    default:
      return (
        <span className="asset-status-pill bg-light text-secondary border">
          {status || "Unknown"}
        </span>
      );
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
    <Container fluid className="p-3 p-md-4 no-scrollbar" style={{ minHeight: "calc(100vh - var(--header-height))" }}>
      {/* ── 1. Page Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 shadow-xs"
            style={{
              width: 44,
              height: 44,
              background: "linear-gradient(135deg, rgba(45,197,138,0.18) 0%, rgba(32,166,115,0.25) 100%)",
              color: "#2DC58A",
              border: "1px solid rgba(45, 197, 138, 0.35)",
            }}
          >
            <MdDevices style={{ fontSize: 24 }} />
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: "var(--text-primary, #1a2e2a)", letterSpacing: "-0.3px" }}>
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
            className="border d-flex align-items-center gap-2 shadow-xs rounded-pill px-3 py-2 small fw-semibold bg-white"
            onClick={() => loadAssets(currentPage)}
            disabled={loading}
            title="Refresh Inventory"
          >
            <FaRedo className={loading ? "fa-spin" : ""} style={{ fontSize: 12 }} />
            <span className="d-none d-sm-inline">Refresh</span>
          </Button>

          {/* Add Asset Action: Permission Guarded */}
          {hasPermission("asset.create") && (
            <Button
              className="btn-add-asset d-flex align-items-center gap-2 rounded-pill px-4 py-2 small fw-semibold"
              onClick={handleOpenCreateModal}
            >
              <FaPlus style={{ fontSize: 12 }} />
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
          className="d-flex align-items-center gap-2 shadow-xs border-0 rounded-3 mb-3 py-2 px-3 small"
          style={{ backgroundColor: "rgba(45, 197, 138, 0.12)", color: "#065f46" }}
        >
          <FaCheckCircle className="flex-shrink-0 text-success" />
          <div>{successMessage}</div>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="d-flex align-items-center gap-2 shadow-xs border-0 rounded-3 mb-3 py-2 px-3 small"
        >
          <FaExclamationTriangle className="flex-shrink-0" />
          <div>{error}</div>
        </Alert>
      )}

      {/* ── 2. Summary KPI Cards ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <div className="asset-kpi-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="asset-kpi-label">Total Assets</span>
                <div className="asset-kpi-value">{counts.total}</div>
              </div>
              <div className="asset-kpi-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
                <MdDevices />
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="asset-kpi-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="asset-kpi-label">Available</span>
                <div className="asset-kpi-value" style={{ color: "#10b981" }}>{counts.available}</div>
              </div>
              <div className="asset-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                <FaCheckCircle />
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="asset-kpi-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="asset-kpi-label">Assigned</span>
                <div className="asset-kpi-value" style={{ color: "#3b82f6" }}>{counts.assigned}</div>
              </div>
              <div className="asset-kpi-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
                <FaUser />
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="asset-kpi-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="asset-kpi-label">Damaged</span>
                <div className="asset-kpi-value" style={{ color: "#ef4444" }}>{counts.damaged}</div>
              </div>
              <div className="asset-kpi-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
                <FaExclamationTriangle />
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── 3. Filters & Search Control Bar ── */}
      <div className="asset-filter-bar mb-4 p-3">
        <Row className="g-2 align-items-center">
          <Col xs={12} md={5}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-white border-end-0 text-muted rounded-start-3">
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by code, name, serial, model, assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-start-0 shadow-none rounded-end-3"
              />
            </InputGroup>
          </Col>

          <Col xs={6} md={3}>
            <Form.Select
              size="sm"
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
              size="sm"
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
                className="w-100 rounded-3 py-1 extra-small"
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
      </div>

      {/* ── 4. Main Inventory Table ── */}
      <div className="asset-table-card">
        {!hasPermission("asset.read") ? (
          <div className="p-5 text-center text-muted">
            <FaInfoCircle className="mb-2 text-warning" style={{ fontSize: 32 }} />
            <h6 className="fw-bold text-dark mb-1">Read Access Restricted</h6>
            <p className="small mb-0">You do not have permission ('asset.read') to view the asset catalog.</p>
          </div>
        ) : loading ? (
          <div className="p-5 text-center">
            <Spinner animation="border" variant="success" size="sm" className="me-2" />
            <span className="text-muted small">Loading company assets...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <div
              className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 58,
                height: 58,
                background: "rgba(100, 116, 139, 0.08)",
                color: "#64748b"
              }}
            >
              <MdDevices style={{ fontSize: 28 }} />
            </div>
            {searchQuery || statusFilter || categoryFilter ? (
              <>
                <h6 className="fw-bold text-dark mb-1">No Matching Assets Found</h6>
                <p className="small mb-0">Try adjusting or clearing your search and filter criteria.</p>
              </>
            ) : (
              <>
                <h6 className="fw-bold text-dark mb-1">No Assets in Inventory</h6>
                <p className="small mb-3">Get started by registering company hardware and equipment.</p>
                {hasPermission("asset.create") && (
                  <Button
                    size="sm"
                    className="btn-add-asset fw-semibold px-3 py-2 rounded-pill shadow-xs"
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
              <Table hover className="asset-table align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                <thead>
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
                          className="badge bg-light text-dark border fw-bold px-2 py-1 font-monospace"
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
                        <span className="asset-category-tag">
                          {getCategoryIcon(asset.category)}
                          <span>{asset.category}</span>
                        </span>
                      </td>

                      {/* Serial Number */}
                      <td className="px-3 py-3">
                        <span className="font-monospace text-muted small">
                          {asset.serialNumber}
                        </span>
                      </td>

                      {/* Model / Manufacturer */}
                      <td className="px-3 py-3">
                        <div className="text-dark fw-medium">{asset.modelName || "—"}</div>
                        {asset.manufacturer && (
                          <small className="text-muted d-block">{asset.manufacturer}</small>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">{getStatusBadge(asset.status)}</td>

                      {/* Current Assignee */}
                      <td className="px-3 py-3">
                        {asset.currentAssignee ? (
                          <div className="d-flex align-items-center gap-2">
                            <div className="assignee-avatar-chip">
                              {(asset.currentAssignee.firstName?.[0] || "E") + (asset.currentAssignee.lastName?.[0] || "")}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">
                                {asset.currentAssignee.firstName} {asset.currentAssignee.lastName}
                              </div>
                              <small className="text-muted extra-small">
                                {asset.currentAssignee.employeeCode || asset.currentAssignee.email}
                              </small>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>

                      {/* Actions: Permission Guarded */}
                      <td className="px-3 py-3 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          {/* Assign Action */}
                          {hasPermission("asset.assign") && asset.status === "AVAILABLE" && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="btn-asset-action"
                              onClick={() => handleOpenAssignModal(asset)}
                              title="Assign asset to employee"
                            >
                              <FaExchangeAlt />
                              <span>Assign</span>
                            </Button>
                          )}

                          {/* Return Action */}
                          {hasPermission("asset.return") && asset.status === "ASSIGNED" && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="btn-asset-action"
                              onClick={() => handleOpenReturnModal(asset)}
                              title="Return asset to inventory"
                            >
                              <FaUndoAlt />
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
              <div className="d-flex justify-content-between align-items-center p-3 px-4 border-top">
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
      </div>

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
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <FaPlus className="text-success" /> Add New Asset
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="pt-3">
            {createError && (
              <Alert variant="danger" className="py-2 px-3 small rounded-3 mb-3">
                <FaExclamationTriangle className="me-2" />
                {createError}
              </Alert>
            )}

            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">
                    Asset Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. MacBook Pro 16, Dell UltraSharp 27"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="shadow-none rounded-3"
                    required
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="shadow-none rounded-3"
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
                  <Form.Label className="small fw-semibold text-dark">
                    Serial Number <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. C02G789HKL"
                    value={createForm.serialNumber}
                    onChange={(e) => setCreateForm({ ...createForm, serialNumber: e.target.value })}
                    className="shadow-none rounded-3"
                    required
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">Manufacturer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Apple, Dell, Lenovo"
                    value={createForm.manufacturer}
                    onChange={(e) => setCreateForm({ ...createForm, manufacturer: e.target.value })}
                    className="shadow-none rounded-3"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">Model Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. M3 Max, Latitude 5420"
                    value={createForm.modelName}
                    onChange={(e) => setCreateForm({ ...createForm, modelName: e.target.value })}
                    className="shadow-none rounded-3"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">Purchase Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={createForm.purchaseDate}
                    onChange={(e) => setCreateForm({ ...createForm, purchaseDate: e.target.value })}
                    className="shadow-none rounded-3"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-dark">Warranty Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={createForm.warrantyExpiryDate}
                    onChange={(e) => setCreateForm({ ...createForm, warrantyExpiryDate: e.target.value })}
                    className="shadow-none rounded-3"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3 p-3 bg-light rounded-3 text-muted small border">
              <FaInfoCircle className="me-2 text-primary" />
              Asset code (e.g. AST0001) and initial status (AVAILABLE) will be automatically generated by the backend.
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={() => setShowCreateModal(false)}
              disabled={createSubmitting}
              className="rounded-pill px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSubmitting}
              className="btn-add-asset rounded-pill px-4"
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
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <FaExchangeAlt className="text-primary" /> Assign Asset to Employee
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAssignSubmit}>
          <Modal.Body className="pt-3">
            {assignError && (
              <Alert variant="danger" className="py-2 px-3 small rounded-3 mb-3">
                <FaExclamationTriangle className="me-2" />
                {assignError}
              </Alert>
            )}

            {selectedAssetForAssign && (
              <div className="asset-modal-preview mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark">{selectedAssetForAssign.name}</span>
                  <span className="badge bg-light text-dark border font-monospace">
                    {selectedAssetForAssign.assetCode}
                  </span>
                </div>
                <small className="text-muted">
                  Serial: <span className="font-monospace text-dark">{selectedAssetForAssign.serialNumber}</span> | Category: {selectedAssetForAssign.category}
                </small>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-dark">
                Select Employee <span className="text-danger">*</span>
              </Form.Label>
              {loadingEmployees ? (
                <div className="py-2 text-muted small">
                  <Spinner size="sm" animation="border" className="me-2" /> Loading employee directory...
                </div>
              ) : (
                <Form.Select
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="shadow-none rounded-3"
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
              <Form.Label className="small fw-semibold text-dark">Condition on Assignment</Form.Label>
              <Form.Select
                value={assignForm.conditionOnAssign}
                onChange={(e) => setAssignForm({ ...assignForm, conditionOnAssign: e.target.value })}
                className="shadow-none rounded-3"
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="DAMAGED">Damaged</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold text-dark">Remarks / Allocation Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g. Primary workstation allocation for developer"
                value={assignForm.remarks}
                onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
                className="shadow-none rounded-3"
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={() => setShowAssignModal(false)}
              disabled={assignSubmitting}
              className="rounded-pill px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={assignSubmitting || !assignForm.employeeId}
              className="rounded-pill px-4 fw-semibold"
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
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <FaUndoAlt className="text-success" /> Return Asset to Inventory
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReturnSubmit}>
          <Modal.Body className="pt-3">
            {returnError && (
              <Alert variant="danger" className="py-2 px-3 small rounded-3 mb-3">
                <FaExclamationTriangle className="me-2" />
                {returnError}
              </Alert>
            )}

            {selectedAssetForReturn && (
              <div className="asset-modal-preview mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-dark">{selectedAssetForReturn.name}</span>
                  <span className="badge bg-light text-dark border font-monospace">
                    {selectedAssetForReturn.assetCode}
                  </span>
                </div>
                <div className="small text-muted mb-1">
                  Assigned To:{" "}
                  <strong className="text-dark">
                    {selectedAssetForReturn.currentAssignee?.firstName}{" "}
                    {selectedAssetForReturn.currentAssignee?.lastName}
                  </strong>{" "}
                  ({selectedAssetForReturn.currentAssignee?.employeeCode || selectedAssetForReturn.currentAssignee?.email})
                </div>
                <small className="text-muted">
                  Serial: <span className="font-monospace text-dark">{selectedAssetForReturn.serialNumber}</span>
                </small>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-dark">Condition on Return</Form.Label>
              <Form.Select
                value={returnForm.conditionOnReturn}
                onChange={(e) => setReturnForm({ ...returnForm, conditionOnReturn: e.target.value })}
                className="shadow-none rounded-3"
              >
                <option value="GOOD">Good (Asset becomes Available)</option>
                <option value="DAMAGED">Damaged (Asset marked Damaged)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold text-dark">Inspection & Return Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g. Device returned in clean working order, wiped clean"
                value={returnForm.remarks}
                onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
                className="shadow-none rounded-3"
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              onClick={() => setShowReturnModal(false)}
              disabled={returnSubmitting}
              className="rounded-pill px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={returnSubmitting}
              className="rounded-pill px-4 fw-semibold"
              style={{ background: "linear-gradient(135deg, #2DC58A 0%, #20a673 100%)", border: "none" }}
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
