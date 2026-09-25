import React, { useState, useRef, useEffect } from "react";
import { Row, Col, Form, Button, Alert, Spinner, InputGroup, Card } from "react-bootstrap";
import {
  FaBuilding,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaRocket,
  FaCheckCircle,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaGlobe,
  FaPhoneAlt,
  FaEnvelope,
  FaMoneyBillWave,
  FaClock,
  FaCalendarAlt,
  FaFileInvoice,
  FaCloudUploadAlt,
  FaUpload,
  FaTrash,
  FaUserTie,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCrown,
  FaExclamationTriangle,
  FaBarcode,
  FaCity,
  FaMailBulk,
  FaHome,
  FaSitemap,
} from "react-icons/fa";
import {
  createOrganization,
  fetchSystemSetupStatus,
  registerSystemOwner,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { API_BASE_URL } from "../../config/api";
import "../../Pages/Dashboard/HrOnboarding.css";

const ORG_TYPES = [
  { value: "COMPANY", label: "Private / Public Limited Company" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)" },
  { value: "PARTNERSHIP", label: "Partnership Firm" },
  { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
  { value: "OTHER", label: "Other Corporate Enterprise" },
];

const CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "SGD", label: "SGD ($) - Singapore Dollar" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", label: "AUD ($) - Australian Dollar" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +05:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +08:00)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
];

const INITIAL_FORM = {
  // Step 1: Identity
  organizationName: "",
  organizationCode: "",
  legalName: "",
  displayName: "",
  organizationType: "COMPANY",
  industry: "",
  website: "",
  email: "",
  phone: "",
  logo: "",

  // Step 2: Statutory & Tax
  registrationNumber: "",
  pan: "",
  tan: "",
  gstin: "",
  pfNumber: "",
  esiNumber: "",
  msmeNumber: "",
  incorporationDate: "",

  // Step 3: HQ & Locale
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  financialYearStart: "04-01",
  status: "ACTIVE",

  // Step 4: Initial Owner Registration
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
  ownerConfirmPassword: "",
};

export default function OrgSetupWizard({ onOrgCreated, isStandalone = false }) {
  const { loginUser } = useAuth();
  const { refreshOrganization, refreshBranches } = useBranch();

  // Stage: "welcome" (First Intro View with Next Button) or "form" (Stepper + Form)
  const [stage, setStage] = useState(() => {
    return sessionStorage.getItem("org_setup_stage") || "welcome";
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = parseInt(sessionStorage.getItem("org_setup_step") || "1", 10);
    return savedStep >= 1 && savedStep <= 4 ? savedStep : 1;
  });

  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem("org_setup_form");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.organizationName?.includes("Foreign Corp")) parsed.organizationName = "";
        if (parsed.organizationCode?.startsWith("FRG_")) parsed.organizationCode = "";
        if (parsed.industry === "Information Technology" || parsed.industry === "Technology") parsed.industry = "";
        return { ...INITIAL_FORM, ...parsed };
      }
    } catch (e) {}
    return INITIAL_FORM;
  });

  const [existingOrg, setExistingOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);
  const [logoError, setLogoError] = useState("");

  // Check setup status from backend on mount & purge any stale cache
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("org_setup_form");
      if (saved) {
        const parsed = JSON.parse(saved);
        let modified = false;
        if (parsed.organizationName?.includes("Foreign Corp")) {
          parsed.organizationName = "";
          modified = true;
        }
        if (parsed.organizationCode?.startsWith("FRG_")) {
          parsed.organizationCode = "";
          modified = true;
        }
        if (parsed.industry === "Information Technology" || parsed.industry === "Technology") {
          parsed.industry = "";
          modified = true;
        }
        if (modified) {
          sessionStorage.setItem("org_setup_form", JSON.stringify(parsed));
          setFormData((prev) => ({
            ...prev,
            organizationName: parsed.organizationName || "",
            organizationCode: parsed.organizationCode || "",
            industry: parsed.industry || "",
          }));
        }
      }
    } catch (e) {}

    fetchSystemSetupStatus()
      .then((status) => {
        if (status?.organization) {
          setExistingOrg(status.organization);
        }
      })
      .catch((e) => console.warn("Notice checking system setup status:", e.message));
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        if (field !== "logo") {
          const { logo, ...serializable } = updated;
          sessionStorage.setItem("org_setup_form", JSON.stringify(serializable));
        }
      } catch (e) {}
      return updated;
    });
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const setStagePersisted = (newStage) => {
    setStage(newStage);
    sessionStorage.setItem("org_setup_stage", newStage);
  };

  const setStepPersisted = (newStep) => {
    setCurrentStep(newStep);
    sessionStorage.setItem("org_setup_step", String(newStep));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setLogoError("Logo image size must be less than 2MB");
        return;
      }
      setLogoError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField("logo", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.organizationName?.trim()) {
        errs.organizationName = "Organization Name is required.";
      }
      if (!formData.organizationCode?.trim()) {
        errs.organizationCode = "Organization Code is required.";
      }
    }
    if (step === 2) {
      if (formData.pan && formData.pan.length > 20) {
        errs.pan = "PAN Number is too long.";
      }
    }
    if (step === 3) {
      if (!formData.city?.trim()) {
        errs.city = "Headquarters City is required.";
      }
    }
    if (step === 4) {
      if (!formData.ownerFirstName?.trim()) {
        errs.ownerFirstName = "Owner First Name is required.";
      }
      if (!formData.ownerEmail?.trim()) {
        errs.ownerEmail = "Owner Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
        errs.ownerEmail = "Please enter a valid email address.";
      }
      if (!formData.ownerPhone?.trim()) {
        errs.ownerPhone = "Owner Phone Number is required.";
      }
      if (!formData.ownerPassword || formData.ownerPassword.length < 6) {
        errs.ownerPassword = "Password must be at least 6 characters.";
      }
      if (formData.ownerPassword !== formData.ownerConfirmPassword) {
        errs.ownerConfirmPassword = "Passwords do not match.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      setError("");
      return false;
    }

    setValidationErrors({});
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepPersisted(Math.min(currentStep + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep === 1) {
      setStagePersisted("welcome");
    } else {
      setError("");
      setStepPersisted(Math.max(currentStep - 1, 1));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      let orgId = existingOrg?.id || existingOrg?._id;
      let createdOrg = existingOrg;

      // 1. Create organization profile if not yet created
      if (!orgId) {
        const payload = {
          organizationName: formData.organizationName.trim(),
          organizationCode: formData.organizationCode.trim().toUpperCase().replace(/\s+/g, "_"),
          legalName: formData.legalName?.trim() || formData.organizationName.trim(),
          displayName: formData.displayName?.trim() || formData.organizationName.trim(),
          organizationType: formData.organizationType || "COMPANY",
          industry: formData.industry?.trim() || "Technology",
          website: formData.website?.trim() || "",
          email: formData.email?.trim() || formData.ownerEmail?.trim() || "",
          phone: formData.phone?.trim() || formData.ownerPhone?.trim() || "",
          logo: formData.logo?.trim() || "",
          registrationNumber: formData.registrationNumber?.trim() || "",
          pan: formData.pan?.trim()?.toUpperCase() || "",
          tan: formData.tan?.trim()?.toUpperCase() || "",
          gstin: formData.gstin?.trim()?.toUpperCase() || "",
          pfNumber: formData.pfNumber?.trim()?.toUpperCase() || "",
          esiNumber: formData.esiNumber?.trim()?.toUpperCase() || "",
          msmeNumber: formData.msmeNumber?.trim()?.toUpperCase() || "",
          incorporationDate: formData.incorporationDate || null,
          address: formData.address?.trim() || "",
          city: formData.city?.trim() || "",
          state: formData.state?.trim() || "",
          country: formData.country?.trim() || "India",
          pincode: formData.pincode?.trim() || "",
          currency: formData.currency || "INR",
          timeZone: formData.timeZone || "Asia/Kolkata",
          financialYearStart: formData.financialYearStart || "04-01",
          status: formData.status || "ACTIVE",
        };

        const result = await createOrganization(payload);
        createdOrg = result?.data || result;
        orgId = createdOrg?._id || createdOrg?.id;
      }

      if (!orgId) {
        throw new Error("Unable to establish valid organization ID.");
      }

      localStorage.setItem("organizationId", orgId);
      localStorage.setItem("tenantId", orgId);

      // 2. Register One-Time Owner Account
      const ownerPayload = {
        organizationId: orgId,
        firstName: formData.ownerFirstName.trim(),
        lastName: formData.ownerLastName.trim() || undefined,
        email: formData.ownerEmail.trim().toLowerCase(),
        mobileNo: formData.ownerPhone.trim(),
        password: formData.ownerPassword,
      };

      const regResult = await registerSystemOwner(ownerPayload);
      let token = regResult?.token || regResult?.data?.token;
      let userObj = regResult?.data?.user || regResult?.user || regResult?.data?.owner;

      // Auto-authenticate with Owner session credentials
      if (!token) {
        try {
          const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: formData.ownerEmail.trim().toLowerCase(),
              email: formData.ownerEmail.trim().toLowerCase(),
              password: formData.ownerPassword,
            }),
          });
          const loginData = await loginRes.json();
          if (loginData?.token) {
            token = loginData.token;
            userObj = loginData.user || userObj;
          }
        } catch (authErr) {
          console.warn("Auto-login fallback error:", authErr);
        }
      }

      if (token) {
        localStorage.setItem("tenantId", orgId);
        localStorage.setItem("organizationId", orgId);
        localStorage.setItem("isAuthenticated", "true");
        if (loginUser) {
          await loginUser(token, userObj);
        }
      }

      // Clear setup wizard temporary session state
      try {
        sessionStorage.removeItem("org_setup_stage");
        sessionStorage.removeItem("org_setup_step");
        sessionStorage.removeItem("org_setup_form");
      } catch (e) {}

      if (refreshOrganization) await refreshOrganization();
      if (refreshBranches) await refreshBranches();

      setSuccessMessage("Organization and Owner account registered successfully! Entering dashboard...");

      setTimeout(() => {
        if (onOrgCreated) {
          onOrgCreated(createdOrg);
        }
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      console.error("Error launching organization & owner setup:", err);
      setError(err.message || "Failed to initialize organization & owner account.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STAGE 1: PROFESSIONAL LUXURY WELCOME SCREEN (CENTER FIT - NO SCROLL)
  // =========================================================================
  if (stage === "welcome") {
    return (
      <div className="org-welcome-fullcenter-wrap">
        <div className="org-welcome-ambient-glow" />
        <Card className="org-welcome-card border-0">
          {/* Header with Enterprise Glowing Icon */}
          <div className="text-center mb-3 pb-2.5 border-bottom">
            <div className="mb-2.5">
              <div className="org-welcome-rocket-badge-ring">
                <div className="org-welcome-rocket-badge">
                  <FaRocket />
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-center gap-2 mb-1.5 flex-wrap">
              <h3 className="fw-bolder mb-0 text-dark" style={{ letterSpacing: "-0.02em", fontSize: "1.45rem" }}>
                Setup Your Enterprise Organization
              </h3>
              <span className="onboarding-enterprise-pill" style={{ fontSize: "10.5px", padding: "2px 9px" }}>Enterprise Setup</span>
            </div>
            <p className="text-muted small mx-auto mb-0" style={{ maxWidth: 620, lineHeight: 1.5, fontSize: "12.5px" }}>
              Welcome to the <strong>TeamHub HRMS Platform</strong>! No organization owner account was detected.
              Please complete the initial 4-step setup to establish your corporate profile, configure compliance defaults, and register your primary root System Owner account.
            </p>
          </div>

          {/* 4 Feature Milestone Cards Grid */}
          <Row className="g-3 mb-3">
            <Col md={6}>
              <div className="org-welcome-milestone-card">
                <div className="org-welcome-icon-box">
                  <FaBuilding />
                </div>
                <div>
                  <div className="fw-bold text-dark mb-0.5" style={{ fontSize: "13px" }}>
                    1. Organization Profile & Brand
                  </div>
                  <div className="text-muted" style={{ fontSize: "11.5px", lineHeight: 1.4 }}>
                    Entity name, tenant code, legal title, and corporate logo photo.
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6}>
              <div className="org-welcome-milestone-card">
                <div className="org-welcome-icon-box">
                  <FaShieldAlt />
                </div>
                <div>
                  <div className="fw-bold text-dark mb-0.5" style={{ fontSize: "13px" }}>
                    2. Statutory & Tax Compliance
                  </div>
                  <div className="text-muted" style={{ fontSize: "11.5px", lineHeight: 1.4 }}>
                    MCA CIN, PAN, TAN, GSTIN, and EPFO/ESIC compliance registration details.
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6}>
              <div className="org-welcome-milestone-card">
                <div className="org-welcome-icon-box">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <div className="fw-bold text-dark mb-0.5" style={{ fontSize: "13px" }}>
                    3. Headquarters & Localization
                  </div>
                  <div className="text-muted" style={{ fontSize: "11.5px", lineHeight: 1.4 }}>
                    Head office street address, municipal city, currency, timezone, and FY cycle.
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6}>
              <div className="org-welcome-milestone-card">
                <div className="org-welcome-icon-box">
                  <FaCrown />
                </div>
                <div>
                  <div className="fw-bold text-dark mb-0.5" style={{ fontSize: "13px" }}>
                    4. Primary Owner Registration
                  </div>
                  <div className="text-muted" style={{ fontSize: "11.5px", lineHeight: 1.4 }}>
                    Root administrator name, official email, phone, and secure sign-in password.
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Next Action CTA Button & Helpers */}
          <div className="d-flex flex-column align-items-center gap-2 pt-1">
            <Button
              className="org-welcome-cta-btn d-flex align-items-center justify-content-center"
              onClick={() => setStagePersisted("form")}
            >
              Next: Start Setup Wizard <FaArrowRight className="ms-2" />
            </Button>
          </div>

          <div className="text-center text-muted extra-small pt-2.5 border-top mt-2.5 d-flex align-items-center justify-content-center gap-2" style={{ fontSize: "11px", opacity: 0.85 }}>
            <FaLock className="text-warning" size={10} />
            <span>TeamHub Enterprise HRMS &bull; Single-Tenant Secure Architecture</span>
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // STAGE 2: 4-STEP WIZARD FORM (SHOWS AFTER CLICKING "NEXT")
  // =========================================================================
  return (
    <div className="org-form-centered-container">
      {/* ── 1. Top Header ── */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom flex-wrap">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="onboarding-back-btn"
            onClick={handlePrev}
            title="Previous Step"
          >
            <FaChevronLeft size={13} />
          </button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="mb-0 fw-bold onboarding-header-title">
                Setup Enterprise Organization & Owner
              </h4>
              <span className="onboarding-enterprise-pill">
                Enterprise
              </span>
            </div>
            <span className="text-muted extra-small d-block mt-0.5">
              Establish corporate identity, statutory tax compliance, operational headquarters, and initial root owner account.
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="onboarding-active-form-pill">
            <FaCrown className="me-2 text-warning" /> Step {currentStep} of 4
          </span>
        </div>
      </div>

      {/* ── 2. Sleek Horizontal 4-Step Stepper ── */}
      <div className="org-wizard-stepper">
        {[
          { num: 1, label: "Entity & Identity", icon: FaBuilding },
          { num: 2, label: "Tax & Compliance", icon: FaShieldAlt },
          { num: 3, label: "HQ & Localization", icon: FaMapMarkerAlt },
          { num: 4, label: "System Owner", icon: FaCrown },
        ].map((s, idx) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          const IconComp = s.icon;
          return (
            <React.Fragment key={s.num}>
              <div
                className={`org-wizard-step-item ${isCurrent ? "active" : isDone ? "completed" : ""}`}
                onClick={() => (isDone || isCurrent) && setCurrentStep(s.num)}
                style={{ cursor: isDone || isCurrent ? "pointer" : "default" }}
              >
                <div className="org-wizard-step-circle">
                  {isDone ? <FaCheckCircle size={13} /> : <IconComp size={13} />}
                </div>
                <span className="org-wizard-step-title d-none d-sm-inline">{s.label}</span>
              </div>
              {idx < 3 && <div className={`org-wizard-step-line ${isDone ? "completed" : ""}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── 3. Main Form Card ── */}
      <Card className="onboarding-dash-card p-4 p-md-5 bg-white mb-4 shadow-sm border">
            {/* Form Section Header with TeamHub Gold Badge */}
            <div className="d-flex align-items-start justify-content-between gap-3 mb-4 pb-3 border-bottom flex-wrap">
              <div className="d-flex align-items-center gap-3">
                <div className="onboarding-section-icon-badge">
                  {currentStep === 1 ? <FaBuilding size={16} /> :
                   currentStep === 2 ? <FaShieldAlt size={16} /> :
                   currentStep === 3 ? <FaMapMarkerAlt size={16} /> :
                   <FaCrown size={16} />}
                </div>
                <div>
                  <h5 className="fw-bold mb-1 text-dark" style={{ fontSize: "16px" }}>
                    {currentStep === 1 ? "Step 1: Organization Profile & Brand Identity" :
                     currentStep === 2 ? "Step 2: Statutory, Tax & Legal Registration" :
                     currentStep === 3 ? "Step 3: Headquarters & Regional Localization" :
                     "Step 4: System Owner & Root Administrator Account"}
                  </h5>
                  <span className="extra-small text-muted d-block">
                    Fields marked with <span className="text-danger fw-bold">*</span> are mandatory for enterprise setup.
                  </span>
                </div>
              </div>

              <span className="onboarding-enterprise-pill">
                Step {currentStep} of 4
              </span>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-4 shadow-sm">
                <div className="d-flex align-items-center gap-2">
                  <FaExclamationTriangle className="text-danger flex-shrink-0" />
                  <span><strong>Action Required:</strong> {error}</span>
                </div>
              </Alert>
            )}

            {/* Success Alert */}
            {successMessage && (
              <Alert variant="success" className="mb-4 shadow-sm">
                <div className="d-flex align-items-center gap-2">
                  <FaCheckCircle className="text-success flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              </Alert>
            )}

            {/* ── STEP 1: ENTITY & IDENTITY ── */}
            {currentStep === 1 && (
              <div>
                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>ORGANIZATION NAME <span className="text-danger">*</span></span>
                        {validationErrors.organizationName && (
                          <span className="text-danger extra-small fw-semibold">Required</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaBuilding size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          required
                          className="ps-2"
                          placeholder="Enter organization name"
                          value={formData.organizationName}
                          isInvalid={!!validationErrors.organizationName}
                          onChange={(e) => updateField("organizationName", e.target.value)}
                        />
                      </InputGroup>
                      {validationErrors.organizationName ? (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.organizationName}
                        </div>
                      ) : (
                        <Form.Text className="text-muted extra-small">Official commercial entity name of your company.</Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>ORGANIZATION CODE <span className="text-danger">*</span></span>
                        {validationErrors.organizationCode && (
                          <span className="text-danger extra-small fw-semibold">Required</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaBarcode size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          required
                          className="font-monospace text-uppercase ps-2"
                          placeholder="Enter code (e.g. ACME)"
                          value={formData.organizationCode}
                          isInvalid={!!validationErrors.organizationCode}
                          onChange={(e) =>
                            updateField(
                              "organizationCode",
                              e.target.value.toUpperCase().replace(/\s+/g, "_")
                            )
                          }
                        />
                      </InputGroup>
                      {validationErrors.organizationCode ? (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.organizationCode}
                        </div>
                      ) : (
                        <Form.Text className="text-muted extra-small">Unique alphanumeric tenant code for prefixing IDs & tags.</Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">LEGAL REGISTERED NAME</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaBuilding size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter full legal registered name"
                          value={formData.legalName}
                          onChange={(e) => updateField("legalName", e.target.value)}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">Official statutory entity title as registered with government.</Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">BRAND / DISPLAY TITLE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaBuilding size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter brand or display name"
                          value={formData.displayName}
                          onChange={(e) => updateField("displayName", e.target.value)}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">Front-facing brand name displayed in employee portals.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">ORGANIZATION TYPE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaSitemap size={14} />
                        </InputGroup.Text>
                        <Form.Select
                          value={formData.organizationType}
                          onChange={(e) => updateField("organizationType", e.target.value)}
                          className="onboarding-dash-select ps-2"
                        >
                          {ORG_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">Legal operating structure and corporate entity category.</Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">INDUSTRY SECTOR</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaRocket size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter industry sector"
                          value={formData.industry}
                          onChange={(e) => updateField("industry", e.target.value)}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">Primary business domain or industry classification.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">COMPANY WEBSITE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaGlobe size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          type="url"
                          className="ps-2"
                          placeholder="https://www.company.com"
                          value={formData.website}
                          onChange={(e) => updateField("website", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">CORPORATE EMAIL</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaEnvelope size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          className="ps-2"
                          placeholder="contact@company.com"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">CONTACT PHONE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaPhoneAlt size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-2">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">COMPANY EMBLEM & LOGO</Form.Label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleLogoFileChange}
                        style={{ display: "none" }}
                      />
                      {formData.logo ? (
                        <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3">
                            <img src={formData.logo} alt="Logo" style={{ height: 48, width: 48, objectFit: "contain", borderRadius: 8 }} />
                            <div>
                              <div className="fw-bold text-dark small">Logo Photo Uploaded</div>
                              <div className="text-muted extra-small">Ready for navigation headers and corporate payslips.</div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <Button variant="outline-secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                              <FaUpload className="me-1" /> Change
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => updateField("logo", "")}>
                              <FaTrash />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="p-4 border rounded-3 bg-light text-center"
                          style={{ cursor: "pointer", borderStyle: "dashed" }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FaCloudUploadAlt className="text-muted fs-3 mb-2" />
                          <div className="fw-bold text-dark small">Click to upload company logo photo</div>
                          <div className="text-muted extra-small">Supports PNG, JPG, JPEG, SVG, WebP (Max 2MB)</div>
                        </div>
                      )}
                      {logoError && <div className="text-danger small mt-1">{logoError}</div>}
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* ── STEP 2: TAX & COMPLIANCE ── */}
            {currentStep === 2 && (
              <div>
                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">CIN / REGISTRATION NUMBER</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaBarcode size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="font-monospace ps-2"
                          placeholder="Enter CIN or registration number"
                          value={formData.registrationNumber}
                          onChange={(e) => updateField("registrationNumber", e.target.value)}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">Corporate Identification Number from Ministry of Corporate Affairs.</Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">PAN NUMBER (PERMANENT ACCOUNT NO)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaFileInvoice size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="font-monospace text-uppercase ps-2"
                          placeholder="Enter 10-digit PAN"
                          value={formData.pan}
                          onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
                          isInvalid={!!validationErrors.pan}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">10-digit income tax permanent account identifier.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">TAN NUMBER (TAX DEDUCTION ACCOUNT)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaFileInvoice size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="font-monospace text-uppercase ps-2"
                          placeholder="Enter 10-digit TAN"
                          value={formData.tan}
                          onChange={(e) => updateField("tan", e.target.value.toUpperCase())}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">Required for statutory TDS filings and tax reports.</Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">GSTIN (GOODS & SERVICES TAX ID)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaFileInvoice size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="font-monospace text-uppercase ps-2"
                          placeholder="Enter 15-digit GSTIN"
                          value={formData.gstin}
                          onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">15-digit goods and services tax identifier.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-2">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">DATE OF INCORPORATION</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaCalendarAlt size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          type="date"
                          className="ps-2"
                          value={formData.incorporationDate}
                          onChange={(e) => updateField("incorporationDate", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">PF / EPFO ESTABLISHMENT CODE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaShieldAlt size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="font-monospace text-uppercase ps-2"
                          placeholder="Enter PF code"
                          value={formData.pfNumber}
                          onChange={(e) => updateField("pfNumber", e.target.value.toUpperCase())}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">ESIC CODE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaShieldAlt size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="font-monospace text-uppercase ps-2"
                          placeholder="Enter ESIC code"
                          value={formData.esiNumber}
                          onChange={(e) => updateField("esiNumber", e.target.value.toUpperCase())}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* ── STEP 3: HEADQUARTERS & LOCALIZATION ── */}
            {currentStep === 3 && (
              <div>
                <Row className="g-4 mb-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">HEADQUARTERS STREET ADDRESS</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaHome size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter street address, building / suite"
                          value={formData.address}
                          onChange={(e) => updateField("address", e.target.value)}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted extra-small">Premises building, suite number, and street location.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>CITY / METROPOLIS <span className="text-danger">*</span></span>
                        {validationErrors.city && (
                          <span className="text-danger extra-small fw-semibold">Required</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaCity size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          required
                          className="ps-2"
                          placeholder="Enter city"
                          value={formData.city}
                          isInvalid={!!validationErrors.city}
                          onChange={(e) => updateField("city", e.target.value)}
                        />
                      </InputGroup>
                      {validationErrors.city ? (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.city}
                        </div>
                      ) : (
                        <Form.Text className="text-muted extra-small">City municipality where headquarters operates.</Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">STATE / PROVINCE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaMapMarkerAlt size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter state or province"
                          value={formData.state}
                          onChange={(e) => updateField("state", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">COUNTRY</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaGlobe size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter country"
                          value={formData.country}
                          onChange={(e) => updateField("country", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">POSTAL / ZIP CODE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaMailBulk size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="font-monospace ps-2"
                          placeholder="Enter postal / ZIP code"
                          value={formData.pincode}
                          onChange={(e) => updateField("pincode", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-2">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">CURRENCY</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaMoneyBillWave size={14} />
                        </InputGroup.Text>
                        <Form.Select
                          value={formData.currency}
                          onChange={(e) => updateField("currency", e.target.value)}
                          className="onboarding-dash-select ps-2"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">TIME ZONE</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaClock size={14} />
                        </InputGroup.Text>
                        <Form.Select
                          value={formData.timeZone}
                          onChange={(e) => updateField("timeZone", e.target.value)}
                          className="onboarding-dash-select ps-2"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">FINANCIAL YEAR START</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaCalendarAlt size={14} />
                        </InputGroup.Text>
                        <Form.Select
                          value={formData.financialYearStart}
                          onChange={(e) => updateField("financialYearStart", e.target.value)}
                          className="onboarding-dash-select ps-2"
                        >
                          <option value="04-01">April 1st (Standard IN / UK)</option>
                          <option value="01-01">January 1st (Calendar Year / US)</option>
                          <option value="07-01">July 1st (AU / NZ)</option>
                          <option value="10-01">October 1st</option>
                        </Form.Select>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* ── STEP 4: OWNER ACCOUNT REGISTRATION ── */}
            {currentStep === 4 && (
              <div>
                <div className="p-3 mb-4 rounded-3 bg-light border d-flex align-items-center gap-3">
                  <div className="onboarding-section-icon-badge">
                    <FaCrown size={16} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark small">One-Time Owner Account Registration</div>
                    <div className="text-muted extra-small">
                      This user account will be granted root <code>OWNER</code> authority across all organization branches, billing settings, and enterprise controls.
                    </div>
                  </div>
                </div>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>OWNER FIRST NAME <span className="text-danger">*</span></span>
                        {validationErrors.ownerFirstName && (
                          <span className="text-danger extra-small fw-semibold">Required</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaUserTie size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          required
                          className="ps-2"
                          placeholder="Enter first name"
                          value={formData.ownerFirstName}
                          isInvalid={!!validationErrors.ownerFirstName}
                          onChange={(e) => updateField("ownerFirstName", e.target.value)}
                        />
                      </InputGroup>
                      {validationErrors.ownerFirstName && (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.ownerFirstName}
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark mb-1">OWNER LAST NAME</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaUserTie size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          className="ps-2"
                          placeholder="Enter last name"
                          value={formData.ownerLastName}
                          onChange={(e) => updateField("ownerLastName", e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>OFFICIAL OWNER EMAIL <span className="text-danger">*</span></span>
                        {validationErrors.ownerEmail && (
                          <span className="text-danger extra-small fw-semibold">Required</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaEnvelope size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          required
                          className="ps-2"
                          placeholder="owner@company.com"
                          value={formData.ownerEmail}
                          isInvalid={!!validationErrors.ownerEmail}
                          onChange={(e) => updateField("ownerEmail", e.target.value)}
                        />
                      </InputGroup>
                      {validationErrors.ownerEmail ? (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.ownerEmail}
                        </div>
                      ) : (
                        <Form.Text className="text-muted extra-small">Primary sign-in credential for administrative access.</Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>CONTACT MOBILE NUMBER <span className="text-danger">*</span></span>
                        {validationErrors.ownerPhone && (
                          <span className="text-danger extra-small fw-semibold">Required</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaPhoneAlt size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          type="tel"
                          required
                          className="ps-2"
                          placeholder="Enter mobile number"
                          value={formData.ownerPhone}
                          isInvalid={!!validationErrors.ownerPhone}
                          onChange={(e) => updateField("ownerPhone", e.target.value)}
                        />
                      </InputGroup>
                      {validationErrors.ownerPhone && (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.ownerPhone}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mb-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>OWNER PASSWORD <span className="text-danger">*</span></span>
                        {validationErrors.ownerPassword && (
                          <span className="text-danger extra-small fw-semibold">Required</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaLock size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          required
                          className="ps-2"
                          placeholder="Enter password"
                          value={formData.ownerPassword}
                          isInvalid={!!validationErrors.ownerPassword}
                          onChange={(e) => updateField("ownerPassword", e.target.value)}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                          className="border-start-0"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </InputGroup>
                      {validationErrors.ownerPassword ? (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.ownerPassword}
                        </div>
                      ) : (
                        <Form.Text className="text-muted extra-small">Minimum 6 characters with secure combination.</Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                        <span>CONFIRM PASSWORD <span className="text-danger">*</span></span>
                        {validationErrors.ownerConfirmPassword && (
                          <span className="text-danger extra-small fw-semibold">Mismatch</span>
                        )}
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                          <FaLock size={14} />
                        </InputGroup.Text>
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          className="ps-2"
                          placeholder="Confirm password"
                          value={formData.ownerConfirmPassword}
                          isInvalid={!!validationErrors.ownerConfirmPassword}
                          onChange={(e) => updateField("ownerConfirmPassword", e.target.value)}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          type="button"
                          className="border-start-0"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </InputGroup>
                      {validationErrors.ownerConfirmPassword && (
                        <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                          <FaExclamationTriangle size={11} /> {validationErrors.ownerConfirmPassword}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* ── Bottom Navigation Action Toolbar ── */}
            <div className="d-flex align-items-center justify-content-between pt-4 mt-4 border-top flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <Button
                  type="button"
                  className="onboarding-nav-btn onboarding-prev-btn"
                  onClick={handlePrev}
                  disabled={loading}
                >
                  <FaChevronLeft size={10} className="me-1" /> {currentStep === 1 ? "Back to Welcome" : "Previous Step"}
                </Button>
              </div>

              <div>
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    className="onboarding-nav-btn onboarding-next-btn"
                    onClick={handleNext}
                  >
                    Continue <FaChevronRight size={10} className="ms-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="onboarding-nav-btn onboarding-submit-btn"
                    disabled={loading}
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" /> Initializing Organization & Owner...
                      </>
                    ) : (
                      <>
                        <FaRocket className="me-2" /> Complete Setup & Register Owner
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
      </Card>
    </div>
  );
}
