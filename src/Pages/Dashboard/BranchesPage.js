import React from "react";
import { useNavigate } from "react-router-dom";
import BranchesSection from "../../Components/Organisation/BranchesSection";

/**
 * Dedicated Full-Page Branches Workspace
 * Renders the complete multi-facility branch directory and branch detail hub
 * as an independent, standalone page separated from the Organization hub.
 */
export default function BranchesPage() {
  const navigate = useNavigate();

  return (
    <div className="branches-page-wrapper">
      <BranchesSection
        isStandaloneView={true}
        onBackToOrg={() => navigate("/organisation")}
        onNavigateTab={(tab) => navigate(`/organisation/${tab}`)}
      />
    </div>
  );
}
