import React from "react";
import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FaUserGraduate, FaPlus, FaTrash, FaCheckCircle } from "react-icons/fa";

function PGSection({
  data = {},
  onChange,
  errors = {},
  isOpen = false,
  onToggle,
  onClear,
}) {
  const hasData = Boolean(
    data.pgInstituteName?.trim() ||
    data.pgUniversityName?.trim() ||
    data.pgDegree?.trim() ||
    data.pgDepartmentCourse?.trim() ||
    data.pgYearOfPassing ||
    data.pgCgpa
  );

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: "#0dcaf0" }}
          >
            <FaUserGraduate size={14} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Postgraduate Degree (PG / Master's)</h6>
              <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle extra-small rounded-pill">
                Optional Qualification
              </Badge>
            </div>
            <span className="extra-small text-muted">Master's Degree Education Details (M.E, M.Tech, MBA, MCA, M.Sc, etc.)</span>
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
              <FaPlus className="me-1" /> {hasData ? "Edit PG Details" : "Add PG Details"}
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
                <FaTrash className="me-1" /> Clear PG Section
              </Button>
            )}
          </div>

          <Row className="g-3">
            {/* Institute Name */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  College / Institute Name
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. National Institute of Technology"
                  value={data.pgInstituteName || ""}
                  onChange={(e) => onChange("pgInstituteName", e.target.value)}
                  isInvalid={Boolean(errors.pgInstituteName)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.pgInstituteName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* University Name */}
            <Col md={6} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Affiliated University
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Anna University, Madras University"
                  value={data.pgUniversityName || ""}
                  onChange={(e) => onChange("pgUniversityName", e.target.value)}
                  isInvalid={Boolean(errors.pgUniversityName)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.pgUniversityName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Degree */}
            <Col md={4} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Degree Awarded
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. MBA, MCA, M.Tech, M.Sc"
                  value={data.pgDegree || ""}
                  onChange={(e) => onChange("pgDegree", e.target.value)}
                  isInvalid={Boolean(errors.pgDegree)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.pgDegree}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Department / Course */}
            <Col md={4} xs={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Department / Specialization
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Finance, Software Engineering, Data Science"
                  value={data.pgDepartmentCourse || ""}
                  onChange={(e) => onChange("pgDepartmentCourse", e.target.value)}
                  isInvalid={Boolean(errors.pgDepartmentCourse)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.pgDepartmentCourse}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Year of Passing & CGPA */}
            <Col md={2} xs={6}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  Year of Passing
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  placeholder="e.g. 2026"
                  min="1960"
                  max={new Date().getFullYear() + 4}
                  value={data.pgYearOfPassing || ""}
                  onChange={(e) => onChange("pgYearOfPassing", e.target.value)}
                  isInvalid={Boolean(errors.pgYearOfPassing)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.pgYearOfPassing}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={2} xs={6}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark">
                  CGPA (0-10)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.9"
                  value={data.pgCgpa || ""}
                  onChange={(e) => onChange("pgCgpa", e.target.value)}
                  isInvalid={Boolean(errors.pgCgpa)}
                  className="rounded-3"
                />
                <Form.Control.Feedback type="invalid" className="extra-small">
                  {errors.pgCgpa}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );
}

export default PGSection;
