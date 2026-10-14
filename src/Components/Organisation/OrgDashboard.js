import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaCodeBranch,
  FaUsers,
  FaSitemap,
  FaCrosshairs,
  FaCheck,
  FaSyncAlt,
} from "react-icons/fa";
import {
  fetchBranches,
  fetchDepartments,
  fetchOnboardedEmployees,
} from "../../services/organizationService";
import { branchWorkspacePath, BRANCHES_PATH } from "./navigation/orgNavConfig";

/**
 * Organisation dashboard (Overview tab).
 *
 * Every number is computed from live data (branches, departments, onboarded
 * staff). Each source is fetched independently and fails independently: a user
 * without access to one resource simply does not get the cards that need it.
 * Nothing here is hard-coded and nothing is shown that the user cannot open.
 */

const asList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};
const idOf = (x) => String(x?._id || x?.id || x || "");
const TYPE_LABEL = {
  HEAD_OFFICE: "Head Office",
  REGIONAL_OFFICE: "Regional Office",
  BRANCH_OFFICE: "Branch Office",
  VIRTUAL: "Virtual / Remote",
};

function Bars({ rows, emptyText }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <div className="odb-empty">{emptyText}</div>;
  return (
    <div>
      {rows.map((r) => (
        <div className="odb-bar-row" key={r.key}>
          <span className="odb-bar-name" title={r.label}>{r.label}</span>
          <span className="odb-bar-track" aria-hidden="true">
            <span className="odb-bar-fill" style={{ width: `${(r.value / max) * 100}%`, display: "block" }} />
          </span>
          <span className="odb-bar-num">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function OrgDashboard({ can, onNavigateTab }) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState(null); // null = not loaded / no access
  const [departments, setDepartments] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  const canBranches = can("branch.view");
  const canDepartments = can("department.view");
  const canStaff = can("user.view");

  const load = useCallback(async () => {
    setLoading(true);
    const [b, d, s] = await Promise.all([
      canBranches ? fetchBranches({ page: 1, limit: 1000 }).catch(() => null) : null,
      canDepartments ? fetchDepartments({ page: 1, limit: 1000 }).catch(() => null) : null,
      canStaff ? fetchOnboardedEmployees().catch(() => null) : null,
    ]);
    setBranches(b ? asList(b) : null);
    setDepartments(d ? asList(d) : null);
    setStaff(s ? asList(s) : null);
    setLoading(false);
  }, [canBranches, canDepartments, canStaff]);

  useEffect(() => {
    load();
  }, [load]);

  /* ───────── derived metrics ───────── */
  const m = useMemo(() => {
    const bl = branches || [];
    const active = bl.filter((b) => (b.status || "ACTIVE") === "ACTIVE");
    const geofenced = bl.filter((b) => b.latitude && b.longitude);

    const headcount = new Map();
    let unassigned = 0;
    (staff || []).forEach((e) => {
      const ids = new Set();
      if (e.primaryBranchId) ids.add(idOf(e.primaryBranchId));
      if (Array.isArray(e.branchIds)) e.branchIds.forEach((x) => ids.add(idOf(x)));
      if (ids.size === 0) unassigned += 1;
      ids.forEach((id) => headcount.set(id, (headcount.get(id) || 0) + 1));
    });

    const deptCount = new Map();
    (departments || []).forEach((d) => {
      const id = idOf(d.branchId);
      if (id) deptCount.set(id, (deptCount.get(id) || 0) + 1);
    });

    const byType = new Map();
    bl.forEach((b) => byType.set(b.branchType || "BRANCH_OFFICE", (byType.get(b.branchType || "BRANCH_OFFICE") || 0) + 1));

    const cities = new Set(bl.map((b) => (b.city || "").trim().toLowerCase()).filter(Boolean));

    const topByStaff = bl
      .map((b) => ({ key: idOf(b), label: b.branchName || "Branch", value: headcount.get(idOf(b)) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Branches that need setup work, with the exact tab that fixes it.
    const attention = [];
    bl.forEach((b) => {
      const id = idOf(b);
      const issues = [];
      if (!(b.latitude && b.longitude)) issues.push({ text: "GPS not set", tab: "overview" });
      if (!b.branchHeadId) issues.push({ text: "No branch head", tab: "overview" });
      if (departments && !deptCount.get(id)) issues.push({ text: "No departments", tab: "departments" });
      if (staff && !headcount.get(id)) issues.push({ text: "No staff assigned", tab: "members" });
      if (issues.length) attention.push({ id, name: b.branchName || "Branch", issues });
    });

    return {
      total: bl.length,
      active: active.length,
      inactive: bl.length - active.length,
      geofenced: geofenced.length,
      cities: cities.size,
      staffTotal: (staff || []).length,
      unassigned,
      deptTotal: (departments || []).length,
      byType: [...byType.entries()].map(([k, v]) => ({ key: k, label: TYPE_LABEL[k] || k, value: v })),
      topByStaff,
      attention: attention.sort((a, b) => b.issues.length - a.issues.length),
      hasHq: bl.some((b) => b.branchType === "HEAD_OFFICE"),
    };
  }, [branches, departments, staff]);

  const openBranch = (id, tab) => navigate(branchWorkspacePath({ branchId: id, tab }));

  /* ───────── KPI cards: only for data the user can see ───────── */
  const kpis = [];
  if (branches) {
    kpis.push({
      key: "branches",
      icon: FaCodeBranch,
      label: "Branches",
      value: m.total,
      sub: m.inactive > 0 ? `${m.active} active · ${m.inactive} inactive` : "All active",
      onClick: () => navigate(BRANCHES_PATH),
    });
  }
  if (staff) {
    kpis.push({
      key: "staff",
      icon: FaUsers,
      label: "Employees",
      value: m.staffTotal,
      sub: m.unassigned > 0 ? `${m.unassigned} without a branch` : "All assigned to a branch",
      onClick: canStaff ? () => onNavigateTab("users") : undefined,
    });
  }
  if (departments) {
    kpis.push({
      key: "departments",
      icon: FaSitemap,
      label: "Departments",
      value: m.deptTotal,
      sub: m.total > 0 ? `across ${m.total} branch${m.total === 1 ? "" : "es"}` : "",
      onClick: () => onNavigateTab("departments"),
    });
  }
  if (branches) {
    kpis.push({
      key: "gps",
      icon: FaCrosshairs,
      label: "GPS-enabled branches",
      value: `${m.geofenced}/${m.total}`,
      sub: m.cities > 0 ? `${m.cities} cit${m.cities === 1 ? "y" : "ies"}` : "",
      onClick: undefined,
    });
  }

  /* ───────── setup checklist ───────── */
  const checklist = [];
  if (branches) {
    checklist.push({ key: "hq", label: "Head office defined", done: m.hasHq, run: can("branch.create") ? () => navigate(branchWorkspacePath({ action: "create" })) : null, cta: "Add" });
    checklist.push({ key: "gpsall", label: "Every branch has GPS", done: m.total > 0 && m.geofenced === m.total, run: () => navigate(BRANCHES_PATH), cta: "Review" });
  }
  if (departments && branches) {
    checklist.push({ key: "dept", label: "Departments created", done: m.deptTotal > 0, run: () => onNavigateTab("departments"), cta: "Open" });
  }
  if (staff) {
    checklist.push({ key: "staff", label: "Staff assigned to branches", done: m.staffTotal > 0 && m.unassigned === 0, run: () => navigate(BRANCHES_PATH), cta: "Assign" });
  }

  /* ───────── quick actions (permission-gated) ───────── */
  const actions = [
    can("branch.create") && { key: "branch", label: "Add branch", run: () => navigate(branchWorkspacePath({ action: "create" })) },
    can("department.view") && { key: "dept", label: "Manage departments", run: () => onNavigateTab("departments") },
    can("user.create") && { key: "emp", label: "Onboard employee", run: () => navigate("/onboarding") },
    can("shift.view") && { key: "shift", label: "Configure shifts", run: () => onNavigateTab("shifts") },
    can("location.view") && { key: "loc", label: "Manage locations", run: () => onNavigateTab("locations") },
  ].filter(Boolean);

  if (loading && !branches && !departments && !staff) {
    return (
      <div className="odb" aria-busy="true">
        <div className="odb-kpis">
          {[0, 1, 2, 3].map((i) => <div key={i} className="odb-skeleton" />)}
        </div>
      </div>
    );
  }

  const nothingVisible = !branches && !departments && !staff;

  return (
    <div className="odb">
      <div className="ows-header" style={{ marginBottom: 0 }}>
        <h2 className="odb-card-title" style={{ fontSize: 17 }}>Dashboard</h2>
        <button type="button" className="odb-link" onClick={load} aria-label="Refresh dashboard">
          <FaSyncAlt className={loading ? "fa-spin" : ""} /> Refresh
        </button>
      </div>

      {nothingVisible && (
        <div className="odb-card odb-empty">
          <FaBuilding style={{ marginBottom: 8 }} />
          <div>No dashboard data is available for your role. Use the menu to open a section you have access to.</div>
        </div>
      )}

      {kpis.length > 0 && (
        <div className="odb-kpis">
          {kpis.map((k) => {
            const Icon = k.icon;
            const Tag = k.onClick ? "button" : "div";
            return (
              <Tag key={k.key} type={k.onClick ? "button" : undefined} className="odb-kpi" onClick={k.onClick}>
                <span className="odb-kpi-icon"><Icon /></span>
                <span className="odb-kpi-body">
                  <span className="odb-kpi-label" style={{ display: "block" }}>{k.label}</span>
                  <span className="odb-kpi-value" style={{ display: "block" }}>{k.value}</span>
                  {k.sub && <span className="odb-kpi-sub" style={{ display: "block" }}>{k.sub}</span>}
                </span>
              </Tag>
            );
          })}
        </div>
      )}

      <div className="odb-grid">
        {branches && (
          <section className="odb-card">
            <div className="odb-card-head">
              <h3 className="odb-card-title">Headcount by branch</h3>
              {staff === null && <span className="odb-list-sub">Staff data unavailable</span>}
            </div>
            {staff ? (
              <Bars rows={m.topByStaff} emptyText="No branches yet." />
            ) : (
              <div className="odb-empty">You do not have access to staff data.</div>
            )}
          </section>
        )}

        {branches && (
          <section className="odb-card">
            <div className="odb-card-head">
              <h3 className="odb-card-title">Branches by type</h3>
            </div>
            <Bars rows={m.byType} emptyText="No branches yet." />
          </section>
        )}

        {checklist.length > 0 && (
          <section className="odb-card">
            <div className="odb-card-head">
              <h3 className="odb-card-title">Setup progress</h3>
              <span className="odb-list-sub">
                {checklist.filter((c) => c.done).length}/{checklist.length} done
              </span>
            </div>
            {checklist.map((c) => (
              <div key={c.key} className={`odb-check${c.done ? " done" : ""}`}>
                <span className="odb-check-dot" aria-hidden="true">{c.done && <FaCheck />}</span>
                <span>{c.label}</span>
                {!c.done && c.run && (
                  <button type="button" className="odb-link odb-check-action" onClick={c.run}>{c.cta}</button>
                )}
              </div>
            ))}
          </section>
        )}

        {branches && (
          <section className="odb-card">
            <div className="odb-card-head">
              <h3 className="odb-card-title">Needs attention</h3>
              {m.attention.length > 5 && (
                <button type="button" className="odb-link" onClick={() => navigate(BRANCHES_PATH)}>
                  View all ({m.attention.length})
                </button>
              )}
            </div>
            {m.attention.length === 0 ? (
              <div className="odb-empty">{m.total === 0 ? "No branches yet." : "Every branch is fully set up."}</div>
            ) : (
              <ul className="odb-list">
                {m.attention.slice(0, 5).map((a) => (
                  <li key={a.id} className="odb-list-item">
                    <div className="odb-list-main">
                      <div className="odb-list-name">{a.name}</div>
                      <div className="odb-list-sub">{a.issues.map((i) => i.text).join(" · ")}</div>
                    </div>
                    <button type="button" className="odb-link" onClick={() => openBranch(a.id, a.issues[0].tab)}>
                      Fix
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {actions.length > 0 && (
        <section className="odb-card">
          <div className="odb-card-head">
            <h3 className="odb-card-title">Quick actions</h3>
          </div>
          <div className="odb-actions">
            {actions.map((a) => (
              <button key={a.key} type="button" className="odb-action" onClick={a.run}>{a.label}</button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
