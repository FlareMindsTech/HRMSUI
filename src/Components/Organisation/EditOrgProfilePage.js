import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Row,
  Col,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import {
  FaBuilding,
  FaShieldAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaGlobe,
  FaMapMarkerAlt,
  FaCog,
  FaCalendarAlt,
  FaSave,
  FaArrowLeft,
  FaCheckCircle,
  FaTrash,
  FaCloudUploadAlt,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaMoneyBillWave,
  FaBriefcase,
  FaUserTie,
  FaFileContract,
} from "react-icons/fa";
import {
  fetchMyOrganization,
  updateMyOrganization,
  createOrganization,
  normalizeOrganization,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import "./EditOrgProfilePage.css";

const ORG_TYPES = [
  { value: "COMPANY", label: "Private Limited Company (Pvt Ltd)", icon: FaBuilding },
  { value: "PUBLIC_LIMITED", label: "Public Limited Company (Ltd)", icon: FaBuilding },
  { value: "LLP", label: "Limited Liability Partnership (LLP)", icon: FaBriefcase },
  { value: "PARTNERSHIP", label: "Partnership Firm", icon: FaBriefcase },
  { value: "PROPRIETORSHIP", label: "Sole Proprietorship", icon: FaBuilding },
  { value: "TRUST", label: "Trust / Society", icon: FaBuilding },
  { value: "NGO", label: "Non-Profit / NGO (Section 8)", icon: FaBuilding },
  { value: "STARTUP", label: "Startup / Incubated Entity", icon: FaBuilding },
  { value: "GOVERNMENT", label: "Government / PSU", icon: FaBuilding },
  { value: "OTHER", label: "Other Corporate Entity", icon: FaBuilding },
];

const ORG_STATUSES = [
  { value: "ACTIVE", label: "Active & Operational", color: "#16a34a" },
  { value: "SUSPENDED", label: "Suspended / Temporarily Inactive", color: "#d97706" },
  { value: "INACTIVE", label: "Inactive / Dormant", color: "#dc2626" },
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee" },
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "AED", symbol: "د.إ", label: "AED (د.إ) - UAE Dirham" },
  { code: "SGD", symbol: "S$", label: "SGD (S$) - Singapore Dollar" },
  { code: "CAD", symbol: "CA$", label: "CAD (CA$) - Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "AUD (A$) - Australian Dollar" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +05:30) — India Standard Time" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +04:00) — Gulf Standard Time" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +08:00) — Singapore Time" },
  { value: "UTC", label: "UTC (Coordinated Universal Time +00:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST +00:00/+01:00)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT -05:00/-04:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT -08:00/-07:00)" },
];

const FY_CYCLES = [
  { value: "04-01", label: "April 1st to March 31st (Standard Indian Fiscal Year)" },
  { value: "01-01", label: "January 1st to December 31st (Calendar Year Cycle)" },
  { value: "07-01", label: "July 1st to June 30th (Mid-Year Fiscal Cycle)" },
  { value: "10-01", label: "October 1st to September 30th (US Federal / Q4 Cycle)" },
];

const INDUSTRY_PRESETS = [
  "Information Technology",
  "Software & SaaS",
  "Financial Services & Fintech",
  "Healthcare & Pharma",
  "Manufacturing & Industrial",
  "E-Commerce & Retail",
  "Consulting & Professional Services",
  "Education & EdTech",
  "Logistics & Supply Chain",
];

const INITIAL_FORM = {
  organizationName: "",
  organizationCode: "",
  legalName: "",
  displayName: "",
  organizationType: "COMPANY",
  industry: "Information Technology",
  description: "",
  website: "",
  email: "",
  phone: "",
  altPhone: "",
  logo: "",
  registrationNumber: "",
  pan: "",
  tan: "",
  gstin: "",
  pfNumber: "",
  esiNumber: "",
  msmeNumber: "",
  lin: "",
  professionalTaxNumber: "",
  incorporationDate: "",
  address: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  contactPersonName: "",
  contactPersonDesignation: "",
  contactPersonEmail: "",
  contactPersonPhone: "",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  financialYearStart: "04-01",
  status: "ACTIVE",
};

const getStr = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim() !== "" ? val.trim() : fallback;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return fallback;
};

export default function EditOrgProfilePage({ orgData: initialOrgData, onBack, onOrgUpdated }) {
  const { isSystemAdmin, user, hasPermission } = useAuth();
  const { organization, refreshOrganization, refreshBranches } = useBranch();

  const [activeTab, setActiveTab] = useState("entity");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  const canEdit = isSystemAdmin || hasPermission("organization.update") || user?.roleCode === "OWNER";

  // Mode detection
  const isCreateMode = useMemo(() => {
    const raw = initialOrgData || organization;
    return !raw || (!raw._id && !raw.id && !raw.organizationName && !raw.name);
  }, [initialOrgData, organization]);

  // Populate form with normalized organization data
  const populateFormData = useCallback((rawOrg) => {
    if (!rawOrg) return;
    const norm = normalizeOrganization(rawOrg) || rawOrg;
    const addrObj = typeof norm.address === "object" && norm.address !== null ? norm.address : {};

    let incDate = norm.incorporationDate || "";
    if (incDate && incDate.includes("T")) {
      try {
        incDate = new Date(incDate).toISOString().split("T")[0];
      } catch (e) {
        incDate = getStr(norm.incorporationDate);
      }
    }

    setFormData({
      organizationName: getStr(norm.organizationName || norm.name || norm.displayName || norm.legalName),
      organizationCode: getStr(norm.organizationCode || norm.code),
      legalName: getStr(norm.legalName || norm.name),
      displayName: getStr(norm.displayName || norm.name),
      organizationType: getStr(norm.organizationType || "COMPANY"),
      industry: getStr(norm.industry || "Information Technology"),
      description: getStr(norm.description || norm.about),
      website: getStr(norm.website),
      email: getStr(norm.email),
      phone: getStr(norm.phone),
      altPhone: getStr(norm.altPhone),
      logo: getStr(typeof norm.logo === "object" && norm.logo !== null ? norm.logo.url || norm.logo.path : norm.logo),
      registrationNumber: getStr(norm.registrationNumber),
      pan: getStr(norm.pan),
      tan: getStr(norm.tan),
      gstin: getStr(norm.gstin),
      pfNumber: getStr(norm.pfNumber),
      esiNumber: getStr(norm.esiNumber),
      msmeNumber: getStr(norm.msmeNumber),
      lin: getStr(norm.lin),
      professionalTaxNumber: getStr(norm.professionalTaxNumber),
      incorporationDate: incDate,
      address: getStr(typeof norm.address === "string" ? norm.address : addrObj.street || addrObj.addressLine1 || ""),
      addressLine2: getStr(norm.addressLine2 || addrObj.addressLine2),
      landmark: getStr(norm.landmark || addrObj.landmark),
      city: getStr(norm.city || addrObj.city || ""),
      state: getStr(norm.state || addrObj.state || ""),
      country: getStr(typeof norm.country === "string" ? norm.country : addrObj.country || "India"),
      pincode: getStr(norm.pincode || addrObj.pincode || ""),
      contactPersonName: getStr(norm.contactPersonName),
      contactPersonDesignation: getStr(norm.contactPersonDesignation),
      contactPersonEmail: getStr(norm.contactPersonEmail),
      contactPersonPhone: getStr(norm.contactPersonPhone),
      currency: getStr(norm.currency || "INR"),
      timeZone: getStr(norm.timeZone || "Asia/Kolkata"),
      financialYearStart: getStr(norm.financialYearStart || "04-01"),
      status: getStr(norm.status || "ACTIVE"),
    });
  }, []);

  // Fetch initial profile if missing
  const loadFreshOrg = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const org = await fetchMyOrganization();
      if (org) {
        populateFormData(org);
      } else if (organization) {
        populateFormData(organization);
      }
    } catch (err) {
      console.warn("Could not load organization in edit page:", err);
      if (organization) populateFormData(organization);
    } finally {
      setLoading(false);
    }
  }, [organization, populateFormData]);

  const initialOrgId = initialOrgData?._id || initialOrgData?.id;
  useEffect(() => {
    if (initialOrgData) {
      populateFormData(initialOrgData);
    } else {
      loadFreshOrg();
    }
  }, [initialOrgId, loadFreshOrg, populateFormData]);

  // Handle Logo file selection
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setError("Logo file size must be less than 2.5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result }));
        setLogoPreviewError(false);
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.organizationName.trim()) {
      setError("Organization Name is mandatory.");
      setActiveTab("entity");
      return;
    }
    if (!formData.organizationCode.trim()) {
      setError("Organization Code is mandatory.");
      setActiveTab("entity");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        organizationName: formData.organizationName.trim(),
        organizationCode: formData.organizationCode.trim().toUpperCase().replace(/\s+/g, ""),
        legalName: formData.legalName.trim() || formData.organizationName.trim(),
        displayName: formData.displayName.trim() || formData.organizationName.trim(),
        organizationType: formData.organizationType,
        industry: formData.industry.trim(),
        description: formData.description.trim(),
        website: formData.website.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        altPhone: formData.altPhone.trim(),
        logo: formData.logo,
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        pan: formData.pan.trim().toUpperCase(),
        tan: formData.tan.trim().toUpperCase(),
        gstin: formData.gstin.trim().toUpperCase(),
        pfNumber: formData.pfNumber.trim().toUpperCase(),
        esiNumber: formData.esiNumber.trim().toUpperCase(),
        msmeNumber: formData.msmeNumber.trim().toUpperCase(),
        lin: formData.lin.trim().toUpperCase(),
        professionalTaxNumber: formData.professionalTaxNumber.trim().toUpperCase(),
        incorporationDate: formData.incorporationDate ? new Date(formData.incorporationDate) : null,
        address: formData.address.trim(),
        addressLine2: formData.addressLine2.trim(),
        landmark: formData.landmark.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || "India",
        pincode: formData.pincode.trim(),
        contactPersonName: formData.contactPersonName.trim(),
        contactPersonDesignation: formData.contactPersonDesignation.trim(),
        contactPersonEmail: formData.contactPersonEmail.trim().toLowerCase(),
        contactPersonPhone: formData.contactPersonPhone.trim(),
        currency: formData.currency.trim().toUpperCase() || "INR",
        timeZone: formData.timeZone.trim() || "Asia/Kolkata",
        financialYearStart: formData.financialYearStart.trim() || "04-01",
        status: formData.status || "ACTIVE",
      };

      if (isCreateMode) {
        await createOrganization(payload);
        setSuccess("Enterprise Organization profile created successfully!");
      } else {
        await updateMyOrganization(payload);
        setSuccess("Organization details saved & synchronized successfully!");
      }

      refreshOrganization();
      refreshBranches();
      if (onOrgUpdated) onOrgUpdated();

      setTimeout(() => {
        if (onBack) onBack();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to save organization profile. Please verify your inputs.");
    } finally {
      setSaving(false);
    }
  };

  const navTabs = [
    { key: "entity", label: "1. Entity & Corporate", icon: FaBuilding, badge: "Core", subtitle: "Name, Code, Type & Logo" },
    { key: "tax", label: "2. Tax & Statutory", icon: FaShieldAlt, badge: "Tax", subtitle: "CIN, PAN, GSTIN, PF & ESI" },
    { key: "contact", label: "3. Contact & Signatory", icon: FaGlobe, badge: "Comms", subtitle: "Email, Phone & Contact Person" },
    { key: "address", label: "4. Headquarters Location", icon: FaMapMarkerAlt, badge: "HQ", subtitle: "Physical Address & Postal Code" },
    { key: "localization", label: "5. Localization & FY", icon: FaCog, badge: "Defaults", subtitle: "Currency, Timezone & FY Cycle" },
  ];

  return (
    <div className="edit-org-page">
      {/* ── Top Action Header Bar ── */}
      <div className="edit-org-header-bar">
        <div className="edit-org-header-left">
          <Button variant="light" className="edit-org-back-btn" onClick={onBack}>
            <FaArrowLeft /> Back to Overview
          </Button>
          <div className="edit-org-title-group">
            <h2>
              <FaBuilding className="text-success" />
              {isCreateMode ? "Create Enterprise Organization" : "Edit Organization Profile"}
            </h2>
            <p>Configure corporate identity, statutory filings, contact credentials and localization defaults</p>
          </div>
        </div>

        <div className="edit-org-header-right">
          <Button
            variant="light"
            className="edit-org-btn-discard"
            onClick={onBack}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="org-profile-form"
            className="edit-org-btn-save"
            disabled={saving || !canEdit}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-4 shadow-sm border-0">
          <FaInfoCircle className="me-2" /> {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")} className="mb-4 shadow-sm border-0">
          <FaCheckCircle className="me-2" /> {success}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5 bg-white rounded-4 border p-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 fw-semibold text-muted">Loading Organization Profile...</p>
        </div>
      ) : (
        <Form id="org-profile-form" onSubmit={handleSubmit}>
          <div className="edit-org-body-grid">
            {/* ── LEFT NAVIGATION RAIL ── */}
            <div className="edit-org-nav-card">
              <div className="edit-org-nav-title">Configuration Sections</div>
              <div className="edit-org-nav-list">
                {navTabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.key;
                  return (
                    <button
                      type="button"
                      key={t.key}
                      className={`edit-org-nav-item ${isActive ? "active" : ""}`}
                      onClick={() => setActiveTab(t.key)}
                    >
                      <div className="edit-org-nav-icon">
                        <Icon />
                      </div>
                      <div className="edit-org-nav-text">
                        <span className="edit-org-nav-heading">{t.label}</span>
                        <span className="edit-org-nav-subline">{t.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── LIVE PREVIEW MINI CARD ── */}
              <div className="edit-org-preview-card">
                <div className="edit-org-preview-header">
                  <span>Live Preview</span>
                  <span className="edit-org-preview-badge">{formData.status || "ACTIVE"}</span>
                </div>
                <div className="edit-org-preview-logo-name">
                  {formData.logo && !logoPreviewError ? (
                    <img
                      src={formData.logo}
                      alt="Logo"
                      className="edit-org-preview-logo"
                      onError={() => setLogoPreviewError(true)}
                    />
                  ) : (
                    <div className="edit-org-preview-avatar">
                      {(formData.organizationName || "O").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="edit-org-preview-name text-truncate" style={{ maxWidth: "160px" }}>
                      {formData.displayName || formData.organizationName || "Your Organization"}
                    </div>
                    <div className="edit-org-preview-code">
                      {formData.organizationCode || "ORG_CODE"}
                    </div>
                  </div>
                </div>
                <div className="edit-org-preview-meta">
                  <div><strong>Type:</strong> {formData.organizationType || "COMPANY"}</div>
                  <div><strong>Sector:</strong> {formData.industry || "Information Technology"}</div>
                  <div><strong>Currency:</strong> {formData.currency} ({formData.timeZone})</div>
                  {formData.city && <div><strong>Location:</strong> {[formData.city, formData.country].filter(Boolean).join(", ")}</div>}
                </div>
              </div>
            </div>

            {/* ── RIGHT MAIN FORM CONTENT ── */}
            <div className="edit-org-content-area">
              {/* ──────────────────────────────────────────────────────────── */}
              {/* SECTION 1: ENTITY & CORPORATE IDENTITY */}
              {/* ──────────────────────────────────────────────────────────── */}
              {activeTab === "entity" && (
                <div className="edit-org-content-card">
                  <div className="edit-org-section-header">
                    <div className="edit-org-section-title-wrap">
                      <div className="edit-org-section-icon-badge gold">
                        <FaBuilding />
                      </div>
                      <div>
                        <h3 className="edit-org-section-title">Core Corporate Identity</h3>
                        <p className="edit-org-section-subtitle">Define brand naming, enterprise identifier codes, corporate type & logo</p>
                      </div>
                    </div>
                    <Badge bg="light" text="dark" className="border px-3 py-2 fw-semibold">
                      Section 1 of 5
                    </Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          Organization Name <span className="edit-org-label-req">*</span>
                        </Form.Label>
                        <Form.Control
                          required
                          className="edit-org-input"
                          maxLength={120}
                          placeholder="e.g. FlareMinds Technology And Services"
                          value={formData.organizationName}
                          onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        />
                        <span className="edit-org-helper-text">Official primary title used across all system views</span>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          Organization Code <span className="edit-org-label-req">*</span>
                        </Form.Label>
                        <Form.Control
                          required
                          className="edit-org-input font-monospace text-uppercase"
                          maxLength={30}
                          placeholder="e.g. FLMT"
                          value={formData.organizationCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              organizationCode: e.target.value.toUpperCase().replace(/\s+/g, ""),
                            })
                          }
                        />
                        <span className="edit-org-helper-text">Unique uppercase identifier code (used in employee IDs & branches)</span>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Legal / Registered Entity Name</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          maxLength={150}
                          placeholder="e.g. FlareMinds Technology and Services Pvt Ltd"
                          value={formData.legalName}
                          onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                        />
                        <span className="edit-org-helper-text">Full legal registered entity name for tax invoices & statutory payroll</span>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Display / Brand Name</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          maxLength={100}
                          placeholder="e.g. FlareMinds Tech"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        />
                        <span className="edit-org-helper-text">Short public brand name shown in header greetings & portal navigation</span>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Organization Structure Type</Form.Label>
                        <Form.Select
                          className="edit-org-select"
                          value={formData.organizationType}
                          onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                        >
                          {ORG_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Industry Domain / Sector</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. Information Technology"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        />
                        <div className="edit-org-chips-wrap">
                          {INDUSTRY_PRESETS.slice(0, 4).map((p) => (
                            <button
                              key={p}
                              type="button"
                              className="edit-org-chip-btn"
                              onClick={() => setFormData({ ...formData, industry: p })}
                            >
                              + {p}
                            </button>
                          ))}
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Operating Status</Form.Label>
                        <Form.Select
                          className="edit-org-select"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          {ORG_STATUSES.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">About / Corporate Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          className="edit-org-input"
                          placeholder="Brief description of the organization, core business activities, mission..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          Organization Logo (Upload File or Enter URL)
                        </Form.Label>
                        <div className="edit-org-logo-zone">
                          <div className="edit-org-logo-preview-box">
                            {formData.logo && !logoPreviewError ? (
                              <img
                                src={formData.logo}
                                alt="Organization Logo"
                                className="edit-org-logo-img"
                                onError={() => setLogoPreviewError(true)}
                              />
                            ) : (
                              <FaBuilding className="edit-org-logo-placeholder" />
                            )}
                          </div>
                          <div className="edit-org-logo-actions">
                            <div className="edit-org-logo-btn-wrap">
                              <label className="edit-org-upload-btn mb-0">
                                <FaCloudUploadAlt /> Choose File...
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  style={{ display: "none" }}
                                />
                              </label>
                              {formData.logo && (
                                <Button
                                  variant="light"
                                  size="sm"
                                  className="edit-org-remove-btn"
                                  onClick={handleRemoveLogo}
                                >
                                  <FaTrash /> Remove
                                </Button>
                              )}
                            </div>
                            <Form.Control
                              className="edit-org-input mt-1"
                              placeholder="e.g. https://flareminds.com/assets/logo.png"
                              value={formData.logo}
                              onChange={(e) => {
                                setFormData({ ...formData, logo: e.target.value });
                                setLogoPreviewError(false);
                              }}
                            />
                            <span className="edit-org-helper-text">Supports PNG, JPG, SVG, WebP up to 2.5MB</span>
                          </div>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* SECTION 2: TAX & REGULATORY COMPLIANCE */}
              {/* ──────────────────────────────────────────────────────────── */}
              {activeTab === "tax" && (
                <div className="edit-org-content-card">
                  <div className="edit-org-section-header">
                    <div className="edit-org-section-title-wrap">
                      <div className="edit-org-section-icon-badge purple">
                        <FaShieldAlt />
                      </div>
                      <div>
                        <h3 className="edit-org-section-title">Tax & Statutory Compliance</h3>
                        <p className="edit-org-section-subtitle">Manage corporate registration numbers, PAN, TAN, GSTIN, EPFO & ESIC details</p>
                      </div>
                    </div>
                    <Badge bg="light" text="dark" className="border px-3 py-2 fw-semibold">
                      Section 2 of 5
                    </Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Corporate Registration / CIN No</Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          maxLength={35}
                          placeholder="e.g. U72200MH2020PTC123456"
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                        />
                        <span className="edit-org-helper-text">Corporate Identification Number (CIN) or Registration Certificate ID</span>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Date of Incorporation / Establishment</Form.Label>
                        <Form.Control
                          type="date"
                          className="edit-org-input"
                          value={formData.incorporationDate}
                          onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
                        />
                        <span className="edit-org-helper-text">Official legal founding date as per government certificate</span>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          PAN (Permanent Account Number)
                        </Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          maxLength={10}
                          placeholder="e.g. AAACF1234K"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        />
                        <span className="edit-org-helper-text">10-character alphanumeric Indian Income Tax PAN</span>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          TAN (Tax Deduction Account Number)
                        </Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          maxLength={10}
                          placeholder="e.g. BLRM12345D"
                          value={formData.tan}
                          onChange={(e) => setFormData({ ...formData, tan: e.target.value.toUpperCase() })}
                        />
                        <span className="edit-org-helper-text">10-character TAN for TDS returns & Form 16</span>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          GSTIN / Federal Tax ID
                        </Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          maxLength={15}
                          placeholder="e.g. 29AAACF1234K1ZV"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        />
                        <span className="edit-org-helper-text">15-digit Goods & Services Tax Identification Number</span>
                      </Form.Group>
                    </Col>

                    {/* Extended Statutory Fields */}
                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">PF / EPFO Registration Number</Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          placeholder="e.g. MH/BAN/0012345/000"
                          value={formData.pfNumber}
                          onChange={(e) => setFormData({ ...formData, pfNumber: e.target.value.toUpperCase() })}
                        />
                        <span className="edit-org-helper-text">Provident Fund establishment code for ECR filing</span>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">ESIC / ESI Registration Code</Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          placeholder="e.g. 51000123450001001"
                          value={formData.esiNumber}
                          onChange={(e) => setFormData({ ...formData, esiNumber: e.target.value.toUpperCase() })}
                        />
                        <span className="edit-org-helper-text">17-digit Employee State Insurance code</span>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">MSME / Udyam Reg No</Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          placeholder="e.g. UDYAM-KR-03-0012345"
                          value={formData.msmeNumber}
                          onChange={(e) => setFormData({ ...formData, msmeNumber: e.target.value.toUpperCase() })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Labour Identification (LIN)</Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          placeholder="e.g. 1234567890"
                          value={formData.lin}
                          onChange={(e) => setFormData({ ...formData, lin: e.target.value.toUpperCase() })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Professional Tax (PT) Reg No</Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace text-uppercase"
                          placeholder="e.g. PT/KAR/12345"
                          value={formData.professionalTaxNumber}
                          onChange={(e) => setFormData({ ...formData, professionalTaxNumber: e.target.value.toUpperCase() })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* SECTION 3: CONTACT & WEB CREDENTIALS */}
              {/* ──────────────────────────────────────────────────────────── */}
              {activeTab === "contact" && (
                <div className="edit-org-content-card">
                  <div className="edit-org-section-header">
                    <div className="edit-org-section-title-wrap">
                      <div className="edit-org-section-icon-badge blue">
                        <FaGlobe />
                      </div>
                      <div>
                        <h3 className="edit-org-section-title">Official Communications & Authorized Signatory</h3>
                        <p className="edit-org-section-subtitle">Configure official corporate email, helpline, website domain & primary contact person</p>
                      </div>
                    </div>
                    <Badge bg="light" text="dark" className="border px-3 py-2 fw-semibold">
                      Section 3 of 5
                    </Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          <FaEnvelope className="text-muted me-1" /> Official Corporate Email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          className="edit-org-input"
                          placeholder="e.g. contact@flareminds.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                        />
                        <span className="edit-org-helper-text">Default recipient for automated system notifications & invoices</span>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          <FaPhoneAlt className="text-muted me-1" /> Primary Phone
                        </Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. +91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          <FaPhoneAlt className="text-muted me-1" /> Alternate / Landline
                        </Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. 080-23456789"
                          value={formData.altPhone}
                          onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          <FaGlobe className="text-muted me-1" /> Corporate Website URL
                        </Form.Label>
                        <div className="input-group">
                          <Form.Control
                            className="edit-org-input"
                            placeholder="e.g. https://www.flareminds.com"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          />
                          {formData.website && (
                            <a
                              href={formData.website.startsWith("http") ? formData.website : `https://${formData.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline-secondary d-flex align-items-center"
                              title="Test link"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          )}
                        </div>
                        <span className="edit-org-helper-text">Public corporate portal web address</span>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <div className="p-3 bg-light rounded border mt-2">
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                          <FaUserTie className="text-primary" /> Primary Contact Person / Authorized Signatory
                        </h6>
                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="small fw-semibold">Signatory Name</Form.Label>
                              <Form.Control
                                placeholder="e.g. Ramesh Sharma"
                                value={formData.contactPersonName}
                                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="small fw-semibold">Designation / Role</Form.Label>
                              <Form.Control
                                placeholder="e.g. Managing Director / HR Head"
                                value={formData.contactPersonDesignation}
                                onChange={(e) => setFormData({ ...formData, contactPersonDesignation: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="small fw-semibold">Direct Email</Form.Label>
                              <Form.Control
                                type="email"
                                placeholder="e.g. ramesh@flareminds.com"
                                value={formData.contactPersonEmail}
                                onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value.toLowerCase() })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="small fw-semibold">Direct Mobile</Form.Label>
                              <Form.Control
                                placeholder="e.g. +91 98765 00000"
                                value={formData.contactPersonPhone}
                                onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* SECTION 4: HEADQUARTERS PHYSICAL LOCATION */}
              {/* ──────────────────────────────────────────────────────────── */}
              {activeTab === "address" && (
                <div className="edit-org-content-card">
                  <div className="edit-org-section-header">
                    <div className="edit-org-section-title-wrap">
                      <div className="edit-org-section-icon-badge orange">
                        <FaMapMarkerAlt />
                      </div>
                      <div>
                        <h3 className="edit-org-section-title">Headquarters Physical Location</h3>
                        <p className="edit-org-section-subtitle">Registered corporate office building, city, state, country & postal code</p>
                      </div>
                    </div>
                    <Badge bg="light" text="dark" className="border px-3 py-2 fw-semibold">
                      Section 4 of 5
                    </Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Street Address / Building / Floor</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. Tech Park, 4th Floor, Sector 5"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                        <span className="edit-org-helper-text">Primary street address line 1</span>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Address Line 2 (Area / Locality)</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. Outer Ring Road, Marathahalli"
                          value={formData.addressLine2}
                          onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Landmark</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. Opposite Central Metro Station"
                          value={formData.landmark}
                          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">City</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. Bengaluru"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">State / Province</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. Karnataka"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">Country</Form.Label>
                        <Form.Control
                          className="edit-org-input"
                          placeholder="e.g. India"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">PIN / Postal Code</Form.Label>
                        <Form.Control
                          className="edit-org-input font-monospace"
                          maxLength={12}
                          placeholder="e.g. 560103"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* SECTION 5: LOCALIZATION & FINANCIAL DEFAULTS */}
              {/* ──────────────────────────────────────────────────────────── */}
              {activeTab === "localization" && (
                <div className="edit-org-content-card">
                  <div className="edit-org-section-header">
                    <div className="edit-org-section-title-wrap">
                      <div className="edit-org-section-icon-badge teal">
                        <FaCog />
                      </div>
                      <div>
                        <h3 className="edit-org-section-title">Localization & Financial Defaults</h3>
                        <p className="edit-org-section-subtitle">Set primary operational currency, timezone & corporate financial accounting cycle</p>
                      </div>
                    </div>
                    <Badge bg="light" text="dark" className="border px-3 py-2 fw-semibold">
                      Section 5 of 5
                    </Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          <FaMoneyBillWave className="text-muted me-1" /> Operating Currency
                        </Form.Label>
                        <Form.Select
                          className="edit-org-select"
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </Form.Select>
                        <span className="edit-org-helper-text">Base currency used for payroll & finance calculations</span>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          <FaCog className="text-muted me-1" /> System Time Zone
                        </Form.Label>
                        <Form.Select
                          className="edit-org-select"
                          value={formData.timeZone}
                          onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </Form.Select>
                        <span className="edit-org-helper-text">Primary timezone for shift timestamps & attendance logging</span>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group className="edit-org-form-group">
                        <Form.Label className="edit-org-label">
                          <FaCalendarAlt className="text-muted me-1" /> Financial Year Start Cycle
                        </Form.Label>
                        <Form.Select
                          className="edit-org-select"
                          value={formData.financialYearStart}
                          onChange={(e) => setFormData({ ...formData, financialYearStart: e.target.value })}
                        >
                          {FY_CYCLES.map((fy) => (
                            <option key={fy.value} value={fy.value}>
                              {fy.label}
                            </option>
                          ))}
                        </Form.Select>
                        <span className="edit-org-helper-text">Accounting period opening date for tax years & annual leave cycles</span>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ── Bottom Save & Navigation Bar ── */}
              <div className="edit-org-bottom-bar">
                <div className="d-flex align-items-center gap-2">
                  <Button variant="light" className="edit-org-btn-discard" onClick={onBack}>
                    Cancel
                  </Button>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {activeTab !== "entity" && (
                    <Button
                      variant="light"
                      className="edit-org-btn-discard"
                      onClick={() => {
                        const idx = navTabs.findIndex((t) => t.key === activeTab);
                        if (idx > 0) setActiveTab(navTabs[idx - 1].key);
                      }}
                    >
                      &larr; Previous Step
                    </Button>
                  )}
                  {activeTab !== "localization" ? (
                    <Button
                      variant="light"
                      className="edit-org-back-btn"
                      onClick={() => {
                        const idx = navTabs.findIndex((t) => t.key === activeTab);
                        if (idx < navTabs.length - 1) setActiveTab(navTabs[idx + 1].key);
                      }}
                    >
                      Next Step &rarr;
                    </Button>
                  ) : null}
                  <Button
                    type="submit"
                    className="edit-org-btn-save"
                    disabled={saving || !canEdit}
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <FaSave />
                        <span>Save All Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}
