import React from "react";
import { Card, Row, Col, Form, Badge } from "react-bootstrap";
import { FaSchool, FaCheckCircle } from "react-icons/fa";

function SSLCSection({
  data = {},
  onChange,
  errors = {},
}) {
  const isFilled = Boolean(data.sslcSchoolName?.trim() || data.sslcBoard?.trim() || data.sslcYearOfPassing || data.sslcPercentage);

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: "#2DC58A" }}
          >
            <FaSchool size={15} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Secondary School Leaving Certificate (SSLC / 10th)</h6>
              <Badge bg="danger-subtle" className="text-danger border border-danger-subtle extra-small rounded-pill">
                Primary / Mandatory
              </Badge>
            </div>
            <span className="extra-small text-muted">10th Standard / Matriculation Education Details</span>
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
          {/* School Name */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                School Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="e.g. St. Joseph Higher Secondary School"
                value={data.sslcSchoolName || ""}
                onChange={(e) => onChange("sslcSchoolName", e.target.value)}
                isInvalid={Boolean(errors.sslcSchoolName)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.sslcSchoolName}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* Board */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Board / Examination Authority <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="e.g. State Board, CBSE, ICSE, Matriculation"
                value={data.sslcBoard || ""}
                onChange={(e) => onChange("sslcBoard", e.target.value)}
                isInvalid={Boolean(errors.sslcBoard)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.sslcBoard}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* Year of Passing */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Year of Passing <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                type="number"
                placeholder="e.g. 2018"
                min="1960"
                max={new Date().getFullYear()}
                value={data.sslcYearOfPassing || ""}
                onChange={(e) => onChange("sslcYearOfPassing", e.target.value)}
                isInvalid={Boolean(errors.sslcYearOfPassing)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.sslcYearOfPassing}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* Percentage */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Percentage (%) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 88.5"
                value={data.sslcPercentage || ""}
                onChange={(e) => onChange("sslcPercentage", e.target.value)}
                isInvalid={Boolean(errors.sslcPercentage)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.sslcPercentage}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default SSLCSection;
