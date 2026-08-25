import React from "react";
import { Row, Col, Card, Badge } from "react-bootstrap";
import {
  FaGraduationCap,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaAward,
  FaCertificate,
} from "react-icons/fa";

function EducationSummary({
  highestQualification = "UG",
  isVerified = false,
  verifiedBy = null,
  remarks = "",
  stats = {
    totalQualifications: 0,
    attachedDocsCount: 0,
  },
}) {
  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 overflow-hidden" style={{ background: "#ffffff" }}>
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
            <h6 className="fw-bold text-dark mb-0">Education Summary</h6>
          </div>
          <span className="extra-small text-muted">Real-time Qualification Overview</span>
        </div>

        <Row className="g-3">
          {/* Highest Qualification */}
          <Col md={4} sm={6} xs={12}>
            <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column justify-content-center">
              <span className="extra-small text-muted fw-semibold text-uppercase tracking-wider">
                Highest Qualification
              </span>
              <div className="d-flex align-items-center gap-2 mt-1">
                <FaGraduationCap className="text-primary" size={20} />
                <span className="h5 fw-bold text-dark mb-0">
                  {highestQualification || "Not Specified"}
                </span>
              </div>
              <span className="extra-small text-muted mt-1">Primary Academic Degree</span>
            </div>
          </Col>

          {/* Verification Status */}
          <Col md={4} sm={6} xs={12}>
            <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column justify-content-center">
              <span className="extra-small text-muted fw-semibold text-uppercase tracking-wider">
                Verification Status
              </span>
              <div className="d-flex align-items-center gap-2 mt-1">
                {isVerified ? (
                  <Badge bg="success" className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-pill fs-7 fw-semibold">
                    <FaCheckCircle /> Verified
                  </Badge>
                ) : (
                  <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 rounded-pill fs-7 fw-semibold">
                    <FaClock /> Not Verified
                  </Badge>
                )}
              </div>
              <span className="extra-small text-muted mt-1">
                {isVerified ? "Approved by HR Team" : "Pending HR Verification"}
              </span>
            </div>
          </Col>

          {/* Completed Qualifications */}
          <Col md={4} sm={12} xs={12}>
            <div className="p-3 rounded-3 bg-light border border-light-subtle h-100 d-flex flex-column justify-content-center">
              <span className="extra-small text-muted fw-semibold text-uppercase tracking-wider">
                Academic Qualifications
              </span>
              <div className="d-flex align-items-center gap-2 mt-1">
                <FaCertificate className="text-success" size={18} />
                <span className="h5 fw-bold text-dark mb-0">
                  {stats.totalQualifications || 0} Recorded
                </span>
              </div>
              <span className="extra-small text-muted mt-1">SSLC, HSC, Degrees</span>
            </div>
          </Col>
        </Row>

        {/* HR Remarks Alert Strip if remarks present */}
        {remarks && (
          <div className="mt-3 p-2.5 rounded-3 bg-info-subtle border border-info-subtle d-flex align-items-start gap-2">
            <span className="badge bg-info text-white extra-small mt-0.5">HR Note</span>
            <span className="extra-small text-dark fw-medium">{remarks}</span>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default EducationSummary;
