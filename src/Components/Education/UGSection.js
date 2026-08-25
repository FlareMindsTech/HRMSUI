import React from "react";
import { Card, Row, Col, Form, Badge } from "react-bootstrap";
import { FaGraduationCap, FaCheckCircle } from "react-icons/fa";

function UGSection({
  data = {},
  onChange,
  errors = {},
}) {
  const isFilled = Boolean(
    data.ugInstituteName?.trim() ||
    data.ugUniversityName?.trim() ||
    data.ugDegree?.trim() ||
    data.ugDepartmentCourse?.trim() ||
    data.ugYearOfPassing ||
    data.ugCgpa
  );

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: "#2DC58A" }}
          >
            <FaGraduationCap size={16} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Undergraduate Degree (UG / Bachelor's)</h6>
              <Badge bg="danger-subtle" className="text-danger border border-danger-subtle extra-small rounded-pill">
                Primary / Mandatory
              </Badge>
            </div>
            <span className="extra-small text-muted">Bachelor's Degree Education Details (B.E, B.Tech, B.Sc, BCA, B.Com, BBA, etc.)</span>
          </div>
        </div>

        {isFilled && (
          <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small py-1 px-2 rounded-pill">
            <FaCheckCircle className="me-1" /> Details Provided
          </Badge>
        )}
      </div>

      <Card.Body className="p-4">
        <Row className="g-3">
          {/* Institute Name */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                College / Institute Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="e.g. PSG College of Technology"
                value={data.ugInstituteName || ""}
                onChange={(e) => onChange("ugInstituteName", e.target.value)}
                isInvalid={Boolean(errors.ugInstituteName)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.ugInstituteName}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* University Name */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Affiliated University <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="e.g. Anna University, Bharathiar University"
                value={data.ugUniversityName || ""}
                onChange={(e) => onChange("ugUniversityName", e.target.value)}
                isInvalid={Boolean(errors.ugUniversityName)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.ugUniversityName}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* Degree */}
          <Col md={4} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Degree Awarded <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="e.g. B.E, B.Tech, BCA, B.Sc, B.Com"
                value={data.ugDegree || ""}
                onChange={(e) => onChange("ugDegree", e.target.value)}
                isInvalid={Boolean(errors.ugDegree)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.ugDegree}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* Department / Course */}
          <Col md={4} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Department / Branch / Specialization <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="e.g. Computer Science and Engineering, IT"
                value={data.ugDepartmentCourse || ""}
                onChange={(e) => onChange("ugDepartmentCourse", e.target.value)}
                isInvalid={Boolean(errors.ugDepartmentCourse)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.ugDepartmentCourse}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* Year of Passing & CGPA */}
          <Col md={2} xs={6}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Year of Passing <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                type="number"
                placeholder="e.g. 2024"
                min="1960"
                max={new Date().getFullYear() + 4}
                value={data.ugYearOfPassing || ""}
                onChange={(e) => onChange("ugYearOfPassing", e.target.value)}
                isInvalid={Boolean(errors.ugYearOfPassing)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.ugYearOfPassing}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={2} xs={6}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                CGPA / Score (0-10) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.75"
                value={data.ugCgpa || ""}
                onChange={(e) => onChange("ugCgpa", e.target.value)}
                isInvalid={Boolean(errors.ugCgpa)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.ugCgpa}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default UGSection;
