import React, { useState, useEffect, useCallback } from "react";
import { Container, Alert, Spinner, Modal, Button } from "react-bootstrap";
import { FaCheckCircle, FaExclamationTriangle, FaTrash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { fetchAllUsers } from "../../services/rbacService";
import {
  getEducationByUserId,
  createEducation,
  updateEducation,
  deleteEducation,
  verifyEducation,
} from "../../Api/Education/educationApi";

import EducationHeader from "../../Components/Education/EducationHeader";
import EducationSummary from "../../Components/Education/EducationSummary";
import SSLCSection from "../../Components/Education/SSLCSection";
import HSCSection from "../../Components/Education/HSCSection";
import ITISection from "../../Components/Education/ITISection";
import DiplomaSection from "../../Components/Education/DiplomaSection";
import UGSection from "../../Components/Education/UGSection";
import PGSection from "../../Components/Education/PGSection";
import PhDSection from "../../Components/Education/PhDSection";
import EducationVerification from "../../Components/Education/EducationVerification";
import EducationActions from "../../Components/Education/EducationActions";
import EducationViewProfile from "../../Components/Education/EducationViewProfile";

const initialEducationState = {
  _id: null,
  userId: "",
  // SSLC
  sslcSchoolName: "",
  sslcBoard: "",
  sslcYearOfPassing: "",
  sslcPercentage: "",
  sslcDocumentUrl: "",
  // HSC
  hscSchoolName: "",
  hscBoard: "",
  hscYearOfPassing: "",
  hscPercentage: "",
  hscDocumentUrl: "",
  // ITI
  itiinstituteName: "",
  iticourse: "",
  itiduration: "",
  itiyearOfPassing: "",
  itipercentage: "",
  itiDocumentUrl: "",
  // Diploma
  diplomainstitution: "",
  diplomacourse: "",
  diplomaduration: "",
  diplomayearOfPassing: "",
  diplomapercentage: "",
  diplomaDocumentUrl: "",
  // UG
  ugInstituteName: "",
  ugUniversityName: "",
  ugDegree: "",
  ugDepartmentCourse: "",
  ugYearOfPassing: "",
  ugCgpa: "",
  ugDocumentUrl: "",
  // PG
  pgInstituteName: "",
  pgUniversityName: "",
  pgDegree: "",
  pgDepartmentCourse: "",
  pgYearOfPassing: "",
  pgCgpa: "",
  pgDocumentUrl: "",
  // PhD
  phdInstituteName: "",
  phdUniversityName: "",
  phdResearchArea: "",
  phdYearOfPassing: "",
  phdDocumentUrl: "",
  // Meta / HR
  highestQualification: "UG",
  isVerified: false,
  remarks: "",
  documents: [],
};

function EducationManagement() {
  const { user: currentUser, isSystemAdmin, hasMenu } = useAuth();
  const isHrOrAdmin = isSystemAdmin || (hasMenu && (hasMenu("USER_MANAGEMENT") || hasMenu("ROLE_MANAGEMENT")));

  // ── States ──
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState(initialEducationState);
  const [docFiles, setDocFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [isExisting, setIsExisting] = useState(false);
  const [viewMode, setViewMode] = useState("form"); // "form" or "profile"

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState({
    iti: false,
    diploma: false,
    pg: false,
    phd: false,
  });

  // Loading & Alert States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Auto-dismiss alerts ──
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // ── 1. Load Employees list for HR / Admin ──
  useEffect(() => {
    const loadEmployees = async () => {
      if (isHrOrAdmin) {
        try {
          const res = await fetchAllUsers();
          const list = res?.users || res?.data || res || [];
          if (Array.isArray(list)) {
            setEmployees(list);
          }
        } catch (e) {
          console.warn("Employees load notice:", e.message);
        }
      }
    };
    loadEmployees();
  }, [isHrOrAdmin]);

  // Set initial selected user
  useEffect(() => {
    if (currentUser?._id || currentUser?.id) {
      const myId = currentUser._id || currentUser.id;
      if (!selectedUserId) {
        setSelectedUserId(myId);
      }
    }
  }, [currentUser, selectedUserId]);

  // Update current employee object when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const found = employees.find((e) => (e._id || e.id) === selectedUserId);
      if (found) {
        setCurrentEmployee(found);
      } else if (currentUser && (currentUser._id === selectedUserId || currentUser.id === selectedUserId)) {
        setCurrentEmployee(currentUser);
      }
    }
  }, [selectedUserId, employees, currentUser]);

  // ── 2. Load Education data for Selected User ──
  const loadEducationData = useCallback(async () => {
    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getEducationByUserId(selectedUserId);

      if (data && typeof data === "object") {
        setFormData({
          _id: data._id || data.id || null,
          userId: selectedUserId,
          // SSLC
          sslcSchoolName: data.sslcSchoolName || "",
          sslcBoard: data.sslcBoard || "",
          sslcYearOfPassing: data.sslcYearOfPassing || "",
          sslcPercentage: data.sslcPercentage || "",
          sslcDocumentUrl: data.sslcDocumentUrl || data.sslcDocument || "",
          // HSC
          hscSchoolName: data.hscSchoolName || "",
          hscBoard: data.hscBoard || "",
          hscYearOfPassing: data.hscYearOfPassing || "",
          hscPercentage: data.hscPercentage || "",
          hscDocumentUrl: data.hscDocumentUrl || data.hscDocument || "",
          // ITI
          itiinstituteName: data.itiinstituteName || "",
          iticourse: data.iticourse || "",
          itiduration: data.itiduration || "",
          itiyearOfPassing: data.itiyearOfPassing || "",
          itipercentage: data.itipercentage || "",
          itiDocumentUrl: data.itiDocumentUrl || data.itiDocument || "",
          // Diploma
          diplomainstitution: data.diplomainstitution || "",
          diplomacourse: data.diplomacourse || "",
          diplomaduration: data.diplomaduration || "",
          diplomayearOfPassing: data.diplomayearOfPassing || "",
          diplomapercentage: data.diplomapercentage || "",
          diplomaDocumentUrl: data.diplomaDocumentUrl || data.diplomaDocument || "",
          // UG
          ugInstituteName: data.ugInstituteName || "",
          ugUniversityName: data.ugUniversityName || "",
          ugDegree: data.ugDegree || "",
          ugDepartmentCourse: data.ugDepartmentCourse || "",
          ugYearOfPassing: data.ugYearOfPassing || "",
          ugCgpa: data.ugCgpa || "",
          ugDocumentUrl: data.ugDocumentUrl || data.ugDocument || "",
          // PG
          pgInstituteName: data.pgInstituteName || "",
          pgUniversityName: data.pgUniversityName || "",
          pgDegree: data.pgDegree || "",
          pgDepartmentCourse: data.pgDepartmentCourse || "",
          pgYearOfPassing: data.pgYearOfPassing || "",
          pgCgpa: data.pgCgpa || "",
          pgDocumentUrl: data.pgDocumentUrl || data.pgDocument || "",
          // PhD
          phdInstituteName: data.phdInstituteName || "",
          phdUniversityName: data.phdUniversityName || "",
          phdResearchArea: data.phdResearchArea || "",
          phdYearOfPassing: data.phdYearOfPassing || "",
          phdDocumentUrl: data.phdDocumentUrl || data.phdDocument || "",
          // Meta / HR
          highestQualification: data.highestQualification || "UG",
          isVerified: data.isVerified === true,
          remarks: data.remarks || "",
          documents: data.documents || [],
        });

        setIsExisting(true);

        // Auto expand optional sections if they contain data
        setExpandedSections({
          iti: Boolean(data.itiinstituteName || data.iticourse),
          diploma: Boolean(data.diplomainstitution || data.diplomacourse),
          pg: Boolean(data.pgInstituteName || data.pgDegree),
          phd: Boolean(data.phdInstituteName || data.phdResearchArea),
        });
      } else {
        // No education record found -> reset to clean state
        setFormData({
          ...initialEducationState,
          userId: selectedUserId,
        });
        setIsExisting(false);
        setExpandedSections({
          iti: false,
          diploma: false,
          pg: false,
          phd: false,
        });
      }
      setDocFiles({});
      setErrors({});
    } catch (err) {
      console.warn("Education load notice:", err.message);
      setIsExisting(false);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    loadEducationData();
  }, [loadEducationData]);

  // ── Field Change Handlers ──
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleFileChange = (slot, file) => {
    setDocFiles((prev) => ({
      ...prev,
      [slot]: file,
    }));
  };

  const handleFileRemove = (slot) => {
    setDocFiles((prev) => {
      const updated = { ...prev };
      delete updated[slot];
      return updated;
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearSection = (section) => {
    if (section === "iti") {
      setFormData((prev) => ({
        ...prev,
        itiinstituteName: "",
        iticourse: "",
        itiduration: "",
        itiyearOfPassing: "",
        itipercentage: "",
        itiDocumentUrl: "",
      }));
      handleFileRemove("itiDocument");
    } else if (section === "diploma") {
      setFormData((prev) => ({
        ...prev,
        diplomainstitution: "",
        diplomacourse: "",
        diplomaduration: "",
        diplomayearOfPassing: "",
        diplomapercentage: "",
        diplomaDocumentUrl: "",
      }));
      handleFileRemove("diplomaDocument");
    } else if (section === "pg") {
      setFormData((prev) => ({
        ...prev,
        pgInstituteName: "",
        pgUniversityName: "",
        pgDegree: "",
        pgDepartmentCourse: "",
        pgYearOfPassing: "",
        pgCgpa: "",
        pgDocumentUrl: "",
      }));
      handleFileRemove("pgDocument");
    } else if (section === "phd") {
      setFormData((prev) => ({
        ...prev,
        phdInstituteName: "",
        phdUniversityName: "",
        phdResearchArea: "",
        phdYearOfPassing: "",
        phdDocumentUrl: "",
      }));
      handleFileRemove("phdDocument");
    }
  };

  // ── Form Validation ──
  const validateForm = () => {
    const errs = {};
    const currentYear = new Date().getFullYear();

    // 1. SSLC Validations
    if (!formData.sslcSchoolName?.trim()) errs.sslcSchoolName = "School Name is required";
    if (!formData.sslcBoard?.trim()) errs.sslcBoard = "Board is required";
    if (!formData.sslcYearOfPassing) {
      errs.sslcYearOfPassing = "Passing Year is required";
    } else if (formData.sslcYearOfPassing < 1960 || formData.sslcYearOfPassing > currentYear) {
      errs.sslcYearOfPassing = `Enter a valid year between 1960 and ${currentYear}`;
    }
    if (formData.sslcPercentage === "" || formData.sslcPercentage === null) {
      errs.sslcPercentage = "Percentage is required";
    } else if (Number(formData.sslcPercentage) < 0 || Number(formData.sslcPercentage) > 100) {
      errs.sslcPercentage = "Percentage must be between 0 and 100";
    }

    // 2. HSC Validations
    if (!formData.hscSchoolName?.trim()) errs.hscSchoolName = "School / College Name is required";
    if (!formData.hscBoard?.trim()) errs.hscBoard = "Board is required";
    if (!formData.hscYearOfPassing) {
      errs.hscYearOfPassing = "Passing Year is required";
    } else if (formData.hscYearOfPassing < 1960 || formData.hscYearOfPassing > currentYear) {
      errs.hscYearOfPassing = `Enter a valid year between 1960 and ${currentYear}`;
    }
    if (formData.hscPercentage === "" || formData.hscPercentage === null) {
      errs.hscPercentage = "Percentage is required";
    } else if (Number(formData.hscPercentage) < 0 || Number(formData.hscPercentage) > 100) {
      errs.hscPercentage = "Percentage must be between 0 and 100";
    }

    // 3. UG Validations
    if (!formData.ugInstituteName?.trim()) errs.ugInstituteName = "Institute Name is required";
    if (!formData.ugUniversityName?.trim()) errs.ugUniversityName = "University Name is required";
    if (!formData.ugDegree?.trim()) errs.ugDegree = "Degree is required";
    if (!formData.ugDepartmentCourse?.trim()) errs.ugDepartmentCourse = "Department / Course is required";
    if (!formData.ugYearOfPassing) {
      errs.ugYearOfPassing = "Passing Year is required";
    } else if (formData.ugYearOfPassing < 1960 || formData.ugYearOfPassing > currentYear + 4) {
      errs.ugYearOfPassing = `Enter a valid year between 1960 and ${currentYear + 4}`;
    }
    if (formData.ugCgpa === "" || formData.ugCgpa === null) {
      errs.ugCgpa = "CGPA is required";
    } else if (Number(formData.ugCgpa) < 0 || Number(formData.ugCgpa) > 10) {
      errs.ugCgpa = "CGPA must be between 0 and 10";
    }

    // 4. Optional ITI Validations (if started)
    if (formData.itipercentage && (Number(formData.itipercentage) < 0 || Number(formData.itipercentage) > 100)) {
      errs.itipercentage = "Percentage must be between 0 and 100";
    }

    // 5. Optional Diploma Validations (if started)
    if (formData.diplomapercentage && (Number(formData.diplomapercentage) < 0 || Number(formData.diplomapercentage) > 100)) {
      errs.diplomapercentage = "Percentage must be between 0 and 100";
    }

    // 6. Optional PG Validations (if started)
    if (formData.pgCgpa && (Number(formData.pgCgpa) < 0 || Number(formData.pgCgpa) > 10)) {
      errs.pgCgpa = "CGPA must be between 0 and 10";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save / Update Handler ──
  const handleSaveEducation = async () => {
    if (!validateForm()) {
      setErrorMsg("Please correct the validation errors highlighted in red.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = new FormData();
      payload.append("userId", selectedUserId);
      if (currentEmployee?._id || currentEmployee?.id) {
        payload.append("employeeId", currentEmployee._id || currentEmployee.id);
      }

      // SSLC
      payload.append("sslcSchoolName", formData.sslcSchoolName || "");
      payload.append("sslcBoard", formData.sslcBoard || "");
      payload.append("sslcYearOfPassing", String(formData.sslcYearOfPassing || ""));
      payload.append("sslcPercentage", String(formData.sslcPercentage || ""));

      // HSC
      payload.append("hscSchoolName", formData.hscSchoolName || "");
      payload.append("hscBoard", formData.hscBoard || "");
      payload.append("hscYearOfPassing", String(formData.hscYearOfPassing || ""));
      payload.append("hscPercentage", String(formData.hscPercentage || ""));

      // ITI
      payload.append("itiinstituteName", formData.itiinstituteName || "");
      payload.append("iticourse", formData.iticourse || "");
      payload.append("itiduration", formData.itiduration || "");
      payload.append("itiyearOfPassing", String(formData.itiyearOfPassing || ""));
      payload.append("itipercentage", String(formData.itipercentage || ""));

      // Diploma
      payload.append("diplomainstitution", formData.diplomainstitution || "");
      payload.append("diplomacourse", formData.diplomacourse || "");
      payload.append("diplomaduration", formData.diplomaduration || "");
      payload.append("diplomayearOfPassing", String(formData.diplomayearOfPassing || ""));
      payload.append("diplomapercentage", String(formData.diplomapercentage || ""));

      // UG
      payload.append("ugInstituteName", formData.ugInstituteName || "");
      payload.append("ugUniversityName", formData.ugUniversityName || "");
      payload.append("ugDegree", formData.ugDegree || "");
      payload.append("ugDepartmentCourse", formData.ugDepartmentCourse || "");
      payload.append("ugYearOfPassing", String(formData.ugYearOfPassing || ""));
      payload.append("ugCgpa", String(formData.ugCgpa || ""));

      // PG
      payload.append("pgInstituteName", formData.pgInstituteName || "");
      payload.append("pgUniversityName", formData.pgUniversityName || "");
      payload.append("pgDegree", formData.pgDegree || "");
      payload.append("pgDepartmentCourse", formData.pgDepartmentCourse || "");
      payload.append("pgYearOfPassing", String(formData.pgYearOfPassing || ""));
      payload.append("pgCgpa", String(formData.pgCgpa || ""));

      // PhD
      payload.append("phdInstituteName", formData.phdInstituteName || "");
      payload.append("phdUniversityName", formData.phdUniversityName || "");
      payload.append("phdResearchArea", formData.phdResearchArea || "");
      payload.append("phdYearOfPassing", String(formData.phdYearOfPassing || ""));

      // Highest Qualification & Verification
      payload.append("highestQualification", formData.highestQualification || "UG");
      payload.append("isVerified", String(formData.isVerified === true));
      payload.append("remarks", formData.remarks || "");

      // Append multipart files
      if (docFiles.sslcDocument) payload.append("sslcDocument", docFiles.sslcDocument);
      if (docFiles.hscDocument) payload.append("hscDocument", docFiles.hscDocument);
      if (docFiles.itiDocument) payload.append("itiDocument", docFiles.itiDocument);
      if (docFiles.diplomaDocument) payload.append("diplomaDocument", docFiles.diplomaDocument);
      if (docFiles.ugDocument) payload.append("ugDocument", docFiles.ugDocument);
      if (docFiles.pgDocument) payload.append("pgDocument", docFiles.pgDocument);
      if (docFiles.phdDocument) payload.append("phdDocument", docFiles.phdDocument);

      if (isExisting && (formData.userId || formData._id)) {
        await updateEducation(formData.userId || formData._id, payload);
        setSuccessMsg("Academic Education record updated successfully!");
      } else {
        await createEducation(payload);
        setSuccessMsg("Academic Education record saved successfully!");
      }

      setIsExisting(true);
      await loadEducationData();
    } catch (err) {
      console.error("Save Education Error:", err);
      setErrorMsg(err.message || "Failed to save education details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Verification Handler ──
  const handleToggleVerification = async () => {
    if (!isHrOrAdmin) return;
    const newStatus = !formData.isVerified;
    setSavingVerification(true);
    try {
      if (formData._id) {
        await verifyEducation(formData._id, {
          isVerified: newStatus,
          remarks: formData.remarks,
        });
      }
      setFormData((prev) => ({ ...prev, isVerified: newStatus }));
      setSuccessMsg(newStatus ? "Education verified successfully!" : "Verification revoked.");
    } catch (err) {
      setErrorMsg(err.message || "Failed to update verification status.");
    } finally {
      setSavingVerification(false);
    }
  };

  // ── Delete Handler ──
  const handleDeleteEducation = async () => {
    if (!formData._id) return;
    setSaving(true);
    try {
      await deleteEducation(formData._id);
      setSuccessMsg("Education record deleted successfully.");
      setShowDeleteModal(false);
      await loadEducationData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete education record.");
    } finally {
      setSaving(false);
    }
  };

  // ── Compute Statistics ──
  const totalQualifications = [
    Boolean(formData.sslcSchoolName?.trim()),
    Boolean(formData.hscSchoolName?.trim()),
    Boolean(formData.itiinstituteName?.trim()),
    Boolean(formData.diplomainstitution?.trim()),
    Boolean(formData.ugInstituteName?.trim()),
    Boolean(formData.pgInstituteName?.trim()),
    Boolean(formData.phdInstituteName?.trim()),
  ].filter(Boolean).length;

  const attachedDocsCount = [
    Boolean(docFiles.sslcDocument || formData.sslcDocumentUrl || formData.sslcDocument),
    Boolean(docFiles.hscDocument || formData.hscDocumentUrl || formData.hscDocument),
    Boolean(docFiles.itiDocument || formData.itiDocumentUrl || formData.itiDocument),
    Boolean(docFiles.diplomaDocument || formData.diplomaDocumentUrl || formData.diplomaDocument),
    Boolean(docFiles.ugDocument || formData.ugDocumentUrl || formData.ugDocument),
    Boolean(docFiles.pgDocument || formData.pgDocumentUrl || formData.pgDocument),
    Boolean(docFiles.phdDocument || formData.phdDocumentUrl || formData.phdDocument),
  ].filter(Boolean).length;

  return (
    <Container fluid className="py-2 px-lg-4 px-md-3 px-2">
      {/* 1. Header with Employee Switcher & View Mode Toggle */}
      <EducationHeader
        employees={employees}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        currentEmployee={currentEmployee}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onRefresh={loadEducationData}
        loading={loading}
        isHrOrAdmin={isHrOrAdmin}
      />

      {/* 2. Global Feedback Notifications */}
      {successMsg && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMsg("")}
          className="rounded-3 shadow-xs border-success d-flex align-items-center gap-2 mb-4"
        >
          <FaCheckCircle className="text-success flex-shrink-0" />
          <span className="small fw-semibold">{successMsg}</span>
        </Alert>
      )}

      {errorMsg && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setErrorMsg("")}
          className="rounded-3 shadow-xs border-danger d-flex align-items-center gap-2 mb-4"
        >
          <FaExclamationTriangle className="text-danger flex-shrink-0" />
          <span className="small fw-semibold">{errorMsg}</span>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" style={{ width: 40, height: 40 }} />
          <p className="text-muted small mt-2">Loading Academic Records...</p>
        </div>
      ) : viewMode === "profile" ? (
        /* 3. Read-Only Employee Profile View */
        <EducationViewProfile
          data={formData}
          onEditClick={() => setViewMode("form")}
          isHrOrAdmin={isHrOrAdmin}
        />
      ) : (
        /* 4. Interactive Form Mode */
        <div>
          {/* Education Summary Strip */}
          <EducationSummary
            highestQualification={formData.highestQualification}
            isVerified={formData.isVerified}
            remarks={formData.remarks}
            stats={{
              totalQualifications,
              attachedDocsCount,
            }}
          />

          {/* Academic Qualifications Section */}
          <div className="mb-4">
            <h5 className="fw-bold text-dark mb-1">Academic Qualifications</h5>
            <p className="text-muted small mb-3">
              Fill in formal schooling, technical certifications, bachelor's, master's, and doctoral details.
            </p>

            {/* SSLC Section (Mandatory) */}
            <SSLCSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              file={docFiles.sslcDocument}
              onFileChange={(f) => handleFileChange("sslcDocument", f)}
              onFileRemove={() => handleFileRemove("sslcDocument")}
            />

            {/* HSC Section (Mandatory) */}
            <HSCSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              file={docFiles.hscDocument}
              onFileChange={(f) => handleFileChange("hscDocument", f)}
              onFileRemove={() => handleFileRemove("hscDocument")}
            />

            {/* ITI Section (Optional Expandable) */}
            <ITISection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              file={docFiles.itiDocument}
              onFileChange={(f) => handleFileChange("itiDocument", f)}
              onFileRemove={() => handleFileRemove("itiDocument")}
              isOpen={expandedSections.iti}
              onToggle={() => toggleSection("iti")}
              onClear={() => clearSection("iti")}
            />

            {/* Diploma Section (Optional Expandable) */}
            <DiplomaSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              file={docFiles.diplomaDocument}
              onFileChange={(f) => handleFileChange("diplomaDocument", f)}
              onFileRemove={() => handleFileRemove("diplomaDocument")}
              isOpen={expandedSections.diploma}
              onToggle={() => toggleSection("diploma")}
              onClear={() => clearSection("diploma")}
            />

            {/* Undergraduate (UG) Section (Mandatory) */}
            <UGSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              file={docFiles.ugDocument}
              onFileChange={(f) => handleFileChange("ugDocument", f)}
              onFileRemove={() => handleFileRemove("ugDocument")}
            />

            {/* Postgraduate (PG) Section (Optional Expandable) */}
            <PGSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              file={docFiles.pgDocument}
              onFileChange={(f) => handleFileChange("pgDocument", f)}
              onFileRemove={() => handleFileRemove("pgDocument")}
              isOpen={expandedSections.pg}
              onToggle={() => toggleSection("pg")}
              onClear={() => clearSection("pg")}
            />

            {/* PhD Section (Optional Expandable) */}
            <PhDSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              file={docFiles.phdDocument}
              onFileChange={(f) => handleFileChange("phdDocument", f)}
              onFileRemove={() => handleFileRemove("phdDocument")}
              isOpen={expandedSections.phd}
              onToggle={() => toggleSection("phd")}
              onClear={() => clearSection("phd")}
            />
          </div>

          {/* Verification & Remarks */}
          <EducationVerification
            isVerified={formData.isVerified}
            remarks={formData.remarks}
            onChangeRemarks={(val) => handleFieldChange("remarks", val)}
            onToggleVerification={handleToggleVerification}
            isHrOrAdmin={isHrOrAdmin}
            savingVerification={savingVerification}
          />

          {/* Action Buttons */}
          <EducationActions
            isExisting={isExisting}
            saving={saving}
            onSave={handleSaveEducation}
            onCancel={loadEducationData}
            onDelete={() => setShowDeleteModal(true)}
            canDelete={isHrOrAdmin && isExisting}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="rounded-4"
      >
        <Modal.Header closeButton className="p-3 border-bottom">
          <Modal.Title className="h6 fw-bold text-danger mb-0">
            <FaTrash className="me-2" /> Confirm Education Record Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3.5">
          <p className="small text-dark mb-2">
            Are you sure you want to permanently delete the entire academic education record for this employee?
          </p>
          <p className="extra-small text-danger mb-0">
            This will remove SSLC, HSC, Degrees, and all linked certificate documents from the HRMS database.
          </p>
        </Modal.Body>
        <Modal.Footer className="p-2.5 border-top">
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-pill px-3 extra-small"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="rounded-pill px-3 extra-small fw-semibold"
            onClick={handleDeleteEducation}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Yes, Delete Record"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default EducationManagement;
