import React from "react";
import OrgSetupWizard from "../../Components/Organisation/OrgSetupWizard";
import "./Organisation.css";
import "./HrOnboarding.css";

export default function InitialSetupPage() {
  return (
    <div className="org-standalone-setup-page">
      <OrgSetupWizard isStandalone={true} />
    </div>
  );
}

