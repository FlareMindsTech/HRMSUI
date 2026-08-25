import React, { useState } from "react";
import { Card, Row, Col, Button, Badge, Form } from "react-bootstrap";
import {
  FaPaperclip,
  FaPlus,
  FaEye,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaShieldAlt,
  FaTrash,
  FaCalendarAlt,
  FaFilePdf,
} from "react-icons/fa";

const CATEGORY_LABELS = {
  OFFER_LETTER: "Offer Letter",
  JOINING_DOC: "Joining Document",
  ID_PROOF: "ID Proof",
  CERTIFICATE: "Certificate",
  EXPERIENCE_LETTER: "Experience Letter",
  PAYSLIP: "Payslip",
  RELIEVING_LETTER: "Relieving Letter",
  EXIT_DOC: "Exit Document",
  OTHER: "Other Document",
};

const EmployeeAttachments = ({
  attachments = [],
  isHrOrAdmin,
  onOpenUpload,
  onOpenVerify,
  onDeleteAttachment,
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttachments = (attachments || []).filter((att) => {
    const matchesStatus = statusFilter === "ALL" || att.verificationStatus === statusFilter;
    const matchesCat = categoryFilter === "ALL" || att.category === categoryFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      att.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCat && matchesQuery;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill extra-small px-2.5 py-1">
            <FaCheckCircle className="me-1" /> VERIFIED
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge bg="danger-subtle" className="text-danger border border-danger-subtle rounded-pill extra-small px-2.5 py-1">
            <FaTimesCircle className="me-1" /> REJECTED
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge bg="secondary-subtle" className="text-secondary border rounded-pill extra-small px-2.5 py-1">
            <FaExclamationCircle className="me-1" /> EXPIRED
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge bg="warning-subtle" className="text-warning-emphasis border border-warning-subtle rounded-pill extra-small px-2.5 py-1">
            <FaExclamationCircle className="me-1" /> PENDING
          </Badge>
        );
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
      <Card.Header className="bg-white border-bottom py-3.5 px-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2.5">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 36,
                height: 36,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#059669",
                fontSize: 16,
              }}
            >
              <FaPaperclip />
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0">Employee Documents & Attachments</h6>
              <span className="extra-small text-muted">
                {attachments.length} attached file{attachments.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <Button
            variant="success"
            size="sm"
            className="rounded-pill px-3.5 extra-small d-flex align-items-center gap-1.5 shadow-xs text-white"
            onClick={onOpenUpload}
          >
            <FaPlus /> Upload Document
          </Button>
        </div>

        {/* Filters */}
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-2.5 border-top">
          <Form.Control
            size="sm"
            placeholder="Search by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 220, fontSize: "0.8rem" }}
          />

          <Form.Select
            size="sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 170, fontSize: "0.8rem" }}
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Form.Select>

          <Form.Select
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 150, fontSize: "0.8rem" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="EXPIRED">EXPIRED</option>
          </Form.Select>
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        {filteredAttachments.length === 0 ? (
          <div className="text-center py-5">
            <FaPaperclip className="fs-1 text-muted opacity-50 mb-2" />
            <h6 className="fw-bold text-dark">No Documents Found</h6>
            <p className="text-muted extra-small mb-3">
              {attachments.length === 0
                ? "No employee document attachments have been uploaded yet."
                : "No documents matching the selected category or status filter."}
            </p>
            <Button
              variant="outline-success"
              size="sm"
              className="rounded-pill px-3.5 extra-small"
              onClick={onOpenUpload}
            >
              <FaPlus className="me-1" /> Upload First Document
            </Button>
          </div>
        ) : (
          <Row className="g-3">
            {filteredAttachments.map((att, idx) => (
              <Col key={att._id || idx} lg={6} xs={12}>
                <div className="p-3.5 bg-light rounded-3 border border-light-subtle h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span className="badge bg-secondary-subtle text-secondary border extra-small rounded-pill">
                          {CATEGORY_LABELS[att.category] || att.category}
                        </span>
                        {getStatusBadge(att.verificationStatus)}
                      </div>
                      {att.expiryDate && (
                        <span className="extra-small text-muted d-flex align-items-center gap-1">
                          <FaCalendarAlt className="text-secondary" /> Exp: {new Date(att.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="d-flex align-items-start gap-2.5 mt-2">
                      <div
                        className="rounded p-2 text-danger bg-white border d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 38, height: 38 }}
                      >
                        <FaFilePdf className="fs-5" />
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <h6 className="fw-bold text-dark small mb-0 text-truncate" title={att.title}>
                          {att.title}
                        </h6>
                        <span className="extra-small text-muted text-truncate d-block mt-0.5">
                          {att.fileUrl?.split("/").pop() || "Document File"}
                        </span>
                      </div>
                    </div>

                    {att.rejectionReason && (
                      <div className="mt-2.5 p-2 bg-danger-subtle text-danger rounded-2 extra-small border border-danger-subtle">
                        <strong>Rejection Reason:</strong> {att.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3 mt-3 border-top">
                    <div className="d-flex align-items-center gap-2">
                      {att.fileUrl && (
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm py-0.5 px-2.5 extra-small rounded-pill d-flex align-items-center gap-1"
                        >
                          <FaEye /> View
                        </a>
                      )}
                      {att.fileUrl && (
                        <a
                          href={att.fileUrl}
                          download={att.title || "document"}
                          className="btn btn-outline-secondary btn-sm py-0.5 px-2.5 extra-small rounded-pill d-flex align-items-center gap-1"
                        >
                          <FaDownload /> Download
                        </a>
                      )}
                    </div>

                    <div className="d-flex align-items-center gap-1.5">
                      {isHrOrAdmin && (
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="py-0.5 px-2.5 extra-small rounded-pill d-flex align-items-center gap-1 text-dark"
                          onClick={() => onOpenVerify(att, idx)}
                          title="Verify or Reject Document"
                        >
                          <FaShieldAlt className="text-primary" /> Verify
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="py-0.5 px-2 extra-small rounded-pill"
                        onClick={() => onDeleteAttachment(idx)}
                        title="Remove Attachment"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmployeeAttachments;
