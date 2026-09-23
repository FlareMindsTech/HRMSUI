import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Nav,
  Tab,
} from "react-bootstrap";
import {
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaSitemap,
  FaLayerGroup,
  FaCog,
  FaPlus,
  FaBriefcase,
  FaChartBar,
  FaUserFriends,
  FaUserTie,
  FaRegBuilding,
  FaChevronRight,
  FaCalendarAlt,
  FaEdit,
  FaGlobe,
  FaRocket,
  FaShieldAlt,
  FaCopy,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  fetchMyOrganization,
  createOrganization,
  updateMyOrganization,
  fetchOrganizationStructure,
  fetchReportingTree,
  normalizeOrganization,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";

const ORG_TYPES = ["COMPANY", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "OTHER"];
const ORG_STATUSES = ["ACTIVE", "SUSPENDED", "INACTIVE"];

const INITIAL_FORM_STATE = {
  organizationName: "",
  organizationCode: "",
  legalName: "",
  displayName: "",
  organizationType: "",
  registrationNumber: "",
  pan: "",
  tan: "",
  gstin: "",
  incorporationDate: "",
  industry: "",
  website: "",
  email: "",
  phone: "",
  logo: "",
  address: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
  currency: "",
  timeZone: "",
  financialYearStart: "",
  status: "",
};

// Safe helper to extract and format any data type into a displayable string
const getStr = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim() !== "" ? val.trim() : fallback;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    // Handle { month, day } e.g. financialYearStart
    if (val.month !== undefined && val.day !== undefined) {
      const mm = String(val.month).padStart(2, "0");
      const dd = String(val.day).padStart(2, "0");
      return `${mm}-${dd}`;
    }
    // Handle street/address objects
    if (val.street || val.addressLine1 || val.line1) {
      const addr = [val.street || val.addressLine1 || val.line1, val.city, val.state, val.country, val.pincode || val.zip]
        .filter(Boolean)
        .join(", ");
      return addr || fallback;
    }
    if (val.name) return String(val.name);
    if (val.code) return String(val.code);
    if (val.label) return String(val.label);
    if (val.title) return String(val.title);
    if (val.value) return String(val.value);
    if (val.url) return String(val.url);
    return fallback;
  }
  return fallback;
};

function OrgOverview({ orgData: initialOrgData, onNavigateTab, triggerEditModal, onEditModalHandled, onOrgUpdated }) {
  const { isSystemAdmin, user, hasPermission } = useAuth();
  const { organization, refreshOrganization, refreshBranches } = useBranch();
  const [orgData, setOrgData] = useState(initialOrgData || organization || null);
  const [structureData, setStructureData] = useState(null);
  const [, setReportingTree] = useState(null);
  const [loading, setLoading] = useState(!initialOrgData && !organization);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalActiveTab, setModalActiveTab] = useState("basic");
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const canEdit = isSystemAdmin || hasPermission("organization.update");
  const canCreate = isSystemAdmin || hasPermission("organization.create") || user?.roleCode === "OWNER";

  const activeOrg = useMemo(() => {
    const raw = orgData || organization;
    return raw ? normalizeOrganization(raw) || raw : {};
  }, [orgData, organization]);

  const storedOrgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");

  // Check if organization data actually exists
  const hasOrgData = useMemo(() => {
    return Boolean(
      (activeOrg && (activeOrg.organizationName || activeOrg.name || activeOrg.organizationCode || activeOrg.code || activeOrg._id || activeOrg.id)) ||
      user?.organizationId ||
      storedOrgId
    );
  }, [activeOrg, user, storedOrgId]);

  const [copiedField, setCopiedField] = useState("");

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (fieldName) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2500);
    }
  };

  const populateFormWithOrg = useCallback((org) => {
    if (!org) {
      setFormData(INITIAL_FORM_STATE);
      return;
    }
    const norm = normalizeOrganization(org) || org;
    const addrObj = typeof norm.address === "object" && norm.address !== null ? norm.address : {};
    let incDate = norm.incorporationDate || "";
    if (incDate && incDate.includes("T")) {
      try {
        incDate = new Date(incDate).toISOString().split("T")[0];
      } catch (e) {
        incDate = getStr(norm.incorporationDate);
      }
    }

    setFormData({
      organizationName: getStr(norm.organizationName || norm.name || norm.displayName || norm.legalName),
      organizationCode: getStr(norm.organizationCode || norm.code),
      legalName: getStr(norm.legalName || norm.name),
      displayName: getStr(norm.displayName || norm.name),
      organizationType: getStr(norm.organizationType || "COMPANY"),
      registrationNumber: getStr(norm.registrationNumber),
      pan: getStr(norm.pan),
      tan: getStr(norm.tan),
      gstin: getStr(norm.gstin),
      incorporationDate: incDate,
      industry: getStr(norm.industry),
      website: getStr(norm.website),
      email: getStr(norm.email),
      phone: getStr(norm.phone),
      logo: getStr(typeof norm.logo === "object" && norm.logo !== null ? norm.logo.url || norm.logo.path : norm.logo),
      address: getStr(typeof norm.address === "string" ? norm.address : addrObj.street || addrObj.addressLine1 || ""),
      country: getStr(typeof norm.country === "string" ? norm.country : addrObj.country || "India"),
      state: getStr(norm.state || addrObj.state || ""),
      city: getStr(norm.city || addrObj.city || ""),
      pincode: getStr(norm.pincode || addrObj.pincode || ""),
      currency: getStr(norm.currency || "INR"),
      timeZone: getStr(norm.timeZone || "Asia/Kolkata"),
      financialYearStart: getStr(norm.financialYearStart || "04-01"),
      status: getStr(norm.status || "ACTIVE"),
    });
  }, []);

  // Handle external trigger for edit/create modal
  useEffect(() => {
    if (triggerEditModal) {
      if (hasOrgData) {
        setModalMode("edit");
        populateFormWithOrg(activeOrg);
      } else {
        setModalMode("create");
        setFormData(INITIAL_FORM_STATE);
      }
      setModalActiveTab("basic");
      setModalError("");
      setShowModal(true);
      if (onEditModalHandled) onEditModalHandled();
    }
  }, [triggerEditModal, hasOrgData, activeOrg, onEditModalHandled, populateFormWithOrg]);


  const loadData = useCallback(async () => {
    try {
      if (!organization && !initialOrgData) setLoading(true);
      setError("");
      const [org, structure, tree] = await Promise.all([
        fetchMyOrganization().catch((err) => {
          console.warn("fetchMyOrganization error:", err);
          return null;
        }),
        fetchOrganizationStructure().catch((err) => {
          console.warn("fetchOrganizationStructure error:", err);
          return null;
        }),
        fetchReportingTree().catch((err) => {
          console.warn("fetchReportingTree error:", err);
          return null;
        }),
      ]);

      const rawFinal =
        (org && (org.organizationName || org.name || org.organizationCode || org._id || org.id) ? org : null) ||
        (structure?.organization && (structure.organization.organizationName || structure.organization.name || structure.organization.organizationCode || structure.organization._id || structure.organization.id) ? structure.organization : null) ||
        (structure?.org && (structure.org.organizationName || structure.org.name || structure.org._id) ? structure.org : null) ||
        (organization && (organization.organizationName || organization.name || organization.organizationCode || organization._id || organization.id) ? organization : null) ||
        (initialOrgData ? initialOrgData : null);

      const finalOrg = rawFinal ? normalizeOrganization(rawFinal) || rawFinal : null;

      if (finalOrg) {
        setOrgData(finalOrg);
        populateFormWithOrg(finalOrg);
      } else {
        setOrgData(null);
        setFormData(INITIAL_FORM_STATE);
      }

      if (structure) {
        setStructureData(structure);
      }
      if (tree) {
        setReportingTree(tree);
      }
    } catch (err) {
      setError(err.message || "Failed to load organization profile");
    } finally {
      setLoading(false);
    }
  }, [organization, initialOrgData, populateFormWithOrg]);

  useEffect(() => {
    if (initialOrgData) {
      const norm = normalizeOrganization(initialOrgData) || initialOrgData;
      setOrgData(norm);
      populateFormWithOrg(norm);
      setLoading(false);
    } else if (organization && !orgData) {
      const norm = normalizeOrganization(organization) || organization;
      setOrgData(norm);
      populateFormWithOrg(norm);
      setLoading(false);
    }
  }, [initialOrgData, organization, orgData, populateFormWithOrg]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    if (onNavigateTab) {
      onNavigateTab("edit-profile");
      return;
    }
    setModalMode("create");
    setFormData(INITIAL_FORM_STATE);
    setModalActiveTab("basic");
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEditModal = () => {
    if (onNavigateTab) {
      onNavigateTab("edit-profile");
      return;
    }
    setModalMode("edit");
    populateFormWithOrg(orgData);
    setModalActiveTab("basic");
    setModalError("");
    setShowModal(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setModalError("Logo file size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organizationName.trim()) {
      setModalError("Organization name is required");
      return;
    }
    if (!formData.organizationCode.trim()) {
      setModalError("Organization code is required");
      return;
    }

    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        organizationName: formData.organizationName.trim(),
        organizationCode: formData.organizationCode.trim().toUpperCase(),
        legalName: formData.legalName.trim(),
        displayName: formData.displayName.trim() || formData.organizationName.trim(),
        organizationType: formData.organizationType,
        registrationNumber: formData.registrationNumber.trim(),
        pan: formData.pan.trim().toUpperCase(),
        tan: formData.tan.trim().toUpperCase(),
        gstin: formData.gstin.trim().toUpperCase(),
        incorporationDate: formData.incorporationDate ? new Date(formData.incorporationDate) : null,
        industry: formData.industry.trim(),
        website: formData.website.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        logo: formData.logo,
        address: formData.address.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        currency: formData.currency.trim().toUpperCase(),
        timeZone: formData.timeZone.trim(),
        financialYearStart: formData.financialYearStart.trim(),
        status: formData.status || "ACTIVE",
      };

      if (modalMode === "create") {
        const res = await createOrganization(payload);
        setSuccess(res?.message || "Organization created successfully!");
      } else {
        const res = await updateMyOrganization(payload);
        setSuccess(res?.message || "Organization profile updated successfully!");
      }

      setShowModal(false);
      await loadData();
      refreshOrganization();
      refreshBranches();
      if (onOrgUpdated) onOrgUpdated();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || `Failed to ${modalMode} organization`);
    } finally {
      setModalLoading(false);
    }
  };

  // 10 Quick Access Modules Config
  const quickAccessItems = [
    {
      title: "Branches",
      desc: "Manage offices and campuses",
      icon: FaBuilding,
      color: "#C49A55",
      bgColor: "#F5EFE3",
      key: "branches",
    },
    {
      title: "Departments",
      desc: "Create and organize departments",
      icon: FaSitemap,
      color: "#3b82f6",
      bgColor: "#eff6ff",
      key: "departments",
    },
    {
      title: "Designations",
      desc: "Manage job roles and levels",
      icon: FaBriefcase,
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      key: "designations",
    },
    {
      title: "Teams",
      desc: "Create and manage work squads",
      icon: FaUsers,
      color: "#ec4899",
      bgColor: "#fdf2f8",
      key: "teams",
    },
    {
      title: "Locations",
      desc: "Manage office locations",
      icon: FaMapMarkerAlt,
      color: "#f97316",
      bgColor: "#fff7ed",
      key: "locations",
    },
    {
      title: "Reporting Hierarchy",
      desc: "Define reporting lines",
      icon: FaSitemap,
      color: "#C49A55",
      bgColor: "#F5EFE3",
      key: "reporting-hierarchy",
    },
    {
      title: "Job Grades",
      desc: "Configure grade levels",
      icon: FaChartBar,
      color: "#3b82f6",
      bgColor: "#eff6ff",
      key: "job-grades",
    },
    {
      title: "Cost Centers",
      desc: "Manage cost centers",
      icon: FaLayerGroup,
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      key: "cost-centers",
    },
    {
      title: "Work Calendars",
      desc: "Set working days & shifts",
      icon: FaCalendarAlt,
      color: "#ec4899",
      bgColor: "#fdf2f8",
      key: "work-calendars",
    },
    {
      title: "Shifts",
      desc: "Create and manage shifts",
      icon: FaClock,
      color: "#f97316",
      bgColor: "#fff7ed",
      key: "shifts",
    },
  ];

  const stats = useMemo(() => {
    return {
      branches: activeOrg?.stats?.branchCount ?? structureData?.branches?.length ?? (hasOrgData ? 1 : 0),
      departments: activeOrg?.stats?.departmentCount ?? structureData?.departments?.length ?? (hasOrgData ? 1 : 0),
      employees: activeOrg?.stats?.employeeCount ?? (hasOrgData ? 1 : 0),
      teams: activeOrg?.stats?.teamCount ?? structureData?.teams?.length ?? (hasOrgData ? 1 : 0),
      locations: activeOrg?.stats?.locationCount ?? structureData?.locations?.length ?? (hasOrgData ? 1 : 0),
      shifts: activeOrg?.stats?.shiftCount ?? (hasOrgData ? 1 : 0),
    };
  }, [activeOrg, structureData, hasOrgData]);

  if (loading) {
    return (
      <div className="org-loader-container">
        <Spinner animation="border" variant="success" size="lg" />
        <p className="mt-3 fw-semibold text-muted">Loading Enterprise Organization Hub...</p>
      </div>
    );
  }

  return (
    <div className="org-overview-wrapper">
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── CASE 1: NO ORGANISATION DATA (FIRST TIME ONBOARDING VIEW) ── */}
      {!hasOrgData ? (
        <div className="org-empty-onboarding-container">
          <div className="org-empty-onboarding-card">
            <div className="org-empty-icon-circle">
              <FaRocket className="org-empty-rocket-icon" />
            </div>
            <h2 className="org-empty-title">Setup Your Enterprise Organization</h2>
            <p className="org-empty-desc">
              Welcome to the HRMS Platform! No organization profile was detected.
              Please create your organization to configure your enterprise hierarchy,
              branches, departments, job roles, attendance, and employee management.
            </p>

            <div className="org-empty-steps-grid">
              <div className="org-empty-step-item">
                <div className="org-empty-step-badge">1</div>
                <div className="org-empty-step-title">Organization Profile</div>
                <div className="org-empty-step-sub">Name, Code, Legal entity & Industry</div>
              </div>
              <div className="org-empty-step-item">
                <div className="org-empty-step-badge">2</div>
                <div className="org-empty-step-title">Tax & Compliance</div>
                <div className="org-empty-step-sub">CIN, PAN, TAN, GSTIN & Reg Details</div>
              </div>
              <div className="org-empty-step-item">
                <div className="org-empty-step-badge">3</div>
                <div className="org-empty-step-title">HQ & Localization</div>
                <div className="org-empty-step-sub">Address, Currency, Timezone & FY Start</div>
              </div>
            </div>

            <div className="org-empty-cta-actions">
              {canCreate ? (
                <Button
                  className="org-btn-hero-primary org-empty-create-btn"
                  size="lg"
                  onClick={handleOpenCreateModal}
                >
                  <FaPlus className="me-2" /> Create Organization Now
                </Button>
              ) : (
                <Alert variant="warning" className="mb-0">
                  You do not have administrative permission to initialize the organization profile. Please contact your system administrator.
                </Alert>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── CASE 2: ORGANISATION DATA EXISTS (KPI & DETAILED SECTIONS) ── */
        <>

          {/* ── 2. KPI Metric Cards ── */}
          <div className="org-kpi-row">
            {/* Branches */}
            <div className="org-kpi-card" onClick={() => onNavigateTab("branches")} role="button">
              <div className="org-kpi-top">
                <div className="org-kpi-icon-wrap" style={{ background: "#F5EFE3", color: "#C49A55" }}>
                  <FaRegBuilding />
                </div>
                <div className="org-kpi-info">
                  <div className="org-kpi-label">Branches</div>
                  <div className="org-kpi-val">{stats.branches}</div>
                  <div className="org-kpi-badge" style={{ color: "#C49A55" }}>Active Offices</div>
                </div>
              </div>
              <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
                <path d="M0,22 Q25,8 50,18 T100,6" fill="none" stroke="#C49A55" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,22 Q25,8 50,18 T100,6 L100,28 L0,28 Z" fill="url(#sparkGold)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C49A55" />
                    <stop offset="100%" stopColor="#C49A55" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Departments */}
            <div className="org-kpi-card" onClick={() => onNavigateTab("departments")} role="button">
              <div className="org-kpi-top">
                <div className="org-kpi-icon-wrap" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                  <FaUsers />
                </div>
                <div className="org-kpi-info">
                  <div className="org-kpi-label">Departments</div>
                  <div className="org-kpi-val">{stats.departments}</div>
                  <div className="org-kpi-badge text-primary">Configured</div>
                </div>
              </div>
              <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
                <path d="M0,24 Q25,10 50,20 T100,8" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,24 Q25,10 50,20 T100,8 L100,28 L0,28 Z" fill="url(#sparkBlue)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Employees */}
            <div className="org-kpi-card" onClick={() => onNavigateTab("reporting-hierarchy")} role="button">
              <div className="org-kpi-top">
                <div className="org-kpi-icon-wrap" style={{ background: "#fdf2f8", color: "#ec4899" }}>
                  <FaUserFriends />
                </div>
                <div className="org-kpi-info">
                  <div className="org-kpi-label">Employees</div>
                  <div className="org-kpi-val">{stats.employees}</div>
                  <div className="org-kpi-badge" style={{ color: "#ec4899" }}>Workforce</div>
                </div>
              </div>
              <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
                <path d="M0,25 Q30,8 60,22 T100,10" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,25 Q30,8 60,22 T100,10 L100,28 L0,28 Z" fill="url(#sparkPink)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Teams */}
            <div className="org-kpi-card" onClick={() => onNavigateTab("teams")} role="button">
              <div className="org-kpi-top">
                <div className="org-kpi-icon-wrap" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
                  <FaUsers />
                </div>
                <div className="org-kpi-info">
                  <div className="org-kpi-label">Teams</div>
                  <div className="org-kpi-val">{stats.teams}</div>
                  <div className="org-kpi-badge" style={{ color: "#8b5cf6" }}>Squads</div>
                </div>
              </div>
              <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
                <path d="M0,24 Q30,6 60,18 T100,8" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,24 Q30,6 60,18 T100,8 L100,28 L0,28 Z" fill="url(#sparkPurple)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Locations */}
            <div className="org-kpi-card" onClick={() => onNavigateTab("locations")} role="button">
              <div className="org-kpi-top">
                <div className="org-kpi-icon-wrap" style={{ background: "#fff7ed", color: "#f97316" }}>
                  <FaMapMarkerAlt />
                </div>
                <div className="org-kpi-info">
                  <div className="org-kpi-label">Locations</div>
                  <div className="org-kpi-val">{stats.locations}</div>
                  <div className="org-kpi-badge text-warning">Geofenced</div>
                </div>
              </div>
              <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
                <path d="M0,25 Q30,12 60,22 T100,9" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,25 Q30,12 60,22 T100,9 L100,28 L0,28 Z" fill="url(#sparkOrange)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Active Shifts */}
            <div className="org-kpi-card" onClick={() => onNavigateTab("shifts")} role="button">
              <div className="org-kpi-top">
                <div className="org-kpi-icon-wrap" style={{ background: "#fefce8", color: "#eab308" }}>
                  <FaClock />
                </div>
                <div className="org-kpi-info">
                  <div className="org-kpi-label">Active Shifts</div>
                  <div className="org-kpi-val">{stats.shifts}</div>
                  <div className="org-kpi-badge text-muted">Rosters</div>
                </div>
              </div>
              <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
                <path d="M0,20 Q30,20 60,16 T100,12" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0,20 Q30,20 60,16 T100,12 L100,28 L0,28 Z" fill="url(#sparkYellow)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkYellow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* ── 3. Comprehensive Bento Grid: 4 Modern Pillars ── */}
          <Row className="g-3 mb-3">
            {/* Card 1: Corporate & Entity Identification */}
            <Col lg={6}>
              <div className="org-bento-card h-100">
                <div className="org-bento-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="org-bento-icon green">
                      <FaBuilding />
                    </div>
                    <div>
                      <h4 className="org-bento-title">Corporate & Legal Identity</h4>
                      <div className="org-bento-sub">Registration, branding & corporate type</div>
                    </div>
                  </div>
                  {canEdit && (
                    <Button variant="light" size="sm" className="org-bento-edit-btn" onClick={handleOpenEditModal}>
                      <FaEdit />
                    </Button>
                  )}
                </div>

                <div className="org-bento-list">
                  <div className="org-bento-row">
                    <span className="org-bento-label">Organization Name</span>
                    <span className="org-bento-val fw-bold">{getStr(activeOrg.organizationName || activeOrg.name || activeOrg.displayName || activeOrg.legalName, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Organization Code</span>
                    <span className="org-code-pill font-monospace">{getStr(activeOrg.organizationCode || activeOrg.code || activeOrg.orgCode, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Legal Registered Name</span>
                    <span className="org-bento-val">{getStr(activeOrg.legalName || activeOrg.registeredName || activeOrg.organizationName, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Display / Brand Name</span>
                    <span className="org-bento-val">{getStr(activeOrg.displayName || activeOrg.brandName || activeOrg.organizationName, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Entity Type</span>
                    <span className="org-badge-entity">{getStr(activeOrg.organizationType || activeOrg.entityType || activeOrg.type, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Industry Domain</span>
                    <span className="org-bento-val">{getStr(activeOrg.industry || activeOrg.industryType || activeOrg.domain, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Operating Status</span>
                    {getStr(activeOrg.status) ? (
                      <span className="org-hero-pill-status">
                        <span className="org-hero-green-circle" /> {getStr(activeOrg.status)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>
            </Col>

            {/* Card 2: Statutory, Tax & Compliance */}
            <Col lg={6}>
              <div className="org-bento-card h-100">
                <div className="org-bento-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="org-bento-icon purple">
                      <FaShieldAlt />
                    </div>
                    <div>
                      <h4 className="org-bento-title">Tax & Regulatory Compliance</h4>
                      <div className="org-bento-sub">CIN, PAN, TAN, GSTIN & incorporation</div>
                    </div>
                  </div>
                  {canEdit && (
                    <Button variant="light" size="sm" className="org-bento-edit-btn" onClick={handleOpenEditModal}>
                      <FaEdit />
                    </Button>
                  )}
                </div>

                <div className="org-bento-list">
                  <div className="org-bento-row">
                    <span className="org-bento-label">Registration / CIN No</span>
                    <span className="org-bento-val font-monospace">{getStr(activeOrg.registrationNumber || activeOrg.registrationNo || activeOrg.cin || activeOrg.regNo, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">PAN (Income Tax)</span>
                    <div className="d-flex align-items-center gap-1">
                      <span className="org-tax-pill">{getStr(activeOrg.pan || activeOrg.panNumber || activeOrg.panNo, "—")}</span>
                      {getStr(activeOrg.pan || activeOrg.panNumber || activeOrg.panNo) && (
                        <button
                          type="button"
                          className="org-copy-icon-btn"
                          onClick={() => copyToClipboard(getStr(activeOrg.pan || activeOrg.panNumber || activeOrg.panNo), "pan")}
                          title="Copy PAN"
                        >
                          <FaCopy size={11} />
                        </button>
                      )}
                      {copiedField === "pan" && <span className="badge bg-dark ms-1" style={{ fontSize: "0.65rem" }}>Copied!</span>}
                    </div>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">TAN (Tax Deduction)</span>
                    <div className="d-flex align-items-center gap-1">
                      <span className="org-tax-pill">{getStr(activeOrg.tan || activeOrg.tanNumber || activeOrg.tanNo, "—")}</span>
                      {getStr(activeOrg.tan || activeOrg.tanNumber || activeOrg.tanNo) && (
                        <button
                          type="button"
                          className="org-copy-icon-btn"
                          onClick={() => copyToClipboard(getStr(activeOrg.tan || activeOrg.tanNumber || activeOrg.tanNo), "tan")}
                          title="Copy TAN"
                        >
                          <FaCopy size={11} />
                        </button>
                      )}
                      {copiedField === "tan" && <span className="badge bg-dark ms-1" style={{ fontSize: "0.65rem" }}>Copied!</span>}
                    </div>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">GSTIN / Tax ID</span>
                    <div className="d-flex align-items-center gap-1">
                      <span className="org-tax-pill font-monospace">{getStr(activeOrg.gstin || activeOrg.gstNo || activeOrg.gstNumber || activeOrg.gst, "—")}</span>
                      {getStr(activeOrg.gstin || activeOrg.gstNo || activeOrg.gstNumber || activeOrg.gst) && (
                        <button
                          type="button"
                          className="org-copy-icon-btn"
                          onClick={() => copyToClipboard(getStr(activeOrg.gstin || activeOrg.gstNo || activeOrg.gstNumber || activeOrg.gst), "gstin")}
                          title="Copy GSTIN"
                        >
                          <FaCopy size={11} />
                        </button>
                      )}
                      {copiedField === "gstin" && <span className="badge bg-dark ms-1" style={{ fontSize: "0.65rem" }}>Copied!</span>}
                    </div>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Date of Incorporation</span>
                    <span className="org-bento-val">
                      {activeOrg.incorporationDate
                        ? (() => {
                            try {
                              const d = new Date(activeOrg.incorporationDate);
                              return !isNaN(d.getTime())
                                ? d.toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : String(activeOrg.incorporationDate);
                            } catch (e) {
                              return String(activeOrg.incorporationDate);
                            }
                          })()
                        : "—"}
                    </span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Financial Year Period</span>
                    <span className="org-bento-val fw-semibold">
                      {getStr(activeOrg.financialYearStart, "04-01")} (Starts {getStr(activeOrg.financialYearStart) === "01-01" ? "Jan 1" : "Apr 1"})
                    </span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Currency & Timezone</span>
                    <span className="org-bento-val">
                      {[getStr(activeOrg.currency, "INR"), getStr(activeOrg.timeZone, "Asia/Kolkata")].filter(Boolean).join(" • ") || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            {/* Card 3: Contact & Headquarters Location */}
            <Col lg={6}>
              <div className="org-bento-card h-100">
                <div className="org-bento-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="org-bento-icon orange">
                      <FaMapMarkerAlt />
                    </div>
                    <div>
                      <h4 className="org-bento-title">Headquarters & Contact</h4>
                      <div className="org-bento-sub">Official communications & physical address</div>
                    </div>
                  </div>
                </div>

                <div className="org-bento-list">
                  <div className="org-bento-row">
                    <span className="org-bento-label d-flex align-items-center gap-1">
                      <FaEnvelope className="text-muted" size={12} /> Official Email
                    </span>
                    <span className="org-bento-val text-truncate" style={{ maxWidth: "240px" }}>
                      {getStr(activeOrg.email || activeOrg.officialEmail || activeOrg.contactEmail) ? (
                        <a href={`mailto:${getStr(activeOrg.email || activeOrg.officialEmail || activeOrg.contactEmail)}`} className="text-primary text-decoration-none">
                          {getStr(activeOrg.email || activeOrg.officialEmail || activeOrg.contactEmail)}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label d-flex align-items-center gap-1">
                      <FaPhone className="text-muted" size={12} /> Contact Phone
                    </span>
                    <span className="org-bento-val">{getStr(activeOrg.phone || activeOrg.phoneNumber || activeOrg.contactPhone, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label d-flex align-items-center gap-1">
                      <FaGlobe className="text-muted" size={12} /> Official Website
                    </span>
                    <span className="org-bento-val text-truncate" style={{ maxWidth: "240px" }}>
                      {getStr(activeOrg.website || activeOrg.websiteUrl || activeOrg.url) ? (
                        <a
                          href={getStr(activeOrg.website || activeOrg.websiteUrl || activeOrg.url).startsWith("http") ? getStr(activeOrg.website || activeOrg.websiteUrl || activeOrg.url) : `https://${getStr(activeOrg.website || activeOrg.websiteUrl || activeOrg.url)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                        >
                          {getStr(activeOrg.website || activeOrg.websiteUrl || activeOrg.url)}
                          <FaExternalLinkAlt size={10} />
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Street Address</span>
                    <span className="org-bento-val">{getStr(activeOrg.address, "—")}</span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">City / State</span>
                    <span className="org-bento-val">
                      {[getStr(activeOrg.city), getStr(activeOrg.state)].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="org-bento-row">
                    <span className="org-bento-label">Country & PIN</span>
                    <span className="org-bento-val">
                      {[getStr(activeOrg.country || "India"), getStr(activeOrg.pincode)].filter(Boolean).join(" - ") || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Card 4: Structure Hierarchy Visual */}
            <Col lg={6}>
              <div className="org-bento-card h-100">
                <div className="org-bento-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="org-bento-icon blue">
                      <FaSitemap />
                    </div>
                    <div>
                      <h4 className="org-bento-title">Organization Structure</h4>
                      <div className="org-bento-sub">Hierarchy tree & department distribution</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="org-link-btn"
                    onClick={() => onNavigateTab("reporting-hierarchy")}
                  >
                    Full Tree &rarr;
                  </button>
                </div>

                <div className="org-mini-tree-container">
                  <div className="org-mini-tree-root">
                    <div className="org-mini-tree-root-box">
                      <div className="org-mini-tree-root-avatar">
                        <FaUserTie />
                      </div>
                      <div>
                        <div className="org-mini-tree-root-name">
                          {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Organization Owner"}
                        </div>
                        <div className="org-mini-tree-root-role">
                          {user?.roleName || "Owner / Executive"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="org-mini-tree-line-v"></div>
                  <div className="org-mini-tree-line-h"></div>

                  <div className="org-mini-tree-children">
                    <div
                      className="org-mini-tree-child-box"
                      onClick={() => onNavigateTab("branches")}
                      role="button"
                    >
                      <div className="org-mini-child-icon text-primary"><FaBuilding /></div>
                      <div className="org-mini-child-title">Branches</div>
                      <div className="org-mini-child-count">{stats.branches} offices</div>
                    </div>

                    <div
                      className="org-mini-tree-child-box"
                      onClick={() => onNavigateTab("departments")}
                      role="button"
                    >
                      <div className="org-mini-child-icon text-success"><FaSitemap /></div>
                      <div className="org-mini-child-title">Departments</div>
                      <div className="org-mini-child-count">{stats.departments} depts</div>
                    </div>

                    <div
                      className="org-mini-tree-child-box"
                      onClick={() => onNavigateTab("teams")}
                      role="button"
                    >
                      <div className="org-mini-child-icon" style={{ color: "#8b5cf6" }}><FaUsers /></div>
                      <div className="org-mini-child-title">Teams</div>
                      <div className="org-mini-child-count">{stats.teams} squads</div>
                    </div>

                    <div
                      className="org-mini-tree-child-box"
                      onClick={() => onNavigateTab("reporting-hierarchy")}
                      role="button"
                    >
                      <div className="org-mini-child-icon" style={{ color: "#ec4899" }}><FaUserFriends /></div>
                      <div className="org-mini-child-title">Employees</div>
                      <div className="org-mini-child-count">{stats.employees} users</div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* ── 4. Quick Access Modules (Full Width Grid) ── */}
          <div className="org-bento-card mb-3">
            <div className="org-bento-header">
              <div>
                <h4 className="org-bento-title">Organization Modules & Sub-systems</h4>
                <div className="org-bento-sub">Access and configure departments, branches, job grades, and shifts</div>
              </div>
              <button
                type="button"
                className="org-link-btn"
                onClick={() => onNavigateTab("settings")}
              >
                <FaCog className="me-1" /> Global Settings
              </button>
            </div>

            <div className="org-quick-module-grid">
              {quickAccessItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    className="org-module-box"
                    onClick={() => onNavigateTab(item.key)}
                    role="button"
                  >
                    <div
                      className="org-module-box-icon"
                      style={{ background: item.bgColor, color: item.color }}
                    >
                      <IconComponent />
                    </div>
                    <div className="org-module-box-content">
                      <div className="org-module-box-title">{item.title}</div>
                      <div className="org-module-box-desc">{item.desc}</div>
                    </div>
                    <FaChevronRight className="org-module-box-arrow" />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── 5. Create / Edit Organization Modal ── */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        backdrop="static"
        className="org-modal"
      >
        <Form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton className="border-bottom px-4 py-3">
            <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold text-dark">
              <FaBuilding className="text-success" />
              {modalMode === "create" ? "Create Enterprise Organization" : "Edit Organization Profile"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-0">
            {modalError && <Alert variant="danger" className="m-3 mb-0">{modalError}</Alert>}

            <Tab.Container activeKey={modalActiveTab} onSelect={(k) => setModalActiveTab(k || "basic")}>
              <Nav variant="tabs" className="px-3 pt-2 bg-light border-bottom org-modal-nav">
                <Nav.Item>
                  <Nav.Link eventKey="basic" className="fw-semibold">
                    <FaBuilding className="me-1" /> 1. Entity & Corporate
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="statutory" className="fw-semibold">
                    <FaShieldAlt className="me-1" /> 2. Tax & Legal
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="contact" className="fw-semibold">
                    <FaEnvelope className="me-1" /> 3. Contact & Web
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="address" className="fw-semibold">
                    <FaMapMarkerAlt className="me-1" /> 4. Headquarters Address
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="localization" className="fw-semibold">
                    <FaCog className="me-1" /> 5. Localization & FY
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content className="p-4">
                {/* ── Tab 1: Entity & Corporate Details ── */}
                <Tab.Pane eventKey="basic">
                  <div className="org-form-section-title">Core Organization Identity</div>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Organization Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          required
                          maxLength={100}
                          placeholder="e.g. FlareMinds Technology And Services"
                          value={formData.organizationName}
                          onChange={(e) =>
                            setFormData({ ...formData, organizationName: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Organization Code <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          required
                          maxLength={30}
                          placeholder="e.g. FLMT"
                          value={formData.organizationCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              organizationCode: e.target.value.toUpperCase().replace(/\s+/g, ""),
                            })
                          }
                        />
                        <Form.Text className="text-muted">Unique corporate ID code in uppercase</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Legal / Registered Entity Name</Form.Label>
                        <Form.Control
                          maxLength={150}
                          placeholder="e.g. FlareMinds Technology and Services Pvt Ltd"
                          value={formData.legalName}
                          onChange={(e) =>
                            setFormData({ ...formData, legalName: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Display / Trade Name</Form.Label>
                        <Form.Control
                          maxLength={100}
                          placeholder="e.g. FlareMinds Tech"
                          value={formData.displayName}
                          onChange={(e) =>
                            setFormData({ ...formData, displayName: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Organization Type</Form.Label>
                        <Form.Select
                          value={formData.organizationType}
                          onChange={(e) =>
                            setFormData({ ...formData, organizationType: e.target.value })
                          }
                        >
                          <option value="">Select Organization Type</option>
                          {ORG_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Industry Sector</Form.Label>
                        <Form.Control
                          placeholder="e.g. Information Technology & Software"
                          value={formData.industry}
                          onChange={(e) =>
                            setFormData({ ...formData, industry: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Status</Form.Label>
                        <Form.Select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value })
                          }
                        >
                          <option value="">Select Status</option>
                          {ORG_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Organization Logo (URL or Upload Image)</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                          <Form.Control
                            placeholder="e.g. https://flareminds.com/assets/logo.png"
                            value={formData.logo}
                            onChange={(e) =>
                              setFormData({ ...formData, logo: e.target.value })
                            }
                          />
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{ maxWidth: "220px" }}
                          />
                        </div>
                        {formData.logo && (
                          <div className="mt-2 d-flex align-items-center gap-2">
                            <span className="text-muted small">Preview:</span>
                            <img
                              src={formData.logo}
                              alt="Logo Preview"
                              style={{ height: "40px", maxWidth: "120px", objectFit: "contain", borderRadius: "6px" }}
                            />
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab.Pane>

                {/* ── Tab 2: Statutory & Tax Compliance ── */}
                <Tab.Pane eventKey="statutory">
                  <div className="org-form-section-title">Statutory & Legal Compliance</div>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Registration / CIN Number</Form.Label>
                        <Form.Control
                          placeholder="e.g. U72200MH2020PTC123456"
                          value={formData.registrationNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, registrationNumber: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Date of Incorporation</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.incorporationDate}
                          onChange={(e) =>
                            setFormData({ ...formData, incorporationDate: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">PAN (Permanent Account Number)</Form.Label>
                        <Form.Control
                          placeholder="e.g. AAACF1234K"
                          value={formData.pan}
                          onChange={(e) =>
                            setFormData({ ...formData, pan: e.target.value.toUpperCase() })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">TAN (Tax Deduction Account No)</Form.Label>
                        <Form.Control
                          placeholder="e.g. BLRM12345D"
                          value={formData.tan}
                          onChange={(e) =>
                            setFormData({ ...formData, tan: e.target.value.toUpperCase() })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">GSTIN</Form.Label>
                        <Form.Control
                          placeholder="e.g. 29AAACF1234K1ZV"
                          value={formData.gstin}
                          onChange={(e) =>
                            setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab.Pane>

                {/* ── Tab 3: Contact & Web Details ── */}
                <Tab.Pane eventKey="contact">
                  <div className="org-form-section-title">Official Communications</div>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Official Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="e.g. contact@flareminds.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value.toLowerCase() })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Official Contact Phone</Form.Label>
                        <Form.Control
                          placeholder="e.g. +91 98765 43210"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Corporate Website</Form.Label>
                        <Form.Control
                          placeholder="e.g. https://www.flareminds.com"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({ ...formData, website: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab.Pane>

                {/* ── Tab 4: Headquarters Physical Address ── */}
                <Tab.Pane eventKey="address">
                  <div className="org-form-section-title">Registered Headquarters Location</div>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Street Address</Form.Label>
                        <Form.Control
                          placeholder="e.g. Tech Park, 4th Floor, Sector 5, Outer Ring Road"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">City</Form.Label>
                        <Form.Control
                          placeholder="e.g. Bengaluru"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">State / Province</Form.Label>
                        <Form.Control
                          placeholder="e.g. Karnataka"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Country</Form.Label>
                        <Form.Control
                          placeholder="e.g. India"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">PIN / Postal Code</Form.Label>
                        <Form.Control
                          placeholder="e.g. 560103"
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData({ ...formData, pincode: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab.Pane>

                {/* ── Tab 5: Localization & Financial Settings ── */}
                <Tab.Pane eventKey="localization">
                  <div className="org-form-section-title">System Localization & Financial Defaults</div>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Operating Currency</Form.Label>
                        <Form.Select
                          value={formData.currency}
                          onChange={(e) =>
                            setFormData({ ...formData, currency: e.target.value })
                          }
                        >
                          <option value="">Select Currency</option>
                          <option value="INR">INR (₹ - Indian Rupee)</option>
                          <option value="USD">USD ($ - US Dollar)</option>
                          <option value="EUR">EUR (€ - Euro)</option>
                          <option value="GBP">GBP (£ - British Pound)</option>
                          <option value="AED">AED (د.إ - UAE Dirham)</option>
                          <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Timezone</Form.Label>
                        <Form.Select
                          value={formData.timeZone}
                          onChange={(e) =>
                            setFormData({ ...formData, timeZone: e.target.value })
                          }
                        >
                          <option value="">Select Time Zone</option>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                          <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                          <option value="Europe/London">Europe/London (GMT/BST)</option>
                          <option value="America/New_York">America/New_York (EST/EDT)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Financial Year Start (MM-DD)</Form.Label>
                        <Form.Select
                          value={formData.financialYearStart}
                          onChange={(e) =>
                            setFormData({ ...formData, financialYearStart: e.target.value })
                          }
                        >
                          <option value="">Select FY Start</option>
                          <option value="04-01">04-01 (April 1st)</option>
                          <option value="01-01">01-01 (January 1st)</option>
                          <option value="07-01">07-01 (July 1st)</option>
                          <option value="10-01">10-01 (October 1st)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Modal.Body>

          <Modal.Footer className="bg-light px-4 py-3 border-top">
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={modalLoading} className="px-3">
              {modalLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Saving...
                </>
              ) : modalMode === "create" ? (
                "Create Organization"
              ) : (
                "Save Changes"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default OrgOverview;
