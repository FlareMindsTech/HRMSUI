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
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { fetchMyOrganization, normalizeOrganization } from "../../services/organizationService";
import OrgOverview from "../../Components/Organisation/OrgOverview";
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
import OrgSetupWizard from "../../Components/Organisation/OrgSetupWizard";
import EditOrgProfilePage from "../../Components/Organisation/EditOrgProfilePage";
import "./Organisation.css";

const ORG_TABS = [
  { key: "overview", label: "Overview", icon: FaBuilding, perm: "organization.view" },
  { key: "branches", label: "Branches", icon: FaCodeBranch, perm: "branch.view" },
  { key: "departments", label: "Departments", icon: FaSitemap, perm: "department.view" },
  { key: "designations", label: "Designations", icon: FaUserTag, perm: "designation.view" },
  { key: "teams", label: "Teams", icon: FaUsers, perm: "team.view" },
  { key: "locations", label: "Locations", icon: FaMapMarkerAlt, perm: "location.view" },
  { key: "reporting-hierarchy", label: "Reporting Hierarchy", icon: FaProjectDiagram, perm: "reportingHierarchy.view" },
  { key: "job-grades", label: "Job Grades", icon: FaLayerGroup, perm: "jobGrade.view" },
  { key: "cost-centers", label: "Cost Centers", icon: FaMoneyCheckAlt, perm: "costCenter.view" },
  { key: "work-calendars", label: "Work Calendars", icon: FaCalendarWeek, perm: "workCalendar.view" },
  { key: "shifts", label: "Shifts", icon: FaClock, perm: "shift.view" },
  { key: "financial-years", label: "Financial Years", icon: FaCalendarAlt, perm: "financialYear.view" },
  { key: "holiday-calendars", label: "Holidays", icon: FaUmbrellaBeach, perm: "holidayCalendar.view" },
  { key: "settings", label: "Settings", icon: FaCog, perm: "orgSettings.view" },
];

const getStr = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim() !== "" ? val.trim() : fallback;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (val.month !== undefined && val.day !== undefined) {
      const mm = String(val.month).padStart(2, "0");
      const dd = String(val.day).padStart(2, "0");
      return `${mm}-${dd}`;
    }
    if (val.street || val.addressLine1 || val.line1) {
      const addr = [val.street || val.addressLine1 || val.line1, val.city, val.state, val.country, val.pincode || val.zip]
        .filter(Boolean)
        .join(", ");
      return addr || fallback;
    }
    if (val.city || val.country) {
      return [val.city, val.country].filter(Boolean).join(", ");
    }
    if (val.name) return String(val.name);
    if (val.label) return String(val.label);
    if (val.url) return String(val.url);
    return fallback;
  }
  return fallback;
};

function Organisation() {
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isSystemAdmin, user } = useAuth();
  const { organization, refreshOrganization, refreshBranches } = useBranch();

  const [orgData, setOrgData] = useState(organization || null);
  const [loadingOrg, setLoadingOrg] = useState(!organization);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [copiedField, setCopiedField] = useState("");
  const [triggerEditModal, setTriggerEditModal] = useState(false);

  // Determine active tab from URL parameter or default to "overview"
  const currentTabKey = section && ORG_TABS.some((t) => t.key === section) ? section : "overview";
  const [activeTab, setActiveTab] = useState(currentTabKey);

  // Time updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch organization profile for the header hero banner
  const loadOrg = useCallback(async () => {
    try {
      if (!organization && !orgData) setLoadingOrg(true);
      const data = await fetchMyOrganization();
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

  useEffect(() => {
    if (organization && !orgData) {
      setOrgData(normalizeOrganization(organization) || organization);
      setLoadingOrg(false);
    }
  }, [organization, orgData]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  useEffect(() => {
    if (section && (ORG_TABS.some((t) => t.key === section) || section === "edit-profile")) {
      setActiveTab(section);
    } else if (location.pathname === "/organisation" || location.pathname === "/organisation/") {
      setActiveTab("overview");
    }
  }, [section, location.pathname]);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
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
    : user?.roleName || "System Owner";

  const currentOrg = orgData || organization;
  const storedOrgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");
  const isOwner = user?.roleCode === "OWNER" || isSystemAdmin || user?.priority === 1;
  const hasNoOrg = isOwner && !currentOrg && !user?.organizationId && !storedOrgId;

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

  const canEdit = isSystemAdmin || hasPermission("organization.update");

  // Filter visible tabs according to user permissions
  const visibleTabs = ORG_TABS.filter((tab) => {
    if (tab.key === "overview") return true;
    if (isSystemAdmin) return true;
    if (tab.perm === "orgSettings.view") {
      return hasPermission("orgSettings.view") || hasPermission("organizationSettings.view");
    }
    return hasPermission(tab.perm);
  });

  const handleEditDetailsClick = () => {
    handleTabSelect("edit-profile");
  };

  if (loadingOrg && !currentOrg && !storedOrgId) {
    return (
      <div className="org-dashboard-container">
        <div className="org-loader-container-full">
          <div className="spinner-border" style={{ color: "#C49A55", width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3 fw-bold" style={{ color: "#77736B", fontSize: "0.95rem" }}>
            Loading Enterprise Organization Hub...
          </div>
        </div>
      </div>
    );
  }

  // ── FIRST-TIME SETUP: ONLY IF OWNER AND NO ORGANIZATION PROFILE EXISTS AT ALL ──
  if (hasNoOrg) {
    return (
      <div className="org-dashboard-container">
        <OrgSetupWizard onOrgCreated={handleOrgCreated} />
      </div>
    );
  }

  // ── DEDICATED EDIT ORGANIZATION PROFILE FULL PAGE ──
  if (activeTab === "edit-profile") {
    return (
      <div className="org-dashboard-container">
        <EditOrgProfilePage
          orgData={currentOrg}
          onBack={() => handleTabSelect("overview")}
          onOrgUpdated={loadOrg}
        />
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeTab) {
      case "edit-profile":
        return (
          <EditOrgProfilePage
            orgData={currentOrg}
            onBack={() => handleTabSelect("overview")}
            onOrgUpdated={loadOrg}
          />
        );
      case "overview":
        return (
          <OrgOverview
            orgData={currentOrg}
            onNavigateTab={handleTabSelect}
            triggerEditModal={triggerEditModal}
            onEditModalHandled={() => setTriggerEditModal(false)}
            onOrgUpdated={loadOrg}
          />
        );
      case "branches":
        return <BranchesSection />;
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
      case "financial-years":
        return <FinancialYearsSection />;
      case "holiday-calendars":
        return <HolidayCalendarsSection />;
      case "settings":
        return <OrganizationSettingsSection />;
      default:
        return (
          <OrgOverview
            onNavigateTab={handleTabSelect}
            triggerEditModal={triggerEditModal}
            onEditModalHandled={() => setTriggerEditModal(false)}
            onOrgUpdated={loadOrg}
          />
        );
    }
  };

  return (
    <div className="org-dashboard-container">
      {/* ── 1. TOP GREETING & QUICK ACTIONS BAR ── */}
      <div className="org-greeting-header-bar">
        <div className="org-greeting-left">
          <h2 className="org-greeting-headline">
            {greetingText}, {userDisplayName}! 👋
          </h2>
          <p className="org-greeting-subline">
            Here's what's happening at {getStr(orgData?.displayName || orgData?.organizationName, "FlareMinds Tech")} today.
          </p>
        </div>

        <div className="org-greeting-right">
          <div className="org-datetime-card">
            <FaRegCalendarAlt className="org-calendar-icon" />
            <div className="org-datetime-content">
              <div className="org-datetime-date">{dateFormatted}</div>
              <div className="org-datetime-time">
                {timeFormatted} • {getStr(orgData?.timeZone, "Asia/Kolkata")}
              </div>
            </div>
          </div>

          <Dropdown className="org-quick-actions-dropdown">
            <Dropdown.Toggle className="org-btn-quick-actions">
              <FaBolt className="me-1 text-success" /> Quick Actions
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="org-dropdown-menu">
              <Dropdown.Item onClick={() => handleTabSelect("branches")}>
                <FaPlus className="me-2 text-success" /> Add Branch
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleTabSelect("departments")}>
                <FaPlus className="me-2 text-primary" /> Add Department
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleTabSelect("reporting-hierarchy")}>
                <FaPlus className="me-2 text-info" /> Add Employee
              </Dropdown.Item>
              <Dropdown.Divider />
              {canEdit && (
                <Dropdown.Item onClick={handleEditDetailsClick}>
                  <FaEdit className="me-2 text-warning" /> Edit Details
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
        <div className="org-hero-card-exact">
          <div className="org-hero-bg-glow" />
          <svg
            className="org-hero-bg-waves"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
          >
            <path
              d="M 400 0 C 650 180, 750 20, 1000 80 L 1000 0 Z"
              fill="#C49A55"
              opacity="0.04"
            />
            <path
              d="M 500 0 C 700 140, 800 60, 1000 120 L 1000 0 Z"
              fill="#C49A55"
              opacity="0.02"
            />
          </svg>

          <div className="org-hero-content-wrapper">
            {/* Left: Avatar & Organization Name */}
            <div className="org-hero-main-section">
              <div className="org-hero-logo-box">
                {getStr(orgData.logo) ? (
                  <img
                    src={getStr(orgData.logo)}
                    alt={getStr(orgData.organizationName)}
                    className="org-hero-logo-image"
                  />
                ) : (
                  <div className="org-hero-logo-monogram">{orgInitials}</div>
                )}
              </div>

              <div className="org-hero-details">
                <div className="org-hero-name-row">
                  <h1 className="org-hero-org-name">
                    {getStr(orgData.displayName || orgData.organizationName, "FlareMinds Technology and Services")}
                  </h1>
                  <FaCheckCircle className="org-hero-check-badge" title="Verified Enterprise Organization" />

                  {getStr(orgData.status) && (
                    <span className="org-hero-pill-status">
                      <span className="org-hero-green-circle" /> {getStr(orgData.status)}
                    </span>
                  )}

                  {getStr(orgData.organizationType) && (
                    <span className="org-hero-pill-entity">
                      <FaBuilding className="me-1 text-muted" style={{ fontSize: "0.65rem" }} />
                      {getStr(orgData.organizationType).replace("_", " ")}
                    </span>
                  )}
                </div>

                <div className="org-hero-legal-line">
                  <span className="org-hero-legal-label">Legal Registered Entity:</span>
                  <span className="org-hero-legal-val">
                    {getStr(orgData.legalName || orgData.organizationName, "FlareMinds Technology and Services Pvt Ltd")}
                  </span>
                </div>

                <div className="org-hero-chips-bar">
                  {getStr(orgData.organizationCode) && (
                    <div
                      className="org-hero-chip code"
                      onClick={() => copyToClipboard(getStr(orgData.organizationCode), "code")}
                      role="button"
                      title="Click to copy Organization Tenant Code"
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

                  {[
                    getStr(orgData.city || orgData.address?.city),
                    getStr(orgData.state || orgData.address?.state),
                    getStr(orgData.country || orgData.address?.country),
                  ]
                    .filter(Boolean)
                    .join(", ") && (
                    <div className="org-hero-chip location">
                      <span className="org-chip-icon-wrap text-danger"><FaMapMarkerAlt /></span>
                      <span>
                        {[
                          getStr(orgData.city || orgData.address?.city),
                          getStr(orgData.state || orgData.address?.state),
                          getStr(orgData.country || orgData.address?.country),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quote & Action Buttons */}
            <div className="org-hero-right-section">
              <div className="org-hero-quote-box">
                <span className="org-hero-quote-icon">“</span>
                <span className="org-hero-quote-text">
                  Great people build great companies.
                </span>
                <span className="org-hero-quote-icon">”</span>
              </div>

              <div className="org-hero-buttons-row">
                {canEdit && (
                  <Button
                    className="org-hero-btn-edit"
                    onClick={handleEditDetailsClick}
                  >
                    <FaEdit className="me-1" /> Edit Profile
                  </Button>
                )}
                <Button
                  variant="outline-success"
                  className="org-hero-btn-hierarchy"
                  onClick={() => handleTabSelect("reporting-hierarchy")}
                >
                  <FaSitemap className="me-1" /> View Hierarchy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. SUB-MODULE NAVIGATION TABS (MATCHED TO SCREENSHOT) ── */}
      <div className="org-tabs-wrapper">
        <Nav variant="tabs" className="org-nav-tabs" activeKey={activeTab} onSelect={handleTabSelect}>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Nav.Item key={tab.key}>
                <Nav.Link
                  eventKey={tab.key}
                  className={`org-nav-tab-item ${activeTab === tab.key ? "active" : ""}`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
      </div>

      {/* ── 4. ACTIVE MODULE VIEWPORT ── */}
      <div className="org-tab-content-area">
        {renderActiveSection()}
      </div>
    </div>
  );
}

export default Organisation;