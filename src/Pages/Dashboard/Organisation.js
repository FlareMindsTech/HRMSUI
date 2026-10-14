import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaMoneyCheckAlt,
  FaCalendarWeek,
  FaClock,
  FaCalendarAlt,
  FaUmbrellaBeach,
  FaCog,
  FaEdit,
  FaCheckCircle,
  FaBriefcase,
  FaBolt,
  FaRegCalendarAlt,
  FaPlus,
  FaCrown,
  FaCalendarCheck,
  FaCodeBranch,
} from "react-icons/fa";
import { useSelector, useDispatch } from 'react-redux';
import { selectAuthUser, useHasPermission } from '../../redux/slices/authSlice';
import {
  fetchOrgResource,
  invalidateOrgResource,
  setOrgResource,
  selectOrgProfile,
} from '../../redux/slices/organizationSlice';
import { useBranch } from "../../context/BranchContext";
import { normalizeOrganization, resolveMediaUrl } from "../../services/organizationService";
import OrgOverview from "../../Components/Organisation/OrgOverview";
import LocationsSection from "../../Components/Organisation/LocationsSection";
import JobGradesSection from "../../Components/Organisation/JobGradesSection";
import CostCentersSection from "../../Components/Organisation/CostCentersSection";
import WorkCalendarsSection from "../../Components/Organisation/WorkCalendarsSection";
import AttendanceWorkspaceSection from "../../Components/Organisation/AttendanceWorkspaceSection";
import ShiftsSection from "../../Components/Organisation/ShiftsSection";
import FinancialYearsSection from "../../Components/Organisation/FinancialYearsSection";
import HolidayCalendarsSection from "../../Components/Organisation/HolidayCalendarsSection";
import LeaveSettingsSection from "../../Components/Organisation/LeaveSettingsSection";
import SubscriptionSection from "../../Components/Organisation/SubscriptionSection";
import OrgSetupWizard from "../../Components/Organisation/OrgSetupWizard";
import EditOrgProfilePage from "../../Components/Organisation/EditOrgProfilePage";
import "./Organisation.css";

// ── Categorized Navigation Tabs matching Target UI Grouping ──
const ORG_NAV_GROUPS = [
  {
    groupId: "overview",
    groupTitle: "Overview",
    groupIcon: FaBuilding,
    tabs: [
      { key: "overview", label: "Overview", icon: FaBuilding, perm: "organization.view" },
    ],
  },
  {
    groupId: "subscription",
    groupTitle: "Subscription",
    groupIcon: FaCrown,
    tabs: [
      { key: "subscription", label: "Subscription", icon: FaCrown, perm: "organization.view" },
    ],
  },
  {
    groupId: "workplace",
    groupTitle: "Workplace",
    groupIcon: FaMapMarkerAlt,
    tabs: [
      { key: "locations", label: "Locations", icon: FaMapMarkerAlt, perm: "location.view" },
      { key: "work-calendars", label: "Work Calendars", icon: FaCalendarWeek, perm: "workCalendar.view" },
      { key: "attendance", label: "Attendance", icon: FaCalendarCheck, perm: "organization.view" },
    ],
  },
  {
    groupId: "hr-masters",
    groupTitle: "HR Masters",
    groupIcon: FaLayerGroup,
    tabs: [
      { key: "job-grades", label: "Job Grades", icon: FaLayerGroup, perm: "jobGrade.view" },
      { key: "shifts", label: "Shifts", icon: FaClock, perm: "shift.view" },
      { key: "holiday-calendars", label: "Holiday Calendars", icon: FaUmbrellaBeach, perm: "holidayCalendar.view" },
      { key: "leave-settings", label: "Leave Settings", icon: FaCalendarCheck, perm: "leave.policy.manage" },
      { key: "financial-years", label: "Financial Years", icon: FaCalendarAlt, perm: "financialYear.view" },
      { key: "cost-centers", label: "Cost Centers", icon: FaMoneyCheckAlt, perm: "costCenter.view" },
    ],
  },
];

const STANDALONE_SECTIONS = ["edit-profile", "profile"];

const ALL_TABS = ORG_NAV_GROUPS.flatMap((g) => g.tabs);

const isKnownSection = (sec) =>
  Boolean(sec) && (ALL_TABS.some((t) => t.key === sec) || STANDALONE_SECTIONS.includes(sec));

const getStr = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim() !== "" ? val.trim() : fallback;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (val.url) return String(val.url);
    if (val.secure_url) return String(val.secure_url);
    if (val.path) return String(val.path);
    if (val.src) return String(val.src);
    if (val.location) return String(val.location);
    if (val.name) return String(val.name);
    if (val.code) return String(val.code);
  }
  return fallback;
};

function Organisation() {
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectAuthUser);
  const hasPermission = useHasPermission();
  const { organization, refreshOrganization, refreshBranches } = useBranch();
  const dispatch = useDispatch();
  const orgProfile = useSelector(selectOrgProfile);

  const [orgData, setOrgData] = useState(organization || null);
  const [loadingOrg, setLoadingOrg] = useState(!organization);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCategory, setActiveCategory] = useState("Overview");
  const [copiedField, setCopiedField] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isOwner =
    user?.roleCode === "OWNER" ||
    user?.priority === 1 ||
    user?.role === "OWNER" ||
    user?.permissions?.includes("*");

  const canEdit = Boolean(
    (hasPermission && (hasPermission("organization.update") || hasPermission("organisation.update"))) ||
    isOwner
  );

  const loadOrg = useCallback(async () => {
    try {
      await dispatch(fetchOrgResource({ key: "profile", force: true })).catch(() => null);
    } catch (err) {
      console.warn("Could not load organization in parent header:", err);
    } finally {
      setLoadingOrg(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (orgProfile) {
      setOrgData(normalizeOrganization(orgProfile) || orgProfile);
      setLoadingOrg(false);
    } else if (organization) {
      setOrgData(normalizeOrganization(organization) || organization);
      setLoadingOrg(false);
    } else {
      try {
        const cached = localStorage.getItem("cached_org_profile");
        if (cached) {
          setOrgData(normalizeOrganization(JSON.parse(cached)));
        }
      } catch (e) {
        // corrupt cache: ignore
      }
    }
  }, [orgProfile, organization]);

  const handleOrgCreated = useCallback(
    async (newOrg) => {
      const norm = normalizeOrganization(newOrg) || newOrg;
      setOrgData(norm);
      dispatch(setOrgResource({ key: "profile", data: norm }));
      dispatch(invalidateOrgResource("structure"));
      if (refreshOrganization) await refreshOrganization();
      if (refreshBranches) await refreshBranches();
      loadOrg();
    },
    [dispatch, loadOrg, refreshOrganization, refreshBranches]
  );

  const handleOrgUpdated = useCallback((updated) => {
    if (updated) {
      const norm = normalizeOrganization(updated) || updated;
      setOrgData(norm);
      dispatch(setOrgResource({ key: "profile", data: norm }));
    }
    loadOrg();
  }, [dispatch, loadOrg]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  useEffect(() => {
    if (section === "settings") {
      navigate("/settings/organization", { replace: true });
      return;
    }
    if (section === "branch-settings") {
      navigate("/settings/branches", { replace: true });
      return;
    }
    if (section === "profile") {
      setActiveTab("overview");
      setActiveCategory("Overview");
    } else if (isKnownSection(section)) {
      setActiveTab(section);
      const foundGroup = ORG_NAV_GROUPS.find((g) => g.tabs.some((t) => t.key === section));
      if (foundGroup) setActiveCategory(foundGroup.groupTitle);
    } else if (["departments", "designations", "teams", "reporting-hierarchy"].includes(section)) {
      const tabParam = section === "reporting-hierarchy" ? "reporting" : section;
      navigate(`/organisation/branches?tab=${tabParam}`, { replace: true });
      return;
    } else if (section === "users" || section === "roles") {
      navigate(`/${section}`, { replace: true });
      return;
    } else if (section === "organization-access") {
      navigate("/settings/organization", { replace: true });
      return;
    } else {
      setActiveTab("overview");
      setActiveCategory("Overview");
    }
  }, [section, location.pathname, navigate]);

  const handleTabSelect = (tabKey) => {
    if (tabKey === "branches") {
      navigate("/organisation/branches");
      return;
    }
    if (tabKey === "settings") {
      navigate("/settings/organization");
      return;
    }
    if (tabKey === "branch-settings") {
      navigate("/settings/branches");
      return;
    }
    if (tabKey === "profile") {
      tabKey = "overview";
    }
    setActiveTab(tabKey);
    const foundGroup = ORG_NAV_GROUPS.find((g) => g.tabs.some((t) => t.key === tabKey));
    if (foundGroup) setActiveCategory(foundGroup.groupTitle);

    if (tabKey === "overview") {
      navigate("/organisation");
    } else {
      navigate(`/organisation/${tabKey}`);
    }
  };

  const handleCategorySelect = (group) => {
    setActiveCategory(group.groupTitle);
    const hasCurrentTab = group.tabs.some((t) => t.key === activeTab);
    if (!hasCurrentTab && group.tabs.length > 0) {
      handleTabSelect(group.tabs[0].key);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (fieldName) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2500);
    }
  };

  const storedOrgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");
  const hasNoOrg = !loadingOrg && !orgData && !user?.organizationId && !storedOrgId;

  const currentOrg = useMemo(() => {
    return orgData ? normalizeOrganization(orgData) || orgData : null;
  }, [orgData]);

  const userDisplayName = useMemo(() => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName) return `${user.firstName} ${user.lastName || ""}`.trim();
    if (user?.name) return user.name;
    return "Enterprise Admin";
  }, [user]);

  const greetingText = useMemo(() => {
    const hr = currentDateTime.getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentDateTime]);

  const dateFormatted = useMemo(() => {
    return currentDateTime.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [currentDateTime]);

  const timeFormatted = useMemo(() => {
    return currentDateTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentDateTime]);

  const orgInitials = useMemo(() => {
    const name = getStr(currentOrg?.displayName || currentOrg?.organizationName, "HRMS");
    return name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [currentOrg]);

  const renderActiveSection = () => {
    switch (activeTab) {
      case "edit-profile":
        return (
          <EditOrgProfilePage
            orgData={currentOrg}
            onBack={() => handleTabSelect("overview")}
            onOrgUpdated={handleOrgUpdated}
          />
        );
      case "profile":
      case "overview":
        return (
          <OrgOverview
            orgData={currentOrg}
            onNavigateTab={handleTabSelect}
            onOrgUpdated={handleOrgUpdated}
          />
        );
      case "branches":
        return <Navigate to="/organisation/branches" replace />;
      case "subscription":
        return <SubscriptionSection />;
      case "departments":
      case "designations":
      case "teams":
      case "reporting-hierarchy": {
        const tabParam = activeTab === "reporting-hierarchy" ? "reporting" : activeTab;
        return <Navigate to={`/organisation/branches?tab=${tabParam}`} replace />;
      }
      case "locations":
        return <LocationsSection />;
      case "job-grades":
        return <JobGradesSection />;
      case "cost-centers":
        return <CostCentersSection />;
      case "work-calendars":
        return <WorkCalendarsSection />;
      case "attendance":
        return <AttendanceWorkspaceSection onNavigateTab={handleTabSelect} />;
      case "shifts":
        return <ShiftsSection />;
      case "holiday-calendars":
        return <HolidayCalendarsSection />;
      case "leave-settings":
        return <LeaveSettingsSection />;
      case "financial-years":
        return <FinancialYearsSection />;
      case "users":
      case "roles":
        return <Navigate to={`/${activeTab}`} replace />;
      case "organization-access":
        return <Navigate to="/settings/organization" replace />;
      case "settings":
      case "branch-settings":
        return <Navigate to={activeTab === "branch-settings" ? "/settings/branches" : "/settings/organization"} replace />;
      default:
        return (
          <OrgOverview
            orgData={currentOrg}
            onNavigateTab={handleTabSelect}
            onOrgUpdated={handleOrgUpdated}
          />
        );
    }
  };

  if (loadingOrg && !currentOrg) {
    return (
      <div className="org-dashboard-container">
        <div className="org-loader-container-full">
          <div className="spinner-border" style={{ color: "var(--color-primary, #C49A55)", width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3 fw-bold" style={{ color: "#77736B", fontSize: "0.95rem" }}>
            Loading Enterprise Organization Hub...
          </div>
        </div>
      </div>
    );
  }

  // First-Time Setup Wizard if no organization exists
  if (hasNoOrg) {
    if (isOwner) {
      return (
        <div className="org-dashboard-container">
          <OrgSetupWizard onOrgCreated={handleOrgCreated} />
        </div>
      );
    }
    return (
      <div className="org-dashboard-container p-4 text-center">
        <div className="onboarding-dash-card p-5 bg-white mx-auto shadow-sm" style={{ maxWidth: 640 }}>
          <FaBuilding className="text-warning fs-1 mb-3" />
          <h4 className="fw-bold text-dark">No Organization Setup Found</h4>
          <p className="text-muted">
            Your organization has not been configured yet. Please contact your organization administrator or owner to complete the initial setup.
          </p>
        </div>
      </div>
    );
  }

  // Dedicated Edit Profile Full Page
  if (activeTab === "edit-profile") {
    return (
      <div className="org-dashboard-container">
        <EditOrgProfilePage
          orgData={currentOrg}
          onBack={() => handleTabSelect("overview")}
          onOrgUpdated={handleOrgUpdated}
        />
      </div>
    );
  }

  const activeTabObj = ALL_TABS.find((t) => t.key === activeTab) || null;
  const currentCategoryGroup = ORG_NAV_GROUPS.find((g) => g.groupTitle === activeCategory) || ORG_NAV_GROUPS[0];

  return (
    <div className="org-dashboard-container">
      {/* ── 1. TOP EXECUTIVE HEADER BAR ── */}
      <div className="org-greeting-header-bar">
        <div className="org-greeting-left">
          <div className="org-header-breadcrumb">
            <span
              className="org-breadcrumb-root"
              onClick={() => handleTabSelect("overview")}
              role="button"
              title="Return to Overview"
              tabIndex={0}
            >
              Organization
            </span>
            {activeCategory !== "Overview" && (
              <>
                <span>/</span>
                <span className="org-breadcrumb-current">{activeCategory}</span>
              </>
            )}
            {activeTabObj && activeCategory !== "Overview" && activeTabObj.label !== activeCategory && (
              <>
                <span>/</span>
                <span className="org-breadcrumb-current">{activeTabObj.label}</span>
              </>
            )}
          </div>
          <h2 className="org-greeting-headline">
            {getStr(orgData?.displayName || orgData?.organizationName, "Enterprise Organization")}
          </h2>
          <p className="org-greeting-subline">
            SaaS Tenant Governance &middot; {greetingText}, <span className="org-greeting-user">{userDisplayName}</span>
          </p>
        </div>

        <div className="org-greeting-right">
          <div className="org-datetime-card">
            <div className="org-calendar-icon-box">
              <FaRegCalendarAlt className="org-calendar-icon" />
            </div>
            <div className="org-datetime-content">
              <div className="org-datetime-date">{dateFormatted}</div>
              <div className="org-datetime-time">
                <FaClock size={10} className="me-1 text-muted" />
                {timeFormatted} &middot; <span className="text-secondary fw-semibold">{getStr(orgData?.timeZone, "Asia/Kolkata")}</span>
              </div>
            </div>
          </div>

          <Dropdown className="org-quick-actions-dropdown">
            <Dropdown.Toggle className="org-btn-quick-actions">
              <FaBolt className="me-1 text-warning" /> Quick Actions
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="org-dropdown-menu shadow">
              <Dropdown.Item onClick={() => navigate("/organisation/branches?tab=departments")}>
                <FaPlus className="me-2 text-primary" /> Add Department
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/organisation/branches?action=create")}>
                <FaPlus className="me-2 text-success" /> Add Branch
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/organisation/branches?tab=reporting")}>
                <FaPlus className="me-2 text-info" /> Add Employee
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleTabSelect("locations")}>
                <FaPlus className="me-2 text-warning" /> Add Location
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleTabSelect("shifts")}>
                <FaPlus className="me-2 text-danger" /> Configure Shift
              </Dropdown.Item>
              <Dropdown.Divider />
              {canEdit && (
                <Dropdown.Item onClick={() => handleTabSelect("edit-profile")}>
                  <FaEdit className="me-2 text-warning" /> Edit Organization Profile
                </Dropdown.Item>
              )}
              <Dropdown.Item onClick={() => navigate("/settings/organization")}>
                <FaCog className="me-2 text-secondary" /> Global Settings
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* ── 2. EXECUTIVE HERO BANNER CARD ── */}
      {orgData && activeTab !== "edit-profile" && (
        <div className="org-hero-card-exact mb-4">
          <div className="org-hero-bg-glow" />
          <svg className="org-hero-bg-waves" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <path d="M 400 0 C 650 180, 750 20, 1000 80 L 1000 0 Z" fill="var(--color-primary, #C49A55)" opacity="0.04" />
          </svg>

          <div className="org-hero-content-wrapper">
            <div className="org-hero-main-section">
              <div className="org-hero-logo-box">
                {Boolean(resolveMediaUrl(getStr(orgData.logo))) ? (
                  <img
                    key={resolveMediaUrl(getStr(orgData.logo))}
                    src={resolveMediaUrl(getStr(orgData.logo))}
                    alt="Logo"
                    className="org-hero-logo-image"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                <div
                  className="org-hero-logo-monogram"
                  style={{ display: resolveMediaUrl(getStr(orgData.logo)) ? "none" : "flex" }}
                >
                  {orgInitials}
                </div>
              </div>

              <div className="org-hero-details">
                <div className="org-hero-name-row">
                  <h1 className="org-hero-org-name">
                    {getStr(orgData.displayName || orgData.organizationName, "Organization")}
                  </h1>
                  <span className="org-verified-badge" title="Verified SaaS Tenant Organization">
                    <FaCheckCircle className="org-hero-check-badge text-success" /> Verified Tenant
                  </span>
                  {getStr(orgData.status) && (
                    <span className="org-hero-pill-status">
                      <span className="org-hero-green-circle" /> {getStr(orgData.status)}
                    </span>
                  )}
                  {getStr(orgData.organizationType) && (
                    <span className="org-hero-pill-entity">
                      <FaBuilding className="me-1 text-muted small" />
                      {getStr(orgData.organizationType).replace("_", " ")}
                    </span>
                  )}
                </div>

                <div className="org-hero-chips-bar mt-2">
                  {getStr(orgData.organizationCode) && (
                    <div
                      className="org-hero-chip code"
                      onClick={() => copyToClipboard(getStr(orgData.organizationCode), "code")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copyToClipboard(getStr(orgData.organizationCode), "code"); } }}
                      title="Click to copy Organization Code"
                    >
                      <span className="org-chip-icon-wrap"><FaBuilding /></span>
                      <span className="font-monospace fw-bold">{getStr(orgData.organizationCode)}</span>
                      {copiedField === "code" ? (
                        <span className="org-chip-copied-text">Copied!</span>
                      ) : (
                        <span className="org-chip-copy-hint">Copy</span>
                      )}
                    </div>
                  )}

                  {getStr(orgData.industry) && (
                    <div className="org-hero-chip industry">
                      <span className="org-chip-icon-wrap"><FaBriefcase /></span>
                      <span>{getStr(orgData.industry)}</span>
                    </div>
                  )}

                  {[getStr(orgData.city), getStr(orgData.country)].filter(Boolean).join(", ") && (
                    <div className="org-hero-chip location">
                      <span className="org-chip-icon-wrap text-danger"><FaMapMarkerAlt /></span>
                      <span>{[getStr(orgData.city), getStr(orgData.country)].filter(Boolean).join(", ")}</span>
                    </div>
                  )}

                  {getStr(orgData.currency) && (
                    <div className="org-hero-chip currency">
                      <span className="org-chip-icon-wrap text-warning"><FaMoneyCheckAlt /></span>
                      <span>{getStr(orgData.currency)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="org-hero-right-section">
              <div className="org-hero-quick-meta">
                <div className="org-hero-meta-item">
                  <span className="org-hero-meta-label">Financial Year</span>
                  <span className="org-hero-meta-val">{getStr(orgData.financialYearStart, "04-01")}</span>
                </div>
                <div className="org-hero-meta-divider" />
                <div className="org-hero-meta-item">
                  <span className="org-hero-meta-label">Timezone</span>
                  <span className="org-hero-meta-val">{getStr(orgData.timeZone, "Asia/Kolkata")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. EXECUTIVE DUAL-TIER NAVIGATION CONSOLE ── */}
      <div className="org-dual-nav-console mb-4">
        {/* Tier 1: Category Level Navigation */}
        <div className="org-category-tier">
          <div className="org-category-track" role="tablist">
            {ORG_NAV_GROUPS.map((group) => {
              const GroupIcon = group.groupIcon;
              const isGroupActive = activeCategory === group.groupTitle;
              const subCount = group.tabs.length;
              return (
                <button
                  key={group.groupTitle}
                  type="button"
                  role="tab"
                  aria-selected={isGroupActive}
                  className={`org-category-btn ${isGroupActive ? "active" : ""}`}
                  onClick={() => handleCategorySelect(group)}
                >
                  {GroupIcon && <GroupIcon className="org-category-icon" />}
                  <span className="org-category-btn-text">{group.groupTitle}</span>
                  {subCount > 1 && (
                    <span className="org-category-count-badge">
                      {subCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="org-nav-tier-actions">
            <div className="org-nav-status-badge d-none d-md-inline-flex">
              <span className="org-nav-status-pulse" />
              <span>Tenant Governance</span>
            </div>
            <button
              type="button"
              className="org-nav-branch-link-btn"
              onClick={() => navigate("/organisation/branches")}
              title="Open Branch Workspace"
            >
              <FaCodeBranch className="org-nav-branch-icon" />
              <span>Branch Workspace</span>
              <span className="org-nav-branch-arrow">↗</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Sub-Module Docked Rail (shown when active category has multiple modules) */}
        {currentCategoryGroup && currentCategoryGroup.tabs.length > 1 && (
          <div className="org-submodule-tier">
            <div className="org-submodule-left-wrap">
              <div className="org-submodule-scope-label">
                <span className="org-submodule-scope-dot" />
                <span>{currentCategoryGroup.groupTitle} Modules</span>
              </div>
              <div className="org-submodule-list" role="tablist">
                {currentCategoryGroup.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isTabActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isTabActive}
                      className={`org-submodule-pill ${isTabActive ? "active" : ""}`}
                      onClick={() => handleTabSelect(tab.key)}
                    >
                      <Icon className="org-submodule-icon" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="org-submodule-right-meta d-none d-lg-flex">
              <span className="org-submodule-meta-label">
                {activeTabObj?.label ? `Configuring: ${activeTabObj.label}` : `${currentCategoryGroup.tabs.length} modules`}
              </span>
              <span className="org-submodule-step-counter">
                {currentCategoryGroup.tabs.findIndex((t) => t.key === activeTab) + 1} of {currentCategoryGroup.tabs.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. ACTIVE MODULE VIEWPORT ── */}
      <div className="org-tab-content-area">
        {renderActiveSection()}
      </div>
    </div>
  );
}

export default Organisation;
