import React from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaCertificate, FaPlus, FaTrash, FaCheckCircle } from "react-icons/fa";

function DiplomaSection({
  data = {},
  onChange,
  errors = {},
  isOpen = false,
  onToggle,
  onClear,
}) {
  const hasData = Boolean(
    data.diplomainstitution?.trim() ||
    data.diplomacourse?.trim() ||
    data.diplomaduration?.trim() ||
    data.diplomayearOfPassing ||
    data.diplomapercentage
  );

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: "#6f42c1" }}
          >
            <FaCertificate size={14} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Polytechnic / Diploma Certificate</h6>
              <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle extra-small rounded-pill">
                Optional Qualification
              </Badge>
            </div>
            <span className="extra-small text-muted">Technical / Professional Diploma Program</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {hasData && (
            <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small py-1 px-2 rounded-pill">
              <FaCheckCircle className="me-1" /> Added
            </Badge>
          )}
          {!isOpen ? (
            <Button
              variant="outline-primary"
              size="sm"
              className="rounded-pill px-3 py-1 extra-small fw-semibold"
              onClick={onToggle}
            >
              <FaPlus className="me-1" /> {hasData ? "Edit Diploma Details" : "Add Diploma Details"}
            </Button>
          ) : (
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-pill px-3 py-1 extra-small"
              onClick={onToggle}
            >
              Collapse
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <Card.Body className="p-4 border-top">
          <div className="d-flex justify-content-end mb-2">
            {hasData && (
              <Button
                variant="outline-danger"
                size="sm"
                className="py-0 px-2.5 extra-small rounded-pill"
                onClick={onClear}
              >
                <FaTrash className="me-1" /> Clear Diploma Section
              </Button>
            )}
          </div>

          <Row className="g-3">
            {/* Institution */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Diploma Institution / Polytechnic College
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Government Polytechnic College"
                  value={data.diplomainstitution || ""}
                  onChange={(e) => onChange("diplomainstitution", e.target.value)}
                  isInvalid={Boolean(errors.diplomainstitution)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.diplomainstitution}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Course / Branch */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Branch / Specialization
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Diploma in Computer Engineering, Mechanical, EEE"
                  value={data.diplomacourse || ""}
                  onChange={(e) => onChange("diplomacourse", e.target.value)}
                  isInvalid={Boolean(errors.diplomacourse)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.diplomacourse}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Duration */}
            <Col md={4} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Duration
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. 3 Years / Lateral Entry (2 Years)"
                  value={data.diplomaduration || ""}
                  onChange={(e) => onChange("diplomaduration", e.target.value)}
                  isInvalid={Boolean(errors.diplomaduration)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.diplomaduration}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Year of Passing */}
            <Col md={4} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Year of Passing
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  placeholder="e.g. 2021"
                  min="1960"
                  max={new Date().getFullYear()}
                  value={data.diplomayearOfPassing || ""}
                  onChange={(e) => onChange("diplomayearOfPassing", e.target.value)}
                  isInvalid={Boolean(errors.diplomayearOfPassing)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.diplomayearOfPassing}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Percentage */}
            <Col md={4} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Percentage (%)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 85.0"
                  value={data.diplomapercentage || ""}
                  onChange={(e) => onChange("diplomapercentage", e.target.value)}
                  isInvalid={Boolean(errors.diplomapercentage)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.diplomapercentage}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );
}

export default DiplomaSection;
