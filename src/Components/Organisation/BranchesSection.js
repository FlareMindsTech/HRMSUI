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

export default function BranchesSection({ onSelectBranch = null, onToggleFullView = null }) {
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
  // VIEW 2: BRANCH DETAIL VIEW (When a user clicks on a branch)
  // =========================================================================
  if (selectedBranchDetail) {
    const b = selectedBranchDetail;
    const lockedBId = b._id || b.id;
    const branchMembers = getBranchMembers(lockedBId);
    const headObj = employees.find((e) => String(e._id || e.id) === String(b.branchHeadId?._id || b.branchHeadId));

    return (
      <div className="branch-detail-view">
        {/* ── Top Back Button & Branch Banner ── */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-flex align-items-center gap-1 fw-semibold"
            onClick={() => setSelectedBranchDetail(null)}
          >
            <FaArrowLeft /> Back to All Branches
          </Button>

          <div className="d-flex align-items-center gap-2">
            {canUpdate && (
              <Button
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center gap-1 fw-semibold"
                onClick={() => handleOpenEditBranch(b)}
              >
                <FaEdit /> Edit Branch
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="outline-success"
                size="sm"
                className="d-flex align-items-center gap-1 fw-semibold"
                onClick={() => handleOpenAssignModal(b)}
              >
                <FaUserPlus /> Manage Staff ({branchMembers.length})
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  setDeactivatingBranch(b);
                  setShowDeactivateModal(true);
                }}
              >
                Deactivate
              </Button>
            )}
          </div>
        </div>

        {/* ── Branch Header Card ── */}
        <Card className="border shadow-sm mb-4 bg-white">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: "var(--primary-gradient)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    flexShrink: 0,
                  }}
                >
                  <FaCodeBranch />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h4 className="fw-bold text-dark mb-0">{b.branchName}</h4>
                    <Badge bg={b.status === "ACTIVE" ? "success" : "secondary"}>
                      {b.status || "ACTIVE"}
                    </Badge>
                    <Badge bg="light" text="dark" className="border">
                      {b.branchType?.replace("_", " ") || "BRANCH"}
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center gap-3 mt-1 text-muted small flex-wrap">
                    <span className="font-monospace fw-semibold text-secondary">Code: {b.branchCode}</span>
                    <span>•</span>
                    <span className="d-flex align-items-center gap-1">
                      <FaMapMarkerAlt className="text-danger" /> {[b.city, b.state, b.country].filter(Boolean).join(", ")}
                    </span>
                    {headObj && (
                      <>
                        <span>•</span>
                        <span className="d-flex align-items-center gap-1">
                          <FaUserTie className="text-primary" /> Manager: {headObj.fullName || `${headObj.firstName} ${headObj.lastName || ""}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Branch Locked Scope Badge */}
              <div className="p-2 px-3 bg-light rounded border text-end">
                <div className="small fw-semibold text-secondary">Scoped Branch ID</div>
                <div className="font-monospace small text-dark fw-bold">{lockedBId}</div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ── Compact Top Overview Cards ── */}
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border shadow-sm text-center py-3 bg-white">
              <div className="small text-muted fw-semibold">Branch Employees</div>
              <div className="fs-3 fw-bold text-dark mt-1">{branchMembers.length}</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border shadow-sm text-center py-3 bg-white">
              <div className="small text-muted fw-semibold">Geofence Perimeter</div>
              <div className="fs-3 fw-bold text-dark mt-1">{b.officeRadiusMeters || 200}m</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border shadow-sm text-center py-3 bg-white">
              <div className="small text-muted fw-semibold">Time Zone</div>
              <div className="fs-6 fw-bold text-dark mt-2 text-truncate">{b.timeZone || "Asia/Kolkata"}</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border shadow-sm text-center py-3 bg-white">
              <div className="small text-muted fw-semibold">Operating Status</div>
              <div className="fs-6 fw-bold text-success mt-2">{b.status || "ACTIVE"}</div>
            </Card>
          </Col>
        </Row>

        {/* ── Child Navigation Tabs (Locked to this exact branch!) ── */}
        <Tab.Container activeKey={detailActiveTab} onSelect={(k) => setDetailActiveTab(k || "overview")}>
          <Nav variant="tabs" className="mb-4 bg-white p-2 rounded border shadow-sm flex-nowrap overflow-auto no-scrollbar">
            <Nav.Item>
              <Nav.Link eventKey="overview" className="fw-semibold text-nowrap">Overview</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="departments" className="fw-semibold text-nowrap">Departments</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="designations" className="fw-semibold text-nowrap">Designations</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="teams" className="fw-semibold text-nowrap">Teams</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="locations" className="fw-semibold text-nowrap">Locations</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="reporting" className="fw-semibold text-nowrap">Reporting</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="job-grades" className="fw-semibold text-nowrap">Job Grades</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="cost-centers" className="fw-semibold text-nowrap">Cost Centers</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="work-calendars" className="fw-semibold text-nowrap">Work Calendar</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="shifts" className="fw-semibold text-nowrap">Shifts</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="holidays" className="fw-semibold text-nowrap">Holidays</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="financial-years" className="fw-semibold text-nowrap">Financial Year</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="settings" className="fw-semibold text-nowrap">Branch Settings</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Tab: Overview */}
            <Tab.Pane eventKey="overview">
              <Row className="g-4">
                <Col md={6}>
                  <Card className="border shadow-sm h-100 bg-white">
                    <Card.Header className="bg-white border-bottom py-3">
                      <h6 className="fw-bold mb-0 text-dark">Branch Identification & Address</h6>
                    </Card.Header>
                    <Card.Body className="p-3">
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted small">Branch Name:</span>
                          <span className="fw-semibold text-dark">{b.branchName}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted small">Branch Code:</span>
                          <span className="font-monospace fw-bold text-dark">{b.branchCode}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted small">Physical Address:</span>
                          <span className="text-dark">{b.address || "—"}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted small">City / State:</span>
                          <span className="text-dark">{[b.city, b.state].filter(Boolean).join(", ") || "—"}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1">
                          <span className="text-muted small">PIN / Postal Code:</span>
                          <span className="font-monospace text-dark">{b.pincode || "—"}</span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border shadow-sm h-100 bg-white">
                    <Card.Header className="bg-white border-bottom py-3">
                      <h6 className="fw-bold mb-0 text-dark">Attendance & Coordinates</h6>
                    </Card.Header>
                    <Card.Body className="p-3">
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted small">GPS Coordinates:</span>
                          <span className="font-monospace text-dark">
                            {b.latitude && b.longitude ? `${b.latitude}, ${b.longitude}` : "Not Set"}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted small">Geofence Radius:</span>
                          <span className="fw-semibold text-dark">{b.officeRadiusMeters || 200} Meters</span>
                        </div>
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted small">Branch Email:</span>
                          <span className="text-dark">{b.email || "—"}</span>
                        </div>
                        <div className="d-flex justify-content-between py-1">
                          <span className="text-muted small">Branch Phone:</span>
                          <span className="text-dark">{b.phone || "—"}</span>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* Child Tab Panes with lockedBranchId prop! */}
            <Tab.Pane eventKey="departments">
              <DepartmentsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="designations">
              <DesignationsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="teams">
              <TeamsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="locations">
              <LocationsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="reporting">
              <ReportingHierarchySection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="job-grades">
              <JobGradesSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="cost-centers">
              <CostCentersSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="work-calendars">
              <WorkCalendarsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="shifts">
              <ShiftsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="holidays">
              <HolidayCalendarsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="financial-years">
              <FinancialYearsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
            <Tab.Pane eventKey="settings">
              <BranchSettingsSection lockedBranchId={lockedBId} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: BRANCH MANAGEMENT LIST / TABLE
  // =========================================================================
  return (
    <div className="branches-section">
      {/* ── Section Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <FaCodeBranch className="text-success" /> Branches
          </h3>
          <p className="text-muted small mb-0">
            Manage locations and branch-specific organization structure.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="success"
            className="d-flex align-items-center gap-2 fw-semibold shadow-sm"
            onClick={handleOpenAddBranch}
          >
            <FaPlus /> Add Branch
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Search & Filter Toolbar ── */}
      <Card className="border shadow-sm mb-4 bg-white">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  className="border-start-0 ps-0"
                  placeholder="Search branch name, code, or city..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </InputGroup>
            </Col>

            <Col md={3}>
              <Form.Select
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
              </Form.Select>
            </Col>

            <Col md={3}>
              <Form.Select
                value={filterCity}
                onChange={(e) => {
                  setFilterCity(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Cities</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Select
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

      {/* ── Branches Table / Card View ── */}
      <Card className="border shadow-sm bg-white">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3 text-muted">Loading branch records...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-5 p-4">
              <FaBuilding className="text-muted fs-1 mb-3 opacity-50" />
              <h5 className="fw-bold text-dark">No branches yet</h5>
              <p className="text-muted small mb-3">
                Create your first branch to start configuring your organization's HR structure.
              </p>
              {canCreate && (
                <Button variant="success" size="sm" onClick={handleOpenAddBranch}>
                  <FaPlus className="me-1" /> Add Branch
                </Button>
              )}
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light text-secondary small">
                <tr>
                  <th className="ps-4">Branch Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>City / Location</th>
                  <th>Branch Manager</th>
                  <th>Employees</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => {
                  const bId = b._id || b.id;
                  const membersCount = getBranchMembers(bId).length;
                  const headObj = employees.find((e) => String(e._id || e.id) === String(b.branchHeadId?._id || b.branchHeadId));

                  return (
                    <tr key={bId}>
                      <td className="ps-4">
                        <div
                          className="fw-bold text-dark d-flex align-items-center gap-2 text-decoration-none"
                          role="button"
                          onClick={() => setSelectedBranchDetail(b)}
                        >
                          <FaCodeBranch className="text-success" />
                          <span className="text-primary">{b.branchName}</span>
                        </div>
                      </td>

                      <td>
                        <span className="font-monospace fw-bold text-secondary">{b.branchCode}</span>
                      </td>

                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {b.branchType?.replace("_", " ") || "BRANCH"}
                        </Badge>
                      </td>

                      <td>
                        <span className="d-flex align-items-center gap-1 text-dark">
                          <FaMapMarkerAlt className="text-danger small" />
                          {[b.city, b.state].filter(Boolean).join(", ") || "—"}
                        </span>
                      </td>

                      <td>
                        {headObj ? (
                          <span className="d-flex align-items-center gap-1 text-dark">
                            <FaUserTie className="text-primary small" />
                            {headObj.fullName || `${headObj.firstName} ${headObj.lastName || ""}`}
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
                        <Badge bg={b.status === "ACTIVE" ? "success" : "secondary"}>
                          {b.status || "ACTIVE"}
                        </Badge>
                      </td>

                      <td className="text-end pe-4">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="p-1 px-2 d-flex align-items-center gap-1"
                            onClick={() => setSelectedBranchDetail(b)}
                            title="View Branch Overview & Child Structure"
                          >
                            <FaEye /> View
                          </Button>

                          {canUpdate && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="p-1 px-2"
                              onClick={() => handleOpenEditBranch(b)}
                              title="Edit Branch Information"
                            >
                              <FaEdit />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="p-1 px-2"
                              onClick={() => {
                                setDeactivatingBranch(b);
                                setShowDeactivateModal(true);
                              }}
                              title="Deactivate Branch"
                            >
                              <FaTrash />
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
        </Card.Body>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="bg-white border-top py-2 d-flex justify-content-between align-items-center">
            <span className="small text-muted">Showing page {page} of {totalPages} ({totalRecords} records)</span>
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Pagination.Item key={idx + 1} active={page === idx + 1} onClick={() => setPage(idx + 1)}>
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>



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
