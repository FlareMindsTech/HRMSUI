import React, { useState, useRef } from "react";
import { Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
import {
  FaBuilding,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaRocket,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaMoneyBillWave,
  FaClock,
  FaCalendarAlt,
  FaMagic,
  FaFileInvoice,
  FaCloudUploadAlt,
  FaUpload,
  FaTrash,
} from "react-icons/fa";
import { createOrganization } from "../../services/organizationService";
import { useBranch } from "../../context/BranchContext";

const ORG_TYPES = ["COMPANY", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "OTHER"];

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
  organizationName: "",
  organizationCode: "",
  legalName: "",
  displayName: "",
  organizationType: "COMPANY",
  industry: "Information Technology",
  website: "",
  email: "",
  phone: "",
  logo: "",
  registrationNumber: "",
  pan: "",
  tan: "",
  gstin: "",
  incorporationDate: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  financialYearStart: "04-01",
  status: "ACTIVE",
};

export default function OrgSetupWizard({ onOrgCreated }) {
  const { refreshOrganization, refreshBranches } = useBranch();
  // Stage: "welcome" (First Intro View with Next Button) or "form" (Stepper + Form)
  const [stage, setStage] = useState(() => {
    return sessionStorage.getItem("org_setup_stage") || "welcome";
  });
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = parseInt(sessionStorage.getItem("org_setup_step") || "1", 10);
    return savedStep >= 1 && savedStep <= 3 ? savedStep : 1;
  });
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem("org_setup_form");
      if (saved) return { ...INITIAL_FORM, ...JSON.parse(saved) };
    } catch (e) {}
    return INITIAL_FORM;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);
  const [logoError, setLogoError] = useState("");

  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        sessionStorage.setItem("org_setup_form", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
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

  const handleFillSample = () => {
    const sampleData = {
      organizationName: "FlareMinds Technologies",
      organizationCode: "FLMT_CORP",
      legalName: "FlareMinds Technologies Private Limited",
      displayName: "FlareMinds Tech",
      organizationType: "COMPANY",
      industry: "Information Technology & Services",
      website: "https://flareminds.com",
      email: "contact@flareminds.com",
      phone: "+91 98765 43210",
      logo: "",
      registrationNumber: "U72200TZ2024PTC012345",
      pan: "AAACF1234K",
      tan: "CHEF12345A",
      gstin: "33AAACF1234K1Z8",
      incorporationDate: "2024-01-15",
      address: "100 Tech Park, Avinashi Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      country: "India",
      pincode: "641014",
      currency: "INR",
      timeZone: "Asia/Kolkata",
      financialYearStart: "04-01",
      status: "ACTIVE",
    };
    setFormData(sampleData);
    try {
      sessionStorage.setItem("org_setup_form", JSON.stringify(sampleData));
    } catch (e) {}
    setValidationErrors({});
    setError("");
    setStagePersisted("form");
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.organizationName?.trim()) {
        errs.organizationName = "Organization Name is required";
      }
      if (!formData.organizationCode?.trim()) {
        errs.organizationCode = "Organization Code is required";
      }
    }
    if (step === 2) {
      if (formData.pan && formData.pan.length > 20) {
        errs.pan = "PAN Number is too long";
      }
    }
    if (step === 3) {
      if (!formData.city?.trim()) {
        errs.city = "Headquarters City is recommended";
      }
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepPersisted(Math.min(currentStep + 1, 3));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep === 1) {
      setStagePersisted("welcome");
    } else {
      setStepPersisted(Math.max(currentStep - 1, 1));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setError("Please fill all required fields before completing setup.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        organizationName: formData.organizationName.trim(),
        organizationCode: formData.organizationCode.trim().toUpperCase().replace(/\s+/g, "_"),
        legalName: formData.legalName?.trim() || formData.organizationName.trim(),
        displayName: formData.displayName?.trim() || formData.organizationName.trim(),
        organizationType: formData.organizationType || "COMPANY",
        industry: formData.industry?.trim() || "Technology",
        website: formData.website?.trim() || "",
        email: formData.email?.trim() || "",
        phone: formData.phone?.trim() || "",
        logo: formData.logo?.trim() || "",
        registrationNumber: formData.registrationNumber?.trim() || "",
        pan: formData.pan?.trim()?.toUpperCase() || "",
        tan: formData.tan?.trim()?.toUpperCase() || "",
        gstin: formData.gstin?.trim()?.toUpperCase() || "",
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
      const createdOrg = result?.data || result;
      const orgId = createdOrg?._id || createdOrg?.id;
      if (orgId) {
        localStorage.setItem("organizationId", orgId);
        localStorage.setItem("tenantId", orgId);
        try {
          const uStr = localStorage.getItem("user");
          if (uStr) {
            const u = JSON.parse(uStr);
            u.organizationId = orgId;
            u.tenantId = orgId;
            localStorage.setItem("user", JSON.stringify(u));
          }
        } catch (e) {}
      }

      // Clear setup wizard temporary session state upon completion
      try {
        sessionStorage.removeItem("org_setup_stage");
        sessionStorage.removeItem("org_setup_step");
        sessionStorage.removeItem("org_setup_form");
      } catch (e) {}

      // Update global branch & organization contexts
      if (refreshOrganization) await refreshOrganization();
      if (refreshBranches) await refreshBranches();

      if (onOrgCreated) {
        onOrgCreated(createdOrg);
      }
    } catch (err) {
      console.error("Error launching organization:", err);
      setError(err.message || "Failed to create organization profile.");
    } finally {
      setLoading(false);
    }
  };

  // ── STAGE 1: WELCOME SCREEN WITH "NEXT" BUTTON ──
  if (stage === "welcome") {
    return (
      <div className="org-empty-onboarding-container">
        <div className="org-empty-onboarding-card">
          <div className="org-empty-icon-circle">
            <FaRocket className="org-empty-rocket-icon" />
          </div>
          <h2 className="org-empty-title">Setup Your Enterprise Organization</h2>
          <p className="org-empty-desc">
            Welcome to the HRMS Platform! No organization profile was detected. Please create your organization to
            configure your enterprise hierarchy, branches, departments, job roles, attendance, and employee management.
          </p>

          <div className="org-empty-steps-grid">
            <div className="org-empty-step-item">
              <div className="org-empty-step-badge">1</div>
              <div className="org-empty-step-title">Organization Profile</div>
              <div className="org-empty-step-sub">Name, Code, Legal entity & Industry</div>
            </div>
            <div className="org-empty-step-item">
              <div className="org-empty-step-badge">2</div>
              <div className="org-empty-step-title">Tax & Compliance</div>
              <div className="org-empty-step-sub">CIN, PAN, TAN, GSTIN & Reg Details</div>
            </div>
            <div className="org-empty-step-item">
              <div className="org-empty-step-badge">3</div>
              <div className="org-empty-step-title">HQ & Localization</div>
              <div className="org-empty-step-sub">Address, Currency, Timezone & FY Start</div>
            </div>
          </div>

          <div className="org-empty-cta-actions d-flex flex-column align-items-center gap-2">
            <Button
              className="org-empty-create-btn d-flex align-items-center justify-content-center"
              size="lg"
              onClick={() => setStagePersisted("form")}
            >
              Next <FaArrowRight className="ms-2" />
            </Button>

            <Button
              variant="link"
              className="text-muted small mt-2 text-decoration-none"
              onClick={handleFillSample}
            >
              <FaMagic className="me-1 text-gold" /> Or auto-fill with sample enterprise data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── STAGE 2: CLEAN STEPPER FORM WITH LIVE PREVIEW (WITHOUT BIG REDUNDANT HEADER) ──
  return (
    <div className="org-setup-wizard-container">
      {/* ── Step Progress Stepper Bar ── */}
      <div className="org-setup-stepper">
        <div
          className={`org-setup-step-pill ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
          onClick={() => setCurrentStep(1)}
          role="button"
        >
          <div className="org-setup-pill-num">{currentStep > 1 ? <FaCheckCircle /> : "1"}</div>
          <div className="org-setup-pill-text">
            <span className="org-setup-pill-title">Entity & Identity</span>
            <span className="org-setup-pill-desc">Name, Code & Brand</span>
          </div>
        </div>

        <div className="org-setup-step-divider" />

        <div
          className={`org-setup-step-pill ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}
          onClick={() => validateStep(1) && setCurrentStep(2)}
          role="button"
        >
          <div className="org-setup-pill-num">{currentStep > 2 ? <FaCheckCircle /> : "2"}</div>
          <div className="org-setup-pill-text">
            <span className="org-setup-pill-title">Tax & Statutory</span>
            <span className="org-setup-pill-desc">CIN, PAN, TAN & GST</span>
          </div>
        </div>

        <div className="org-setup-step-divider" />

        <div
          className={`org-setup-step-pill ${currentStep === 3 ? "active" : ""}`}
          onClick={() => validateStep(1) && validateStep(2) && setCurrentStep(3)}
          role="button"
        >
          <div className="org-setup-pill-num">3</div>
          <div className="org-setup-pill-text">
            <span className="org-setup-pill-title">HQ & Localization</span>
            <span className="org-setup-pill-desc">Address, Timezone & FY</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="org-setup-alert mb-4">
          {error}
        </Alert>
      )}

      {/* ── Main Form Grid ── */}
      <Row className="g-4 org-setup-body-row">
        <Col lg={12}>
          <div className="org-setup-card-box">
            {/* STEP 1: ENTITY & IDENTITY */}
            {currentStep === 1 && (
              <div className="org-setup-step-content">
                <div className="org-setup-section-heading">
                  <FaBuilding className="me-2 text-gold" /> Step 1: Organization Profile & Brand Identity
                </div>
                <p className="org-setup-section-lead">
                  Define your core corporate entity, brand code, and primary business sector.
                </p>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        Organization Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. FlareMinds Technologies"
                        value={formData.organizationName}
                        onChange={(e) => updateField("organizationName", e.target.value)}
                        isInvalid={!!validationErrors.organizationName}
                        className="org-form-control-lg"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.organizationName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        Organization Code <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. FLMT_CORP"
                        value={formData.organizationCode}
                        onChange={(e) =>
                          updateField(
                            "organizationCode",
                            e.target.value.toUpperCase().replace(/\s+/g, "_")
                          )
                        }
                        isInvalid={!!validationErrors.organizationCode}
                        className="org-form-control-lg font-monospace fw-bold text-uppercase"
                      />
                      <Form.Text className="text-muted small">
                        Unique uppercase tenant code used for internal IDs and API tags.
                      </Form.Text>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.organizationCode}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">Legal Registered Entity Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. FlareMinds Technologies Pvt Ltd"
                        value={formData.legalName}
                        onChange={(e) => updateField("legalName", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">Brand / Display Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. FlareMinds Tech"
                        value={formData.displayName}
                        onChange={(e) => updateField("displayName", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">Organization Type</Form.Label>
                      <Form.Select
                        value={formData.organizationType}
                        onChange={(e) => updateField("organizationType", e.target.value)}
                      >
                        {ORG_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">Industry Sector</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Information Technology"
                        value={formData.industry}
                        onChange={(e) => updateField("industry", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaGlobe className="me-1 text-muted" /> Company Website
                      </Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="e.g. https://www.flareminds.com"
                        value={formData.website}
                        onChange={(e) => updateField("website", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaEnvelope className="me-1 text-muted" /> Corporate Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="e.g. contact@flareminds.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaPhone className="me-1 text-muted" /> Contact Phone
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group className="org-logo-upload-group">
                      <Form.Label className="org-form-label">
                        Brand Logo & Company Emblem Photo
                      </Form.Label>
                      <div className="org-logo-upload-box">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          onChange={handleLogoFileChange}
                          style={{ display: "none" }}
                        />
                        {formData.logo ? (
                          <div className="org-logo-preview-wrapper">
                            <div className="org-logo-preview-thumb">
                              <img src={formData.logo} alt="Brand Logo Preview" />
                            </div>
                            <div className="org-logo-preview-info">
                              <div className="org-logo-preview-title">Company Logo Selected</div>
                              <div className="org-logo-preview-sub">Logo is ready for your dashboard header and enterprise branding.</div>
                              <div className="org-logo-preview-actions">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="org-logo-btn-change"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <FaUpload className="me-1" /> Change Photo
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="org-logo-btn-remove"
                                  onClick={() => updateField("logo", "")}
                                >
                                  <FaTrash className="me-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="org-logo-dropzone"
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                          >
                            <div className="org-logo-dropzone-icon">
                              <FaCloudUploadAlt />
                            </div>
                            <div className="org-logo-dropzone-text">
                              <span className="fw-bold text-dark">Click to upload company logo photo</span> or drag & drop file
                            </div>
                            <div className="org-logo-dropzone-sub">
                              Supports PNG, JPG, JPEG, SVG, WebP (Max file size 2MB)
                            </div>
                          </div>
                        )}
                      </div>
                      {logoError && <div className="text-danger small mt-1">{logoError}</div>}
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* STEP 2: TAX & COMPLIANCE */}
            {currentStep === 2 && (
              <div className="org-setup-step-content">
                <div className="org-setup-section-heading">
                  <FaShieldAlt className="me-2 text-gold" /> Step 2: Statutory, Tax & Legal Registration
                </div>
                <p className="org-setup-section-lead">
                  Provide regulatory identification codes for payroll compliance, tax deductions, and invoices.
                </p>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">CIN / Registration Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. U72200TZ2024PTC012345"
                        value={formData.registrationNumber}
                        onChange={(e) => updateField("registrationNumber", e.target.value)}
                        className="font-monospace"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaFileInvoice className="me-1 text-muted" /> PAN Number
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. AAACF1234K"
                        value={formData.pan}
                        onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
                        className="font-monospace text-uppercase"
                        isInvalid={!!validationErrors.pan}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.pan}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">TAN Number (Tax Deduction Account)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. CHEF12345A"
                        value={formData.tan}
                        onChange={(e) => updateField("tan", e.target.value.toUpperCase())}
                        className="font-monospace text-uppercase"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">GSTIN (Goods & Services Tax ID)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 33AAACF1234K1Z8"
                        value={formData.gstin}
                        onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
                        className="font-monospace text-uppercase"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaCalendarAlt className="me-1 text-muted" /> Date of Incorporation
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.incorporationDate}
                        onChange={(e) => updateField("incorporationDate", e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* STEP 3: HEADQUARTERS & LOCALIZATION */}
            {currentStep === 3 && (
              <div className="org-setup-step-content">
                <div className="org-setup-section-heading">
                  <FaMapMarkerAlt className="me-2 text-gold" /> Step 3: Headquarters & Localization
                </div>
                <p className="org-setup-section-lead">
                  Specify head office location, default operating currency, and financial year start date.
                </p>

                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="org-form-label">Headquarters Street Address</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 100 Tech Park, Avinashi Road"
                        value={formData.address}
                        onChange={(e) => updateField("address", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">City</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Coimbatore"
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">State / Province</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Tamil Nadu"
                        value={formData.state}
                        onChange={(e) => updateField("state", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">Country</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. India"
                        value={formData.country}
                        onChange={(e) => updateField("country", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="org-form-label">Postal / Zip Code</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 641014"
                        value={formData.pincode}
                        onChange={(e) => updateField("pincode", e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaMoneyBillWave className="me-1 text-gold" /> Currency
                      </Form.Label>
                      <Form.Select
                        value={formData.currency}
                        onChange={(e) => updateField("currency", e.target.value)}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaClock className="me-1 text-gold" /> Time Zone
                      </Form.Label>
                      <Form.Select
                        value={formData.timeZone}
                        onChange={(e) => updateField("timeZone", e.target.value)}
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="org-form-label">
                        <FaCalendarAlt className="me-1 text-gold" /> Financial Year Start
                      </Form.Label>
                      <Form.Select
                        value={formData.financialYearStart}
                        onChange={(e) => updateField("financialYearStart", e.target.value)}
                      >
                        <option value="04-01">April 1st (Standard IN / UK)</option>
                        <option value="01-01">January 1st (Calendar Year / US)</option>
                        <option value="07-01">July 1st (AU / NZ)</option>
                        <option value="10-01">October 1st</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {/* Navigation Buttons Footer */}
            <div className="org-setup-actions-footer">
              <Button
                variant="outline-secondary"
                className="org-setup-btn-back"
                onClick={handlePrev}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" /> {currentStep === 1 ? "Back" : "Previous Step"}
              </Button>

              <div className="ms-auto d-flex gap-2">
                {currentStep < 3 ? (
                  <Button
                    className="org-setup-btn-next"
                    onClick={handleNext}
                  >
                    Continue <FaArrowRight className="ms-2" />
                  </Button>
                ) : (
                  <Button
                    className="org-setup-btn-launch"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" /> Initializing Enterprise...
                      </>
                    ) : (
                      <>
                        <FaRocket className="me-2" /> Launch & Activate Organization
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
