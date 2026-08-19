import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Nav,
  Form,
  Button,
  ProgressBar,
  Badge,
  Table,
  Modal,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FaUser,
  FaBriefcase,
  FaGraduationCap,
  FaHome,
  FaUsers,
  FaFileAlt,
  FaChevronRight,
  FaChevronLeft,
  FaCheckCircle,
  FaUserPlus,
  FaKey,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaUserCheck,
  FaCog,
} from "react-icons/fa";
import { apiFetch } from "../../config/api";
import {
  fetchAllUsers,
  fetchAssignableRoles,
  provisionUserAccount,
  updateAccountStatus,
  resetAccountCredentials,
  assignUserRole,
} from "../../services/rbacService";
import { useAuth } from "../../context/AuthContext";

function HrOnboarding() {
  const { hasPermission, isSystemAdmin, user: currentUser, refreshAuthContext } = useAuth();

  // ── Top-Level View: "onboard" (form) or "directory" (onboarded employee list) ──
  const [viewTab, setViewTab] = useState("onboard");

  // ── Form State ──
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    dob: "",
    gender: "Male",
    marriageStatus: "Unmarried",
    mobileNo: "",
    department: "Engineering",
    designation: "Software Engineer",
    joiningDate: new Date().toISOString().split("T")[0],
    employmentType: "FULL_TIME",
    skills: ["JavaScript", "React", "Node.js"],
    professional: [
      { designation: "Software Engineer", companyName: "", location: "", website: "", linkedin: "" },
    ],
    education: [
      { degree: "B.Tech Computer Science", university: "", percentage: "" },
    ],
    experience: [
      { experienceYears: "2 years", prevCompany: "", roleDescription: "Full Stack Developer" },
    ],
    addresses: [
      { addressLine1: "", addressLine2: "", city: "", state: "", country: "India", postalCode: "" },
    ],
    bankName: "",
    accountNo: "",
    panNo: "",
    aadhaarNo: "",
    familyMemberName: "",
    relationship: "",
    familyMobile: "",
  });

  // ── Directory & Role State ──
  const [employees, setEmployees] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Provisioning Modal State ──
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionTarget, setProvisionTarget] = useState(null);
  const [provisionForm, setProvisionForm] = useState({
    roleId: "",
    password: "Welcome@123",
    isActive: true,
    showPass: false,
  });
  const [provisionLoading, setProvisionLoading] = useState(false);

  // ── Manage Modal State ──
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTarget, setManageTarget] = useState(null);
  const [manageForm, setManageForm] = useState({
    roleId: "",
    isActive: true,
    isBlocked: false,
    newPassword: "",
    showPass: false,
  });

  // ── Load Employees & Roles ──
  const loadDirectoryData = useCallback(async () => {
    setLoadingDirectory(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        fetchAllUsers().catch(() => []),
        fetchAssignableRoles().catch(() => []),
      ]);
      setEmployees(usersData || []);
      setAssignableRoles(rolesData || []);
    } catch (err) {
      console.warn("Failed to load directory:", err.message);
    } finally {
      setLoadingDirectory(false);
    }
  }, []);

  useEffect(() => {
    loadDirectoryData();
  }, [loadDirectoryData]);

  // ── Onboarding Section Completion Validator ──
  const isSectionComplete = (tabId) => {
    if (tabId === "personal") {
      const fields = ["firstName", "lastName", "email", "mobileNo", "dob", "gender", "marriageStatus"];
      return fields.every((f) => formData[f] && formData[f].toString().trim() !== "");
    }
    if (tabId === "documents") {
      return !!(formData.panNo || formData.aadhaarNo || formData.bankName || formData.accountNo);
    }
    if (tabId === "family") {
      return !!(formData.familyMemberName || formData.familyMobile);
    }
    return true;
  };

  // ── Calculate Progress ──
  const calculateProgress = () => {
    const fieldsToTrack = [
      "firstName", "lastName", "email", "mobileNo", "dob", "gender", "marriageStatus",
      "department", "designation", "panNo", "aadhaarNo", "bankName", "accountNo",
    ];
    const filled = fieldsToTrack.filter((f) => formData[f] && formData[f].toString().trim() !== "");
    return Math.min(100, Math.round((filled.length / fieldsToTrack.length) * 100));
  };

  const progress = calculateProgress();

  // ── Handle Onboarding Form Submit ──
  const handleOnboardSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate personal fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobileNo || !formData.dob) {
      setErrorMsg("Please complete all required Personal Information fields.");
      setActiveTab("personal");
      return;
    }

    setSubmittingForm(true);
    try {
      const defaultRole = assignableRoles.find((r) => r.roleCode === "EMPLOYEE") || assignableRoles[0];

      const res = await apiFetch("/onboarding/initiate", {
        method: "POST",
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          middleName: formData.middleName?.trim() || null,
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          mobileNo: formData.mobileNo.trim(),
          dob: formData.dob,
          gender: formData.gender,
          marriageStatus: formData.marriageStatus,
          department: formData.department,
          designation: formData.designation,
          joiningDate: formData.joiningDate,
          employmentType: formData.employmentType,
          roleId: defaultRole?._id,
          bankDetails: {
            bankName: formData.bankName,
            accountNumber: formData.accountNo,
          },
          statutoryDetails: {
            panNo: formData.panNo,
            aadhaarNo: formData.aadhaarNo,
          },
          emergencyContact: {
            name: formData.familyMemberName,
            relationship: formData.relationship,
            phone: formData.familyMobile,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(res.data?.message || "Failed to initiate employee onboarding");
      }

      const createdUser = res.data?.data?.user;
      setSuccessMsg(
        `Employee ${createdUser?.firstName} ${createdUser?.lastName} (${createdUser?.employeeCode}) onboarded successfully!`
      );

      // Open Provisioning Modal immediately
      setProvisionTarget({
        _id: createdUser?._id,
        firstName: createdUser?.firstName || formData.firstName,
        lastName: createdUser?.lastName || formData.lastName,
        email: createdUser?.email || formData.email,
        employeeCode: createdUser?.employeeCode || "EMP-NEW",
        department: formData.department,
        designation: formData.designation,
      });

      setProvisionForm({
        roleId: defaultRole?._id || "",
        password: "Welcome@123",
        isActive: true,
        showPass: false,
      });

      setShowProvisionModal(true);
      await loadDirectoryData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to onboard employee");
    } finally {
      setSubmittingForm(false);
    }
  };

  // ── Open Provision Modal for Existing Employee ──
  const handleOpenProvisionForEmployee = (emp) => {
    setProvisionTarget(emp);
    const defaultRole = assignableRoles.find((r) => r.roleCode === "EMPLOYEE") || assignableRoles[0];
    setProvisionForm({
      roleId: defaultRole?._id || "",
      password: "Welcome@123",
      isActive: true,
      showPass: false,
    });
    setShowProvisionModal(true);
  };

  // ── Submit Account Provisioning ──
  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    if (!provisionTarget || !provisionForm.roleId) return;

    setProvisionLoading(true);
    setErrorMsg("");
    try {
      await provisionUserAccount({
        employeeId: provisionTarget._id || provisionTarget.id,
        roleId: provisionForm.roleId,
        password: provisionForm.password,
        isActive: provisionForm.isActive,
      });

      setSuccessMsg(
        `Login account provisioned successfully for ${provisionTarget.firstName} ${provisionTarget.lastName}.`
      );
      setShowProvisionModal(false);
      await loadDirectoryData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to provision login account");
    } finally {
      setProvisionLoading(false);
    }
  };

  // ── Open Manage Modal ──
  const handleOpenManageModal = (emp) => {
    setManageTarget(emp);
    setManageForm({
      roleId: emp.role?._id || emp.role || "",
      isActive: emp.isActive !== false,
      isBlocked: emp.isBlocked === true,
      newPassword: "",
      showPass: false,
    });
    setShowManageModal(true);
  };

  // ── Submit Manage Changes ──
  const handleManageSubmit = async (e) => {
    e.preventDefault();
    if (!manageTarget) return;

    setProvisionLoading(true);
    setErrorMsg("");
    try {
      const userId = manageTarget._id || manageTarget.id;
      const currentRoleId = manageTarget.role?._id || manageTarget.role;
      if (manageForm.roleId && manageForm.roleId !== currentRoleId) {
        await assignUserRole(userId, manageForm.roleId);
      }
      await updateAccountStatus(userId, {
        isActive: manageForm.isActive,
        isBlocked: manageForm.isBlocked,
      });
      if (manageForm.newPassword && manageForm.newPassword.trim()) {
        await resetAccountCredentials(userId, manageForm.newPassword.trim());
      }

      setSuccessMsg(`Account settings updated for ${manageTarget.firstName} ${manageTarget.lastName}.`);
      setShowManageModal(false);
      await loadDirectoryData();
      await refreshAuthContext();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update account");
    } finally {
      setProvisionLoading(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal", icon: <FaUser /> },
    { id: "professional", label: "Professional", icon: <FaBriefcase /> },
    { id: "education", label: "Education", icon: <FaGraduationCap /> },
    { id: "experience", label: "Experience", icon: <FaFileAlt /> },
    { id: "address", label: "Address", icon: <FaHome /> },
    { id: "documents", label: "Documents & Bank", icon: <FaFileAlt /> },
    { id: "family", label: "Family Details", icon: <FaUsers /> },
  ];

  return (
    <Container fluid className="p-3">
      {/* ── Top Header ── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
            <FaUserPlus className="text-success" /> HR Employee Onboarding & Account Provisioning
          </h4>
          <p className="text-muted small mb-0">
            Collect employee details, complete organizational onboarding, and provision HRMS login accounts with assigned roles.
          </p>
        </div>

        {/* View Switcher */}
        <div className="d-flex gap-2">
          <Button
            variant={viewTab === "onboard" ? "success" : "outline-secondary"}
            size="sm"
            className="rounded-pill px-3 py-2 fw-semibold shadow-sm"
            onClick={() => setViewTab("onboard")}
          >
            <FaUserPlus className="me-1" /> Onboard New Employee
          </Button>
          <Button
            variant={viewTab === "directory" ? "success" : "outline-secondary"}
            size="sm"
            className="rounded-pill px-3 py-2 fw-semibold shadow-sm"
            onClick={() => setViewTab("directory")}
          >
            <FaUsers className="me-1" /> Onboarded Directory ({employees.length})
          </Button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="small py-2 mb-3">
          <FaExclamationTriangle className="me-2" />
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg("")} className="small py-2 mb-3">
          <FaCheckCircle className="me-2" />
          {successMsg}
        </Alert>
      )}

      {/* ── VIEW 1: ONBOARDING FORM ── */}
      {viewTab === "onboard" && (
        <Row className="g-3">
          <Col xl={8}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-3 p-md-4">
                {/* Step Tabs Navigation */}
                <Nav variant="pills" className="bg-light p-1 rounded-3 gap-1 mb-4 flex-wrap">
                  {tabs.map((tab) => {
                    const isComplete = isSectionComplete(tab.id);
                    return (
                      <Nav.Item key={tab.id}>
                        <Nav.Link
                          active={activeTab === tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`d-flex align-items-center gap-1 extra-small py-2 px-3 rounded-3 cursor-pointer ${
                            activeTab === tab.id
                              ? "bg-success text-white fw-bold shadow-sm"
                              : isComplete
                              ? "text-success fw-medium"
                              : "text-muted"
                          }`}
                        >
                          {tab.icon} {tab.label}
                          {isComplete && activeTab !== tab.id && (
                            <FaCheckCircle size={10} className="text-success ms-1" />
                          )}
                        </Nav.Link>
                      </Nav.Item>
                    );
                  })}
                </Nav>

                {/* Tab 1: Personal Information */}
                {activeTab === "personal" && (
                  <Form>
                    <h6 className="fw-bold mb-3 text-dark">Personal Information</h6>
                    <Row className="g-3 mb-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">First Name *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Arun"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Middle Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Kumar"
                            value={formData.middleName}
                            onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Last Name *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Sharma"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Email Address *</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="e.g. arun.sharma@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Mobile Number *</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={formData.mobileNo}
                            onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Date of Birth *</Form.Label>
                          <Form.Control
                            type="date"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Gender *</Form.Label>
                          <Form.Select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Others">Others</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Marital Status *</Form.Label>
                          <Form.Select
                            value={formData.marriageStatus}
                            onChange={(e) => setFormData({ ...formData, marriageStatus: e.target.value })}
                          >
                            <option value="Unmarried">Unmarried</option>
                            <option value="Married">Married</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Department</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Engineering, Sales, Human Resources"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Designation</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Frontend Developer, QA Engineer"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                )}

                {/* Tab 2: Professional & Experience */}
                {activeTab === "professional" && (
                  <div>
                    <h6 className="fw-bold mb-3 text-dark">Professional Experience</h6>
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Previous Company</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Company Name"
                            value={formData.professional[0]?.companyName || ""}
                            onChange={(e) => {
                              const prof = [...formData.professional];
                              prof[0].companyName = e.target.value;
                              setFormData({ ...formData, professional: prof });
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Previous Designation</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Designation"
                            value={formData.professional[0]?.designation || ""}
                            onChange={(e) => {
                              const prof = [...formData.professional];
                              prof[0].designation = e.target.value;
                              setFormData({ ...formData, professional: prof });
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Tab 3: Education */}
                {activeTab === "education" && (
                  <div>
                    <h6 className="fw-bold mb-3 text-dark">Educational Qualifications</h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Highest Degree</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. B.Tech, M.Sc, MBA"
                            value={formData.education[0]?.degree || ""}
                            onChange={(e) => {
                              const edu = [...formData.education];
                              edu[0].degree = e.target.value;
                              setFormData({ ...formData, education: edu });
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">University / College</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="University Name"
                            value={formData.education[0]?.university || ""}
                            onChange={(e) => {
                              const edu = [...formData.education];
                              edu[0].university = e.target.value;
                              setFormData({ ...formData, education: edu });
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Tab 4: Experience */}
                {activeTab === "experience" && (
                  <div>
                    <h6 className="fw-bold mb-3 text-dark">Total Relevant Experience</h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Experience in Years</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. 3 years"
                            value={formData.experience[0]?.experienceYears || ""}
                            onChange={(e) => {
                              const exp = [...formData.experience];
                              exp[0].experienceYears = e.target.value;
                              setFormData({ ...formData, experience: exp });
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Tab 5: Address */}
                {activeTab === "address" && (
                  <div>
                    <h6 className="fw-bold mb-3 text-dark">Current & Permanent Address</h6>
                    <Row className="g-3 mb-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Address Line</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="House / Flat No, Street Name"
                            value={formData.addresses[0]?.addressLine1 || ""}
                            onChange={(e) => {
                              const addr = [...formData.addresses];
                              addr[0].addressLine1 = e.target.value;
                              setFormData({ ...formData, addresses: addr });
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">City</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="City"
                            value={formData.addresses[0]?.city || ""}
                            onChange={(e) => {
                              const addr = [...formData.addresses];
                              addr[0].city = e.target.value;
                              setFormData({ ...formData, addresses: addr });
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">State</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="State"
                            value={formData.addresses[0]?.state || ""}
                            onChange={(e) => {
                              const addr = [...formData.addresses];
                              addr[0].state = e.target.value;
                              setFormData({ ...formData, addresses: addr });
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Country</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.addresses[0]?.country || "India"}
                            onChange={(e) => {
                              const addr = [...formData.addresses];
                              addr[0].country = e.target.value;
                              setFormData({ ...formData, addresses: addr });
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Tab 6: Documents & Bank */}
                {activeTab === "documents" && (
                  <div>
                    <h6 className="fw-bold mb-3 text-dark">Bank & Statutory Documents</h6>
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">PAN Card Number</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="ABCDE1234F"
                            value={formData.panNo}
                            onChange={(e) => setFormData({ ...formData, panNo: e.target.value.toUpperCase() })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Aadhaar Card Number</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="12-digit Aadhaar"
                            value={formData.aadhaarNo}
                            onChange={(e) => setFormData({ ...formData, aadhaarNo: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Bank Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. HDFC Bank, ICICI"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Account Number</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Account Number"
                            value={formData.accountNo}
                            onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Tab 7: Family */}
                {activeTab === "family" && (
                  <div>
                    <h6 className="fw-bold mb-3 text-dark">Emergency Contact & Family</h6>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Contact Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Contact Person Name"
                            value={formData.familyMemberName}
                            onChange={(e) => setFormData({ ...formData, familyMemberName: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Relationship</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Father, Spouse"
                            value={formData.relationship}
                            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="Emergency Phone"
                            value={formData.familyMobile}
                            onChange={(e) => setFormData({ ...formData, familyMobile: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-4 pt-3 border-top d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="rounded-pill px-3 d-flex align-items-center gap-1"
                    onClick={() => {
                      const idx = tabs.findIndex((t) => t.id === activeTab);
                      if (idx > 0) setActiveTab(tabs[idx - 1].id);
                    }}
                    disabled={activeTab === tabs[0].id}
                  >
                    <FaChevronLeft size={10} /> Previous
                  </Button>

                  {activeTab !== tabs[tabs.length - 1].id ? (
                    <Button
                      variant="success"
                      size="sm"
                      className="rounded-pill px-4 d-flex align-items-center gap-1 shadow-sm"
                      onClick={() => {
                        const idx = tabs.findIndex((t) => t.id === activeTab);
                        if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                      }}
                    >
                      Next <FaChevronRight size={10} />
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      className="rounded-pill px-4 d-flex align-items-center gap-1 fw-bold shadow-sm"
                      onClick={handleOnboardSubmit}
                      disabled={submittingForm}
                    >
                      {submittingForm ? <Spinner size="sm" animation="border" /> : <FaUserCheck />} Complete Onboarding
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Progress Card */}
          <Col xl={4}>
            <Card className="border-0 shadow-sm rounded-4 text-center p-3 mb-3 bg-white">
              <h6 className="fw-bold text-dark small mb-3">Onboarding Profile Completion</h6>
              <div className="mb-3">
                <h2 className="fw-bold text-success mb-0">{progress}%</h2>
                <span className="extra-small text-muted">information completeness</span>
              </div>
              <ProgressBar now={progress} variant="success" className="rounded-pill mb-2" style={{ height: 6 }} />
              <p className="extra-small text-muted mb-0">
                Ensure personal, statutory, and contact information are filled before provisioning login.
              </p>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 p-3 bg-light">
              <h6 className="fw-bold text-dark small mb-2">Next Step: Account Provisioning</h6>
              <p className="extra-small text-muted mb-3">
                After completing onboarding, an authorized HR manager or administrator can provision a login account with restricted RBAC roles.
              </p>
              <Button
                variant="outline-success"
                size="sm"
                className="rounded-pill fw-semibold"
                onClick={() => setViewTab("directory")}
              >
                <FaUsers className="me-1" /> View Employee Directory
              </Button>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── VIEW 2: ONBOARDED DIRECTORY & LOGIN PROVISIONING ── */}
      {viewTab === "directory" && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-bold text-dark">Onboarded Employees & Login Status</span>
              <span className="text-muted extra-small ms-2">({employees.length} total)</span>
            </div>
            <Button
              variant="outline-success"
              size="sm"
              className="rounded-pill px-3"
              onClick={loadDirectoryData}
            >
              Refresh
            </Button>
          </Card.Header>

          <div className="table-responsive">
            {loadingDirectory ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <div className="small text-muted mt-2">Loading employee accounts...</div>
              </div>
            ) : (
              <Table hover align="middle" className="mb-0">
                <thead className="table-light extra-small text-uppercase text-muted">
                  <tr>
                    <th className="ps-4">Employee</th>
                    <th>Code</th>
                    <th>Department / Role</th>
                    <th>Lifecycle</th>
                    <th>Login Status</th>
                    <th>Assigned Role</th>
                    <th className="text-end pe-4">Account Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const hasAccount = emp.hasLoginAccess === true;
                    const isOwner = emp.role?.priority === 1 || emp.role?.roleCode === "OWNER";
                    const canManage = currentUser?.priority === 1 || (!isOwner && (isSystemAdmin || hasPermission("user.manage_roles")));

                    return (
                      <tr key={emp._id || emp.id}>
                        <td className="ps-4">
                          <div className="fw-semibold text-dark">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="extra-small text-muted">{emp.email}</div>
                        </td>
                        <td>
                          <code>{emp.employeeCode || "—"}</code>
                        </td>
                        <td>
                          <div className="small text-dark fw-medium">{emp.department || "General"}</div>
                          <div className="extra-small text-muted">{emp.designation || "Employee"}</div>
                        </td>
                        <td>
                          <Badge bg={emp.lifecycleStatus === "ACTIVE" ? "success" : "info"} className="px-2 py-1">
                            {emp.lifecycleStatus || "ACTIVE"}
                          </Badge>
                        </td>
                        <td>
                          {!hasAccount ? (
                            <Badge bg="warning" text="dark" className="px-2 py-1 rounded-pill">
                              No Login Account
                            </Badge>
                          ) : emp.isBlocked ? (
                            <Badge bg="danger" className="px-2 py-1 rounded-pill">
                              Blocked
                            </Badge>
                          ) : emp.isActive ? (
                            <Badge bg="success" className="px-2 py-1 rounded-pill">
                              <FaCheckCircle className="me-1" /> Active
                            </Badge>
                          ) : (
                            <Badge bg="secondary" className="px-2 py-1 rounded-pill">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td>
                          {emp.role ? (
                            <Badge bg="light" text="dark" className="border px-2 py-1 rounded-pill">
                              <FaKey className="me-1" /> {emp.role.roleName || "Employee"}
                            </Badge>
                          ) : (
                            <span className="text-muted small">Not Assigned</span>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          {!hasAccount ? (
                            (isSystemAdmin || hasPermission("user.provision_account")) && (
                              <Button
                                variant="success"
                                size="sm"
                                className="rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                                onClick={() => handleOpenProvisionForEmployee(emp)}
                              >
                                <FaUserPlus /> Create Login Account
                              </Button>
                            )
                          ) : (
                            canManage && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                                onClick={() => handleOpenManageModal(emp)}
                              >
                                <FaCog /> Manage Account
                              </Button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
        </Card>
      )}

      {/* ========================================================
          MODAL: CREATE LOGIN ACCOUNT (PROVISIONING)
          ======================================================== */}
      <Modal
        show={showProvisionModal}
        onHide={() => setShowProvisionModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
            <FaUserPlus className="text-success" /> Provision Login Account
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleProvisionSubmit}>
          <Modal.Body className="p-4">
            <Card className="bg-light border-0 mb-3 p-3 rounded-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="fw-bold mb-0 text-dark">
                    {provisionTarget?.firstName} {provisionTarget?.lastName}
                  </h6>
                  <span className="extra-small text-muted">{provisionTarget?.email}</span>
                </div>
                <Badge bg="dark"><code>{provisionTarget?.employeeCode}</code></Badge>
              </div>
              <div className="extra-small text-muted mt-2">
                Department: <strong>{provisionTarget?.department || "General"}</strong> | Designation: <strong>{provisionTarget?.designation || "Employee"}</strong>
              </div>
            </Card>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Assign Allowed Role *</Form.Label>
              <Form.Select
                value={provisionForm.roleId}
                onChange={(e) => setProvisionForm({ ...provisionForm, roleId: e.target.value })}
                required
              >
                <option value="">-- Choose Role --</option>
                {assignableRoles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roleName} (Level {r.priority})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="extra-small text-muted">
                Available roles are strictly filtered based on your authorization level.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Initial Temporary Password *</Form.Label>
              <InputGroup>
                <Form.Control
                  type={provisionForm.showPass ? "text" : "password"}
                  value={provisionForm.password}
                  onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                  placeholder="Enter temporary password"
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setProvisionForm((p) => ({ ...p, showPass: !p.showPass }))}
                >
                  {provisionForm.showPass ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                id="hrProvisionActive"
                label="Activate account immediately"
                checked={provisionForm.isActive}
                onChange={(e) => setProvisionForm({ ...provisionForm, isActive: e.target.checked })}
                className="small fw-semibold"
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowProvisionModal(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={provisionLoading}>
              {provisionLoading ? "Provisioning..." : "Provision Login Account"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================
          MODAL: MANAGE ACCOUNT
          ======================================================== */}
      <Modal
        show={showManageModal}
        onHide={() => setShowManageModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
            <FaCog className="text-primary" /> Manage Employee Account
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleManageSubmit}>
          <Modal.Body className="p-4">
            <div className="mb-3 p-3 bg-light rounded-3">
              <h6 className="fw-bold mb-0 text-dark">
                {manageTarget?.firstName} {manageTarget?.lastName}
              </h6>
              <div className="extra-small text-muted">
                {manageTarget?.email} | <code>{manageTarget?.employeeCode}</code>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Assigned Role</Form.Label>
              <Form.Select
                value={manageForm.roleId}
                onChange={(e) => setManageForm({ ...manageForm, roleId: e.target.value })}
                required
              >
                <option value="">-- Choose Role --</option>
                {assignableRoles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roleName} (Level {r.priority})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Account Status</Form.Label>
                  <Form.Select
                    value={manageForm.isActive ? "true" : "false"}
                    onChange={(e) => setManageForm({ ...manageForm, isActive: e.target.value === "true" })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Access Lock</Form.Label>
                  <Form.Select
                    value={manageForm.isBlocked ? "true" : "false"}
                    onChange={(e) => setManageForm({ ...manageForm, isBlocked: e.target.value === "true" })}
                  >
                    <option value="false">Normal Access</option>
                    <option value="true">Blocked</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold">Reset Password (Optional)</Form.Label>
              <InputGroup>
                <Form.Control
                  type={manageForm.showPass ? "text" : "password"}
                  value={manageForm.newPassword}
                  onChange={(e) => setManageForm({ ...manageForm, newPassword: e.target.value })}
                  placeholder="Leave blank to keep existing"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setManageForm((p) => ({ ...p, showPass: !p.showPass }))}
                >
                  {manageForm.showPass ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowManageModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={provisionLoading}>
              {provisionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default HrOnboarding;