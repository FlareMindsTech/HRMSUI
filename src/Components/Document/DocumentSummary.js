import React from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import {
  FaUniversity,
  FaIdCard,
  FaFileContract,
  FaPaperclip,
  FaCheckCircle,
  FaClock,
  FaAward,
} from "react-icons/fa";

const DocumentSummary = ({ docData }) => {
  const hasBank = Boolean(docData?.accountNo && docData?.ifsc);
  const hasIdentity = Boolean(docData?.aadhaarNo && docData?.panNo);
  const hasStatutory = Boolean(docData?.uanNo || docData?.pfNo || docData?.esiNo);
  const attachedCount = [
    Boolean(docData?.passbookFile || docData?.passbookFileName || docData?.passbookUrl),
    Boolean(docData?.panCardFile || docData?.panCardUrl),
    Boolean(docData?.aadhaarCardFile || docData?.aadhaarCardUrl),
    Boolean(Array.isArray(docData?.attachments) && docData.attachments.length > 0),
  ].filter(Boolean).length;

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 overflow-hidden bg-white">
      <div
        style={{
          height: 4,
          background: "linear-gradient(90deg, #2DC58A 0%, #20a673 50%, #157347 100%)",
        }}
      />
      <Card.Body className="p-3.5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-2 p-1.5 d-flex align-items-center justify-content-center text-white"
              style={{ background: "#2DC58A" }}
            >
              <FaAward size={14} />
            </div>
            <h6 className="fw-bold text-dark mb-0">Documents & Compliance Overview</h6>
          </div>
          <span className="extra-small text-muted">Real-time Verification Status</span>
        </div>

        <Row className="g-3">
          {/* Bank Account */}
          <Col md={3} sm={6} xs={12}>
            <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column justify-content-between">
              <span className="extra-small text-muted fw-semibold text-uppercase tracking-wider">
                Bank Account
              </span>
              <div className="d-flex align-items-center gap-2 my-1.5">
                <div
                  className="rounded-circle p-1.5 d-flex align-items-center justify-content-center"
                  style={{
                    background: hasBank ? "rgba(45, 197, 138, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: hasBank ? "#2DC58A" : "#D97706",
                  }}
                >
                  <FaUniversity size={14} />
                </div>
                <div>
                  <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: 130 }}>
                    {hasBank ? (docData?.bankName || "Bank Added") : "Not Added"}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between mt-auto">
                <span className="extra-small text-muted">
                  {hasBank && docData?.accountNo ? `•••${String(docData.accountNo).slice(-4)}` : "Salary A/C"}
                </span>
                {hasBank ? (
                  <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small rounded-pill">
                    <FaCheckCircle className="me-1" /> Added
                  </Badge>
                ) : (
                  <Badge bg="warning-subtle" className="text-warning-emphasis border border-warning-subtle extra-small rounded-pill">
                    <FaClock className="me-1" /> Pending
                  </Badge>
                )}
              </div>
            </div>
          </Col>

          {/* Identity Proofs */}
          <Col md={3} sm={6} xs={12}>
            <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column justify-content-between">
              <span className="extra-small text-muted fw-semibold text-uppercase tracking-wider">
                Identity Details
              </span>
              <div className="d-flex align-items-center gap-2 my-1.5">
                <div
                  className="rounded-circle p-1.5 d-flex align-items-center justify-content-center"
                  style={{
                    background: hasIdentity ? "rgba(45, 197, 138, 0.15)" : "rgba(239, 68, 68, 0.12)",
                    color: hasIdentity ? "#2DC58A" : "#EF4444",
                  }}
                >
                  <FaIdCard size={14} />
                </div>
                <div>
                  <div className="fw-bold text-dark small">
                    {hasIdentity ? "PAN & Aadhaar" : "Pending"}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between mt-auto">
                <span className="extra-small text-muted">
                  {docData?.panNo ? `PAN: ${docData.panNo}` : "Govt IDs"}
                </span>
                {hasIdentity ? (
                  <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small rounded-pill">
                    <FaCheckCircle className="me-1" /> Added
                  </Badge>
                ) : (
                  <Badge bg="danger-subtle" className="text-danger border border-danger-subtle extra-small rounded-pill">
                    Mandatory
                  </Badge>
                )}
              </div>
            </div>
          </Col>

          {/* Statutory Identifiers */}
          <Col md={3} sm={6} xs={12}>
            <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column justify-content-between">
              <span className="extra-small text-muted fw-semibold text-uppercase tracking-wider">
                Statutory (EPF/ESI)
              </span>
              <div className="d-flex align-items-center gap-2 my-1.5">
                <div
                  className="rounded-circle p-1.5 d-flex align-items-center justify-content-center"
                  style={{
                    background: hasStatutory ? "rgba(45, 197, 138, 0.15)" : "rgba(107, 114, 128, 0.12)",
                    color: hasStatutory ? "#2DC58A" : "#6B7280",
                  }}
                >
                  <FaFileContract size={14} />
                </div>
                <div>
                  <div className="fw-bold text-dark small">
                    {hasStatutory ? "Configured" : "Optional"}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between mt-auto">
                <span className="extra-small text-muted">
                  {docData?.uanNo ? `UAN: ${docData.uanNo}` : "EPF / ESI"}
                </span>
                {hasStatutory ? (
                  <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small rounded-pill">
                    <FaCheckCircle className="me-1" /> Configured
                  </Badge>
                ) : (
                  <Badge bg="secondary-subtle" className="text-secondary border extra-small rounded-pill">
                    Optional
                  </Badge>
                )}
              </div>
            </div>
          </Col>

          {/* Attached Files */}
          <Col md={3} sm={6} xs={12}>
            <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column justify-content-between">
              <span className="extra-small text-muted fw-semibold text-uppercase tracking-wider">
                Document Proofs
              </span>
              <div className="d-flex align-items-center gap-2 my-1.5">
                <div
                  className="rounded-circle p-1.5 d-flex align-items-center justify-content-center"
                  style={{
                    background: attachedCount > 0 ? "rgba(45, 197, 138, 0.15)" : "rgba(107, 114, 128, 0.12)",
                    color: attachedCount > 0 ? "#2DC58A" : "#6B7280",
                  }}
                >
                  <FaPaperclip size={14} />
                </div>
                <div>
                  <div className="fw-bold text-dark small">
                    {attachedCount > 0 ? `${attachedCount} Attached` : "0 Attached"}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between mt-auto">
                <span className="extra-small text-muted">Passbook / Cheque</span>
                <Badge bg={attachedCount > 0 ? "success-subtle" : "secondary-subtle"} className={attachedCount > 0 ? "text-success border border-success-subtle extra-small rounded-pill" : "text-secondary border extra-small rounded-pill"}>
                  {attachedCount > 0 ? "Ready" : "Pending"}
                </Badge>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default DocumentSummary;
