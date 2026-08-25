import React from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaTools, FaPlus, FaTrash, FaCheckCircle } from "react-icons/fa";

function ITISection({
  data = {},
  onChange,
  errors = {},
  isOpen = false,
  onToggle,
  onClear,
}) {
  const hasData = Boolean(
    data.itiinstituteName?.trim() ||
    data.iticourse?.trim() ||
    data.itiduration?.trim() ||
    data.itiyearOfPassing ||
    data.itipercentage
  );

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: "#0d6efd" }}
          >
            <FaTools size={14} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Industrial Training Institute (ITI)</h6>
              <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle extra-small rounded-pill">
                Optional Qualification
              </Badge>
            </div>
            <span className="extra-small text-muted">Vocational & Technical Training Certificate</span>
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
              <FaPlus className="me-1" /> {hasData ? "Edit ITI Details" : "Add ITI Details"}
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
                <FaTrash className="me-1" /> Clear ITI Section
              </Button>
            )}
          </div>

          <Row className="g-3">
            {/* Institute Name */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  ITI Institute Name
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Government Industrial Training Institute"
                  value={data.itiinstituteName || ""}
                  onChange={(e) => onChange("itiinstituteName", e.target.value)}
                  isInvalid={Boolean(errors.itiinstituteName)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.itiinstituteName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Course / Trade */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Trade / Course
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Electrician, Fitter, Mechanic, Draughtsman"
                  value={data.iticourse || ""}
                  onChange={(e) => onChange("iticourse", e.target.value)}
                  isInvalid={Boolean(errors.iticourse)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.iticourse}
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
                  placeholder="e.g. 2 Years / 1 Year"
                  value={data.itiduration || ""}
                  onChange={(e) => onChange("itiduration", e.target.value)}
                  isInvalid={Boolean(errors.itiduration)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.itiduration}
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
                  value={data.itiyearOfPassing || ""}
                  onChange={(e) => onChange("itiyearOfPassing", e.target.value)}
                  isInvalid={Boolean(errors.itiyearOfPassing)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.itiyearOfPassing}
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
                  placeholder="e.g. 82.4"
                  value={data.itipercentage || ""}
                  onChange={(e) => onChange("itipercentage", e.target.value)}
                  isInvalid={Boolean(errors.itipercentage)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.itipercentage}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );
}

export default ITISection;
