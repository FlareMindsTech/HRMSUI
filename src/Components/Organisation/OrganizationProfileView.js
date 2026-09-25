import React, { useState, useEffect, useCallback, useRef } from "react";
import { Row, Col, Card, Button, Badge, Spinner, Alert, Form } from "react-bootstrap";
import {
  FaBuilding,
  FaEdit,
  FaSave,
  FaTimes,
  FaGlobe,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaTrash,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaCopy,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  fetchMyOrganization,
  updateMyOrganization,
  normalizeOrganization,
  fetchOrganizationStructure,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";

const ORG_TYPES = [
  { value: "COMPANY", label: "Private Limited Company (Pvt Ltd)" },
  { value: "PUBLIC_LIMITED", label: "Public Limited Company (Ltd)" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)" },
  { value: "PARTNERSHIP", label: "Partnership Firm" },
  { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
  { value: "TRUST", label: "Trust / Society" },
  { value: "NGO", label: "Non-Profit / Section 8" },
  { value: "STARTUP", label: "Startup / Incubated" },
  { value: "OTHER", label: "Other Corporate Entity" },
];

const CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "SGD", label: "SGD (S$) - Singapore Dollar" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +05:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +08:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

export default function OrganizationProfileView({ onNavigateTab }) {
  const { isSystemAdmin, hasPermission, user } = useAuth();
  const { organization, refreshOrganization, refreshBranches } = useBranch();

  const [orgData, setOrgData] = useState(null);
  const [stats, setStats] = useState({ branches: 0, departments: 0, employees: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const fileInputRef = useRef(null);

  const canEdit = isSystemAdmin || hasPermission("organization.update") || user?.roleCode === "OWNER";

  const [formData, setFormData] = useState({
    organizationName: "",
    organizationCode: "",
    legalName: "",
    displayName: "",
    organizationType: "COMPANY",
    industry: "Information Technology",
    description: "",
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
    email: "",
    phone: "",
    altPhone: "",
    website: "",
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
    logo: "",
    status: "ACTIVE",
  });

  const populateForm = useCallback((org) => {
    if (!org) return;
    const norm = normalizeOrganization(org) || org;
    let incDate = norm.incorporationDate || "";
    if (incDate && incDate.includes("T")) {
      incDate = incDate.split("T")[0];
    }

    setFormData({
      organizationName: norm.organizationName || norm.name || "",
      organizationCode: norm.organizationCode || norm.code || "",
      legalName: norm.legalName || norm.organizationName || "",
      displayName: norm.displayName || norm.organizationName || "",
      organizationType: norm.organizationType || "COMPANY",
      industry: norm.industry || "Information Technology",
      description: norm.description || norm.about || "",
      registrationNumber: norm.registrationNumber || "",
      pan: norm.pan || "",
      tan: norm.tan || "",
      gstin: norm.gstin || "",
      pfNumber: norm.pfNumber || "",
      esiNumber: norm.esiNumber || "",
      msmeNumber: norm.msmeNumber || "",
      lin: norm.lin || "",
      professionalTaxNumber: norm.professionalTaxNumber || "",
      incorporationDate: incDate,
      email: norm.email || "",
      phone: norm.phone || "",
      altPhone: norm.altPhone || "",
      website: norm.website || "",
      address: norm.address || "",
      addressLine2: norm.addressLine2 || "",
      landmark: norm.landmark || "",
      city: norm.city || "",
      state: norm.state || "",
      country: norm.country || "India",
      pincode: norm.pincode || "",
      contactPersonName: norm.contactPersonName || "",
      contactPersonDesignation: norm.contactPersonDesignation || "",
      contactPersonEmail: norm.contactPersonEmail || "",
      contactPersonPhone: norm.contactPersonPhone || "",
      currency: norm.currency || "INR",
      timeZone: norm.timeZone || "Asia/Kolkata",
      financialYearStart: norm.financialYearStart || "04-01",
      logo: typeof norm.logo === "object" && norm.logo !== null ? norm.logo.url || "" : norm.logo || "",
      status: norm.status || "ACTIVE",
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [org, structure] = await Promise.all([
        fetchMyOrganization().catch(() => null),
        fetchOrganizationStructure().catch(() => null),
      ]);

      const active = org || organization;
      if (active) {
        const norm = normalizeOrganization(active);
        setOrgData(norm);
        populateForm(norm);
      }

      setStats({
        branches: structure?.branches?.length ?? active?.stats?.branchCount ?? 1,
        departments: structure?.departments?.length ?? active?.stats?.departmentCount ?? 1,
        employees: active?.stats?.employeeCount ?? 1,
        users: active?.stats?.userCount ?? 1,
      });
    } catch (err) {
      setError(err.message || "Failed to load organization profile");
    } finally {
      setLoading(false);
    }
  }, [organization, populateForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyText = (val, field) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

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
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.organizationName.trim()) {
      setError("Organization Name is required");
      return;
    }
    if (!formData.organizationCode.trim()) {
      setError("Organization Code is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...formData,
        organizationName: formData.organizationName.trim(),
        organizationCode: formData.organizationCode.trim().toUpperCase().replace(/\s+/g, ""),
        legalName: formData.legalName.trim() || formData.organizationName.trim(),
        displayName: formData.displayName.trim() || formData.organizationName.trim(),
        incorporationDate: formData.incorporationDate ? new Date(formData.incorporationDate) : null,
      };

      const res = await updateMyOrganization(payload);
      setSuccess(res?.message || "Organization profile saved successfully!");
      setIsEditing(false);
      await loadData();
      if (refreshOrganization) refreshOrganization();
      if (refreshBranches) refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save organization profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (orgData) populateForm(orgData);
    setIsEditing(false);
    setError("");
  };

  if (loading && !orgData) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading Organization Profile...</p>
      </div>
    );
  }

  return (
    <div className="org-profile-page">
      {/* ── Page Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <FaBuilding className="text-success" /> Organization Profile
          </h3>
          <p className="text-muted small mb-0">
            Manage your organization's basic information, statutory registrations, contact details and HQ location.
          </p>
        </div>

        <div>
          {!isEditing ? (
            canEdit && (
              <Button
                variant="success"
                className="d-flex align-items-center gap-2 fw-semibold shadow-sm"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit /> Edit Organization
              </Button>
            )
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <FaTimes className="me-1" /> Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                className="d-flex align-items-center gap-1 fw-semibold"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Compact Top Statistics Row ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border shadow-sm text-center py-3 bg-white" onClick={() => onNavigateTab && onNavigateTab("branches")} role="button">
            <div className="small text-muted fw-semibold">Branches</div>
            <div className="fs-3 fw-bold text-dark mt-1">{stats.branches}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border shadow-sm text-center py-3 bg-white" onClick={() => onNavigateTab && onNavigateTab("departments")} role="button">
            <div className="small text-muted fw-semibold">Departments</div>
            <div className="fs-3 fw-bold text-dark mt-1">{stats.departments}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border shadow-sm text-center py-3 bg-white" onClick={() => onNavigateTab && onNavigateTab("reporting-hierarchy")} role="button">
            <div className="small text-muted fw-semibold">Employees</div>
            <div className="fs-3 fw-bold text-dark mt-1">{stats.employees}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border shadow-sm text-center py-3 bg-white" onClick={() => onNavigateTab && onNavigateTab("users")} role="button">
            <div className="small text-muted fw-semibold">Active Users</div>
            <div className="fs-3 fw-bold text-dark mt-1">{stats.users}</div>
          </Card>
        </Col>
      </Row>

      {/* ── Main Organization Header Card ── */}
      <Card className="border shadow-sm mb-4 bg-white">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 16,
                  background: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <FaBuilding className="text-secondary fs-2" />
                )}
              </div>

              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h4 className="fw-bold text-dark mb-0">
                    {formData.displayName || formData.organizationName || "Organization Name"}
                  </h4>
                  <Badge bg="success" className="d-flex align-items-center gap-1">
                    <FaCheckCircle size={10} /> {formData.status || "ACTIVE"}
                  </Badge>
                  <Badge bg="light" text="dark" className="border">
                    {formData.organizationType?.replace("_", " ") || "COMPANY"}
                  </Badge>
                </div>
                <div className="d-flex align-items-center gap-3 mt-1 text-muted small flex-wrap">
                  <span className="font-monospace fw-semibold text-secondary">
                    Code: {formData.organizationCode || "ORG_CODE"}
                  </span>
                  <span>•</span>
                  <span>Legal: {formData.legalName || formData.organizationName || "—"}</span>
                  {formData.industry && (
                    <>
                      <span>•</span>
                      <span>Sector: {formData.industry}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="d-flex align-items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: "none" }}
                />
                <Button variant="outline-secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <FaCloudUploadAlt className="me-1" /> Change Logo
                </Button>
                {formData.logo && (
                  <Button variant="outline-danger" size="sm" onClick={handleRemoveLogo}>
                    <FaTrash />
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ── Main Information Sections ── */}
      <Form onSubmit={handleSave}>
        <Row className="g-4">
          {/* 1. Basic Information */}
          <Col md={6}>
            <Card className="border shadow-sm h-100 bg-white">
              <Card.Header className="bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaBuilding className="text-primary" /> Basic Information
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Organization Name</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          required
                          value={formData.organizationName}
                          onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        />
                      ) : (
                        <div className="fw-semibold text-dark">{formData.organizationName || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Organization Code</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          required
                          className="font-monospace text-uppercase"
                          value={formData.organizationCode}
                          onChange={(e) => setFormData({ ...formData, organizationCode: e.target.value.toUpperCase() })}
                        />
                      ) : (
                        <div className="font-monospace fw-bold text-dark">{formData.organizationCode || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Organization Type</Form.Label>
                      {isEditing ? (
                        <Form.Select
                          value={formData.organizationType}
                          onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                        >
                          {ORG_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        <div className="text-dark">{formData.organizationType?.replace("_", " ") || "COMPANY"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Legal Registered Name</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.legalName}
                          onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.legalName || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Display / Brand Name</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.displayName || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Industry Domain</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.industry || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Incorporation Date</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          type="date"
                          value={formData.incorporationDate}
                          onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.incorporationDate || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* 2. Statutory & Tax Registration */}
          <Col md={6}>
            <Card className="border shadow-sm h-100 bg-white">
              <Card.Header className="bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaShieldAlt className="text-warning" /> Statutory & Tax Identifiers
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row className="g-3">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Registration / CIN</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          className="font-monospace text-uppercase"
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                        />
                      ) : (
                        <div className="font-monospace text-dark">{formData.registrationNumber || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">PAN (Income Tax)</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          className="font-monospace text-uppercase"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        />
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-monospace fw-semibold">{formData.pan || "—"}</span>
                          {formData.pan && (
                            <Button variant="link" size="sm" className="p-0 text-muted" onClick={() => copyText(formData.pan, "pan")}>
                              <FaCopy size={12} />
                            </Button>
                          )}
                          {copiedField === "pan" && <span className="small text-success">Copied</span>}
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">TAN Number</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          className="font-monospace text-uppercase"
                          value={formData.tan}
                          onChange={(e) => setFormData({ ...formData, tan: e.target.value.toUpperCase() })}
                        />
                      ) : (
                        <div className="font-monospace text-dark">{formData.tan || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">GSTIN Number</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          className="font-monospace text-uppercase"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        />
                      ) : (
                        <div className="font-monospace text-dark">{formData.gstin || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">EPFO / PF Registration</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          className="font-monospace text-uppercase"
                          value={formData.pfNumber}
                          onChange={(e) => setFormData({ ...formData, pfNumber: e.target.value.toUpperCase() })}
                        />
                      ) : (
                        <div className="font-monospace text-dark">{formData.pfNumber || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">ESIC Registration</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          className="font-monospace text-uppercase"
                          value={formData.esiNumber}
                          onChange={(e) => setFormData({ ...formData, esiNumber: e.target.value.toUpperCase() })}
                        />
                      ) : (
                        <div className="font-monospace text-dark">{formData.esiNumber || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* 3. Contact & Web Information */}
          <Col md={6}>
            <Card className="border shadow-sm h-100 bg-white">
              <Card.Header className="bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaGlobe className="text-info" /> Contact & Online Credentials
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Corporate Email</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      ) : (
                        <div>
                          {formData.email ? (
                            <a href={`mailto:${formData.email}`} className="text-primary text-decoration-none">
                              {formData.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Official Phone</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.phone || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Alternate / Landline</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.altPhone}
                          onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.altPhone || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Company Website</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        />
                      ) : (
                        <div>
                          {formData.website ? (
                            <a
                              href={formData.website.startsWith("http") ? formData.website : `https://${formData.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                            >
                              {formData.website} <FaExternalLinkAlt size={11} />
                            </a>
                          ) : (
                            "—"
                          )}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* 4. Headquarters Location & Regional Defaults */}
          <Col md={6}>
            <Card className="border shadow-sm h-100 bg-white">
              <Card.Header className="bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaMapMarkerAlt className="text-danger" /> Headquarters Location & Localization
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Street Address</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.address || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">City</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.city || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">State</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.state || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Country</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      ) : (
                        <div className="text-dark">{formData.country || "India"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">PIN / Postal Code</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          className="font-monospace"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        />
                      ) : (
                        <div className="font-monospace text-dark">{formData.pincode || "—"}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Currency</Form.Label>
                      {isEditing ? (
                        <Form.Select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        <div className="text-dark">{formData.currency}</div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted mb-1">Timezone</Form.Label>
                      {isEditing ? (
                        <Form.Select
                          value={formData.timeZone}
                          onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </Form.Select>
                      ) : (
                        <div className="text-dark">{formData.timeZone}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
