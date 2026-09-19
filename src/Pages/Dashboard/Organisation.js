import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Nav } from "react-bootstrap";
import {
  MdBusiness,
  MdChevronRight,
} from "react-icons/md";
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
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
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

function Organisation() {
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isSystemAdmin } = useAuth();

  // Determine active tab from URL parameter or default to "overview"
  const currentTabKey = section && ORG_TABS.some((t) => t.key === section) ? section : "overview";
  const [activeTab, setActiveTab] = useState(currentTabKey);

  useEffect(() => {
    if (section && ORG_TABS.some((t) => t.key === section)) {
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

  // Filter visible tabs according to user permissions
  const visibleTabs = ORG_TABS.filter((tab) => {
    if (tab.key === "overview") return true;
    if (isSystemAdmin) return true;
    if (tab.perm === "orgSettings.view") {
      return hasPermission("orgSettings.view") || hasPermission("organizationSettings.view");
    }
    return hasPermission(tab.perm);
  });

  const renderActiveSection = () => {
    switch (activeTab) {
      case "overview":
        return <OrgOverview onNavigateTab={handleTabSelect} />;
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
        return <OrgOverview onNavigateTab={handleTabSelect} />;
    }
  };

  return (
    <div className="org-dashboard-container">
      {/* ── Breadcrumb & Page Header ── */}
      <div className="org-page-header">
        <div>
          <div className="org-breadcrumb">
            <span className="clickable" onClick={() => navigate("/dashboard")}>
              Dashboard
            </span>
            <MdChevronRight />
            <span className="clickable" onClick={() => handleTabSelect("overview")}>
              Organisation
            </span>
            {activeTab !== "overview" && (
              <>
                <MdChevronRight />
                <span className="text-dark fw-semibold">
                  {ORG_TABS.find((t) => t.key === activeTab)?.label || activeTab}
                </span>
              </>
            )}
          </div>
          <h1 className="org-page-title">
            <MdBusiness style={{ color: "#10b981" }} />
            Organisation Management
          </h1>
          <p className="org-page-subtitle">
            Configure enterprise hierarchy, office branches, departments, work calendars, and tenant settings.
          </p>
        </div>
      </div>

      {/* ── Sub-module Navigation Tabs ── */}
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

      {/* ── Active Module Viewport ── */}
      <div className="org-tab-content-area">
        {renderActiveSection()}
      </div>
    </div>
  );
}

export default Organisation;