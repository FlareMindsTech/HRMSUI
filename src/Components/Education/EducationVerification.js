import React from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import {
  FaUserShield,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCommentDots,
} from "react-icons/fa";

function EducationVerification({
  isVerified = false,
  remarks = "",
  onChangeRemarks,
  onToggleVerification,
  isHrOrAdmin = false,
  savingVerification = false,
}) {
  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: isVerified ? "#2DC58A" : "#f59e0b" }}
          >
            <FaUserShield size={15} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Academic Verification & HR Remarks</h6>
              {isVerified ? (
                <Badge bg="success" className="rounded-pill extra-small px-2 py-1">
                  ● Verified
                </Badge>
              ) : (
                <Badge bg="warning" text="dark" className="rounded-pill extra-small px-2 py-1">
                  ● Not Verified
                </Badge>
              )}
            </div>
            <span className="extra-small text-muted">
              Official verification of candidate qualifications against uploaded certificates
            </span>
          </div>
        </div>

        {isHrOrAdmin && (
          <Button
            variant={isVerified ? "outline-danger" : "success"}
            size="sm"
            className="rounded-pill px-3 py-1 extra-small fw-semibold shadow-xs"
            onClick={onToggleVerification}
            disabled={savingVerification}
            style={!isVerified ? { background: "#2DC58A", borderColor: "#2DC58A" } : {}}
          >
            {isVerified ? (
              <>
                <FaTimesCircle className="me-1" /> Revoke Verification
              </>
            ) : (
              <>
                <FaCheckCircle className="me-1" /> Verify Education
              </>
            )}
          </Button>
        )}
      </div>

      <Card.Body className="p-4">
        <Row className="g-3">
          {/* Verification Status Banner */}
          <Col md={12}>
            <div
              className={`p-3 rounded-3 border d-flex align-items-center justify-content-between flex-wrap gap-3 ${
                isVerified
                  ? "bg-success-subtle border-success border-opacity-25"
                  : "bg-warning-subtle border-warning border-opacity-25"
              }`}
            >
              <div className="d-flex align-items-center gap-3">
                {isVerified ? (
                  <FaCheckCircle className="text-success" size={24} />
                ) : (
                  <FaClock className="text-warning" size={24} />
                )}
                <div>
                  <div className="fw-bold text-dark small">
                    {isVerified
                      ? "Education Records Authenticated & Verified"
                      : "Pending Verification by HR / Compliance Team"}
                  </div>
                  <div className="extra-small text-muted">
                    {isVerified
                      ? "All original marks cards, provisional certificates, and degree credentials have been inspected."
                      : "The certificates are currently pending review against original university records."}
                  </div>
                </div>
              </div>

              {isHrOrAdmin && (
                <Form.Check
                  type="switch"
                  id="hr-verification-switch"
                  label={<span className="extra-small fw-bold text-dark">Verified Status</span>}
                  checked={isVerified}
                  onChange={onToggleVerification}
                  disabled={savingVerification}
                  className="fw-semibold mb-0 cursor-pointer"
                />
              )}
            </div>
          </Col>

          {/* HR Remarks */}
          <Col md={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark d-flex align-items-center gap-1.5">
                <FaCommentDots className="text-primary" /> HR Remarks / Verification Notes
              </Form.Label>
              {isHrOrAdmin ? (
                <Form.Control
                  as="textarea"
                  rows={3}
                  size="sm"
                  placeholder="e.g. Verified SSLC, HSC, and UG marks cards with Anna University portal. Originals verified on onboarding."
                  value={remarks || ""}
                  onChange={(e) => onChangeRemarks(e.target.value)}
                  className="rounded-3"
                />
              ) : (
                <div className="p-3 bg-light rounded-3 border text-dark small">
                  {remarks || (
                    <span className="text-muted fst-italic extra-small">No remarks entered by HR yet.</span>
                  )}
                </div>
              )}
              {isHrOrAdmin && (
                <Form.Text className="extra-small text-muted">
                  These remarks will be visible to the management team and compliance auditors.
                </Form.Text>
              )}
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default EducationVerification;
