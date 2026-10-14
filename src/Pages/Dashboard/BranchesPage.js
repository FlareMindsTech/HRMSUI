import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BranchesSection from "../../Components/Organisation/BranchesSection";
import { ORG_BASE_PATH, orgTabPath } from "../../Components/Organisation/navigation/orgNavConfig";

/**
 * Branch workspace page (/organisation/branches).
 *
 * Directory + per-branch detail hub. Detail state lives in the URL
 * (?branchId=<id>&tab=<key>) so every view is linkable and back/forward safe.
 * "Back to Organisation" and cross-links go through the shared nav config.
 */
export default function BranchesPage() {
  const navigate = useNavigate();
  const goOrg = useCallback(() => navigate(ORG_BASE_PATH), [navigate]);
  const goOrgTab = useCallback((tab) => navigate(orgTabPath(tab)), [navigate]);

  return (
    <div className="branches-page-wrapper">
      <BranchesSection isStandaloneView={true} onBackToOrg={goOrg} onNavigateTab={goOrgTab} />
    </div>
  );
}
