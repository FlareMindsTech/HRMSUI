import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col, Alert, Badge } from "react-bootstrap";
import { FaShieldAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const DocumentVerificationModal = ({
  show,
  onHide,
  attachment,
  onSaveVerification,
  saving,
}) => {
  const [status, setStatus] = useState("PENDING");
  const [expiryDate, setExpiryDate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (attachment) {
      setStatus(attachment.verificationStatus || "PENDING");
      setExpiryDate(attachment.expiryDate ? String(attachment.expiryDate).split("T")[0] : "");
      setRejectionReason(attachment.rejectionReason || "");
      setError("");
    }
  }, [attachment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === "REJECTED" && !rejectionReason.trim()) {
      setError("Please provide a reason for rejecting the document.");
      return;
    }
    setError("");

    onSaveVerification({
      ...attachment,
      verificationStatus: status,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      rejectionReason: status === "REJECTED" ? rejectionReason.trim() : null,
      verifiedAt: status === "VERIFIED" || status === "REJECTED" ? new Date().toISOString() : null,
    });
  };

  if (!attachment) return null;

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" className="rounded-4">
      <Modal.Header closeButton className="border-bottom py-3 px-4">
        <Modal.Title className="h6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <FaShieldAlt className="text-primary" /> Document Verification
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {error && (
            <Alert variant="danger" className="py-2 px-3 extra-small mb-3">
              {error}
            </Alert>
          )}

          <div className="p-3 bg-light rounded-3 mb-3 border border-light-subtle">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="badge bg-secondary-subtle text-secondary border extra-small rounded-pill">
                {attachment.category}
              </span>
              <Badge
                bg={
                  attachment.verificationStatus === "VERIFIED"
                    ? "success-subtle"
                    : attachment.verificationStatus === "REJECTED"
                    ? "danger-subtle"
                    : attachment.verificationStatus === "EXPIRED"
                    ? "secondary-subtle"
                    : "warning-subtle"
                }
                className={`border extra-small ${
                  attachment.verificationStatus === "VERIFIED"
                    ? "text-success border-success-subtle"
                    : attachment.verificationStatus === "REJECTED"
                    ? "text-danger border-danger-subtle"
                    : attachment.verificationStatus === "EXPIRED"
                    ? "text-secondary border-secondary-subtle"
                    : "text-warning-emphasis border-warning-subtle"
                }`}
              >
                Current: {attachment.verificationStatus || "PENDING"}
              </Badge>
            </div>
            <div className="fw-bold small text-dark mt-1">{attachment.title}</div>
            {attachment.fileUrl && (
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="extra-small text-primary text-decoration-underline mt-1 d-inline-block"
              >
                View / Review Document File ↗
              </a>
            )}
          </div>

          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                  Verification Status *
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="fw-semibold"
                >
                  <option value="PENDING">PENDING (Awaiting Review)</option>
                  <option value="VERIFIED">VERIFIED (Approved)</option>
                  <option value="REJECTED">REJECTED (Requires Resubmission)</option>
                  <option value="EXPIRED">EXPIRED (Document Validity Expired)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                  Expiry Date (Optional)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            {status === "REJECTED" && (
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-danger text-uppercase">
                    Rejection Reason *
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    size="sm"
                    placeholder="Provide specific feedback or why this document was rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    isInvalid={Boolean(error && !rejectionReason.trim())}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top py-2.5 px-4 d-flex justify-content-between">
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              size="sm"
              className="rounded-pill px-3 extra-small"
              onClick={() => {
                setStatus("VERIFIED");
              }}
            >
              <FaCheckCircle className="me-1" /> Quick Verify
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              className="rounded-pill px-3 extra-small"
              onClick={() => {
                setStatus("REJECTED");
              }}
            >
              <FaTimesCircle className="me-1" /> Reject
            </Button>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-3 extra-small" onClick={onHide} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="rounded-pill px-4 extra-small" disabled={saving}>
              {saving ? "Saving..." : "Save Verification"}
            </Button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DocumentVerificationModal;
