import React from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaBook, FaPlus, FaTrash, FaCheckCircle } from "react-icons/fa";

function PhDSection({
  data = {},
  onChange,
  errors = {},
  isOpen = false,
  onToggle,
  onClear,
}) {
  const hasData = Boolean(
    data.phdInstituteName?.trim() ||
    data.phdUniversityName?.trim() ||
    data.phdResearchArea?.trim() ||
    data.phdYearOfPassing
  );

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: "#d63384" }}
          >
            <FaBook size={14} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Doctorate of Philosophy (PhD / Doctorate)</h6>
              <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle extra-small rounded-pill">
                Optional Qualification
              </Badge>
            </div>
            <span className="extra-small text-muted">Doctoral Research & Thesis Award Details</span>
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
              <FaPlus className="me-1" /> {hasData ? "Edit PhD Details" : "Add PhD Details"}
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
                <FaTrash className="me-1" /> Clear PhD Section
              </Button>
            )}
          </div>

          <Row className="g-3">
            {/* Institute Name */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Research Institute / University Department
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Indian Institute of Science (IISc)"
                  value={data.phdInstituteName || ""}
                  onChange={(e) => onChange("phdInstituteName", e.target.value)}
                  isInvalid={Boolean(errors.phdInstituteName)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.phdInstituteName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* University Name */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Awarding University
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. IISc Bangalore, IIT Madras"
                  value={data.phdUniversityName || ""}
                  onChange={(e) => onChange("phdUniversityName", e.target.value)}
                  isInvalid={Boolean(errors.phdUniversityName)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.phdUniversityName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Research Area / Thesis Topic */}
            <Col md={8} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Research Area / Field of Study
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Machine Learning, Distributed Systems, Nanotechnology"
                  value={data.phdResearchArea || ""}
                  onChange={(e) => onChange("phdResearchArea", e.target.value)}
                  isInvalid={Boolean(errors.phdResearchArea)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.phdResearchArea}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Year of Passing / Awarded */}
            <Col md={4} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Year of Award
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  placeholder="e.g. 2026"
                  min="1960"
                  max={new Date().getFullYear() + 5}
                  value={data.phdYearOfPassing || ""}
                  onChange={(e) => onChange("phdYearOfPassing", e.target.value)}
                  isInvalid={Boolean(errors.phdYearOfPassing)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.phdYearOfPassing}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );
}

export default PhDSection;
