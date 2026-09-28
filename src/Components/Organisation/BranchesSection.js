import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Nav,
  Tab,
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
  FaUsers,
  FaUserPlus,
  FaBuilding,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaSitemap,
  FaCalendarWeek,
  FaUmbrellaBeach,
  FaCog,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaBarcode,
  FaEnvelope,
  FaPhoneAlt,
  FaHome,
  FaCity,
  FaGlobe,
  FaMailBulk,
  FaExclamationTriangle,
  FaThLarge,
  FaList,
  FaSyncAlt,
  FaShieldAlt,
} from "react-icons/fa";
import {
  fetchBranches,
  createBranch,
  updateBranch,
  fetchEmployeesDropdown,
  fetchOnboardedEmployees,
  assignEmployeesToBranch,
  removeEmployeeFromBranch,
  fetchShiftsDropdown,
  fetchWorkCalendarsDropdown,
  fetchHolidayCalendarsDropdown,
  fetchFinancialYearsDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import "../../Pages/Dashboard/HrOnboarding.css";
import "./BranchesSection.css";

// Import child sub-modules for Branch Detail page tabs
import DepartmentsSection from "./DepartmentsSection";
import DesignationsSection from "./DesignationsSection";
import TeamsSection from "./TeamsSection";
import LocationsSection from "./LocationsSection";
import ReportingHierarchySection from "./ReportingHierarchySection";
import JobGradesSection from "./JobGradesSection";
import CostCentersSection from "./CostCentersSection";
import WorkCalendarsSection from "./WorkCalendarsSection";
import ShiftsSection from "./ShiftsSection";
import HolidayCalendarsSection from "./HolidayCalendarsSection";
import FinancialYearsSection from "./FinancialYearsSection";
import BranchSettingsSection from "./BranchSettingsSection";

const BRANCH_TYPES = [
  { value: "HEADQUARTERS", label: "Headquarters (HQ)" },
  { value: "BRANCH_OFFICE", label: "Regional Branch Office" },
  { value: "DEVELOPMENT_CENTER", label: "R&D / Development Center" },
  { value: "SALES_OFFICE", label: "Sales & Client Office" },
  { value: "OPERATIONS_HUB", label: "Operations & Logistics Hub" },
  { value: "OTHER", label: "Other Campus Facility" },
];

export default function BranchesSection({
  onSelectBranch = null,
  onToggleFullView = null,
  isStandaloneView = false,
  onBackToOrg = null,
}) {
  const { hasPermission, isSystemAdmin } = useAuth();
  const { organization, refreshBranches } = useBranch();

  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [onboardedStaff, setOnboardedStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [workCalendars, setWorkCalendars] = useState([]);
  const [holidayCalendars, setHolidayCalendars] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Branch Detail View State (Drilldown)
  const [selectedBranchDetail, setSelectedBranchDetail] = useState(null);
  const [detailActiveTab, setDetailActiveTab] = useState("overview");

  // 5-Step Add Branch Multi-Step Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1); // 1: Basic, 2: Address, 3: Location, 4: Config, 5: Review
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [locating, setLocating] = useState(false);

  // Assign Members Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranchForMembers, setSelectedBranchForMembers] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [assignAsPrimary, setAssignAsPrimary] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignModalError, setAssignModalError] = useState("");
  const [assignModalSuccess, setAssignModalSuccess] = useState("");

  // Delete / Deactivate Confirm Modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatingBranch, setDeactivatingBranch] = useState(null);
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);

  const initialForm = {
    // Step 1: Basic
    branchName: "",
    branchCode: "",
    branchType: "BRANCH_OFFICE",
    branchHeadId: "",
    email: "",
    phone: "",

    // Step 2: Address
    address: "",
    country: "India",
    state: "",
    city: "",
    pincode: "",

    // Step 3: Location & Geofence
    latitude: "",
    longitude: "",
    officeRadiusMeters: 200,

    // Step 4: Branch Configuration
    timeZone: "Asia/Kolkata",
    defaultShiftId: "",
    defaultWorkCalendarId: "",
    defaultHolidayCalendarId: "",
    financialYearId: "",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("branch.create") || hasPermission("organization.branch.create");
  const canUpdate = isSystemAdmin || hasPermission("branch.update") || hasPermission("organization.branch.update");
  const canDelete = isSystemAdmin || hasPermission("branch.delete") || hasPermission("organization.branch.delete");

  // Load Branches
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
        city: filterCity,
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
  }, [page, search, filterType, filterStatus, filterCity]);

  // Load Auxiliary Dropdowns
  const loadAuxData = useCallback(async () => {
    try {
      const [dropdownList, fullStaff, shList, wcList, holList, fyList] = await Promise.all([
        fetchEmployeesDropdown().catch(() => []),
        fetchOnboardedEmployees().catch(() => []),
        fetchShiftsDropdown().catch(() => []),
        fetchWorkCalendarsDropdown().catch(() => []),
        fetchHolidayCalendarsDropdown().catch(() => []),
        fetchFinancialYearsDropdown().catch(() => []),
      ]);
      setEmployees(dropdownList || []);
      setOnboardedStaff(fullStaff || []);
      setShifts(shList || []);
      setWorkCalendars(wcList || []);
      setHolidayCalendars(holList || []);
      setFinancialYears(fyList || []);
    } catch (e) {
      console.warn("Failed to load aux data for branches:", e);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    loadAuxData();
  }, [loadAuxData]);

  // Compute members assigned to branch
  const getBranchMembers = useCallback(
    (branchId) => {
      if (!branchId) return [];
      const bIdStr = String(branchId);
      return onboardedStaff.filter((e) => {
        const pMatch = e.primaryBranchId && String(e.primaryBranchId) === bIdStr;
        const bMatch = Array.isArray(e.branchIds) && e.branchIds.some((id) => String(id) === bIdStr);
        return pMatch || bMatch;
      });
    },
    [onboardedStaff]
  );

  // Unique Cities list for filter
  const cityOptions = useMemo(() => {
    const set = new Set();
    branches.forEach((b) => {
      if (b.city) set.add(b.city);
    });
    return Array.from(set);
  }, [branches]);

  // ── 5-Step Create / Edit Modal Openers ──
  const handleOpenAddBranch = () => {
    setEditingBranchId(null);
    setFormData(initialForm);
    setAddStep(1);
    setModalError("");
    setShowAddModal(true);
    if (onToggleFullView) onToggleFullView(true);
  };

  const handleOpenEditBranch = (branch) => {
    setEditingBranchId(branch._id || branch.id);
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
      defaultShiftId: branch.defaultShiftId?._id || branch.defaultShiftId || "",
      defaultWorkCalendarId: branch.defaultWorkCalendarId?._id || branch.defaultWorkCalendarId || "",
      defaultHolidayCalendarId: branch.defaultHolidayCalendarId?._id || branch.defaultHolidayCalendarId || "",
      financialYearId: branch.financialYearId?._id || branch.financialYearId || "",
      status: branch.status || "ACTIVE",
    });
    setAddStep(1);
    setModalError("");
    setShowAddModal(true);
    if (onToggleFullView) onToggleFullView(true);
  };

  const handleCloseWizard = () => {
    setShowAddModal(false);
    setModalError("");
    if (onToggleFullView) onToggleFullView(false);
  };

  // GPS Auto-Fetch
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

  // Step Validation
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.branchName || !formData.branchName.trim()) {
        errs.branchName = "Branch Name is required.";
      }
      if (!formData.branchCode || !formData.branchCode.trim()) {
        errs.branchCode = "Branch Code is required.";
      }
    }
    if (step === 2) {
      if (!formData.city || !formData.city.trim()) {
        errs.city = "City / Metropolis is required.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setModalError("Please fill in the required fields highlighted below.");
      return false;
    }

    setFormErrors({});
    setModalError("");
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(addStep)) {
      setAddStep((p) => Math.min(p + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setModalError("");
    setAddStep((p) => Math.max(p - 1, 1));
  };

  // Submit Final Branch Creation / Update
  const handleSubmitBranch = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        branchName: formData.branchName.trim(),
        branchCode: formData.branchCode.trim().toUpperCase(),
        branchType: formData.branchType,
        branchHeadId: formData.branchHeadId || null,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country.trim() || "India",
        latitude: formData.latitude !== "" ? Number(formData.latitude) : null,
        longitude: formData.longitude !== "" ? Number(formData.longitude) : null,
        officeRadiusMeters: Number(formData.officeRadiusMeters) || 200,
        timeZone: formData.timeZone,
        defaultShiftId: formData.defaultShiftId || null,
        defaultWorkCalendarId: formData.defaultWorkCalendarId || null,
        defaultHolidayCalendarId: formData.defaultHolidayCalendarId || null,
        financialYearId: formData.financialYearId || null,
        status: formData.status || "ACTIVE",
      };

      if (editingBranchId) {
        const res = await updateBranch(editingBranchId, payload);
        setSuccess(res?.message || "Branch updated successfully!");
        if (selectedBranchDetail && (selectedBranchDetail._id === editingBranchId || selectedBranchDetail.id === editingBranchId)) {
          setSelectedBranchDetail((prev) => ({ ...prev, ...payload }));
        }
      } else {
        const res = await createBranch(payload);
        setSuccess(res?.message || "Branch created successfully!");
      }

      handleCloseWizard();
      await loadBranches();
      if (refreshBranches) refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save branch");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Open Assign Members Modal ──
  const handleOpenAssignModal = (branch) => {
    setSelectedBranchForMembers(branch);
    setMemberSearch("");
    setAssignModalError("");
    setAssignModalSuccess("");
    setAssignAsPrimary(true);

    const bIdStr = String(branch._id || branch.id);
    const initialSelected = new Set();
    onboardedStaff.forEach((emp) => {
      const isPrimary = emp.primaryBranchId && String(emp.primaryBranchId) === bIdStr;
      const isBranchInList = Array.isArray(emp.branchIds) && emp.branchIds.some((id) => String(id) === bIdStr);
      if (isPrimary || isBranchInList) {
        initialSelected.add(String(emp._id || emp.id));
      }
    });
    setSelectedMemberIds(initialSelected);
    setShowAssignModal(true);
  };

  const toggleMember = (empId) => {
    const idStr = String(empId);
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  const handleSaveMembers = async () => {
    if (!selectedBranchForMembers) return;
    const branchId = selectedBranchForMembers._id || selectedBranchForMembers.id;

    try {
      setAssignLoading(true);
      setAssignModalError("");
      const currentAssigned = new Set(getBranchMembers(branchId).map((e) => String(e._id || e.id)));
      const toAdd = Array.from(selectedMemberIds).filter((id) => !currentAssigned.has(id));
      const toRemove = Array.from(currentAssigned).filter((id) => !selectedMemberIds.has(id));

      const tasks = [];
      if (toAdd.length > 0) {
        tasks.push(assignEmployeesToBranch(branchId, toAdd, assignAsPrimary));
      }
      if (toRemove.length > 0) {
        toRemove.forEach((uId) => tasks.push(removeEmployeeFromBranch(branchId, uId)));
      }

      await Promise.allSettled(tasks);
      setAssignModalSuccess("Staff assignments updated!");
      await loadAuxData();
      await loadBranches();
      if (refreshBranches) refreshBranches();

      setTimeout(() => {
        setShowAssignModal(false);
        setSuccess(`Staff roster synchronized for ${selectedBranchForMembers.branchName}`);
        setTimeout(() => setSuccess(""), 4000);
      }, 1000);
    } catch (err) {
      setAssignModalError(err.message || "Failed to assign branch members");
    } finally {
      setAssignLoading(false);
    }
  };

  // ── Soft Deactivate / Delete Handler ──
  const handleConfirmDeactivate = async () => {
    if (!deactivatingBranch) return;
    try {
      setDeactivatingLoading(true);
      const bId = deactivatingBranch._id || deactivatingBranch.id;
      // Soft toggle to INACTIVE
      await updateBranch(bId, { status: "INACTIVE" });
      setSuccess(`Branch ${deactivatingBranch.branchName} deactivated.`);
      setShowDeactivateModal(false);
      if (selectedBranchDetail && (selectedBranchDetail._id === bId || selectedBranchDetail.id === bId)) {
        setSelectedBranchDetail(null);
      }
      await loadBranches();
      if (refreshBranches) refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to deactivate branch");
    } finally {
      setDeactivatingLoading(false);
    }
  };

  // =========================================================================
  // VIEW: 5-STEP ADD / EDIT BRANCH FULL-VIEW SETUP WIZARD
  // =========================================================================
  // =========================================================================
  // VIEW: 5-STEP ADD / EDIT BRANCH FULL-VIEW SETUP WIZARD (NEW ONBOARDING THEME)
  // =========================================================================
  if (showAddModal) {
    const stepCompletionPct = Math.round((addStep / 5) * 100);

    return (
      <div className="onboarding-container pb-5">
        {/* ── 1. Top Header (Matching New Onboarding) ── */}
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom flex-wrap">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="onboarding-back-btn"
              onClick={handleCloseWizard}
              title="Back to Branches"
            >
              <FaChevronLeft size={13} />
            </button>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="mb-0 fw-bold onboarding-header-title">
                  {editingBranchId ? `Edit Branch: ${formData.branchName || "Branch"}` : "Add Branch — Multi-Step Setup"}
                </h4>
                <span className="onboarding-enterprise-pill">
                  Enterprise
                </span>
              </div>
              <span className="text-muted extra-small d-block mt-0.5">
                Establish branch profile, physical office address, GPS attendance geofencing, and operational shift defaults.
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="onboarding-active-form-pill">
              <FaCodeBranch className="me-2 text-warning" /> Step {addStep} of 5: {
                addStep === 1 ? "Basic Information" :
                addStep === 2 ? "Physical Address" :
                addStep === 3 ? "Location & Geofencing" :
                addStep === 4 ? "Operational Defaults" : "Review & Confirmation"
              }
            </span>
          </div>
        </div>

        {/* ── 2. Two-Column Layout (Matching New Onboarding) ── */}
        <div className="onboarding-layout">
          {/* ── LEFT COLUMN: MAIN FORM CARD ── */}
          <div className="onboarding-form">
            <Card className="onboarding-dash-card p-4 p-md-5 bg-white mb-4">
              {/* Form Section Header with TeamHub Gold Badge */}
              <div className="d-flex align-items-start justify-content-between gap-3 mb-4 pb-3 border-bottom flex-wrap">
                <div className="d-flex align-items-center gap-3">
                  <div className="onboarding-section-icon-badge">
                    {addStep === 1 ? <FaBuilding size={16} /> :
                     addStep === 2 ? <FaMapMarkerAlt size={16} /> :
                     addStep === 3 ? <FaCrosshairs size={16} /> :
                     addStep === 4 ? <FaCog size={16} /> : <FaCheckCircle size={16} />}
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 text-dark" style={{ fontSize: "16px" }}>
                      {addStep === 1 ? "Step 1: Branch Identity & Designated Leadership" :
                       addStep === 2 ? "Step 2: Physical Address & Regional Details" :
                       addStep === 3 ? "Step 3: Location Coordinates & Mobile Geofence" :
                       addStep === 4 ? "Step 4: Operational Defaults & Work Schedules" :
                       "Step 5: Review & Confirm Branch Parameters"}
                    </h5>
                    <span className="extra-small text-muted d-block">
                      Fields marked with <span className="text-danger fw-bold">*</span> are mandatory for branch configuration.
                    </span>
                  </div>
                </div>

                <span className="onboarding-enterprise-pill">
                  Step {addStep} of 5
                </span>
              </div>

              {/* Error Alert */}
              {modalError && (
                <Alert variant="danger" dismissible onClose={() => setModalError("")} className="mb-4 shadow-sm">
                  <div className="d-flex align-items-center gap-2">
                    <FaExclamationTriangle className="text-danger flex-shrink-0" />
                    <span><strong>Action Required:</strong> {modalError}</span>
                  </div>
                </Alert>
              )}

              {/* ── STEP 1: Basic Information ── */}
              {addStep === 1 && (
                <div>
                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                          <span>BRANCH NAME <span className="text-danger">*</span></span>
                          {formErrors.branchName && (
                            <span className="text-danger extra-small fw-semibold">Required</span>
                          )}
                        </Form.Label>
                        <InputGroup hasValidation>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaBuilding size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            required
                            className="ps-2"
                            placeholder="e.g. Coimbatore Branch"
                            value={formData.branchName}
                            isInvalid={!!formErrors.branchName}
                            onChange={(e) => {
                              setFormData({ ...formData, branchName: e.target.value });
                              if (formErrors.branchName) setFormErrors((p) => ({ ...p, branchName: "" }));
                            }}
                          />
                        </InputGroup>
                        {formErrors.branchName ? (
                          <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                            <FaExclamationTriangle size={11} /> {formErrors.branchName}
                          </div>
                        ) : (
                          <Form.Text className="text-muted extra-small">Official commercial title for this branch office.</Form.Text>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                          <span>BRANCH CODE <span className="text-danger">*</span></span>
                          {formErrors.branchCode && (
                            <span className="text-danger extra-small fw-semibold">Required</span>
                          )}
                        </Form.Label>
                        <InputGroup hasValidation>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaBarcode size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            required
                            className="font-monospace text-uppercase ps-2"
                            placeholder="e.g. CBE001"
                            value={formData.branchCode}
                            isInvalid={!!formErrors.branchCode}
                            onChange={(e) => {
                              setFormData({ ...formData, branchCode: e.target.value.toUpperCase().replace(/\s+/g, "") });
                              if (formErrors.branchCode) setFormErrors((p) => ({ ...p, branchCode: "" }));
                            }}
                          />
                        </InputGroup>
                        {formErrors.branchCode ? (
                          <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                            <FaExclamationTriangle size={11} /> {formErrors.branchCode}
                          </div>
                        ) : (
                          <Form.Text className="text-muted extra-small">Unique alphanumeric identifier for employee codes & tags.</Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">BRANCH TYPE</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaSitemap size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            value={formData.branchType}
                            onChange={(e) => setFormData({ ...formData, branchType: e.target.value })}
                            className="onboarding-dash-select ps-2"
                          >
                            {BRANCH_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Categorize operational facility and organization role.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">BRANCH MANAGER / HEAD</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaUserTie size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            value={formData.branchHeadId}
                            onChange={(e) => setFormData({ ...formData, branchHeadId: e.target.value })}
                            className="onboarding-dash-select ps-2"
                          >
                            <option value="">-- Select Manager (Optional) --</option>
                            {employees.map((e) => (
                              <option key={e._id || e.id} value={e._id || e.id}>
                                {e.fullName || `${e.firstName} ${e.lastName || ""}`}
                              </option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Principal leader responsible for this branch unit.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-4 mb-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">BRANCH EMAIL</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaEnvelope size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            type="email"
                            className="ps-2"
                            placeholder="e.g. coimbatore@flareminds.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Official administrative correspondence mailbox.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">BRANCH PHONE</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaPhoneAlt size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            className="ps-2"
                            placeholder="e.g. +91 422 2345678"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Direct telephone line or reception desk number.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ── STEP 2: Address ── */}
              {addStep === 2 && (
                <div>
                  <Row className="g-4 mb-4">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">STREET ADDRESS / BUILDING / SUITE</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaHome size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            className="ps-2"
                            placeholder="e.g. 100 Tech Park, Avinashi Road, Suite 402"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Premises street line, building suite or floor location.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                          <span>CITY / METROPOLIS <span className="text-danger">*</span></span>
                          {formErrors.city && (
                            <span className="text-danger extra-small fw-semibold">Required</span>
                          )}
                        </Form.Label>
                        <InputGroup hasValidation>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaCity size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            required
                            className="ps-2"
                            placeholder="e.g. Coimbatore"
                            value={formData.city}
                            isInvalid={!!formErrors.city}
                            onChange={(e) => {
                              setFormData({ ...formData, city: e.target.value });
                              if (formErrors.city) setFormErrors((p) => ({ ...p, city: "" }));
                            }}
                          />
                        </InputGroup>
                        {formErrors.city ? (
                          <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                            <FaExclamationTriangle size={11} /> {formErrors.city}
                          </div>
                        ) : (
                          <Form.Text className="text-muted extra-small">City municipality where branch operates.</Form.Text>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">STATE / PROVINCE</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaMapMarkerAlt size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            className="ps-2"
                            placeholder="e.g. Tamil Nadu"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          />
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">State jurisdiction for regional tax & compliance.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-4 mb-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">COUNTRY</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaGlobe size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            className="ps-2"
                            placeholder="e.g. India"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">PIN / POSTAL CODE</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaMailBulk size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            className="font-monospace ps-2"
                            placeholder="e.g. 641014"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ── STEP 3: Location / Attendance Geofence ── */}
              {addStep === 3 && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">GPS Geofencing Perimeter</h6>
                      <span className="extra-small text-muted">Configure office coordinates for mobile clock-in geofence boundaries.</span>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="d-flex align-items-center gap-2 shadow-sm rounded-pill fw-semibold px-3 py-1.5"
                      onClick={handleCurrentGPS}
                      disabled={locating}
                    >
                      <FaCrosshairs /> {locating ? "Acquiring GPS Signal..." : "Auto-Fetch Device GPS"}
                    </Button>
                  </div>

                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">OFFICE LATITUDE (DECIMAL)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaCrosshairs size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            type="number"
                            step="0.000001"
                            className="ps-2"
                            placeholder="e.g. 11.016844"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          />
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Example: 11.016844</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">OFFICE LONGITUDE (DECIMAL)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaCrosshairs size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            type="number"
                            step="0.000001"
                            className="ps-2"
                            placeholder="e.g. 76.955832"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          />
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Example: 76.955832</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="p-3.5 rounded-3 border bg-light mt-3">
                    <Form.Group>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="small fw-bold text-dark mb-0">GEOFENCE RADIUS (METERS)</Form.Label>
                        <span className="onboarding-enterprise-pill font-monospace" style={{ fontSize: "12px" }}>
                          {formData.officeRadiusMeters || 200} Meters
                        </span>
                      </div>
                      <Form.Range
                        min={50}
                        max={2000}
                        step={10}
                        value={formData.officeRadiusMeters || 200}
                        onChange={(e) => setFormData({ ...formData, officeRadiusMeters: Number(e.target.value) })}
                      />
                      <div className="d-flex justify-content-between text-muted extra-small mt-1">
                        <span>50m (Single Building)</span>
                        <span>200m (Standard Campus)</span>
                        <span>2000m (Industrial Zone)</span>
                      </div>
                      <Form.Text className="text-muted extra-small d-block mt-2">
                        Employees within this perimeter radius will be permitted to clock in via mobile GPS.
                      </Form.Text>
                    </Form.Group>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Branch Configuration ── */}
              {addStep === 4 && (
                <div>
                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">DEFAULT WORK SHIFT</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaClock size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            value={formData.defaultShiftId}
                            onChange={(e) => setFormData({ ...formData, defaultShiftId: e.target.value })}
                            className="onboarding-dash-select ps-2"
                          >
                            <option value="">-- Select Default Shift --</option>
                            {shifts.map((s) => (
                              <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime} - {s.endTime})</option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Standard working hours for branch personnel.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">WORK CALENDAR</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaCalendarWeek size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            value={formData.defaultWorkCalendarId}
                            onChange={(e) => setFormData({ ...formData, defaultWorkCalendarId: e.target.value })}
                            className="onboarding-dash-select ps-2"
                          >
                            <option value="">-- Select Work Calendar --</option>
                            {workCalendars.map((c) => (
                              <option key={c._id} value={c._id}>{c.calendarName}</option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Weekly work cycle & designated off days.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-4 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">HOLIDAY CALENDAR CATALOG</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaUmbrellaBeach size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            value={formData.defaultHolidayCalendarId}
                            onChange={(e) => setFormData({ ...formData, defaultHolidayCalendarId: e.target.value })}
                            className="onboarding-dash-select ps-2"
                          >
                            <option value="">-- Select Holiday Catalog --</option>
                            {holidayCalendars.map((h) => (
                              <option key={h._id} value={h._id}>{h.calendarName} ({h.year})</option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">State or region-specific public holiday catalog.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">BRANCH FINANCIAL YEAR</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaCalendarAlt size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            value={formData.financialYearId}
                            onChange={(e) => setFormData({ ...formData, financialYearId: e.target.value })}
                            className="onboarding-dash-select ps-2"
                          >
                            <option value="">-- Select Financial Year --</option>
                            {financialYears.map((fy) => (
                              <option key={fy._id} value={fy._id}>{fy.financialYearName || fy.name} ({fy.status})</option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                        <Form.Text className="text-muted extra-small">Statutory fiscal payroll & accounting cycle.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-4 mb-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">TIME ZONE</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaGlobe size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            className="ps-2"
                            value={formData.timeZone}
                            onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-dark mb-1">INITIAL STATUS</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaCheckCircle size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="onboarding-dash-select ps-2"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </Form.Select>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ── STEP 5: Review & Confirm ── */}
              {addStep === 5 && (
                <div>
                  <div className="p-4 rounded-3 border bg-light mb-3">
                    <Row className="g-4">
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Organization</span>
                        <div className="fw-bold text-dark">{organization?.organizationName || "Current Organization"}</div>
                      </Col>
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Branch Name & Code</span>
                        <div className="fw-bold text-dark d-flex align-items-center gap-2">
                          {formData.branchName || "—"}
                          <span className="onboarding-enterprise-pill font-monospace">{formData.branchCode || "—"}</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Branch Type</span>
                        <div className="text-dark fw-semibold">{formData.branchType?.replace("_", " ")}</div>
                      </Col>
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Designated Manager</span>
                        <div className="text-dark">
                          {employees.find((e) => String(e._id || e.id) === String(formData.branchHeadId))?.fullName || "Not Assigned"}
                        </div>
                      </Col>
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Physical Address</span>
                        <div className="text-dark">{formData.address || "—"}, {formData.city}, {formData.state} {formData.pincode}, {formData.country}</div>
                      </Col>
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Geofence Coordinates & Radius</span>
                        <div className="text-dark">
                          {formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : "No GPS Specified"}
                          <span className="badge bg-primary-subtle text-primary ms-2">{formData.officeRadiusMeters}m radius</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Contact Channels</span>
                        <div className="text-dark">{formData.email || "—"} &bull; {formData.phone || "—"}</div>
                      </Col>
                      <Col md={6}>
                        <span className="text-muted extra-small d-block text-uppercase fw-semibold mb-1">Policy Defaults</span>
                        <div className="text-dark">
                          Shift: {shifts.find((s) => s._id === formData.defaultShiftId)?.shiftName || "Default"} |
                          Calendar: {workCalendars.find((c) => c._id === formData.defaultWorkCalendarId)?.calendarName || "Default"}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              )}

              {/* ── Bottom Navigation Action Toolbar ── */}
              <div className="d-flex align-items-center justify-content-between pt-4 mt-4 border-top flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <Button
                    type="button"
                    className="onboarding-nav-btn onboarding-prev-btn"
                    onClick={handlePrevStep}
                    disabled={addStep === 1 || modalLoading}
                  >
                    <FaChevronLeft size={10} className="me-1" /> Previous Step
                  </Button>

                  <button
                    type="button"
                    className="btn btn-link text-muted text-decoration-none small px-2"
                    onClick={handleCloseWizard}
                    disabled={modalLoading}
                  >
                    Cancel Setup
                  </button>
                </div>

                <div>
                  {addStep < 5 ? (
                    <Button
                      type="button"
                      className="onboarding-nav-btn onboarding-next-btn"
                      onClick={handleNextStep}
                    >
                      Next Step <FaChevronRight size={10} className="ms-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="onboarding-nav-btn onboarding-submit-btn"
                      disabled={modalLoading}
                      onClick={handleSubmitBranch}
                    >
                      {modalLoading ? <Spinner animation="border" size="sm" className="me-2" /> : <FaCheckCircle className="me-2" />}
                      {editingBranchId ? "Save Branch Changes" : "Initialize & Create Branch"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN: STICKY PROGRESS & CHECKLIST SIDEBAR ── */}
          <div className="onboarding-sidebar">
            <div className="completion-card">
              <Card className="onboarding-dash-card onboarding-sticky-progress-card p-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">Setup Progress</h6>
                  <span className="onboarding-enterprise-pill">{stepCompletionPct}%</span>
                </div>
                <span className="extra-small text-muted mb-3 d-block">
                  Step {addStep} of 5 Completed
                </span>

                {/* Progress Counter & Bar */}
                <div className="d-flex align-items-baseline gap-2 mb-2">
                  <span className="onboarding-progress-percent">
                    {stepCompletionPct}%
                  </span>
                  <span className="small text-muted font-monospace">COMPLETED</span>
                </div>

                <div className="progress onboarding-progress-bar-6 mb-4">
                  <div
                    className="progress-bar"
                    style={{ width: `${stepCompletionPct}%` }}
                  />
                </div>

                {/* 5-Step Interactive Checklist */}
                <div className="d-flex flex-column gap-2 mb-4">
                  {[
                    { num: 1, label: "Basic Identity", icon: FaBuilding, desc: "Code, Name & Head" },
                    { num: 2, label: "Physical Address", icon: FaMapMarkerAlt, desc: "City, State & Postal" },
                    { num: 3, label: "Location & Geofence", icon: FaCrosshairs, desc: "GPS Coordinates & Radius" },
                    { num: 4, label: "Operational Defaults", icon: FaCog, desc: "Shifts & Calendars" },
                    { num: 5, label: "Review & Confirmation", icon: FaCheckCircle, desc: "Parameters Overview" },
                  ].map((s) => {
                    const isActive = addStep === s.num;
                    const isCompleted = addStep > s.num;
                    const IconComp = s.icon;
                    return (
                      <div
                        key={s.num}
                        className={`p-2.5 rounded-3 d-flex align-items-center justify-content-between onboarding-checklist-row ${
                          isActive ? "onboarding-checklist-active" : ""
                        }`}
                        style={{ cursor: isCompleted || isActive ? "pointer" : "default" }}
                        onClick={() => (isCompleted || isActive) && setAddStep(s.num)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "8px",
                              background: isActive ? "#1C1D1D" : isCompleted ? "rgba(16, 185, 129, 0.12)" : "#F4EFE6",
                              color: isActive ? "#E2C278" : isCompleted ? "#059669" : "#8E8A82",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: "bold",
                            }}
                          >
                            {isCompleted ? "✓" : <IconComp size={13} />}
                          </div>
                          <div>
                            <div className="extra-small fw-bold text-dark">{s.label}</div>
                            <div className="text-muted" style={{ fontSize: "10px" }}>{s.desc}</div>
                          </div>
                        </div>

                        <span
                          className={`onboarding-checklist-badge ${
                            isCompleted ? "filled" : isActive ? "filled" : "pending"
                          }`}
                        >
                          {isCompleted ? "Filled" : isActive ? "Active" : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Live Branch Snapshot preview card */}
                <div className="p-3 rounded-3 border bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="extra-small fw-bold text-uppercase text-secondary">Branch Snapshot</span>
                    <Badge bg={formData.status === "ACTIVE" ? "success" : "secondary"}>
                      {formData.status || "ACTIVE"}
                    </Badge>
                  </div>
                  <div className="fw-bold text-dark fs-6 text-truncate">
                    {formData.branchName || "Unnamed Branch"}
                  </div>
                  <div className="small text-muted font-monospace mt-0.5">
                    Code: {formData.branchCode || "—"}
                  </div>
                  <div className="extra-small text-muted mt-2 pt-2 border-top d-flex align-items-center gap-1">
                    <FaMapMarkerAlt className="text-danger flex-shrink-0" />
                    <span className="text-truncate">{[formData.city, formData.state].filter(Boolean).join(", ") || "Location pending"}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ENTERPRISE BRANCH DETAIL HUB (Drilldown)
  // =========================================================================
  if (selectedBranchDetail) {
    const b = selectedBranchDetail;
    const lockedBId = b._id || b.id;
    const branchMembers = getBranchMembers(lockedBId);
    const headObj = employees.find(
      (e) => String(e._id || e.id) === String(b.branchHeadId?._id || b.branchHeadId)
    );
    const managerName = headObj ? (headObj.fullName || `${headObj.firstName} ${headObj.lastName || ""}`) : null;
    const managerInitials = managerName
      ? managerName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
      : "BM";

    const detailTabsList = [
      { key: "overview", label: "Overview", icon: FaBuilding },
      { key: "departments", label: "Departments", icon: FaSitemap },
      { key: "designations", label: "Designations", icon: FaUserTie },
      { key: "teams", label: "Teams", icon: FaUsers },
      { key: "locations", label: "Locations", icon: FaMapMarkerAlt },
      { key: "reporting", label: "Reporting", icon: FaSitemap },
      { key: "job-grades", label: "Job Grades", icon: FaShieldAlt },
      { key: "cost-centers", label: "Cost Centers", icon: FaBuilding },
      { key: "work-calendars", label: "Work Calendar", icon: FaCalendarWeek },
      { key: "shifts", label: "Shifts", icon: FaClock },
      { key: "holidays", label: "Holidays", icon: FaUmbrellaBeach },
      { key: "financial-years", label: "Financial Year", icon: FaCalendarAlt },
      { key: "settings", label: "Branch Settings", icon: FaCog },
    ];

    return (
      <div className="branch-detail-workspace">
        {/* ── 1. Top Action Bar & Navigation ── */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <button
            type="button"
            className="branches-btn-secondary"
            onClick={() => setSelectedBranchDetail(null)}
          >
            <FaArrowLeft /> Back to All Branches
          </button>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {canUpdate && (
              <button
                type="button"
                className="branches-btn-add"
                onClick={() => handleOpenAssignModal(b)}
              >
                <FaUserPlus /> Manage Staff ({branchMembers.length})
              </button>
            )}
            {canUpdate && (
              <button
                type="button"
                className="branches-btn-secondary"
                onClick={() => handleOpenEditBranch(b)}
              >
                <FaEdit /> Edit Branch
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="branches-btn-secondary"
                style={{ color: "#dc2626", borderColor: "#fecaca" }}
                onClick={() => {
                  setDeactivatingBranch(b);
                  setShowDeactivateModal(true);
                }}
              >
                <FaTrash /> Deactivate
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Executive Hero Banner Card ── */}
        <div className="branch-detail-hero-card">
          <div className="branch-detail-hero-glow" />
          <div className="branch-detail-hero-header">
            <div className="d-flex align-items-center gap-3">
              <div className="branch-detail-avatar">
                <FaBuilding />
              </div>
              <div>
                <div className="branch-detail-title-row">
                  <h3 className="branch-detail-main-name">{b.branchName}</h3>
                  <span
                    className={`branch-status-indicator ${
                      b.status === "ACTIVE" ? "active" : "inactive"
                    }`}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: b.status === "ACTIVE" ? "#10b981" : "#94a3b8",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {b.status || "ACTIVE"}
                  </span>
                  <span className="branch-type-pill">
                    {b.branchType?.replace(/_/g, " ") || "BRANCH"}
                  </span>
                </div>

                <div className="branch-detail-meta-row">
                  <span className="branch-code-badge">CODE: {b.branchCode}</span>
                  <span>•</span>
                  <span className="d-flex align-items-center gap-1">
                    <FaMapMarkerAlt className="text-danger" />
                    {[b.address, b.city, b.state, b.country].filter(Boolean).join(", ")}
                  </span>
                  {managerName && (
                    <>
                      <span>•</span>
                      <span className="d-flex align-items-center gap-1">
                        <FaUserTie className="text-primary" /> Head: {managerName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="branch-scope-badge">
              <div className="branch-scope-label">Scoped Branch ID</div>
              <div className="branch-scope-val">{lockedBId}</div>
            </div>
          </div>
        </div>

        {/* ── 3. KPI Summary Metric Cards ── */}
        <div className="branches-kpi-grid">
          <div className="branches-kpi-card">
            <div className="branches-kpi-icon-box blue">
              <FaUsers />
            </div>
            <div className="branches-kpi-info">
              <div className="branches-kpi-label">Branch Workforce</div>
              <div className="branches-kpi-value">{branchMembers.length}</div>
              <div className="branches-kpi-subtext">Assigned personnel</div>
            </div>
          </div>

          <div className="branches-kpi-card">
            <div className="branches-kpi-icon-box emerald">
              <FaCrosshairs />
            </div>
            <div className="branches-kpi-info">
              <div className="branches-kpi-label">Geofence Perimeter</div>
              <div className="branches-kpi-value">{b.officeRadiusMeters || 200}m</div>
              <div className="branches-kpi-subtext">GPS attendance radius</div>
            </div>
          </div>

          <div className="branches-kpi-card">
            <div className="branches-kpi-icon-box purple">
              <FaClock />
            </div>
            <div className="branches-kpi-info">
              <div className="branches-kpi-label">Time Zone</div>
              <div className="branches-kpi-value" style={{ fontSize: 16 }}>{b.timeZone || "Asia/Kolkata"}</div>
              <div className="branches-kpi-subtext">Operating timezone</div>
            </div>
          </div>

          <div className="branches-kpi-card">
            <div className="branches-kpi-icon-box gold">
              <FaBuilding />
            </div>
            <div className="branches-kpi-info">
              <div className="branches-kpi-label">Operating Status</div>
              <div className="branches-kpi-value" style={{ color: b.status === "ACTIVE" ? "#059669" : "#64748b" }}>
                {b.status || "ACTIVE"}
              </div>
              <div className="branches-kpi-subtext">Branch lifecycle</div>
            </div>
          </div>
        </div>

        {/* ── 4. Category Navigation Tabs (Pill Style) ── */}
        <div className="branch-category-pills-bar">
          {detailTabsList.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = detailActiveTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`branch-pill-tab ${isActive ? "active" : ""}`}
                onClick={() => setDetailActiveTab(tab.key)}
              >
                <TabIcon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 5. Tab Content Panes ── */}
        <div>
          {detailActiveTab === "overview" && (
            <div className="d-flex flex-column gap-4">
              {/* ── ROW 1: Facility Profile & GPS Geofence Radar ── */}
              <Row className="g-4">
                {/* ── Card 1: Facility Profile & Address ── */}
                <Col lg={6}>
                  <div className="branch-info-card">
                    <div className="branch-info-card-header">
                      <h5 className="branch-info-card-title">
                        <FaBuilding className="text-warning" /> Facility Identity & Physical Workplace
                      </h5>
                      <span className="branch-type-pill">
                        {b.branchType?.replace(/_/g, " ") || "Branch Office"}
                      </span>
                    </div>

                    <div className="branch-info-card-body">
                      {/* Address Banner */}
                      <div className="branch-address-banner">
                        <div className="branch-address-icon-box">
                          <FaMapMarkerAlt />
                        </div>
                        <div className="branch-address-details">
                          <div className="branch-address-label">Physical Office Location</div>
                          <p className="branch-address-text">
                            {[b.address, b.city, b.state, b.pincode, b.country].filter(Boolean).join(", ") || "Address not provided"}
                          </p>
                        </div>
                      </div>

                      {/* Micro-Tiles Grid */}
                      <div className="branch-tiles-grid">
                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaBarcode size={10} className="text-muted" /> Branch Code
                          </span>
                          <span className="branch-field-tile-val mono">{b.branchCode}</span>
                        </div>

                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaCity size={10} className="text-muted" /> City / District
                          </span>
                          <span className="branch-field-tile-val">{b.city || "—"}</span>
                        </div>

                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaGlobe size={10} className="text-muted" /> State & Country
                          </span>
                          <span className="branch-field-tile-val">{[b.state, b.country || "India"].filter(Boolean).join(", ")}</span>
                        </div>

                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaMailBulk size={10} className="text-muted" /> Postal PIN
                          </span>
                          <span className="branch-field-tile-val mono">{b.pincode || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* ── Card 2: GPS Attendance Radar & Mobile Geofence ── */}
                <Col lg={6}>
                  <div className="branch-info-card">
                    <div className="branch-info-card-header">
                      <h5 className="branch-info-card-title">
                        <FaCrosshairs className="text-success" /> Attendance & Mobile GPS Geofencing
                      </h5>
                      <span className="branch-code-badge font-monospace">
                        {b.timeZone || "Asia/Kolkata"}
                      </span>
                    </div>

                    <div className="branch-info-card-body">
                      {/* Radar Hero Box */}
                      <div className="branch-radar-hero-box">
                        <div className="branch-radar-visual">
                          <div className="branch-radar-inner-ring">
                            <FaCrosshairs className="branch-radar-center-beacon" />
                          </div>
                        </div>
                        <div className="branch-radar-info">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <h5 className="branch-radar-title mb-0">GPS Attendance Perimeter</h5>
                            <span className={`badge ${b.latitude && b.longitude ? "bg-success" : "bg-warning text-dark"}`}>
                              {b.latitude && b.longitude ? "Active Geofence" : "Pending GPS"}
                            </span>
                          </div>
                          <p className="branch-radar-subtext">
                            Mobile attendance punches are verified within a <strong>{b.officeRadiusMeters || 200}m</strong> radius around this facility coordinates.
                          </p>
                          <div className="branch-coords-pill">
                            <FaMapMarkerAlt size={11} className="text-danger" />
                            {b.latitude && b.longitude ? `${b.latitude}, ${b.longitude}` : "Coordinates Unset"}
                          </div>
                        </div>
                      </div>

                      {/* Micro-Tiles Grid */}
                      <div className="branch-tiles-grid">
                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaCrosshairs size={10} className="text-success" /> Radius Perimeter
                          </span>
                          <span className="branch-field-tile-val text-success fw-bold">
                            {b.officeRadiusMeters || 200} Meters
                          </span>
                        </div>

                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaClock size={10} className="text-muted" /> Time Zone
                          </span>
                          <span className="branch-field-tile-val mono">{b.timeZone || "Asia/Kolkata"}</span>
                        </div>

                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaEnvelope size={10} className="text-muted" /> Branch Email
                          </span>
                          <span className="branch-field-tile-val text-truncate">{b.email || "—"}</span>
                        </div>

                        <div className="branch-field-tile">
                          <span className="branch-field-tile-label">
                            <FaPhoneAlt size={10} className="text-muted" /> Phone Contact
                          </span>
                          <span className="branch-field-tile-val">{b.phone || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* ── ROW 2: Leadership Spotlight & Operational Work Schedules ── */}
              <Row className="g-4">
                {/* ── Card 3: Branch Leadership & Quick Contacts ── */}
                <Col lg={6}>
                  <div className="branch-info-card">
                    <div className="branch-info-card-header">
                      <h5 className="branch-info-card-title">
                        <FaUserTie className="text-primary" /> Branch Leadership & Communication
                      </h5>
                    </div>

                    <div className="branch-info-card-body">
                      <div className="branch-manager-spotlight-box">
                        <div className="branch-manager-spotlight-left">
                          <div className="branch-manager-spotlight-avatar">
                            {managerInitials}
                          </div>
                          <div>
                            <h5 className="branch-manager-spotlight-name">
                              {managerName || "Designated Branch Head"}
                            </h5>
                            <div className="branch-manager-spotlight-role">
                              {headObj?.designation || "Branch Director / Managing Head"}
                            </div>
                          </div>
                        </div>

                        {!managerName && canUpdate && (
                          <button
                            type="button"
                            className="branches-btn-secondary"
                            onClick={() => handleOpenEditBranch(b)}
                          >
                            <FaEdit /> Assign Head
                          </button>
                        )}
                      </div>

                      <div className="branch-contact-chips-row">
                        {b.email && (
                          <a href={`mailto:${b.email}`} className="branch-contact-chip">
                            <FaEnvelope className="text-primary" /> {b.email}
                          </a>
                        )}
                        {b.phone && (
                          <a href={`tel:${b.phone}`} className="branch-contact-chip">
                            <FaPhoneAlt className="text-success" /> {b.phone}
                          </a>
                        )}
                        {headObj?.email && (
                          <a href={`mailto:${headObj.email}`} className="branch-contact-chip">
                            <FaUserTie className="text-warning" /> Manager: {headObj.email}
                          </a>
                        )}
                        {!b.email && !b.phone && (
                          <span className="text-muted small">
                            No direct phone or email contact lines configured for this facility.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>

                {/* ── Card 4: Operational Workplace Policies & Shifts ── */}
                <Col lg={6}>
                  <div className="branch-info-card">
                    <div className="branch-info-card-header">
                      <h5 className="branch-info-card-title">
                        <FaCalendarWeek className="text-purple" /> Operational Defaults & Schedule
                      </h5>
                      <span className="branch-status-indicator active">
                        ● Synced
                      </span>
                    </div>

                    <div className="branch-info-card-body">
                      <div className="branch-schedules-grid">
                        <div className="branch-schedule-card">
                          <div className="branch-schedule-icon shift">
                            <FaClock />
                          </div>
                          <div>
                            <div className="branch-schedule-label">Operating Shift</div>
                            <div className="branch-schedule-value">Standard General</div>
                          </div>
                        </div>

                        <div className="branch-schedule-card">
                          <div className="branch-schedule-icon cal">
                            <FaCalendarWeek />
                          </div>
                          <div>
                            <div className="branch-schedule-label">Work Calendar</div>
                            <div className="branch-schedule-value">5-Day Week (Mon-Fri)</div>
                          </div>
                        </div>

                        <div className="branch-schedule-card">
                          <div className="branch-schedule-icon hol">
                            <FaUmbrellaBeach />
                          </div>
                          <div>
                            <div className="branch-schedule-label">Holiday Schedule</div>
                            <div className="branch-schedule-value">State Holidays</div>
                          </div>
                        </div>

                        <div className="branch-schedule-card">
                          <div className="branch-schedule-icon fy">
                            <FaCalendarAlt />
                          </div>
                          <div>
                            <div className="branch-schedule-label">Financial Year</div>
                            <div className="branch-schedule-value">FY 2026 - 2027</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* Child Sub-Modules Scoped to Branch */}
          {detailActiveTab === "departments" && <DepartmentsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "designations" && <DesignationsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "teams" && <TeamsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "locations" && <LocationsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "reporting" && <ReportingHierarchySection lockedBranchId={lockedBId} />}
          {detailActiveTab === "job-grades" && <JobGradesSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "cost-centers" && <CostCentersSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "work-calendars" && <WorkCalendarsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "shifts" && <ShiftsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "holidays" && <HolidayCalendarsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "financial-years" && <FinancialYearsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "settings" && <BranchSettingsSection lockedBranchId={lockedBId} />}
        </div>
      </div>
    );
  }

  // Computed metrics for KPI stats cards
  const totalBranchesCount = totalRecords || branches.length;
  const activeBranchesCount = branches.filter((b) => b.status === "ACTIVE").length;
  const inactiveBranchesCount = branches.filter((b) => b.status === "INACTIVE").length;
  const totalStaffCount = onboardedStaff.length;
  const geofencedBranchesCount = branches.filter((b) => b.latitude && b.longitude).length;
  const citiesCount = cityOptions.length;

  // =========================================================================
  // VIEW 1: ENTERPRISE BRANCH MANAGEMENT WORKSPACE
  // =========================================================================
  return (
    <div className="branches-workspace">
      {/* ── 1. Top Header Bar with Breadcrumb ── */}
      <div className="branches-header-bar">
        <div>
          <div className="branches-breadcrumbs">
            {onBackToOrg ? (
              <span className="branches-breadcrumb-link" onClick={onBackToOrg}>
                Organization Hub
              </span>
            ) : (
              <span>Organization</span>
            )}
            <span>/</span>
            <span className="branches-breadcrumb-current">Branches Directory</span>
          </div>

          <div className="branches-header-title-wrap">
            <h2 className="branches-main-title">Regional Branches</h2>
            <span className="branches-count-pill">
              <FaCodeBranch /> {totalBranchesCount} Total ({activeBranchesCount} Active)
            </span>
          </div>
          <p className="branches-header-subtitle">
            Configure regional office locations, physical workspaces, GPS geofencing perimeters, and branch leadership.
          </p>
        </div>

        <div className="branches-header-actions">
          <button
            type="button"
            className="branches-btn-secondary"
            onClick={() => {
              loadBranches();
              loadAuxData();
            }}
            title="Refresh Branch Records"
          >
            <FaSyncAlt className={loading ? "fa-spin" : ""} /> Refresh
          </button>

          {canCreate && (
            <button
              type="button"
              className="branches-btn-add"
              onClick={handleOpenAddBranch}
            >
              <FaPlus /> Add New Branch
            </button>
          )}
        </div>
      </div>

      {/* ── 2. KPI Summary Metric Cards ── */}
      <div className="branches-kpi-grid">
        <div className="branches-kpi-card">
          <div className="branches-kpi-icon-box gold">
            <FaBuilding />
          </div>
          <div className="branches-kpi-info">
            <div className="branches-kpi-label">Active Facilities</div>
            <div className="branches-kpi-value">{activeBranchesCount}</div>
            <div className="branches-kpi-subtext">
              {inactiveBranchesCount > 0 ? `${inactiveBranchesCount} Inactive` : "100% Operational"}
            </div>
          </div>
        </div>

        <div className="branches-kpi-card">
          <div className="branches-kpi-icon-box blue">
            <FaUsers />
          </div>
          <div className="branches-kpi-info">
            <div className="branches-kpi-label">Assigned Workforce</div>
            <div className="branches-kpi-value">{totalStaffCount}</div>
            <div className="branches-kpi-subtext">Across all locations</div>
          </div>
        </div>

        <div className="branches-kpi-card">
          <div className="branches-kpi-icon-box emerald">
            <FaCrosshairs />
          </div>
          <div className="branches-kpi-info">
            <div className="branches-kpi-label">GPS Geofenced</div>
            <div className="branches-kpi-value">{geofencedBranchesCount}</div>
            <div className="branches-kpi-subtext">Mobile clock-in enabled</div>
          </div>
        </div>

        <div className="branches-kpi-card">
          <div className="branches-kpi-icon-box purple">
            <FaCity />
          </div>
          <div className="branches-kpi-info">
            <div className="branches-kpi-label">Cities & Regions</div>
            <div className="branches-kpi-value">{citiesCount || 1}</div>
            <div className="branches-kpi-subtext">Geographic coverage</div>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <FaExclamationTriangle className="text-danger flex-shrink-0" />
            <span>{error}</span>
          </div>
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")} className="mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <FaCheckCircle className="text-success flex-shrink-0" />
            <span>{success}</span>
          </div>
        </Alert>
      )}

      {/* ── 3. Search & Filter Toolbar ── */}
      <div className="branches-toolbar-card">
        <div className="branches-toolbar-row">
          <div className="branches-search-wrap">
            <FaSearch className="branches-search-icon" />
            <input
              type="text"
              className="branches-search-input"
              placeholder="Search branch name, code, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="branches-filter-group">
            <select
              className="branches-filter-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Branch Types</option>
              {BRANCH_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              className="branches-filter-select"
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Cities ({cityOptions.length})</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="branches-filter-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            <div className="branches-view-toggle">
              <button
                type="button"
                className={`branches-view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid Cards View"
              >
                <FaThLarge />
              </button>
              <button
                type="button"
                className={`branches-view-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table List View"
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Main Branches List / Cards ── */}
      {loading ? (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-3">
          <Spinner animation="border" style={{ color: "#C49A55" }} />
          <p className="mt-3 text-muted fw-semibold">Loading enterprise branch directory...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="branches-empty-state">
          <div className="branches-empty-icon">
            <FaBuilding />
          </div>
          <h4 className="branches-empty-title">No Branches Found</h4>
          <p className="branches-empty-text">
            {search || filterType || filterCity || filterStatus
              ? "No branches match your current search and filter criteria. Try resetting your filters."
              : "Create your first regional branch facility to organize physical locations, geofenced mobile attendance, and departmental staff."}
          </p>
          {canCreate && (
            <button
              type="button"
              className="branches-btn-add"
              onClick={handleOpenAddBranch}
            >
              <FaPlus /> Add Your First Branch
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID CARDS VIEW ── */
        <div className="branches-grid">
          {branches.map((b) => {
            const bId = b._id || b.id;
            const membersCount = getBranchMembers(bId).length;
            const headObj = employees.find(
              (e) => String(e._id || e.id) === String(b.branchHeadId?._id || b.branchHeadId)
            );
            const managerName = headObj ? (headObj.fullName || `${headObj.firstName} ${headObj.lastName || ""}`) : null;
            const managerInitials = managerName
              ? managerName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
              : "BM";

            return (
              <div key={bId} className="branch-card">
                {/* Header */}
                <div className="branch-card-header">
                  <div className="d-flex align-items-center gap-3">
                    <div className="branch-card-avatar">
                      <FaBuilding />
                    </div>
                    <div className="branch-card-title-box">
                      <h4
                        className="branch-card-name"
                        onClick={() => setSelectedBranchDetail(b)}
                        title="Click to open full branch workspace"
                      >
                        {b.branchName}
                      </h4>
                      <div className="branch-card-meta">
                        <span className="branch-code-badge">{b.branchCode}</span>
                        <span className="branch-type-pill">
                          {b.branchType?.replace(/_/g, " ") || "BRANCH"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`branch-status-indicator ${
                      b.status === "ACTIVE" ? "active" : "inactive"
                    }`}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: b.status === "ACTIVE" ? "#10b981" : "#94a3b8",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {b.status || "ACTIVE"}
                  </span>
                </div>

                {/* Body */}
                <div className="branch-card-body">
                  {/* Location & Address */}
                  <div className="branch-info-row">
                    <FaMapMarkerAlt className="branch-info-icon red" />
                    <span className="text-truncate">
                      {[b.address, b.city, b.state].filter(Boolean).join(", ") || "Address not provided"}
                    </span>
                  </div>

                  {/* Manager */}
                  {managerName ? (
                    <div className="branch-manager-chip">
                      <div className="branch-manager-avatar">{managerInitials}</div>
                      <div>
                        <div className="branch-manager-name">{managerName}</div>
                        <div className="branch-manager-title">Branch Head / Director</div>
                      </div>
                    </div>
                  ) : (
                    <div className="branch-info-row text-muted">
                      <FaUserTie className="branch-info-icon" />
                      <span className="small">No designated manager assigned</span>
                    </div>
                  )}

                  {/* Stats Strip */}
                  <div className="branch-card-stats-strip">
                    <div className="branch-stat-mini-item">
                      <span className="branch-stat-mini-label">Staff Assigned</span>
                      <span className="branch-stat-mini-value">
                        <FaUsers className="me-1 text-muted" size={12} /> {membersCount} Team Members
                      </span>
                    </div>
                    <div className="branch-stat-mini-item">
                      <span className="branch-stat-mini-label">GPS Geofence</span>
                      <span className="branch-stat-mini-value">
                        <FaCrosshairs className="me-1 text-warning" size={12} />
                        {b.latitude && b.longitude ? `${b.officeRadiusMeters || 200}m Radius` : "Unset"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="branch-card-footer">
                  <button
                    type="button"
                    className="branch-btn-hub"
                    onClick={() => setSelectedBranchDetail(b)}
                  >
                    Open Branch Hub <FaArrowRight size={11} />
                  </button>

                  <div className="branch-card-action-group">
                    {canUpdate && (
                      <button
                        type="button"
                        className="branch-card-action-btn"
                        onClick={() => handleOpenAssignModal(b)}
                        title="Manage Staff Assignments"
                      >
                        <FaUserPlus />
                      </button>
                    )}

                    {canUpdate && (
                      <button
                        type="button"
                        className="branch-card-action-btn"
                        onClick={() => handleOpenEditBranch(b)}
                        title="Edit Branch Settings"
                      >
                        <FaEdit />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="branch-card-action-btn danger"
                        onClick={() => {
                          setDeactivatingBranch(b);
                          setShowDeactivateModal(true);
                        }}
                        title="Deactivate Branch"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE LIST VIEW ── */
        <div className="branches-table-card mb-4">
          <Table responsive hover className="branches-table align-middle">
            <thead>
              <tr>
                <th>Branch Facility</th>
                <th>Branch Code</th>
                <th>Type</th>
                <th>Location / City</th>
                <th>Branch Head</th>
                <th>Staff</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => {
                const bId = b._id || b.id;
                const membersCount = getBranchMembers(bId).length;
                const headObj = employees.find(
                  (e) => String(e._id || e.id) === String(b.branchHeadId?._id || b.branchHeadId)
                );
                const managerName = headObj ? (headObj.fullName || `${headObj.firstName} ${headObj.lastName || ""}`) : null;

                return (
                  <tr key={bId}>
                    <td>
                      <div
                        className="d-flex align-items-center gap-2 text-decoration-none fw-bold"
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedBranchDetail(b)}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "linear-gradient(135deg, #1C1D1D 0%, #2A2B2C 100%)",
                            color: "#E2C278",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          <FaBuilding />
                        </div>
                        <span className="text-dark hover-gold">{b.branchName}</span>
                      </div>
                    </td>

                    <td>
                      <span className="branch-code-badge">{b.branchCode}</span>
                    </td>

                    <td>
                      <span className="branch-type-pill">
                        {b.branchType?.replace(/_/g, " ") || "BRANCH"}
                      </span>
                    </td>

                    <td>
                      <span className="d-flex align-items-center gap-1">
                        <FaMapMarkerAlt className="text-danger small" />
                        {[b.city, b.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>

                    <td>
                      {managerName ? (
                        <span className="d-flex align-items-center gap-1">
                          <FaUserTie className="text-primary small" /> {managerName}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    <td>
                      <Badge bg="light" text="dark" className="border px-2 py-1">
                        <FaUsers className="me-1 text-muted" /> {membersCount}
                      </Badge>
                    </td>

                    <td>
                      <span
                        className={`branch-status-indicator ${
                          b.status === "ACTIVE" ? "active" : "inactive"
                        }`}
                      >
                        {b.status || "ACTIVE"}
                      </span>
                    </td>

                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className="branch-card-action-btn"
                          onClick={() => setSelectedBranchDetail(b)}
                          title="Open Branch Workspace"
                        >
                          <FaEye />
                        </button>
                        {canUpdate && (
                          <button
                            type="button"
                            className="branch-card-action-btn"
                            onClick={() => handleOpenAssignModal(b)}
                            title="Manage Staff"
                          >
                            <FaUserPlus />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            type="button"
                            className="branch-card-action-btn"
                            onClick={() => handleOpenEditBranch(b)}
                            title="Edit Branch"
                          >
                            <FaEdit />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="branch-card-action-btn danger"
                            onClick={() => {
                              setDeactivatingBranch(b);
                              setShowDeactivateModal(true);
                            }}
                            title="Deactivate Branch"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-4 border shadow-sm mb-4">
          <span className="small text-muted fw-semibold">
            Showing page {page} of {totalPages} ({totalRecords} records)
          </span>
          <Pagination size="sm" className="mb-0">
            <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
            {Array.from({ length: totalPages }).map((_, idx) => (
              <Pagination.Item key={idx + 1} active={page === idx + 1} onClick={() => setPage(idx + 1)}>
                {idx + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} />
          </Pagination>
        </div>
      )}



      {/* ── Assign Members Modal ── */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton className="border-bottom px-4 py-3">
          <Modal.Title className="fs-5 fw-bold d-flex align-items-center gap-2">
            <FaUserPlus className="text-success" /> Manage Staff — {selectedBranchForMembers?.branchName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {assignModalError && <Alert variant="danger">{assignModalError}</Alert>}
          {assignModalSuccess && <Alert variant="success">{assignModalSuccess}</Alert>}

          <div className="mb-3">
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
              <Form.Control
                className="border-start-0 ps-0"
                placeholder="Search staff by name, email, or department..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            <Table hover responsive className="align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Primary Branch</th>
                </tr>
              </thead>
              <tbody>
                {onboardedStaff
                  .filter((emp) => {
                    const q = memberSearch.toLowerCase();
                    return !q || emp.fullName.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q);
                  })
                  .map((emp) => {
                    const empId = String(emp._id || emp.id);
                    const isChecked = selectedMemberIds.has(empId);
                    return (
                      <tr key={empId} onClick={() => toggleMember(empId)} role="button">
                        <td>
                          <Form.Check
                            checked={isChecked}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{emp.fullName}</div>
                          <div className="small text-muted">{emp.email}</div>
                        </td>
                        <td className="small text-dark">{emp.designation}</td>
                        <td className="small text-dark">{emp.department}</td>
                        <td>
                          {emp.primaryBranchId ? (
                            <Badge bg="light" text="dark" className="border">
                              Assigned
                            </Badge>
                          ) : (
                            <span className="text-muted small">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light px-4 py-3 border-top d-flex justify-content-between">
          <span className="small text-muted"><strong>{selectedMemberIds.size}</strong> staff selected</span>
          <div className="d-flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAssignModal(false)} disabled={assignLoading}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={handleSaveMembers} disabled={assignLoading}>
              {assignLoading ? <Spinner animation="border" size="sm" /> : "Save Staff Assignments"}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ── Deactivate Confirm Modal ── */}
      <Modal show={showDeactivateModal} onHide={() => setShowDeactivateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold text-danger">
            Deactivate {deactivatingBranch?.branchName}?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Existing employee and HR records will be retained, but the branch will no longer be available for new employee assignments or active attendance clock-ins.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowDeactivateModal(false)} disabled={deactivatingLoading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmDeactivate} disabled={deactivatingLoading}>
            {deactivatingLoading ? "Deactivating..." : "Deactivate Branch"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
