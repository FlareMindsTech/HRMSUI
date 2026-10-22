import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  InputGroup,
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
  FaUserMinus,
} from "react-icons/fa";
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  fetchEmployeesDropdown,
  fetchOnboardedEmployees,
  assignEmployeesToBranch,
  removeEmployeeFromBranch,
  fetchFinancialYearsDropdown,
  fetchDepartments,
} from "../../services/organizationService";
import { useSelector, useDispatch } from 'react-redux';
import { useHasPermission, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import {
  fetchOrgResource,
  invalidateOrgResource,
  selectShiftsDropdown,
  selectWorkCalendarsDropdown,
  selectHolidayCalendarsDropdown,
} from '../../redux/slices/organizationSlice';
import { useSearchParams, useNavigate } from "react-router-dom";
import PaginationBar from "../Common/PaginationBar";
import FeedbackAlert from "../Common/FeedbackAlert";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useBranch } from "../../context/BranchContext";
import "../../Pages/Dashboard/HrOnboarding.css";
import "./BranchesSection.css";
import "./navigation/OrgWorkspaceNav.css";
import OrgWorkspaceNav from "./navigation/OrgWorkspaceNav";

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
import LeaveSettingsSection from "./LeaveSettingsSection";
import BranchSettingsSection from "./BranchSettingsSection";
import {
  BRANCH_NAV_GROUPS,
  filterNavGroups,
  sanitizeBranchTab,
} from "./navigation/orgNavConfig";

const BRANCH_TYPES = [
  { value: "HEAD_OFFICE", label: "Head Office (HQ)" },
  { value: "REGIONAL_OFFICE", label: "Regional Office" },
  { value: "BRANCH_OFFICE", label: "Branch Office" },
  { value: "VIRTUAL", label: "Virtual / Remote Office" },
];

export default function BranchesSection({
  onSelectBranch = null,
  onToggleFullView = null,
  onBackToOrg = null,
  isStandaloneView = false,
  onNavigateTab = null,
}) {
  const hasPermission = useHasPermission();
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const { organization, refreshBranches, setSelectedBranchId } = useBranch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Shared shift/calendar dropdowns (single guarded fetches); branch-scoped
  // employee lists and the financial-years picker stay local/direct.
  const cachedShifts = useSelector(selectShiftsDropdown);
  const cachedWorkCalendars = useSelector(selectWorkCalendarsDropdown);
  const cachedHolidayCalendars = useSelector(selectHolidayCalendarsDropdown);
  const auxCacheRef = useRef(null);
  auxCacheRef.current = {
    sh: cachedShifts,
    wc: cachedWorkCalendars,
    hol: cachedHolidayCalendars,
  };
  const [branches, setBranches] = useState([]);
  const [allOrgBranches, setAllOrgBranches] = useState([]);
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
  const [showPostCreateModal, setShowPostCreateModal] = useState(false);
  const [postCreatedBranch, setPostCreatedBranch] = useState(null);

  // Assign Members Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranchForMembers, setSelectedBranchForMembers] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [assignAsPrimary, setAssignAsPrimary] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberAssignFilter, setMemberAssignFilter] = useState("all"); // 'all' | 'other' | 'current' | 'unassigned'
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignModalError, setAssignModalError] = useState("");
  const [assignModalSuccess, setAssignModalSuccess] = useState("");

  // Branch Members Tab Search & Filters
  const [branchMemberSearch, setBranchMemberSearch] = useState("");
  const [branchMemberDeptFilter, setBranchMemberDeptFilter] = useState("");

  // Remove Member Confirm Modal State
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);

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

  // Branch workspace navigation: only tabs the user may view.
  const canViewCode = useCallback(
    (code) => Boolean(isSystemAdmin || hasPermission(code)),
    [isSystemAdmin, hasPermission]
  );
  const branchNavGroups = useMemo(() => {
    const visible = filterNavGroups(BRANCH_NAV_GROUPS, canViewCode);
    return visible.length > 0 ? visible : BRANCH_NAV_GROUPS.slice(0, 1);
  }, [canViewCode]);

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
        if (!filterType && !filterStatus && !filterCity && !search && Array.isArray(res.data)) {
          setAllOrgBranches(res.data);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus, filterCity]);

  // Load complete tenant branches list to power accurate dynamic filters without dead options
  const loadAllOrgBranches = useCallback(async () => {
    try {
      const res = await fetchBranches({ page: 1, limit: 1000 });
      if (res?.success && Array.isArray(res.data)) {
        setAllOrgBranches(res.data);
      }
    } catch (e) {
      console.warn("Could not load full branches list for dynamic filters:", e);
    }
  }, []);

  const [allDepartments, setAllDepartments] = useState([]);

  // Load Auxiliary Dropdowns
  const loadAuxData = useCallback(async () => {
    try {
      const [dropdownList, fullStaff, shRes, wcRes, holRes, fyList, deptsRes] = await Promise.all([
        fetchEmployeesDropdown().catch(() => []),
        fetchOnboardedEmployees().catch(() => []),
        dispatch(fetchOrgResource({ key: "shifts" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "workCalendars" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "holidayCalendars" })).catch(() => null),
        fetchFinancialYearsDropdown().catch(() => []),
        fetchDepartments({ page: 1, limit: 1000 }).catch(() => ({ data: [] })),
      ]);
      setEmployees(dropdownList || []);
      setOnboardedStaff(fullStaff || []);
      setShifts(shRes?.payload?.data ?? auxCacheRef.current?.sh ?? []);
      setWorkCalendars(wcRes?.payload?.data ?? auxCacheRef.current?.wc ?? []);
      setHolidayCalendars(holRes?.payload?.data ?? auxCacheRef.current?.hol ?? []);
      setFinancialYears(fyList || []);
      const depts = deptsRes?.data || (Array.isArray(deptsRes) ? deptsRes : []);
      setAllDepartments(depts);
    } catch (e) {
      console.warn("Failed to load aux data for branches:", e);
    }
  }, [dispatch]);

  const getBranchDepartments = useCallback(
    (branchId) => {
      if (!branchId) return [];
      return allDepartments.filter((d) => {
        const bId = d.branchId?._id || d.branchId;
        return String(bId) === String(branchId);
      });
    },
    [allDepartments]
  );

  const handleSelectBranch = useCallback((branch, defaultTab = "overview") => {
    if (!branch) return;
    setSelectedBranchDetail(branch);
    setDetailActiveTab(defaultTab);
    const bId = branch._id || branch.id;
    if (setSelectedBranchId) setSelectedBranchId(bId);
    if (onSelectBranch) onSelectBranch(branch);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("branchId", bId);
        if (defaultTab && defaultTab !== "overview") {
          next.set("tab", defaultTab);
        } else {
          next.delete("tab");
        }
        next.delete("action");
        return next;
      },
      { replace: true }
    );
  }, [setSelectedBranchId, onSelectBranch, setSearchParams]);

  const handleBackToAllBranches = useCallback(() => {
    setSelectedBranchDetail(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("branchId");
        next.delete("tab");
        next.delete("action");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const handleOpenBranchDepartments = useCallback((branch) => {
    handleSelectBranch(branch, "departments");
  }, [handleSelectBranch]);

  const handleDetailTabChange = useCallback((rawTabKey) => {
    const tabKey = sanitizeBranchTab(rawTabKey, canViewCode);
    setDetailActiveTab(tabKey);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tabKey && tabKey !== "overview") {
          next.set("tab", tabKey);
        } else {
          next.delete("tab");
        }
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams, canViewCode]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    loadAllOrgBranches();
  }, [loadAllOrgBranches]);

  useEffect(() => {
    loadAuxData();
  }, [loadAuxData]);

  // URL Deep-linking initialization & sync
  useEffect(() => {
    const bIdParam = searchParams.get("branchId");
    const tabParam = searchParams.get("tab");
    const actionParam = searchParams.get("action");

    if (actionParam === "new" || actionParam === "create") {
      if (!showAddModal) {
        handleOpenAddBranch();
      }
    }

    const pool = allOrgBranches.length > 0 ? allOrgBranches : branches;
    if (bIdParam && pool.length > 0) {
      const match = pool.find((b) => String(b._id || b.id) === String(bIdParam));
      if (match) {
        if (!selectedBranchDetail || String(selectedBranchDetail._id || selectedBranchDetail.id) !== String(bIdParam)) {
          setSelectedBranchDetail(match);
          if (setSelectedBranchId) setSelectedBranchId(bIdParam);
        }
        const safeTab = sanitizeBranchTab(tabParam, canViewCode);
        if (tabParam && safeTab !== detailActiveTab) {
          setDetailActiveTab(safeTab);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, allOrgBranches, searchParams, setSelectedBranchId]);

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

  // Consolidated master list of all tenant branches (full models)
  const masterBranchList = useMemo(() => {
    if (allOrgBranches.length > 0) return allOrgBranches;
    if (branches.length > 0) return branches;
    return [];
  }, [allOrgBranches, branches]);

  // Available Branch Types actually existing in this organization
  const availableBranchTypes = useMemo(() => {
    const typeMap = new Map();
    masterBranchList.forEach((b) => {
      const rawType = (b.branchType || "").toUpperCase();
      if (rawType) {
        typeMap.set(rawType, (typeMap.get(rawType) || 0) + 1);
      }
    });

    // ONLY return types that actually exist in the data — never show unwanted/dead types
    return BRANCH_TYPES.filter((t) => typeMap.has(t.value)).map((t) => ({
      ...t,
      count: typeMap.get(t.value) || 0,
    }));
  }, [masterBranchList]);

  // Unique Cities list with branch count (only existing cities)
  const cityOptions = useMemo(() => {
    const cityMap = new Map();
    masterBranchList.forEach((b) => {
      const c = (b.city || "").trim();
      if (c) {
        cityMap.set(c, (cityMap.get(c) || 0) + 1);
      }
    });
    return Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => a.city.localeCompare(b.city));
  }, [masterBranchList]);

  // Available Statuses actually existing in this organization
  const availableStatuses = useMemo(() => {
    const activeCount = masterBranchList.filter((b) => b.status === "ACTIVE").length;
    const inactiveCount = masterBranchList.filter((b) => b.status === "INACTIVE").length;
    const list = [];
    if (activeCount > 0) list.push({ value: "ACTIVE", label: `Active (${activeCount})` });
    if (inactiveCount > 0) list.push({ value: "INACTIVE", label: `Inactive (${inactiveCount})` });
    return list;
  }, [masterBranchList]);

  // Guaranteed Client-Side Filter: prevents unwanted branches from ever leaking into view
  const displayedBranches = useMemo(() => {
    let list = Array.isArray(branches) ? [...branches] : [];
    if (filterType) {
      list = list.filter((b) => (b.branchType || "").toUpperCase() === filterType.toUpperCase());
    }
    if (filterCity) {
      list = list.filter((b) => (b.city || "").trim().toLowerCase() === filterCity.trim().toLowerCase());
    }
    if (filterStatus) {
      list = list.filter((b) => (b.status || "").toUpperCase() === filterStatus.toUpperCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) =>
        (b.branchName || "").toLowerCase().includes(q) ||
        (b.branchCode || "").toLowerCase().includes(q) ||
        (b.city || "").toLowerCase().includes(q) ||
        (b.address || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [branches, filterType, filterCity, filterStatus, search]);

  // ── 5-Step Create / Edit Modal Openers ──
  const handleOpenAddBranch = () => {
    setEditingBranchId(null);
    setFormData(initialForm);
    setAddStep(1);
    setModalError("");
    setFormErrors({});
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
    setFormErrors({});
    setShowAddModal(true);
    if (onToggleFullView) onToggleFullView(true);
  };

  const handleCloseWizard = () => {
    setShowAddModal(false);
    setModalError("");
    setFormErrors({});
    if (onToggleFullView) onToggleFullView(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("action");
        return next;
      },
      { replace: true }
    );
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
      if (!formData.branchHeadId || !String(formData.branchHeadId).trim()) {
        errs.branchHeadId = "Branch Manager / Head is required.";
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
    if (!validateStep(1)) {
      setAddStep(1);
      return;
    }
    if (!validateStep(2)) {
      setAddStep(2);
      return;
    }

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
        const createdBranch = res?.data || res?.branch || {
          ...payload,
          _id: res?._id || res?.id || `branch-${Date.now()}`,
        };
        setSuccess(res?.message || "Branch created successfully!");
        setPostCreatedBranch(createdBranch);
        setShowPostCreateModal(true);
      }

      dispatch(invalidateOrgResource(["structure", "profile"]));
      handleCloseWizard();
      await Promise.all([loadBranches(), loadAllOrgBranches()]);
      if (refreshBranches) refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const mapped = err.mapped;
      setModalError(mapped?.message || err.message || "Failed to save branch");
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

  // ── Remove Member Modal Handlers ──
  const handleOpenRemoveMemberModal = (member) => {
    setMemberToRemove(member);
    setShowRemoveMemberModal(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !selectedBranchDetail) return;
    const bId = selectedBranchDetail._id || selectedBranchDetail.id;
    const empId = memberToRemove._id || memberToRemove.id;
    const empName = memberToRemove.fullName || "Employee";

    try {
      setRemoveMemberLoading(true);
      await removeEmployeeFromBranch(bId, empId);
      setSuccess(`${empName} successfully removed from ${selectedBranchDetail.branchName}.`);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
      await loadAuxData();
      await loadBranches();
      if (refreshBranches) refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to remove employee from branch");
      setTimeout(() => setError(""), 4000);
    } finally {
      setRemoveMemberLoading(false);
    }
  };

  // ── Soft Deactivate Handler (Backend DELETE /api/branch/:id) ──
  const handleConfirmDeactivate = async () => {
    if (!deactivatingBranch) return;
    try {
      setDeactivatingLoading(true);
      const bId = deactivatingBranch._id || deactivatingBranch.id;
      // Soft deactivation via authoritative DELETE endpoint
      const res = await deleteBranch(bId);
      setSuccess(res?.message || `Branch ${deactivatingBranch.branchName} deactivated successfully.`);
      setShowDeactivateModal(false);
      if (selectedBranchDetail && (selectedBranchDetail._id === bId || selectedBranchDetail.id === bId)) {
        setSelectedBranchDetail(null);
      }
      dispatch(invalidateOrgResource(["structure", "profile"]));
      await Promise.all([loadBranches(), loadAllOrgBranches()]);
      if (refreshBranches) refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const mapped = err.mapped;
      const msg = mapped?.message || err.message || "Failed to deactivate branch";
      setError(msg);
      setShowDeactivateModal(false);
      setTimeout(() => setError(""), 6000);
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
                <FeedbackAlert
                  variant="danger"
                  dismissible
                  onClose={() => setModalError("")}
                  className="mb-4 shadow-sm"
                  message={
                    <div className="d-flex align-items-center gap-2">
                      <FaExclamationTriangle className="text-danger flex-shrink-0" />
                      <span><strong>Action Required:</strong> {modalError}</span>
                    </div>
                  }
                />
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
                        <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                          <span>
                            BRANCH MANAGER / HEAD <span className="text-danger">*</span>
                          </span>
                          {formErrors.branchHeadId && (
                            <span className="text-danger extra-small fw-semibold">Required</span>
                          )}
                        </Form.Label>
                        <InputGroup hasValidation>
                          <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                            <FaUserTie size={14} />
                          </InputGroup.Text>
                          <Form.Select
                            required
                            value={formData.branchHeadId}
                            isInvalid={!!formErrors.branchHeadId}
                            onChange={(e) => {
                              setFormData({ ...formData, branchHeadId: e.target.value });
                              if (formErrors.branchHeadId) setFormErrors((p) => ({ ...p, branchHeadId: "" }));
                            }}
                            className="onboarding-dash-select ps-2"
                          >
                            <option value="">-- Select Branch Manager / Head --</option>
                            {employees.map((e) => (
                              <option key={e._id || e.id} value={e._id || e.id}>
                                {e.fullName || `${e.firstName} ${e.lastName || ""}`.trim()}
                              </option>
                            ))}
                          </Form.Select>
                        </InputGroup>
                        {formErrors.branchHeadId ? (
                          <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                            <FaExclamationTriangle size={11} /> {formErrors.branchHeadId}
                          </div>
                        ) : (
                          <Form.Text className="text-muted extra-small">Principal leader responsible for this branch unit.</Form.Text>
                        )}
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
                          {(() => {
                            const emp = employees.find((e) => String(e._id || e.id) === String(formData.branchHeadId));
                            return emp ? (emp.fullName || `${emp.firstName} ${emp.lastName || ""}`.trim()) : "Not Assigned";
                          })()}
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

                    <div className="mt-3.5 p-3 rounded-3 border bg-success-subtle border-success-subtle d-flex align-items-center gap-3">
                      <FaSitemap className="text-success fs-4 flex-shrink-0" />
                      <div>
                        <div className="fw-bold text-success-emphasis small">
                          Next Step in Flow: Configure Branch Departments & Staff
                        </div>
                        <div className="text-muted extra-small">
                          Once created, you will be prompted to set up departments (e.g. IT, Sales, HR) and assign personnel specifically to this regional facility.
                        </div>
                      </div>
                    </div>
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
                      {modalLoading ? <LoadingSpinner variant="button" size="sm" className="me-2" /> : <FaCheckCircle className="me-2" />}
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
                              color: isActive ? "var(--color-primary-light, #E2C278)" : isCompleted ? "#059669" : "#8E8A82",
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

    return (
      <div className="branch-detail-workspace">
        {/* ── 0. Breadcrumb Trail ── */}
        <div className="branches-breadcrumbs mb-3">
          <span
            className="branches-breadcrumb-link"
            onClick={onBackToOrg ? onBackToOrg : () => navigate("/organisation")}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (onBackToOrg) onBackToOrg(); else navigate("/organisation"); } }}
          >
            Organization Hub
          </span>
          <span>/</span>
          <span
            className="branches-breadcrumb-link"
            onClick={handleBackToAllBranches}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleBackToAllBranches(); } }}
          >
            Branches Directory
          </span>
          <span>/</span>
          <span className="branches-breadcrumb-current">{b.branchName}</span>
          <span>/</span>
          <span className="text-secondary fw-bold text-capitalize">
            {detailActiveTab.replace(/-/g, " ")}
          </span>
        </div>

        {/* ── 1. Top Action Bar & Navigation ── */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <button
              type="button"
              className="branches-btn-secondary"
              onClick={handleBackToAllBranches}
            >
              <FaArrowLeft /> Back to All Branches
            </button>

            {masterBranchList.length > 1 && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small fw-bold">Active Branch:</span>
                <select
                  className="form-select form-select-sm"
                  value={lockedBId}
                  onChange={(e) => {
                    const targetB = masterBranchList.find((br) => String(br._id || br.id) === e.target.value);
                    if (targetB) handleSelectBranch(targetB, detailActiveTab);
                  }}
                  style={{ width: "auto", minWidth: 200, fontWeight: 600, borderColor: "rgba(196, 154, 85, 0.4)" }}
                >
                  {masterBranchList.map((br) => (
                    <option key={br._id || br.id} value={br._id || br.id}>
                      {br.branchName} ({br.branchCode || "Branch"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

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

          </div>
        </div>

        {/* ── Workspace: ONE navigation + content. No duplicate step bar / jump menu. ── */}
        <div className="ows-layout">
          <OrgWorkspaceNav
            heading="Branch"
            groups={branchNavGroups}
            activeKey={detailActiveTab}
            onSelect={handleDetailTabChange}
            badges={{
              members: branchMembers.length,
              departments: getBranchDepartments(lockedBId).length,
            }}
          />
          <div className="ows-content">
            {/* Summary cards belong to the overview only; on other tabs they just push the work down. */}
            {detailActiveTab === "overview" && (
              <div className="mb-4">
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
              </div>
            )}

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

              {/* ── ROW 3: Branch Departments Spotlight ── */}
              <Row className="g-4 mt-1">
                <Col lg={12}>
                  <div className="branch-info-card">
                    <div className="branch-info-card-header">
                      <div className="d-flex align-items-center gap-2">
                        <div className="branch-card-icon-badge branch-card-icon-gold">
                          <FaSitemap />
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h5 className="branch-info-card-title mb-0">Branch Departments & Functional Units</h5>
                            {getBranchDepartments(lockedBId).length === 0 ? (
                              <span className="branch-dept-count-pill zero">0 Departments</span>
                            ) : (
                              <span className="branch-dept-count-pill active">
                                {getBranchDepartments(lockedBId).length} Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {canUpdate && (
                          <button
                            type="button"
                            className="branches-btn-add btn-sm"
                            onClick={() => {
                              handleDetailTabChange("departments");
                              setSearchParams((prev) => {
                                const next = new URLSearchParams(prev);
                                next.set("branchId", lockedBId);
                                next.set("tab", "departments");
                                next.set("action", "new-dept");
                                return next;
                              }, { replace: true });
                            }}
                          >
                            <FaPlus size={11} className="me-1" /> Add Branch Department
                          </button>
                        )}
                        <button
                          type="button"
                          className="branches-btn-secondary btn-sm"
                          onClick={() => handleDetailTabChange("departments")}
                        >
                          Manage Departments ({getBranchDepartments(lockedBId).length}) <FaArrowRight size={10} className="ms-1" />
                        </button>
                      </div>
                    </div>

                    <div className="branch-info-card-body">
                      {getBranchDepartments(lockedBId).length === 0 ? (
                        <div className="branch-empty-departments-wrap">
                          <div className="branch-empty-icon-glow">
                            <FaSitemap />
                          </div>
                          <h6 className="branch-empty-title">No Departments Assigned to This Branch Yet</h6>
                          <p className="branch-empty-desc">
                            Departments organize workforce reporting, assign department heads, and manage shift schedules for <strong>{b.branchName}</strong>. Create a dedicated branch unit or link from the master list.
                          </p>

                          <div className="branch-empty-features-grid">
                            <span className="branch-empty-feature-chip">
                              <FaUsers className="branch-empty-feature-chip-icon" /> Team Leads & HOD Mapping
                            </span>
                            <span className="branch-empty-feature-chip">
                              <FaClock className="branch-empty-feature-chip-icon" /> Shift & Attendance Scoping
                            </span>
                            <span className="branch-empty-feature-chip">
                              <FaCheckCircle className="branch-empty-feature-chip-icon" /> Departmental Approvals
                            </span>
                          </div>

                          <div className="branch-empty-actions-row">
                            {canUpdate && (
                              <button
                                type="button"
                                className="branches-btn-add"
                                onClick={() => {
                                  handleDetailTabChange("departments");
                                  setSearchParams((prev) => {
                                    const next = new URLSearchParams(prev);
                                    next.set("branchId", lockedBId);
                                    next.set("tab", "departments");
                                    next.set("action", "new-dept");
                                    return next;
                                  }, { replace: true });
                                }}
                              >
                                <FaPlus size={12} className="me-1" /> Create First Department for this Branch
                              </button>
                            )}
                            <button
                              type="button"
                              className="branches-btn-secondary"
                              onClick={() => handleDetailTabChange("departments")}
                            >
                              <FaBuilding size={12} className="me-1" /> View Master Organization Directory
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Row className="g-3">
                          {getBranchDepartments(lockedBId).map((dept) => (
                            <Col md={4} key={dept._id}>
                              <div className="branch-dept-card">
                                <div>
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h6 className="fw-bold text-dark mb-0 fs-6">{dept.departmentName}</h6>
                                    <span className="badge bg-light text-dark border font-monospace small px-2 py-1">
                                      {dept.departmentCode}
                                    </span>
                                  </div>
                                  <div className="text-muted small">
                                    {dept.departmentHeadId ? (
                                      <span><FaUserTie className="me-1 text-secondary" /> Head: {dept.departmentHeadId.firstName} {dept.departmentHeadId.lastName}</span>
                                    ) : (
                                      <span className="text-secondary opacity-75">No HOD assigned</span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between">
                                  <span className={`badge ${dept.status === 'ACTIVE' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.72rem' }}>
                                    {dept.status || 'ACTIVE'}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 text-decoration-none small fw-semibold"
                                    style={{ color: "var(--color-primary-dark, #9B7229)" }}
                                    onClick={() => setDetailActiveTab("departments")}
                                  >
                                    Manage in Branch Hub &rarr;
                                  </button>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* Child Sub-Modules Scoped to Branch */}
          {detailActiveTab === "members" && (
            <div className="branch-members-pane">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="branch-card-icon-badge branch-card-icon-gold">
                    <FaUsers />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h4 className="fw-bold mb-0 text-dark">Branch Members Directory</h4>
                      <span className="branch-dept-count-pill active">
                        {branchMembers.length} Members Assigned
                      </span>
                    </div>
                    <p className="text-muted extra-small mb-0 mt-0.5">
                      Personnel currently assigned to <strong>{b.branchName}</strong>. Directly add staff or transfer members from other branches.
                    </p>
                  </div>
                </div>

                {canUpdate && (
                  <button
                    type="button"
                    className="branches-btn-add btn-sm"
                    onClick={() => handleOpenAssignModal(b)}
                  >
                    <FaUserPlus size={12} className="me-1" /> Add / Transfer Members
                  </button>
                )}
              </div>

              {/* Toolbar & Department Filter */}
              {(() => {
                const departmentCounts = {};
                branchMembers.forEach((m) => {
                  const dept = m.department || "General";
                  departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
                });
                const departmentList = Object.keys(departmentCounts).sort();

                const filteredBranchMembers = branchMembers.filter((m) => {
                  const q = (branchMemberSearch || "").toLowerCase();
                  const matchSearch = !q ||
                    (m.fullName && m.fullName.toLowerCase().includes(q)) ||
                    (m.email && m.email.toLowerCase().includes(q)) ||
                    (m.employeeCode && m.employeeCode.toLowerCase().includes(q)) ||
                    (m.designation && m.designation.toLowerCase().includes(q));
                  const matchDept = !branchMemberDeptFilter || m.department === branchMemberDeptFilter;
                  return matchSearch && matchDept;
                });

                return (
                  <>
                    {/* Department Filter Pills */}
                    {departmentList.length > 0 && (
                      <div className="dept-branch-filter-bar mb-3">
                        <div className="dept-branch-filter-label">
                          <FaSitemap size={12} className="text-secondary" /> Filter by Department:
                        </div>
                        <div className="dept-branch-pills-wrap">
                          <button
                            type="button"
                            className={`dept-branch-pill ${!branchMemberDeptFilter ? "active" : ""}`}
                            onClick={() => setBranchMemberDeptFilter("")}
                          >
                            🏢 All Departments
                            <span className="dept-branch-pill-count">{branchMembers.length}</span>
                          </button>
                          {departmentList.map((dept) => (
                            <button
                              key={dept}
                              type="button"
                              className={`dept-branch-pill ${branchMemberDeptFilter === dept ? "active" : ""}`}
                              onClick={() => setBranchMemberDeptFilter(dept)}
                            >
                              {dept}
                              <span className="dept-branch-pill-count">{departmentCounts[dept]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="branches-toolbar-card mb-3">
                      <div className="branches-toolbar-row">
                        <div className="branches-search-wrap">
                          <FaSearch className="branches-search-icon" />
                          <input
                            type="text"
                            className="branches-search-input"
                            placeholder="Search member by name, email, code, or designation..."
                            value={branchMemberSearch}
                            onChange={(e) => setBranchMemberSearch(e.target.value)}
                          />
                          {branchMemberSearch && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-muted p-0 me-2"
                              style={{ textDecoration: "none", fontSize: "11px" }}
                              onClick={() => setBranchMemberSearch("")}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="branches-filter-group d-flex align-items-center gap-2 flex-wrap">
                          <select
                            className="branches-filter-select"
                            value={branchMemberDeptFilter}
                            onChange={(e) => setBranchMemberDeptFilter(e.target.value)}
                          >
                            <option value="">All Departments ({branchMembers.length})</option>
                            {departmentList.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept} ({departmentCounts[dept]})
                              </option>
                            ))}
                          </select>

                          {(branchMemberSearch || branchMemberDeptFilter) && (
                            <>
                              <span className="branch-dept-count-pill active" style={{ fontSize: "11.5px" }}>
                                Showing {filteredBranchMembers.length} of {branchMembers.length}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-muted text-decoration-none px-2"
                                style={{ fontSize: "12px" }}
                                onClick={() => {
                                  setBranchMemberSearch("");
                                  setBranchMemberDeptFilter("");
                                }}
                              >
                                Clear Filters
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Table / Empty State */}
                    {branchMembers.length === 0 ? (
                      <div className="branch-empty-departments-wrap">
                        <div className="branch-empty-icon-glow">
                          <FaUsers />
                        </div>
                        <h6 className="branch-empty-title">No Members Assigned to This Branch Yet</h6>
                        <p className="branch-empty-desc">
                          Add new employees or transfer existing personnel into <strong>{b.branchName}</strong> to populate this branch's workforce directory.
                        </p>
                        <div className="branch-empty-features-grid">
                          <span className="branch-empty-feature-chip">
                            <FaUsers className="branch-empty-feature-chip-icon" /> Staff Allocation
                          </span>
                          <span className="branch-empty-feature-chip">
                            <FaSitemap className="branch-empty-feature-chip-icon" /> Department Mapping
                          </span>
                          <span className="branch-empty-feature-chip">
                            <FaClock className="branch-empty-feature-chip-icon" /> Shift Rostering Ready
                          </span>
                        </div>
                        {canUpdate && (
                          <div className="branch-empty-actions-row">
                            <button
                              type="button"
                              className="branches-btn-add"
                              onClick={() => handleOpenAssignModal(b)}
                            >
                              <FaUserPlus size={12} className="me-1" /> Add / Transfer Members
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="branches-table-card">
                        <Table responsive hover className="branches-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ minWidth: 240 }}>Member / Employee</th>
                              <th style={{ minWidth: 140 }}>Employee Code</th>
                              <th style={{ minWidth: 160 }}>Department</th>
                              <th style={{ minWidth: 160 }}>Designation</th>
                              <th style={{ minWidth: 150 }}>Branch Status</th>
                              {canUpdate && <th className="text-end" style={{ minWidth: 110 }}>Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBranchMembers.length === 0 ? (
                              <tr>
                                <td colSpan={canUpdate ? 6 : 5} className="text-center py-5 text-muted">
                                  <div className="d-flex flex-column align-items-center justify-content-center py-4">
                                    <div className="branch-empty-icon-glow mb-2" style={{ width: 44, height: 44, fontSize: 18 }}>
                                      <FaSearch />
                                    </div>
                                    <div className="fw-bold text-dark mb-1">No matching members found</div>
                                    <div className="extra-small text-muted mb-3">
                                      No personnel match &quot;{branchMemberSearch || branchMemberDeptFilter}&quot;.
                                    </div>
                                    <button
                                      type="button"
                                      className="branches-btn-view"
                                      style={{ fontSize: "12px", padding: "5px 14px" }}
                                      onClick={() => {
                                        setBranchMemberSearch("");
                                        setBranchMemberDeptFilter("");
                                      }}
                                    >
                                      Reset Filters
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredBranchMembers.map((m) => {
                                const empId = m._id || m.id;
                                const initials = m.fullName ? m.fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "EM";
                                return (
                                  <tr key={empId}>
                                    <td>
                                      <div className="d-flex align-items-center" style={{ gap: "12px" }}>
                                        <div
                                          style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: "10px",
                                            background: "linear-gradient(135deg, #1C1D1D 0%, #2A2B2C 100%)",
                                            color: "var(--color-primary-light, #E2C278)",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            border: "1px solid rgba(196, 154, 85, 0.35)",
                                            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                                          }}
                                        >
                                          {initials}
                                        </div>
                                        <div className="min-w-0" style={{ lineHeight: 1.3 }}>
                                          <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13.5px" }}>
                                            {m.fullName}
                                          </div>
                                          <div className="text-muted text-truncate" style={{ fontSize: "12px", marginTop: "2px" }}>
                                            {m.email}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span
                                        className="branch-code-badge font-monospace"
                                        style={{
                                          fontSize: "11px",
                                          padding: "4px 9px",
                                          borderRadius: "6px",
                                          display: "inline-block",
                                        }}
                                      >
                                        {m.employeeCode || "—"}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                                        <FaSitemap className="text-secondary opacity-75 flex-shrink-0" size={12} />
                                        <span className="fw-semibold text-dark text-truncate" style={{ fontSize: "13px" }}>
                                          {m.department || "General"}
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                                        <FaUserTie className="text-secondary opacity-75 flex-shrink-0" size={12} />
                                        <span className="fw-medium text-secondary text-truncate" style={{ fontSize: "13px" }}>
                                          {m.designation || "Staff"}
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <span
                                        className="badge fw-semibold d-inline-flex align-items-center"
                                        style={{
                                          fontSize: "11px",
                                          padding: "5px 11px",
                                          gap: "6px",
                                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                                          color: "#059669",
                                          border: "1px solid rgba(16, 185, 129, 0.25)",
                                          borderRadius: "9999px",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.4px",
                                        }}
                                      >
                                        <FaCheckCircle size={10} /> Primary Member
                                      </span>
                                    </td>
                                    {canUpdate && (
                                      <td className="text-end" style={{ verticalAlign: "middle" }}>
                                        <button
                                          type="button"
                                          className="branches-btn-remove-pill"
                                          onClick={() => handleOpenRemoveMemberModal(m)}
                                          title="Remove from this branch"
                                        >
                                          <FaUserMinus size={11} /> Remove
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          {detailActiveTab === "departments" && (
            <DepartmentsSection
              lockedBranchId={lockedBId}
              onNavigateBranchTab={handleDetailTabChange}
            />
          )}
          {detailActiveTab === "designations" && <DesignationsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "teams" && <TeamsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "locations" && <LocationsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "reporting" && <ReportingHierarchySection lockedBranchId={lockedBId} />}
          {detailActiveTab === "job-grades" && <JobGradesSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "cost-centers" && <CostCentersSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "work-calendars" && <WorkCalendarsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "shifts" && <ShiftsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "holidays" && <HolidayCalendarsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "leave-settings" && <LeaveSettingsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "financial-years" && <FinancialYearsSection lockedBranchId={lockedBId} />}
          {detailActiveTab === "settings" && <BranchSettingsSection lockedBranchId={lockedBId} />}
        </div>
          </div>
        </div>

        {/* ── Professional Remove Member Confirmation Modal ── */}
        <Modal
          show={showRemoveMemberModal}
          onHide={() => !removeMemberLoading && setShowRemoveMemberModal(false)}
          centered
          backdrop="static"
          className="luxury-confirm-modal"
        >
          <div className="p-4 bg-white rounded-4 shadow-lg border-0">
            <div className="d-flex align-items-start gap-3 mb-3">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  border: "1px solid rgba(220, 38, 38, 0.18)",
                  flexShrink: 0,
                }}
              >
                <FaUserMinus />
              </div>
              <div>
                <h5 className="fw-bold mb-1 text-dark">Remove Staff from Branch</h5>
                <span className="extra-small text-muted">
                  Revoke branch assignment and workforce placement
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-3 bg-light border mb-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #1C1D1D 0%, #2A2B2C 100%)",
                    color: "var(--color-primary-light, #E2C278)",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(196, 154, 85, 0.35)",
                  }}
                >
                  {memberToRemove?.fullName
                    ? memberToRemove.fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                    : "EM"}
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                    <span>{memberToRemove?.fullName}</span>
                    {memberToRemove?.employeeCode && (
                      <span className="branch-code-badge" style={{ fontSize: "10.5px" }}>
                        {memberToRemove.employeeCode}
                      </span>
                    )}
                  </div>
                  <div className="small text-muted">{memberToRemove?.email} &bull; {memberToRemove?.department || "General"}</div>
                </div>
              </div>
            </div>

            <p className="text-secondary small mb-4">
              Are you sure you want to remove <strong>{memberToRemove?.fullName}</strong> from <strong>{selectedBranchDetail?.branchName}</strong>? This will release their branch assignment and return their status to unassigned.
            </p>

            <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
              <Button
                variant="light"
                className="px-4 py-2 small fw-semibold border text-dark"
                onClick={() => setShowRemoveMemberModal(false)}
                disabled={removeMemberLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="px-4 py-2 small fw-bold d-inline-flex align-items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
                }}
                onClick={handleConfirmRemoveMember}
                disabled={removeMemberLoading}
              >
                {removeMemberLoading ? (
                  <LoadingSpinner variant="button" size="sm" className="me-1" />
                ) : (
                  <FaUserMinus />
                )}
                Remove from Branch
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── Assign Members Modal (Inside Detail View) ── */}
        <Modal
          show={showAssignModal}
          onHide={() => setShowAssignModal(false)}
          size="lg"
          centered
          backdrop="static"
          dialogClassName="luxury-staff-modal"
        >
          <Modal.Header closeButton className="border-bottom px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="branch-card-icon-badge branch-card-icon-gold"
                style={{ width: 40, height: 40, fontSize: 16 }}
              >
                <FaUserPlus />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <Modal.Title className="fs-5 fw-bold text-dark mb-0">
                    Manage Staff Allocations
                  </Modal.Title>
                  {selectedBranchForMembers?.branchCode && (
                    <span className="branch-code-badge font-monospace" style={{ fontSize: "11px", padding: "2px 8px" }}>
                      {selectedBranchForMembers.branchCode}
                    </span>
                  )}
                </div>
                <div className="text-muted extra-small mt-0.5">
                  Assigning personnel to <strong>{selectedBranchForMembers?.branchName}</strong>
                </div>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="p-4">
            {assignModalError && <FeedbackAlert variant="danger" message={assignModalError} />}
            {assignModalSuccess && <FeedbackAlert variant="success" message={assignModalSuccess} />}

            <div className="staff-modal-notice mb-3">
              <div className="d-flex align-items-start gap-2.5">
                <div style={{ color: "#C49A55", fontSize: 16, marginTop: 1 }}>
                  <FaBuilding />
                </div>
                <div>
                  <div className="fw-bold text-dark small">Branch Staff Allocation &amp; Workforce Mapping</div>
                  <div className="extra-small text-muted mt-0.5" style={{ lineHeight: 1.45 }}>
                    Select personnel to assign as active primary members of <strong>{selectedBranchForMembers?.branchName}</strong>. Checked employees will populate this branch&apos;s directory, shifts, and attendance workspaces.
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              const targetBId = String(selectedBranchForMembers?._id || selectedBranchForMembers?.id || "");
              const filteredStaffList = onboardedStaff.filter((emp) => {
                const empBId = String(emp.primaryBranchId || "");
                const isCurrent = empBId && empBId === targetBId;
                const isUnassigned = !empBId;

                // Exclude other branch members from this branch's modal
                if (!isCurrent && !isUnassigned) return false;

                const q = (memberSearch || "").toLowerCase();
                const matchSearch = !q ||
                  (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
                  (emp.email && emp.email.toLowerCase().includes(q)) ||
                  (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
                  (emp.department && emp.department.toLowerCase().includes(q));
                if (!matchSearch) return false;

                if (memberAssignFilter === "current") return isCurrent;
                if (memberAssignFilter === "unassigned") return isUnassigned;
                return true;
              });

              const allFilteredSelected = filteredStaffList.length > 0 && filteredStaffList.every((emp) => selectedMemberIds.has(String(emp._id || emp.id)));

              return (
                <>
                  <div className="d-flex align-items-center justify-content-between gap-2.5 mb-3 flex-wrap">
                    <div className="branches-search-wrap flex-grow-1" style={{ minWidth: 240 }}>
                      <FaSearch className="branches-search-icon" />
                      <input
                        type="text"
                        className="branches-search-input"
                        placeholder="Search staff by name, email, code, or department..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                      {memberSearch && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-muted p-0 me-2"
                          style={{ textDecoration: "none", fontSize: "11px" }}
                          onClick={() => setMemberSearch("")}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <select
                        className="branches-filter-select"
                        value={memberAssignFilter}
                        onChange={(e) => setMemberAssignFilter(e.target.value)}
                        style={{ minWidth: 190 }}
                      >
                        <option value="all">All Available Personnel</option>
                        <option value="current">Current Branch Members</option>
                        <option value="unassigned">Unassigned Employees Only</option>
                      </select>

                      <button
                        type="button"
                        className="branches-btn-view"
                        style={{ fontSize: "12px", padding: "6px 14px" }}
                        onClick={() => {
                          const filteredIds = filteredStaffList.map((e) => String(e._id || e.id));
                          setSelectedMemberIds((prev) => {
                            const next = new Set(prev);
                            filteredIds.forEach((id) => next.add(id));
                            return next;
                          });
                        }}
                      >
                        Select Filtered
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-muted text-decoration-none px-2"
                        style={{ fontSize: "12px" }}
                        onClick={() => setSelectedMemberIds(new Set())}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="staff-table-wrap">
                    <Table hover responsive className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: 44, textAlign: "center" }}>
                            <input
                              type="checkbox"
                              className="staff-custom-checkbox"
                              checked={allFilteredSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMemberIds((prev) => {
                                    const next = new Set(prev);
                                    filteredStaffList.forEach((emp) => next.add(String(emp._id || emp.id)));
                                    return next;
                                  });
                                } else {
                                  setSelectedMemberIds((prev) => {
                                    const next = new Set(prev);
                                    filteredStaffList.forEach((emp) => next.delete(String(emp._id || emp.id)));
                                    return next;
                                  });
                                }
                              }}
                            />
                          </th>
                          <th style={{ minWidth: 230 }}>Employee / Staff</th>
                          <th style={{ minWidth: 170 }}>Department &amp; Designation</th>
                          <th style={{ minWidth: 180 }}>Branch Assignment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaffList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-5 text-muted">
                              <div className="d-flex flex-column align-items-center justify-content-center py-3">
                                <FaSearch className="text-muted opacity-50 mb-2" size={22} />
                                <div className="fw-semibold text-dark">No personnel match your search</div>
                                <div className="extra-small text-muted mt-1">Try modifying your search or filter options</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredStaffList.map((emp) => {
                            const empId = String(emp._id || emp.id);
                            const isChecked = selectedMemberIds.has(empId);
                            const empBId = String(emp.primaryBranchId || "");
                            const isCurrent = empBId && empBId === targetBId;
                            const initials = emp.fullName
                              ? emp.fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                              : "EM";

                            return (
                              <tr
                                key={empId}
                                onClick={() => toggleMember(empId)}
                                className={isChecked ? "selected-row" : ""}
                              >
                                <td style={{ textAlign: "center" }}>
                                  <input
                                    type="checkbox"
                                    className="staff-custom-checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td>
                                  <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                                    <div
                                      style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "9px",
                                        background: isChecked ? "#1C1D1D" : "#f1f5f9",
                                        color: isChecked ? "#E2C278" : "#475569",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        border: isChecked ? "1px solid rgba(196, 154, 85, 0.4)" : "1px solid #e2e8f0",
                                        transition: "all 0.15s ease",
                                      }}
                                    >
                                      {initials}
                                    </div>
                                    <div className="min-w-0" style={{ lineHeight: 1.3 }}>
                                      <div className="d-flex align-items-center gap-1.5">
                                        <span className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
                                          {emp.fullName}
                                        </span>
                                        {emp.employeeCode && (
                                          <span className="branch-code-badge font-monospace" style={{ fontSize: "10px", padding: "1px 6px" }}>
                                            {emp.employeeCode}
                                          </span>
                                        )}
                                      </div>
                                      <div className="extra-small text-muted text-truncate" style={{ marginTop: "1px" }}>
                                        {emp.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "12.5px" }}>
                                    <FaUserTie className="text-secondary opacity-75 me-1" size={10} />
                                    {emp.designation || "Staff"}
                                  </div>
                                  <div className="extra-small text-muted text-truncate mt-0.5">
                                    <FaSitemap className="text-secondary opacity-75 me-1" size={10} />
                                    {emp.department || "General"}
                                  </div>
                                </td>
                                <td>
                                  {isCurrent ? (
                                    <span
                                      className="badge fw-semibold d-inline-flex align-items-center gap-1"
                                      style={{
                                        fontSize: "11px",
                                        padding: "4px 9px",
                                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                                        color: "#059669",
                                        border: "1px solid rgba(16, 185, 129, 0.25)",
                                        borderRadius: "9999px",
                                      }}
                                    >
                                      <FaCheckCircle size={10} /> Assigned to this Branch
                                    </span>
                                  ) : (
                                    <span
                                      className="badge fw-medium d-inline-flex align-items-center gap-1"
                                      style={{
                                        fontSize: "11px",
                                        padding: "4px 9px",
                                        backgroundColor: isChecked ? "rgba(196, 154, 85, 0.12)" : "#f1f5f9",
                                        color: isChecked ? "#9B7229" : "#64748b",
                                        border: isChecked ? "1px solid rgba(196, 154, 85, 0.3)" : "1px solid #e2e8f0",
                                        borderRadius: "9999px",
                                      }}
                                    >
                                      {isChecked ? (
                                        <>
                                          <FaUserPlus size={10} className="text-success" /> Add to Branch
                                        </>
                                      ) : (
                                        "Unassigned"
                                      )}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  </div>
                </>
              );
            })()}
          </Modal.Body>
          <Modal.Footer className="px-4 py-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="branch-dept-count-pill active" style={{ fontSize: "11.5px", padding: "4px 10px" }}>
                {selectedMemberIds.size} Selected
              </span>
              <span className="text-muted extra-small">Personnel selected for this branch</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                size="sm"
                className="px-3 py-1.5 fw-semibold border text-dark"
                onClick={() => setShowAssignModal(false)}
                disabled={assignLoading}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="branches-btn-add btn-sm"
                style={{ padding: "7px 18px" }}
                onClick={handleSaveMembers}
                disabled={assignLoading}
              >
                {assignLoading ? (
                  <LoadingSpinner variant="button" size="sm" />
                ) : (
                  <>
                    <FaCheckCircle size={11} className="me-1" /> Save Staff Assignments
                  </>
                )}
              </button>
            </div>
          </Modal.Footer>
        </Modal>

        {/* ── Deactivate Confirm Modal (Inside Detail View) ── */}
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

  // Computed metrics for KPI stats cards
  const totalBranchesCount = totalRecords || masterBranchList.length || branches.length;
  const activeBranchesCount = (masterBranchList.length > 0 ? masterBranchList : branches).filter((b) => b.status === "ACTIVE").length;
  const inactiveBranchesCount = (masterBranchList.length > 0 ? masterBranchList : branches).filter((b) => b.status === "INACTIVE").length;
  const totalStaffCount = onboardedStaff.filter(
    (e) => e.primaryBranchId || (Array.isArray(e.branchIds) && e.branchIds.length > 0)
  ).length;
  const geofencedBranchesCount = (masterBranchList.length > 0 ? masterBranchList : branches).filter((b) => b.latitude && b.longitude).length;
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
              <span className="branches-breadcrumb-link" onClick={onBackToOrg} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onBackToOrg(); } }}>
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
              loadAllOrgBranches();
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
            <div className="branches-kpi-value">{citiesCount}</div>
            <div className="branches-kpi-subtext">Geographic coverage</div>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <FeedbackAlert
          variant="danger"
          dismissible
          onClose={() => setError("")}
          className="mb-4 shadow-sm"
          message={
            <div className="d-flex align-items-center gap-2">
              <FaExclamationTriangle className="text-danger flex-shrink-0" />
              <span>{error}</span>
            </div>
          }
        />
      )}
      {success && (
        <FeedbackAlert
          variant="success"
          dismissible
          onClose={() => setSuccess("")}
          className="mb-4 shadow-sm"
          message={
            <div className="d-flex align-items-center gap-2">
              <FaCheckCircle className="text-success flex-shrink-0" />
              <span>{success}</span>
            </div>
          }
        />
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
              <option value="">
                {masterBranchList.length > 0
                  ? `All Branch Types (${masterBranchList.length})`
                  : "All Branch Types"}
              </option>
              {availableBranchTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} ({t.count})
                </option>
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
              {cityOptions.map(({ city, count }) => (
                <option key={city} value={city}>
                  {city} ({count})
                </option>
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
              {availableStatuses.length > 0 ? (
                availableStatuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </>
              )}
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

        {/* ── Active Filters Indicators Bar ── */}
        {(Boolean(filterType) || Boolean(filterCity) || Boolean(filterStatus) || Boolean(search)) && (
          <div className="d-flex align-items-center gap-2 mt-3 px-1 flex-wrap pt-2 border-top">
            <span className="extra-small text-muted fw-bold text-uppercase">Active:</span>
            {filterType && (
              <span className="badge bg-warning-subtle text-dark border extra-small d-inline-flex align-items-center gap-1 py-1 px-2">
                Type: {availableBranchTypes.find((t) => t.value === filterType)?.label || filterType}
                <span
                  role="button"
                  tabIndex={0}
                  className="ms-1 fw-bold text-muted cursor-pointer"
                  onClick={() => { setFilterType(""); setPage(1); }}
                >
                  &times;
                </span>
              </span>
            )}
            {filterCity && (
              <span className="badge bg-info-subtle text-dark border extra-small d-inline-flex align-items-center gap-1 py-1 px-2">
                City: {filterCity}
                <span
                  role="button"
                  tabIndex={0}
                  className="ms-1 fw-bold text-muted cursor-pointer"
                  onClick={() => { setFilterCity(""); setPage(1); }}
                >
                  &times;
                </span>
              </span>
            )}
            {filterStatus && (
              <span className="badge bg-success-subtle text-dark border extra-small d-inline-flex align-items-center gap-1 py-1 px-2">
                Status: {filterStatus}
                <span
                  role="button"
                  tabIndex={0}
                  className="ms-1 fw-bold text-muted cursor-pointer"
                  onClick={() => { setFilterStatus(""); setPage(1); }}
                >
                  &times;
                </span>
              </span>
            )}
            {search && (
              <span className="badge bg-light text-dark border extra-small d-inline-flex align-items-center gap-1 py-1 px-2">
                Search: "{search}"
                <span
                  role="button"
                  tabIndex={0}
                  className="ms-1 fw-bold text-muted cursor-pointer"
                  onClick={() => { setSearch(""); setPage(1); }}
                >
                  &times;
                </span>
              </span>
            )}
            <button
              type="button"
              className="btn btn-link btn-sm p-0 extra-small text-danger text-decoration-none ms-1 fw-semibold"
              onClick={() => {
                setFilterType("");
                setFilterCity("");
                setFilterStatus("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* ── 4. Main Branches List / Cards ── */}
      {loading ? (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-3">
          <Spinner animation="border" style={{ color: "var(--color-primary, #C49A55)" }} />
          <p className="mt-3 text-muted fw-semibold">Loading enterprise branch directory...</p>
        </div>
      ) : displayedBranches.length === 0 ? (
        <div className="branches-empty-state">
          <div className="branches-empty-icon">
            <FaBuilding />
          </div>
          <h4 className="branches-empty-title">No Matching Branches Found</h4>
          <p className="branches-empty-text">
            {search || filterType || filterCity || filterStatus
              ? "No branches match your current search and filter criteria. Try resetting your filters."
              : "Create your first regional branch facility to organize physical locations, geofenced mobile attendance, and departmental staff."}
          </p>
          {(search || filterType || filterCity || filterStatus) ? (
            <button
              type="button"
              className="btn btn-outline-secondary px-3 py-2 fw-semibold rounded-3 extra-small"
              onClick={() => {
                setFilterType("");
                setFilterCity("");
                setFilterStatus("");
                setSearch("");
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          ) : (
            canCreate && (
              <button
                type="button"
                className="branches-btn-add"
                onClick={handleOpenAddBranch}
              >
                <FaPlus /> Add Your First Branch
              </button>
            )
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID CARDS VIEW ── */
        <div className="branches-grid">
          {displayedBranches.map((b) => {
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
                        onClick={() => handleSelectBranch(b)}
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
                    <div
                      className="branch-stat-mini-item"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleOpenBranchDepartments(b)}
                      title="Click to view and manage departments for this branch"
                    >
                      <span className="branch-stat-mini-label">Departments</span>
                      <span className="branch-stat-mini-value text-success fw-semibold">
                        <FaSitemap className="me-1 text-success" size={12} /> {getBranchDepartments(bId).length} Departments
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
                    onClick={() => handleSelectBranch(b)}
                  >
                    Open Branch Hub <FaArrowRight size={11} />
                  </button>

                  <div className="branch-card-action-group">
                    <button
                      type="button"
                      className="branch-card-action-btn"
                      onClick={() => handleOpenBranchDepartments(b)}
                      title="Manage Branch Departments"
                    >
                      <FaSitemap />
                    </button>

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
                <th>Departments</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedBranches.map((b) => {
                const bId = b._id || b.id;
                const membersCount = getBranchMembers(bId).length;
                const deptsCount = getBranchDepartments(bId).length;
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
                        onClick={() => handleSelectBranch(b)}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "linear-gradient(135deg, var(--color-sidebar, #1C1D1D) 0%, #2A2B2C 100%)",
                            color: "var(--color-primary-light, #E2C278)",
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
                      <Badge
                        bg="light"
                        text="dark"
                        className="border px-2 py-1 text-success fw-semibold"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleOpenBranchDepartments(b)}
                        title="Click to view and manage departments for this branch"
                      >
                        <FaSitemap className="me-1 text-success" /> {deptsCount}
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
                          onClick={() => handleOpenBranchDepartments(b)}
                          title="Manage Branch Departments"
                        >
                          <FaSitemap />
                        </button>
                        <button
                          type="button"
                          className="branch-card-action-btn"
                          onClick={() => handleSelectBranch(b)}
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
        <PaginationBar
          size="sm"
          page={page}
          totalPages={totalPages}
          onPageChange={(pg) => setPage(pg)}
          wrapperClassName="d-flex justify-content-between align-items-center bg-white p-3 rounded-4 border shadow-sm mb-4"
          paginationClassName="mb-0"
          info={
            <span className="small text-muted fw-semibold">
              Showing page {page} of {totalPages} ({totalRecords} records)
            </span>
          }
        />
      )}



      {/* ── Assign Members Modal ── */}
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        size="lg"
        centered
        backdrop="static"
        dialogClassName="luxury-staff-modal"
      >
        <Modal.Header closeButton className="border-bottom px-4 py-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="branch-card-icon-badge branch-card-icon-gold"
              style={{ width: 40, height: 40, fontSize: 16 }}
            >
              <FaUserPlus />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <Modal.Title className="fs-5 fw-bold text-dark mb-0">
                  Manage Staff Allocations
                </Modal.Title>
                {selectedBranchForMembers?.branchCode && (
                  <span className="branch-code-badge font-monospace" style={{ fontSize: "11px", padding: "2px 8px" }}>
                    {selectedBranchForMembers.branchCode}
                  </span>
                )}
              </div>
              <div className="text-muted extra-small mt-0.5">
                Assigning personnel to <strong>{selectedBranchForMembers?.branchName}</strong>
              </div>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="p-4">
          {assignModalError && <FeedbackAlert variant="danger" message={assignModalError} />}
          {assignModalSuccess && <FeedbackAlert variant="success" message={assignModalSuccess} />}

          <div className="staff-modal-notice mb-3">
            <div className="d-flex align-items-start gap-2.5">
              <div style={{ color: "#C49A55", fontSize: 16, marginTop: 1 }}>
                <FaBuilding />
              </div>
              <div>
                <div className="fw-bold text-dark small">Branch Staff Allocation &amp; Workforce Mapping</div>
                <div className="extra-small text-muted mt-0.5" style={{ lineHeight: 1.45 }}>
                  Select personnel to assign as active primary members of <strong>{selectedBranchForMembers?.branchName}</strong>. Checked employees will populate this branch&apos;s directory, shifts, and attendance workspaces.
                </div>
              </div>
            </div>
          </div>

          {(() => {
            const targetBId = String(selectedBranchForMembers?._id || selectedBranchForMembers?.id || "");
            const filteredStaffList = onboardedStaff.filter((emp) => {
              const empBId = String(emp.primaryBranchId || "");
              const isCurrent = empBId && empBId === targetBId;
              const isUnassigned = !empBId;

              // Exclude other branch members from this branch's modal
              if (!isCurrent && !isUnassigned) return false;

              const q = (memberSearch || "").toLowerCase();
              const matchSearch = !q ||
                (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
                (emp.email && emp.email.toLowerCase().includes(q)) ||
                (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
                (emp.department && emp.department.toLowerCase().includes(q));
              if (!matchSearch) return false;

              if (memberAssignFilter === "current") return isCurrent;
              if (memberAssignFilter === "unassigned") return isUnassigned;
              return true;
            });

            const allFilteredSelected = filteredStaffList.length > 0 && filteredStaffList.every((emp) => selectedMemberIds.has(String(emp._id || emp.id)));

            return (
              <>
                <div className="d-flex align-items-center justify-content-between gap-2.5 mb-3 flex-wrap">
                  <div className="branches-search-wrap flex-grow-1" style={{ minWidth: 240 }}>
                    <FaSearch className="branches-search-icon" />
                    <input
                      type="text"
                      className="branches-search-input"
                      placeholder="Search staff by name, email, code, or department..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                    {memberSearch && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-muted p-0 me-2"
                        style={{ textDecoration: "none", fontSize: "11px" }}
                        onClick={() => setMemberSearch("")}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <select
                      className="branches-filter-select"
                      value={memberAssignFilter}
                      onChange={(e) => setMemberAssignFilter(e.target.value)}
                      style={{ minWidth: 190 }}
                    >
                      <option value="all">All Available Personnel</option>
                      <option value="current">Current Branch Members</option>
                      <option value="unassigned">Unassigned Employees Only</option>
                    </select>

                    <button
                      type="button"
                      className="branches-btn-view"
                      style={{ fontSize: "12px", padding: "6px 14px" }}
                      onClick={() => {
                        const filteredIds = filteredStaffList.map((e) => String(e._id || e.id));
                        setSelectedMemberIds((prev) => {
                          const next = new Set(prev);
                          filteredIds.forEach((id) => next.add(id));
                          return next;
                        });
                      }}
                    >
                      Select Filtered
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted text-decoration-none px-2"
                      style={{ fontSize: "12px" }}
                      onClick={() => setSelectedMemberIds(new Set())}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="staff-table-wrap">
                  <Table hover responsive className="align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: 44, textAlign: "center" }}>
                          <input
                            type="checkbox"
                            className="staff-custom-checkbox"
                            checked={allFilteredSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberIds((prev) => {
                                  const next = new Set(prev);
                                  filteredStaffList.forEach((emp) => next.add(String(emp._id || emp.id)));
                                  return next;
                                });
                              } else {
                                setSelectedMemberIds((prev) => {
                                  const next = new Set(prev);
                                  filteredStaffList.forEach((emp) => next.delete(String(emp._id || emp.id)));
                                  return next;
                                });
                              }
                            }}
                          />
                        </th>
                        <th style={{ minWidth: 230 }}>Employee / Staff</th>
                        <th style={{ minWidth: 170 }}>Department &amp; Designation</th>
                        <th style={{ minWidth: 180 }}>Branch Assignment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaffList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-5 text-muted">
                            <div className="d-flex flex-column align-items-center justify-content-center py-3">
                              <FaSearch className="text-muted opacity-50 mb-2" size={22} />
                              <div className="fw-semibold text-dark">No personnel match your search</div>
                              <div className="extra-small text-muted mt-1">Try modifying your search or filter options</div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredStaffList.map((emp) => {
                          const empId = String(emp._id || emp.id);
                          const isChecked = selectedMemberIds.has(empId);
                          const empBId = String(emp.primaryBranchId || "");
                          const isCurrent = empBId && empBId === targetBId;
                          const initials = emp.fullName
                            ? emp.fullName.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                            : "EM";

                          return (
                            <tr
                              key={empId}
                              onClick={() => toggleMember(empId)}
                              className={isChecked ? "selected-row" : ""}
                            >
                              <td style={{ textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  className="staff-custom-checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td>
                                <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                                  <div
                                    style={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: "9px",
                                      background: isChecked ? "#1C1D1D" : "#f1f5f9",
                                      color: isChecked ? "#E2C278" : "#475569",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      border: isChecked ? "1px solid rgba(196, 154, 85, 0.4)" : "1px solid #e2e8f0",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    {initials}
                                  </div>
                                  <div className="min-w-0" style={{ lineHeight: 1.3 }}>
                                    <div className="d-flex align-items-center gap-1.5">
                                      <span className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
                                        {emp.fullName}
                                      </span>
                                      {emp.employeeCode && (
                                        <span className="branch-code-badge font-monospace" style={{ fontSize: "10px", padding: "1px 6px" }}>
                                          {emp.employeeCode}
                                        </span>
                                      )}
                                    </div>
                                    <div className="extra-small text-muted text-truncate" style={{ marginTop: "1px" }}>
                                      {emp.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "12.5px" }}>
                                  <FaUserTie className="text-secondary opacity-75 me-1" size={10} />
                                  {emp.designation || "Staff"}
                                </div>
                                <div className="extra-small text-muted text-truncate mt-0.5">
                                  <FaSitemap className="text-secondary opacity-75 me-1" size={10} />
                                  {emp.department || "General"}
                                </div>
                              </td>
                              <td>
                                {isCurrent ? (
                                  <span
                                    className="badge fw-semibold d-inline-flex align-items-center gap-1"
                                    style={{
                                      fontSize: "11px",
                                      padding: "4px 9px",
                                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                                      color: "#059669",
                                      border: "1px solid rgba(16, 185, 129, 0.25)",
                                      borderRadius: "9999px",
                                    }}
                                  >
                                    <FaCheckCircle size={10} /> Assigned to this Branch
                                  </span>
                                ) : (
                                  <span
                                    className="badge fw-medium d-inline-flex align-items-center gap-1"
                                    style={{
                                      fontSize: "11px",
                                      padding: "4px 9px",
                                      backgroundColor: isChecked ? "rgba(196, 154, 85, 0.12)" : "#f1f5f9",
                                      color: isChecked ? "#9B7229" : "#64748b",
                                      border: isChecked ? "1px solid rgba(196, 154, 85, 0.3)" : "1px solid #e2e8f0",
                                      borderRadius: "9999px",
                                    }}
                                  >
                                    {isChecked ? (
                                      <>
                                        <FaUserPlus size={10} className="text-success" /> Add to Branch
                                      </>
                                    ) : (
                                      "Unassigned"
                                    )}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer className="px-4 py-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="branch-dept-count-pill active" style={{ fontSize: "11.5px", padding: "4px 10px" }}>
              {selectedMemberIds.size} Selected
            </span>
            <span className="text-muted extra-small">Personnel selected for this branch</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="light"
              size="sm"
              className="px-3 py-1.5 fw-semibold border text-dark"
              onClick={() => setShowAssignModal(false)}
              disabled={assignLoading}
            >
              Cancel
            </Button>
            <button
              type="button"
              className="branches-btn-add btn-sm"
              style={{ padding: "7px 18px" }}
              onClick={handleSaveMembers}
              disabled={assignLoading}
            >
              {assignLoading ? (
                <LoadingSpinner variant="button" size="sm" />
              ) : (
                <>
                  <FaCheckCircle size={11} className="me-1" /> Save Staff Assignments
                </>
              )}
            </button>
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

      {/* ── Branch Onboarding Next Steps Modal ── */}
      <Modal
        show={showPostCreateModal}
        onHide={() => setShowPostCreateModal(false)}
        centered
        backdrop="static"
        className="luxury-confirm-modal"
      >
        <div className="p-4 bg-white rounded-4 shadow-lg border-0">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              <FaCheckCircle />
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">Branch Created Successfully!</h5>
              <span className="extra-small text-muted">
                Facility <strong>{postCreatedBranch?.branchName}</strong> ({postCreatedBranch?.branchCode}) is now initialized.
              </span>
            </div>
          </div>

          <p className="text-secondary small mb-3">
            To make this branch operational, follow the recommended next steps in the organizational onboarding workflow:
          </p>

          <div className="d-flex flex-column gap-2.5 mb-4">
            {/* Step 1: Add Departments */}
            <div
              className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3"
              style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              onClick={() => {
                setShowPostCreateModal(false);
                handleSelectBranch(postCreatedBranch, "departments");
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("branchId", postCreatedBranch._id || postCreatedBranch.id);
                  next.set("tab", "departments");
                  next.set("action", "new-dept");
                  return next;
                }, { replace: true });
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16, 185, 129, 0.15)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaSitemap />
                </div>
                <div>
                  <div className="fw-bold text-dark small">1. Add Departments to this Branch</div>
                  <div className="text-muted extra-small">Create functional units (IT, Sales, HR, Operations) for this facility.</div>
                </div>
              </div>
              <Button variant="success" size="sm" className="fw-bold px-3">
                + Add Dept
              </Button>
            </div>

            {/* Step 2: Assign Staff */}
            <div
              className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3"
              style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              onClick={() => {
                setShowPostCreateModal(false);
                handleOpenAssignModal(postCreatedBranch);
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59, 130, 246, 0.15)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaUsers />
                </div>
                <div>
                  <div className="fw-bold text-dark small">2. Assign Staff & Workforce</div>
                  <div className="text-muted extra-small">Map personnel and primary branch placement.</div>
                </div>
              </div>
              <Button variant="primary" size="sm" className="fw-bold px-3">
                Manage Staff
              </Button>
            </div>

            {/* Step 3: Branch Hub */}
            <div
              className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3"
              style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              onClick={() => {
                setShowPostCreateModal(false);
                handleSelectBranch(postCreatedBranch, "overview");
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(196, 154, 85, 0.15)", color: "var(--color-primary-dark, #9B7229)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaBuilding />
                </div>
                <div>
                  <div className="fw-bold text-dark small">3. Open Full Branch Workspace</div>
                  <div className="text-muted extra-small">Review GPS radar, operational shifts, work calendars, and settings.</div>
                </div>
              </div>
              <Button variant="outline-dark" size="sm" className="fw-semibold px-3">
                Open Hub
              </Button>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <Button
              variant="link"
              className="text-muted text-decoration-none small"
              onClick={() => setShowPostCreateModal(false)}
            >
              Dismiss and View Branches Directory
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
