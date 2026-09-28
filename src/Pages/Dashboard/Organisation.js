import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Nav, Dropdown, Button } from "react-bootstrap";
import {
  FaBuilding,
  FaCodeBranch,
  FaSitemap,
  FaUserTag,
  FaUsers,
  FaMapMarkerAlt,
  FaProjectDiagram,
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
  FaShieldAlt,
  FaUserShield,
  FaSlidersH,
} from "react-icons/fa";
import { useSelector } from 'react-redux';
import { selectAuthUser, selectHasPermission, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import { useBranch } from "../../context/BranchContext";
import { fetchMyOrganization, normalizeOrganization } from "../../services/organizationService";
import OrgOverview from "../../Components/Organisation/OrgOverview";
import OrganizationProfileView from "../../Components/Organisation/OrganizationProfileView";
import BranchesSection from "../../Components/Organisation/BranchesSection";
import DepartmentsSection from "../../Components/Organisation/DepartmentsSection";
import DesignationsSection from "../../Components/Organisation/DesignationsSection";
import TeamsSection from "../../Components/Organisation/TeamsSection";
import LocationsSection from "../../Components/Organisation/LocationsSection";
import ReportingHierarchySection from "../../Components/Organisation/ReportingHierarchySection";
import JobGradesSection from "../../Components/Organisation/JobGradesSection";
import CostCentersSection from "../../Components/Organisation/CostCentersSection";
import WorkCalendarsSection from "../../Components/Organisation/WorkCalendarsSection";
import ShiftsSection from "../../Components/Organisation/ShiftsSection";
import FinancialYearsSection from "../../Components/Organisation/FinancialYearsSection";
import HolidayCalendarsSection from "../../Components/Organisation/HolidayCalendarsSection";
import OrganizationSettingsSection from "../../Components/Organisation/OrganizationSettingsSection";
import BranchSettingsSection from "../../Components/Organisation/BranchSettingsSection";
import SubscriptionSection from "../../Components/Organisation/SubscriptionSection";
import OrgAccessManagementSection from "../../Components/Organisation/OrgAccessManagementSection";
import OrgSetupWizard from "../../Components/Organisation/OrgSetupWizard";
import EditOrgProfilePage from "../../Components/Organisation/EditOrgProfilePage";
import UserManagement from "./UserManagement";
import "./Organisation.css";

// ── Categorized Navigation Tabs as per HRMS SaaS Architecture #35 ──
const ORG_NAV_GROUPS = [
  {
    groupTitle: "ORGANIZATION",
    tabs: [
      { key: "overview", label: "Overview", icon: FaBuilding, perm: "organization.view" },
      { key: "profile", label: "Organization Profile", icon: FaBuilding, perm: "organization.view" },
      { key: "subscription", label: "Subscription / Plan", icon: FaCrown, perm: "organization.view" },
    ],
  },
  {
    groupTitle: "ORGANIZATION STRUCTURE",
    tabs: [
      { key: "departments", label: "Departments", icon: FaSitemap, perm: "department.view" },
      { key: "designations", label: "Designations", icon: FaUserTag, perm: "designation.view" },
      { key: "teams", label: "Teams", icon: FaUsers, perm: "team.view" },
      { key: "locations", label: "Locations", icon: FaMapMarkerAlt, perm: "location.view" },
      { key: "reporting-hierarchy", label: "Reporting Hierarchy", icon: FaProjectDiagram, perm: "reportingHierarchy.view" },
      { key: "job-grades", label: "Job Grades", icon: FaLayerGroup, perm: "jobGrade.view" },
      { key: "cost-centers", label: "Cost Centers", icon: FaMoneyCheckAlt, perm: "costCenter.view" },
      { key: "work-calendars", label: "Work Calendars", icon: FaCalendarWeek, perm: "workCalendar.view" },
      { key: "shifts", label: "Shifts", icon: FaClock, perm: "shift.view" },
      { key: "holiday-calendars", label: "Holiday Calendars", icon: FaUmbrellaBeach, perm: "holidayCalendar.view" },
      { key: "financial-years", label: "Financial Years", icon: FaCalendarAlt, perm: "financialYear.view" },
    ],
  },
  {
    groupTitle: "ACCESS & SECURITY",
    tabs: [
      { key: "users", label: "Users", icon: FaUsers, perm: "user.view" },
      { key: "roles", label: "Roles & Permissions", icon: FaUserShield, perm: "role.view" },
      { key: "organization-access", label: "Organization Access", icon: FaShieldAlt, perm: "organization.view" },
    ],
  },
  {
    groupTitle: "SETTINGS",
    tabs: [
      { key: "settings", label: "Organization Settings", icon: FaCog, perm: "orgSettings.view" },
      { key: "branch-settings", label: "Branch Settings", icon: FaSlidersH, perm: "branch.view" },
    ],
  },
];

const STANDALONE_SECTIONS = ["branches", "edit-profile", "profile"];

const isKnownSection = (sec) =>
  Boolean(sec) && (ALL_TABS.some((t) => t.key === sec) || STANDALONE_SECTIONS.includes(sec));

const ALL_TABS = ORG_NAV_GROUPS.flatMap((g) => g.tabs);

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
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const hasPermission = useSelector((state) => (permCode) => selectHasPermission(state, permCode));
  const { organization, refreshOrganization, refreshBranches } = useBranch();

  const [orgData, setOrgData] = useState(organization || null);
  const [loadingOrg, setLoadingOrg] = useState(!organization);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [copiedField, setCopiedField] = useState("");
  const [activeCategory, setActiveCategory] = useState("ORGANIZATION");
  const [isFullView, setIsFullView] = useState(false);

  // Determine active tab from URL parameter or default to "overview"
  const currentTabKey = isKnownSection(section) ? section : "overview";
  const [activeTab, setActiveTab] = useState(currentTabKey);

  // Time updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch organization profile for the header banner
  const loadOrg = useCallback(async () => {
    try {
      const data = await fetchMyOrganization(true);
      if (data) {
        setOrgData(normalizeOrganization(data) || data);
      } else if (organization) {
        setOrgData(normalizeOrganization(organization) || organization);
      } else {
        setOrgData(null);
      }
    } catch (err) {
      console.warn("Could not load organization in parent header:", err);
      if (organization) {
        setOrgData(normalizeOrganization(organization) || organization);
      } else {
        setOrgData(null);
      }
    } finally {
      setLoadingOrg(false);
    }
  }, [organization]);

  const handleOrgUpdated = useCallback((updated) => {
    if (updated) {
      const norm = normalizeOrganization(updated) || updated;
      setOrgData(norm);
    }
    loadOrg();
  }, [loadOrg]);

  useEffect(() => {
    if (organization) {
      setOrgData(normalizeOrganization(organization) || organization);
      setLoadingOrg(false);
    }
  }, [organization]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  useEffect(() => {
    if (isKnownSection(section)) {
      setActiveTab(section);
      const foundGroup = ORG_NAV_GROUPS.find((g) => g.tabs.some((t) => t.key === section));
      if (foundGroup) setActiveCategory(foundGroup.groupTitle);
    } else if (location.pathname === "/organisation" || location.pathname === "/organisation/") {
      setActiveTab("overview");
      setActiveCategory("ORGANIZATION");
    }
  }, [section, location.pathname]);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    const foundGroup = ORG_NAV_GROUPS.find((g) => g.tabs.some((t) => t.key === tabKey));
    if (foundGroup) setActiveCategory(foundGroup.groupTitle);

    if (tabKey === "overview") {
      navigate("/organisation");
    } else {
      navigate(`/organisation/${tabKey}`);
    }
  };

  const handleOrgCreated = async (newOrg) => {
    setOrgData(newOrg);
    if (refreshOrganization) await refreshOrganization();
    if (refreshBranches) await refreshBranches();
    setActiveTab("overview");
    navigate("/organisation");
    loadOrg();
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2500);
  };

  const greetingText = useMemo(() => {
    const hour = currentDateTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentDateTime]);

  const dateFormatted = useMemo(() => {
    return currentDateTime.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [currentDateTime]);

  const timeFormatted = useMemo(() => {
    return currentDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentDateTime]);

  const userDisplayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.roleName || "Organization Administrator";

  const currentOrg = orgData || organization;
  const isOwner =
    user?.roleCode === "OWNER" ||
    user?.priority === 1 ||
    user?.role === "OWNER" ||
    user?.permissions?.includes("*");

  const hasNoOrg = !loadingOrg && (!currentOrg || (!currentOrg._id && !currentOrg.organizationName && !currentOrg.id));
  const canEdit = Boolean(
    (hasPermission && (hasPermission("organization.update") || hasPermission("organisation.update"))) ||
    isOwner
  );

  const orgInitials = useMemo(() => {
    const name = getStr(currentOrg?.displayName || currentOrg?.organizationName || "HR");
    return name
      .split(" ")
      .map((n) => n[0])
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
            onBack={() => handleTabSelect("profile")}
            onOrgUpdated={handleOrgUpdated}
          />
        );
      case "profile":
        return <OrganizationProfileView onNavigateTab={handleTabSelect} onOrgUpdated={handleOrgUpdated} />;
      case "overview":
        return (
          <OrgOverview
            orgData={currentOrg}
            onNavigateTab={handleTabSelect}
            onOrgUpdated={handleOrgUpdated}
          />
        );
      case "branches":
        return <BranchesSection onToggleFullView={setIsFullView} />;
      case "subscription":
        return <SubscriptionSection />;
      case "departments":
        return <DepartmentsSection />;
      case "designations":
        return <DesignationsSection />;
      case "teams":
        return <TeamsSection />;
      case "locations":
        return <LocationsSection />;
      case "reporting-hierarchy":
        return <ReportingHierarchySection />;
      case "job-grades":
        return <JobGradesSection />;
      case "cost-centers":
        return <CostCentersSection />;
      case "work-calendars":
        return <WorkCalendarsSection />;
      case "shifts":
        return <ShiftsSection />;
      case "holiday-calendars":
        return <HolidayCalendarsSection />;
      case "financial-years":
        return <FinancialYearsSection />;
      case "users":
      case "roles":
        return <UserManagement initialTab={activeTab === "roles" ? "roles" : "users"} />;
      case "organization-access":
        return <OrgAccessManagementSection />;
      case "settings":
        return <OrganizationSettingsSection />;
      case "branch-settings":
        return <BranchSettingsSection />;
      default:
        return (
          <OrgOverview
            orgData={currentOrg}
            onNavigateTab={handleTabSelect}
            onOrgUpdated={loadOrg}
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
          onBack={() => handleTabSelect("profile")}
          onOrgUpdated={handleOrgUpdated}
        />
      </div>
    );
  }

  // Dedicated Full Page Branches Workspace
  if (activeTab === "branches") {
    return (
      <div className="org-dashboard-container p-0">
        <BranchesSection
          onToggleFullView={setIsFullView}
          isStandaloneView={true}
          onBackToOrg={() => handleTabSelect("overview")}
        />
      </div>
    );
  }

  // Full Page Wizard Mode (takes entire viewport next to the sidebar)
  if (isFullView) {
    return (
      <div className="org-dashboard-container p-3 p-md-4">
        {renderActiveSection()}
      </div>
    );
  }


  return (
    <div className="org-dashboard-container">
      {/* ── 1. TOP EXECUTIVE HEADER BAR ── */}
      <div className="org-greeting-header-bar">
        <div className="org-greeting-left">
          <div className="org-header-breadcrumb">
            <span className="org-breadcrumb-root">Enterprise Governance</span>
            <span className="org-breadcrumb-sep">/</span>
            <span className="org-breadcrumb-current">Organization Workspace</span>
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
              <Dropdown.Item onClick={() => handleTabSelect("departments")}>
                <FaPlus className="me-2 text-primary" /> Add Department
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleTabSelect("reporting-hierarchy")}>
                <FaPlus className="me-2 text-info" /> Add Employee
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleTabSelect("locations")}>
                <FaPlus className="me-2 text-warning" /> Add Location
              </Dropdown.Item>
              <Dropdown.Divider />
              {canEdit && (
                <Dropdown.Item onClick={() => handleTabSelect("profile")}>
                  <FaEdit className="me-2 text-warning" /> Edit Organization Profile
                </Dropdown.Item>
              )}
              <Dropdown.Item onClick={() => handleTabSelect("settings")}>
                <FaCog className="me-2 text-secondary" /> Global Settings
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* ── 2. EXECUTIVE HERO BANNER CARD ── */}
      {orgData && (
        <div className="org-hero-card-exact mb-4">
          <div className="org-hero-bg-glow" />
          <svg className="org-hero-bg-waves" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <path d="M 400 0 C 650 180, 750 20, 1000 80 L 1000 0 Z" fill="var(--color-primary, #C49A55)" opacity="0.04" />
          </svg>

          <div className="org-hero-content-wrapper">
            <div className="org-hero-main-section">
              <div className="org-hero-logo-box">
                {getStr(orgData.logo) ? (
                  <img
                    src={getStr(orgData.logo)}
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
                  style={{ display: getStr(orgData.logo) ? "none" : "flex" }}
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
              <div className="d-flex align-items-center gap-2 mt-2">
                {canEdit && (
                  <Button
                    className="org-hero-btn-edit"
                    size="sm"
                    onClick={() => handleTabSelect("profile")}
                  >
                    <FaEdit className="me-1" /> Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. EXECUTIVE CATEGORY SEGMENT TABS ── */}
      <div className="org-category-segment-wrapper mb-3">
        <div className="org-category-segment-bar">
          {ORG_NAV_GROUPS.map((group) => (
            <button
              key={group.groupTitle}
              type="button"
              className={`org-category-segment-btn ${activeCategory === group.groupTitle ? "active" : ""}`}
              onClick={() => {
                setActiveCategory(group.groupTitle);
                handleTabSelect(group.tabs[0].key);
              }}
            >
              <span className="org-category-btn-text">{group.groupTitle}</span>
              <span className="org-category-count-pill">{group.tabs.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. SUB-MODULE TABS OF ACTIVE CATEGORY ── */}
      <div className="org-tabs-wrapper mb-4">
        <Nav variant="tabs" className="org-nav-tabs" activeKey={activeTab} onSelect={handleTabSelect}>
          {ORG_NAV_GROUPS.find((g) => g.groupTitle === activeCategory)?.tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Nav.Item key={tab.key}>
                <Nav.Link
                  eventKey={tab.key}
                  className={`org-nav-tab-item ${activeTab === tab.key ? "active" : ""}`}
                >
                  <Icon className="org-nav-tab-icon" />
                  <span>{tab.label}</span>
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
      </div>

      {/* ── 5. ACTIVE MODULE VIEWPORT ── */}
      <div className="org-tab-content-area">
        {renderActiveSection()}
      </div>
    </div>
  );
}

export default Organisation;