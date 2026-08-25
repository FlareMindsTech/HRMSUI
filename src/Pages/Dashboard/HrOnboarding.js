import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Image,
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
  FaTasks,
  FaLaptop,
  FaShieldAlt,
  FaSyncAlt,
  FaSearch,
  FaTimesCircle,
  FaPlus,
  FaTrash,
  FaCheck,
  FaTimes,
  FaLock,
  FaUnlock,
  FaClock,
  FaBuilding,
  FaMoneyCheckAlt,
  FaCreditCard,
  FaUniversity,
  FaFileContract,
  FaEdit,
  FaSave,
  FaCamera,
  FaFileUpload,
  FaDesktop,
  FaMobileAlt,
  FaTv,
  FaKeyboard,
  FaCar,
  FaBox,
  FaExchangeAlt,
  FaUndoAlt,
  FaBarcode,
  FaRedo,
  FaChevronDown,
  FaExternalLinkAlt,
  FaFilePdf,
  FaFileImage,
  FaDownload,
  FaUpload,
} from "react-icons/fa";
import { MdDevices } from "react-icons/md";
import { createEducation, getEducationByUserId, updateEducation } from "../../Api/Education/educationApi";
import EducationSummary from "../../Components/Education/EducationSummary";
import SSLCSection from "../../Components/Education/SSLCSection";
import HSCSection from "../../Components/Education/HSCSection";
import ITISection from "../../Components/Education/ITISection";
import DiplomaSection from "../../Components/Education/DiplomaSection";
import UGSection from "../../Components/Education/UGSection";
import PGSection from "../../Components/Education/PGSection";
import PhDSection from "../../Components/Education/PhDSection";
import DocumentSummary from "../../Components/Document/DocumentSummary";
import BankDetailsCard from "../../Components/Document/BankDetailsCard";
import StatutoryDetailsCard from "../../Components/Document/StatutoryDetailsCard";
import IdentityDetailsCard from "../../Components/Document/IdentityDetailsCard";
import { addExperienceApi, getExperienceByUserId } from "../../Api/Experience/experienceApi";
import { createDocumentApi } from "../../Api/Document/documentApi";
import {
  fetchOnboardings,
  fetchOnboardingById,
  fetchUserById,
  fetchEmployeeInfo,
  createCurrentCompanyApi,
  fetchCurrentCompanyByUserId,
  createAddressApi,
  fetchAddressByEmployeeId,
  createFamilyApi,
  fetchFamilyByUserId,
  registerUserWithFiles,
  initiateOnboarding,
  updateEmployeeInfo,
  updateEmployment,
  updatePayroll,
  fetchOnboardingDocuments,
  verifyOnboardingDocument,
  rejectOnboardingDocument,
  uploadOnboardingDocument,
  uploadCandidateProfilePic,
  uploadProfessionalDocument,
  uploadEducationCertificate,
  uploadExperienceDocument,
  uploadBankPassbook,
  fetchOnboardingTasks,
  addOnboardingTask,
  updateOnboardingTask,
  deleteOnboardingTask,
  fetchOnboardingAssets,
  assignOnboardingAsset,
  unassignOnboardingAsset,
  fetchOnboardingAccess,
  addOnboardingAccess,
  updateOnboardingAccess,
  fetchOnboardingTraining,
  addOnboardingTraining,
  updateOnboardingTraining,
  fetchOnboardingAgreements,
  addOnboardingAgreement,
  acknowledgeOnboardingAgreement,
  validateOnboarding,
  completeOnboarding,
  activateEmployee,
  provisionOnboardingAccount,
  enableLogin,
  disableLogin,
} from "../../Api/Hr/hr";
import {
  fetchAllUsers,
  fetchAssignableRoles,
  provisionUserAccount,
  updateAccountStatus,
  resetAccountCredentials,
  assignUserRole,
} from "../../services/rbacService";
import { getAssets, createAsset, assignAsset, returnAsset } from "../../services/assetService";
import { useAuth } from "../../context/AuthContext";

/**
 * Safe Array normalizer
 */
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  if (Array.isArray(val.documents)) return val.documents;
  if (Array.isArray(val.tasks)) return val.tasks;
  if (Array.isArray(val.missingRequirements)) return val.missingRequirements;
  return [];
};

/**
 * All 28 States and 8 Union Territories of India
 */
const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

/**
 * Searchable State Dropdown Component
 */
const StateSearchDropdown = ({ value, onChange, placeholder = "Select State" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredStates = INDIAN_STATES_AND_UTS.filter((st) =>
    st.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="position-relative w-100" ref={dropdownRef}>
      <div
        className="form-control form-control-sm d-flex align-items-center justify-content-between bg-white"
        style={{
          fontSize: "0.825rem",
          minHeight: "33px",
          borderRadius: "8px",
          borderColor: isOpen ? "#2DC58A" : "#ced4da",
          boxShadow: isOpen ? "0 0 0 3px rgba(45, 197, 138, 0.15)" : "none",
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm("");
        }}
      >
        <span className={value ? "text-dark fw-medium text-truncate" : "text-muted text-truncate"}>
          {value || placeholder}
        </span>
        <FaChevronDown
          size={10}
          className="text-muted ms-2 flex-shrink-0"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </div>

      {isOpen && (
        <div
          className="position-absolute bg-white border rounded-3 shadow-lg mt-1 p-2"
          style={{
            zIndex: 1060,
            minWidth: "240px",
            width: "100%",
            left: 0,
            maxHeight: "260px",
            display: "flex",
            flexDirection: "column",
            borderColor: "rgba(0,0,0,0.12)",
          }}
        >
          <div className="mb-2 position-relative">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted ps-2.5 pe-1.5 py-1">
                <FaSearch size={10} />
              </span>
              <input
                type="text"
                className="form-control form-control-sm bg-light border-start-0 shadow-none ps-1 py-1"
                autoFocus
                placeholder="Type to filter state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: "0.785rem" }}
              />
              {searchTerm && (
                <span
                  className="input-group-text bg-light border-start-0 text-muted cursor-pointer pe-2 py-1"
                  style={{ fontSize: "0.75rem", cursor: "pointer" }}
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              overflowY: "auto",
              maxHeight: "175px",
              paddingRight: "2px",
            }}
          >
            {filteredStates.length > 0 ? (
              filteredStates.map((st) => {
                const isSelected = value === st;
                return (
                  <div
                    key={st}
                    className="d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded-2 mb-0.5"
                    style={{
                      fontSize: "0.8rem",
                      backgroundColor: isSelected ? "rgba(45, 197, 138, 0.12)" : "transparent",
                      color: isSelected ? "#065f46" : "#1e293b",
                      fontWeight: isSelected ? "600" : "400",
                      transition: "background-color 0.15s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => {
                      onChange(st);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <span>{st}</span>
                    {isSelected && <FaCheck size={10} className="text-success" />}
                  </div>
                );
              })
            ) : (
              <div className="text-muted text-center py-3 extra-small">
                No matching states found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Helper to convert Education data (object with SSLC/HSC/UG/PG/PhD or array) into qualification rows
 */
const parseEducationToQualificationList = (rawEdu, dbEduRecord = null) => {
  if (!rawEdu && !dbEduRecord) return [];
  const eduSource = dbEduRecord || (typeof rawEdu === "object" && !Array.isArray(rawEdu) ? rawEdu : null);

  const getDocFromDb = (degName) => {
    if (!eduSource) return "";
    const d = (degName || "").toLowerCase();
    if (d.includes("sslc") || d.includes("10th")) {
      return eduSource.sslcDocumentUrl || eduSource.sslcDocument || eduSource.sslcDoc || eduSource.sslcCertificate || eduSource.sslcFile || eduSource.sslcFileUrl || "";
    }
    if (d.includes("hsc") || d.includes("12th") || d.includes("+2")) {
      return eduSource.hscDocumentUrl || eduSource.hscDocument || eduSource.hscDoc || eduSource.hscCertificate || eduSource.hscFile || eduSource.hscFileUrl || "";
    }
    if (d.includes("iti")) {
      return eduSource.itiDocumentUrl || eduSource.itiDocument || eduSource.itiDoc || eduSource.itiCertificate || eduSource.itiFile || "";
    }
    if (d.includes("diploma")) {
      return eduSource.diplomaDocumentUrl || eduSource.diplomaDocument || eduSource.diplomaDoc || eduSource.diplomaCertificate || "";
    }
    if (d.includes("ug") || d.includes("bachelor") || d.includes("btech") || d.includes("b.") || d.includes("bsc") || d.includes("bca") || d.includes("bcom") || d.includes("be") || d.includes("engineering") || d.includes("degree")) {
      return eduSource.ugDocumentUrl || eduSource.ugDocument || eduSource.ugDoc || eduSource.ugCertificate || eduSource.ugFile || eduSource.ugFileUrl || "";
    }
    if (d.includes("pg") || d.includes("master") || d.includes("mtech") || d.includes("m.") || d.includes("mca") || d.includes("mba") || d.includes("msc") || d.includes("me")) {
      return eduSource.pgDocumentUrl || eduSource.pgDocument || eduSource.pgDoc || eduSource.pgCertificate || eduSource.pgFile || eduSource.pgFileUrl || "";
    }
    if (d.includes("phd") || d.includes("doctor")) {
      return eduSource.phdDocumentUrl || eduSource.phdDocument || eduSource.phdDoc || eduSource.phdCertificate || eduSource.phdFile || "";
    }
    return "";
  };

  if (Array.isArray(rawEdu) && rawEdu.length > 0) {
    return rawEdu
      .filter((e) => e && (e.degree || e.stream || e.university || e.percentage || e.yearOfPassing || e.year || e.cgpa))
      .map((ed) => ({
        degree: ed.degree || "Qualification",
        stream: ed.stream || ed.specialization || ed.course || "General",
        university: ed.university || ed.college || ed.schoolName || ed.instituteName || "—",
        percentage: ed.percentage
          ? (String(ed.percentage).includes("%") || String(ed.percentage).includes("CGPA") ? String(ed.percentage) : `${ed.percentage}%`)
          : (ed.cgpa ? `${ed.cgpa} CGPA` : "—"),
        yearOfPassing: ed.yearOfPassing || ed.year || "—",
        certificateUrl: ed.certificateUrl || ed.fileUrl || ed.docUrl || ed.url || ed.documentUrl || ed.filePath || ed.path || ed.certificate || ed.certificateDoc || (typeof ed.file === "string" ? ed.file : "") || getDocFromDb(ed.degree),
      }));
  }

  const list = [];
  const obj = eduSource || rawEdu || {};
  if (obj.sslcSchoolName || obj.sslcPercentage || obj.sslcYearOfPassing || obj.sslcDocument || obj.sslcDocumentUrl) {
    list.push({
      degree: "SSLC / 10th",
      stream: obj.sslcBoard || "General",
      university: obj.sslcSchoolName || "—",
      percentage: obj.sslcPercentage ? `${obj.sslcPercentage}%` : "—",
      yearOfPassing: obj.sslcYearOfPassing || "—",
      certificateUrl: obj.sslcDocumentUrl || obj.sslcDocument || obj.sslcCertificate || obj.sslcDoc || obj.sslcFile || obj.sslcFileUrl || "",
    });
  }
  if (obj.hscSchoolName || obj.hscPercentage || obj.hscYearOfPassing || obj.hscDocument || obj.hscDocumentUrl) {
    list.push({
      degree: "HSC / 12th",
      stream: obj.hscBoard || "General",
      university: obj.hscSchoolName || "—",
      percentage: obj.hscPercentage ? `${obj.hscPercentage}%` : "—",
      yearOfPassing: obj.hscYearOfPassing || "—",
      certificateUrl: obj.hscDocumentUrl || obj.hscDocument || obj.hscCertificate || obj.hscDoc || obj.hscFile || obj.hscFileUrl || "",
    });
  }
  if (obj.itiinstituteName || obj.iticourse || obj.itiDocument || obj.itiDocumentUrl) {
    list.push({
      degree: "ITI",
      stream: obj.iticourse || "Technical",
      university: obj.itiinstituteName || "—",
      percentage: obj.itipercentage ? `${obj.itipercentage}%` : "—",
      yearOfPassing: obj.itiyearOfPassing || "—",
      certificateUrl: obj.itiDocumentUrl || obj.itiDocument || obj.itiCertificate || obj.itiDoc || obj.itiFile || "",
    });
  }
  if (obj.diplomainstitution || obj.diplomacourse || obj.diplomaDocument || obj.diplomaDocumentUrl) {
    list.push({
      degree: "Diploma",
      stream: obj.diplomacourse || "General",
      university: obj.diplomainstitution || "—",
      percentage: obj.diplomapercentage ? `${obj.diplomapercentage}%` : "—",
      yearOfPassing: obj.diplomayearOfPassing || "—",
      certificateUrl: obj.diplomaDocumentUrl || obj.diplomaDocument || obj.diplomaCertificate || obj.diplomaDoc || "",
    });
  }
  if (obj.ugDegree || obj.ugInstituteName || obj.ugUniversityName || obj.ugDocument || obj.ugDocumentUrl) {
    list.push({
      degree: obj.ugDegree || "UG Degree",
      stream: obj.ugDepartmentCourse || "General",
      university: obj.ugInstituteName || obj.ugUniversityName || "—",
      percentage: obj.ugCgpa ? `${obj.ugCgpa} CGPA` : (obj.ugPercentage ? `${obj.ugPercentage}%` : "—"),
      yearOfPassing: obj.ugYearOfPassing || "—",
      certificateUrl: obj.ugDocumentUrl || obj.ugDocument || obj.ugCertificate || obj.ugDoc || obj.ugFile || obj.ugFileUrl || "",
    });
  }
  if (obj.pgDegree || obj.pgInstituteName || obj.pgUniversityName || obj.pgDocument || obj.pgDocumentUrl) {
    list.push({
      degree: obj.pgDegree || "PG Degree",
      stream: obj.pgDepartmentCourse || "General",
      university: obj.pgInstituteName || obj.pgUniversityName || "—",
      percentage: obj.pgCgpa ? `${obj.pgCgpa} CGPA` : (obj.pgPercentage ? `${obj.pgPercentage}%` : "—"),
      yearOfPassing: obj.pgYearOfPassing || "—",
      certificateUrl: obj.pgDocumentUrl || obj.pgDocument || obj.pgCertificate || obj.pgDoc || obj.pgFile || obj.pgFileUrl || "",
    });
  }
  if (obj.phdInstituteName || obj.phdResearchArea || obj.phdDocument || obj.phdDocumentUrl) {
    list.push({
      degree: "PhD",
      stream: obj.phdResearchArea || "Research",
      university: obj.phdInstituteName || obj.phdUniversityName || "—",
      percentage: "—",
      yearOfPassing: obj.phdYearOfPassing || "—",
      certificateUrl: obj.phdDocumentUrl || obj.phdDocument || obj.phdCertificate || obj.phdDoc || "",
    });
  }
  if (Array.isArray(obj.documents) && obj.documents.length > 0 && list.length === 0) {
    obj.documents.forEach((d) => {
      list.push({
        degree: d.qualification || "Certificate",
        stream: "General",
        university: d.fileName || "Uploaded Certificate",
        percentage: "—",
        yearOfPassing: "—",
        certificateUrl: d.fileUrl || d.url || d.path || d.filePath || "",
      });
    });
  }
  return list;
};

function HrOnboarding() {
  const { hasPermission, isSystemAdmin, user: currentUser, refreshAuthContext } = useAuth();

  // ── Top Level View: "pipeline" | "onboard" | "directory" ──
  const [viewTab, setViewTab] = useState("pipeline");

  // ── Onboarding Records Pipeline State ──
  const [onboardings, setOnboardings] = useState([]);
  const [loadingPipeline, setLoadingPipeline] = useState(false);
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState("ALL");

  // ── Directory & Roles State ──
  const [employees, setEmployees] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // ── Initiate Multi-Step Form State ──
  const [activeFormTab, setActiveFormTab] = useState("personal");
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    dob: "",
    gender: "Male",
    marriageStatus: "Unmarried",
    mobileNo: "",
    department: "",
    designation: "",
    joiningDate: new Date().toISOString().split("T")[0],
    employmentType: "FULL_TIME",
    roleId: "",
    password: "Welcome@123",
    bloodGroup: "O+",
    employeeCode: "",
    hasLoginAccess: true,
    skills: [],
    isFresher: false,
    // Optional Profile Picture Upload
    profilePicFile: null,
    profilePicPreview: "",
    // Array of Professional / Current Company Records
    professional: [
      {
        companyName: "",
        companyWebsite: "",
        department: "",
        designation: "",
        role: "",
        salary: "",
        joiningDate: new Date().toISOString().split("T")[0],
        reportedTo: "",
        noticePeriod: "",
        expectedLastWorkingDate: "",
        employmentStatus: "CURRENTLY_EMPLOYED",
        isFresher: false,
        location: "",
        isCurrent: true,
        docType: "OFFER_LETTER",
        docFile: null,
        docName: "",
      },
    ],
    // Array of Educational Qualifications with optional certificate document upload
    education: [
      { degree: "", stream: "", university: "", percentage: "", yearOfPassing: "", certificateFile: null, certificateDocName: "" },
    ],
    // Educational Qualifications matching backend schema
    sslcSchoolName: "",
    sslcBoard: "",
    sslcYearOfPassing: "",
    sslcPercentage: "",
    sslcDocumentFile: null,
    sslcDocumentName: "",
    sslcDocumentUrl: "",

    hscSchoolName: "",
    hscBoard: "",
    hscYearOfPassing: "",
    hscPercentage: "",
    hscDocumentFile: null,
    hscDocumentName: "",
    hscDocumentUrl: "",

    itiinstituteName: "",
    iticourse: "",
    itiduration: "",
    itiyearOfPassing: "",
    itipercentage: "",
    itiDocumentFile: null,
    itiDocumentName: "",
    itiDocumentUrl: "",

    diplomainstitution: "",
    diplomacourse: "",
    diplomaduration: "",
    diplomayearOfPassing: "",
    diplomapercentage: "",
    diplomaDocumentFile: null,
    diplomaDocumentName: "",
    diplomaDocumentUrl: "",

    ugInstituteName: "",
    ugUniversityName: "",
    ugDegree: "",
    ugDepartmentCourse: "",
    ugYearOfPassing: "",
    ugCgpa: "",
    ugDocumentFile: null,
    ugDocumentName: "",
    ugDocumentUrl: "",

    pgInstituteName: "",
    pgUniversityName: "",
    pgDegree: "",
    pgDepartmentCourse: "",
    pgYearOfPassing: "",
    pgCgpa: "",
    pgDocumentFile: null,
    pgDocumentName: "",
    pgDocumentUrl: "",

    phdInstituteName: "",
    phdUniversityName: "",
    phdResearchArea: "",
    phdYearOfPassing: "",
    phdDocumentFile: null,
    phdDocumentName: "",
    phdDocumentUrl: "",

    highestQualification: "UG",
    // Array of Work Experiences with optional experience letter / payslip upload
    experience: [
      {
        companyName: "",
        prevCompany: "",
        designation: "",
        experience: "",
        experienceYears: "",
        description: "",
        roleDescription: "",
        salary: "",
        startDate: "",
        endDate: "",
        isCurrentJob: false,
        noticePeriod: "",
        expectedLastWorkingDate: "",
        employmentStatus: "RELIEVED",
        docType: "EXPERIENCE_LETTER",
        experienceDocFile: null,
        experienceDocName: "",
      },
    ],
    // Array of Addresses
    addresses: [
      { addressType: "Permanent", addressLine1: "", addressLine2: "", city: "", state: "", country: "India", pincode: "" },
    ],
    // Bank & Statutory Details with optional passbook upload
    bankName: "",
    accountNo: "",
    ifsc: "",
    branchName: "",
    panNo: "",
    aadhaarNo: "",
    passportNo: "",
    uanNo: "",
    pfNo: "",
    esiNo: "",
    passbookFile: null,
    passbookFileName: "",
    // Array of Family & Emergency Contacts
    familyContacts: [
      { name: "", relationship: "Father", phone: "", email: "", occupation: "" },
    ],
  });

  // ── Education Form Sections & File Handlers ──
  const [expandedEduSections, setExpandedEduSections] = useState({
    iti: false,
    diploma: false,
    pg: false,
    phd: false,
  });

  const toggleEduSection = (sec) => {
    setExpandedEduSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const clearEduSection = (sec) => {
    if (sec === "iti") {
      setFormData((prev) => ({
        ...prev,
        itiinstituteName: "",
        iticourse: "",
        itiduration: "",
        itiyearOfPassing: "",
        itipercentage: "",
        itiDocumentFile: null,
        itiDocumentName: "",
        itiDocumentUrl: "",
      }));
    } else if (sec === "diploma") {
      setFormData((prev) => ({
        ...prev,
        diplomainstitution: "",
        diplomacourse: "",
        diplomaduration: "",
        diplomayearOfPassing: "",
        diplomapercentage: "",
        diplomaDocumentFile: null,
        diplomaDocumentName: "",
        diplomaDocumentUrl: "",
      }));
    } else if (sec === "pg") {
      setFormData((prev) => ({
        ...prev,
        pgInstituteName: "",
        pgUniversityName: "",
        pgDegree: "",
        pgDepartmentCourse: "",
        pgYearOfPassing: "",
        pgCgpa: "",
        pgDocumentFile: null,
        pgDocumentName: "",
        pgDocumentUrl: "",
      }));
    } else if (sec === "phd") {
      setFormData((prev) => ({
        ...prev,
        phdInstituteName: "",
        phdUniversityName: "",
        phdResearchArea: "",
        phdYearOfPassing: "",
        phdDocumentFile: null,
        phdDocumentName: "",
        phdDocumentUrl: "",
      }));
    }
  };

  const handleEduFieldChange = (e, val) => {
    if (typeof e === "string") {
      setFormData((prev) => ({ ...prev, [e]: val }));
    } else if (e && e.target) {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEduFileChange = (fieldKey, file) => {
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    if (fieldKey === "sslcDocument") {
      setFormData((prev) => ({
        ...prev,
        sslcDocumentFile: file,
        sslcDocumentName: file.name,
        sslcDocumentUrl: fileUrl,
      }));
    } else if (fieldKey === "hscDocument") {
      setFormData((prev) => ({
        ...prev,
        hscDocumentFile: file,
        hscDocumentName: file.name,
        hscDocumentUrl: fileUrl,
      }));
    } else if (fieldKey === "itiDocument") {
      setFormData((prev) => ({
        ...prev,
        itiDocumentFile: file,
        itiDocumentName: file.name,
        itiDocumentUrl: fileUrl,
      }));
    } else if (fieldKey === "diplomaDocument") {
      setFormData((prev) => ({
        ...prev,
        diplomaDocumentFile: file,
        diplomaDocumentName: file.name,
        diplomaDocumentUrl: fileUrl,
      }));
    } else if (fieldKey === "ugDocument") {
      setFormData((prev) => ({
        ...prev,
        ugDocumentFile: file,
        ugDocumentName: file.name,
        ugDocumentUrl: fileUrl,
      }));
    } else if (fieldKey === "pgDocument") {
      setFormData((prev) => ({
        ...prev,
        pgDocumentFile: file,
        pgDocumentName: file.name,
        pgDocumentUrl: fileUrl,
      }));
    } else if (fieldKey === "phdDocument") {
      setFormData((prev) => ({
        ...prev,
        phdDocumentFile: file,
        phdDocumentName: file.name,
        phdDocumentUrl: fileUrl,
      }));
    }
  };

  const handleEduFileRemove = (fieldKey) => {
    if (fieldKey === "sslcDocument") {
      setFormData((prev) => ({ ...prev, sslcDocumentFile: null, sslcDocumentName: "", sslcDocumentUrl: "" }));
    } else if (fieldKey === "hscDocument") {
      setFormData((prev) => ({ ...prev, hscDocumentFile: null, hscDocumentName: "", hscDocumentUrl: "" }));
    } else if (fieldKey === "itiDocument") {
      setFormData((prev) => ({ ...prev, itiDocumentFile: null, itiDocumentName: "", itiDocumentUrl: "" }));
    } else if (fieldKey === "diplomaDocument") {
      setFormData((prev) => ({ ...prev, diplomaDocumentFile: null, diplomaDocumentName: "", diplomaDocumentUrl: "" }));
    } else if (fieldKey === "ugDocument") {
      setFormData((prev) => ({ ...prev, ugDocumentFile: null, ugDocumentName: "", ugDocumentUrl: "" }));
    } else if (fieldKey === "pgDocument") {
      setFormData((prev) => ({ ...prev, pgDocumentFile: null, pgDocumentName: "", pgDocumentUrl: "" }));
    } else if (fieldKey === "phdDocument") {
      setFormData((prev) => ({ ...prev, phdDocumentFile: null, phdDocumentName: "", phdDocumentUrl: "" }));
    }
  };

  // ── Feedback & Alerts ──
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Selected Candidate Inspection Workspace ──
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState("profile");

  // Detailed sub-entities for inspected candidate (guaranteed arrays)
  const [detailDocs, setDetailDocs] = useState([]);
  const [detailTasks, setDetailTasks] = useState([]);
  const [detailAssets, setDetailAssets] = useState([]);
  const [detailAccess, setDetailAccess] = useState([]);
  const [detailTraining, setDetailTraining] = useState([]);
  const [detailAgreements, setDetailAgreements] = useState([]);
  const [validationReport, setValidationReport] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ── Document Preview & In-App Viewer Modal State ──
  const [docPreview, setDocPreview] = useState({
    show: false,
    url: "",
    rawUrl: "",
    title: "",
    type: "",
    file: null,
    loading: false,
  });

  const handleOpenDocPreview = async (urlOrFile, title = "Document Preview", type = "file") => {
    let previewUrl = "";
    let fileObj = null;
    let finalTitle = title;
    let rawRemoteUrl = "";

    if (urlOrFile && typeof urlOrFile === "object" && !(urlOrFile instanceof File) && !(urlOrFile instanceof Blob)) {
      if (urlOrFile.file instanceof File || urlOrFile.file instanceof Blob) {
        fileObj = urlOrFile.file;
        previewUrl = URL.createObjectURL(urlOrFile.file);
      }
      if (!previewUrl && urlOrFile.url) {
        urlOrFile = urlOrFile.url;
      }
      if (urlOrFile.title && (!finalTitle || finalTitle === "Document Preview")) {
        finalTitle = urlOrFile.title;
      }
    }

    if (typeof urlOrFile === "string" && urlOrFile.trim()) {
      let u = urlOrFile.trim().replace(/\\/g, "/");
      if (u) {
        if (!u.startsWith("http://") && !u.startsWith("https://") && !u.startsWith("blob:") && !u.startsWith("data:")) {
          const backendBase = (process.env.REACT_APP_API_BASE_URL || "http://localhost:7800/api").replace(/\/api\/?$/, "");
          u = `${backendBase}/${u.replace(/^\/+/, "")}`;
        }
        // Remove invalid fl_inline from Cloudinary raw/upload paths if present
        u = u.replace(/\/raw\/upload\/fl_inline\//g, "/raw/upload/");
        previewUrl = u;
        rawRemoteUrl = u;
      }
    } else if (urlOrFile instanceof File || urlOrFile instanceof Blob) {
      previewUrl = URL.createObjectURL(urlOrFile);
      fileObj = urlOrFile;
    }

    setDocPreview({
      show: true,
      url: previewUrl,
      rawUrl: rawRemoteUrl || previewUrl,
      title: finalTitle || (fileObj?.name ? fileObj.name : "Document Preview"),
      type,
      file: fileObj,
      loading: !!rawRemoteUrl,
    });

    // Try converting remote URL to inline Blob to ensure embedded PDF view without browser download prompts
    if (rawRemoteUrl && !previewUrl.startsWith("blob:")) {
      try {
        const response = await fetch(rawRemoteUrl, { mode: "cors" });
        if (response.ok) {
          const blobData = await response.blob();
          const lowerName = (finalTitle + " " + rawRemoteUrl).toLowerCase();
          const isImg = lowerName.includes(".png") || lowerName.includes(".jpg") || lowerName.includes(".jpeg") || lowerName.includes(".webp") || blobData.type?.startsWith("image/");
          const contentType = isImg ? (blobData.type && blobData.type !== "application/octet-stream" ? blobData.type : "image/jpeg") : "application/pdf";
          const inlineBlob = new Blob([blobData], { type: contentType });
          const inlineBlobUrl = URL.createObjectURL(inlineBlob);
          setDocPreview((prev) => ({
            ...prev,
            url: inlineBlobUrl,
            loading: false,
          }));
        } else {
          setDocPreview((prev) => ({ ...prev, loading: false }));
        }
      } catch (err) {
        setDocPreview((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  const handleCloseDocPreview = () => {
    if (docPreview.url && docPreview.url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(docPreview.url);
      } catch (e) {}
    }
    setDocPreview({ show: false, url: "", title: "", type: "", file: null });
  };

  // ── Upload Document for Candidate Workspace Modal ──
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [uploadDocForm, setUploadDocForm] = useState({
    documentType: "OFFER_LETTER",
    file: null,
    fileName: "",
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleUploadNewCandidateDoc = async () => {
    if (!selectedOnboarding?._id || !uploadDocForm.file) return;
    setUploadingDoc(true);
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("file", uploadDocForm.file);
      fd.append("documentType", uploadDocForm.documentType);
      await uploadOnboardingDocument(selectedOnboarding._id, fd);
      const updatedDocs = await fetchOnboardingDocuments(selectedOnboarding._id);
      setDetailDocs(toArray(updatedDocs));
      setShowDocUploadModal(false);
      setUploadDocForm({ documentType: "OFFER_LETTER", file: null, fileName: "" });
      setSuccessMsg("Document uploaded successfully!");
    } catch (e) {
      setErrorMsg(e.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // ── Education Document Helpers ──
  const [uploadingEduIndex, setUploadingEduIndex] = useState(null);

  const getEducationDoc = (eduItem) => {
    if (!eduItem) return null;

    // 1. Check if item has a local File object directly
    if (eduItem.certificateFile instanceof File || eduItem.file instanceof File) {
      const fileObj = eduItem.certificateFile instanceof File ? eduItem.certificateFile : eduItem.file;
      return {
        url: eduItem.certificateUrl || URL.createObjectURL(fileObj),
        title: eduItem.certificateDocName || fileObj.name || `${eduItem.degree || "Education"} Certificate`,
        file: fileObj,
      };
    }

    // 2. Direct URL attached to eduItem
    const directUrl = eduItem.certificateUrl || eduItem.fileUrl || eduItem.docUrl || eduItem.url || eduItem.documentUrl || eduItem.filePath || eduItem.path || (typeof eduItem.file === "string" ? eduItem.file : null);
    if (directUrl) {
      return {
        url: directUrl,
        title: eduItem.certificateDocName || (eduItem.degree ? `${eduItem.degree} Certificate` : "Education Certificate"),
        file: null,
      };
    }

    // 3. Check candidateProfileData.educationRecord (from GET /api/education/:userId)
    const eduSource = candidateProfileData?.educationRecord || candidateProfileData?.rawEducation || null;
    if (eduSource) {
      const deg = (eduItem.degree || "").toLowerCase().trim();
      let dbDoc = "";
      if (deg.includes("sslc") || deg.includes("10th")) {
        dbDoc = eduSource.sslcDocumentUrl || eduSource.sslcDocument || eduSource.sslcDoc || eduSource.sslcCertificate || eduSource.sslcFile || eduSource.sslcFileUrl || "";
      } else if (deg.includes("hsc") || deg.includes("12th") || deg.includes("+2")) {
        dbDoc = eduSource.hscDocumentUrl || eduSource.hscDocument || eduSource.hscDoc || eduSource.hscCertificate || eduSource.hscFile || eduSource.hscFileUrl || "";
      } else if (deg.includes("iti")) {
        dbDoc = eduSource.itiDocumentUrl || eduSource.itiDocument || eduSource.itiDoc || eduSource.itiCertificate || eduSource.itiFile || "";
      } else if (deg.includes("diploma")) {
        dbDoc = eduSource.diplomaDocumentUrl || eduSource.diplomaDocument || eduSource.diplomaDoc || eduSource.diplomaCertificate || "";
      } else if (deg.includes("ug") || deg.includes("bachelor") || deg.includes("btech") || deg.includes("b.") || deg.includes("bsc") || deg.includes("bca") || deg.includes("bcom") || deg.includes("be") || deg.includes("degree")) {
        dbDoc = eduSource.ugDocumentUrl || eduSource.ugDocument || eduSource.ugDoc || eduSource.ugCertificate || eduSource.ugFile || eduSource.ugFileUrl || "";
      } else if (deg.includes("pg") || deg.includes("master") || deg.includes("mtech") || deg.includes("m.") || deg.includes("mca") || deg.includes("mba") || deg.includes("msc") || deg.includes("me")) {
        dbDoc = eduSource.pgDocumentUrl || eduSource.pgDocument || eduSource.pgDoc || eduSource.pgCertificate || eduSource.pgFile || eduSource.pgFileUrl || "";
      } else if (deg.includes("phd") || deg.includes("doctor")) {
        dbDoc = eduSource.phdDocumentUrl || eduSource.phdDocument || eduSource.phdDoc || eduSource.phdCertificate || eduSource.phdFile || "";
      }
      if (dbDoc) {
        return {
          url: dbDoc,
          title: eduItem.degree ? `${eduItem.degree} Certificate` : "Education Certificate",
          file: null,
        };
      }
    }

    const allDocs = Array.isArray(detailDocs) && detailDocs.length > 0
      ? detailDocs
      : Array.isArray(selectedOnboarding?.documents)
      ? selectedOnboarding.documents
      : [];

    const deg = (eduItem.degree || "").toLowerCase().trim();
    const stream = (eduItem.stream || eduItem.specialization || "").toLowerCase().trim();

    const found = allDocs.find((d) => {
      const docTitle = (d.title || d.originalFileName || d.fileName || d.documentName || "").toLowerCase();
      const docType = (d.documentType || d.type || "").toLowerCase();
      const isEduType = docType.includes("degree") || docType.includes("education") || docType.includes("certificate") || docType.includes("academic") || docType.includes("qualification");

      if (deg.includes("sslc") || deg.includes("10th")) {
        return docTitle.includes("sslc") || docTitle.includes("10th") || docTitle.includes("secondary") || (isEduType && (docTitle.includes("10") || docTitle.includes("sslc")));
      }
      if (deg.includes("hsc") || deg.includes("12th") || deg.includes("+2")) {
        return docTitle.includes("hsc") || docTitle.includes("12th") || docTitle.includes("higher") || (isEduType && (docTitle.includes("12") || docTitle.includes("hsc")));
      }
      if (deg.includes("ug") || deg.includes("b.") || deg.includes("bachelor") || deg.includes("btech") || deg.includes("be") || deg.includes("bsc") || deg.includes("bca") || deg.includes("bcom") || deg.includes("ba")) {
        return docTitle.includes("ug") || docTitle.includes("bachelor") || docTitle.includes("btech") || docTitle.includes("b.tech") || docTitle.includes("bsc") || docTitle.includes("bca") || docTitle.includes("bcom") || docTitle.includes("undergraduate") || (isEduType && (docTitle.includes("degree") || docTitle.includes("ug")));
      }
      if (deg.includes("pg") || deg.includes("m.") || deg.includes("master") || deg.includes("mtech") || deg.includes("me") || deg.includes("mca") || deg.includes("mba") || deg.includes("msc") || deg.includes("mcom")) {
        return docTitle.includes("pg") || docTitle.includes("master") || docTitle.includes("mtech") || docTitle.includes("mca") || docTitle.includes("mba") || docTitle.includes("msc") || docTitle.includes("postgraduate") || (isEduType && (docTitle.includes("mca") || docTitle.includes("pg") || docTitle.includes("master")));
      }
      if (deg.includes("iti")) return docTitle.includes("iti");
      if (deg.includes("diploma")) return docTitle.includes("diploma");
      if (deg.includes("phd") || deg.includes("doctor")) return docTitle.includes("phd") || docTitle.includes("doctor");

      if (deg && docTitle.includes(deg)) return true;
      if (stream && docTitle.includes(stream)) return true;
      return false;
    });

    const docUrl = found?.fileUrl || found?.url || found?.filePath || found?.path || found?.docUrl || found?.documentUrl || (typeof found?.file === "string" ? found.file : null);

    if (found && docUrl) {
      return {
        url: docUrl,
        title: found.originalFileName || found.fileName || found.title || `${eduItem.degree} Certificate`,
        file: null,
      };
    }
    return null;
  };

  // ── Helper: Resolve Professional & Company Document Attachment ──
  const [uploadingProfIndex, setUploadingProfIndex] = useState(null);

  const getProfessionalDoc = (profItem) => {
    if (!profItem) return null;

    if (profItem.documentFile instanceof File || profItem.file instanceof File) {
      const fileObj = profItem.documentFile instanceof File ? profItem.documentFile : profItem.file;
      return {
        url: profItem.documentUrl || URL.createObjectURL(fileObj),
        title: profItem.documentName || fileObj.name || `${profItem.companyName || "Company"} Document`,
        file: fileObj,
      };
    }

    const directUrl = profItem.documentUrl || profItem.fileUrl || profItem.docUrl || profItem.url || profItem.offerLetterUrl || profItem.relievingLetterUrl || profItem.payslipUrl || profItem.appointmentLetterUrl || profItem.experienceLetterUrl || (typeof profItem.file === "string" ? profItem.file : null);
    if (directUrl) {
      return {
        url: directUrl,
        title: profItem.documentName || `${profItem.companyName || "Company"} ${profItem.documentType || "Document"}`,
        file: null,
      };
    }

    // Search in onboarding attachments
    const found = detailDocs.find((doc) => {
      const t = (doc.documentType || doc.type || "").toUpperCase();
      const dt = (profItem.documentType || "OFFER_LETTER").toUpperCase();
      if (t === dt || t.includes("OFFER") || t.includes("EXPERIENCE") || t.includes("APPOINTMENT") || t.includes("RELIEVING") || t.includes("PAYSLIP")) {
        if (profItem.companyName && doc.title && doc.title.toLowerCase().includes(profItem.companyName.toLowerCase())) {
          return true;
        }
        return true;
      }
      return false;
    });

    const docUrl = found?.fileUrl || found?.url || found?.filePath || found?.path || found?.docUrl || found?.documentUrl || (typeof found?.file === "string" ? found.file : null);

    if (found && docUrl) {
      return {
        url: docUrl,
        title: found.originalFileName || found.fileName || found.title || `${profItem.companyName || "Company"} Document`,
        file: null,
      };
    }
    return null;
  };

  const handleUploadProfessionalDoc = async (e, profItem, index) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOnboarding?._id) return;
    setUploadingProfIndex(index);
    setErrorMsg("");

    const localPreviewUrl = URL.createObjectURL(file);

    try {
      const docType = profItem.documentType || "OFFER_LETTER";
      const companyName = profItem.companyName || "Current Company";
      const uploadRes = await uploadProfessionalDocument(selectedOnboarding._id, file, companyName, docType);
      const uploadedDoc = uploadRes?.data || uploadRes?.document || uploadRes;
      const serverUrl = uploadedDoc?.fileUrl || uploadedDoc?.url || localPreviewUrl;

      setCandidateProfileData((prev) => {
        const arr = [...(prev?.professional || [])];
        if (arr[index]) {
          arr[index] = {
            ...arr[index],
            documentUrl: serverUrl,
            documentFile: file,
            documentName: file.name,
            documentType: docType,
          };
        }
        return { ...prev, professional: arr };
      });

      setSuccessMsg(`Document "${file.name}" uploaded successfully for ${companyName}!`);
      await reloadCandidateDetails(selectedOnboarding._id);
    } catch (err) {
      console.warn("Upload professional document notice:", err.message);
      setCandidateProfileData((prev) => {
        const arr = [...(prev?.professional || [])];
        if (arr[index]) {
          arr[index] = {
            ...arr[index],
            documentUrl: localPreviewUrl,
            documentFile: file,
            documentName: file.name,
            documentType: profItem.documentType || "OFFER_LETTER",
          };
        }
        return { ...prev, professional: arr };
      });
      setSuccessMsg(`Document attached for preview.`);
    } finally {
      setUploadingProfIndex(null);
    }
  };

  const handleUploadEducationDoc = async (e, eduItem, index) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOnboarding?._id) return;
    setUploadingEduIndex(index);
    setErrorMsg("");
    
    // Create instant local URL for immediate preview
    const localPreviewUrl = URL.createObjectURL(file);

    try {
      const userCandidate = targetEmp || selectedOnboarding?.employeeId || selectedOnboarding?.user || {};
      const userObjId = (typeof userCandidate === "object" ? (userCandidate._id || userCandidate.id) : userCandidate) || selectedOnboarding?.userId || selectedOnboarding?.employeeId;

      let uploadSuccess = false;
      let uploadError = null;
      let newDocUrl = "";
      let freshEducation = null;

      // 1. Upload to Education record using multipart/form-data
      if (userObjId) {
        const eduFormData = new FormData();
        const deg = (eduItem.degree || "").toLowerCase().trim();
        
        eduFormData.append("userId", String(userObjId));
        eduFormData.append("employeeId", String(userObjId));

        // Append all qualification text fields to FormData
        if (eduItem.degree) eduFormData.append("degree", eduItem.degree);
        if (eduItem.stream) eduFormData.append("stream", eduItem.stream);
        if (eduItem.university) eduFormData.append("university", eduItem.university);
        if (eduItem.percentage) eduFormData.append("percentage", eduItem.percentage);
        if (eduItem.yearOfPassing) eduFormData.append("yearOfPassing", String(eduItem.yearOfPassing));

        // Append under specific schema field names & aliases for backend Multer compatibility
        if (deg.includes("sslc") || deg.includes("10th")) {
          eduFormData.append("sslcDocument", file, file.name || "sslc_certificate.pdf");
          eduFormData.append("sslcDoc", file, file.name || "sslc_certificate.pdf");
          eduFormData.append("sslcCertificate", file, file.name || "sslc_certificate.pdf");
          if (eduItem.university) eduFormData.append("sslcSchoolName", eduItem.university);
          if (eduItem.stream) eduFormData.append("sslcBoard", eduItem.stream);
          if (eduItem.yearOfPassing) eduFormData.append("sslcYearOfPassing", String(eduItem.yearOfPassing));
          if (eduItem.percentage) eduFormData.append("sslcPercentage", String(eduItem.percentage).replace(/[^0-9.]/g, ""));
        } else if (deg.includes("hsc") || deg.includes("12th") || deg.includes("+2")) {
          eduFormData.append("hscDocument", file, file.name || "hsc_certificate.pdf");
          eduFormData.append("hscDoc", file, file.name || "hsc_certificate.pdf");
          eduFormData.append("hscCertificate", file, file.name || "hsc_certificate.pdf");
          if (eduItem.university) eduFormData.append("hscSchoolName", eduItem.university);
          if (eduItem.stream) eduFormData.append("hscBoard", eduItem.stream);
          if (eduItem.yearOfPassing) eduFormData.append("hscYearOfPassing", String(eduItem.yearOfPassing));
          if (eduItem.percentage) eduFormData.append("hscPercentage", String(eduItem.percentage).replace(/[^0-9.]/g, ""));
        } else if (deg.includes("iti")) {
          eduFormData.append("itiDocument", file, file.name || "iti_certificate.pdf");
          eduFormData.append("itiDoc", file, file.name || "iti_certificate.pdf");
          if (eduItem.university) eduFormData.append("itiinstituteName", eduItem.university);
          if (eduItem.stream) eduFormData.append("iticourse", eduItem.stream);
          if (eduItem.yearOfPassing) eduFormData.append("itiyearOfPassing", String(eduItem.yearOfPassing));
          if (eduItem.percentage) eduFormData.append("itipercentage", String(eduItem.percentage).replace(/[^0-9.]/g, ""));
        } else if (deg.includes("diploma")) {
          eduFormData.append("diplomaDocument", file, file.name || "diploma_certificate.pdf");
          eduFormData.append("diplomaDoc", file, file.name || "diploma_certificate.pdf");
          if (eduItem.university) eduFormData.append("diplomainstitution", eduItem.university);
          if (eduItem.stream) eduFormData.append("diplomacourse", eduItem.stream);
          if (eduItem.yearOfPassing) eduFormData.append("diplomayearOfPassing", String(eduItem.yearOfPassing));
          if (eduItem.percentage) eduFormData.append("diplomapercentage", String(eduItem.percentage).replace(/[^0-9.]/g, ""));
        } else if (deg.includes("pg") || deg.includes("master") || deg.includes("mtech") || deg.includes("m.") || deg.includes("mca") || deg.includes("mba") || deg.includes("msc") || deg.includes("me")) {
          eduFormData.append("pgDocument", file, file.name || "pg_certificate.pdf");
          eduFormData.append("pgDoc", file, file.name || "pg_certificate.pdf");
          eduFormData.append("pgCertificate", file, file.name || "pg_certificate.pdf");
          if (eduItem.university) {
            eduFormData.append("pgInstituteName", eduItem.university);
            eduFormData.append("pgUniversityName", eduItem.university);
          }
          if (eduItem.degree) eduFormData.append("pgDegree", eduItem.degree);
          if (eduItem.stream) eduFormData.append("pgDepartmentCourse", eduItem.stream);
          if (eduItem.yearOfPassing) eduFormData.append("pgYearOfPassing", String(eduItem.yearOfPassing));
          if (eduItem.percentage) {
            const rawVal = String(eduItem.percentage).replace(/[^0-9.]/g, "");
            if (String(eduItem.percentage).includes("CGPA") || parseFloat(rawVal) <= 10) {
              eduFormData.append("pgCgpa", rawVal);
            } else {
              eduFormData.append("pgPercentage", rawVal);
            }
          }
        } else if (deg.includes("phd") || deg.includes("doctor")) {
          eduFormData.append("phdDocument", file, file.name || "phd_certificate.pdf");
          eduFormData.append("phdDoc", file, file.name || "phd_certificate.pdf");
          if (eduItem.university) {
            eduFormData.append("phdInstituteName", eduItem.university);
            eduFormData.append("phdUniversityName", eduItem.university);
          }
          if (eduItem.stream) eduFormData.append("phdResearchArea", eduItem.stream);
          if (eduItem.yearOfPassing) eduFormData.append("phdYearOfPassing", String(eduItem.yearOfPassing));
        } else {
          eduFormData.append("ugDocument", file, file.name || "ug_certificate.pdf");
          eduFormData.append("ugDoc", file, file.name || "ug_certificate.pdf");
          eduFormData.append("ugCertificate", file, file.name || "ug_certificate.pdf");
          if (eduItem.university) {
            eduFormData.append("ugInstituteName", eduItem.university);
            eduFormData.append("ugUniversityName", eduItem.university);
          }
          if (eduItem.degree) eduFormData.append("ugDegree", eduItem.degree);
          if (eduItem.stream) eduFormData.append("ugDepartmentCourse", eduItem.stream);
          if (eduItem.yearOfPassing) eduFormData.append("ugYearOfPassing", String(eduItem.yearOfPassing));
          if (eduItem.percentage) {
            const rawVal = String(eduItem.percentage).replace(/[^0-9.]/g, "");
            if (String(eduItem.percentage).includes("CGPA") || parseFloat(rawVal) <= 10) {
              eduFormData.append("ugCgpa", rawVal);
            } else {
              eduFormData.append("ugPercentage", rawVal);
            }
          }
        }
        eduFormData.append("file", file, file.name || "certificate.pdf");
        eduFormData.append("document", file, file.name || "certificate.pdf");
        eduFormData.append("certificate", file, file.name || "certificate.pdf");

        try {
          const res = await updateEducation(userObjId, eduFormData);
          const updatedEdu = res?.education || res?.educationRecord || res?.data || res;
          if (updatedEdu) {
            uploadSuccess = true;
            if (deg.includes("sslc") || deg.includes("10th")) newDocUrl = updatedEdu.sslcDocumentUrl || updatedEdu.sslcDocument || updatedEdu.sslcDoc;
            else if (deg.includes("hsc") || deg.includes("12th")) newDocUrl = updatedEdu.hscDocumentUrl || updatedEdu.hscDocument || updatedEdu.hscDoc;
            else if (deg.includes("iti")) newDocUrl = updatedEdu.itiDocumentUrl || updatedEdu.itiDocument;
            else if (deg.includes("diploma")) newDocUrl = updatedEdu.diplomaDocumentUrl || updatedEdu.diplomaDocument;
            else if (deg.includes("ug") || deg.includes("bachelor") || deg.includes("btech") || deg.includes("b.") || deg.includes("bsc") || deg.includes("bca") || deg.includes("bcom") || deg.includes("be") || deg.includes("degree")) newDocUrl = updatedEdu.ugDocumentUrl || updatedEdu.ugDocument || updatedEdu.ugDoc;
            else if (deg.includes("pg") || deg.includes("master") || deg.includes("mtech") || deg.includes("m.") || deg.includes("mca") || deg.includes("mba") || deg.includes("msc") || deg.includes("me")) newDocUrl = updatedEdu.pgDocumentUrl || updatedEdu.pgDocument || updatedEdu.pgDoc;
            else if (deg.includes("phd") || deg.includes("doctor")) newDocUrl = updatedEdu.phdDocumentUrl || updatedEdu.phdDocument || updatedEdu.phdDoc;
          }
        } catch (subErr) {
          console.warn("Education update notice:", subErr.message);
          try {
            const createRes = await createEducation(eduFormData);
            if (createRes) uploadSuccess = true;
          } catch (createErr) {
            console.warn("createEducation fallback notice:", createErr.message);
          }
        }

        // Fetch fresh education record immediately from API
        try {
          freshEducation = await getEducationByUserId(userObjId);
          if (freshEducation) {
            uploadSuccess = true;
            if (!newDocUrl) {
              if (deg.includes("sslc") || deg.includes("10th")) newDocUrl = freshEducation.sslcDocumentUrl || freshEducation.sslcDocument || freshEducation.sslcDoc;
              else if (deg.includes("hsc") || deg.includes("12th")) newDocUrl = freshEducation.hscDocumentUrl || freshEducation.hscDocument || freshEducation.hscDoc;
              else if (deg.includes("iti")) newDocUrl = freshEducation.itiDocumentUrl || freshEducation.itiDocument;
              else if (deg.includes("diploma")) newDocUrl = freshEducation.diplomaDocumentUrl || freshEducation.diplomaDocument;
              else if (deg.includes("ug") || deg.includes("bachelor") || deg.includes("btech") || deg.includes("b.") || deg.includes("bsc") || deg.includes("bca") || deg.includes("bcom") || deg.includes("be") || deg.includes("degree")) newDocUrl = freshEducation.ugDocumentUrl || freshEducation.ugDocument || freshEducation.ugDoc;
              else if (deg.includes("pg") || deg.includes("master") || deg.includes("mtech") || deg.includes("m.") || deg.includes("mca") || deg.includes("mba") || deg.includes("msc") || deg.includes("me")) newDocUrl = freshEducation.pgDocumentUrl || freshEducation.pgDocument || freshEducation.pgDoc;
              else if (deg.includes("phd") || deg.includes("doctor")) newDocUrl = freshEducation.phdDocumentUrl || freshEducation.phdDocument;
            }
          }
        } catch (freshErr) {
          console.warn("Fresh education fetch error:", freshErr.message);
        }
      }

      // 2. Also attach to Candidate Onboarding Document records
      try {
        const onboardingDocRes = await uploadEducationCertificate(selectedOnboarding._id, file, eduItem.degree || `Qualification #${index + 1}`);
        uploadSuccess = true;
        if (!newDocUrl && onboardingDocRes) {
          const docObj = onboardingDocRes?.data || onboardingDocRes?.document || onboardingDocRes;
          newDocUrl = docObj?.fileUrl || docObj?.url || docObj?.filePath || docObj?.path || docObj?.documentUrl || "";
        }
      } catch (onboardingErr) {
        console.warn("Onboarding doc upload notice:", onboardingErr.message);
        if (!uploadSuccess) uploadError = onboardingErr;
      }

      // Refresh candidate documents list
      try {
        const docsRes = await fetchOnboardingDocuments(selectedOnboarding._id).catch(() => null);
        if (docsRes) setDetailDocs(toArray(docsRes));
      } catch (e) {}

      if (uploadSuccess || file) {
        // Optimistically update qualification row in workspace state with file object and URL
        const finalUrl = newDocUrl || localPreviewUrl;
        setCandidateProfileData((prev) => {
          const copy = { ...prev };
          if (freshEducation) {
            copy.educationRecord = freshEducation;
          }
          if (Array.isArray(copy.education) && copy.education[index]) {
            copy.education[index] = {
              ...copy.education[index],
              certificateFile: file,
              file: file,
              certificateDocName: file.name,
              certificateUrl: finalUrl,
            };
          }
          return copy;
        });
        setSuccessMsg(`Certificate uploaded and linked successfully for ${eduItem.degree || "Qualification"}!`);
      } else {
        throw uploadError || new Error("Failed to upload document.");
      }
    } catch (err) {
      setErrorMsg(`Failed to upload certificate: ${err.message}`);
    } finally {
      setUploadingEduIndex(null);
      if (e.target) e.target.value = "";
    }
  };

  // ── Bank & Statutory Document Helpers ──
  const [uploadingBankDoc, setUploadingBankDoc] = useState(false);

  const getBankPassbookDoc = () => {
    if (candidateProfileData?.bankDetails?.passbookDoc) {
      return {
        url: candidateProfileData.bankDetails.passbookDoc,
        title: "Bank Passbook / Cheque",
      };
    }
    const found = detailDocs.find(
      (d) =>
        d.documentType === "BANK_PASSBOOK" ||
        (d.title || "").toLowerCase().includes("passbook") ||
        (d.title || "").toLowerCase().includes("cheque")
    );
    if (found && (found.fileUrl || found.url)) {
      return {
        url: found.fileUrl || found.url,
        title: found.originalFileName || found.fileName || found.title || "Bank Passbook / Cheque",
      };
    }
    return null;
  };

  const handleUploadBankDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOnboarding?._id) return;
    setUploadingBankDoc(true);
    setErrorMsg("");
    try {
      await uploadBankPassbook(selectedOnboarding._id, file);
      setSuccessMsg("Bank passbook / cancelled cheque uploaded successfully!");
      await reloadCandidateDetails(selectedOnboarding._id);
    } catch (err) {
      setErrorMsg(`Failed to upload bank document: ${err.message}`);
    } finally {
      setUploadingBankDoc(false);
      e.target.value = "";
    }
  };

  // ── Multi-Step Section Form Validator ──
  const validateSection = (sectionId) => {
    const errors = {};

    if (sectionId === "personal") {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address (e.g. arun.sharma@company.com)";
      }
      const cleanedMobile = (formData.mobileNo || "").replace(/[^\d+]/g, "");
      if (formData.mobileNo && (cleanedMobile.length < 10 || cleanedMobile.length > 15)) {
        errors.mobileNo = "Mobile number must be 10 to 15 digits";
      }
      if (formData.dob) {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        if (isNaN(dobDate.getTime())) {
          errors.dob = "Please enter a valid Date of Birth";
        } else if (dobDate >= today) {
          errors.dob = "Date of Birth cannot be in the future";
        }
      }
    }

    if (sectionId === "professional") {
      if (Array.isArray(formData.professional)) {
        formData.professional.forEach((prof, idx) => {
          if (prof.companyWebsite && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(prof.companyWebsite.trim())) {
            errors[`prof_website_${idx}`] = `Company #${idx + 1}: Please enter a valid website URL`;
          }
          if (prof.joiningDate && prof.expectedLastWorkingDate) {
            if (new Date(prof.expectedLastWorkingDate) < new Date(prof.joiningDate)) {
              errors[`prof_dates_${idx}`] = `Company #${idx + 1}: Expected last working date cannot precede joining date`;
            }
          }
        });
      }
    }

    if (sectionId === "education") {
      const currentYear = new Date().getFullYear();
      if (formData.sslcYearOfPassing && (Number(formData.sslcYearOfPassing) < 1950 || Number(formData.sslcYearOfPassing) > currentYear + 1)) {
        errors.sslcYearOfPassing = `SSLC passing year must be between 1950 and ${currentYear + 1}`;
      }
      if (formData.sslcPercentage && (Number(formData.sslcPercentage) < 0 || Number(formData.sslcPercentage) > 100)) {
        errors.sslcPercentage = "SSLC Percentage must be between 0 and 100";
      }
      if (formData.hscYearOfPassing && (Number(formData.hscYearOfPassing) < 1950 || Number(formData.hscYearOfPassing) > currentYear + 1)) {
        errors.hscYearOfPassing = `HSC passing year must be between 1950 and ${currentYear + 1}`;
      }
      if (formData.hscPercentage && (Number(formData.hscPercentage) < 0 || Number(formData.hscPercentage) > 100)) {
        errors.hscPercentage = "HSC Percentage must be between 0 and 100";
      }
      if (formData.ugYearOfPassing && (Number(formData.ugYearOfPassing) < 1950 || Number(formData.ugYearOfPassing) > currentYear + 5)) {
        errors.ugYearOfPassing = `UG passing year must be between 1950 and ${currentYear + 5}`;
      }
      if (formData.ugCgpa && (Number(formData.ugCgpa) < 0 || Number(formData.ugCgpa) > 100)) {
        errors.ugCgpa = "UG CGPA / Percentage must be between 0 and 100";
      }
      if (formData.pgYearOfPassing && (Number(formData.pgYearOfPassing) < 1950 || Number(formData.pgYearOfPassing) > currentYear + 5)) {
        errors.pgYearOfPassing = `PG passing year must be between 1950 and ${currentYear + 5}`;
      }
      if (formData.pgCgpa && (Number(formData.pgCgpa) < 0 || Number(formData.pgCgpa) > 100)) {
        errors.pgCgpa = "PG CGPA / Percentage must be between 0 and 100";
      }
    }

    if (sectionId === "experience" && !formData.isFresher) {
      if (Array.isArray(formData.experience)) {
        formData.experience.forEach((exp, idx) => {
          if (exp.startDate && exp.endDate) {
            if (new Date(exp.endDate) < new Date(exp.startDate)) {
              errors[`exp_dates_${idx}`] = `Experience #${idx + 1}: End date cannot be earlier than start date`;
            }
          }
        });
      }
    }

    if (sectionId === "address") {
      if (Array.isArray(formData.addresses)) {
        formData.addresses.forEach((addr, idx) => {
          if (addr.pincode && !/^\d{4,10}$/.test(String(addr.pincode).replace(/\s/g, ""))) {
            errors[`addr_pincode_${idx}`] = `${addr.addressType || "Address"} #${idx + 1}: PIN / Postal Code must be 4 to 10 digits`;
          }
        });
      }
    }

    if (sectionId === "documents") {
      if (formData.accountNo && !/^\d{6,22}$/.test(String(formData.accountNo).replace(/[\s-]/g, ""))) {
        errors.accountNo = "Account number must be numeric (6 to 22 digits)";
      }
      if (formData.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(formData.ifsc).trim())) {
        errors.ifsc = "IFSC code must be 11 characters (e.g. HDFC0001234)";
      }
      if (formData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(String(formData.panNo).trim())) {
        errors.panNo = "PAN must be 10 characters (e.g. ABCDE1234F: 5 letters, 4 numbers, 1 letter)";
      }
      if (formData.aadhaarNo) {
        const cleanedAadhaar = String(formData.aadhaarNo).replace(/[\s-]/g, "");
        if (!/^\d{12}$/.test(cleanedAadhaar)) {
          errors.aadhaarNo = "Aadhaar number must be exactly 12 digits";
        }
      }
      if (formData.passportNo && !/^[A-Z0-9]{6,12}$/i.test(String(formData.passportNo).trim())) {
        errors.passportNo = "Passport Number must be 6 to 12 alphanumeric characters";
      }
      if (formData.uanNo) {
        const cleanedUan = String(formData.uanNo).replace(/[\s-]/g, "");
        if (!/^\d{12}$/.test(cleanedUan)) {
          errors.uanNo = "UAN must be exactly 12 digits";
        }
      }
    }

    if (sectionId === "family") {
      if (Array.isArray(formData.familyContacts)) {
        formData.familyContacts.forEach((contact, idx) => {
          if (contact.phone) {
            const cleanPhone = contact.phone.replace(/[^\d+]/g, "");
            if (cleanPhone.length < 10 || cleanPhone.length > 15) {
              errors[`family_phone_${idx}`] = `Contact #${idx + 1}: Phone number must be 10 to 15 digits`;
            }
          }
          if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
            errors[`family_email_${idx}`] = `Contact #${idx + 1}: Please enter a valid email address`;
          }
        });
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  // ── Step Navigation Handlers with Per-Section Validation ──
  const handleTabClick = (targetTabId) => {
    const currentIdx = formTabs.findIndex((t) => t.id === activeFormTab);
    const targetIdx = formTabs.findIndex((t) => t.id === targetTabId);
    if (targetIdx > currentIdx) {
      const { isValid, errors } = validateSection(activeFormTab);
      if (!isValid) {
        setFormErrors(errors);
        return;
      }
    }
    setFormErrors({});
    setActiveFormTab(targetTabId);
  };

  const handleNextStep = () => {
    const { isValid, errors } = validateSection(activeFormTab);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const idx = formTabs.findIndex((t) => t.id === activeFormTab);
    if (idx < formTabs.length - 1) {
      setActiveFormTab(formTabs[idx + 1].id);
    }
  };

  const handlePrevStep = () => {
    setFormErrors({});
    const idx = formTabs.findIndex((t) => t.id === activeFormTab);
    if (idx > 0) {
      setActiveFormTab(formTabs[idx - 1].id);
    }
  };

  // Candidate Profile Workspace Editing State
  const [candidateProfileData, setCandidateProfileData] = useState(null);
  const [isEditingCandidateProfile, setIsEditingCandidateProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Asset Inventory & Sub-Tab State in Candidate Workspace ──
  const [assetInventory, setAssetInventory] = useState([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetSubTab, setAssetSubTab] = useState("all"); // "all" | "assigned" | "available"
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [assetStatusFilter, setAssetStatusFilter] = useState("");
  const [assetCategoryFilter, setAssetCategoryFilter] = useState("");

  // Create asset modal state
  const [showCreateAssetModal, setShowCreateAssetModal] = useState(false);
  const [createAssetSubmitting, setCreateAssetSubmitting] = useState(false);
  const [createAssetForm, setCreateAssetForm] = useState({
    name: "",
    category: "LAPTOP",
    serialNumber: "",
    modelName: "",
    manufacturer: "",
    purchaseDate: "",
    warrantyExpiryDate: "",
  });

  // Assign condition modal state
  const [showAssignAssetModal, setShowAssignAssetModal] = useState(false);
  const [selectedAssetToAssign, setSelectedAssetToAssign] = useState(null);
  const [assigningAssetLoading, setAssigningAssetLoading] = useState(false);
  const [assignAssetDetailForm, setAssignAssetDetailForm] = useState({
    condition: "Brand New",
    remarks: "",
  });

  // ── Sub-forms inside detail modal ──
  const [rejectModal, setRejectModal] = useState({ show: false, docId: null, reason: "" });
  const [newTaskForm, setNewTaskForm] = useState({
    taskName: "",
    description: "",
    responsibleGroup: "HR",
    category: "DOCUMENT_VERIFICATION",
    priority: "MEDIUM",
    dueDate: "",
    isMandatory: true,
  });
  const [assignAssetForm, setAssignAssetForm] = useState({ assetId: "", condition: "Brand New", remarks: "" });
  const [newAccessForm, setNewAccessForm] = useState({ systemName: "", accessType: "Standard", isMandatory: true });
  const [newTrainingForm, setNewTrainingForm] = useState({ trainingName: "", trainer: "HR Team", scheduledDate: "", mandatory: true });
  const [newAgreementForm, setNewAgreementForm] = useState({ agreementType: "NDA", title: "Non-Disclosure Agreement", isRequired: true });

  // ── Provisioning & Management Modals ──
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionTarget, setProvisionTarget] = useState(null);
  const [provisionForm, setProvisionForm] = useState({
    roleId: "",
    password: "Welcome@123",
    isActive: true,
    showPass: false,
  });
  const [provisionLoading, setProvisionLoading] = useState(false);

  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTarget, setManageTarget] = useState(null);
  const [manageForm, setManageForm] = useState({
    roleId: "",
    isActive: true,
    isBlocked: false,
    newPassword: "",
    showPass: false,
  });

  // ── Selected Candidate derived fields for clean modal header & actions ──
  const targetEmp = selectedOnboarding?.employeeId || {};
  const candidateName = targetEmp.firstName
    ? `${targetEmp.firstName} ${targetEmp.lastName || ""}`.trim()
    : selectedOnboarding?.name || "Candidate Profile";
  const candidateCode = targetEmp.employeeCode || selectedOnboarding?.employeeCode || "EMP-NEW";
  const candidateEmail = targetEmp.email || selectedOnboarding?.email || "—";
  const candidateDept = targetEmp.department || selectedOnboarding?.department || "General";
  const candidateDesig = typeof targetEmp.designation === "string"
    ? targetEmp.designation
    : typeof selectedOnboarding?.designation === "string"
      ? selectedOnboarding.designation
      : "Employee";

  // ── Load Pipeline Onboardings ──
  const loadPipelineData = useCallback(async () => {
    setLoadingPipeline(true);
    try {
      const res = await fetchOnboardings({
        status: pipelineStatusFilter === "ALL" ? "" : pipelineStatusFilter,
        search: pipelineSearch,
      });
      setOnboardings(toArray(res));
    } catch (err) {
      console.warn("Failed to load onboarding pipeline:", err.message);
      setOnboardings([]);
    } finally {
      setLoadingPipeline(false);
    }
  }, [pipelineStatusFilter, pipelineSearch]);

  // ── Load Directory & Master Data ──
  const loadMasterData = useCallback(async () => {
    setLoadingDirectory(true);
    try {
      const [usersData, rolesData, assetsRes] = await Promise.all([
        fetchAllUsers().catch(() => []),
        fetchAssignableRoles().catch(() => []),
        getAssets({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setEmployees(toArray(usersData));
      setAssignableRoles(toArray(rolesData));
      const assetList = toArray(assetsRes?.data || assetsRes);
      setAssetInventory(assetList);
      setAvailableAssets(assetList.filter((a) => a.status === "AVAILABLE"));
    } catch (err) {
      console.warn("Failed to load master data:", err.message);
    } finally {
      setLoadingDirectory(false);
    }
  }, []);

  const loadAssetInventory = useCallback(async () => {
    setAssetLoading(true);
    try {
      const res = await getAssets({ limit: 100 });
      const list = toArray(res?.data || res);
      setAssetInventory(list);
      setAvailableAssets(list.filter((a) => a.status === "AVAILABLE"));
    } catch (err) {
      console.warn("Failed to reload asset inventory:", err.message);
    } finally {
      setAssetLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // ── Open Candidate Inspection Workspace ──
  const handleOpenCandidateWorkspace = async (onboardingId) => {
    setShowDetailModal(true);
    setLoadingDetails(true);
    setValidationReport(null);
    setDetailActiveTab("profile");
    setIsEditingCandidateProfile(false);
    try {
      const res = await fetchOnboardingById(onboardingId);
      const data = res?.data?.data || res?.data || res || {};
      setSelectedOnboarding(data);
      setDetailDocs(toArray(data.documents));
      setDetailTasks(toArray(data.tasks));
      setDetailAssets(toArray(data.assignedAssets));
      setDetailAccess(toArray(data.provisionedAccess));
      setDetailTraining(toArray(data.orientations));
      setDetailAgreements(toArray(data.agreements));

      // Fetch full multi-domain profile from backend
      let profileDomains = {
        personal: {},
        professional: [],
        education: [],
        experience: [],
        addresses: [],
        emergencyContact: {},
        bankDetails: {},
        statutoryDetails: {},
      };
      try {
        profileDomains = await fetchEmployeeInfo(onboardingId);
      } catch (domainErr) {
        console.warn("fetchEmployeeInfo notice:", domainErr.message);
      }

      let emp = data.employeeId || data.employee || data.user || {};
      const userId = emp._id || data.employeeId?._id || data.employeeId || data.userId;
      const profDetails = data.profileDetails || {};

      // Fallback direct fetches if not loaded in profDetails
      let dbCurrentComp = profDetails.currentCompany || null;
      let dbEdu = profDetails.education || null;
      let dbExp = (Array.isArray(profDetails.experience) && profDetails.experience.length > 0) ? profDetails.experience : [];
      let dbAddresses = (Array.isArray(profDetails.addresses) && profDetails.addresses.length > 0) ? profDetails.addresses : [];
      let dbFamily = profDetails.family || null;

      if (userId) {
        try {
          const [compRes, eduRes, expRes, addrRes, famRes] = await Promise.all([
            !dbCurrentComp ? fetchCurrentCompanyByUserId(userId).catch(() => null) : null,
            getEducationByUserId(userId).catch(() => null),
            dbExp.length === 0 ? getExperienceByUserId(userId).catch(() => []) : null,
            dbAddresses.length === 0 ? fetchAddressByEmployeeId(userId).catch(() => []) : null,
            !dbFamily ? fetchFamilyByUserId(userId).catch(() => null) : null,
          ]);
          if (compRes && !dbCurrentComp) dbCurrentComp = compRes;
          if (eduRes) dbEdu = eduRes;
          if (expRes && dbExp.length === 0) dbExp = Array.isArray(expRes) ? expRes : (expRes ? [expRes] : []);
          if (addrRes && dbAddresses.length === 0) dbAddresses = Array.isArray(addrRes) ? addrRes : (addrRes ? [addrRes] : []);
          if (famRes && !dbFamily) dbFamily = famRes;
        } catch (fbErr) {
          console.warn("Fallback domain fetch:", fbErr.message);
        }
      }

      // 1. Professional & Company History
      const rawProf = (Array.isArray(profDetails.professional) && profDetails.professional.length > 0)
        ? profDetails.professional
        : (dbCurrentComp && Object.keys(dbCurrentComp).length > 0)
        ? [dbCurrentComp]
        : (Array.isArray(profileDomains.professional) && profileDomains.professional.length > 0)
        ? profileDomains.professional
        : (Array.isArray(emp.professional) && emp.professional.length > 0)
        ? emp.professional
        : (Array.isArray(data.professional) && data.professional.length > 0)
        ? data.professional
        : [];

      const candidateJoiningDate = emp.joiningDate || data.joiningDate || (dbCurrentComp?.joiningDate) || "";
      const candidateManagerId = emp.reportingManager?._id || emp.reportingManager || data.reportingManager?._id || data.reportingManager || (dbCurrentComp?.reportedTo?._id || dbCurrentComp?.reportedTo) || "";

      let profList = rawProf.map((p) => ({
        companyName: p.companyName || p.company || (p.isFresher ? "Current Organization (Fresher)" : ""),
        companyWebsite: p.companyWebsite || p.website || p.linkedin || "",
        website: p.website || p.companyWebsite || p.linkedin || "",
        linkedin: p.linkedin || p.website || p.companyWebsite || "",
        location: p.location || p.branch || p.city || "",
        department: p.department || emp.department || data.department || "",
        designation: p.designation || p.role || emp.designation || data.designation || "",
        role: p.role || p.position || p.designation || "",
        salary: p.salary || p.ctc || "",
        joiningDate: p.joiningDate ? new Date(p.joiningDate).toISOString().split("T")[0] : (candidateJoiningDate ? new Date(candidateJoiningDate).toISOString().split("T")[0] : ""),
        reportedTo: p.reportedTo?._id || p.reportedTo || candidateManagerId || "",
        noticePeriod: p.noticePeriod || (emp.noticePeriodDays ? `${emp.noticePeriodDays} Days` : "") || (data.noticePeriodDays ? `${data.noticePeriodDays} Days` : "") || "",
        expectedLastWorkingDate: p.expectedLastWorkingDate ? new Date(p.expectedLastWorkingDate).toISOString().split("T")[0] : "",
        employmentStatus: p.employmentStatus || "CURRENTLY_EMPLOYED",
        isCurrent: p.isCurrent !== undefined ? Boolean(p.isCurrent) : true,
        isFresher: p.isFresher !== undefined ? Boolean(p.isFresher) : false,
        documentType: p.documentType || "OFFER_LETTER",
        documentUrl: p.documentUrl || p.fileUrl || p.docUrl || p.url || p.offerLetterUrl || p.relievingLetterUrl || p.payslipUrl || p.appointmentLetterUrl || p.experienceLetterUrl || "",
        documentName: p.documentName || p.fileName || "",
        documentFile: null,
      }));

      if (profList.length === 0) {
        profList = [
          {
            companyName: "Current Organization (Fresher)",
            companyWebsite: "",
            location: "Office Headquarters",
            department: emp.department || data.department || "",
            designation: emp.designation || data.designation || "Employee",
            role: emp.designation || data.designation || "Employee",
            salary: "",
            joiningDate: candidateJoiningDate ? new Date(candidateJoiningDate).toISOString().split("T")[0] : "",
            reportedTo: candidateManagerId || "",
            noticePeriod: "",
            expectedLastWorkingDate: "",
            employmentStatus: "CURRENTLY_EMPLOYED",
            isCurrent: true,
            isFresher: true,
            documentType: "OFFER_LETTER",
            documentUrl: "",
            documentName: "",
            documentFile: null,
          },
        ];
      }

      // 2. Educational Qualifications
      const rawEdu = profDetails.education || dbEdu || profileDomains.education || emp.education || data.education;
      const eduList = parseEducationToQualificationList(rawEdu, dbEdu);

      // 3. Previous Work Experiences
      const rawExp = (dbExp.length > 0)
        ? dbExp
        : (Array.isArray(profDetails.experience) && profDetails.experience.length > 0)
        ? profDetails.experience
        : (Array.isArray(profileDomains.experience) && profileDomains.experience.length > 0)
        ? profileDomains.experience
        : (Array.isArray(emp.experience) && emp.experience.length > 0)
        ? emp.experience
        : (Array.isArray(data.experience) && data.experience.length > 0)
        ? data.experience
        : [];

      const expList = rawExp.map((ex) => ({
        prevCompany: ex.prevCompany || ex.companyName || ex.employer || "",
        companyName: ex.companyName || ex.prevCompany || ex.employer || "",
        designation: ex.designation || ex.role || "",
        experienceYears: ex.experienceYears || ex.experience || ex.duration || "",
        roleDescription: ex.roleDescription || ex.description || ex.rolesAndResponsibilities || "",
      }));

      // 4. Addresses
      const rawAddr = (dbAddresses.length > 0)
        ? dbAddresses
        : (Array.isArray(profDetails.addresses) && profDetails.addresses.length > 0)
        ? profDetails.addresses
        : (Array.isArray(profileDomains.addresses) && profileDomains.addresses.length > 0)
        ? profileDomains.addresses
        : (Array.isArray(emp.addresses) && emp.addresses.length > 0)
        ? emp.addresses
        : (Array.isArray(emp.address) && emp.address.length > 0)
        ? emp.address
        : (Array.isArray(data.addresses) && data.addresses.length > 0)
        ? data.addresses
        : (Array.isArray(data.address) && data.address.length > 0)
        ? data.address
        : [];

      const addrList = rawAddr
        .map((ad) => ({
          _id: ad._id || ad.id,
          addressType: ad.addressType || ad.type || "Permanent",
          address1: ad.address1 || ad.addressLine1 || ad.address || ad.street || ad.line1 || "",
          addressLine1: ad.addressLine1 || ad.address1 || ad.address || ad.street || ad.line1 || "",
          address2: ad.address2 || ad.addressLine2 || ad.line2 || "",
          addressLine2: ad.address2 || ad.addressLine2 || ad.line2 || "",
          city: ad.city || "",
          state: ad.state || "",
          country: ad.country || "India",
          pincode: String(ad.pincode || ad.postalCode || ad.pinCode || "").trim(),
        }))
        .filter((a) => a.address1 || a.addressLine1 || a.city || a.state || a.pincode);

      const rawBank = (profileDomains.bankDetails && Object.keys(profileDomains.bankDetails).length > 0)
        ? profileDomains.bankDetails
        : emp.bankDetails || data.bankDetails || {};

      const candidateFullName = `${profileDomains.personal?.firstName || emp.firstName || data.firstName || ""} ${profileDomains.personal?.lastName || emp.lastName || data.lastName || ""}`.trim();

      const bank = {
        bankName: rawBank.bankName || "",
        accountHolderName: rawBank.accountHolderName || rawBank.accountName || rawBank.beneficiaryName || candidateFullName || "",
        accountNumber: rawBank.accountNumber || rawBank.accountNo || "",
        accountType: rawBank.accountType || rawBank.type || "SAVINGS",
        ifsc: rawBank.ifsc || rawBank.ifscCode || rawBank.ifsc_code || "",
        ifscCode: rawBank.ifscCode || rawBank.ifsc || rawBank.ifsc_code || "",
        branchName: rawBank.branchName || rawBank.branch || "",
        passbookDoc: rawBank.passbookDoc || rawBank.passbookUrl || rawBank.cancelledCheque || rawBank.fileUrl || "",
      };

      const rawStat = (profileDomains.statutoryDetails && Object.keys(profileDomains.statutoryDetails).length > 0)
        ? profileDomains.statutoryDetails
        : emp.statutoryDetails || data.statutoryDetails || {};

      const statutory = {
        panNo: rawStat.panNo || rawStat.pan || "",
        aadhaarNo: rawStat.aadhaarNo || rawStat.aadhaar || rawStat.aadharNo || rawStat.aadhar || "",
        uanNo: rawStat.uanNo || rawStat.uan || rawStat.pfUan || "",
        pfNo: rawStat.pfNo || rawStat.pfNumber || "",
        esiNo: rawStat.esiNo || rawStat.esi || rawStat.insuranceNo || "",
      };

      const emergency = (profileDomains.emergencyContact && Object.keys(profileDomains.emergencyContact).length > 0)
        ? profileDomains.emergencyContact
        : (dbFamily && dbFamily.familyMembers && dbFamily.familyMembers[0])
        ? {
            name: dbFamily.familyMembers[0].name || "",
            relationship: dbFamily.familyMembers[0].relationship || "Father",
            phone: dbFamily.familyMembers[0].phone || "",
            email: dbFamily.familyMembers[0].email || "",
          }
        : emp.emergencyContact || data.emergencyContact || { name: "", relationship: "", phone: "", email: "" };

      const candidateRoleObj = emp.role || data.role || {};
      const candidateRoleId = typeof candidateRoleObj === "object" ? (candidateRoleObj._id || "") : (typeof candidateRoleObj === "string" ? candidateRoleObj : "");
      const candidateRoleName = typeof candidateRoleObj === "object"
        ? (candidateRoleObj.roleName || candidateRoleObj.name || "")
        : (assignableRoles.find((r) => r._id === candidateRoleObj)?.roleName || (typeof candidateRoleObj === "string" ? candidateRoleObj : "") || "Employee");

      setCandidateProfileData({
        firstName: profileDomains.personal?.firstName || emp.firstName || data.firstName || "",
        middleName: profileDomains.personal?.middleName || emp.middleName || data.middleName || "",
        lastName: profileDomains.personal?.lastName || emp.lastName || data.lastName || "",
        email: profileDomains.personal?.email || emp.email || data.email || "",
        mobileNo: profileDomains.personal?.mobileNo || emp.mobileNo || data.mobileNo || "",
        avatar: profileDomains.personal?.avatar || emp.avatar || data.avatar || "",
        dob: (profileDomains.personal?.dob || emp.dob || data.dob) ? new Date(profileDomains.personal?.dob || emp.dob || data.dob).toISOString().split("T")[0] : "",
        gender: profileDomains.personal?.gender || emp.gender || data.gender || "Male",
        marriageStatus: profileDomains.personal?.marriageStatus || emp.marriageStatus || data.marriageStatus || "Unmarried",
        bloodGroup: profileDomains.personal?.bloodGroup || emp.bloodGroup || data.bloodGroup || "O+",
        department: profileDomains.personal?.department || emp.department || data.department || selectedOnboarding?.department || "",
        designation: profileDomains.personal?.designation || emp.designation || data.designation || selectedOnboarding?.designation || "",
        role: candidateRoleName,
        roleId: candidateRoleId,
        joiningDate: candidateJoiningDate ? new Date(candidateJoiningDate).toISOString().split("T")[0] : "",
        reportingManager: candidateManagerId || "",
        reportingManagerName: (employees.find((e) => (e._id || e.id) === candidateManagerId)
          ? `${employees.find((e) => (e._id || e.id) === candidateManagerId).firstName} ${employees.find((e) => (e._id || e.id) === candidateManagerId).lastName || ""}`
          : "") || emp.reportingManagerName || data.reportingManagerName || "",
        employmentType: emp.employmentType || data.employmentType || selectedOnboarding?.employmentType || "FULL_TIME",
        noticePeriodDays: emp.noticePeriodDays !== undefined ? emp.noticePeriodDays : (data.noticePeriodDays !== undefined ? data.noticePeriodDays : 60),
        professional: profList,
        education: eduList,
        educationRecord: dbEdu,
        rawEducation: rawEdu,
        experience: expList,
        addresses: addrList,
        bankDetails: bank,
        statutoryDetails: statutory,
        emergencyContact: emergency,
      });

      // Auto-fetch sub-entities concurrently with safe extraction
      try {
        const [docsRes, tasksRes, accessRes, trainRes, agreeRes] = await Promise.all([
          fetchOnboardingDocuments(onboardingId).catch(() => null),
          fetchOnboardingTasks(onboardingId).catch(() => null),
          fetchOnboardingAccess(onboardingId).catch(() => null),
          fetchOnboardingTraining(onboardingId).catch(() => null),
          fetchOnboardingAgreements(onboardingId).catch(() => null),
        ]);
        if (docsRes) setDetailDocs(toArray(docsRes));
        if (tasksRes) setDetailTasks(toArray(tasksRes));
        if (accessRes) setDetailAccess(toArray(accessRes));
        if (trainRes) setDetailTraining(toArray(trainRes));
        if (agreeRes) setDetailAgreements(toArray(agreeRes));
      } catch (subErr) {
        console.warn("Error fetching sub-entities:", subErr.message);
      }

      // Run validation scan automatically to provide instant visual readiness
      try {
        const valRes = await validateOnboarding(onboardingId);
        setValidationReport(valRes?.data || valRes);
      } catch (valErr) {
        setValidationReport({ valid: false, missingRequirements: [valErr.message] });
      }
    } catch (err) {
      setErrorMsg(`Failed to load candidate details: ${err.message}`);
      setShowDetailModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ── Reload Sub-entities for Workspace ──
  const reloadCandidateDetails = async (onboardingId) => {
    if (!onboardingId) return;
    try {
      const currentTab = detailActiveTab;
      await handleOpenCandidateWorkspace(onboardingId);
      if (currentTab) setDetailActiveTab(currentTab);
    } catch (err) {
      console.warn("Reload details error:", err.message);
    }
  };

  // ── Save Full Candidate Profile Updates (All Domains) ──
  const handleSaveCandidateProfile = async () => {
    if (!selectedOnboarding?._id || !candidateProfileData) return;
    setSavingProfile(true);
    setErrorMsg("");
    try {
      await updateEmployeeInfo(selectedOnboarding._id, {
        personal: {
          firstName: candidateProfileData.firstName,
          middleName: candidateProfileData.middleName,
          lastName: candidateProfileData.lastName,
          email: candidateProfileData.email,
          mobileNo: candidateProfileData.mobileNo,
          dob: candidateProfileData.dob,
          gender: candidateProfileData.gender,
          marriageStatus: candidateProfileData.marriageStatus,
          bloodGroup: candidateProfileData.bloodGroup,
          department: candidateProfileData.department,
          designation: candidateProfileData.designation,
          joiningDate: candidateProfileData.joiningDate,
          reportingManager: candidateProfileData.reportingManager,
          employmentType: candidateProfileData.employmentType,
          noticePeriodDays: candidateProfileData.noticePeriodDays,
        },
        firstName: candidateProfileData.firstName,
        middleName: candidateProfileData.middleName,
        lastName: candidateProfileData.lastName,
        email: candidateProfileData.email,
        mobileNo: candidateProfileData.mobileNo,
        dob: candidateProfileData.dob,
        gender: candidateProfileData.gender,
        marriageStatus: candidateProfileData.marriageStatus,
        bloodGroup: candidateProfileData.bloodGroup,
        department: candidateProfileData.department,
        designation: candidateProfileData.designation,
        joiningDate: candidateProfileData.joiningDate,
        reportingManager: candidateProfileData.reportingManager,
        employmentType: candidateProfileData.employmentType,
        noticePeriodDays: candidateProfileData.noticePeriodDays,
        professional: candidateProfileData.professional || [],
        currentCompany: candidateProfileData.professional?.[0] || {},
        education: candidateProfileData.education || [],
        educationDetails: candidateProfileData.education || [],
        experience: candidateProfileData.experience || [],
        experienceDetails: candidateProfileData.experience || [],
        addresses: candidateProfileData.addresses || [],
        address: candidateProfileData.addresses || [],
        emergencyContact: candidateProfileData.emergencyContact || {},
        family: candidateProfileData.emergencyContact ? [candidateProfileData.emergencyContact] : [],
      });

      // Update employment parameters
      try {
        await updateEmployment(selectedOnboarding._id, {
          department: candidateProfileData.department,
          designation: candidateProfileData.designation,
          joiningDate: candidateProfileData.joiningDate,
          reportingManager: candidateProfileData.reportingManager,
          employmentType: candidateProfileData.employmentType,
          roleId: candidateProfileData.roleId,
          role: candidateProfileData.role,
        });
      } catch (empErr) {
        console.warn("updateEmployment notice:", empErr.message);
      }

      // Sync role to user account if roleId is present
      const candidateUserId = targetEmp._id || selectedOnboarding?.employeeId?._id || selectedOnboarding?.userId;
      if (candidateUserId && candidateProfileData.roleId) {
        try {
          await assignUserRole(candidateUserId, candidateProfileData.roleId);
        } catch (roleErr) {
          console.warn("assignUserRole notice:", roleErr.message);
        }
      }

      // Sync Educational qualifications via FormData to Education API
      if (candidateUserId && Array.isArray(candidateProfileData.education) && candidateProfileData.education.length > 0) {
        try {
          const eduFormData = new FormData();
          eduFormData.append("userId", String(candidateUserId));
          eduFormData.append("employeeId", String(candidateUserId));

          candidateProfileData.education.forEach((edu) => {
            const deg = (edu.degree || "").toLowerCase().trim();
            if (deg.includes("sslc") || deg.includes("10th")) {
              if (edu.university) eduFormData.append("sslcSchoolName", edu.university);
              if (edu.stream) eduFormData.append("sslcBoard", edu.stream);
              if (edu.yearOfPassing) eduFormData.append("sslcYearOfPassing", String(edu.yearOfPassing));
              if (edu.percentage) eduFormData.append("sslcPercentage", String(edu.percentage).replace(/[^0-9.]/g, ""));
              if (edu.certificateFile instanceof File) eduFormData.append("sslcDocument", edu.certificateFile, edu.certificateFile.name || "sslc_certificate.pdf");
            } else if (deg.includes("hsc") || deg.includes("12th") || deg.includes("+2")) {
              if (edu.university) eduFormData.append("hscSchoolName", edu.university);
              if (edu.stream) eduFormData.append("hscBoard", edu.stream);
              if (edu.yearOfPassing) eduFormData.append("hscYearOfPassing", String(edu.yearOfPassing));
              if (edu.percentage) eduFormData.append("hscPercentage", String(edu.percentage).replace(/[^0-9.]/g, ""));
              if (edu.certificateFile instanceof File) eduFormData.append("hscDocument", edu.certificateFile, edu.certificateFile.name || "hsc_certificate.pdf");
            } else if (deg.includes("iti")) {
              if (edu.university) eduFormData.append("itiinstituteName", edu.university);
              if (edu.stream) eduFormData.append("iticourse", edu.stream);
              if (edu.yearOfPassing) eduFormData.append("itiyearOfPassing", String(edu.yearOfPassing));
              if (edu.percentage) eduFormData.append("itipercentage", String(edu.percentage).replace(/[^0-9.]/g, ""));
              if (edu.certificateFile instanceof File) eduFormData.append("itiDocument", edu.certificateFile, edu.certificateFile.name || "iti_certificate.pdf");
            } else if (deg.includes("diploma")) {
              if (edu.university) eduFormData.append("diplomainstitution", edu.university);
              if (edu.stream) eduFormData.append("diplomacourse", edu.stream);
              if (edu.yearOfPassing) eduFormData.append("diplomayearOfPassing", String(edu.yearOfPassing));
              if (edu.percentage) eduFormData.append("diplomapercentage", String(edu.percentage).replace(/[^0-9.]/g, ""));
              if (edu.certificateFile instanceof File) eduFormData.append("diplomaDocument", edu.certificateFile, edu.certificateFile.name || "diploma_certificate.pdf");
            } else if (deg.includes("pg") || deg.includes("master") || deg.includes("mtech") || deg.includes("m.") || deg.includes("mca") || deg.includes("mba") || deg.includes("msc") || deg.includes("me")) {
              if (edu.university) {
                eduFormData.append("pgInstituteName", edu.university);
                eduFormData.append("pgUniversityName", edu.university);
              }
              if (edu.degree) eduFormData.append("pgDegree", edu.degree);
              if (edu.stream) eduFormData.append("pgDepartmentCourse", edu.stream);
              if (edu.yearOfPassing) eduFormData.append("pgYearOfPassing", String(edu.yearOfPassing));
              if (edu.percentage) {
                const rawVal = String(edu.percentage).replace(/[^0-9.]/g, "");
                if (String(edu.percentage).includes("CGPA") || parseFloat(rawVal) <= 10) {
                  eduFormData.append("pgCgpa", rawVal);
                } else {
                  eduFormData.append("pgPercentage", rawVal);
                }
              }
              if (edu.certificateFile instanceof File) eduFormData.append("pgDocument", edu.certificateFile, edu.certificateFile.name || "pg_certificate.pdf");
            } else if (deg.includes("phd") || deg.includes("doctor")) {
              if (edu.university) {
                eduFormData.append("phdInstituteName", edu.university);
                eduFormData.append("phdUniversityName", edu.university);
              }
              if (edu.stream) eduFormData.append("phdResearchArea", edu.stream);
              if (edu.yearOfPassing) eduFormData.append("phdYearOfPassing", String(edu.yearOfPassing));
              if (edu.certificateFile instanceof File) eduFormData.append("phdDocument", edu.certificateFile, edu.certificateFile.name || "phd_certificate.pdf");
            } else {
              if (edu.university) {
                eduFormData.append("ugInstituteName", edu.university);
                eduFormData.append("ugUniversityName", edu.university);
              }
              if (edu.degree) eduFormData.append("ugDegree", edu.degree);
              if (edu.stream) eduFormData.append("ugDepartmentCourse", edu.stream);
              if (edu.yearOfPassing) eduFormData.append("ugYearOfPassing", String(edu.yearOfPassing));
              if (edu.percentage) {
                const rawVal = String(edu.percentage).replace(/[^0-9.]/g, "");
                if (String(edu.percentage).includes("CGPA") || parseFloat(rawVal) <= 10) {
                  eduFormData.append("ugCgpa", rawVal);
                } else {
                  eduFormData.append("ugPercentage", rawVal);
                }
              }
              if (edu.certificateFile instanceof File) eduFormData.append("ugDocument", edu.certificateFile, edu.certificateFile.name || "ug_certificate.pdf");
            }
          });

          eduFormData.append("education", JSON.stringify(candidateProfileData.education));
          await updateEducation(candidateUserId, eduFormData).catch(async () => {
            await createEducation(eduFormData).catch((e) => console.warn("Education sync notice:", e.message));
          });
        } catch (eduSyncErr) {
          console.warn("Education update sync notice:", eduSyncErr.message);
        }
      }

      // Sync Current Company & Professional records to Backend
      if (candidateUserId && Array.isArray(candidateProfileData.professional) && candidateProfileData.professional.length > 0) {
        try {
          const primaryComp = candidateProfileData.professional.find((p) => p.isCurrent) || candidateProfileData.professional[0];
          if (primaryComp && (primaryComp.companyName || primaryComp.isFresher)) {
            const compPayload = {
              userId: String(candidateUserId),
              employeeId: String(candidateUserId),
              companyName: primaryComp.companyName || (primaryComp.isFresher ? "Current Organization (Fresher)" : ""),
              companyWebsite: primaryComp.companyWebsite || primaryComp.website || primaryComp.linkedin || "",
              location: primaryComp.location || "",
              department: primaryComp.department || candidateProfileData.department || "",
              designation: primaryComp.designation || candidateProfileData.designation || "",
              role: primaryComp.role || "",
              salary: primaryComp.salary || "",
              joiningDate: primaryComp.joiningDate || candidateProfileData.joiningDate || "",
              reportedTo: primaryComp.reportedTo || candidateProfileData.reportingManager || "",
              noticePeriod: primaryComp.noticePeriod || "",
              expectedLastWorkingDate: primaryComp.expectedLastWorkingDate || "",
              employmentStatus: primaryComp.employmentStatus || "CURRENTLY_EMPLOYED",
              isCurrent: primaryComp.isCurrent !== false,
              isFresher: primaryComp.isFresher || false,
              documentType: primaryComp.documentType || "OFFER_LETTER",
              documentUrl: primaryComp.documentUrl || "",
            };
            await createCurrentCompanyApi(compPayload).catch((e) => console.warn("createCurrentCompanyApi notice:", e.message));
          }
        } catch (compSyncErr) {
          console.warn("Company sync notice:", compSyncErr.message);
        }
      }

      await updatePayroll(selectedOnboarding._id, {
        bankDetails: {
          bankName: candidateProfileData.bankDetails?.bankName || "",
          accountHolderName: candidateProfileData.bankDetails?.accountHolderName || candidateProfileData.bankDetails?.accountName || "",
          accountNumber: candidateProfileData.bankDetails?.accountNumber || "",
          accountType: candidateProfileData.bankDetails?.accountType || "SAVINGS",
          ifsc: candidateProfileData.bankDetails?.ifsc || candidateProfileData.bankDetails?.ifscCode || "",
          ifscCode: candidateProfileData.bankDetails?.ifsc || candidateProfileData.bankDetails?.ifscCode || "",
          branchName: candidateProfileData.bankDetails?.branchName || "",
        },
        statutoryDetails: {
          panNo: candidateProfileData.statutoryDetails?.panNo || "",
          aadhaarNo: candidateProfileData.statutoryDetails?.aadhaarNo || "",
          uanNo: candidateProfileData.statutoryDetails?.uanNo || "",
          pfNo: candidateProfileData.statutoryDetails?.pfNo || "",
          esiNo: candidateProfileData.statutoryDetails?.esiNo || "",
        },
      });

      setSuccessMsg("Candidate profile and background records updated successfully!");
      setIsEditingCandidateProfile(false);
      await handleOpenCandidateWorkspace(selectedOnboarding._id);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile records.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Run Validation Scan ──
  const handleRunValidation = async (showPopup = false) => {
    if (!selectedOnboarding?._id) return;
    setValidating(true);
    setErrorMsg("");
    try {
      const res = await validateOnboarding(selectedOnboarding._id);
      const report = res?.data || res;
      setValidationReport(report);
      await loadPipelineData();
      if (report?.valid) {
        setSuccessMsg("All backend validation checks passed! Ready for Onboarding Completion.");
      }
      if (showPopup === true) {
        setShowValidationModal(true);
      }
    } catch (err) {
      setErrorMsg(err.message || "Validation scan failed");
      if (showPopup === true) {
        setShowValidationModal(true);
      }
    } finally {
      setValidating(false);
    }
  };

  // ── Complete Onboarding Action ──
  const handleCompleteOnboarding = async () => {
    if (!selectedOnboarding?._id) return;
    setActionLoading(true);
    setErrorMsg("");
    try {
      const res = await completeOnboarding(selectedOnboarding._id);
      setSuccessMsg(res?.message || "Onboarding marked COMPLETED successfully!");
      await reloadCandidateDetails(selectedOnboarding._id);
      await loadPipelineData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete onboarding");
      if (err.missingRequirements) {
        setValidationReport((prev) => ({
          ...(prev || {}),
          valid: false,
          missingRequirements: err.missingRequirements,
          sections: err.sections || prev?.sections,
        }));
      }
      setShowValidationModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Activate Employee Action ──
  const handleActivateEmployee = async () => {
    if (!selectedOnboarding?._id) return;
    setActionLoading(true);
    setErrorMsg("");
    try {
      const res = await activateEmployee(selectedOnboarding._id);
      setSuccessMsg(res?.message || "Employee successfully ACTIVATED in organization!");
      await reloadCandidateDetails(selectedOnboarding._id);
      await loadPipelineData();
      await loadMasterData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to activate employee");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Verify / Reject Document ──
  const handleVerifyDoc = async (docId) => {
    if (!selectedOnboarding?._id || !docId) return;
    try {
      await verifyOnboardingDocument(selectedOnboarding._id, docId);
      setSuccessMsg("Document verified successfully.");
      const docsRes = await fetchOnboardingDocuments(selectedOnboarding._id).catch(() => null);
      if (docsRes) setDetailDocs(toArray(docsRes));
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to verify document");
    }
  };

  const handleRejectDoc = async () => {
    if (!selectedOnboarding?._id || !rejectModal.docId) return;
    try {
      await rejectOnboardingDocument(selectedOnboarding._id, rejectModal.docId, rejectModal.reason);
      setSuccessMsg("Document rejected with feedback reason.");
      setRejectModal({ show: false, docId: null, reason: "" });
      const docsRes = await fetchOnboardingDocuments(selectedOnboarding._id).catch(() => null);
      if (docsRes) setDetailDocs(toArray(docsRes));
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to reject document");
    }
  };

  // ── Task Management Actions ──
  const handleToggleTaskStatus = async (taskId, currentStatus) => {
    if (!selectedOnboarding?._id || !taskId) return;
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await updateOnboardingTask(selectedOnboarding._id, taskId, { status: nextStatus });
      const tasksRes = await fetchOnboardingTasks(selectedOnboarding._id);
      if (tasksRes) setDetailTasks(toArray(tasksRes));
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update task");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedOnboarding?._id || !newTaskForm.taskName) return;
    try {
      await addOnboardingTask(selectedOnboarding._id, newTaskForm);
      setNewTaskForm({
        taskName: "",
        description: "",
        responsibleGroup: "HR",
        category: "DOCUMENT_VERIFICATION",
        priority: "MEDIUM",
        dueDate: "",
        isMandatory: true,
      });
      const tasksRes = await fetchOnboardingTasks(selectedOnboarding._id);
      if (tasksRes) setDetailTasks(toArray(tasksRes));
      setSuccessMsg("Task added successfully.");
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to add task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!selectedOnboarding?._id || !taskId) return;
    try {
      await deleteOnboardingTask(selectedOnboarding._id, taskId);
      const tasksRes = await fetchOnboardingTasks(selectedOnboarding._id);
      if (tasksRes) setDetailTasks(toArray(tasksRes));
      setSuccessMsg("Task removed.");
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to remove task");
    }
  };

  // ── Asset Management Actions & Helpers ──
  const getAssetCategoryIcon = (category) => {
    switch (category) {
      case "LAPTOP":
        return <FaLaptop className="me-1 text-primary" />;
      case "DESKTOP":
        return <FaDesktop className="me-1 text-info" />;
      case "MOBILE":
        return <FaMobileAlt className="me-1 text-success" />;
      case "MONITOR":
        return <FaTv className="me-1 text-warning" />;
      case "PERIPHERAL":
        return <FaKeyboard className="me-1 text-secondary" />;
      case "VEHICLE":
        return <FaCar className="me-1 text-danger" />;
      default:
        return <FaBox className="me-1 text-muted" />;
    }
  };

  const getAssetStatusBadge = (status) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge bg="success" className="px-2.5 py-1 rounded-pill" style={{ backgroundColor: "#10b981", fontSize: "0.75rem" }}>
            ● Available
          </Badge>
        );
      case "ASSIGNED":
        return (
          <Badge bg="primary" className="px-2.5 py-1 rounded-pill" style={{ backgroundColor: "#3b82f6", fontSize: "0.75rem" }}>
            ● Assigned
          </Badge>
        );
      case "DAMAGED":
        return (
          <Badge bg="danger" className="px-2.5 py-1 rounded-pill" style={{ backgroundColor: "#ef4444", fontSize: "0.75rem" }}>
            ● Damaged
          </Badge>
        );
      case "UNDER_REPAIR":
        return (
          <Badge bg="warning" className="px-2.5 py-1 text-dark rounded-pill" style={{ backgroundColor: "#f59e0b", fontSize: "0.75rem" }}>
            ● Under Repair
          </Badge>
        );
      case "RETIRED":
        return (
          <Badge bg="secondary" className="px-2.5 py-1 rounded-pill" style={{ backgroundColor: "#64748b", fontSize: "0.75rem" }}>
            ● Retired
          </Badge>
        );
      default:
        return <Badge bg="secondary" className="rounded-pill">{status || "Unknown"}</Badge>;
    }
  };

  const assetCounts = useMemo(() => {
    const candidateUserId = String(targetEmp._id || selectedOnboarding?.employeeId?._id || selectedOnboarding?.userId || selectedOnboarding?.employeeId || "");
    const candCode = String(selectedOnboarding?.candidateCode || targetEmp.employeeCode || "").toLowerCase();

    const total = assetInventory.length;
    const available = assetInventory.filter((a) => a.status === "AVAILABLE").length;
    const assignedTotal = assetInventory.filter((a) => a.status === "ASSIGNED").length;
    const damaged = assetInventory.filter((a) => a.status === "DAMAGED" || a.status === "UNDER_REPAIR").length;

    const assignedToThisCandidate = assetInventory.filter((a) => {
      if (!a.currentAssignee) return false;
      const assId = String(a.currentAssignee._id || a.currentAssignee.id || a.currentAssignee);
      const assCode = String(a.currentAssignee.employeeCode || "").toLowerCase();
      return (candidateUserId && assId === candidateUserId) || (candCode && assCode === candCode);
    });

    return {
      total,
      available,
      assigned: assignedTotal,
      damaged,
      candidateAssigned: assignedToThisCandidate.length > 0 ? assignedToThisCandidate.length : detailAssets.length,
    };
  }, [assetInventory, targetEmp, selectedOnboarding, detailAssets]);

  const filteredAssetsList = useMemo(() => {
    let list = assetInventory;
    const candidateUserId = String(targetEmp._id || selectedOnboarding?.employeeId?._id || selectedOnboarding?.userId || selectedOnboarding?.employeeId || "");
    const candCode = String(selectedOnboarding?.candidateCode || targetEmp.employeeCode || "").toLowerCase();

    if (assetSubTab === "assigned") {
      list = list.filter((a) => {
        if (!a.currentAssignee) return false;
        const assId = String(a.currentAssignee._id || a.currentAssignee.id || a.currentAssignee);
        const assCode = String(a.currentAssignee.employeeCode || "").toLowerCase();
        return (candidateUserId && assId === candidateUserId) || (candCode && assCode === candCode);
      });
    } else if (assetSubTab === "available") {
      list = list.filter((a) => a.status === "AVAILABLE");
    }

    if (assetStatusFilter) {
      list = list.filter((a) => a.status === assetStatusFilter);
    }
    if (assetCategoryFilter) {
      list = list.filter((a) => a.category === assetCategoryFilter);
    }
    if (assetSearchQuery.trim()) {
      const q = assetSearchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const code = (a.assetCode || "").toLowerCase();
        const name = (a.name || "").toLowerCase();
        const serial = (a.serialNumber || "").toLowerCase();
        const model = (a.modelName || "").toLowerCase();
        const mfg = (a.manufacturer || "").toLowerCase();
        const assignee = a.currentAssignee ? `${a.currentAssignee.firstName || ""} ${a.currentAssignee.lastName || ""}`.toLowerCase() : "";
        return code.includes(q) || name.includes(q) || serial.includes(q) || model.includes(q) || mfg.includes(q) || assignee.includes(q);
      });
    }
    return list;
  }, [assetInventory, assetSubTab, assetStatusFilter, assetCategoryFilter, assetSearchQuery, targetEmp, selectedOnboarding]);

  const handleAssignAssetToCandidate = async (asset, condition = "Brand New", remarks = "") => {
    if (!selectedOnboarding?._id || !asset?._id) return;
    setAssigningAssetLoading(true);
    setErrorMsg("");
    try {
      await assignOnboardingAsset(selectedOnboarding._id, {
        assetId: asset._id,
        conditionOnAssignment: condition,
        remarks: remarks || `Assigned during onboarding to ${candidateName}`,
      });
      setSuccessMsg(`Asset "${asset.name}" (${asset.assetCode || asset.serialNumber || ""}) assigned successfully!`);
      const assetsRes = await fetchOnboardingAssets(selectedOnboarding._id);
      if (assetsRes) setDetailAssets(toArray(assetsRes));
      await loadAssetInventory();
      await handleRunValidation(false);
      setShowAssignAssetModal(false);
      setSelectedAssetToAssign(null);
    } catch (err) {
      setErrorMsg(err.message || "Failed to assign asset");
    } finally {
      setAssigningAssetLoading(false);
    }
  };

  const handleReturnCandidateAsset = async (assetId, assetName = "Asset") => {
    if (!selectedOnboarding?._id || !assetId) return;
    setErrorMsg("");
    try {
      await unassignOnboardingAsset(selectedOnboarding._id, assetId, "Returned during onboarding adjustment");
      setSuccessMsg(`Asset "${assetName}" returned and restored to available inventory.`);
      const assetsRes = await fetchOnboardingAssets(selectedOnboarding._id);
      if (assetsRes) setDetailAssets(toArray(assetsRes));
      await loadAssetInventory();
      await handleRunValidation(false);
    } catch (err) {
      setErrorMsg(err.message || "Failed to return asset");
    }
  };

  const handleCreateNewAsset = async (e) => {
    e?.preventDefault();
    if (!createAssetForm.name.trim()) return;
    setCreateAssetSubmitting(true);
    setErrorMsg("");
    try {
      await createAsset(createAssetForm);
      setSuccessMsg(`New asset "${createAssetForm.name}" created successfully in inventory!`);
      setShowCreateAssetModal(false);
      setCreateAssetForm({
        name: "",
        category: "LAPTOP",
        serialNumber: "",
        modelName: "",
        manufacturer: "",
        purchaseDate: "",
        warrantyExpiryDate: "",
      });
      await loadAssetInventory();
      await loadMasterData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to create asset.");
    } finally {
      setCreateAssetSubmitting(false);
    }
  };

  // ── System Access Actions ──
  const handleUpdateAccessStatus = async (accessId, status) => {
    if (!selectedOnboarding?._id || !accessId) return;
    try {
      await updateOnboardingAccess(selectedOnboarding._id, accessId, { status });
      const accessRes = await fetchOnboardingAccess(selectedOnboarding._id);
      if (accessRes) setDetailAccess(toArray(accessRes));
      setSuccessMsg(`System access status updated to ${status}.`);
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update access status");
    }
  };

  const handleAddAccess = async (e) => {
    e.preventDefault();
    if (!selectedOnboarding?._id || !newAccessForm.systemName) return;
    try {
      await addOnboardingAccess(selectedOnboarding._id, newAccessForm);
      setNewAccessForm({ systemName: "", accessType: "Standard", isMandatory: true });
      const accessRes = await fetchOnboardingAccess(selectedOnboarding._id);
      if (accessRes) setDetailAccess(toArray(accessRes));
      setSuccessMsg("System access item added.");
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to add system access");
    }
  };

  // ── Agreement Actions ──
  const handleAcknowledgeAgreement = async (agreeId, status = "ACCEPTED") => {
    if (!selectedOnboarding?._id || !agreeId) return;
    try {
      // Optimistically update the UI instantly so the row becomes Accepted without jumping
      setDetailAgreements((prev) =>
        prev.map((agr) =>
          agr._id === agreeId || agr.id === agreeId
            ? { ...agr, status: status, isAcknowledged: true }
            : agr
        )
      );
      await acknowledgeOnboardingAgreement(selectedOnboarding._id, agreeId, status);
      const agreeRes = await fetchOnboardingAgreements(selectedOnboarding._id).catch(() => null);
      if (agreeRes) setDetailAgreements(toArray(agreeRes));
      setSuccessMsg(`Agreement marked as ${status}.`);
      await handleRunValidation(false);
    } catch (err) {
      setErrorMsg(err.message || "Failed to acknowledge agreement");
    }
  };

  const handleAddAgreement = async (e) => {
    e.preventDefault();
    if (!selectedOnboarding?._id || !newAgreementForm.title) return;
    try {
      await addOnboardingAgreement(selectedOnboarding._id, newAgreementForm);
      setNewAgreementForm({ agreementType: "NDA", title: "", isRequired: true });
      const agreeRes = await fetchOnboardingAgreements(selectedOnboarding._id);
      if (agreeRes) setDetailAgreements(toArray(agreeRes));
      setSuccessMsg("Agreement requirement added.");
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to add agreement");
    }
  };

  // ── Training Actions ──
  const handleUpdateTrainingStatus = async (trainId, status) => {
    if (!selectedOnboarding?._id || !trainId) return;
    try {
      await updateOnboardingTraining(selectedOnboarding._id, trainId, { status });
      const trainRes = await fetchOnboardingTraining(selectedOnboarding._id);
      if (trainRes) setDetailTraining(toArray(trainRes));
      setSuccessMsg(`Training status set to ${status}.`);
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update training status");
    }
  };

  const handleAddTraining = async (e) => {
    e.preventDefault();
    if (!selectedOnboarding?._id || !newTrainingForm.trainingName) return;
    try {
      await addOnboardingTraining(selectedOnboarding._id, newTrainingForm);
      setNewTrainingForm({ trainingName: "", trainer: "HR Team", scheduledDate: "", mandatory: true });
      const trainRes = await fetchOnboardingTraining(selectedOnboarding._id);
      if (trainRes) setDetailTraining(toArray(trainRes));
      setSuccessMsg("Training scheduled.");
      await handleRunValidation();
    } catch (err) {
      setErrorMsg(err.message || "Failed to schedule training");
    }
  };

  // ── Helper: Add / Remove rows for multi-entry sections in Initiate Form ──
  const addProfessionalRow = () => {
    setFormData((prev) => ({
      ...prev,
      professional: [
        ...prev.professional,
        {
          companyName: "",
          companyWebsite: "",
          department: "",
          designation: "",
          role: "",
          salary: "",
          joiningDate: new Date().toISOString().split("T")[0],
          reportedTo: "",
          noticePeriod: "",
          expectedLastWorkingDate: "",
          employmentStatus: "CURRENTLY_EMPLOYED",
          isFresher: false,
          location: "",
          isCurrent: false,
          docType: "EXPERIENCE_LETTER",
          docFile: null,
          docName: "",
        },
      ],
    }));
  };
  const removeProfessionalRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      professional: prev.professional.filter((_, i) => i !== index),
    }));
  };

  const addExperienceRow = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          companyName: "",
          prevCompany: "",
          designation: "",
          experience: "",
          experienceYears: "",
          description: "",
          roleDescription: "",
          salary: "",
          startDate: "",
          endDate: "",
          isCurrentJob: false,
          noticePeriod: "",
          expectedLastWorkingDate: "",
          employmentStatus: "RELIEVED",
          docType: "EXPERIENCE_LETTER",
          experienceDocFile: null,
          experienceDocName: "",
        },
      ],
    }));
  };
  const removeExperienceRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addAddressRow = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { addressType: "Current", addressLine1: "", addressLine2: "", city: "", state: "", country: "India", pincode: "" },
      ],
    }));
  };
  const removeAddressRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));
  };

  const addFamilyContactRow = () => {
    setFormData((prev) => ({
      ...prev,
      familyContacts: [
        ...prev.familyContacts,
        { name: "", relationship: "Mother", phone: "", email: "", occupation: "" },
      ],
    }));
  };
  const removeFamilyContactRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      familyContacts: prev.familyContacts.filter((_, i) => i !== index),
    }));
  };

  // ── Profile Photo Selection Handler ──
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        profilePicFile: file,
        profilePicPreview: previewUrl,
      }));
    }
  };

  // ── Handle Initial Onboarding Form Submit ──
  const handleOnboardSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const { isValid, errors } = validateSection(activeFormTab);
    if (!isValid) {
      setFormErrors(errors);
      setErrorMsg("Please correct the validation errors in this section before submitting.");
      return;
    }
    setFormErrors({});

    setSubmittingForm(true);
    try {
      const defaultRole = assignableRoles.find((r) => r.roleCode === "EMPLOYEE") || assignableRoles[0];
      const primaryFamily = formData.familyContacts[0] || {};
      const isFresher = Boolean(formData.isFresher || formData.professional?.some((p) => p.isFresher));

      // Aggregate all education qualifications
      const aggregatedEducation = [];
      if (formData.sslcSchoolName || formData.sslcBoard || formData.sslcYearOfPassing || formData.sslcPercentage) {
        aggregatedEducation.push({
          degree: "SSLC / 10th",
          stream: formData.sslcBoard || "General",
          university: formData.sslcSchoolName || "",
          percentage: formData.sslcPercentage || "",
          yearOfPassing: formData.sslcYearOfPassing || "",
        });
      }
      if (formData.hscSchoolName || formData.hscBoard || formData.hscYearOfPassing || formData.hscPercentage) {
        aggregatedEducation.push({
          degree: "HSC / 12th",
          stream: formData.hscBoard || "General",
          university: formData.hscSchoolName || "",
          percentage: formData.hscPercentage || "",
          yearOfPassing: formData.hscYearOfPassing || "",
        });
      }
      if (formData.itiinstituteName || formData.iticourse || formData.itiyearOfPassing || formData.itipercentage) {
        aggregatedEducation.push({
          degree: "ITI",
          stream: formData.iticourse || "",
          university: formData.itiinstituteName || "",
          percentage: formData.itipercentage || "",
          yearOfPassing: formData.itiyearOfPassing || "",
        });
      }
      if (formData.diplomainstitution || formData.diplomacourse || formData.diplomayearOfPassing || formData.diplomapercentage) {
        aggregatedEducation.push({
          degree: "Diploma",
          stream: formData.diplomacourse || "",
          university: formData.diplomainstitution || "",
          percentage: formData.diplomapercentage || "",
          yearOfPassing: formData.diplomayearOfPassing || "",
        });
      }
      if (formData.ugInstituteName || formData.ugUniversityName || formData.ugDegree || formData.ugDepartmentCourse || formData.ugYearOfPassing || formData.ugCgpa) {
        aggregatedEducation.push({
          degree: formData.ugDegree || "UG / Bachelor's",
          stream: formData.ugDepartmentCourse || "",
          university: formData.ugInstituteName || formData.ugUniversityName || "",
          percentage: formData.ugCgpa || "",
          yearOfPassing: formData.ugYearOfPassing || "",
        });
      }
      if (formData.pgInstituteName || formData.pgUniversityName || formData.pgDegree || formData.pgDepartmentCourse || formData.pgYearOfPassing || formData.pgCgpa) {
        aggregatedEducation.push({
          degree: formData.pgDegree || "PG / Master's",
          stream: formData.pgDepartmentCourse || "",
          university: formData.pgInstituteName || formData.pgUniversityName || "",
          percentage: formData.pgCgpa || "",
          yearOfPassing: formData.pgYearOfPassing || "",
        });
      }
      if (formData.phdInstituteName || formData.phdUniversityName || formData.phdResearchArea || formData.phdYearOfPassing) {
        aggregatedEducation.push({
          degree: "PhD / Doctorate",
          stream: formData.phdResearchArea || "",
          university: formData.phdInstituteName || formData.phdUniversityName || "",
          percentage: "",
          yearOfPassing: formData.phdYearOfPassing || "",
        });
      }
      if (aggregatedEducation.length === 0 && Array.isArray(formData.education)) {
        formData.education.forEach((ed) => {
          if (ed.degree || ed.stream || ed.university) {
            aggregatedEducation.push({
              degree: ed.degree || "",
              stream: ed.stream || "",
              university: ed.university || "",
              percentage: ed.percentage || "",
              yearOfPassing: ed.yearOfPassing || "",
            });
          }
        });
      }

      const candidateFirstName = formData.firstName?.trim() || "Candidate";
      const candidateLastName = formData.lastName?.trim() || "Employee";
      const candidateEmail = formData.email?.trim().toLowerCase() || `candidate_${Date.now()}@company.com`;
      const candidateMobileNo = formData.mobileNo?.trim() || "9876543210";
      const candidateDob = formData.dob || "2000-01-01";
      const candidateDept = formData.department?.trim() || "General";
      const candidateDesig = formData.designation?.trim() || "Employee";
      const candidateJoiningDate = formData.joiningDate || new Date().toISOString().split("T")[0];
      const candidateEmploymentType = formData.employmentType || "FULL_TIME";
      const candidateGender = formData.gender || "Male";
      const candidateMarriageStatus = formData.marriageStatus || "Unmarried";

      const normalizedProfessional = formData.professional.map((p) => ({
        companyName: p.companyName || "Arise",
        companyWebsite: p.companyWebsite || p.website || "",
        department: p.department || candidateDept,
        designation: p.designation || candidateDesig,
        role: p.role || "",
        salary: p.salary || "",
        joiningDate: p.joiningDate || candidateJoiningDate,
        reportedTo: p.reportedTo || "",
        noticePeriod: p.noticePeriod || "60 Days",
        expectedLastWorkingDate: p.expectedLastWorkingDate || null,
        employmentStatus: p.employmentStatus || "CURRENTLY_EMPLOYED",
        isFresher: Boolean(p.isFresher || isFresher),
        isCurrent: true,
        location: p.location || "",
        docType: p.docType || "OFFER_LETTER",
      }));

      const normalizedExperience = isFresher ? [] : formData.experience
        .filter((ex) => ex.prevCompany || ex.companyName || ex.designation)
        .map((ex) => ({
          prevCompany: ex.prevCompany || ex.companyName || "",
          companyName: ex.companyName || ex.prevCompany || "",
          designation: ex.designation || "",
          experienceYears: ex.experienceYears || ex.experience || "",
          roleDescription: ex.roleDescription || ex.description || "",
          salary: ex.salary || "",
          startDate: ex.startDate || "",
          endDate: ex.endDate || "",
          docType: ex.docType || "EXPERIENCE_LETTER",
        }));

      const normalizedAddresses = formData.addresses.map((a) => ({
        addressType: a.addressType || "Permanent",
        addressLine1: a.addressLine1 || a.address1 || a.addressLine || a.address || "",
        address1: a.addressLine1 || a.address1 || a.addressLine || a.address || "",
        addressLine2: a.addressLine2 || a.address2 || "",
        address2: a.addressLine2 || a.address2 || "",
        city: a.city || "",
        state: a.state || "",
        country: a.country || "India",
        pincode: String(a.pincode || a.postalCode || "").trim(),
      }));

      const normalizedFamily = Array.isArray(formData.familyContacts)
        ? formData.familyContacts
            .filter((f) => f.name || f.phone)
            .map((f) => ({
              name: f.name || "",
              relationship: f.relationship || "Guardian",
              phone: f.phone || "",
              email: f.email || "",
              occupation: f.occupation || "",
            }))
        : [];

      // 1. Initiate candidate onboarding directly via /onboarding/initiate
      const res = await initiateOnboarding({
        firstName: candidateFirstName,
        middleName: formData.middleName?.trim() || null,
        lastName: candidateLastName,
        email: candidateEmail,
        mobileNo: candidateMobileNo,
        dob: candidateDob,
        gender: candidateGender,
        marriageStatus: candidateMarriageStatus,
        bloodGroup: formData.bloodGroup || "O+",
        department: candidateDept,
        designation: candidateDesig,
        joiningDate: candidateJoiningDate,
        employmentType: candidateEmploymentType,
        roleId: formData.roleId || defaultRole?._id,
        isFresher: Boolean(isFresher),
        professional: normalizedProfessional,
        currentCompany: normalizedProfessional[0] || {},
        education: aggregatedEducation,
        educationDetails: aggregatedEducation,
        experience: normalizedExperience,
        experienceDetails: normalizedExperience,
        addresses: normalizedAddresses,
        address: normalizedAddresses,
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNo,
          ifsc: formData.ifsc,
          branchName: formData.branchName,
        },
        statutoryDetails: {
          panNo: formData.panNo,
          aadhaarNo: formData.aadhaarNo,
          uanNo: formData.uanNo,
        },
        emergencyContact: {
          name: primaryFamily.name || "Emergency Contact",
          relationship: primaryFamily.relationship || "Guardian",
          phone: primaryFamily.phone || "0000000000",
          email: primaryFamily.email || "",
        },
        familyContacts: normalizedFamily,
        family: normalizedFamily,
      });

      const createdUser = res?.data?.user || res?.user;
      const createdOnboarding = res?.data?.onboarding || res?.onboarding;
      const onboardingId = createdOnboarding?._id || res?.data?._id || res?._id;

      // 2. Persist full profile domains and payroll details to backend
      if (onboardingId) {
        try {
          await updateEmployeeInfo(onboardingId, {
            professional: normalizedProfessional,
            currentCompany: normalizedProfessional[0] || {},
            education: aggregatedEducation,
            educationDetails: aggregatedEducation,
            experience: normalizedExperience,
            experienceDetails: normalizedExperience,
            addresses: normalizedAddresses,
            address: normalizedAddresses,
            emergencyContact: {
              name: primaryFamily.name || "Emergency Contact",
              relationship: primaryFamily.relationship || "Guardian",
              phone: primaryFamily.phone || "0000000000",
              email: primaryFamily.email || "",
            },
            family: normalizedFamily.length > 0 ? normalizedFamily : [
              {
                name: primaryFamily.name || "Emergency Contact",
                relationship: primaryFamily.relationship || "Guardian",
                phone: primaryFamily.phone || "0000000000",
                email: primaryFamily.email || "",
              },
            ],
          });
          await updatePayroll(onboardingId, {
            bankDetails: {
              bankName: formData.bankName,
              accountNumber: formData.accountNo,
              ifsc: formData.ifsc,
              branchName: formData.branchName,
            },
            statutoryDetails: {
              panNo: formData.panNo,
              aadhaarNo: formData.aadhaarNo,
              uanNo: formData.uanNo,
            },
          });

          // updateEmployeeInfo and updatePayroll persist all core domains (personal, professional, education, experience, address, bank, and statutory details) directly.
        } catch (subSaveErr) {
          console.warn("Background domain persistence notice:", subSaveErr.message);
        }

        // 3. Upload optional files concurrently if provided
        const uploadPromises = [];

        // Upload Profile Photo
        if (formData.profilePicFile) {
          uploadPromises.push(uploadCandidateProfilePic(onboardingId, formData.profilePicFile).catch((e) => console.warn("Profile pic upload:", e.message)));
        }

        // Upload Professional Documents (Offer Letter / Relieving Letter / Payslip / Experience Letter)
        formData.professional.forEach((prof) => {
          if (prof.docFile) {
            uploadPromises.push(
              uploadProfessionalDocument(onboardingId, prof.docFile, prof.companyName, prof.docType || "OFFER_LETTER").catch((e) =>
                console.warn("Professional doc upload:", e.message)
              )
            );
          }
        });

        // Upload Education Certificates from structured sections & array
        if (formData.sslcDocumentFile) {
          uploadPromises.push(uploadEducationCertificate(onboardingId, formData.sslcDocumentFile, "SSLC / 10th").catch((e) => console.warn("SSLC doc upload:", e.message)));
        }
        if (formData.hscDocumentFile) {
          uploadPromises.push(uploadEducationCertificate(onboardingId, formData.hscDocumentFile, "HSC / 12th").catch((e) => console.warn("HSC doc upload:", e.message)));
        }
        if (formData.itiDocumentFile) {
          uploadPromises.push(uploadEducationCertificate(onboardingId, formData.itiDocumentFile, "ITI").catch((e) => console.warn("ITI doc upload:", e.message)));
        }
        if (formData.diplomaDocumentFile) {
          uploadPromises.push(uploadEducationCertificate(onboardingId, formData.diplomaDocumentFile, "Diploma").catch((e) => console.warn("Diploma doc upload:", e.message)));
        }
        if (formData.ugDocumentFile) {
          uploadPromises.push(uploadEducationCertificate(onboardingId, formData.ugDocumentFile, formData.ugDegree || "UG Degree").catch((e) => console.warn("UG doc upload:", e.message)));
        }
        if (formData.pgDocumentFile) {
          uploadPromises.push(uploadEducationCertificate(onboardingId, formData.pgDocumentFile, formData.pgDegree || "PG Degree").catch((e) => console.warn("PG doc upload:", e.message)));
        }
        if (formData.phdDocumentFile) {
          uploadPromises.push(uploadEducationCertificate(onboardingId, formData.phdDocumentFile, "PhD").catch((e) => console.warn("PhD doc upload:", e.message)));
        }
        if (Array.isArray(formData.education)) {
          formData.education.forEach((edu) => {
            if (edu.certificateFile) {
              uploadPromises.push(uploadEducationCertificate(onboardingId, edu.certificateFile, edu.degree || "Degree Certificate").catch((e) => console.warn("Education doc upload:", e.message)));
            }
          });
        }

        // Upload Experience Documents (Letters / Payslips) (only if not fresher)
        if (!isFresher) {
          formData.experience.forEach((exp) => {
            if (exp.experienceDocFile) {
              uploadPromises.push(uploadExperienceDocument(onboardingId, exp.experienceDocFile, exp.prevCompany, exp.docType || "EXPERIENCE_LETTER").catch((e) => console.warn("Experience doc upload:", e.message)));
            }
          });
        }

        // Upload Bank Passbook / Cheque
        if (formData.passbookFile) {
          uploadPromises.push(uploadBankPassbook(onboardingId, formData.passbookFile).catch((e) => console.warn("Bank passbook upload:", e.message)));
        }

        // 4. Also persist full education record with files to Education schema
        const targetUserId = createdUser?._id || createdUser?.id || (typeof createdUser === "string" ? createdUser : null) || createdOnboarding?.employeeId?._id || createdOnboarding?.employeeId || createdOnboarding?.userId;
        if (targetUserId) {
          const eduFormData = new FormData();
          eduFormData.append("userId", targetUserId);
          if (formData.sslcSchoolName) eduFormData.append("sslcSchoolName", formData.sslcSchoolName);
          if (formData.sslcBoard) eduFormData.append("sslcBoard", formData.sslcBoard);
          if (formData.sslcYearOfPassing) eduFormData.append("sslcYearOfPassing", String(formData.sslcYearOfPassing));
          if (formData.sslcPercentage) eduFormData.append("sslcPercentage", String(formData.sslcPercentage));

          if (formData.hscSchoolName) eduFormData.append("hscSchoolName", formData.hscSchoolName);
          if (formData.hscBoard) eduFormData.append("hscBoard", formData.hscBoard);
          if (formData.hscYearOfPassing) eduFormData.append("hscYearOfPassing", String(formData.hscYearOfPassing));
          if (formData.hscPercentage) eduFormData.append("hscPercentage", String(formData.hscPercentage));

          if (formData.itiinstituteName) eduFormData.append("itiinstituteName", formData.itiinstituteName);
          if (formData.iticourse) eduFormData.append("iticourse", formData.iticourse);
          if (formData.itiduration) eduFormData.append("itiduration", String(formData.itiduration));
          if (formData.itiyearOfPassing) eduFormData.append("itiyearOfPassing", String(formData.itiyearOfPassing));
          if (formData.itipercentage) eduFormData.append("itipercentage", String(formData.itipercentage));

          if (formData.diplomainstitution) eduFormData.append("diplomainstitution", formData.diplomainstitution);
          if (formData.diplomacourse) eduFormData.append("diplomacourse", formData.diplomacourse);
          if (formData.diplomaduration) eduFormData.append("diplomaduration", String(formData.diplomaduration));
          if (formData.diplomayearOfPassing) eduFormData.append("diplomayearOfPassing", String(formData.diplomayearOfPassing));
          if (formData.diplomapercentage) eduFormData.append("diplomapercentage", String(formData.diplomapercentage));

          if (formData.ugInstituteName) eduFormData.append("ugInstituteName", formData.ugInstituteName);
          if (formData.ugUniversityName) eduFormData.append("ugUniversityName", formData.ugUniversityName);
          if (formData.ugDegree) eduFormData.append("ugDegree", formData.ugDegree);
          if (formData.ugDepartmentCourse) eduFormData.append("ugDepartmentCourse", formData.ugDepartmentCourse);
          if (formData.ugYearOfPassing) eduFormData.append("ugYearOfPassing", String(formData.ugYearOfPassing));
          if (formData.ugCgpa) eduFormData.append("ugCgpa", String(formData.ugCgpa));

          if (formData.pgInstituteName) eduFormData.append("pgInstituteName", formData.pgInstituteName);
          if (formData.pgUniversityName) eduFormData.append("pgUniversityName", formData.pgUniversityName);
          if (formData.pgDegree) eduFormData.append("pgDegree", formData.pgDegree);
          if (formData.pgDepartmentCourse) eduFormData.append("pgDepartmentCourse", formData.pgDepartmentCourse);
          if (formData.pgYearOfPassing) eduFormData.append("pgYearOfPassing", String(formData.pgYearOfPassing));
          if (formData.pgCgpa) eduFormData.append("pgCgpa", String(formData.pgCgpa));

          if (formData.phdInstituteName) eduFormData.append("phdInstituteName", formData.phdInstituteName);
          if (formData.phdUniversityName) eduFormData.append("phdUniversityName", formData.phdUniversityName);
          if (formData.phdResearchArea) eduFormData.append("phdResearchArea", formData.phdResearchArea);
          if (formData.phdYearOfPassing) eduFormData.append("phdYearOfPassing", String(formData.phdYearOfPassing));
          eduFormData.append("highestQualification", formData.highestQualification || "UG");

          if (formData.sslcDocumentFile) eduFormData.append("sslcDocument", formData.sslcDocumentFile);
          if (formData.hscDocumentFile) eduFormData.append("hscDocument", formData.hscDocumentFile);
          if (formData.itiDocumentFile) eduFormData.append("itiDocument", formData.itiDocumentFile);
          if (formData.diplomaDocumentFile) eduFormData.append("diplomaDocument", formData.diplomaDocumentFile);
          if (formData.ugDocumentFile) eduFormData.append("ugDocument", formData.ugDocumentFile);
          if (formData.pgDocumentFile) eduFormData.append("pgDocument", formData.pgDocumentFile);
          if (formData.phdDocumentFile) eduFormData.append("phdDocument", formData.phdDocumentFile);

          uploadPromises.push(
            createEducation(eduFormData).catch((e) => console.warn("Education schema create notice:", e.message))
          );
        }

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }
      }

      setSuccessMsg(
        `Onboarding initiated for ${createdUser?.firstName || formData.firstName} ${createdUser?.lastName || formData.lastName} (${createdUser?.employeeCode || "New"})!`
      );

      await loadPipelineData();
      await loadMasterData();

      if (onboardingId) {
        setViewTab("pipeline");
        handleOpenCandidateWorkspace(onboardingId);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to onboard employee");
    } finally {
      setSubmittingForm(false);
    }
  };

  // ── Open Provision Modal for Candidate/Employee ──
  const handleOpenProvision = (targetUser) => {
    setProvisionTarget(targetUser);
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
      if (selectedOnboarding?._id) {
        await provisionOnboardingAccount(selectedOnboarding._id, {
          roleId: provisionForm.roleId,
          password: provisionForm.password,
          isActive: provisionForm.isActive,
        });
      } else {
        await provisionUserAccount({
          employeeId: provisionTarget._id || provisionTarget.id,
          roleId: provisionForm.roleId,
          password: provisionForm.password,
          isActive: provisionForm.isActive,
        });
      }

      setSuccessMsg(
        `Login credentials provisioned successfully for ${provisionTarget.firstName} ${provisionTarget.lastName}.`
      );
      setShowProvisionModal(false);
      if (selectedOnboarding?._id) {
        await reloadCandidateDetails(selectedOnboarding._id);
      }
      await loadPipelineData();
      await loadMasterData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to provision login account");
    } finally {
      setProvisionLoading(false);
    }
  };

  // ── Toggle Login Access (Enable/Disable) ──
  const handleToggleLogin = async (onboardingId, currentlyHasAccess) => {
    if (!onboardingId) return;
    try {
      if (currentlyHasAccess) {
        await disableLogin(onboardingId);
        setSuccessMsg("Employee login access disabled.");
      } else {
        await enableLogin(onboardingId);
        setSuccessMsg("Employee login access enabled.");
      }
      await reloadCandidateDetails(onboardingId);
      await loadPipelineData();
      await loadMasterData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to toggle login access");
    }
  };

  // ── Open Directory Manage Modal ──
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

  // ── Submit Directory Manage Changes ──
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

      setSuccessMsg(`Account updated for ${manageTarget.firstName} ${manageTarget.lastName}.`);
      setShowManageModal(false);
      await loadMasterData();
      await refreshAuthContext();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update account");
    } finally {
      setProvisionLoading(false);
    }
  };

  // ── Helper: Modern Status Badge Style ──
  const getStatusBadge = (status) => {
    switch (status) {
      case "ONBOARDING":
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#1d4ed8", borderColor: "rgba(59, 130, 246, 0.3)" }}
          >
            ● Onboarding
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border"
            style={{ backgroundColor: "rgba(6, 182, 212, 0.12)", color: "#0e7490", borderColor: "rgba(6, 182, 212, 0.3)" }}
          >
            ● In Progress
          </span>
        );
      case "PENDING_VALIDATION":
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#b45309", borderColor: "rgba(245, 158, 11, 0.3)" }}
          >
            ● Pending Validation
          </span>
        );
      case "VALIDATION_FAILED":
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#b91c1c", borderColor: "rgba(239, 68, 68, 0.3)" }}
          >
            ● Validation Failed
          </span>
        );
      case "READY_FOR_COMPLETION":
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border shadow-xs"
            style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#4338ca", borderColor: "rgba(99, 102, 241, 0.4)" }}
          >
            ● Ready for Completion
          </span>
        );
      case "COMPLETED":
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#065f46", borderColor: "rgba(16, 185, 129, 0.4)" }}
          >
            <FaCheckCircle className="me-1" style={{ color: "#10b981" }} /> Completed
          </span>
        );
      case "REJECTED":
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border"
            style={{ backgroundColor: "rgba(100, 116, 139, 0.12)", color: "#334155", borderColor: "rgba(100, 116, 139, 0.3)" }}
          >
            ● Rejected
          </span>
        );
      default:
        return (
          <span
            className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill extra-small fw-bold border"
            style={{ backgroundColor: "rgba(100, 116, 139, 0.12)", color: "#334155", borderColor: "rgba(100, 116, 139, 0.3)" }}
          >
            {status || "Pending"}
          </span>
        );
    }
  };

  const isFresher = Boolean(formData.isFresher || formData.professional?.some((p) => p.isFresher));

  // ── Calculate Form Progress & Section Breakdown ──
  const sectionStatus = {
    personal: Boolean(
      formData.firstName?.trim() &&
      formData.lastName?.trim() &&
      formData.email?.trim()
    ),
    professional: Boolean(
      formData.department?.trim() ||
      formData.designation?.trim() ||
      formData.roleId
    ),
    education: Boolean(
      formData.education?.some((e) => e.degree?.trim() || e.stream?.trim() || e.university?.trim()) ||
      formData.sslcSchoolName?.trim() ||
      formData.hscSchoolName?.trim() ||
      formData.ugDegree?.trim()
    ),
    experience: Boolean(
      formData.experience?.some((e) => e.companyName?.trim() || e.prevCompany?.trim() || e.designation?.trim())
    ),
    address: Boolean(
      formData.addresses?.some((a) => a.addressLine1?.trim() || a.city?.trim() || a.state?.trim() || a.pincode?.trim())
    ),
    documents: Boolean(
      formData.statutoryDetails?.panNo?.trim() ||
      formData.statutoryDetails?.aadhaarNo?.trim() ||
      formData.bankDetails?.accountNumber?.trim() ||
      formData.panNo?.trim() ||
      formData.bankName?.trim() ||
      formData.accountNo?.trim()
    ),
    family: Boolean(
      formData.emergencyContact?.name?.trim() ||
      formData.emergencyContact?.mobileNo?.trim() ||
      formData.familyContacts?.some((f) => f.name?.trim())
    ),
  };

  const handleInitiateNewOnboarding = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      dob: "",
      gender: "Male",
      marriageStatus: "Unmarried",
      mobileNo: "",
      department: "",
      designation: "",
      joiningDate: new Date().toISOString().split("T")[0],
      employmentType: "FULL_TIME",
      roleId: "",
      password: "Welcome@123",
      bloodGroup: "O+",
      employeeCode: "",
      hasLoginAccess: true,
      skills: [],
      isFresher: false,
      profilePicFile: null,
      profilePicPreview: "",
      professional: [
        {
          companyName: "",
          companyWebsite: "",
          department: "",
          designation: "",
          role: "",
          salary: "",
          joiningDate: new Date().toISOString().split("T")[0],
          reportedTo: "",
          noticePeriod: "",
          expectedLastWorkingDate: "",
          employmentStatus: "CURRENTLY_EMPLOYED",
          isFresher: false,
          location: "",
          isCurrent: true,
          docType: "OFFER_LETTER",
          docFile: null,
          docName: "",
        },
      ],
      education: [
        { degree: "", stream: "", university: "", percentage: "", yearOfPassing: "", certificateFile: null, certificateDocName: "" },
      ],
      sslcSchoolName: "",
      sslcBoard: "",
      sslcYearOfPassing: "",
      sslcPercentage: "",
      sslcDocumentFile: null,
      sslcDocumentName: "",
      sslcDocumentUrl: "",
      hscSchoolName: "",
      hscBoard: "",
      hscYearOfPassing: "",
      hscPercentage: "",
      hscDocumentFile: null,
      hscDocumentName: "",
      hscDocumentUrl: "",
      highestQualification: "UG",
      experience: [
        {
          companyName: "",
          prevCompany: "",
          designation: "",
          experience: "",
          experienceYears: "",
          description: "",
          roleDescription: "",
          salary: "",
          startDate: "",
          endDate: "",
          isCurrentJob: false,
          noticePeriod: "",
          expectedLastWorkingDate: "",
          employmentStatus: "RELIEVED",
          docType: "EXPERIENCE_LETTER",
          experienceDocFile: null,
          experienceDocName: "",
        },
      ],
      addresses: [
        { addressType: "Permanent", addressLine1: "", addressLine2: "", city: "", state: "", country: "India", pincode: "" },
      ],
      statutoryDetails: {
        panNo: "",
        aadhaarNo: "",
        uanNo: "",
        pfNo: "",
        esiNo: "",
      },
      bankDetails: {
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        accountType: "SAVINGS",
        ifscCode: "",
        branchName: "",
        passbookFile: null,
        passbookDocName: "",
      },
      emergencyContact: {
        name: "",
        relationship: "",
        mobileNo: "",
        email: "",
        address: "",
      },
      familyContacts: [],
    });
    setActiveFormTab("personal");
    setViewTab("onboard");
  };

  const attachedDocsCount = [
    Boolean(formData.profilePicFile),
    formData.professional.some((p) => Boolean(p.docFile)),
    formData.education.some((e) => Boolean(e.certificateFile)),
    ...(!isFresher ? [formData.experience.some((e) => Boolean(e.experienceDocFile))] : []),
    Boolean(formData.passbookFile),
  ].filter(Boolean).length;

  const totalSections = Object.keys(sectionStatus).length;
  const completedSections = Object.values(sectionStatus).filter(Boolean).length;
  const formProgress = Math.round((completedSections / totalSections) * 100);

  const formTabs = [
    { id: "personal", label: "Personal", icon: <FaUser /> },
    { id: "professional", label: "Professional & Company", icon: <FaBuilding /> },
    { id: "education", label: "Education & Certificates", icon: <FaGraduationCap /> },
    ...(!isFresher ? [{ id: "experience", label: "Experience & Payslips", icon: <FaBriefcase /> }] : []),
    { id: "address", label: "Address", icon: <FaHome /> },
    { id: "documents", label: "Bank & Statutory", icon: <FaMoneyCheckAlt /> },
    { id: "family", label: "Family & Emergency", icon: <FaUsers /> },
  ];

  // Pipeline Metric Stats
  const totalPipelineCount = onboardings.length;
  const inProgressCount = onboardings.filter((o) => ["ONBOARDING", "IN_PROGRESS", "PENDING_VALIDATION"].includes(o?.status)).length;
  const readyCount = onboardings.filter((o) => o?.status === "READY_FOR_COMPLETION").length;
  const completedCount = onboardings.filter((o) => o?.status === "COMPLETED").length;

  // Sub-tab definitions with count badges for the modal
  const detailTabs = [
    { id: "profile", label: "Candidate Profile & Records", icon: <FaUserCheck />, count: null },
    { id: "validation", label: "Validation Engine", icon: <FaShieldAlt />, count: null },
    { id: "documents", label: "Documents", icon: <FaFileAlt />, count: detailDocs.length },
    { id: "tasks", label: "Tasks", icon: <FaTasks />, count: detailTasks.length },
    { id: "assets", label: "Hardware & Assets", icon: <FaLaptop />, count: detailAssets.length },
    { id: "access", label: "System Access", icon: <FaKey />, count: detailAccess.length },
    { id: "agreements", label: "Agreements", icon: <FaFileAlt />, count: detailAgreements.length },
    { id: "training", label: "Training", icon: <FaGraduationCap />, count: detailTraining.length },
  ];

  return (
    <Container fluid className="py-3 px-3 px-md-4">
      {/* ── 1. TOP PAGE HEADER ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(45,197,138,0.2) 0%, rgba(32,166,115,0.35) 100%)",
              border: "1px solid rgba(45, 197, 138, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaUserPlus style={{ fontSize: 24, color: "#2DC58A" }} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="mb-0 fw-bold" style={{ color: "#1e293b" }}>
                HR Onboarding & Lifecycle Management
              </h4>
              <Badge bg="success" className="bg-opacity-10 text-success border border-success-subtle px-2 py-0.5 rounded-pill extra-small fw-bold">
                Enterprise
              </Badge>
            </div>
            <small className="text-muted">
              End-to-end candidate onboarding, automated 9-domain compliance engine, hardware provisioning, and account RBAC setup.
            </small>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="d-flex align-items-center gap-2 bg-white border p-1 rounded-pill shadow-xs">
          <Button
            variant={viewTab === "pipeline" ? "success" : "light"}
            size="sm"
            className={`rounded-pill px-3 py-1.5 extra-small fw-bold d-flex align-items-center gap-1.5 ${viewTab === "pipeline" ? "text-white shadow-xs" : "text-secondary border-0 bg-transparent"}`}
            style={viewTab === "pipeline" ? { backgroundColor: "#2DC58A", borderColor: "#2DC58A" } : {}}
            onClick={() => setViewTab("pipeline")}
          >
            <FaTasks /> Active Pipeline ({totalPipelineCount})
          </Button>
          <Button
            variant={viewTab === "onboard" ? "success" : "light"}
            size="sm"
            className={`rounded-pill px-3 py-1.5 extra-small fw-bold d-flex align-items-center gap-1.5 ${viewTab === "onboard" ? "text-white shadow-xs" : "text-secondary border-0 bg-transparent"}`}
            style={viewTab === "onboard" ? { backgroundColor: "#2DC58A", borderColor: "#2DC58A" } : {}}
            onClick={handleInitiateNewOnboarding}
          >
            <FaPlus /> Initiate Onboarding
          </Button>
          <Button
            variant={viewTab === "directory" ? "success" : "light"}
            size="sm"
            className={`rounded-pill px-3 py-1.5 extra-small fw-bold d-flex align-items-center gap-1.5 ${viewTab === "directory" ? "text-white shadow-xs" : "text-secondary border-0 bg-transparent"}`}
            style={viewTab === "directory" ? { backgroundColor: "#2DC58A", borderColor: "#2DC58A" } : {}}
            onClick={() => setViewTab("directory")}
          >
            <FaUsers /> Employee Directory ({employees.length})
          </Button>
        </div>
      </div>

      {/* ── 2. SUMMARY KPI STAT CARDS ── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border shadow-xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted extra-small fw-semibold text-uppercase">Total In Pipeline</span>
                <h3 className="mb-0 fw-bold mt-1 text-dark">{totalPipelineCount}</h3>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaUsers style={{ fontSize: 22, color: "#3b82f6" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border shadow-xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted extra-small fw-semibold text-uppercase">In-Progress Tasks</span>
                <h3 className="mb-0 fw-bold mt-1 text-warning">{inProgressCount}</h3>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(245, 158, 11, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaClock style={{ fontSize: 22, color: "#f59e0b" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border shadow-xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted extra-small fw-semibold text-uppercase">Validation Passed</span>
                <h3 className="mb-0 fw-bold mt-1" style={{ color: "#6366f1" }}>{readyCount}</h3>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaShieldAlt style={{ fontSize: 22, color: "#6366f1" }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border shadow-xs rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted extra-small fw-semibold text-uppercase">Completed & Active</span>
                <h3 className="mb-0 fw-bold mt-1" style={{ color: "#10b981" }}>{completedCount}</h3>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaCheckCircle style={{ fontSize: 22, color: "#10b981" }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── ALERTS & FEEDBACK ── */}
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="small py-2 mb-3 shadow-xs rounded-3 border-0 d-flex align-items-center gap-2">
          <FaExclamationTriangle className="flex-shrink-0" />
          <div>{errorMsg}</div>
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg("")} className="small py-2 mb-3 shadow-xs rounded-3 border-0 d-flex align-items-center gap-2" style={{ backgroundColor: "rgba(45, 197, 138, 0.15)", color: "#065f46" }}>
          <FaCheckCircle className="flex-shrink-0" />
          <div>{successMsg}</div>
        </Alert>
      )}

      {/* ========================================================
          VIEW 1: ACTIVE ONBOARDING PIPELINE & CANDIDATE TABLE
          ======================================================== */}
      {viewTab === "pipeline" && (
        <Card className="border shadow-xs rounded-4 overflow-hidden mb-4 bg-white">
          <Card.Header className="bg-white py-3 px-3 px-md-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark fs-6">Candidate Onboarding Pipeline</span>
              <Badge bg="light" text="dark" className="border px-2 py-0.5 rounded-pill extra-small fw-semibold">{onboardings.length} Active Records</Badge>
            </div>

            {/* Filters & Search */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <InputGroup size="sm" style={{ width: 230 }}>
                <InputGroup.Text className="bg-light border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Search candidate, code..."
                  value={pipelineSearch}
                  onChange={(e) => setPipelineSearch(e.target.value)}
                  className="border-start-0 bg-light shadow-none"
                />
              </InputGroup>

              <Form.Select
                size="sm"
                value={pipelineStatusFilter}
                onChange={(e) => setPipelineStatusFilter(e.target.value)}
                style={{ width: 180 }}
                className="bg-light shadow-none border"
              >
                <option value="ALL">All Statuses</option>
                <option value="ONBOARDING">ONBOARDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="PENDING_VALIDATION">PENDING_VALIDATION</option>
                <option value="READY_FOR_COMPLETION">READY_FOR_COMPLETION</option>
                <option value="COMPLETED">COMPLETED</option>
              </Form.Select>

              <Button
                variant="light"
                size="sm"
                className="border rounded-pill px-3 extra-small fw-semibold d-flex align-items-center gap-1.5 shadow-xs"
                onClick={loadPipelineData}
                disabled={loadingPipeline}
              >
                <FaSyncAlt className={loadingPipeline ? "fa-spin text-success" : "text-muted"} /> Refresh
              </Button>
            </div>
          </Card.Header>

          <div className="table-responsive">
            {loadingPipeline ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" size="sm" />
                <div className="extra-small text-muted mt-2">Loading candidate pipeline...</div>
              </div>
            ) : onboardings.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaTasks size={36} className="text-secondary opacity-50 mb-2" />
                <div className="fw-semibold text-dark">No candidates found in onboarding pipeline</div>
                <p className="extra-small text-muted mb-3">Initiate onboarding for a new candidate or adjust filter criteria.</p>
                <Button
                  size="sm"
                  className="rounded-pill px-3 extra-small fw-bold text-white shadow-xs"
                  style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
                  onClick={handleInitiateNewOnboarding}
                >
                  <FaUserPlus className="me-1" /> Onboard First Employee
                </Button>
              </div>
            ) : (
              <Table hover responsive align="middle" className="mb-0">
                <thead className="table-light extra-small text-uppercase text-muted border-bottom">
                  <tr>
                    <th className="ps-4">Candidate / Code</th>
                    <th>Department & Role</th>
                    <th>Joining Date</th>
                    <th>Progress & Status</th>
                    <th>Lifecycle Stage</th>
                    <th>Login Access</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {onboardings.map((item) => {
                    const emp = item?.employeeId || {};
                    const tasksList = toArray(item?.tasks);
                    const totalTasks = tasksList.length;
                    const completedTasks = tasksList.filter((t) => t.status === "COMPLETED" || t.isCompleted).length;
                    const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    const hasLogin = emp?.hasLoginAccess === true;
                    const fullName = emp.firstName ? `${emp.firstName} ${emp.lastName || ""}`.trim() : item?.name || "Candidate";
                    const initial = emp.firstName ? emp.firstName[0].toUpperCase() : "C";

                    return (
                      <tr key={item._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2.5">
                            {emp.avatar ? (
                              <Image src={emp.avatar} roundedCircle width={38} height={38} />
                            ) : (
                              <div
                                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-xs"
                                style={{
                                  width: 38,
                                  height: 38,
                                  fontSize: "0.85rem",
                                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                }}
                              >
                                {initial}
                              </div>
                            )}
                            <div>
                              <div className="fw-bold text-dark small">
                                {fullName}
                              </div>
                              <div className="extra-small text-muted d-flex align-items-center gap-1.5 mt-0.5">
                                <Badge bg="light" text="dark" className="border font-monospace py-0.5 px-1.5 extra-small">
                                  {emp.employeeCode || item.candidateCode || "EMP-NEW"}
                                </Badge>
                                <span>•</span>
                                <span className="text-truncate" style={{ maxWidth: 160 }}>{emp.email || item.email || "—"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small text-dark fw-bold">{emp.department || item.department || "General"}</div>
                          <div className="extra-small text-muted">{emp.designation || item.designation || "Employee"}</div>
                        </td>
                        <td>
                          <div className="small text-dark fw-semibold">
                            {item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : "—"}
                          </div>
                          <div className="extra-small text-muted">
                            <Badge bg="light" text="secondary" className="border py-0.5 px-1.5 extra-small">
                              {(item.employmentType || "FULL_TIME").replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <div className="mb-1.5">{getStatusBadge(item.status)}</div>
                          <div style={{ maxWidth: 140 }}>
                            <ProgressBar now={taskPct} variant="success" style={{ height: 5 }} className="rounded-pill" />
                            <span className="extra-small text-muted d-block mt-1 fw-medium" style={{ fontSize: "0.72rem" }}>
                              {completedTasks}/{totalTasks} tasks ({taskPct}%)
                            </span>
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg={emp.lifecycleStatus === "ACTIVE" ? "success" : "info"}
                            className="bg-opacity-10 text-dark border px-2.5 py-1 rounded-pill extra-small fw-semibold"
                          >
                            {emp.lifecycleStatus || "ONBOARDING"}
                          </Badge>
                        </td>
                        <td>
                          {hasLogin ? (
                            <Badge bg="success" className="bg-opacity-10 text-success border border-success-subtle px-2.5 py-1 rounded-pill extra-small fw-bold d-inline-flex align-items-center gap-1">
                              <FaCheckCircle size={10} /> Login Enabled
                            </Badge>
                          ) : (
                            <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary-subtle px-2.5 py-1 rounded-pill extra-small fw-semibold d-inline-flex align-items-center gap-1">
                              <FaLock size={10} /> Not Provisioned
                            </Badge>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <Button
                            size="sm"
                            className="rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1.5 text-white shadow-xs"
                            style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
                            onClick={() => handleOpenCandidateWorkspace(item._id)}
                          >
                            <FaCog size={11} /> Inspect & Manage
                          </Button>
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
          VIEW 2: INITIATE ONBOARDING (MULTI-STEP FORM)
          ======================================================== */}
      {viewTab === "onboard" && (
        <Row className="g-3">
          <Col xl={8}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-3 p-md-4">
                {/* Step Tabs Navigation */}
                <Nav variant="pills" className="bg-light p-1 rounded-3 gap-1 mb-3 flex-wrap">
                  {formTabs.map((tab) => (
                    <Nav.Item key={tab.id}>
                      <Nav.Link
                        active={activeFormTab === tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`d-flex align-items-center gap-1 extra-small py-2 px-3 rounded-3 cursor-pointer ${activeFormTab === tab.id
                            ? "bg-success text-white fw-bold shadow-sm"
                            : "text-muted"
                          }`}
                      >
                        {tab.icon} {tab.label}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>

                {/* Section Validation Error Banner */}
                {Object.keys(formErrors).length > 0 && (
                  <Alert variant="danger" className="py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-start gap-2 border-danger border-opacity-50">
                    <FaExclamationTriangle className="text-danger mt-1 flex-shrink-0" size={16} />
                    <div className="flex-grow-1">
                      <div className="fw-bold mb-1 text-danger">Validation Error — Please fix the following issue(s) before proceeding:</div>
                      <ul className="mb-0 ps-3">
                        {Object.entries(formErrors).map(([k, err]) => (
                          <li key={k} className="text-dark extra-small fw-medium mb-0.5">{err}</li>
                        ))}
                      </ul>
                    </div>
                  </Alert>
                )}

                {/* Tab 1: Personal Information & Profile Photo */}
                {activeFormTab === "personal" && (
                  <Form>
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">Personal Information</h6>
                        <span className="extra-small text-muted">All fields are optional. Fill in the candidate details.</span>
                      </div>
                      {/* Optional Profile Photo Upload */}
                      <div className="d-flex align-items-center gap-2">
                        {formData.profilePicPreview ? (
                          <Image src={formData.profilePicPreview} roundedCircle width={40} height={40} className="border border-success" />
                        ) : (
                          <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center text-muted" style={{ width: 40, height: 40 }}>
                            <FaUser size={16} />
                          </div>
                        )}
                        <label className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 extra-small mb-0 cursor-pointer">
                          <FaCamera className="me-1" /> {formData.profilePicFile ? "Change Photo" : "Upload Photo (Optional)"}
                          <input type="file" accept="image/*" hidden onChange={handleProfilePhotoChange} />
                        </label>
                      </div>
                    </div>

                    <Row className="g-3 mb-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">First Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Arun"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                          <Form.Label className="small fw-bold">Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Sharma"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="e.g. arun.sharma@company.com"
                            value={formData.email}
                            isInvalid={!!formErrors.email}
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value });
                              if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                            }}
                          />
                          {formErrors.email && (
                            <Form.Control.Feedback type="invalid" className="d-block extra-small">
                              {formErrors.email}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Mobile Number</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={formData.mobileNo}
                            isInvalid={!!formErrors.mobileNo}
                            onChange={(e) => {
                              setFormData({ ...formData, mobileNo: e.target.value });
                              if (formErrors.mobileNo) setFormErrors((prev) => ({ ...prev, mobileNo: "" }));
                            }}
                          />
                          {formErrors.mobileNo && (
                            <Form.Control.Feedback type="invalid" className="d-block extra-small">
                              {formErrors.mobileNo}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                          <Form.Control
                            type="date"
                            value={formData.dob}
                            isInvalid={!!formErrors.dob}
                            onChange={(e) => {
                              setFormData({ ...formData, dob: e.target.value });
                              if (formErrors.dob) setFormErrors((prev) => ({ ...prev, dob: "" }));
                            }}
                          />
                          {formErrors.dob && (
                            <Form.Control.Feedback type="invalid" className="d-block extra-small">
                              {formErrors.dob}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Gender</Form.Label>
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
                          <Form.Label className="small fw-bold">Marital Status</Form.Label>
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
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Department</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Engineering, HR, Sales"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Designation</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Frontend Developer"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Role Assignment</Form.Label>
                          <Form.Select
                            value={formData.roleId}
                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                          >
                            <option value="">Default Employee Role</option>
                            {assignableRoles.map((r) => (
                              <option key={r._id} value={r._id}>
                                {r.roleName} (Level {r.priority})
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mt-1">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Blood Group</Form.Label>
                          <Form.Select
                            value={formData.bloodGroup || "O+"}
                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          >
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Joining Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={formData.joiningDate}
                            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold">Employment Type</Form.Label>
                          <Form.Select
                            value={formData.employmentType}
                            onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                          >
                            <option value="FULL_TIME">Full Time</option>
                            <option value="PART_TIME">Part Time</option>
                            <option value="CONTRACT">Contract</option>
                            <option value="INTERN">Intern</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                )}

                {/* Tab 2: Professional & Current Company */}
                {activeFormTab === "professional" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-dark">Current & Past Company Experience</h6>
                      <Button variant="outline-success" size="sm" className="rounded-pill px-3 extra-small" onClick={addProfessionalRow}>
                        <FaPlus className="me-1" /> Add Company Record
                      </Button>
                    </div>

                    {formData.professional.map((prof, idx) => (
                      <Card key={idx} className="p-3 bg-light border-0 rounded-3 mb-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold small text-dark">
                              Company Record #{idx + 1}
                            </span>
                            {!prof.isFresher && prof.isCurrent && (
                              <Badge bg="success" className="ms-1">Current Employer</Badge>
                            )}
                            {prof.isFresher && (
                              <Badge bg="info" className="ms-1 text-white">Fresher</Badge>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <Form.Check
                              type="checkbox"
                              id={`isFresher-${idx}`}
                              label={<span className="extra-small fw-bold text-primary cursor-pointer">Fresher (No Prior Experience)</span>}
                              checked={prof.isFresher === true || formData.isFresher === true}
                              onChange={(e) => {
                                const isVal = e.target.checked;
                                const arr = [...formData.professional];
                                arr[idx].isFresher = isVal;
                                setFormData({ ...formData, isFresher: isVal, professional: arr });
                                if (isVal && activeFormTab === "experience") {
                                  setActiveFormTab("education");
                                }
                              }}
                              className="extra-small mb-0"
                            />
                            {formData.professional.length > 1 && (
                              <Button variant="outline-danger" size="sm" className="py-0 px-2 extra-small" onClick={() => removeProfessionalRow(idx)}>
                                <FaTrash /> Remove
                              </Button>
                            )}
                          </div>
                        </div>

                        {prof.isFresher ? (
                          /* Fresher Mode: Only ask Joining Date & Reporting Manager (Reported To) */
                          <div className="p-3 bg-white rounded-3 border border-info border-opacity-25">
                            <div className="d-flex align-items-center mb-3 text-muted extra-small">
                              <span className="badge bg-info-subtle text-info border border-info me-2">Fresher Mode</span>
                              <span>No previous experience details required. Please specify the joining date and reporting manager.</span>
                            </div>
                            <Row className="g-3">
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Joining Date</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="date"
                                    value={prof.joiningDate ? new Date(prof.joiningDate).toISOString().split("T")[0] : ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].joiningDate = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Reporting Manager</Form.Label>
                                  <Form.Select
                                    size="sm"
                                    value={prof.reportedTo || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].reportedTo = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  >
                                    <option value="">Select Reporting Manager (Optional)</option>
                                    {employees.map((emp) => (
                                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                        {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.designation || "Employee"})
                                      </option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>
                          </div>
                        ) : (
                          /* Experienced Mode: Show full company & employment inputs */
                          <div>
                            <Row className="g-2 mb-2">
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Company Name</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    placeholder="Company Name (e.g. FlareMinds Tech)"
                                    value={prof.companyName || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].companyName = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Company Website / LinkedIn</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    placeholder="https://..."
                                    value={prof.companyWebsite || prof.website || prof.linkedin || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].companyWebsite = e.target.value;
                                      arr[idx].website = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Location / Branch</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    placeholder="e.g. Chennai, Bangalore"
                                    value={prof.location || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].location = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <Row className="g-2 mb-2">
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Department</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    placeholder="e.g. Engineering, Product"
                                    value={prof.department || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].department = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Designation</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    placeholder="e.g. Senior Developer"
                                    value={prof.designation || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].designation = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Role / Position</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    placeholder="e.g. Full Stack Lead"
                                    value={prof.role || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].role = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <Row className="g-2 mb-2">
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Salary / CTC</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    placeholder="e.g. 6.5 LPA or 50,000/mo"
                                    value={prof.salary || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].salary = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Joining Date</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="date"
                                    value={prof.joiningDate ? new Date(prof.joiningDate).toISOString().split("T")[0] : ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].joiningDate = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Reporting Manager</Form.Label>
                                  <Form.Select
                                    size="sm"
                                    value={prof.reportedTo || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].reportedTo = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  >
                                    <option value="">Select Reporting Manager (Optional)</option>
                                    {employees.map((emp) => (
                                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                        {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.designation || "Employee"})
                                      </option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>

                            <Row className="g-2 mb-2">
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Notice Period</Form.Label>
                                  <Form.Select
                                    size="sm"
                                    value={prof.noticePeriod || ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].noticePeriod = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  >
                                    <option value="">Select Notice Period</option>
                                    <option value="Immediate">Immediate / Serving Notice</option>
                                    <option value="15 Days">15 Days</option>
                                    <option value="30 Days">30 Days</option>
                                    <option value="60 Days">60 Days</option>
                                    <option value="90 Days">90 Days</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Expected Last Working Date</Form.Label>
                                  <Form.Control
                                    size="sm"
                                    type="date"
                                    value={prof.expectedLastWorkingDate ? new Date(prof.expectedLastWorkingDate).toISOString().split("T")[0] : ""}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].expectedLastWorkingDate = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="extra-small fw-bold">Employment Status</Form.Label>
                                  <Form.Select
                                    size="sm"
                                    value={prof.employmentStatus || "CURRENTLY_EMPLOYED"}
                                    onChange={(e) => {
                                      const arr = [...formData.professional];
                                      arr[idx].employmentStatus = e.target.value;
                                      setFormData({ ...formData, professional: arr });
                                    }}
                                  >
                                    <option value="CURRENTLY_EMPLOYED">Currently Employed</option>
                                    <option value="RESIGNED">Resigned</option>
                                    <option value="RELIEVED">Relieved</option>
                                    <option value="NOT_APPLICABLE">Not Applicable</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>

                            <Row className="g-2 mb-2">
                              <Col md={12} className="d-flex align-items-center">
                                <Form.Check
                                  type="checkbox"
                                  id={`isCurrent-${idx}`}
                                  label="Is Current Employer"
                                  checked={prof.isCurrent !== false}
                                  onChange={(e) => {
                                    const arr = [...formData.professional];
                                    arr[idx].isCurrent = e.target.checked;
                                    setFormData({ ...formData, professional: arr });
                                  }}
                                  className="extra-small fw-semibold text-dark"
                                />
                              </Col>
                            </Row>

                            {/* Optional Professional Document Upload */}
                            <div className="pt-2 border-top mt-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <span className="extra-small text-muted fw-semibold">Document:</span>
                                <Form.Select
                                  size="sm"
                                  style={{ width: 220, fontSize: "0.75rem" }}
                                  value={prof.docType || "OFFER_LETTER"}
                                  onChange={(e) => {
                                    const arr = [...formData.professional];
                                    arr[idx].docType = e.target.value;
                                    setFormData({ ...formData, professional: arr });
                                  }}
                                >
                                  <option value="OFFER_LETTER">Offer Letter</option>
                                  <option value="APPOINTMENT_LETTER">Appointment Letter</option>
                                  <option value="CURRENT_EMPLOYMENT_LETTER">Current Employment Letter</option>
                                  <option value="EXPERIENCE_LETTER">Experience Letter</option>
                                  <option value="PAYSLIP">Salary Slip / Payslip</option>
                                  <option value="RELIEVING_LETTER">Relieving Letter</option>
                                  <option value="RESIGNATION_ACKNOWLEDGEMENT">Resignation Ack</option>
                                  <option value="OTHER">Other Document</option>
                                </Form.Select>
                              </div>
                              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                <label className="btn btn-outline-success btn-sm py-0 px-2 extra-small rounded-pill mb-0 cursor-pointer">
                                  <FaFileUpload className="me-1" /> {prof.docName ? `Uploaded: ${prof.docName}` : "Choose Document File (Optional)"}
                                  <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    hidden
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const arr = [...formData.professional];
                                        arr[idx].docFile = file;
                                        arr[idx].docName = file.name;
                                        setFormData({ ...formData, professional: arr });
                                      }
                                    }}
                                  />
                                </label>
                                {prof.docFile && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="py-0 px-2 extra-small rounded-pill"
                                    onClick={() => handleOpenDocPreview(prof.docFile, prof.docName || "Professional Document")}
                                  >
                                    <FaEye className="me-1" /> View File
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}

                {/* Tab 3: Education & Certificate Uploads */}
                {activeFormTab === "education" && (
                  <div>
                    {/* Education Summary Banner */}
                    <EducationSummary
                      highestQualification={formData.highestQualification || (formData.phdInstituteName ? "PhD" : formData.pgInstituteName ? "PG" : formData.ugInstituteName ? "UG" : formData.diplomainstitution ? "Diploma" : formData.itiinstituteName ? "ITI" : formData.hscSchoolName ? "HSC" : "UG")}
                      isVerified={formData.isVerified === true}
                      remarks={formData.remarks || ""}
                      stats={{
                        totalQualifications: [
                          Boolean(formData.sslcSchoolName?.trim() || formData.sslcBoard?.trim()),
                          Boolean(formData.hscSchoolName?.trim() || formData.hscBoard?.trim()),
                          Boolean(formData.itiinstituteName?.trim() || formData.iticourse?.trim()),
                          Boolean(formData.diplomainstitution?.trim() || formData.diplomacourse?.trim()),
                          Boolean(formData.ugInstituteName?.trim() || formData.ugDegree?.trim()),
                          Boolean(formData.pgInstituteName?.trim() || formData.pgDegree?.trim()),
                          Boolean(formData.phdInstituteName?.trim() || formData.phdResearchArea?.trim()),
                        ].filter(Boolean).length,
                        attachedDocsCount: [
                          Boolean(formData.sslcDocumentFile || formData.sslcDocumentUrl || formData.sslcDocumentName),
                          Boolean(formData.hscDocumentFile || formData.hscDocumentUrl || formData.hscDocumentName),
                          Boolean(formData.itiDocumentFile || formData.itiDocumentUrl || formData.itiDocumentName),
                          Boolean(formData.diplomaDocumentFile || formData.diplomaDocumentUrl || formData.diplomaDocumentName),
                          Boolean(formData.ugDocumentFile || formData.ugDocumentUrl || formData.ugDocumentName),
                          Boolean(formData.pgDocumentFile || formData.pgDocumentUrl || formData.pgDocumentName),
                          Boolean(formData.phdDocumentFile || formData.phdDocumentUrl || formData.phdDocumentName),
                        ].filter(Boolean).length,
                      }}
                    />

                    {/* Academic Qualifications Section */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">Academic Qualifications</h6>
                          <span className="extra-small text-muted">
                            Fill in formal schooling, technical certifications, bachelor's, master's, and doctoral details.
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-1.5">
                          {!expandedEduSections.iti && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-2.5 py-0.5 extra-small"
                              onClick={() => toggleEduSection("iti")}
                            >
                              <FaPlus className="me-1" /> Add ITI
                            </Button>
                          )}
                          {!expandedEduSections.diploma && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-2.5 py-0.5 extra-small"
                              onClick={() => toggleEduSection("diploma")}
                            >
                              <FaPlus className="me-1" /> Add Diploma
                            </Button>
                          )}
                          {!expandedEduSections.pg && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="rounded-pill px-2.5 py-0.5 extra-small"
                              onClick={() => toggleEduSection("pg")}
                            >
                              <FaPlus className="me-1" /> Add PG
                            </Button>
                          )}
                          {!expandedEduSections.phd && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="rounded-pill px-2.5 py-0.5 extra-small"
                              onClick={() => toggleEduSection("phd")}
                            >
                              <FaPlus className="me-1" /> Add PhD
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* SSLC Section (Mandatory) */}
                      <SSLCSection
                        data={formData}
                        onChange={handleEduFieldChange}
                        errors={{}}
                        file={formData.sslcDocumentFile}
                        onFileChange={(f) => handleEduFileChange("sslcDocument", f)}
                        onFileRemove={() => handleEduFileRemove("sslcDocument")}
                      />

                      {/* HSC Section (Mandatory) */}
                      <HSCSection
                        data={formData}
                        onChange={handleEduFieldChange}
                        errors={{}}
                        file={formData.hscDocumentFile}
                        onFileChange={(f) => handleEduFileChange("hscDocument", f)}
                        onFileRemove={() => handleEduFileRemove("hscDocument")}
                      />

                      {/* ITI Section (Optional Expandable) */}
                      <ITISection
                        data={formData}
                        onChange={handleEduFieldChange}
                        errors={{}}
                        file={formData.itiDocumentFile}
                        onFileChange={(f) => handleEduFileChange("itiDocument", f)}
                        onFileRemove={() => handleEduFileRemove("itiDocument")}
                        isOpen={expandedEduSections.iti}
                        onToggle={() => toggleEduSection("iti")}
                        onClear={() => clearEduSection("iti")}
                      />

                      {/* Diploma Section (Optional Expandable) */}
                      <DiplomaSection
                        data={formData}
                        onChange={handleEduFieldChange}
                        errors={{}}
                        file={formData.diplomaDocumentFile}
                        onFileChange={(f) => handleEduFileChange("diplomaDocument", f)}
                        onFileRemove={() => handleEduFileRemove("diplomaDocument")}
                        isOpen={expandedEduSections.diploma}
                        onToggle={() => toggleEduSection("diploma")}
                        onClear={() => clearEduSection("diploma")}
                      />

                      {/* Undergraduate (UG) Section (Mandatory) */}
                      <UGSection
                        data={formData}
                        onChange={handleEduFieldChange}
                        errors={{}}
                        file={formData.ugDocumentFile}
                        onFileChange={(f) => handleEduFileChange("ugDocument", f)}
                        onFileRemove={() => handleEduFileRemove("ugDocument")}
                      />

                      {/* Postgraduate (PG) Section (Optional Expandable) */}
                      <PGSection
                        data={formData}
                        onChange={handleEduFieldChange}
                        errors={{}}
                        file={formData.pgDocumentFile}
                        onFileChange={(f) => handleEduFileChange("pgDocument", f)}
                        onFileRemove={() => handleEduFileRemove("pgDocument")}
                        isOpen={expandedEduSections.pg}
                        onToggle={() => toggleEduSection("pg")}
                        onClear={() => clearEduSection("pg")}
                      />

                      {/* PhD Section (Optional Expandable) */}
                      <PhDSection
                        data={formData}
                        onChange={handleEduFieldChange}
                        errors={{}}
                        file={formData.phdDocumentFile}
                        onFileChange={(f) => handleEduFileChange("phdDocument", f)}
                        onFileRemove={() => handleEduFileRemove("phdDocument")}
                        isOpen={expandedEduSections.phd}
                        onToggle={() => toggleEduSection("phd")}
                        onClear={() => clearEduSection("phd")}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 4: Experience & Document Uploads */}
                {activeFormTab === "experience" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">Previous Work Experience & Letters</h6>
                        <span className="extra-small text-muted">Provide past employment history, compensation, tenure, and verified service credentials.</span>
                      </div>
                      <Button variant="outline-success" size="sm" className="rounded-pill px-3 extra-small" onClick={addExperienceRow}>
                        <FaPlus className="me-1" /> Add Past Experience
                      </Button>
                    </div>

                    {formData.experience.map((exp, idx) => (
                      <Card key={idx} className="p-3.5 bg-light border-0 rounded-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle extra-small rounded-pill">
                              Record #{idx + 1}
                            </span>
                            <span className="fw-bold small text-dark">
                              {exp.companyName || exp.prevCompany ? `${exp.companyName || exp.prevCompany} ${exp.designation ? `— ${exp.designation}` : ""}` : `Experience Record #${idx + 1}`}
                            </span>
                          </div>
                          {formData.experience.length > 1 && (
                            <Button variant="outline-danger" size="sm" className="py-0 px-2 extra-small rounded-pill" onClick={() => removeExperienceRow(idx)}>
                              <FaTrash className="me-1" /> Remove
                            </Button>
                          )}
                        </div>

                        {/* Row 1: Company & Designation */}
                        <Row className="g-2 mb-2">
                          <Col md={6} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">Company / Employer Name</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="e.g. Infosys, TCS, Wipro, Tech Solutions Ltd"
                                value={exp.companyName || exp.prevCompany || ""}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].companyName = e.target.value;
                                  arr[idx].prevCompany = e.target.value;
                                  setFormData({ ...formData, experience: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">Designation / Role Title</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="e.g. Senior Software Engineer, UI Developer"
                                value={exp.designation || ""}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].designation = e.target.value;
                                  setFormData({ ...formData, experience: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Row 2: Duration, Salary & Status */}
                        <Row className="g-2 mb-2">
                          <Col md={4} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">Experience Duration</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="e.g. 2.5 Years, 1 Year 8 Months"
                                value={exp.experience || exp.experienceYears || ""}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].experience = e.target.value;
                                  arr[idx].experienceYears = e.target.value;
                                  setFormData({ ...formData, experience: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">Salary / Last Drawn CTC</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="e.g. ₹6,50,000 / annum"
                                value={exp.salary || ""}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].salary = e.target.value;
                                  setFormData({ ...formData, experience: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">Employment Status</Form.Label>
                              <Form.Select
                                size="sm"
                                value={exp.employmentStatus || (exp.isCurrentJob ? "CURRENTLY_EMPLOYED" : "RELIEVED")}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].employmentStatus = e.target.value;
                                  if (e.target.value === "CURRENTLY_EMPLOYED") {
                                    arr[idx].isCurrentJob = true;
                                  }
                                  setFormData({ ...formData, experience: arr });
                                }}
                              >
                                <option value="RELIEVED">Relieved / Ex-Employee</option>
                                <option value="CURRENTLY_EMPLOYED">Currently Employed</option>
                                <option value="RESIGNED">Resigned / Serving Notice</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Row 3: Dates & Current Job Toggle */}
                        <Row className="g-2 mb-2">
                          <Col md={4} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">Start Date / Date of Joining</Form.Label>
                              <Form.Control
                                size="sm"
                                type="date"
                                value={exp.startDate ? String(exp.startDate).split("T")[0] : ""}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].startDate = e.target.value;
                                  setFormData({ ...formData, experience: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">
                                End Date / Last Working Date {exp.isCurrentJob && "(Present)"}
                              </Form.Label>
                              <Form.Control
                                size="sm"
                                type="date"
                                disabled={Boolean(exp.isCurrentJob)}
                                value={!exp.isCurrentJob && exp.endDate ? String(exp.endDate).split("T")[0] : ""}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].endDate = e.target.value;
                                  setFormData({ ...formData, experience: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4} xs={12} className="d-flex align-items-end pb-1">
                            <Form.Check
                              type="checkbox"
                              id={`isCurrentJob-${idx}`}
                              label="Is Current Employer"
                              checked={Boolean(exp.isCurrentJob)}
                              onChange={(e) => {
                                const arr = [...formData.experience];
                                arr[idx].isCurrentJob = e.target.checked;
                                if (e.target.checked) {
                                  arr[idx].employmentStatus = "CURRENTLY_EMPLOYED";
                                  arr[idx].endDate = "";
                                } else {
                                  arr[idx].employmentStatus = "RELIEVED";
                                }
                                setFormData({ ...formData, experience: arr });
                              }}
                              className="extra-small fw-semibold text-dark mb-1"
                            />
                          </Col>
                        </Row>

                        {/* Row 4: Notice Period & Expected LWD (if current job or serving notice) */}
                        {(exp.isCurrentJob || exp.employmentStatus === "RESIGNED") && (
                          <Row className="g-2 mb-2 p-2 bg-white rounded-2 border border-light-subtle">
                            <Col md={6} xs={12}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold">Notice Period</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="e.g. 30 Days / 60 Days / 90 Days"
                                  value={exp.noticePeriod || ""}
                                  onChange={(e) => {
                                    const arr = [...formData.experience];
                                    arr[idx].noticePeriod = e.target.value;
                                    setFormData({ ...formData, experience: arr });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} xs={12}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold">Expected Last Working Date</Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="date"
                                  value={exp.expectedLastWorkingDate ? String(exp.expectedLastWorkingDate).split("T")[0] : ""}
                                  onChange={(e) => {
                                    const arr = [...formData.experience];
                                    arr[idx].expectedLastWorkingDate = e.target.value;
                                    setFormData({ ...formData, experience: arr });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        )}

                        {/* Row 5: Roles & Responsibilities */}
                        <Row className="g-2 mb-2">
                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold">Roles, Responsibilities & Projects</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                size="sm"
                                placeholder="Brief overview of key accomplishments, tech stack, and responsibilities handled"
                                value={exp.description || exp.roleDescription || ""}
                                onChange={(e) => {
                                  const arr = [...formData.experience];
                                  arr[idx].description = e.target.value;
                                  arr[idx].roleDescription = e.target.value;
                                  setFormData({ ...formData, experience: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        {/* Row 6: Optional Experience Document / Payslip / Relieving Letter Upload */}
                        <div className="pt-2.5 border-top mt-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="extra-small text-muted fw-semibold">Attached Document:</span>
                            <Form.Select
                              size="sm"
                              style={{ width: 220, fontSize: "0.75rem" }}
                              value={exp.docType || "EXPERIENCE_LETTER"}
                              onChange={(e) => {
                                const arr = [...formData.experience];
                                arr[idx].docType = e.target.value;
                                setFormData({ ...formData, experience: arr });
                              }}
                            >
                              <option value="EXPERIENCE_LETTER">Experience Letter</option>
                              <option value="PAYSLIP">Salary Slip / Payslip</option>
                              <option value="RELIEVING_LETTER">Relieving Letter</option>
                              <option value="APPOINTMENT_LETTER">Appointment Letter</option>
                              <option value="OTHER">Other Credential</option>
                            </Form.Select>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {(exp.experienceLetterUrl || exp.payslipUrl || exp.relievingLetterUrl || exp.documentUrl) && (
                              <a
                                href={exp.experienceLetterUrl || exp.payslipUrl || exp.relievingLetterUrl || exp.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary btn-sm py-0 px-2.5 extra-small rounded-pill"
                              >
                                View Current
                              </a>
                            )}
                            <label className="btn btn-outline-success btn-sm py-0 px-2.5 extra-small rounded-pill mb-0 cursor-pointer shadow-xs">
                              <FaFileUpload className="me-1" /> {exp.experienceDocName ? `Uploaded: ${exp.experienceDocName}` : "Choose Document File"}
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const arr = [...formData.experience];
                                    arr[idx].experienceDocFile = file;
                                    arr[idx].experienceDocName = file.name;
                                    setFormData({ ...formData, experience: arr });
                                  }
                                }
                                }
                              />
                            </label>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Tab 5: Address */}
                {activeFormTab === "address" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-dark">Residential & Correspondence Addresses</h6>
                      <Button variant="outline-success" size="sm" className="rounded-pill px-3 extra-small" onClick={addAddressRow}>
                        <FaPlus className="me-1" /> Add Another Address
                      </Button>
                    </div>

                    {formData.addresses.map((addr, idx) => (
                      <Card key={idx} className="p-3.5 bg-light border-0 rounded-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                          <span className="fw-bold small text-dark">Address #{idx + 1}</span>
                          {formData.addresses.length > 1 && (
                            <Button variant="outline-danger" size="sm" className="py-0 px-2 extra-small rounded-pill" onClick={() => removeAddressRow(idx)}>
                              <FaTrash className="me-1" /> Remove
                            </Button>
                          )}
                        </div>
                        <Row className="g-2 mb-2">
                          <Col md={4} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold text-dark text-uppercase">Address Type</Form.Label>
                              <Form.Select
                                size="sm"
                                value={addr.addressType || "Permanent"}
                                onChange={(e) => {
                                  const arr = [...formData.addresses];
                                  arr[idx].addressType = e.target.value;
                                  setFormData({ ...formData, addresses: arr });
                                }}
                              >
                                <option value="Permanent">Permanent</option>
                                <option value="Current">Current / Present</option>
                                <option value="Official">Official</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={8} xs={12}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold text-dark text-uppercase">Address Line 1</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="House / Flat No, Street, Apartment"
                                value={addr.addressLine1 || addr.address1 || ""}
                                onChange={(e) => {
                                  const arr = [...formData.addresses];
                                  arr[idx].addressLine1 = e.target.value;
                                  arr[idx].address1 = e.target.value;
                                  setFormData({ ...formData, addresses: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row className="g-2">
                          <Col md={3} xs={6}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold text-dark text-uppercase">City</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="City"
                                value={addr.city || ""}
                                onChange={(e) => {
                                  const arr = [...formData.addresses];
                                  arr[idx].city = e.target.value;
                                  setFormData({ ...formData, addresses: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3} xs={6}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold text-dark text-uppercase">State</Form.Label>
                              <StateSearchDropdown
                                value={addr.state || ""}
                                placeholder="Select State"
                                onChange={(val) => {
                                  const arr = [...formData.addresses];
                                  arr[idx].state = val;
                                  setFormData({ ...formData, addresses: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3} xs={6}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold text-dark text-uppercase">Country</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="India"
                                value={addr.country || "India"}
                                onChange={(e) => {
                                  const arr = [...formData.addresses];
                                  arr[idx].country = e.target.value;
                                  setFormData({ ...formData, addresses: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3} xs={6}>
                            <Form.Group>
                              <Form.Label className="extra-small fw-bold text-dark text-uppercase">PIN Code</Form.Label>
                              <Form.Control
                                size="sm"
                                placeholder="Pincode"
                                maxLength={6}
                                value={addr.pincode || ""}
                                onChange={(e) => {
                                  const arr = [...formData.addresses];
                                  arr[idx].pincode = e.target.value;
                                  setFormData({ ...formData, addresses: arr });
                                }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Tab 6: Documents, Bank & Statutory UI */}
                {activeFormTab === "documents" && (
                  <div>
                    {/* Document Overview Summary Banner */}
                    <DocumentSummary docData={formData} />

                    {/* 1. Identity & Government Documents */}
                    <IdentityDetailsCard
                      data={formData}
                      isEditMode={true}
                      onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
                    />

                    {/* 2. Bank Account Details & Passbook Proof */}
                    <BankDetailsCard
                      data={formData}
                      isEditMode={true}
                      onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
                      onPassbookChange={(file) => {
                        setFormData((prev) => ({
                          ...prev,
                          passbookFile: file,
                          passbookFileName: file.name,
                        }));
                      }}
                      onPassbookPreview={handleOpenDocPreview}
                    />

                    {/* 3. Statutory Compliance (EPF / ESI / UAN) */}
                    <StatutoryDetailsCard
                      data={formData}
                      isEditMode={true}
                      onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
                    />
                  </div>
                )}

                {/* Tab 7: Family & Emergency */}
                {activeFormTab === "family" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">Family Members & Emergency Contacts</h6>
                        <span className="extra-small text-muted">Register primary emergency contacts and family dependants.</span>
                      </div>
                      <Button variant="outline-success" size="sm" className="rounded-pill px-3 extra-small shadow-xs d-flex align-items-center gap-1" onClick={addFamilyContactRow}>
                        <FaPlus /> Add Contact
                      </Button>
                    </div>

                    {formData.familyContacts.map((contact, idx) => (
                      <Card key={idx} className="border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
                        <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: 34,
                                height: 34,
                                background: idx === 0 ? "rgba(45, 197, 138, 0.15)" : "rgba(59, 130, 246, 0.12)",
                                color: idx === 0 ? "#2DC58A" : "#2563EB",
                                fontSize: 14,
                              }}
                            >
                              <FaUsers />
                            </div>
                            <div>
                              <h6 className="fw-bold text-dark mb-0">
                                {idx === 0 ? "Primary Emergency Contact" : `Family Member #${idx + 1}`}
                              </h6>
                              <span className="extra-small text-muted">
                                {contact.name ? `${contact.name} (${contact.relationship || "Father"})` : "Contact Details"}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {idx === 0 && (
                              <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill extra-small px-2.5 py-1">
                                Primary
                              </Badge>
                            )}
                            {formData.familyContacts.length > 1 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="py-1 px-2.5 extra-small rounded-pill d-flex align-items-center gap-1"
                                onClick={() => removeFamilyContactRow(idx)}
                              >
                                <FaTrash size={11} /> Remove
                              </Button>
                            )}
                          </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <Row className="g-3 mb-3">
                            <Col md={4} xs={12}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold text-dark text-uppercase">Full Name</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="Contact Person Name"
                                  value={contact.name || ""}
                                  onChange={(e) => {
                                    const arr = [...formData.familyContacts];
                                    arr[idx].name = e.target.value;
                                    setFormData({ ...formData, familyContacts: arr });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4} xs={12}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold text-dark text-uppercase">Relationship</Form.Label>
                                <Form.Select
                                  size="sm"
                                  value={contact.relationship || "Father"}
                                  onChange={(e) => {
                                    const arr = [...formData.familyContacts];
                                    arr[idx].relationship = e.target.value;
                                    setFormData({ ...formData, familyContacts: arr });
                                  }}
                                >
                                  <option value="Father">Father</option>
                                  <option value="Mother">Mother</option>
                                  <option value="Spouse">Spouse</option>
                                  <option value="Brother">Brother</option>
                                  <option value="Sister">Sister</option>
                                  <option value="Son">Son</option>
                                  <option value="Daughter">Daughter</option>
                                  <option value="Guardian">Guardian</option>
                                  <option value="Friend">Friend / Colleague</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4} xs={12}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold text-dark text-uppercase">Mobile Phone</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="10-digit Phone Number"
                                  maxLength={15}
                                  value={contact.phone || ""}
                                  onChange={(e) => {
                                    const arr = [...formData.familyContacts];
                                    arr[idx].phone = e.target.value.replace(/[^\d+]/g, "").slice(0, 15);
                                    setFormData({ ...formData, familyContacts: arr });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row className="g-3">
                            <Col md={6} xs={12}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold text-dark text-uppercase">Email Address (Optional)</Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="email"
                                  placeholder="e.g. contact@example.com"
                                  value={contact.email || ""}
                                  onChange={(e) => {
                                    const arr = [...formData.familyContacts];
                                    arr[idx].email = e.target.value.trim();
                                    setFormData({ ...formData, familyContacts: arr });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} xs={12}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold text-dark text-uppercase">Occupation (Optional)</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="e.g. Business, Engineer, Homemaker, Retired"
                                  value={contact.occupation || ""}
                                  onChange={(e) => {
                                    const arr = [...formData.familyContacts];
                                    arr[idx].occupation = e.target.value;
                                    setFormData({ ...formData, familyContacts: arr });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-4 pt-3 border-top d-flex justify-content-between">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="rounded-pill px-3 d-flex align-items-center gap-1"
                    onClick={handlePrevStep}
                    disabled={activeFormTab === formTabs[0].id}
                  >
                    <FaChevronLeft size={10} /> Previous
                  </Button>

                  {activeFormTab !== formTabs[formTabs.length - 1].id ? (
                    <Button
                      variant="success"
                      size="sm"
                      className="rounded-pill px-4 d-flex align-items-center gap-1 shadow-sm"
                      onClick={handleNextStep}
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
                      {submittingForm ? <Spinner size="sm" animation="border" /> : <FaUserCheck />} Initiate Candidate Onboarding
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Progress Card */}
          <Col xl={4}>
            <Card className="border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
              <div className="text-center mb-3">
                <h6 className="fw-bold text-dark small mb-2">Onboarding Profile Completion</h6>
                <h2 className="fw-bold text-success mb-0">{formProgress}%</h2>
                <span className="extra-small text-muted">{completedSections} of {totalSections} sections filled</span>
                <ProgressBar now={formProgress} variant="success" className="rounded-pill mt-2 mb-2" style={{ height: 6 }} />
              </div>

              {/* Section Checklist */}
              <div className="bg-light p-2 rounded-3 mb-3">
                <span className="extra-small text-uppercase fw-bold text-muted d-block mb-2 ps-1">Sections Checklist</span>
                <div className="d-flex flex-column gap-1">
                  {[
                    { id: "personal", label: "Personal Information", complete: sectionStatus.personal },
                    { id: "professional", label: "Company & Professional", complete: sectionStatus.professional },
                    { id: "education", label: "Education Qualifications", complete: sectionStatus.education },
                    { id: "experience", label: "Past Work Experience", complete: sectionStatus.experience },
                    { id: "address", label: "Residential Addresses", complete: sectionStatus.address },
                    { id: "documents", label: "Bank & Statutory Details", complete: sectionStatus.documents },
                    { id: "family", label: "Family & Emergency Contact", complete: sectionStatus.family },
                  ].map((sec) => (
                    <div
                      key={sec.id}
                      onClick={() => handleTabClick(sec.id)}
                      className={`d-flex align-items-center justify-content-between p-2 rounded-2 cursor-pointer extra-small ${activeFormTab === sec.id ? "bg-white shadow-sm fw-bold border" : "text-muted"
                        }`}
                    >
                      <span className="d-flex align-items-center gap-1">
                        {sec.complete ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-secondary opacity-50" />}
                        {sec.label}
                      </span>
                      <Badge bg={sec.complete ? "success" : "light"} text={sec.complete ? "white" : "dark"} className="extra-small">
                        {sec.complete ? "Filled" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Attachments Summary */}
              <div className="p-2 border rounded-3 bg-white mb-2 d-flex justify-content-between align-items-center">
                <span className="extra-small text-muted fw-semibold d-flex align-items-center gap-1">
                  <FaFileUpload className="text-success" /> Attached Files:
                </span>
                <Badge bg={attachedDocsCount > 0 ? "success" : "secondary"} className="rounded-pill">
                  {attachedDocsCount} Document{attachedDocsCount !== 1 ? "s" : ""} Attached
                </Badge>
              </div>

              <p className="extra-small text-muted mb-0 text-center">
                Initiating onboarding automatically sets status to <strong>ONBOARDING</strong> and generates candidate credentials.
              </p>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 p-3 bg-light">
              <h6 className="fw-bold text-dark small mb-2">Backend Enforced Lifecycle</h6>
              <p className="extra-small text-muted mb-2">
                1. <strong>Initiate Onboarding</strong> (Candidate created in <code>ONBOARDING</code> status)<br />
                2. <strong>Fulfill Requirements</strong> (Docs, Tasks, Assets, System Access, Trainings)<br />
                3. <strong>Run Backend Validation</strong> (9 Compliance domain checks)<br />
                4. <strong>Complete Onboarding</strong> $\rightarrow$ <strong>Activate Employee</strong> $\rightarrow$ <strong>Provision Login</strong>
              </p>
              <Button
                variant="outline-success"
                size="sm"
                className="rounded-pill fw-semibold"
                onClick={() => setViewTab("pipeline")}
              >
                <FaTasks className="me-1" /> View Active Pipeline
              </Button>
            </Card>
          </Col>
        </Row>
      )}

      {/* ========================================================
          VIEW 3: ONBOARDED DIRECTORY & LOGIN MANAGEMENT
          ======================================================== */}
      {viewTab === "directory" && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-bold text-dark">Employee Directory & Account Credentials</span>
              <span className="text-muted extra-small ms-2">({employees.length} total)</span>
            </div>
            <Button
              variant="outline-success"
              size="sm"
              className="rounded-pill px-3"
              onClick={loadMasterData}
            >
              <FaSyncAlt /> Refresh
            </Button>
          </Card.Header>

          <div className="table-responsive">
            {loadingDirectory ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <div className="small text-muted mt-2">Loading employee directory...</div>
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
                    const hasAccount = emp?.hasLoginAccess === true;
                    const isOwner = emp?.role?.priority === 1 || emp?.role?.roleCode === "OWNER";
                    const canManage = currentUser?.priority === 1 || (!isOwner && (isSystemAdmin || hasPermission("user.manage_roles")));

                    return (
                      <tr key={emp._id || emp.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            {emp.avatar ? (
                              <Image src={emp.avatar} roundedCircle width={34} height={34} />
                            ) : (
                              <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 34, height: 34, fontSize: "0.8rem" }}>
                                {emp.firstName ? emp.firstName[0] : "U"}
                              </div>
                            )}
                            <div>
                              <div className="fw-semibold text-dark">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="extra-small text-muted">{emp.email}</div>
                            </div>
                          </div>
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
                              No Login Access
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
                                onClick={() => handleOpenProvision(emp)}
                              >
                                <FaUserPlus /> Provision Account
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
                                <FaCog /> Manage
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
          MODAL: CANDIDATE DEEP-DIVE INSPECTION WORKSPACE
          ======================================================== */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
        centered
        scrollable
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-white border-bottom py-3 px-3 px-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center w-100 gap-3 pe-3">
            <div className="d-flex align-items-center gap-3">
              {candidateProfileData?.avatar ? (
                <Image src={candidateProfileData.avatar} roundedCircle width={48} height={48} className="border border-success shadow-xs" />
              ) : (
                <div
                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold fs-5 shadow-xs flex-shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  }}
                >
                  {candidateName[0]}
                </div>
              )}
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="fw-bold mb-0 text-dark">{candidateName}</h5>
                  {getStatusBadge(selectedOnboarding?.status)}
                </div>
                <div className="extra-small text-muted mt-1 d-flex align-items-center gap-1.5 flex-wrap">
                  <Badge bg="light" text="dark" className="border font-monospace py-0.5 px-1.5 extra-small">
                    {candidateCode}
                  </Badge>
                  <span>•</span>
                  <span>{candidateEmail}</span>
                  <span>•</span>
                  <span className="fw-bold text-dark">{candidateDept}</span>
                  <span>({candidateDesig})</span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Badge
                bg={targetEmp.lifecycleStatus === "ACTIVE" ? "success" : "info"}
                className="bg-opacity-10 text-dark border px-2.5 py-1 rounded-pill extra-small fw-semibold"
              >
                Lifecycle: {targetEmp.lifecycleStatus || "ONBOARDING"}
              </Badge>
              {targetEmp.hasLoginAccess ? (
                <Badge bg="success" className="bg-opacity-10 text-success border border-success-subtle px-2.5 py-1 rounded-pill extra-small fw-bold d-inline-flex align-items-center gap-1">
                  <FaCheckCircle size={10} /> Login Active
                </Badge>
              ) : (
                <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary-subtle px-2.5 py-1 rounded-pill extra-small fw-semibold d-inline-flex align-items-center gap-1">
                  <FaLock size={10} /> Login Locked
                </Badge>
              )}
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="p-3 p-md-4 bg-light">
          {loadingDetails ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" size="sm" />
              <div className="extra-small text-muted mt-2">Loading candidate workspace...</div>
            </div>
          ) : (
            <div>
              {/* ── ENFORCED LIFECYCLE ACTION BANNER ── */}
              <Card className="border shadow-xs rounded-4 p-3 mb-3 bg-white">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(16, 185, 129, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FaShieldAlt style={{ fontSize: 20, color: "#10b981" }} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">
                        Enforced Onboarding Lifecycle Actions
                      </h6>
                      <span className="extra-small text-muted">
                        Run validation scans to check all 9 compliance domains before finalizing completion and activation.
                      </span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <Button
                      variant="light"
                      size="sm"
                      className="border rounded-pill px-3 py-1 extra-small fw-bold d-flex align-items-center gap-1.5 shadow-xs"
                      onClick={() => handleRunValidation(true)}
                      disabled={validating}
                    >
                      <FaSyncAlt className={validating ? "fa-spin text-primary" : "text-primary"} size={11} />
                      {validating ? "Validating..." : "Run Validation Engine"}
                    </Button>

                    {selectedOnboarding?.status === "READY_FOR_COMPLETION" && (
                      <Button
                        size="sm"
                        className="rounded-pill px-3 py-1 extra-small fw-bold text-white d-flex align-items-center gap-1.5 shadow-xs"
                        style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
                        onClick={handleCompleteOnboarding}
                        disabled={actionLoading}
                      >
                        <FaCheckCircle size={11} /> Complete Onboarding
                      </Button>
                    )}

                    {selectedOnboarding?.status === "COMPLETED" && targetEmp.lifecycleStatus !== "ACTIVE" && (
                      <Button
                        variant="info"
                        size="sm"
                        className="rounded-pill px-3 py-1 extra-small fw-bold text-dark d-flex align-items-center gap-1.5 shadow-xs"
                        onClick={handleActivateEmployee}
                        disabled={actionLoading}
                      >
                        <FaUnlock size={11} /> Activate Employee
                      </Button>
                    )}

                    {selectedOnboarding?.status === "COMPLETED" && !targetEmp.hasLoginAccess && (
                      <Button
                        size="sm"
                        className="rounded-pill px-3 py-1 extra-small fw-bold text-white d-flex align-items-center gap-1.5 shadow-xs"
                        style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
                        onClick={() => handleOpenProvision(targetEmp)}
                      >
                        <FaKey size={11} /> Provision Login Account
                      </Button>
                    )}

                    {targetEmp.hasLoginAccess && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="rounded-pill px-3 py-1 extra-small fw-semibold d-flex align-items-center gap-1.5"
                        onClick={() => handleToggleLogin(selectedOnboarding._id, true)}
                      >
                        <FaLock size={11} /> Disable Login Access
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* ── SLEEK HORIZONTAL NAVIGATION PILLS ── */}
              <div className="bg-white p-1.5 rounded-4 shadow-xs border mb-3">
                <Nav variant="pills" className="d-flex flex-wrap gap-1">
                  {detailTabs.map((tab) => (
                    <Nav.Item key={tab.id}>
                      <Nav.Link
                        active={detailActiveTab === tab.id}
                        onClick={() => setDetailActiveTab(tab.id)}
                        className={`d-flex align-items-center gap-1.5 extra-small py-1.5 px-3 rounded-pill cursor-pointer fw-bold ${detailActiveTab === tab.id
                            ? "text-white shadow-xs"
                            : "text-secondary border-0 bg-transparent"
                          }`}
                        style={detailActiveTab === tab.id ? { backgroundColor: "#2DC58A" } : {}}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.count !== null && tab.count !== undefined && (
                          <Badge
                            bg={detailActiveTab === tab.id ? "light" : "secondary"}
                            text={detailActiveTab === tab.id ? "dark" : "white"}
                            className="rounded-pill ms-1 extra-small"
                          >
                            {tab.count}
                          </Badge>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </div>

              {/* ── TAB CONTENT 0: CANDIDATE PROFILE & RECORDS (LIVE BACKEND DATA) ── */}
              {detailActiveTab === "profile" && (
                <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Candidate Background & Profile Records</h6>
                      <span className="extra-small text-muted">Fetched directly from backend database.</span>
                    </div>
                    <div>
                      {isEditingCandidateProfile ? (
                        <div className="d-flex gap-2">
                          <Button variant="secondary" size="sm" className="rounded-pill px-3 extra-small" onClick={() => setIsEditingCandidateProfile(false)}>
                            Cancel
                          </Button>
                          <Button variant="success" size="sm" className="rounded-pill px-3 extra-small fw-bold" onClick={handleSaveCandidateProfile} disabled={savingProfile}>
                            {savingProfile ? <Spinner size="sm" animation="border" /> : <FaSave className="me-1" />} Save Profile
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline-success" size="sm" className="rounded-pill px-3 extra-small fw-semibold" onClick={() => setIsEditingCandidateProfile(true)}>
                          <FaEdit className="me-1" /> Edit Profile Records
                        </Button>
                      )}
                    </div>
                  </div>

                  {candidateProfileData && (
                    <div>
                      {/* Section 0: Personal & Employment Details */}
                      <Card className="border-0 shadow-sm rounded-4 p-3.5 p-md-4 mb-4 bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                            <FaUser className="text-success" /> Personal & Employment Details
                          </h6>
                        </div>

                        {isEditingCandidateProfile ? (
                          <div>
                            {/* Edit Section 1: Personal Details */}
                            <div className="mb-3">
                              <h6 className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center gap-1.5">
                                <FaUser className="text-secondary" /> Personal Information
                              </h6>
                              <Row className="g-2">
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">First Name</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="First Name"
                                      value={candidateProfileData.firstName || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, firstName: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Middle Name</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="Middle Name"
                                      value={candidateProfileData.middleName || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, middleName: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Last Name</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="Last Name"
                                      value={candidateProfileData.lastName || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, lastName: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Email Address</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      type="email"
                                      placeholder="Email"
                                      value={candidateProfileData.email || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, email: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Mobile Number</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="Mobile"
                                      value={candidateProfileData.mobileNo || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, mobileNo: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Date of Birth</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      type="date"
                                      value={candidateProfileData.dob || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, dob: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Gender</Form.Label>
                                    <Form.Select
                                      size="sm"
                                      value={candidateProfileData.gender || "Male"}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, gender: e.target.value })}
                                    >
                                      <option value="Male">Male</option>
                                      <option value="Female">Female</option>
                                      <option value="Others">Others</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Marital Status</Form.Label>
                                    <Form.Select
                                      size="sm"
                                      value={candidateProfileData.marriageStatus || "Unmarried"}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, marriageStatus: e.target.value })}
                                    >
                                      <option value="Unmarried">Unmarried</option>
                                      <option value="Married">Married</option>
                                      <option value="Divorced">Divorced</option>
                                      <option value="Widowed">Widowed</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Blood Group</Form.Label>
                                    <Form.Select
                                      size="sm"
                                      value={candidateProfileData.bloodGroup || "O+"}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, bloodGroup: e.target.value })}
                                    >
                                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                                        <option key={bg} value={bg}>{bg}</option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>

                            {/* Edit Section 2: Employment Parameters */}
                            <div className="border-top pt-3">
                              <h6 className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center gap-1.5">
                                <FaBriefcase className="text-secondary" /> Employment & Organization Parameters
                              </h6>
                              <Row className="g-2">
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Designation</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="e.g. Software Engineer"
                                      value={candidateProfileData.designation || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, designation: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Department</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="e.g. IT, HR, Engineering"
                                      value={candidateProfileData.department || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, department: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Role</Form.Label>
                                    <Form.Select
                                      size="sm"
                                      value={candidateProfileData.roleId || candidateProfileData.role || ""}
                                      onChange={(e) => {
                                        const selectedRole = assignableRoles.find((r) => r._id === e.target.value);
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          roleId: e.target.value,
                                          role: selectedRole?.roleName || e.target.value,
                                        });
                                      }}
                                    >
                                      <option value="">Select Role</option>
                                      {assignableRoles.map((r) => (
                                        <option key={r._id} value={r._id}>
                                          {r.roleName} (Level {r.priority})
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Employment Type</Form.Label>
                                    <Form.Select
                                      size="sm"
                                      value={candidateProfileData.employmentType || "FULL_TIME"}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, employmentType: e.target.value })}
                                    >
                                      <option value="FULL_TIME">Full Time</option>
                                      <option value="PART_TIME">Part Time</option>
                                      <option value="CONTRACT">Contract</option>
                                      <option value="INTERN">Intern</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Joining Date</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      type="date"
                                      value={candidateProfileData.joiningDate || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, joiningDate: e.target.value })}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold text-secondary">Reporting Manager</Form.Label>
                                    <Form.Select
                                      size="sm"
                                      value={candidateProfileData.reportingManager || ""}
                                      onChange={(e) => setCandidateProfileData({ ...candidateProfileData, reportingManager: e.target.value })}
                                    >
                                      <option value="">Select Manager (Optional)</option>
                                      {employees.map((emp) => (
                                        <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                          {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.designation || "Employee"})
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>
                          </div>
                        ) : (
                          <Row className="g-3">
                            {/* ── Left Column: Personal Information ── */}
                            <Col lg={6}>
                              <div className="h-100 p-3 bg-light rounded-3 border d-flex flex-column">
                                <div className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center gap-1.5 pb-2 border-bottom">
                                  <FaUser className="text-success" /> Personal Information
                                </div>
                                <Table borderless size="sm" className="mb-0 align-middle">
                                  <tbody>
                                    <tr>
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold" style={{ width: "38%" }}>Full Name</td>
                                      <td className="fw-bold text-dark small py-2">{candidateProfileData.firstName} {candidateProfileData.middleName || ""} {candidateProfileData.lastName}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Email Address</td>
                                      <td className="fw-semibold text-dark small py-2 text-break">{candidateProfileData.email || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Mobile Number</td>
                                      <td className="fw-semibold text-dark small py-2">{candidateProfileData.mobileNo || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Date of Birth</td>
                                      <td className="fw-semibold text-dark small py-2">{candidateProfileData.dob || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Gender</td>
                                      <td className="fw-semibold text-dark small py-2">{candidateProfileData.gender || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Marital Status</td>
                                      <td className="fw-semibold text-dark small py-2">{candidateProfileData.marriageStatus || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Blood Group</td>
                                      <td className="py-2">
                                        {candidateProfileData.bloodGroup ? (
                                          <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger-subtle px-2 py-1">
                                            {candidateProfileData.bloodGroup}
                                          </Badge>
                                        ) : (
                                          <span className="text-dark fw-semibold small">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            </Col>

                            {/* ── Right Column: Employment & Organization Parameters ── */}
                            <Col lg={6}>
                              <div className="h-100 p-3 bg-light rounded-3 border d-flex flex-column">
                                <div className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center gap-1.5 pb-2 border-bottom">
                                  <FaBriefcase className="text-primary" /> Employment & Organization Parameters
                                </div>
                                <Table borderless size="sm" className="mb-0 align-middle">
                                  <tbody>
                                    <tr>
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold" style={{ width: "38%" }}>Designation</td>
                                      <td className="fw-bold text-dark small py-2">{candidateProfileData.designation || selectedOnboarding?.designation || targetEmp.designation || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Department</td>
                                      <td className="fw-bold text-dark small py-2">{candidateProfileData.department || selectedOnboarding?.department || targetEmp.department || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Role</td>
                                      <td className="py-2">
                                        <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary-subtle px-2.5 py-1 fw-semibold">
                                          {assignableRoles.find((r) => r._id === (candidateProfileData.roleId || candidateProfileData.role))?.roleName ||
                                            candidateProfileData.role?.roleName ||
                                            candidateProfileData.role ||
                                            targetEmp.role?.roleName ||
                                            targetEmp.role ||
                                            selectedOnboarding?.role ||
                                            "Employee"}
                                        </Badge>
                                      </td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Employment Type</td>
                                      <td className="py-2">
                                        <Badge bg="info" className="bg-opacity-10 text-dark border border-info-subtle px-2.5 py-1 fw-semibold">
                                          {(candidateProfileData.employmentType || selectedOnboarding?.employmentType || targetEmp.employmentType || "FULL_TIME").replace(/_/g, " ")}
                                        </Badge>
                                      </td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Joining Date</td>
                                      <td className="fw-semibold text-dark small py-2">{candidateProfileData.joiningDate || selectedOnboarding?.joiningDate || targetEmp.joiningDate || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-2 text-uppercase fw-semibold">Reported To</td>
                                      <td className="fw-semibold text-dark small py-2">
                                        {employees.find((e) => (e._id || e.id) === candidateProfileData.reportingManager)
                                          ? `${employees.find((e) => (e._id || e.id) === candidateProfileData.reportingManager).firstName} ${employees.find((e) => (e._id || e.id) === candidateProfileData.reportingManager).lastName || ""}`
                                          : (candidateProfileData.reportingManagerName || "—")}
                                      </td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            </Col>
                          </Row>
                        )}
                      </Card>

                      {/* Section 1: Professional & Current Company */}
                      <Card className="p-3 bg-light border-0 rounded-3 mb-3 shadow-xs">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                            <FaBuilding className="text-success" /> Current & Past Company Experience ({candidateProfileData.professional?.length || 0})
                          </span>
                          {isEditingCandidateProfile && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="rounded-pill px-3 extra-small fw-semibold d-inline-flex align-items-center gap-1"
                              onClick={() => {
                                setCandidateProfileData((prev) => ({
                                  ...prev,
                                  professional: [
                                    ...(prev.professional || []),
                                    {
                                      companyName: "",
                                      companyWebsite: "",
                                      website: "",
                                      location: "",
                                      department: "",
                                      designation: "",
                                      role: "",
                                      salary: "",
                                      joiningDate: candidateProfileData.joiningDate || "",
                                      reportedTo: candidateProfileData.reportingManager || "",
                                      noticePeriod: "",
                                      expectedLastWorkingDate: "",
                                      employmentStatus: "CURRENTLY_EMPLOYED",
                                      isCurrent: false,
                                      isFresher: false,
                                      documentType: "OFFER_LETTER",
                                      documentUrl: "",
                                      documentName: "",
                                      documentFile: null,
                                    },
                                  ],
                                }));
                              }}
                            >
                              <FaPlus /> Add Company Record
                            </Button>
                          )}
                        </div>

                        {isEditingCandidateProfile ? (
                          <div className="d-flex flex-column gap-3">
                            {candidateProfileData.professional && candidateProfileData.professional.length > 0 ? (
                              candidateProfileData.professional.map((prof, i) => {
                                const doc = getProfessionalDoc(prof);
                                const isUploadingThis = uploadingProfIndex === i;

                                return (
                                  <Card key={i} className="p-3 bg-white border rounded-3 shadow-xs">
                                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="fw-bold small text-dark">
                                          Company Record #{i + 1}
                                        </span>
                                        {!prof.isFresher && prof.isCurrent && (
                                          <Badge bg="success" className="ms-1">Current Employer</Badge>
                                        )}
                                        {prof.isFresher && (
                                          <Badge bg="info" className="ms-1 text-white">Fresher</Badge>
                                        )}
                                      </div>
                                      <div className="d-flex align-items-center gap-3">
                                        <Form.Check
                                          type="checkbox"
                                          id={`editFresher-${i}`}
                                          label={<span className="extra-small fw-bold text-primary cursor-pointer">Fresher (No Prior Experience)</span>}
                                          checked={prof.isFresher === true}
                                          onChange={(e) => {
                                            const arr = [...candidateProfileData.professional];
                                            arr[i].isFresher = e.target.checked;
                                            setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                          }}
                                          className="extra-small mb-0"
                                        />
                                        {candidateProfileData.professional.length > 1 && (
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="py-0 px-2 extra-small"
                                            onClick={() => {
                                              setCandidateProfileData((prev) => ({
                                                ...prev,
                                                professional: prev.professional.filter((_, idx) => idx !== i),
                                              }));
                                            }}
                                          >
                                            <FaTrash /> Remove
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    {prof.isFresher ? (
                                      /* Fresher Mode: Joining Date & Manager */
                                      <div className="p-3 bg-light rounded-3 border border-info border-opacity-25">
                                        <div className="d-flex align-items-center mb-3 text-muted extra-small">
                                          <span className="badge bg-info-subtle text-info border border-info me-2">Fresher Mode</span>
                                          <span>No prior company experience required. Specify joining date and reporting manager.</span>
                                        </div>
                                        <Row className="g-3">
                                          <Col md={6}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">Joining Date</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                type="date"
                                                value={prof.joiningDate ? new Date(prof.joiningDate).toISOString().split("T")[0] : ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].joiningDate = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={6}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">Reporting Manager</Form.Label>
                                              <Form.Select
                                                size="sm"
                                                value={prof.reportedTo || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].reportedTo = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              >
                                                <option value="">Select Reporting Manager (Optional)</option>
                                                {employees.map((emp) => (
                                                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                                    {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.designation || "Employee"})
                                                  </option>
                                                ))}
                                              </Form.Select>
                                            </Form.Group>
                                          </Col>
                                        </Row>
                                      </div>
                                    ) : (
                                      /* Experienced Mode: Full Inputs */
                                      <div>
                                        <Row className="g-2 mb-2">
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">COMPANY NAME</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                placeholder="Company Name (e.g. FlareMinds Tech)"
                                                value={prof.companyName || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].companyName = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">COMPANY WEBSITE / LINKEDIN</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                placeholder="https://..."
                                                value={prof.companyWebsite || prof.website || prof.linkedin || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].companyWebsite = e.target.value;
                                                  arr[i].website = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">LOCATION / BRANCH</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                placeholder="e.g. Chennai, Bangalore"
                                                value={prof.location || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].location = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                        </Row>

                                        <Row className="g-2 mb-2">
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">DEPARTMENT</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                placeholder="e.g. Engineering, Product"
                                                value={prof.department || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].department = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">DESIGNATION</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                placeholder="e.g. Senior Developer"
                                                value={prof.designation || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].designation = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">ROLE / POSITION</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                placeholder="e.g. Full Stack Lead"
                                                value={prof.role || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].role = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                        </Row>

                                        <Row className="g-2 mb-2">
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">SALARY / CTC</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                placeholder="e.g. 6.5 LPA or 50,000/mo"
                                                value={prof.salary || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].salary = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">JOINING DATE</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                type="date"
                                                value={prof.joiningDate ? new Date(prof.joiningDate).toISOString().split("T")[0] : ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].joiningDate = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">REPORTING MANAGER</Form.Label>
                                              <Form.Select
                                                size="sm"
                                                value={prof.reportedTo || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].reportedTo = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              >
                                                <option value="">Select Reporting Manager (Optional)</option>
                                                {employees.map((emp) => (
                                                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                                    {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.designation || "Employee"})
                                                  </option>
                                                ))}
                                              </Form.Select>
                                            </Form.Group>
                                          </Col>
                                        </Row>

                                        <Row className="g-2 mb-2">
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">NOTICE PERIOD</Form.Label>
                                              <Form.Select
                                                size="sm"
                                                value={prof.noticePeriod || ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].noticePeriod = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              >
                                                <option value="">Select Notice Period</option>
                                                <option value="Immediate">Immediate / Serving Notice</option>
                                                <option value="15 Days">15 Days</option>
                                                <option value="30 Days">30 Days</option>
                                                <option value="60 Days">60 Days</option>
                                                <option value="90 Days">90 Days</option>
                                              </Form.Select>
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">EXPECTED LAST WORKING DATE</Form.Label>
                                              <Form.Control
                                                size="sm"
                                                type="date"
                                                value={prof.expectedLastWorkingDate ? new Date(prof.expectedLastWorkingDate).toISOString().split("T")[0] : ""}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].expectedLastWorkingDate = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              />
                                            </Form.Group>
                                          </Col>
                                          <Col md={4}>
                                            <Form.Group>
                                              <Form.Label className="extra-small fw-bold">EMPLOYMENT STATUS</Form.Label>
                                              <Form.Select
                                                size="sm"
                                                value={prof.employmentStatus || "CURRENTLY_EMPLOYED"}
                                                onChange={(e) => {
                                                  const arr = [...candidateProfileData.professional];
                                                  arr[i].employmentStatus = e.target.value;
                                                  setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                                }}
                                              >
                                                <option value="CURRENTLY_EMPLOYED">Currently Employed</option>
                                                <option value="RESIGNED">Resigned</option>
                                                <option value="RELIEVED">Relieved</option>
                                                <option value="NOT_APPLICABLE">Not Applicable</option>
                                              </Form.Select>
                                            </Form.Group>
                                          </Col>
                                        </Row>

                                        <Row className="g-2 mb-3">
                                          <Col md={12} className="d-flex align-items-center">
                                            <Form.Check
                                              type="checkbox"
                                              id={`editIsCurrent-${i}`}
                                              label="Is Current Employer"
                                              checked={prof.isCurrent !== false}
                                              onChange={(e) => {
                                                const arr = [...candidateProfileData.professional];
                                                arr[i].isCurrent = e.target.checked;
                                                setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                              }}
                                              className="extra-small fw-semibold text-dark"
                                            />
                                          </Col>
                                        </Row>

                                        {/* Document Attachment & Direct In-Modal Viewer Row */}
                                        <div className="p-2.5 bg-light rounded-3 border d-flex justify-content-between align-items-center flex-wrap gap-2">
                                          <div className="d-flex align-items-center gap-2">
                                            <span className="extra-small fw-bold text-secondary">Document:</span>
                                            <Form.Select
                                              size="sm"
                                              className="py-1 px-2 extra-small rounded-pill"
                                              style={{ width: "160px" }}
                                              value={prof.documentType || "OFFER_LETTER"}
                                              onChange={(e) => {
                                                const arr = [...candidateProfileData.professional];
                                                arr[i].documentType = e.target.value;
                                                setCandidateProfileData({ ...candidateProfileData, professional: arr });
                                              }}
                                            >
                                              <option value="OFFER_LETTER">Offer Letter</option>
                                              <option value="RELIEVING_LETTER">Relieving Letter</option>
                                              <option value="APPOINTMENT_LETTER">Appointment Letter</option>
                                              <option value="PAYSLIP">Payslip</option>
                                              <option value="EXPERIENCE_LETTER">Experience Letter</option>
                                              <option value="OTHER">Other Document</option>
                                            </Form.Select>
                                          </div>

                                          <div className="d-flex align-items-center gap-2">
                                            {doc ? (
                                              <>
                                                <Badge bg="success-subtle" className="text-success border border-success-subtle py-1.5 px-2.5 rounded-pill d-inline-flex align-items-center gap-1 extra-small">
                                                  <FaCheckCircle size={11} /> Attached
                                                </Badge>
                                                <Button
                                                  variant="outline-primary"
                                                  size="sm"
                                                  className="py-1 px-3 extra-small rounded-pill fw-semibold shadow-xs d-inline-flex align-items-center gap-1"
                                                  onClick={() => handleOpenDocPreview(doc, `${prof.companyName || "Company"} ${prof.documentType || "Document"}`)}
                                                >
                                                  <FaEye size={11} /> View Document
                                                </Button>
                                                <label className="btn btn-outline-secondary btn-sm py-1 px-2.5 extra-small rounded-pill fw-semibold mb-0 cursor-pointer d-inline-flex align-items-center gap-1">
                                                  <FaUpload size={10} /> Re-upload
                                                  <input
                                                    type="file"
                                                    hidden
                                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                                    onChange={(e) => handleUploadProfessionalDoc(e, prof, i)}
                                                  />
                                                </label>
                                              </>
                                            ) : (
                                              <>
                                                <span className="extra-small text-muted fst-italic">No document attached</span>
                                                <label className={`btn btn-outline-success btn-sm py-1 px-3 extra-small rounded-pill fw-semibold mb-0 cursor-pointer shadow-xs d-inline-flex align-items-center gap-1 ${isUploadingThis ? "disabled" : ""}`}>
                                                  {isUploadingThis ? (
                                                    <>
                                                      <Spinner animation="border" size="sm" className="me-1" /> Uploading...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <FaUpload size={11} /> Choose Document File (Optional)
                                                    </>
                                                  )}
                                                  <input
                                                    type="file"
                                                    hidden
                                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                                    disabled={isUploadingThis}
                                                    onChange={(e) => handleUploadProfessionalDoc(e, prof, i)}
                                                  />
                                                </label>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Card>
                                );
                              })
                            ) : (
                              <div className="text-center py-3 bg-white rounded-3 border text-muted extra-small">
                                No company records added. Click "+ Add Company Record" above to add one.
                              </div>
                            )}
                          </div>
                        ) : (
                          /* View Mode: Comprehensive Table with Direct Document Preview */
                          <Table size="sm" responsive className="mb-0 bg-white rounded-3 shadow-xs">
                            <thead className="table-light extra-small">
                              <tr>
                                <th>Company</th>
                                <th>Department & Role</th>
                                <th>Designation</th>
                                <th>Location</th>
                                <th>Joining Date</th>
                                <th>Reported To</th>
                                <th>Status</th>
                                <th>Current</th>
                                <th className="text-center">Document</th>
                              </tr>
                            </thead>
                            <tbody>
                              {candidateProfileData.professional && candidateProfileData.professional.length > 0 ? (
                                candidateProfileData.professional.map((p, i) => {
                                  const managerName = employees.find((e) => (e._id || e.id) === (p.reportedTo || candidateProfileData.reportingManager))
                                    ? `${employees.find((e) => (e._id || e.id) === (p.reportedTo || candidateProfileData.reportingManager)).firstName} ${employees.find((e) => (e._id || e.id) === (p.reportedTo || candidateProfileData.reportingManager)).lastName || ""}`
                                    : (p.reportedToName || "—");
                                  const doc = getProfessionalDoc(p);

                                  return (
                                    <tr key={i} className="align-middle">
                                      <td>
                                        <div className="fw-bold text-dark small">{p.companyName || p.company || (p.isFresher ? "Current Organization (Fresher)" : "—")}</div>
                                        {p.companyWebsite || p.website ? (
                                          <a href={(p.companyWebsite || p.website).startsWith("http") ? (p.companyWebsite || p.website) : `https://${p.companyWebsite || p.website}`} target="_blank" rel="noopener noreferrer" className="extra-small text-primary text-decoration-none">
                                            {p.companyWebsite || p.website}
                                          </a>
                                        ) : null}
                                      </td>
                                      <td>
                                        <span className="extra-small text-dark fw-semibold">{p.department || "—"}</span>
                                        {p.role && <div className="extra-small text-muted">{p.role}</div>}
                                      </td>
                                      <td><Badge bg="light" text="dark" className="border">{p.designation || candidateProfileData.designation || "—"}</Badge></td>
                                      <td className="extra-small text-muted">{p.location || p.branch || p.city || "—"}</td>
                                      <td className="extra-small fw-semibold">{p.joiningDate ? new Date(p.joiningDate).toLocaleDateString() : (candidateProfileData.joiningDate ? new Date(candidateProfileData.joiningDate).toLocaleDateString() : "—")}</td>
                                      <td><Badge bg="light" text="dark" className="border">{managerName}</Badge></td>
                                      <td>
                                        <Badge bg="info" className="bg-opacity-10 text-dark border border-info-subtle">
                                          {(p.employmentStatus || "CURRENTLY_EMPLOYED").replace(/_/g, " ")}
                                        </Badge>
                                      </td>
                                      <td>{p.isCurrent ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                                      <td className="text-center">
                                        {doc ? (
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="py-0 px-2 extra-small rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
                                            onClick={() => handleOpenDocPreview(doc, `${p.companyName || "Company"} ${p.documentType || "Document"}`)}
                                          >
                                            <FaEye size={10} /> View
                                          </Button>
                                        ) : (
                                          <span className="extra-small text-muted">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={9} className="text-center text-muted py-3 extra-small">
                                    No company or professional records registered.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        )}
                      </Card>

                      {/* Section 2: Education */}
                      <Card className="p-3 bg-light border-0 rounded-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                            <FaGraduationCap className="text-primary" /> Educational Qualifications ({candidateProfileData.education?.length || 0})
                          </span>
                          {isEditingCandidateProfile && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="py-0 px-2 extra-small rounded-pill"
                              onClick={() => {
                                setCandidateProfileData((prev) => ({
                                  ...prev,
                                  education: [
                                    ...(prev.education || []),
                                    { degree: "", stream: "", university: "", percentage: "", yearOfPassing: "" },
                                  ],
                                }));
                              }}
                            >
                              <FaPlus className="me-1" /> Add Qualification
                            </Button>
                          )}
                        </div>

                        {isEditingCandidateProfile ? (
                          <div className="d-flex flex-column gap-2">
                            {candidateProfileData.education && candidateProfileData.education.length > 0 ? (
                              candidateProfileData.education.map((edu, i) => (
                                <Card key={i} className="p-2.5 bg-white border rounded-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="extra-small fw-bold text-muted">Qualification #{i + 1}</span>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="py-0 px-2 extra-small rounded-pill"
                                      onClick={() => {
                                        setCandidateProfileData((prev) => ({
                                          ...prev,
                                          education: prev.education.filter((_, idx) => idx !== i),
                                        }));
                                      }}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                  <Row className="g-2 mb-2">
                                    <Col md={6}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Degree / Level (e.g. B.Tech, HSC, SSLC)"
                                        value={edu.degree || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.education];
                                          arr[i].degree = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, education: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={6}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Stream / Specialization / Board"
                                        value={edu.stream || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.education];
                                          arr[i].stream = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, education: arr });
                                        }}
                                      />
                                    </Col>
                                  </Row>
                                  <Row className="g-2">
                                    <Col md={6}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="University / College / School"
                                        value={edu.university || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.education];
                                          arr[i].university = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, education: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={3}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Percentage / CGPA"
                                        value={edu.percentage || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.education];
                                          arr[i].percentage = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, education: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={3}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Year of Passing"
                                        value={edu.yearOfPassing || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.education];
                                          arr[i].yearOfPassing = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, education: arr });
                                        }}
                                      />
                                    </Col>
                                  </Row>
                                  <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2 flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="extra-small text-muted fw-semibold">Certificate Document:</span>
                                      {getEducationDoc(edu)?.url ? (
                                        <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small py-1 px-2.5 rounded-pill d-inline-flex align-items-center gap-1">
                                          <FaCheckCircle size={10} /> Attached
                                        </Badge>
                                      ) : (
                                        <span className="extra-small text-muted fst-italic">No document attached</span>
                                      )}
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      {getEducationDoc(edu)?.url && (
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="btn-icon text-primary bg-primary-subtle border border-primary-subtle rounded-pill py-1 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                                          onClick={() => handleOpenDocPreview(getEducationDoc(edu), `${edu.degree || "Education"} Certificate`)}
                                        >
                                          <FaEye size={13} /> View Document
                                        </Button>
                                      )}
                                      <label
                                        className={`btn btn-sm rounded-pill mb-0 py-1 px-2.5 extra-small fw-semibold ${getEducationDoc(edu)?.url ? "btn-outline-secondary" : "btn-outline-success"}`}
                                        style={{ cursor: uploadingEduIndex === i ? "not-allowed" : "pointer" }}
                                      >
                                        {uploadingEduIndex === i ? (
                                          <>
                                            <Spinner animation="border" size="sm" className="me-1" style={{ width: 10, height: 10 }} /> Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <FaFileUpload className="me-1" /> {getEducationDoc(edu)?.url ? "Re-upload" : "Upload Document"}
                                          </>
                                        )}
                                        <input
                                          type="file"
                                          hidden
                                          disabled={uploadingEduIndex === i}
                                          accept=".pdf,.png,.jpg,.jpeg"
                                          onChange={(e) => handleUploadEducationDoc(e, edu, i)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </Card>
                              ))
                            ) : (
                              <div className="text-center py-2 bg-white rounded-2 border text-muted extra-small">
                                No qualifications added. Click "+ Add Qualification" above to add.
                              </div>
                            )}
                          </div>
                        ) : (
                          <Table size="sm" responsive className="mb-0 bg-white rounded-2 align-middle">
                            <thead className="table-light extra-small">
                              <tr>
                                <th>Degree / Qualification</th>
                                <th>Stream / Specialization</th>
                                <th>University / College</th>
                                <th>Percentage / CGPA</th>
                                <th>Year</th>
                                <th className="text-end">Certificate / Document</th>
                              </tr>
                            </thead>
                            <tbody>
                              {candidateProfileData.education && candidateProfileData.education.length > 0 ? (
                                candidateProfileData.education.map((ed, i) => {
                                  const doc = getEducationDoc(ed);
                                  const isUploading = uploadingEduIndex === i;
                                  return (
                                    <tr key={i}>
                                      <td className="fw-semibold text-dark">{ed.degree || "—"}</td>
                                      <td>{ed.stream || ed.specialization || ed.course || "—"}</td>
                                      <td>{ed.university || ed.college || ed.schoolName || ed.instituteName || "—"}</td>
                                      <td>{ed.percentage ? (String(ed.percentage).includes("%") || String(ed.percentage).includes("CGPA") ? ed.percentage : `${ed.percentage}%`) : (ed.cgpa ? `${ed.cgpa} CGPA` : "—")}</td>
                                      <td>{ed.yearOfPassing || ed.year || "—"}</td>
                                      <td className="text-end">
                                        <div className="d-inline-flex align-items-center gap-2 justify-content-end">
                                          {doc?.url ? (
                                            <Button
                                              variant="light"
                                              size="sm"
                                              className="btn-icon text-primary bg-primary-subtle border border-primary-subtle rounded-pill py-1 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                                              title="View Uploaded Document"
                                              onClick={() => handleOpenDocPreview(doc, doc.title || `${ed.degree} Certificate`, "certificate")}
                                            >
                                              <FaEye size={14} /> View
                                            </Button>
                                          ) : (
                                            <span className="text-muted extra-small fst-italic me-1">No file</span>
                                          )}
                                          <label
                                            className={`btn btn-sm rounded-pill mb-0 py-1 px-2.5 extra-small fw-semibold ${doc?.url ? "btn-outline-secondary" : "btn-outline-success"}`}
                                            style={{ cursor: isUploading ? "not-allowed" : "pointer" }}
                                          >
                                            {isUploading ? (
                                              <>
                                                <Spinner animation="border" size="sm" className="me-1" style={{ width: 10, height: 10 }} /> Uploading...
                                              </>
                                            ) : (
                                              <>
                                                <FaFileUpload className="me-1" /> {doc?.url ? "Re-upload" : "Upload"}
                                              </>
                                            )}
                                            <input
                                              type="file"
                                              hidden
                                              disabled={isUploading}
                                              accept=".pdf,.png,.jpg,.jpeg"
                                              onChange={(e) => handleUploadEducationDoc(e, ed, i)}
                                            />
                                          </label>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={6} className="text-center text-muted py-3 extra-small">
                                    No educational qualifications recorded yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        )}
                      </Card>

                      {/* Section 3: Work Experience */}
                      <Card className="p-3 bg-light border-0 rounded-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                            <FaBriefcase className="text-warning" /> Previous Work Experience ({candidateProfileData.experience?.length || 0})
                          </span>
                          {isEditingCandidateProfile && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="py-0 px-2 extra-small rounded-pill"
                              onClick={() => {
                                setCandidateProfileData((prev) => ({
                                  ...prev,
                                  experience: [
                                    ...(prev.experience || []),
                                    { prevCompany: "", designation: "", experienceYears: "", roleDescription: "" },
                                  ],
                                }));
                              }}
                            >
                              <FaPlus className="me-1" /> Add Experience
                            </Button>
                          )}
                        </div>

                        {isEditingCandidateProfile ? (
                          <div className="d-flex flex-column gap-2">
                            {candidateProfileData.experience && candidateProfileData.experience.length > 0 ? (
                              candidateProfileData.experience.map((exp, i) => (
                                <Card key={i} className="p-2 bg-white border rounded-2">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="extra-small fw-bold text-muted">Experience #{i + 1}</span>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="py-0 px-2 extra-small"
                                      onClick={() => {
                                        setCandidateProfileData((prev) => ({
                                          ...prev,
                                          experience: prev.experience.filter((_, idx) => idx !== i),
                                        }));
                                      }}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                  <Row className="g-2 mb-2">
                                    <Col md={6}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Previous Company Name"
                                        value={exp.prevCompany || exp.companyName || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.experience];
                                          arr[i].prevCompany = e.target.value;
                                          arr[i].companyName = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, experience: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={6}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Designation / Role"
                                        value={exp.designation || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.experience];
                                          arr[i].designation = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, experience: arr });
                                        }}
                                      />
                                    </Col>
                                  </Row>
                                  <Row className="g-2">
                                    <Col md={4}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Duration (e.g. 2 years)"
                                        value={exp.experienceYears || exp.experience || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.experience];
                                          arr[i].experienceYears = e.target.value;
                                          arr[i].experience = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, experience: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={8}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Roles & Responsibilities"
                                        value={exp.roleDescription || exp.description || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.experience];
                                          arr[i].roleDescription = e.target.value;
                                          arr[i].description = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, experience: arr });
                                        }}
                                      />
                                    </Col>
                                  </Row>
                                </Card>
                              ))
                            ) : (
                              <div className="text-center py-2 bg-white rounded-2 border text-muted extra-small">
                                No previous experience recorded. Click "+ Add Experience" above to add.
                              </div>
                            )}
                          </div>
                        ) : (
                          <Table size="sm" responsive className="mb-0 bg-white rounded-2">
                            <thead className="table-light extra-small">
                              <tr>
                                <th>Employer</th>
                                <th>Role</th>
                                <th>Experience Duration</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {candidateProfileData.experience && candidateProfileData.experience.length > 0 ? (
                                candidateProfileData.experience.map((ex, i) => (
                                  <tr key={i}>
                                    <td className="fw-semibold">{ex.prevCompany || ex.companyName || ex.employer || "—"}</td>
                                    <td>{ex.designation || ex.role || "—"}</td>
                                    <td>{ex.experienceYears || ex.experience || ex.duration || "—"}</td>
                                    <td className="extra-small text-muted">{ex.roleDescription || ex.description || "—"}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="text-center text-muted py-3 extra-small">
                                    No previous work experience recorded (Fresher).
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        )}
                      </Card>

                      {/* Section 4: Address Details */}
                      <Card className="p-3 bg-light border-0 rounded-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                            <FaHome className="text-danger" /> Addresses ({candidateProfileData.addresses?.length || 0})
                          </span>
                          {isEditingCandidateProfile && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="py-0 px-2 extra-small rounded-pill"
                              onClick={() => {
                                setCandidateProfileData((prev) => ({
                                  ...prev,
                                  addresses: [
                                    ...(prev.addresses || []),
                                    { addressType: "Current", addressLine1: "", city: "", state: "", country: "India", pincode: "" },
                                  ],
                                }));
                              }}
                            >
                              <FaPlus className="me-1" /> Add Address
                            </Button>
                          )}
                        </div>

                        {isEditingCandidateProfile ? (
                          <div className="d-flex flex-column gap-2">
                            {candidateProfileData.addresses && candidateProfileData.addresses.length > 0 ? (
                              candidateProfileData.addresses.map((addr, i) => (
                                <Card key={i} className="p-2 bg-white border rounded-2">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="extra-small fw-bold text-muted">Address #{i + 1} ({addr.addressType || "Permanent"})</span>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="py-0 px-2 extra-small"
                                      onClick={() => {
                                        setCandidateProfileData((prev) => ({
                                          ...prev,
                                          addresses: prev.addresses.filter((_, idx) => idx !== i),
                                        }));
                                      }}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                  <Row className="g-2 mb-2">
                                    <Col md={3}>
                                      <Form.Select
                                        size="sm"
                                        value={addr.addressType || "Permanent"}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.addresses];
                                          arr[i].addressType = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, addresses: arr });
                                        }}
                                      >
                                        <option value="Permanent">Permanent</option>
                                        <option value="Current">Current / Present</option>
                                        <option value="Official">Official</option>
                                      </Form.Select>
                                    </Col>
                                    <Col md={9}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Address Line"
                                        value={addr.addressLine1 || addr.address1 || addr.address || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.addresses];
                                          arr[i].addressLine1 = e.target.value;
                                          arr[i].address1 = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, addresses: arr });
                                        }}
                                      />
                                    </Col>
                                  </Row>
                                  <Row className="g-2">
                                    <Col md={3}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="City"
                                        value={addr.city || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.addresses];
                                          arr[i].city = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, addresses: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={3}>
                                      <StateSearchDropdown
                                        value={addr.state || ""}
                                        placeholder="State"
                                        onChange={(val) => {
                                          const arr = [...candidateProfileData.addresses];
                                          arr[i].state = val;
                                          setCandidateProfileData({ ...candidateProfileData, addresses: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={3}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Country"
                                        value={addr.country || "India"}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.addresses];
                                          arr[i].country = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, addresses: arr });
                                        }}
                                      />
                                    </Col>
                                    <Col md={3}>
                                      <Form.Control
                                        size="sm"
                                        placeholder="Pincode"
                                        maxLength={6}
                                        value={addr.pincode || addr.postalCode || ""}
                                        onChange={(e) => {
                                          const arr = [...candidateProfileData.addresses];
                                          arr[i].pincode = e.target.value;
                                          arr[i].postalCode = e.target.value;
                                          setCandidateProfileData({ ...candidateProfileData, addresses: arr });
                                        }}
                                      />
                                    </Col>
                                  </Row>
                                </Card>
                              ))
                            ) : (
                              <div className="text-center py-2 bg-white rounded-2 border text-muted extra-small">
                                No address records added. Click "+ Add Address" above to add.
                              </div>
                            )}
                          </div>
                        ) : (
                          <Table size="sm" responsive className="mb-0 bg-white rounded-2">
                            <thead className="table-light extra-small">
                              <tr>
                                <th>Type</th>
                                <th>Address</th>
                                <th>City / State</th>
                                <th>Pincode</th>
                                <th>Country</th>
                              </tr>
                            </thead>
                            <tbody>
                              {candidateProfileData.addresses && candidateProfileData.addresses.length > 0 ? (
                                candidateProfileData.addresses.map((ad, i) => {
                                  const fullAddr = [ad.addressLine1 || ad.address1 || ad.address || ad.street, ad.addressLine2 || ad.address2].filter(Boolean).join(", ");
                                  const cityState = [ad.city, ad.state].filter(Boolean).join(", ") || "—";
                                  return (
                                    <tr key={i}>
                                      <td><Badge bg="light" text="dark" className="border">{ad.addressType || "Permanent"}</Badge></td>
                                      <td>{fullAddr || "—"}</td>
                                      <td>{cityState}</td>
                                      <td>{ad.pincode || ad.postalCode || ad.pinCode || "—"}</td>
                                      <td>{ad.country || "India"}</td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={5} className="text-center text-muted py-3 extra-small">
                                    No address records registered yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        )}
                      </Card>

                      {/* Section 5: Bank & Statutory Details */}
                      <Card className="p-3 bg-light border-0 rounded-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2.5">
                          <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                            <FaCreditCard className="text-info" /> Bank & Statutory Details
                          </span>
                          <Button
                            variant={isEditingCandidateProfile ? "outline-secondary" : "outline-success"}
                            size="sm"
                            className="py-0 px-2 extra-small rounded-pill fw-semibold"
                            onClick={() => setIsEditingCandidateProfile((p) => !p)}
                          >
                            <FaEdit className="me-1" /> {isEditingCandidateProfile ? "Done Editing" : "Edit Bank & Statutory"}
                          </Button>
                        </div>

                        {isEditingCandidateProfile ? (
                          <div className="d-flex flex-column gap-3">
                            {/* Sub-Section 1: Statutory & Compliance Form */}
                            <div className="p-2.5 bg-white border rounded-3">
                              <div className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center gap-1.5 pb-1.5 border-bottom">
                                <FaFileContract className="text-warning" /> Statutory & Compliance Information
                              </div>
                              <Row className="g-2">
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">PAN Number</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="e.g. ABCDE1234F"
                                      value={candidateProfileData.statutoryDetails?.panNo || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          statutoryDetails: { ...candidateProfileData.statutoryDetails, panNo: e.target.value.toUpperCase() },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">Aadhaar Number</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="12-digit Aadhaar Number"
                                      value={candidateProfileData.statutoryDetails?.aadhaarNo || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          statutoryDetails: { ...candidateProfileData.statutoryDetails, aadhaarNo: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">UAN Number</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="12-digit UAN Number"
                                      value={candidateProfileData.statutoryDetails?.uanNo || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          statutoryDetails: { ...candidateProfileData.statutoryDetails, uanNo: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">PF Number</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="Provident Fund Number"
                                      value={candidateProfileData.statutoryDetails?.pfNo || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          statutoryDetails: { ...candidateProfileData.statutoryDetails, pfNo: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">ESI / Insurance Number</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="17-digit ESI Number"
                                      value={candidateProfileData.statutoryDetails?.esiNo || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          statutoryDetails: { ...candidateProfileData.statutoryDetails, esiNo: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>

                            {/* Sub-Section 2: Bank Details Form */}
                            <div className="p-2.5 bg-white border rounded-3">
                              <div className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center gap-1.5 pb-1.5 border-bottom">
                                <FaUniversity className="text-success" /> Bank Account Information
                              </div>
                              <Row className="g-2">
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">Bank Name</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="e.g. HDFC Bank, SBI"
                                      value={candidateProfileData.bankDetails?.bankName || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          bankDetails: { ...candidateProfileData.bankDetails, bankName: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">Account Holder Name</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="Name as per bank records"
                                      value={candidateProfileData.bankDetails?.accountHolderName || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          bankDetails: { ...candidateProfileData.bankDetails, accountHolderName: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">Account Number</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="Account Number"
                                      value={candidateProfileData.bankDetails?.accountNumber || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          bankDetails: { ...candidateProfileData.bankDetails, accountNumber: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">Account Type</Form.Label>
                                    <Form.Select
                                      size="sm"
                                      value={candidateProfileData.bankDetails?.accountType || "SAVINGS"}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          bankDetails: { ...candidateProfileData.bankDetails, accountType: e.target.value },
                                        });
                                      }}
                                    >
                                      <option value="SAVINGS">Savings Account</option>
                                      <option value="CURRENT">Current Account</option>
                                      <option value="SALARY">Salary Account</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">IFSC Code</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="e.g. HDFC0001234"
                                      value={candidateProfileData.bankDetails?.ifsc || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          bankDetails: { ...candidateProfileData.bankDetails, ifsc: e.target.value.toUpperCase() },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={4} sm={6}>
                                  <Form.Group>
                                    <Form.Label className="extra-small fw-bold">Branch Name</Form.Label>
                                    <Form.Control
                                      size="sm"
                                      placeholder="Branch Location"
                                      value={candidateProfileData.bankDetails?.branchName || ""}
                                      onChange={(e) => {
                                        setCandidateProfileData({
                                          ...candidateProfileData,
                                          bankDetails: { ...candidateProfileData.bankDetails, branchName: e.target.value },
                                        });
                                      }}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>

                              <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2">
                                <span className="extra-small text-muted fw-semibold">Passbook / Cancelled Cheque:</span>
                                <div className="d-flex align-items-center gap-2">
                                  {getBankPassbookDoc()?.url && (
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="py-0 px-2 extra-small rounded-pill"
                                      onClick={() => handleOpenDocPreview(getBankPassbookDoc().url, getBankPassbookDoc().title, "bank_doc")}
                                    >
                                      <FaEye className="me-1" /> View Document
                                    </Button>
                                  )}
                                  <label className="btn btn-outline-secondary btn-sm rounded-pill mb-0 py-0 px-2 extra-small" style={{ cursor: "pointer" }}>
                                    <FaFileUpload className="me-1" /> {getBankPassbookDoc()?.url ? "Re-upload" : "Upload Passbook / Cheque"}
                                    <input
                                      type="file"
                                      hidden
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      onChange={handleUploadBankDoc}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Row className="g-3">
                            {/* ── Left Column: Bank Account Details ── */}
                            <Col lg={6}>
                              <div className="h-100 p-3 bg-white rounded-3 border d-flex flex-column">
                                <div className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center justify-content-between pb-2 border-bottom">
                                  <span className="d-flex align-items-center gap-1.5">
                                    <FaUniversity className="text-success" /> Bank Account Details
                                  </span>
                                  <div className="d-flex align-items-center gap-1.5">
                                    {getBankPassbookDoc()?.url && (
                                      <Button
                                        variant="light"
                                        size="sm"
                                        className="btn-icon text-primary bg-primary-subtle border border-primary-subtle rounded-pill py-0.5 px-2 extra-small fw-bold d-inline-flex align-items-center gap-1 shadow-xs"
                                        title="View Passbook / Cheque"
                                        onClick={() => handleOpenDocPreview(getBankPassbookDoc().url, getBankPassbookDoc().title, "bank_doc")}
                                      >
                                        <FaEye size={12} /> View
                                      </Button>
                                    )}
                                    <label
                                      className={`btn btn-sm rounded-pill mb-0 py-0.5 px-2 extra-small fw-semibold ${getBankPassbookDoc()?.url ? "btn-outline-secondary" : "btn-outline-success"}`}
                                      style={{ cursor: uploadingBankDoc ? "not-allowed" : "pointer" }}
                                    >
                                      {uploadingBankDoc ? (
                                        <>
                                          <Spinner animation="border" size="sm" className="me-1" style={{ width: 10, height: 10 }} /> Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <FaFileUpload className="me-1" /> {getBankPassbookDoc()?.url ? "Re-upload" : "Upload Doc"}
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        hidden
                                        disabled={uploadingBankDoc}
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={handleUploadBankDoc}
                                      />
                                    </label>
                                  </div>
                                </div>
                                <Table borderless size="sm" className="mb-0 align-middle">
                                  <tbody>
                                    <tr>
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold" style={{ width: "38%" }}>Bank Name</td>
                                      <td className="fw-bold text-dark small py-1.5">{candidateProfileData.bankDetails?.bankName || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">Account Holder</td>
                                      <td className="fw-semibold text-dark small py-1.5">{candidateProfileData.bankDetails?.accountHolderName || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">Account Number</td>
                                      <td className="fw-bold text-dark small py-1.5 font-monospace">{candidateProfileData.bankDetails?.accountNumber || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">Account Type</td>
                                      <td className="py-1.5">
                                        <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary-subtle px-2 py-0.5 fw-semibold">
                                          {candidateProfileData.bankDetails?.accountType || "SAVINGS"}
                                        </Badge>
                                      </td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">IFSC Code</td>
                                      <td className="fw-bold text-dark small py-1.5 font-monospace">{candidateProfileData.bankDetails?.ifsc || candidateProfileData.bankDetails?.ifscCode || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">Branch Name</td>
                                      <td className="fw-semibold text-dark small py-1.5">{candidateProfileData.bankDetails?.branchName || "—"}</td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            </Col>

                            {/* ── Right Column: Statutory & Compliance Details ── */}
                            <Col lg={6}>
                              <div className="h-100 p-3 bg-white rounded-3 border d-flex flex-column">
                                <div className="extra-small text-uppercase fw-bold text-muted mb-2 d-flex align-items-center gap-1.5 pb-2 border-bottom">
                                  <FaFileContract className="text-warning" /> Statutory & Compliance Details
                                </div>
                                <Table borderless size="sm" className="mb-0 align-middle">
                                  <tbody>
                                    <tr>
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold" style={{ width: "38%" }}>PAN Number</td>
                                      <td className="fw-bold text-dark small py-1.5 font-monospace">{candidateProfileData.statutoryDetails?.panNo || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">Aadhaar Number</td>
                                      <td className="fw-bold text-dark small py-1.5 font-monospace">{candidateProfileData.statutoryDetails?.aadhaarNo || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">UAN Number</td>
                                      <td className="fw-bold text-dark small py-1.5 font-monospace">{candidateProfileData.statutoryDetails?.uanNo || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">PF Number</td>
                                      <td className="fw-semibold text-dark small py-1.5 font-monospace">{candidateProfileData.statutoryDetails?.pfNo || "—"}</td>
                                    </tr>
                                    <tr className="border-top border-light-subtle">
                                      <td className="text-muted extra-small py-1.5 text-uppercase fw-semibold">ESI Number</td>
                                      <td className="fw-semibold text-dark small py-1.5 font-monospace">{candidateProfileData.statutoryDetails?.esiNo || "—"}</td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            </Col>
                          </Row>
                        )}
                      </Card>

                      {/* Section 6: Family / Emergency Contact */}
                      <Card className="p-3 bg-light border-0 rounded-3">
                        <span className="fw-bold small text-dark d-flex align-items-center gap-1 mb-2">
                          <FaUsers className="text-secondary" /> Emergency & Family Contact
                        </span>
                        {isEditingCandidateProfile ? (
                          <Row className="g-2">
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold">Contact Name</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="Full Name"
                                  value={candidateProfileData.emergencyContact?.name || ""}
                                  onChange={(e) => {
                                    setCandidateProfileData({
                                      ...candidateProfileData,
                                      emergencyContact: { ...candidateProfileData.emergencyContact, name: e.target.value },
                                    });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold">Relationship</Form.Label>
                                <Form.Select
                                  size="sm"
                                  value={candidateProfileData.emergencyContact?.relationship || "Father"}
                                  onChange={(e) => {
                                    setCandidateProfileData({
                                      ...candidateProfileData,
                                      emergencyContact: { ...candidateProfileData.emergencyContact, relationship: e.target.value },
                                    });
                                  }}
                                >
                                  <option value="Father">Father</option>
                                  <option value="Mother">Mother</option>
                                  <option value="Spouse">Spouse</option>
                                  <option value="Brother">Brother</option>
                                  <option value="Sister">Sister</option>
                                  <option value="Guardian">Guardian</option>
                                  <option value="Friend">Friend</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-bold">Mobile Phone</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="Mobile Phone"
                                  value={candidateProfileData.emergencyContact?.phone || ""}
                                  onChange={(e) => {
                                    setCandidateProfileData({
                                      ...candidateProfileData,
                                      emergencyContact: { ...candidateProfileData.emergencyContact, phone: e.target.value },
                                    });
                                  }}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        ) : (
                          <Row className="g-2 text-muted extra-small">
                            <Col md={4}>Contact Name: <strong className="text-dark">{candidateProfileData.emergencyContact?.name || "—"}</strong></Col>
                            <Col md={4}>Relationship: <strong className="text-dark">{candidateProfileData.emergencyContact?.relationship || "—"}</strong></Col>
                            <Col md={4}>Phone: <strong className="text-dark">{candidateProfileData.emergencyContact?.phone || "—"}</strong></Col>
                          </Row>
                        )}
                      </Card>
                    </div>
                  )}
                </Card>
              )}

              {/* ── TAB CONTENT 1: VALIDATION ENGINE ── */}
              {detailActiveTab === "validation" && (
                <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark mb-0">Backend Validation Diagnostic Scanner</h6>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="rounded-pill px-3 extra-small fw-semibold"
                      onClick={() => handleRunValidation(true)}
                      disabled={validating}
                    >
                      <FaSyncAlt className={validating ? "fa-spin me-1" : "me-1"} /> Scan Now
                    </Button>
                  </div>

                  {validationReport ? (
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <span className="fw-semibold small">Overall Readiness Status:</span>
                        {validationReport.valid ? (
                          <Badge bg="success" className="px-3 py-2 fs-6 rounded-pill">
                            <FaCheckCircle className="me-1" /> VALIDATION PASSED — Ready for Completion
                          </Badge>
                        ) : (
                          <Badge bg="danger" className="px-3 py-2 fs-6 rounded-pill">
                            <FaTimesCircle className="me-1" /> VALIDATION FAILED ({toArray(validationReport.missingRequirements).length} Pending Requirements)
                          </Badge>
                        )}
                      </div>

                      {/* 9 Compliance Domains Grid */}
                      <h6 className="extra-small text-uppercase text-muted fw-bold mb-2">9-Domain Compliance Breakdown</h6>
                      <Row className="g-2 mb-3">
                        {[
                          { key: "employeeInformation", label: "Employee Profile Info", pass: validationReport.sections?.employeeInformation },
                          { key: "employment", label: "Employment Parameters", pass: validationReport.sections?.employment },
                          { key: "documents", label: "Mandatory Documents", pass: validationReport.sections?.documents },
                          { key: "agreements", label: "Agreements & NDA", pass: validationReport.sections?.agreements },
                          { key: "payroll", label: "Bank & Statutory Readiness", pass: validationReport.sections?.payroll },
                          { key: "tasks", label: "Mandatory Tasks", pass: validationReport.sections?.tasks },
                          { key: "assets", label: "IT Hardware Allocation", pass: validationReport.sections?.assets },
                          { key: "systemAccess", label: "System & Tool Access", pass: validationReport.sections?.systemAccess },
                          { key: "orientation", label: "Mandatory Orientation", pass: validationReport.sections?.orientation },
                        ].map((dom) => (
                          <Col md={4} key={dom.key}>
                            <div className={`p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between small ${dom.pass ? "bg-light text-success border-success" : "bg-light text-danger border-danger"}`}>
                              <span className="fw-semibold extra-small">{dom.label}</span>
                              {dom.pass ? <FaCheckCircle /> : <FaTimesCircle />}
                            </div>
                          </Col>
                        ))}
                      </Row>

                      {/* Missing Requirements List */}
                      {toArray(validationReport.missingRequirements).length > 0 && (
                        <Alert variant="warning" className="small rounded-3 mb-0">
                          <h6 className="fw-bold small mb-2"><FaExclamationTriangle className="me-1" /> Missing Requirements to Fulfill:</h6>
                          <ul className="mb-0 ps-3">
                            {toArray(validationReport.missingRequirements).map((req, idx) => (
                              <li key={idx} className="mb-1">{req}</li>
                            ))}
                          </ul>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted small text-center py-4">
                      Click "Run Validation Engine" above to trigger a fresh compliance check.
                    </div>
                  )}
                </Card>
              )}

              {/* ── TAB CONTENT 2: DOCUMENTS ── */}
              {detailActiveTab === "documents" && (
                <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Candidate Uploaded Documents</h6>
                      <span className="extra-small text-muted">All verified and pending verification document attachments.</span>
                    </div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill px-3 extra-small fw-semibold"
                      onClick={() => setShowDocUploadModal(true)}
                    >
                      <FaPlus className="me-1" /> Upload Document
                    </Button>
                  </div>

                  {detailDocs.length === 0 ? (
                    <div className="text-muted small text-center py-5">
                      <FaFileAlt className="text-muted mb-2" style={{ fontSize: "2.5rem" }} />
                      <div>No documents uploaded yet for this candidate.</div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="rounded-pill px-3 extra-small mt-3"
                        onClick={() => setShowDocUploadModal(true)}
                      >
                        <FaPlus className="me-1" /> Upload Document Now
                      </Button>
                    </div>
                  ) : (
                    <Table hover size="sm" align="middle" className="mb-0">
                      <thead className="table-light extra-small text-uppercase text-muted">
                        <tr>
                          <th>Document</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Uploaded</th>
                          <th>View / Preview</th>
                          <th className="text-end">Verification Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailDocs.map((doc) => (
                          <tr key={doc._id || Math.random()}>
                            <td className="fw-semibold">
                              <div className="d-flex align-items-center gap-2">
                                <FaFileAlt className="text-primary" />
                                <span>{doc.originalFileName || doc.fileName || doc.title || "Document"}</span>
                              </div>
                            </td>
                            <td><Badge bg="light" text="dark" className="border">{doc.documentType || "GENERAL"}</Badge></td>
                            <td>
                              {doc.verificationStatus === "VERIFIED" ? (
                                <Badge bg="success"><FaCheckCircle className="me-1" />Verified</Badge>
                              ) : doc.verificationStatus === "REJECTED" ? (
                                <Badge bg="danger"><FaTimesCircle className="me-1" />Rejected</Badge>
                              ) : (
                                <Badge bg="warning" text="dark"><FaClock className="me-1" />Pending</Badge>
                              )}
                            </td>
                            <td className="extra-small text-muted">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}</td>
                            <td>
                              {doc.fileUrl ? (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="py-0 px-2 extra-small rounded-pill"
                                  onClick={() => handleOpenDocPreview(doc.fileUrl, doc.originalFileName || doc.fileName || doc.title || "Candidate Document", doc.documentType)}
                                >
                                  <FaEye className="me-1" /> View Document
                                </Button>
                              ) : (
                                <span className="text-muted extra-small">No file URL</span>
                              )}
                            </td>
                            <td className="text-end">
                              {doc.verificationStatus !== "VERIFIED" && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  className="py-0 px-2 extra-small me-1"
                                  onClick={() => handleVerifyDoc(doc._id)}
                                >
                                  <FaCheck /> Verify
                                </Button>
                              )}
                              {doc.verificationStatus !== "REJECTED" && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="py-0 px-2 extra-small"
                                  onClick={() => setRejectModal({ show: true, docId: doc._id, reason: "" })}
                                >
                                  <FaTimes /> Reject
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card>
              )}

              {/* ── TAB CONTENT 3: TASKS ── */}
              {detailActiveTab === "tasks" && (
                <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Onboarding Checklist Tasks</h6>

                  <Form onSubmit={handleAddTask} className="p-2 bg-light rounded-3 mb-3">
                    <Row className="g-2 align-items-center">
                      <Col md={4}>
                        <Form.Control
                          size="sm"
                          placeholder="Task Name *"
                          value={newTaskForm.taskName}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, taskName: e.target.value })}
                          required
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          size="sm"
                          value={newTaskForm.responsibleGroup}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, responsibleGroup: e.target.value })}
                        >
                          <option value="HR">Group: HR</option>
                          <option value="IT">Group: IT</option>
                          <option value="MANAGER">Group: Manager</option>
                          <option value="EMPLOYEE">Group: Employee</option>
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          size="sm"
                          value={newTaskForm.priority}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                        >
                          <option value="LOW">Priority: LOW</option>
                          <option value="MEDIUM">Priority: MEDIUM</option>
                          <option value="HIGH">Priority: HIGH</option>
                          <option value="URGENT">Priority: URGENT</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Button variant="success" size="sm" type="submit" className="w-100 fw-semibold">
                          <FaPlus /> Add
                        </Button>
                      </Col>
                    </Row>
                  </Form>

                  <Table hover size="sm" align="middle" className="mb-0">
                    <thead className="table-light extra-small text-uppercase text-muted">
                      <tr>
                        <th>Done</th>
                        <th>Task Name</th>
                        <th>Group</th>
                        <th>Priority</th>
                        <th>Mandatory</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailTasks.map((t) => (
                        <tr key={t._id || Math.random()}>
                          <td style={{ width: 40 }}>
                            <Form.Check
                              type="checkbox"
                              checked={t.status === "COMPLETED" || t.isCompleted}
                              onChange={() => handleToggleTaskStatus(t._id, t.status)}
                            />
                          </td>
                          <td className="fw-semibold">{t.taskName}</td>
                          <td><Badge bg="light" text="dark" className="border">{t.responsibleGroup || "HR"}</Badge></td>
                          <td>
                            <Badge bg={t.priority === "URGENT" || t.priority === "HIGH" ? "danger" : "secondary"}>
                              {t.priority || "MEDIUM"}
                            </Badge>
                          </td>
                          <td>{t.isMandatory ? <Badge bg="dark">Required</Badge> : <span className="text-muted extra-small">Optional</span>}</td>
                          <td>
                            <Badge bg={t.status === "COMPLETED" || t.isCompleted ? "success" : "warning"} text={t.status === "COMPLETED" || t.isCompleted ? "white" : "dark"}>
                              {t.status || "PENDING"}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button variant="outline-danger" size="sm" className="py-0 px-2 extra-small" onClick={() => handleDeleteTask(t._id)}>
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              )}

              {/* ── TAB CONTENT 4: ASSETS & HARDWARE MANAGEMENT ── */}
              {detailActiveTab === "assets" && (
                <div className="d-flex flex-column gap-3">
                  {/* 1. Header & Controls */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 p-3 bg-white border rounded-4 shadow-sm">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, rgba(45,197,138,0.2) 0%, rgba(32,166,115,0.3) 100%)",
                          border: "1px solid rgba(45, 197, 138, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MdDevices style={{ fontSize: 24, color: "#2DC58A" }} />
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark">Asset Management & Hardware Allocation</h6>
                        <small className="text-muted">
                          Manage company asset inventory, hardware allocations, and lifecycle returns for {candidateName}
                        </small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <Button
                        variant="light"
                        size="sm"
                        className="border d-flex align-items-center gap-1.5 shadow-xs rounded-pill px-3 py-1 extra-small fw-semibold"
                        onClick={loadAssetInventory}
                        disabled={assetLoading}
                        title="Refresh Inventory"
                      >
                        <FaRedo className={assetLoading ? "fa-spin" : ""} style={{ fontSize: 11 }} />
                        <span>Refresh</span>
                      </Button>

                      <Button
                        size="sm"
                        className="d-flex align-items-center gap-1.5 shadow-xs rounded-pill px-3 py-1 extra-small fw-bold"
                        style={{
                          backgroundColor: "#2DC58A",
                          borderColor: "#2DC58A",
                          color: "#ffffff",
                        }}
                        onClick={() => setShowCreateAssetModal(true)}
                      >
                        <FaPlus style={{ fontSize: 11 }} />
                        <span>+ Add Asset</span>
                      </Button>
                    </div>
                  </div>

                  {/* 2. KPI Stat Cards */}
                  <Row className="g-2">
                    <Col xs={6} md={3}>
                      <Card className="border shadow-xs rounded-3 p-2.5 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted extra-small fw-semibold text-uppercase">Total Assets</span>
                            <h4 className="mb-0 fw-bold mt-1 text-dark">{assetCounts.total}</h4>
                          </div>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: "rgba(59, 130, 246, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MdDevices style={{ fontSize: 20, color: "#3b82f6" }} />
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={6} md={3}>
                      <Card className="border shadow-xs rounded-3 p-2.5 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted extra-small fw-semibold text-uppercase">Available</span>
                            <h4 className="mb-0 fw-bold mt-1 text-success">{assetCounts.available}</h4>
                          </div>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: "rgba(16, 185, 129, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaCheckCircle style={{ fontSize: 18, color: "#10b981" }} />
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={6} md={3}>
                      <Card className="border shadow-xs rounded-3 p-2.5 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted extra-small fw-semibold text-uppercase">Assigned (Candidate)</span>
                            <h4 className="mb-0 fw-bold mt-1 text-primary">{assetCounts.candidateAssigned}</h4>
                          </div>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: "rgba(59, 130, 246, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaLaptop style={{ fontSize: 18, color: "#3b82f6" }} />
                          </div>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={6} md={3}>
                      <Card className="border shadow-xs rounded-3 p-2.5 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-muted extra-small fw-semibold text-uppercase">Damaged / Repair</span>
                            <h4 className="mb-0 fw-bold mt-1 text-danger">{assetCounts.damaged}</h4>
                          </div>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: "rgba(239, 68, 68, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaExclamationTriangle style={{ fontSize: 18, color: "#ef4444" }} />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* 3. Sub-Tab Pills & Filter Control Bar */}
                  <Card className="border shadow-xs rounded-3 p-3 bg-white">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 pb-2 mb-2 border-bottom">
                      <div className="d-flex gap-1.5 flex-wrap">
                        <Button
                          variant={assetSubTab === "all" ? "primary" : "outline-secondary"}
                          size="sm"
                          className="rounded-pill extra-small px-3 py-1 fw-semibold"
                          onClick={() => setAssetSubTab("all")}
                        >
                          All Inventory ({assetCounts.total})
                        </Button>
                        <Button
                          variant={assetSubTab === "assigned" ? "primary" : "outline-secondary"}
                          size="sm"
                          className="rounded-pill extra-small px-3 py-1 fw-semibold"
                          onClick={() => setAssetSubTab("assigned")}
                        >
                          Assigned to Candidate ({assetCounts.candidateAssigned})
                        </Button>
                        <Button
                          variant={assetSubTab === "available" ? "success" : "outline-success"}
                          size="sm"
                          className="rounded-pill extra-small px-3 py-1 fw-semibold"
                          onClick={() => setAssetSubTab("available")}
                        >
                          Available for Allocation ({assetCounts.available})
                        </Button>
                      </div>

                      <div className="extra-small text-muted fw-semibold">
                        Showing {filteredAssetsList.length} of {assetInventory.length} assets
                      </div>
                    </div>

                    <Row className="g-2 align-items-center">
                      <Col xs={12} md={5}>
                        <InputGroup size="sm">
                          <InputGroup.Text className="bg-light border-end-0 text-muted">
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search by code, name, serial, assignee..."
                            value={assetSearchQuery}
                            onChange={(e) => setAssetSearchQuery(e.target.value)}
                            className="border-start-0 shadow-none bg-light"
                          />
                        </InputGroup>
                      </Col>

                      <Col xs={6} md={3}>
                        <Form.Select
                          size="sm"
                          value={assetStatusFilter}
                          onChange={(e) => setAssetStatusFilter(e.target.value)}
                          className="shadow-none border"
                        >
                          <option value="">All Statuses</option>
                          <option value="AVAILABLE">Available</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="UNDER_REPAIR">Under Repair</option>
                          <option value="RETIRED">Retired</option>
                        </Form.Select>
                      </Col>

                      <Col xs={6} md={3}>
                        <Form.Select
                          size="sm"
                          value={assetCategoryFilter}
                          onChange={(e) => setAssetCategoryFilter(e.target.value)}
                          className="shadow-none border"
                        >
                          <option value="">All Categories</option>
                          <option value="LAPTOP">Laptop</option>
                          <option value="DESKTOP">Desktop</option>
                          <option value="MOBILE">Mobile</option>
                          <option value="MONITOR">Monitor</option>
                          <option value="PERIPHERAL">Peripheral</option>
                          <option value="VEHICLE">Vehicle</option>
                          <option value="OTHER">Other</option>
                        </Form.Select>
                      </Col>

                      <Col xs={12} md={1} className="text-md-end">
                        {(assetSearchQuery || assetStatusFilter || assetCategoryFilter) && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100 py-1 extra-small rounded-2"
                            onClick={() => {
                              setAssetSearchQuery("");
                              setAssetStatusFilter("");
                              setAssetCategoryFilter("");
                            }}
                            title="Clear Filters"
                          >
                            Clear
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </Card>

                  {/* 4. Main Asset Inventory Table */}
                  <Card className="border shadow-xs rounded-3 overflow-hidden bg-white">
                    {assetLoading ? (
                      <div className="p-5 text-center text-muted">
                        <Spinner animation="border" variant="success" size="sm" className="me-2" />
                        <span className="small">Loading asset catalog...</span>
                      </div>
                    ) : filteredAssetsList.length === 0 ? (
                      <div className="p-5 text-center text-muted">
                        <div
                          className="mx-auto mb-3"
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: "50%",
                            background: "rgba(100, 116, 139, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MdDevices style={{ fontSize: 24, color: "#64748b" }} />
                        </div>
                        <h6 className="fw-bold mb-1 text-dark">No Matching Assets Found</h6>
                        <p className="extra-small mb-3">Try adjusting your search criteria or register a new asset.</p>
                        <Button
                          size="sm"
                          className="rounded-pill extra-small px-3 fw-bold"
                          style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A", color: "#fff" }}
                          onClick={() => setShowCreateAssetModal(true)}
                        >
                          <FaPlus className="me-1" /> Add New Asset
                        </Button>
                      </div>
                    ) : (
                      <Table hover responsive size="sm" align="middle" className="mb-0">
                        <thead className="table-light extra-small text-uppercase text-muted border-bottom">
                          <tr>
                            <th>Asset Code</th>
                            <th>Asset Name</th>
                            <th>Category</th>
                            <th>Serial Number</th>
                            <th>Model / Manufacturer</th>
                            <th>Status</th>
                            <th>Current Assignee</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAssetsList.map((asset) => {
                            const candidateUserId = String(targetEmp._id || selectedOnboarding?.employeeId?._id || selectedOnboarding?.userId || selectedOnboarding?.employeeId || "");
                            const candCode = String(selectedOnboarding?.candidateCode || targetEmp.employeeCode || "").toLowerCase();
                            const assId = asset.currentAssignee ? String(asset.currentAssignee._id || asset.currentAssignee.id || asset.currentAssignee) : "";
                            const assCode = asset.currentAssignee ? String(asset.currentAssignee.employeeCode || "").toLowerCase() : "";

                            const isAssignedToCandidate =
                              Boolean(asset.currentAssignee) &&
                              ((candidateUserId && assId === candidateUserId) || (candCode && assCode === candCode));

                            const assigneeName = asset.currentAssignee
                              ? `${asset.currentAssignee.firstName || ""} ${asset.currentAssignee.lastName || ""}`.trim() || asset.currentAssignee.employeeCode || "Assigned"
                              : "Unassigned";

                            return (
                              <tr key={asset._id || Math.random()}>
                                <td>
                                  <Badge bg="light" text="dark" className="border font-monospace py-1 px-2">
                                    {asset.assetCode || asset.serialNumber || asset._id?.slice(-8)}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="fw-bold text-dark small">{asset.name || "Hardware Asset"}</div>
                                </td>
                                <td>
                                  <span className="extra-small fw-semibold d-inline-flex align-items-center">
                                    {getAssetCategoryIcon(asset.category)} {asset.category || "HARDWARE"}
                                  </span>
                                </td>
                                <td>
                                  <code className="text-muted extra-small">{asset.serialNumber || "—"}</code>
                                </td>
                                <td>
                                  <span className="extra-small text-muted">
                                    {[asset.modelName, asset.manufacturer].filter(Boolean).join(" / ") || "—"}
                                  </span>
                                </td>
                                <td>{getAssetStatusBadge(asset.status)}</td>
                                <td>
                                  {isAssignedToCandidate ? (
                                    <Badge bg="primary" className="bg-opacity-10 text-primary border border-primary-subtle px-2 py-1 extra-small fw-bold">
                                      <FaUser className="me-1" /> {candidateName} (This Candidate)
                                    </Badge>
                                  ) : asset.currentAssignee ? (
                                    <span className="extra-small text-dark fw-medium">
                                      <FaUser className="me-1 text-muted" /> {assigneeName}
                                    </span>
                                  ) : (
                                    <span className="extra-small text-muted">Unassigned</span>
                                  )}
                                </td>
                                <td className="text-end">
                                  {isAssignedToCandidate ? (
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="rounded-pill py-0.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1"
                                      onClick={() => handleReturnCandidateAsset(asset._id, asset.name)}
                                      title="Return / Unassign Asset"
                                    >
                                      <FaUndoAlt size={10} /> Return
                                    </Button>
                                  ) : asset.status === "AVAILABLE" ? (
                                    <Button
                                      size="sm"
                                      className="rounded-pill py-0.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1 text-white"
                                      style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
                                      onClick={() => {
                                        setSelectedAssetToAssign(asset);
                                        setShowAssignAssetModal(true);
                                      }}
                                      title="Assign this asset to candidate"
                                    >
                                      <FaPlus size={10} /> Assign
                                    </Button>
                                  ) : (
                                    <Badge bg="light" text="muted" className="border px-2 py-1 extra-small">
                                      In Use
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                  </Card>
                </div>
              )}

              {/* ── TAB CONTENT 5: SYSTEM ACCESS ── */}
              {detailActiveTab === "access" && (
                <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Tool & System Access Provisioning</h6>

                  <Form onSubmit={handleAddAccess} className="p-2 bg-light rounded-3 mb-3">
                    <Row className="g-2 align-items-center">
                      <Col md={5}>
                        <Form.Control
                          size="sm"
                          placeholder="System (e.g. Corporate Email, Slack, GitHub) *"
                          value={newAccessForm.systemName}
                          onChange={(e) => setNewAccessForm({ ...newAccessForm, systemName: e.target.value })}
                          required
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          size="sm"
                          placeholder="Access Type (e.g. Member, Admin)"
                          value={newAccessForm.accessType}
                          onChange={(e) => setNewAccessForm({ ...newAccessForm, accessType: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Button variant="success" size="sm" type="submit" className="w-100 fw-semibold">
                          <FaPlus /> Request Access
                        </Button>
                      </Col>
                    </Row>
                  </Form>

                  <Table hover size="sm" align="middle" className="mb-0">
                    <thead className="table-light extra-small text-uppercase text-muted">
                      <tr>
                        <th>System Name</th>
                        <th>Access Type</th>
                        <th>Mandatory</th>
                        <th>Status</th>
                        <th className="text-end">Update Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailAccess.map((acc) => (
                        <tr key={acc._id || Math.random()}>
                          <td className="fw-semibold">{acc.systemName}</td>
                          <td><Badge bg="light" text="dark" className="border">{acc.accessType || "Standard"}</Badge></td>
                          <td>{acc.isMandatory ? <Badge bg="dark">Required</Badge> : <span className="text-muted extra-small">Optional</span>}</td>
                          <td>
                            <Badge bg={acc.status === "ACTIVE" || acc.isProvisioned ? "success" : "warning"} text={acc.status === "ACTIVE" || acc.isProvisioned ? "white" : "dark"}>
                              {acc.status || (acc.isProvisioned ? "ACTIVE" : "REQUESTED")}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Form.Select
                              size="sm"
                              style={{ width: 140, display: "inline-block" }}
                              value={acc.status || (acc.isProvisioned ? "ACTIVE" : "REQUESTED")}
                              onChange={(e) => handleUpdateAccessStatus(acc._id, e.target.value)}
                            >
                              <option value="REQUESTED">REQUESTED</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="PROVISIONING">PROVISIONING</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="REJECTED">REJECTED</option>
                              <option value="REVOKED">REVOKED</option>
                            </Form.Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              )}

              {/* ── TAB CONTENT 6: AGREEMENTS ── */}
              {detailActiveTab === "agreements" && (
                <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Agreements & Company Policies</h6>

                  <Form onSubmit={handleAddAgreement} className="p-2 bg-light rounded-3 mb-3">
                    <Row className="g-2 align-items-center">
                      <Col md={4}>
                        <Form.Select
                          size="sm"
                          value={newAgreementForm.agreementType}
                          onChange={(e) => setNewAgreementForm({ ...newAgreementForm, agreementType: e.target.value })}
                        >
                          <option value="OFFER_LETTER">Offer Letter</option>
                          <option value="APPOINTMENT_LETTER">Appointment Letter</option>
                          <option value="EMPLOYMENT_AGREEMENT">Employment Agreement</option>
                          <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                          <option value="COMPANY_POLICIES">Company Policies</option>
                        </Form.Select>
                      </Col>
                      <Col md={5}>
                        <Form.Control
                          size="sm"
                          placeholder="Agreement Title *"
                          value={newAgreementForm.title}
                          onChange={(e) => setNewAgreementForm({ ...newAgreementForm, title: e.target.value })}
                          required
                        />
                      </Col>
                      <Col md={3}>
                        <Button variant="success" size="sm" type="submit" className="w-100 fw-semibold">
                          <FaPlus /> Add Agreement
                        </Button>
                      </Col>
                    </Row>
                  </Form>

                  <Table hover size="sm" align="middle" className="mb-0">
                    <thead className="table-light extra-small text-uppercase text-muted">
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Status</th>
                        <th className="text-end">Acknowledge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailAgreements.map((agr) => (
                        <tr key={agr._id || Math.random()}>
                          <td className="fw-semibold">{agr.title}</td>
                          <td><Badge bg="light" text="dark" className="border">{agr.agreementType}</Badge></td>
                          <td>{agr.isRequired ? <Badge bg="dark">Required</Badge> : <span className="text-muted extra-small">Optional</span>}</td>
                          <td>
                            <Badge bg={agr.status === "ACCEPTED" || agr.isAcknowledged ? "success" : "warning"} text={agr.status === "ACCEPTED" || agr.isAcknowledged ? "white" : "dark"}>
                              {agr.status || (agr.isAcknowledged ? "ACCEPTED" : "PENDING")}
                            </Badge>
                          </td>
                          <td className="text-end">
                            {agr.status !== "ACCEPTED" ? (
                              <Button variant="outline-success" size="sm" className="py-0 px-2 extra-small" onClick={() => handleAcknowledgeAgreement(agr._id, "ACCEPTED")}>
                                <FaCheck /> Mark Accepted
                              </Button>
                            ) : (
                              <span className="text-success extra-small fw-semibold"><FaCheckCircle /> Accepted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              )}

              {/* ── TAB CONTENT 7: TRAINING ── */}
              {detailActiveTab === "training" && (
                <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Induction & Mandatory Trainings</h6>

                  <Form onSubmit={handleAddTraining} className="p-2 bg-light rounded-3 mb-3">
                    <Row className="g-2 align-items-center">
                      <Col md={5}>
                        <Form.Control
                          size="sm"
                          placeholder="Training Name (e.g. IT Security, HR Intro) *"
                          value={newTrainingForm.trainingName}
                          onChange={(e) => setNewTrainingForm({ ...newTrainingForm, trainingName: e.target.value })}
                          required
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          size="sm"
                          placeholder="Trainer / Lead"
                          value={newTrainingForm.trainer}
                          onChange={(e) => setNewTrainingForm({ ...newTrainingForm, trainer: e.target.value })}
                        />
                      </Col>
                      <Col md={3}>
                        <Button variant="success" size="sm" type="submit" className="w-100 fw-semibold">
                          <FaPlus /> Schedule
                        </Button>
                      </Col>
                    </Row>
                  </Form>

                  <Table hover size="sm" align="middle" className="mb-0">
                    <thead className="table-light extra-small text-uppercase text-muted">
                      <tr>
                        <th>Training Name</th>
                        <th>Trainer</th>
                        <th>Mandatory</th>
                        <th>Status</th>
                        <th className="text-end">Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailTraining.map((trn) => (
                        <tr key={trn._id || Math.random()}>
                          <td className="fw-semibold">{trn.trainingName}</td>
                          <td className="extra-small text-muted">{trn.trainer || "HR Team"}</td>
                          <td>{trn.mandatory ? <Badge bg="dark">Required</Badge> : <span className="text-muted extra-small">Optional</span>}</td>
                          <td>
                            <Badge bg={trn.status === "COMPLETED" ? "success" : "warning"} text={trn.status === "COMPLETED" ? "white" : "dark"}>
                              {trn.status || "NOT_STARTED"}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Form.Select
                              size="sm"
                              style={{ width: 140, display: "inline-block" }}
                              value={trn.status || "NOT_STARTED"}
                              onChange={(e) => handleUpdateTrainingStatus(trn._id, e.target.value)}
                            >
                              <option value="NOT_STARTED">NOT_STARTED</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="OVERDUE">OVERDUE</option>
                            </Form.Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-white border-top py-2 px-4">
          <Button variant="secondary" size="sm" className="rounded-pill px-4" onClick={() => setShowDetailModal(false)}>
            Close Workspace
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================
          MODAL: REJECT DOCUMENT WITH REASON
          ======================================================== */}
      <Modal show={rejectModal.show} onHide={() => setRejectModal({ show: false, docId: null, reason: "" })} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-danger"><FaTimesCircle className="me-2" /> Reject Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="small fw-bold">Rejection Reason *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="e.g. Blurred photocopy, mismatch in DOB/Name"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setRejectModal({ show: false, docId: null, reason: "" })}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleRejectDoc} disabled={!rejectModal.reason.trim()}>
            Confirm Rejection
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================
          MODAL: VALIDATION REPORT & COMPLIANCE SCAN POPUP
          ======================================================== */}
      <Modal
        show={showValidationModal}
        onHide={() => setShowValidationModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-bottom py-3 px-4 bg-light">
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2 mb-0">
            <FaShieldAlt className={validationReport?.valid ? "text-success" : "text-danger"} />
            Onboarding Validation & Compliance Engine
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {validationReport ? (
            <div>
              {/* Overall Status Banner */}
              <div
                className={`p-3 rounded-4 mb-3 border d-flex align-items-center justify-content-between ${validationReport.valid
                    ? "bg-success bg-opacity-10 border-success text-success"
                    : "bg-danger bg-opacity-10 border-danger text-danger"
                  }`}
              >
                <div className="d-flex align-items-center gap-2">
                  {validationReport.valid ? (
                    <FaCheckCircle size={24} className="text-success flex-shrink-0" />
                  ) : (
                    <FaTimesCircle size={24} className="text-danger flex-shrink-0" />
                  )}
                  <div>
                    <h6 className="fw-bold mb-0">
                      {validationReport.valid
                        ? "All Compliance Checks Passed"
                        : "Validation Failed — Requirements Pending"}
                    </h6>
                    <span className="small text-muted">
                      {validationReport.valid
                        ? "Candidate has met all criteria and is ready for onboarding completion."
                        : `Please resolve the ${toArray(validationReport.missingRequirements).length} pending requirement(s) before completing onboarding.`}
                    </span>
                  </div>
                </div>
                <Badge
                  bg={validationReport.valid ? "success" : "danger"}
                  className="px-3 py-2 rounded-pill fs-7"
                >
                  {validationReport.valid ? "PASSED" : "ACTION REQUIRED"}
                </Badge>
              </div>

              {/* Missing Requirements List */}
              {toArray(validationReport.missingRequirements).length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold small text-dark mb-2 d-flex align-items-center gap-1.5">
                    <FaExclamationTriangle className="text-warning" /> Pending Items to Fulfill:
                  </h6>
                  <div className="bg-light rounded-3 p-3 border">
                    <ul className="mb-0 ps-3">
                      {toArray(validationReport.missingRequirements).map((req, idx) => (
                        <li key={idx} className="small text-dark mb-1 fw-medium">
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 9 Compliance Domains Grid */}
              <h6 className="extra-small text-uppercase text-muted fw-bold mb-2">9-Domain Compliance Breakdown</h6>
              <Row className="g-2">
                {[
                  { key: "employeeInformation", label: "Employee Profile Info", pass: validationReport.sections?.employeeInformation },
                  { key: "employment", label: "Employment Parameters", pass: validationReport.sections?.employment },
                  { key: "documents", label: "Mandatory Documents", pass: validationReport.sections?.documents },
                  { key: "agreements", label: "Agreements & NDA", pass: validationReport.sections?.agreements },
                  { key: "payroll", label: "Bank & Statutory Readiness", pass: validationReport.sections?.payroll },
                  { key: "tasks", label: "Mandatory Tasks", pass: validationReport.sections?.tasks },
                  { key: "assets", label: "IT Hardware Allocation", pass: validationReport.sections?.assets },
                  { key: "systemAccess", label: "System & Tool Access", pass: validationReport.sections?.systemAccess },
                  { key: "orientation", label: "Mandatory Orientation", pass: validationReport.sections?.orientation },
                ].map((dom) => (
                  <Col md={4} sm={6} xs={12} key={dom.key}>
                    <div
                      className={`p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between small ${dom.pass
                          ? "bg-success bg-opacity-10 text-success border-success border-opacity-25"
                          : "bg-danger bg-opacity-10 text-danger border-danger border-opacity-25"
                        }`}
                    >
                      <span className="fw-semibold extra-small text-dark">{dom.label}</span>
                      {dom.pass ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-danger" />}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <div className="text-center py-4 text-muted small">
              No validation report available. Run a scan to inspect compliance.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top py-2 px-4 bg-light d-flex justify-content-between">
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-pill px-3"
            onClick={() => setShowValidationModal(false)}
          >
            Close
          </Button>
          <Button
            variant="success"
            size="sm"
            className="rounded-pill px-4 shadow-sm"
            onClick={() => {
              setShowValidationModal(false);
              setDetailActiveTab("validation");
            }}
          >
            Open Validation Tab in Workspace
          </Button>
        </Modal.Footer>
      </Modal>

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

      {/* ========================================================
          MODAL: VIEW / PREVIEW DOCUMENT MODAL
          ======================================================== */}
      <Modal show={docPreview.show} onHide={handleCloseDocPreview} size="lg" centered>
        <Modal.Header closeButton className="border-0 bg-light pb-2">
          <div className="d-flex justify-content-between align-items-center w-100 me-2 flex-wrap gap-2">
            <Modal.Title className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-0">
              <FaFileAlt className="text-primary" /> {docPreview.title || "Document Preview"}
            </Modal.Title>
            {docPreview.url && (
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="py-1 px-3 extra-small rounded-pill fw-semibold shadow-xs d-inline-flex align-items-center gap-1.5"
                  onClick={() => {
                    if (docPreview.url && docPreview.url.startsWith("blob:")) {
                      window.open(docPreview.url, "_blank");
                    } else {
                      const targetUrl = docPreview.rawUrl || docPreview.url;
                      if (targetUrl.includes("cloudinary.com") || targetUrl.startsWith("http")) {
                        window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(targetUrl)}`, "_blank");
                      } else {
                        window.open(targetUrl, "_blank");
                      }
                    }
                  }}
                >
                  <FaExternalLinkAlt size={11} /> Open in New Tab
                </Button>
                <a
                  href={docPreview.rawUrl || docPreview.url}
                  download={docPreview.title || "document"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-secondary btn-sm py-1 px-2.5 extra-small rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                >
                  <FaDownload size={11} /> Download
                </a>
              </div>
            )}
          </div>
        </Modal.Header>
        <Modal.Body className="p-2 text-center bg-white position-relative" style={{ minHeight: "400px", maxHeight: "75vh", overflowY: "auto" }}>
          {docPreview.loading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center" style={{ zIndex: 10 }}>
              <div className="d-flex flex-column align-items-center gap-2">
                <Spinner animation="border" variant="primary" size="sm" />
                <span className="extra-small text-muted fw-semibold">Loading document preview...</span>
              </div>
            </div>
          )}
          {docPreview.url ? (
            (() => {
              const rawUrl = String(docPreview.url);
              const urlLower = rawUrl.toLowerCase();
              const titleLower = String(docPreview.title || "").toLowerCase();
              const fileNameLower = String(docPreview.file?.name || "").toLowerCase();

              const isImage =
                urlLower.includes(".png") ||
                urlLower.includes(".jpg") ||
                urlLower.includes(".jpeg") ||
                urlLower.includes(".webp") ||
                urlLower.includes(".svg") ||
                titleLower.endsWith(".png") ||
                titleLower.endsWith(".jpg") ||
                titleLower.endsWith(".jpeg") ||
                titleLower.endsWith(".webp") ||
                fileNameLower.endsWith(".png") ||
                fileNameLower.endsWith(".jpg") ||
                fileNameLower.endsWith(".jpeg") ||
                fileNameLower.endsWith(".webp") ||
                (docPreview.file && docPreview.file.type?.startsWith("image/"));

              if (isImage) {
                return (
                  <div className="d-flex justify-content-center align-items-center flex-column py-2">
                    <img
                      src={rawUrl}
                      alt={docPreview.title}
                      className="img-fluid rounded border shadow-sm"
                      style={{ maxHeight: "65vh", objectFit: "contain", maxWidth: "100%" }}
                    />
                  </div>
                );
              }

              // Determine iframe source: for external HTTP/HTTPS (like Cloudinary raw URLs), use Google Docs Viewer to avoid blank iframe blocking
              const isRemoteHttp = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
              const isCloudinary = rawUrl.includes("cloudinary.com");
              const cleanUrl = rawUrl.replace(/\/raw\/upload\/fl_inline\//g, "/raw/upload/");
              const iframeSrc = (isRemoteHttp || isCloudinary)
                ? `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true`
                : cleanUrl;

              return (
                <div className="d-flex flex-column w-100" style={{ height: "65vh" }}>
                  <iframe
                    src={iframeSrc}
                    title={docPreview.title}
                    width="100%"
                    height="100%"
                    className="border rounded w-100 h-100 flex-grow-1"
                  />
                  <div className="pt-2 text-center extra-small text-muted d-flex justify-content-center align-items-center gap-2">
                    <span>Having trouble viewing inside this window?</span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 extra-small fw-bold text-primary text-decoration-none"
                      onClick={() => {
                        const targetUrl = (docPreview.rawUrl || rawUrl).replace(/\/raw\/upload\/fl_inline\//g, "/raw/upload/");
                        if (targetUrl.includes("cloudinary.com") || targetUrl.startsWith("http")) {
                          window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(targetUrl)}`, "_blank");
                        } else {
                          window.open(targetUrl, "_blank");
                        }
                      }}
                    >
                      <FaExternalLinkAlt size={10} className="me-1" /> Click here to open in browser
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-5 text-muted extra-small">No preview available for this document.</div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light pt-2 d-flex justify-content-between">
          <div>
            {docPreview.url && (
              <Button
                variant="outline-primary"
                size="sm"
                className="rounded-pill extra-small px-3 d-inline-flex align-items-center gap-1.5"
                onClick={() => {
                  if (docPreview.url && docPreview.url.startsWith("blob:")) {
                    window.open(docPreview.url, "_blank");
                  } else {
                    const targetUrl = (docPreview.rawUrl || docPreview.url).replace(/\/raw\/upload\/fl_inline\//g, "/raw/upload/");
                    if (targetUrl.includes("cloudinary.com") || targetUrl.startsWith("http")) {
                      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(targetUrl)}`, "_blank");
                    } else {
                      window.open(targetUrl, "_blank");
                    }
                  }
                }}
              >
                <FaExternalLinkAlt size={11} /> Open in Browser
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" className="rounded-pill extra-small px-3" onClick={handleCloseDocPreview}>
            Close Preview
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================
          MODAL: UPLOAD CANDIDATE DOCUMENT ATTACHMENT
          ======================================================== */}
      <Modal show={showDocUploadModal} onHide={() => setShowDocUploadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-dark d-flex align-items-center gap-2">
            <FaFileUpload className="text-primary" /> Upload Candidate Document
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group className="mb-3">
            <Form.Label className="extra-small fw-bold">Document Type *</Form.Label>
            <Form.Select
              size="sm"
              value={uploadDocForm.documentType}
              onChange={(e) => setUploadDocForm({ ...uploadDocForm, documentType: e.target.value })}
            >
              <option value="OFFER_LETTER">Offer Letter</option>
              <option value="APPOINTMENT_LETTER">Appointment Letter</option>
              <option value="AADHAAR_CARD">Aadhaar Card Proof</option>
              <option value="PAN_CARD">PAN Card Proof</option>
              <option value="BANK_PASSBOOK">Bank Passbook / Cheque</option>
              <option value="DEGREE_CERTIFICATE">Degree Marksheet / Certificate</option>
              <option value="EXPERIENCE_LETTER">Experience Letter</option>
              <option value="PAYSLIP">Payslip / Salary Slip</option>
              <option value="RELIEVING_LETTER">Relieving Letter</option>
              <option value="RESUME">Resume / CV</option>
              <option value="OTHER">Other Verification Document</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="extra-small fw-bold">Select File (PDF, PNG, JPG) *</Form.Label>
            <Form.Control
              size="sm"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadDocForm({
                    ...uploadDocForm,
                    file,
                    fileName: file.name,
                  });
                }
              }}
            />
          </Form.Group>

          {uploadDocForm.file && (
            <div className="p-2 bg-light border rounded-3 d-flex align-items-center justify-content-between">
              <span className="extra-small fw-semibold text-dark text-truncate" style={{ maxWidth: 220 }}>
                {uploadDocForm.fileName}
              </span>
              <Button
                variant="outline-primary"
                size="sm"
                className="py-0 px-2 extra-small rounded-pill"
                onClick={() => handleOpenDocPreview(uploadDocForm.file, uploadDocForm.fileName)}
              >
                <FaEye className="me-1" /> Preview File
              </Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" className="rounded-pill extra-small px-3" onClick={() => setShowDocUploadModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="rounded-pill extra-small px-3 fw-bold"
            disabled={!uploadDocForm.file || uploadingDoc}
            onClick={handleUploadNewCandidateDoc}
          >
            {uploadingDoc ? <Spinner size="sm" animation="border" /> : <FaFileUpload className="me-1" />} Upload Document
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================
          MODAL: CREATE NEW ASSET IN INVENTORY
          ======================================================== */}
      <Modal show={showCreateAssetModal} onHide={() => setShowCreateAssetModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-dark d-flex align-items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(45,197,138,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdDevices style={{ fontSize: 18, color: "#2DC58A" }} />
            </div>
            <span>Register New Company Asset</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateNewAsset}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold">Asset Name *</Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. MacBook Pro M3, Dell Latitude 5420"
                    value={createAssetForm.name}
                    onChange={(e) => setCreateAssetForm({ ...createAssetForm, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold">Category *</Form.Label>
                  <Form.Select
                    size="sm"
                    value={createAssetForm.category}
                    onChange={(e) => setCreateAssetForm({ ...createAssetForm, category: e.target.value })}
                    required
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="DESKTOP">Desktop</option>
                    <option value="MOBILE">Mobile Phone</option>
                    <option value="MONITOR">External Monitor</option>
                    <option value="PERIPHERAL">Peripheral (Keyboard, Mouse, Headset)</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="OTHER">Other Hardware</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold">Serial Number *</Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. SN-89234812-US"
                    value={createAssetForm.serialNumber}
                    onChange={(e) => setCreateAssetForm({ ...createAssetForm, serialNumber: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold">Model Name</Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. Latitude 7420, A2992"
                    value={createAssetForm.modelName}
                    onChange={(e) => setCreateAssetForm({ ...createAssetForm, modelName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold">Manufacturer / Brand</Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. Apple, Dell, Lenovo, HP"
                    value={createAssetForm.manufacturer}
                    onChange={(e) => setCreateAssetForm({ ...createAssetForm, manufacturer: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold">Purchase Date</Form.Label>
                  <Form.Control
                    size="sm"
                    type="date"
                    value={createAssetForm.purchaseDate}
                    onChange={(e) => setCreateAssetForm({ ...createAssetForm, purchaseDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" className="rounded-pill extra-small px-3" onClick={() => setShowCreateAssetModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              type="submit"
              className="rounded-pill extra-small px-3 fw-bold text-white"
              disabled={createAssetSubmitting || !createAssetForm.name.trim()}
              style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
            >
              {createAssetSubmitting ? <Spinner size="sm" animation="border" /> : <FaPlus className="me-1" />} Save & Register Asset
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================
          MODAL: ASSIGN ASSET TO CANDIDATE
          ======================================================== */}
      <Modal show={showAssignAssetModal} onHide={() => setShowAssignAssetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold text-dark d-flex align-items-center gap-2">
            <FaLaptop className="text-primary" /> Assign Hardware to {candidateName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedAssetToAssign && (
            <div className="p-3 bg-light border rounded-3 mb-3">
              <div className="fw-bold text-dark">{selectedAssetToAssign.name}</div>
              <div className="extra-small text-muted mt-1 d-flex gap-2 flex-wrap">
                <span>Category: <strong>{selectedAssetToAssign.category}</strong></span>
                <span>•</span>
                <span>Serial: <code>{selectedAssetToAssign.serialNumber || "—"}</code></span>
                {selectedAssetToAssign.assetCode && (
                  <>
                    <span>•</span>
                    <span>Code: <code>{selectedAssetToAssign.assetCode}</code></span>
                  </>
                )}
              </div>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="extra-small fw-bold">Condition on Assignment</Form.Label>
            <Form.Select
              size="sm"
              value={assignAssetDetailForm.condition}
              onChange={(e) => setAssignAssetDetailForm({ ...assignAssetDetailForm, condition: e.target.value })}
            >
              <option value="Brand New">Brand New (Sealed / New Box)</option>
              <option value="Excellent / Like New">Excellent / Like New</option>
              <option value="Good">Good Working Condition</option>
              <option value="Fair">Fair / Refurbished</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label className="extra-small fw-bold">Assignment Notes / Handover Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              size="sm"
              placeholder={`Handed over to ${candidateName} for work purposes...`}
              value={assignAssetDetailForm.remarks}
              onChange={(e) => setAssignAssetDetailForm({ ...assignAssetDetailForm, remarks: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" className="rounded-pill extra-small px-3" onClick={() => setShowAssignAssetModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            className="rounded-pill extra-small px-3 fw-bold text-white"
            disabled={assigningAssetLoading}
            style={{ backgroundColor: "#2DC58A", borderColor: "#2DC58A" }}
            onClick={() => handleAssignAssetToCandidate(selectedAssetToAssign, assignAssetDetailForm.condition, assignAssetDetailForm.remarks)}
          >
            {assigningAssetLoading ? <Spinner size="sm" animation="border" /> : <FaPlus className="me-1" />} Confirm Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================
          IN-APP DOCUMENT VIEWER MODAL (INLINE VIEWING)
          ======================================================== */}
      <Modal
        show={docPreview.show}
        onHide={handleCloseDocPreview}
        size="xl"
        centered
        dialogClassName="modal-90w"
      >
        <Modal.Header closeButton className="border-bottom py-2.5 px-3 bg-light">
          <Modal.Title className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-0">
            {docPreview.url?.toLowerCase().includes(".pdf") || docPreview.type === "pdf" ? (
              <FaFilePdf className="text-danger" size={18} />
            ) : (
              <FaFileImage className="text-primary" size={18} />
            )}
            <span>{docPreview.title || "Document Viewer"}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-light position-relative d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "75vh", maxHeight: "85vh", overflow: "hidden" }}>
          {docPreview.url ? (
            (() => {
              const urlLower = (docPreview.url || "").toLowerCase();
              const isPdf = urlLower.includes(".pdf") || docPreview.file?.type === "application/pdf" || docPreview.type === "pdf";
              const isImage = urlLower.includes(".png") || urlLower.includes(".jpg") || urlLower.includes(".jpeg") || urlLower.includes(".webp") || urlLower.includes(".gif") || docPreview.file?.type?.startsWith("image/") || (!isPdf && urlLower.includes("/image/upload/"));

              if (isImage) {
                return (
                  <div className="w-100 h-100 p-3 d-flex align-items-center justify-content-center" style={{ maxHeight: "80vh", overflow: "auto" }}>
                    <img
                      src={docPreview.url}
                      alt={docPreview.title || "Document Preview"}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "75vh",
                        objectFit: "contain",
                        borderRadius: "8px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                        backgroundColor: "#fff",
                      }}
                    />
                  </div>
                );
              }

              // PDF & Other Documents: Native Full Viewport Iframe
              return (
                <div className="w-100 h-100 position-relative" style={{ height: "80vh", width: "100%" }}>
                  <iframe
                    src={docPreview.url}
                    title={docPreview.title || "Document Preview"}
                    width="100%"
                    height="100%"
                    style={{
                      width: "100%",
                      height: "80vh",
                      border: "none",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </div>
              );
            })()
          ) : (
            <div className="text-muted text-center py-5">
              <p className="mb-0">No preview available for this document.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2 px-3 bg-light border-top d-flex justify-content-between align-items-center">
          <span className="extra-small text-muted text-truncate" style={{ maxWidth: "450px" }}>
            {docPreview.title}
          </span>
          <div className="d-flex align-items-center gap-2">
            {docPreview.url && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-pill extra-small px-3"
                onClick={() => window.open(docPreview.url, "_blank")}
              >
                <FaExternalLinkAlt className="me-1" size={11} /> Open in New Tab
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="rounded-pill extra-small px-3"
              onClick={handleCloseDocPreview}
            >
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default HrOnboarding;