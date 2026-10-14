/**
 * Single source of truth for Organisation + Branch navigation.
 *
 * OWNERSHIP RULE
 *  - ORGANISATION workspace (/organisation/*)  = tenant-wide governance.
 *      Lists show ALL branches plus org-wide ("global", branchId = null) records.
 *      Owns: profile, subscription, org settings, access (users/roles), and the
 *      cross-branch view of structure and HR masters.
 *  - BRANCH workspace (/organisation/branches?branchId=<id>&tab=<key>) = one site.
 *      Reuses the same section components, hard-locked to that branch
 *      (lockedBranchId). Owns: branch identity/GPS, members, branch settings.
 *
 * Permission codes are the ones already declared in the previous nav config
 * (and used by BranchesSection). Nothing is invented here.
 */
import {
  FaBuilding,
  FaCrown,
  FaSitemap,
  FaUserTag,
  FaUsers,
  FaProjectDiagram,
  FaMapMarkerAlt,
  FaCalendarWeek,
  FaCalendarCheck,
  FaLayerGroup,
  FaClock,
  FaUmbrellaBeach,
  FaCalendarAlt,
  FaMoneyCheckAlt,
  FaShieldAlt,
  FaCog,
} from "react-icons/fa";

export const ORG_BASE_PATH = "/organisation";
export const BRANCHES_PATH = "/organisation/branches";

/* ───────────────────────── ORGANISATION NAV ───────────────────────── */
export const ORG_NAV_GROUPS = [
  {
    groupId: "overview",
    groupTitle: "Overview",
    groupIcon: FaBuilding,
    tabs: [
      { key: "overview", label: "Overview", icon: FaBuilding, perm: "organization.view" },
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
  {
    groupId: "settings",
    groupTitle: "Settings",
    groupIcon: FaCog,
    // "Branch Settings" intentionally NOT here: it is branch-level and lives
    // in the Branch workspace (tab "settings").
    tabs: [
      { key: "settings", label: "Organization Settings", icon: FaCog, perm: "orgSettings.view", to: "/settings/organization" },
    ],
  },
];

/* ───────────────────────── BRANCH NAV ───────────────────────── */
// Tab keys are kept identical to the previous implementation so existing
// deep links (?branchId=..&tab=members) keep working.
export const BRANCH_NAV_GROUPS = [
  {
    groupId: "overview",
    groupTitle: "Overview",
    groupIcon: FaBuilding,
    tabs: [{ key: "overview", label: "Branch Overview", icon: FaBuilding, perm: "branch.view" }],
  },
  {
    groupId: "people",
    groupTitle: "People & Structure",
    groupIcon: FaSitemap,
    tabs: [
      { key: "members", label: "Branch Members & Staff", icon: FaUsers, perm: "user.view" },
      { key: "departments", label: "Departments", icon: FaSitemap, perm: "department.view" },
      { key: "designations", label: "Designations", icon: FaUserTag, perm: "designation.view" },
      { key: "teams", label: "Teams", icon: FaUsers, perm: "team.view" },
      { key: "reporting", label: "Reporting Hierarchy", icon: FaProjectDiagram, perm: "reportingHierarchy.view" },
    ],
  },
  {
    groupId: "workplace",
    groupTitle: "Workplace & Operations",
    groupIcon: FaMapMarkerAlt,
    tabs: [
      { key: "locations", label: "Locations", icon: FaMapMarkerAlt, perm: "location.view" },
      { key: "work-calendars", label: "Work Calendar", icon: FaCalendarWeek, perm: "workCalendar.view" },
      { key: "shifts", label: "Shifts", icon: FaClock, perm: "shift.view" },
      { key: "holidays", label: "Holiday Calendars", icon: FaUmbrellaBeach, perm: "holidayCalendar.view" },
    ],
  },
  {
    groupId: "masters",
    groupTitle: "HR Masters",
    groupIcon: FaLayerGroup,
    tabs: [
      { key: "job-grades", label: "Job Grades", icon: FaShieldAlt, perm: "jobGrade.view" },
      { key: "cost-centers", label: "Cost Centers", icon: FaMoneyCheckAlt, perm: "costCenter.view" },
      { key: "financial-years", label: "Financial Years", icon: FaCalendarAlt, perm: "financialYear.view" },
      { key: "leave-settings", label: "Leave Settings", icon: FaCalendarCheck, perm: "leave.policy.manage" },
    ],
  },
  {
    groupId: "settings",
    groupTitle: "Settings",
    groupIcon: FaCog,
    tabs: [{ key: "settings", label: "Branch Settings", icon: FaCog, perm: "branch.view" }],
  },
];

/* ───────────────────────── Legacy URL aliases ───────────────────────── */
// /organisation/<alias> -> canonical org tab key.
export const ORG_SECTION_ALIASES = { profile: "overview" };
// Standalone full pages rendered by Organisation.js (not in the nav).
export const ORG_STANDALONE_SECTIONS = ["edit-profile"];

/* ───────────────────────── Helpers (pure) ───────────────────────── */
export const flattenTabs = (groups) => groups.flatMap((g) => g.tabs);

/** Remove tabs the user cannot view; drop groups left empty. */
export const filterNavGroups = (groups, can) =>
  groups
    .map((g) => ({ ...g, tabs: g.tabs.filter((t) => !t.perm || can(t.perm)) }))
    .filter((g) => g.tabs.length > 0);

export const findGroupForTab = (groups, key) =>
  groups.find((g) => g.tabs.some((t) => t.key === key)) || null;

/**
 * Resolve /organisation/:section.
 *  -> { kind: "tab", key }          known tab (or standalone page)
 *  -> { kind: "redirect", to }      legacy alias / link-out
 *  -> { kind: "unknown" }           not a section; caller should redirect home
 */
export const resolveOrgSection = (section) => {
  if (!section) return { kind: "tab", key: "overview" };
  const aliased = ORG_SECTION_ALIASES[section] || section;
  // Canonical URL for the overview is /organisation (no segment).
  if (aliased === "overview") return { kind: "redirect", to: ORG_BASE_PATH };
  if (ORG_STANDALONE_SECTIONS.includes(aliased)) return { kind: "tab", key: aliased };
  // "branch-settings" was an org tab before; it is branch-level now.
  if (aliased === "branch-settings") return { kind: "redirect", to: BRANCHES_PATH };
  const tab = flattenTabs(ORG_NAV_GROUPS).find((t) => t.key === aliased);
  if (!tab) return { kind: "unknown" };
  if (tab.to) return { kind: "redirect", to: tab.to };
  return { kind: "tab", key: tab.key };
};

export const orgTabPath = (key) => (key === "overview" ? ORG_BASE_PATH : `${ORG_BASE_PATH}/${key}`);

/** Build a Branch-workspace URL. Omitted args are left out. */
export const branchWorkspacePath = ({ branchId, tab, action } = {}) => {
  const qs = new URLSearchParams();
  if (branchId) qs.set("branchId", String(branchId));
  if (branchId && tab && tab !== "overview") qs.set("tab", tab);
  if (action) qs.set("action", action);
  const s = qs.toString();
  return s ? `${BRANCHES_PATH}?${s}` : BRANCHES_PATH;
};

/** Coerce a ?tab= value to a tab the user may open; fall back to overview. */
export const sanitizeBranchTab = (tab, can) => {
  const t = flattenTabs(BRANCH_NAV_GROUPS).find((x) => x.key === tab);
  if (!t) return "overview";
  return !t.perm || can(t.perm) ? t.key : "overview";
};
