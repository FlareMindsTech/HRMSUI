import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert, Spinner, Modal, Button } from "react-bootstrap";
import { FaExclamationTriangle, FaTrash, FaPlus, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { fetchAllUsers } from "../../services/rbacService";
import {
  getDocumentByUserId,
  createDocumentApi,
  updateDocumentApi,
  deleteDocumentApi,
} from "../../Api/Document/documentApi";

// Modular Components
import DocumentHeader from "../../Components/Document/DocumentHeader";
import DocumentSummary from "../../Components/Document/DocumentSummary";
import BankDetailsCard from "../../Components/Document/BankDetailsCard";
import IdentityDetailsCard from "../../Components/Document/IdentityDetailsCard";
import StatutoryDetailsCard from "../../Components/Document/StatutoryDetailsCard";
import EmployeeAttachments from "../../Components/Document/EmployeeAttachments";
import UploadDocumentModal from "../../Components/Document/UploadDocumentModal";
import DocumentVerificationModal from "../../Components/Document/DocumentVerificationModal";

const EMPTY_DOCUMENT = {
  bankName: "",
  branchName: "",
  accountNo: "",
  ifsc: "",
  aadhaarNo: "",
  panNo: "",
  passportNo: "",
  uanNo: "",
  pfNo: "",
  esiNo: "",
  attachments: [],
};

const DocumentManagement = () => {
  const { user: currentUser, isSystemAdmin, hasRole } = useAuth();
  const isHrOrAdmin = isSystemAdmin || hasRole("HR") || hasRole("ADMIN") || hasRole("HR_MANAGER");

  // Employees & Selection
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

  // Document State
  const [docData, setDocData] = useState(EMPTY_DOCUMENT);
  const [hasRecord, setHasRecord] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(-1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 1. Load Employee Directory
  const loadEmployees = useCallback(async () => {
    try {
      const userList = await fetchAllUsers();
      if (Array.isArray(userList) && userList.length > 0) {
        setEmployees(userList);
        // Default select current user or first employee
        const defaultId = currentUser?._id || currentUser?.id || userList[0]._id || userList[0].id;
        setSelectedUserId(defaultId);
      } else if (currentUser?._id || currentUser?.id) {
        setSelectedUserId(currentUser._id || currentUser.id);
      }
    } catch (e) {
      console.warn("loadEmployees notice:", e.message);
      if (currentUser?._id || currentUser?.id) {
        setSelectedUserId(currentUser._id || currentUser.id);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Update selected employee name
  useEffect(() => {
    if (selectedUserId && employees.length > 0) {
      const emp = employees.find((e) => (e._id || e.id) === selectedUserId);
      if (emp) {
        setSelectedEmployeeName(`${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email);
      }
    } else if (currentUser) {
      setSelectedEmployeeName(`${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || currentUser.email);
    }
  }, [selectedUserId, employees, currentUser]);

  // 2. Fetch Document by Selected User ID
  const loadDocumentData = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getDocumentByUserId(userId);
      if (res && (res._id || res.id || res.accountNo || res.aadhaarNo || res.panNo)) {
        setDocData({
          bankName: res.bankName || "",
          branchName: res.branchName || "",
          accountNo: res.accountNo || "",
          ifsc: res.ifsc || "",
          aadhaarNo: res.aadhaarNo || "",
          panNo: res.panNo || "",
          passportNo: res.passportNo || "",
          uanNo: res.uanNo || "",
          pfNo: res.pfNo || "",
          esiNo: res.esiNo || "",
          attachments: Array.isArray(res.attachments) ? res.attachments : [],
        });
        setHasRecord(true);
        setIsEditMode(false);
      } else {
        setDocData(EMPTY_DOCUMENT);
        setHasRecord(false);
        setIsEditMode(true);
      }
    } catch (err) {
      if (err.status === 404 || err.message?.toLowerCase().includes("not found")) {
        setDocData(EMPTY_DOCUMENT);
        setHasRecord(false);
        setIsEditMode(true);
      } else {
        setErrorMsg(err.message || "Failed to load employee document record.");
        setHasRecord(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadDocumentData(selectedUserId);
    }
  }, [selectedUserId, loadDocumentData]);

  // Field change handler
  const handleFieldChange = (field, value) => {
    setDocData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 3. Save / Update Full Document Record
  const handleSaveDocument = async () => {
    if (!selectedUserId) {
      setErrorMsg("User ID is required to save document information.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        userId: selectedUserId,
        bankName: docData.bankName?.trim() || undefined,
        branchName: docData.branchName?.trim() || undefined,
        accountNo: String(docData.accountNo || "").trim(),
        ifsc: String(docData.ifsc || "").trim().toUpperCase(),
        aadhaarNo: String(docData.aadhaarNo || "").trim(),
        panNo: String(docData.panNo || "").trim().toUpperCase(),
        passportNo: docData.passportNo?.trim() ? docData.passportNo.trim().toUpperCase() : undefined,
        uanNo: docData.uanNo?.trim() ? docData.uanNo.trim() : undefined,
        pfNo: docData.pfNo?.trim() ? docData.pfNo.trim() : undefined,
        esiNo: docData.esiNo?.trim() ? docData.esiNo.trim() : undefined,
        attachments: docData.attachments || [],
      };

      if (!hasRecord) {
        // Create new record via POST /api/document/create
        await createDocumentApi(payload);
        setSuccessMsg("Document & Bank record created successfully!");
      } else {
        // Update existing record via PUT /api/document/update/:userId
        await updateDocumentApi(selectedUserId, payload);
        setSuccessMsg("Document & Bank record updated successfully!");
      }

      await loadDocumentData(selectedUserId);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save document information.");
    } finally {
      setSaving(false);
    }
  };

  // 4. Delete Record Handler
  const handleDeleteDocument = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    setErrorMsg("");
    try {
      await deleteDocumentApi(selectedUserId);
      setSuccessMsg("Document record deleted successfully.");
      setShowDeleteModal(false);
      await loadDocumentData(selectedUserId);
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete document record.");
    } finally {
      setSaving(false);
    }
  };

  // 5. Attachment Upload Handler
  const handleUploadAttachment = async (newAttachment) => {
    const updatedAttachments = [...(docData.attachments || []), newAttachment];
    setDocData((prev) => ({
      ...prev,
      attachments: updatedAttachments,
    }));
    setShowUploadModal(false);

    if (hasRecord) {
      try {
        setSaving(true);
        await updateDocumentApi(selectedUserId, { attachments: updatedAttachments });
        setSuccessMsg(`Document "${newAttachment.title}" uploaded and saved.`);
        await loadDocumentData(selectedUserId);
      } catch (e) {
        setErrorMsg(e.message || "Failed to save uploaded attachment to server.");
      } finally {
        setSaving(false);
      }
    } else {
      setSuccessMsg(`Document "${newAttachment.title}" added to form. Click save to persist.`);
    }
  };

  // 6. Attachment Verification Handler
  const handleSaveVerification = async (verifiedAttachment) => {
    if (selectedAttachmentIndex === -1) return;
    const updatedAttachments = [...(docData.attachments || [])];
    updatedAttachments[selectedAttachmentIndex] = {
      ...verifiedAttachment,
      verifiedBy: currentUser?._id || currentUser?.id || null,
    };

    setDocData((prev) => ({
      ...prev,
      attachments: updatedAttachments,
    }));
    setShowVerifyModal(false);

    if (hasRecord) {
      try {
        setSaving(true);
        await updateDocumentApi(selectedUserId, { attachments: updatedAttachments });
        setSuccessMsg(`Verification status updated for "${verifiedAttachment.title}".`);
        await loadDocumentData(selectedUserId);
      } catch (e) {
        setErrorMsg(e.message || "Failed to save verification status.");
      } finally {
        setSaving(false);
      }
    }
  };

  // 7. Delete Attachment Handler
  const handleDeleteAttachment = async (index) => {
    const updatedAttachments = (docData.attachments || []).filter((_, idx) => idx !== index);
    setDocData((prev) => ({
      ...prev,
      attachments: updatedAttachments,
    }));

    if (hasRecord) {
      try {
        setSaving(true);
        await updateDocumentApi(selectedUserId, { attachments: updatedAttachments });
        setSuccessMsg("Document attachment removed.");
        await loadDocumentData(selectedUserId);
      } catch (e) {
        setErrorMsg(e.message || "Failed to remove attachment.");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="py-4 px-3 px-md-4 bg-light min-vh-100">
      <Container fluid="xl">
        {/* Header */}
        <DocumentHeader
          employees={employees}
          selectedUserId={selectedUserId}
          onSelectUser={(id) => setSelectedUserId(id)}
          isHrOrAdmin={isHrOrAdmin}
          loading={loading}
          hasRecord={hasRecord}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          onRefresh={() => loadDocumentData(selectedUserId)}
          onCreateNew={() => {
            setDocData(EMPTY_DOCUMENT);
            setHasRecord(false);
            setIsEditMode(true);
          }}
          onDeleteRecord={() => setShowDeleteModal(true)}
          selectedEmployeeName={selectedEmployeeName}
        />

        {/* Global Notifications */}
        {errorMsg && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setErrorMsg("")}
            className="rounded-4 border-0 shadow-sm d-flex align-items-center gap-2 mb-4"
          >
            <FaExclamationTriangle className="text-danger flex-shrink-0" />
            <div className="small fw-semibold">{errorMsg}</div>
          </Alert>
        )}

        {successMsg && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setSuccessMsg("")}
            className="rounded-4 border-0 shadow-sm d-flex align-items-center gap-2 mb-4"
          >
            <FaCheckCircle className="text-success flex-shrink-0" />
            <div className="small fw-semibold">{successMsg}</div>
          </Alert>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" className="mb-2" />
            <div className="text-muted small fw-semibold">Loading employee documents & details...</div>
          </div>
        ) : (
          <div>
            {/* Overview Summary */}
            <DocumentSummary docData={docData} />

            {/* If no record and not edit mode */}
            {!hasRecord && !isEditMode ? (
              <div className="p-5 text-center bg-white rounded-4 shadow-sm my-4 border">
                <h5 className="fw-bold text-dark mb-1">No Document Record Found</h5>
                <p className="text-muted small mb-3">
                  No banking, identity, or statutory information is recorded for{" "}
                  <strong>{selectedEmployeeName || "this employee"}</strong>.
                </p>
                <Button
                  variant="success"
                  className="rounded-pill px-4 extra-small shadow-xs text-white"
                  onClick={() => setIsEditMode(true)}
                >
                  <FaPlus className="me-1" /> Add Document Information
                </Button>
              </div>
            ) : (
              <div>
                <Row className="g-4">
                  {/* Left Column: Bank & Statutory */}
                  <Col lg={6} xs={12}>
                    <BankDetailsCard
                      data={docData}
                      isEditMode={isEditMode}
                      onChange={handleFieldChange}
                      onSave={handleSaveDocument}
                      saving={saving}
                    />

                    <StatutoryDetailsCard
                      data={docData}
                      isEditMode={isEditMode}
                      onChange={handleFieldChange}
                      onSave={handleSaveDocument}
                      saving={saving}
                    />
                  </Col>

                  {/* Right Column: Identity & Attachments */}
                  <Col lg={6} xs={12}>
                    <IdentityDetailsCard
                      data={docData}
                      isEditMode={isEditMode}
                      onChange={handleFieldChange}
                      onSave={handleSaveDocument}
                      saving={saving}
                    />

                    <EmployeeAttachments
                      attachments={docData?.attachments || []}
                      isHrOrAdmin={isHrOrAdmin}
                      onOpenUpload={() => setShowUploadModal(true)}
                      onOpenVerify={(att, idx) => {
                        setSelectedAttachment(att);
                        setSelectedAttachmentIndex(idx);
                        setShowVerifyModal(true);
                      }}
                      onDeleteAttachment={handleDeleteAttachment}
                    />
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}

        {/* Upload Document Modal */}
        <UploadDocumentModal
          show={showUploadModal}
          onHide={() => setShowUploadModal(false)}
          onUpload={handleUploadAttachment}
          uploading={saving}
        />

        {/* Verification Modal for HR/Admin */}
        <DocumentVerificationModal
          show={showVerifyModal}
          onHide={() => {
            setShowVerifyModal(false);
            setSelectedAttachment(null);
            setSelectedAttachmentIndex(-1);
          }}
          attachment={selectedAttachment}
          onSaveVerification={handleSaveVerification}
          saving={saving}
        />

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="rounded-4">
          <Modal.Header closeButton className="border-bottom py-3 px-4">
            <Modal.Title className="h6 fw-bold text-danger mb-0 d-flex align-items-center gap-2">
              <FaTrash /> Delete Document Record
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <p className="text-dark small mb-2">
              Are you sure you want to delete all document and banking information for{" "}
              <strong>{selectedEmployeeName}</strong>?
            </p>
            <p className="text-danger extra-small mb-0">
              This action cannot be undone. Bank, Identity, Statutory details, and all {docData.attachments?.length || 0} attached documents will be permanently removed.
            </p>
          </Modal.Body>
          <Modal.Footer className="border-top py-2.5 px-4 d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-3 extra-small" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" className="rounded-pill px-4 extra-small" onClick={handleDeleteDocument} disabled={saving}>
              {saving ? "Deleting..." : "Confirm Delete"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default DocumentManagement;
