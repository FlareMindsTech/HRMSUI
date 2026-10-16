import React, { useState, useRef, useEffect } from "react";
import { Row, Col, Form, Button, InputGroup, Card, Spinner } from "react-bootstrap";
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
  FaQuestionCircle,
  FaTimes,
} from "react-icons/fa";
import {
  createOrganization,
  fetchSystemSetupStatus,
  registerSystemOwner,
  resolveMediaUrl,
  compressImageFile,
} from "../../services/organizationService";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthUser, fetchAuth } from "../../redux/slices/authSlice";
import { invalidateOrgResource } from "../../redux/slices/organizationSlice";
import FeedbackAlert from "../Common/FeedbackAlert";
import { useBranch } from "../../context/BranchContext";
import { API_BASE_URL, setAuthToken } from "../../config/api";
import "../../Pages/Dashboard/HrOnboarding.css";
import "./OrgSetupHero.css";

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
  organizationType: "",
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
  const dispatch = useDispatch();
  const currentUser = useSelector(selectAuthUser);
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
        if (parsed.organizationType === "COMPANY") parsed.organizationType = "";
        return { ...INITIAL_FORM, ...parsed };
      }
    } catch (e) { }
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [previewActiveStep, setPreviewActiveStep] = useState(2);

  const effectiveUser = (() => {
    if (currentUser) return currentUser;
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  // Check setup status from backend on mount & prefill owner info from authenticated user
  useEffect(() => {
    if (effectiveUser) {
      setFormData((prev) => ({
        ...prev,
        ownerFirstName: prev.ownerFirstName || effectiveUser.firstName || effectiveUser.name?.split(" ")[0] || "",
        ownerLastName: prev.ownerLastName || effectiveUser.lastName || effectiveUser.name?.split(" ").slice(1).join(" ") || "",
        ownerEmail: prev.ownerEmail || effectiveUser.email || "",
        ownerPhone: prev.ownerPhone || effectiveUser.phoneNumber || effectiveUser.phone || effectiveUser.mobileNo || "",
      }));
    }

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
        if (parsed.organizationType === "COMPANY") {
          parsed.organizationType = "";
          modified = true;
        }
        if (modified) {
          sessionStorage.setItem("org_setup_form", JSON.stringify(parsed));
          setFormData((prev) => ({
            ...prev,
            organizationName: parsed.organizationName || "",
            organizationCode: parsed.organizationCode || "",
            industry: parsed.industry || "",
            organizationType: parsed.organizationType || "",
          }));
        }
      }
    } catch (e) { }

    fetchSystemSetupStatus()
      .then((status) => {
        if (status?.organization) {
          setExistingOrg(status.organization);
        }
      })
      .catch((e) => console.warn("Notice checking system setup status:", e.message));
  }, [currentUser]);

  // Prevent scrollbars when on the welcome hero screen
  useEffect(() => {
    if (stage === "welcome") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [stage]);

  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        if (field !== "logo") {
          const { logo, ...serializable } = updated;
          sessionStorage.setItem("org_setup_form", JSON.stringify(serializable));
        }
      } catch (e) { }
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

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setLogoError("Logo image size must be less than 5MB");
        return;
      }
      setLogoError("");
      try {
        const compressed = await compressImageFile(file);
        updateField("logo", compressed);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateField("logo", reader.result);
        };
        reader.readAsDataURL(file);
      }
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
      if (!formData.legalName?.trim()) {
        errs.legalName = "Legal Registered Name is required.";
      }
      if (!formData.displayName?.trim()) {
        errs.displayName = "Brand / Display Title is required.";
      }
      if (!formData.organizationType?.trim()) {
        errs.organizationType = "Organization Type is required.";
      }
      if (!formData.industry?.trim()) {
        errs.industry = "Industry Sector is required.";
      }
      if (!formData.email?.trim()) {
        errs.email = "Corporate Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = "Please enter a valid corporate email.";
      }
      if (!formData.phone?.trim()) {
        errs.phone = "Contact Phone Number is required.";
      }
    }
    if (step === 2) {
      if (!formData.registrationNumber?.trim()) {
        errs.registrationNumber = "CIN / Registration Number is required.";
      }
      if (!formData.pan?.trim()) {
        errs.pan = "PAN Number is required.";
      } else if (formData.pan.trim().length > 20) {
        errs.pan = "PAN Number is too long.";
      }
      if (!formData.tan?.trim()) {
        errs.tan = "TAN Number is required.";
      }
      if (!formData.gstin?.trim()) {
        errs.gstin = "GSTIN is required.";
      }
      if (!formData.incorporationDate) {
        errs.incorporationDate = "Date of Incorporation is required.";
      }
      if (!formData.pfNumber?.trim()) {
        errs.pfNumber = "PF / EPFO Code is required.";
      }
      if (!formData.esiNumber?.trim()) {
        errs.esiNumber = "ESIC Code is required.";
      }
    }
    if (step === 3) {
      if (!formData.address?.trim()) {
        errs.address = "Headquarters Street Address is required.";
      }
      if (!formData.city?.trim()) {
        errs.city = "City / Metropolis is required.";
      }
      if (!formData.state?.trim()) {
        errs.state = "State / Province is required.";
      }
      if (!formData.country?.trim()) {
        errs.country = "Country is required.";
      }
      if (!formData.pincode?.trim()) {
        errs.pincode = "Postal / ZIP Code is required.";
      }
      if (!formData.currency?.trim()) {
        errs.currency = "Currency is required.";
      }
      if (!formData.timeZone?.trim()) {
        errs.timeZone = "Time Zone is required.";
      }
      if (!formData.financialYearStart?.trim()) {
        errs.financialYearStart = "Financial Year Start is required.";
      }
    }
    if (step === 4) {
      if (!formData.ownerFirstName?.trim()) {
        errs.ownerFirstName = "Owner First Name is required.";
      }
      if (!formData.ownerLastName?.trim()) {
        errs.ownerLastName = "Owner Last Name is required.";
      }
      if (!formData.ownerEmail?.trim()) {
        errs.ownerEmail = "Owner Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
        errs.ownerEmail = "Please enter a valid email address.";
      }
      if (!formData.ownerPhone?.trim()) {
        errs.ownerPhone = "Owner Phone Number is required.";
      }
      if (!effectiveUser) {
        if (!formData.ownerPassword || formData.ownerPassword.length < 6 || formData.ownerPassword.length > 64) {
          errs.ownerPassword = "Password must be between 6 and 64 characters.";
        }
        if (!formData.ownerConfirmPassword) {
          errs.ownerConfirmPassword = "Confirm Password is required.";
        } else if (formData.ownerPassword !== formData.ownerConfirmPassword) {
          errs.ownerConfirmPassword = "Passwords do not match.";
        }
      } else {
        if (formData.ownerPassword && (formData.ownerPassword.length < 6 || formData.ownerPassword.length > 64)) {
          errs.ownerPassword = "Password must be between 6 and 64 characters.";
        }
        if (formData.ownerPassword && formData.ownerPassword !== formData.ownerConfirmPassword) {
          errs.ownerConfirmPassword = "Passwords do not match.";
        }
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

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    setStepPersisted(Math.min(currentStep + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (loading) return;

    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const combinedPayload = {
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

        // Owner account details
        firstName: formData.ownerFirstName?.trim() || (currentUser?.name ? currentUser.name.split(" ")[0] : ""),
        lastName: formData.ownerLastName?.trim() || (currentUser?.name ? currentUser.name.split(" ").slice(1).join(" ") : ""),
        name: `${formData.ownerFirstName?.trim() || ""} ${formData.ownerLastName?.trim() || ""}`.trim() || currentUser?.name || "",
        ownerFirstName: formData.ownerFirstName?.trim() || "",
        ownerLastName: formData.ownerLastName?.trim() || "",
        ownerEmail: formData.ownerEmail?.trim()?.toLowerCase() || currentUser?.email?.toLowerCase() || "",
        ownerPhone: formData.ownerPhone?.trim() || currentUser?.phoneNumber || currentUser?.phone || "",
        mobileNo: formData.ownerPhone?.trim() || currentUser?.phoneNumber || currentUser?.phone || "",
        phoneNumber: formData.ownerPhone?.trim() || currentUser?.phoneNumber || currentUser?.phone || "",
        ownerPassword: formData.ownerPassword?.trim() || undefined,
        password: formData.ownerPassword?.trim() || undefined,
      };

      let result = null;
      let orgResult = existingOrg;
      let orgId = existingOrg?._id || existingOrg?.id;

      if (!orgId) {
        result = await createOrganization(combinedPayload);
        orgResult = result?.organization || result?.data?.organization || result?.data || result;
        orgId = orgResult?._id || orgResult?.id;

        setExistingOrg(orgResult);
        dispatch(invalidateOrgResource("profile"));
      }

      if (!orgId) {
        orgId = localStorage.getItem("organizationId") || localStorage.getItem("tenantId");
      }

      if (orgId) {
        localStorage.setItem("organizationId", orgId);
        localStorage.setItem("tenantId", orgId);
      }

      const newToken = result?.token || result?.data?.token;
      if (newToken) {
        setAuthToken(newToken);
      }

      // If user was not authenticated and a password was supplied, ensure root owner registered / logged in
      if (!currentUser && formData.ownerPassword && !newToken) {
        const ownerPayload = {
          organizationId: orgId,
          firstName: formData.ownerFirstName.trim(),
          lastName: formData.ownerLastName.trim() || undefined,
          email: formData.ownerEmail.trim().toLowerCase(),
          mobileNo: formData.ownerPhone.trim(),
          password: formData.ownerPassword,
        };

        const regResult = await registerSystemOwner(ownerPayload).catch(() => null);
        let token = regResult?.token || regResult?.data?.token;

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
            }
          } catch (authErr) {
            console.warn("Auto-login fallback error:", authErr);
          }
        }

        if (token) {
          setAuthToken(token);
        }
      }

      // Re-fetch authoritative auth context
      await dispatch(fetchAuth({ force: true }));

      // Clear setup wizard temporary session state
      try {
        sessionStorage.removeItem("org_setup_stage");
        sessionStorage.removeItem("org_setup_step");
        sessionStorage.removeItem("org_setup_form");
      } catch (e) { }

      if (refreshOrganization) await refreshOrganization();
      if (refreshBranches) await refreshBranches();

      setSuccessMessage("Organization setup completed successfully! Opening dashboard...");

      setTimeout(() => {
        if (onOrgCreated) {
          onOrgCreated(orgResult);
        }
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      console.error("Error launching organization setup:", err);
      setError(err.message || "Failed to initialize organization.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STAGE 1: PROFESSIONAL LUXURY WELCOME SCREEN (EXACT REPLICA DESIGN)
  // =========================================================================
  if (stage === "welcome") {
    return (
      <div className="org-setup-hero-page">
        {/* Top Header */}
        <header className="org-setup-hero-header">
          <div className="org-setup-hero-brand">
            <div className="org-setup-brand-icon">
              <FaBuilding />
            </div>
            <div className="org-setup-brand-info">
              <h2 className="org-setup-brand-title">TeamHub HRMS</h2>
              <span className="org-setup-brand-subtitle">Enterprise Platform</span>
              <div className="org-setup-brand-accent-bar" />
            </div>
          </div>

          <button
            type="button"
            className="org-setup-hero-help-btn"
            onClick={() => setShowHelpModal(true)}
          >
            <FaQuestionCircle size={14} className="text-muted" />
            <span>Need Help?</span>
          </button>
        </header>

        {/* Main Body Layout */}
        <main className="org-setup-hero-body">
          {/* Left Column: People. Process. Progress. & Frosted Glass Quote Card */}
          <aside className="org-setup-hero-left">
            <div className="org-setup-left-top-block">
              <span className="org-setup-left-tag">ENTERPRISE HRMS</span>
              <h1 className="org-setup-left-hero-title">
                <span>People.</span>
                <span>Process.</span>
                <span className="org-setup-gold-gradient-text">Progress.</span>
              </h1>
              <p className="org-setup-left-hero-desc">
                Set up your organization in a few simple steps and get started with TeamHub HRMS.
              </p>
            </div>

            {/* Bottom Floating Frosted Glass Card */}
            <div className="org-setup-quote-card">
              <div className="org-setup-quote-icon">“</div>
              <div className="org-setup-quote-title">
                Build a better<br />
                workplace today
              </div>
              <div className="org-setup-quote-avatars-row">
                <div className="org-setup-avatar-stack">
                  <span className="org-avatar-circle av-1" />
                  <span className="org-avatar-circle av-2" />
                  <span className="org-avatar-circle av-3" />
                  <span className="org-avatar-circle av-4" />
                </div>
                <div className="org-setup-avatar-caption">
                  Trusted by growing<br />
                  teams and enterprises
                </div>
              </div>
              <div className="org-setup-quote-dash" />
            </div>
          </aside>

          {/* Right/Center Floating Main Card */}
          <div className="org-setup-main-card">
            {/* Pill Badge */}
            <div className="org-setup-enterprise-pill-wrap">
              <div className="org-setup-enterprise-pill">
                <FaBuilding size={11} className="org-setup-pill-icon" />
                <span>Enterprise Setup</span>
              </div>
            </div>

            {/* Heading */}
            <div className="org-setup-card-header-centered">
              <h2 className="org-setup-card-title">
                <span className="d-block org-setup-title-dark">Setup Your</span>
                <span className="d-block org-setup-title-gold">Enterprise Organization</span>
              </h2>
              <div className="org-setup-title-accent-dash" />
            </div>

            {/* Description Subtitle */}
            <p className="org-setup-card-desc">
              Complete a quick 4–step setup to configure your organization and register your primary root account.
            </p>

            {/* Horizontal Progress Stepper Bar (Static Overview) */}
            <div className="org-setup-horizontal-stepper">
              <div className="org-setup-hstep-node">
                <div className="org-setup-hstep-badge">1</div>
                <div className="org-setup-hstep-label">Organization<br />Profile</div>
              </div>

              <div className="org-setup-hstep-connector" />

              <div className="org-setup-hstep-node">
                <div className="org-setup-hstep-badge">2</div>
                <div className="org-setup-hstep-label">Statutory &amp; Tax</div>
              </div>

              <div className="org-setup-hstep-connector" />

              <div className="org-setup-hstep-node">
                <div className="org-setup-hstep-badge">3</div>
                <div className="org-setup-hstep-label">Headquarters &amp;<br />Location</div>
              </div>

              <div className="org-setup-hstep-connector" />

              <div className="org-setup-hstep-node">
                <div className="org-setup-hstep-badge">4</div>
                <div className="org-setup-hstep-label">Primary Owner</div>
              </div>
            </div>

            {/* 4 Step Preview Cards Horizontal Row (Static Display) */}
            <div className="org-setup-cards-grid">
              {/* Step 1: Organization Profile */}
              <div className="org-setup-step-box">
                <div className="org-setup-step-box-top">
                  <span className="org-setup-step-badge-num">01</span>
                  <div className="org-setup-step-badge-icon">
                    <FaBuilding />
                  </div>
                </div>
                <div className="org-setup-step-title">
                  Organization Profile
                </div>
                <div className="org-setup-step-dash" />
              </div>

              {/* Step 2: Statutory & Tax */}
              <div className="org-setup-step-box">
                <div className="org-setup-step-box-top">
                  <span className="org-setup-step-badge-num">02</span>
                  <div className="org-setup-step-badge-icon">
                    <FaShieldAlt />
                  </div>
                </div>
                <div className="org-setup-step-title">
                  Statutory &amp; Tax
                </div>
                <div className="org-setup-step-dash" />
              </div>

              {/* Step 3: Headquarters & Location */}
              <div className="org-setup-step-box">
                <div className="org-setup-step-box-top">
                  <span className="org-setup-step-badge-num">03</span>
                  <div className="org-setup-step-badge-icon">
                    <FaMapMarkerAlt />
                  </div>
                </div>
                <div className="org-setup-step-title">
                  Headquarters &amp; Location
                </div>
                <div className="org-setup-step-dash" />
              </div>

              {/* Step 4: Primary Owner */}
              <div className="org-setup-step-box">
                <div className="org-setup-step-box-top">
                  <span className="org-setup-step-badge-num">04</span>
                  <div className="org-setup-step-badge-icon">
                    <FaCrown />
                  </div>
                </div>
                <div className="org-setup-step-title">
                  Primary Owner
                </div>
                <div className="org-setup-step-dash" />
              </div>
            </div>

            {/* Bottom Action Area: Horizontal Divider Lines + Glowing Button */}
            <div className="org-setup-cta-wrap">
              <div className="org-setup-cta-row">
                <div className="org-setup-cta-line" />
                <button
                  type="button"
                  className="org-setup-start-btn"
                  onClick={() => {
                    setStepPersisted(1);
                    setStagePersisted("form");
                  }}
                >
                  <span>Start Setup Wizard</span>
                  <FaArrowRight size={14} />
                </button>
                <div className="org-setup-cta-line" />
              </div>

              <div className="org-setup-footer-security">
                <FaLock className="text-warning" size={11} />
                <span>TeamHub HRMS – Single-Tenant Secure Architecture</span>
              </div>
            </div>
          </div>
        </main>

        {/* Need Help Modal */}
        {showHelpModal && (
          <div className="org-setup-help-overlay" onClick={() => setShowHelpModal(false)}>
            <div className="org-setup-help-modal" onClick={(e) => e.stopPropagation()}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="org-setup-brand-icon" style={{ width: 34, height: 34, fontSize: 16 }}>
                    <FaBuilding />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: 16 }}>TeamHub HRMS Support</h5>
                    <span className="text-muted extra-small">Enterprise Onboarding Desk</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-light border-0 rounded-circle p-1"
                  onClick={() => setShowHelpModal(false)}
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                Setting up your enterprise organization takes less than 5 minutes. You will configure:
              </p>
              <ul className="text-muted small ps-3 mb-3" style={{ lineHeight: 1.6 }}>
                <li>Corporate identity, tenant code &amp; legal title</li>
                <li>Statutory registrations (PAN, GSTIN, EPFO, ESIC)</li>
                <li>Headquarters address, operating currency &amp; timezone</li>
                <li>Root administrator credentials for initial sign-in</li>
              </ul>

              <div className="p-3 rounded bg-light border mb-3">
                <div className="fw-bold text-dark small mb-1">Direct Implementation Desk</div>
                <div className="text-muted extra-small">
                  Need assistance from our solution architects? Contact us at <strong>flaremindstech@gmail.com</strong>.
                </div>
              </div>

              <button
                type="button"
                className="btn btn-dark w-100 rounded-pill py-2 fw-bold"
                onClick={() => setShowHelpModal(false)}
              >
                Got It, Continue Setup
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // STAGE 2: 4-STEP WIZARD FORM (SHOWS AFTER CLICKING "NEXT")
  // =========================================================================
  return (
    <div className="org-setup-form-page">
      <div className="org-form-centered-container">
        {/* ── 1. Sleek Horizontal 4-Step Stepper with Back Button ── */}
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
              <FeedbackAlert variant="danger" dismissible onClose={() => setError("")} className="mb-4" message={error} />
            )}

            {/* Success Alert */}
            {successMessage && (
              <FeedbackAlert variant="success" className="mb-4" message={successMessage} />
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
                 
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>LEGAL REGISTERED NAME <span className="text-danger">*</span></span>
                    {validationErrors.legalName && (
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
                      placeholder="Enter full legal registered name"
                      value={formData.legalName}
                      isInvalid={!!validationErrors.legalName}
                      onChange={(e) => updateField("legalName", e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>BRAND / DISPLAY TITLE <span className="text-danger">*</span></span>
                    {validationErrors.displayName && (
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
                      placeholder="Enter brand or display name"
                      value={formData.displayName}
                      isInvalid={!!validationErrors.displayName}
                      onChange={(e) => updateField("displayName", e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>ORGANIZATION TYPE <span className="text-danger">*</span></span>
                    {validationErrors.organizationType && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaSitemap size={14} />
                    </InputGroup.Text>
                    <Form.Select
                      required
                      value={formData.organizationType || ""}
                      onChange={(e) => updateField("organizationType", e.target.value)}
                      isInvalid={!!validationErrors.organizationType}
                      className="onboarding-dash-select ps-2"
                      style={!formData.organizationType ? { color: "#6c757d" } : { color: "#1C1D1D" }}
                    >
                      <option value="" disabled style={{ color: "#6c757d" }}>
                        Select Organization Type
                      </option>
                      {ORG_TYPES.map((type) => (
                        <option key={type.value} value={type.value} style={{ color: "#1C1D1D" }}>
                          {type.label}
                        </option>
                      ))}
                    </Form.Select>
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>INDUSTRY SECTOR <span className="text-danger">*</span></span>
                    {validationErrors.industry && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaRocket size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="ps-2"
                      placeholder="Enter industry sector"
                      value={formData.industry}
                      isInvalid={!!validationErrors.industry}
                      onChange={(e) => updateField("industry", e.target.value)}
                    />
                  </InputGroup>
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>CORPORATE EMAIL <span className="text-danger">*</span></span>
                    {validationErrors.email && (
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
                      placeholder="contact@company.com"
                      value={formData.email}
                      isInvalid={!!validationErrors.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>CONTACT PHONE <span className="text-danger">*</span></span>
                    {validationErrors.phone && (
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
                      placeholder="Enter phone number"
                      value={formData.phone}
                      isInvalid={!!validationErrors.phone}
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
                    <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between org-setup-logo-preview">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          key={resolveMediaUrl(formData.logo)}
                          src={resolveMediaUrl(formData.logo)}
                          alt="Logo"
                          style={{ height: 48, width: 48, objectFit: "contain", borderRadius: 8 }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
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
                      className="p-4 border rounded-3 bg-light text-center org-setup-logo-dropzone"
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>CIN / REGISTRATION NUMBER <span className="text-danger">*</span></span>
                    {validationErrors.registrationNumber && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaBarcode size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="font-monospace ps-2"
                      placeholder="Enter CIN or registration number"
                      value={formData.registrationNumber}
                      isInvalid={!!validationErrors.registrationNumber}
                      onChange={(e) => updateField("registrationNumber", e.target.value)}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted extra-small">Corporate Identification Number from Ministry of Corporate Affairs.</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>PAN NUMBER (PERMANENT ACCOUNT NO) <span className="text-danger">*</span></span>
                    {validationErrors.pan && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaFileInvoice size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>TAN NUMBER (TAX DEDUCTION ACCOUNT) <span className="text-danger">*</span></span>
                    {validationErrors.tan && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaFileInvoice size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="font-monospace text-uppercase ps-2"
                      placeholder="Enter 10-digit TAN"
                      value={formData.tan}
                      isInvalid={!!validationErrors.tan}
                      onChange={(e) => updateField("tan", e.target.value.toUpperCase())}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted extra-small">Required for statutory TDS filings and tax reports.</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>GSTIN (GOODS & SERVICES TAX ID) <span className="text-danger">*</span></span>
                    {validationErrors.gstin && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaFileInvoice size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="font-monospace text-uppercase ps-2"
                      placeholder="Enter 15-digit GSTIN"
                      value={formData.gstin}
                      isInvalid={!!validationErrors.gstin}
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>DATE OF INCORPORATION <span className="text-danger">*</span></span>
                    {validationErrors.incorporationDate && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaCalendarAlt size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      type="date"
                      className="ps-2"
                      value={formData.incorporationDate}
                      isInvalid={!!validationErrors.incorporationDate}
                      onChange={(e) => updateField("incorporationDate", e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>PF / EPFO ESTABLISHMENT CODE <span className="text-danger">*</span></span>
                    {validationErrors.pfNumber && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaShieldAlt size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="font-monospace text-uppercase ps-2"
                      placeholder="Enter PF code"
                      value={formData.pfNumber}
                      isInvalid={!!validationErrors.pfNumber}
                      onChange={(e) => updateField("pfNumber", e.target.value.toUpperCase())}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>ESIC CODE <span className="text-danger">*</span></span>
                    {validationErrors.esiNumber && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaShieldAlt size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="font-monospace text-uppercase ps-2"
                      placeholder="Enter ESIC code"
                      value={formData.esiNumber}
                      isInvalid={!!validationErrors.esiNumber}
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>HEADQUARTERS STREET ADDRESS <span className="text-danger">*</span></span>
                    {validationErrors.address && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaHome size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="ps-2"
                      placeholder="Enter street address, building / suite"
                      value={formData.address}
                      isInvalid={!!validationErrors.address}
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
                  <Form.Text className="text-muted extra-small">City municipality where headquarters operates.</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>STATE / PROVINCE <span className="text-danger">*</span></span>
                    {validationErrors.state && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaMapMarkerAlt size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="ps-2"
                      placeholder="Enter state or province"
                      value={formData.state}
                      isInvalid={!!validationErrors.state}
                      onChange={(e) => updateField("state", e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>COUNTRY <span className="text-danger">*</span></span>
                    {validationErrors.country && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaGlobe size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="ps-2"
                      placeholder="Enter country"
                      value={formData.country}
                      isInvalid={!!validationErrors.country}
                      onChange={(e) => updateField("country", e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>POSTAL / ZIP CODE <span className="text-danger">*</span></span>
                    {validationErrors.pincode && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaMailBulk size={14} />
                    </InputGroup.Text>
                    <Form.Control
                      required
                      className="font-monospace ps-2"
                      placeholder="Enter postal / ZIP code"
                      value={formData.pincode}
                      isInvalid={!!validationErrors.pincode}
                      onChange={(e) => updateField("pincode", e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-4 mb-2">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>CURRENCY <span className="text-danger">*</span></span>
                    {validationErrors.currency && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaMoneyBillWave size={14} />
                    </InputGroup.Text>
                    <Form.Select
                      required
                      value={formData.currency}
                      isInvalid={!!validationErrors.currency}
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>TIME ZONE <span className="text-danger">*</span></span>
                    {validationErrors.timeZone && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaClock size={14} />
                    </InputGroup.Text>
                    <Form.Select
                      required
                      value={formData.timeZone}
                      isInvalid={!!validationErrors.timeZone}
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>FINANCIAL YEAR START <span className="text-danger">*</span></span>
                    {validationErrors.financialYearStart && (
                      <span className="text-danger extra-small fw-semibold">Required</span>
                    )}
                  </Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text className="bg-light text-muted px-3 border-end-0">
                      <FaCalendarAlt size={14} />
                    </InputGroup.Text>
                    <Form.Select
                      required
                      value={formData.financialYearStart}
                      isInvalid={!!validationErrors.financialYearStart}
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

        {/* ── STEP 4: OWNER ACCOUNT REGISTRATION / CONFIRMATION ── */}
        {currentStep === 4 && (
          <div>
            <div className="p-3 mb-4 rounded-3 bg-light border d-flex align-items-center gap-3">
              <div className="onboarding-section-icon-badge">
                <FaCrown size={16} />
              </div>
              <div>
                <div className="fw-bold text-dark small">
                  {currentUser ? (
                    <>
                      Authenticated Root Administrator: <span className="text-success fw-bold">{currentUser.name || currentUser.fullName || currentUser.email}</span>
                    </>
                  ) : existingOrg || formData.organizationName ? (
                    <>
                      Organization Established: <span className="text-success fw-bold">{existingOrg?.displayName || existingOrg?.organizationName || formData.organizationName}</span>
                    </>
                  ) : (
                    "Root Owner Account Details"
                  )}
                </div>
                <div className="text-muted extra-small">
                  {currentUser ? (
                    "Your authenticated account will be configured as root System Owner with full administrative authority across this organization and all branches."
                  ) : (
                    "This root account will be created as system Owner with full administrative authority across this organization and all branches."
                  )}
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
                  <Form.Label className="small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>OWNER LAST NAME <span className="text-danger">*</span></span>
                    {validationErrors.ownerLastName && (
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
                      placeholder="Enter last name"
                      value={formData.ownerLastName}
                      isInvalid={!!validationErrors.ownerLastName}
                      onChange={(e) => updateField("ownerLastName", e.target.value)}
                    />
                  </InputGroup>
                  {validationErrors.ownerLastName && (
                    <div className="text-danger small mt-1.5 fw-semibold d-flex align-items-center gap-1">
                      <FaExclamationTriangle size={11} /> {validationErrors.ownerLastName}
                    </div>
                  )}
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
                      minLength={6}
                      maxLength={64}
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
                    <Form.Text className="text-muted extra-small">Minimum 6 characters, maximum 64 characters.</Form.Text>
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
                      minLength={6}
                      maxLength={64}
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
              <FaChevronLeft size={10} className="me-1" /> Back
            </Button>
          </div>

          <div>
            {currentStep < 4 ? (
              <Button
                type="button"
                className="onboarding-nav-btn onboarding-next-btn"
                onClick={handleNext}
                disabled={loading}
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
                    <Spinner animation="border" size="sm" className="me-2" /> Initializing Organization...
                  </>
                ) : (
                  <>
                    <FaRocket className="me-2" /> {currentUser ? "Complete & Launch Organization" : "Complete Setup & Register Owner"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  </div>
);
}
