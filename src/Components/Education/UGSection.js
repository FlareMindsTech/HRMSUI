import React from "react";
import { Card, Row, Col, Form, Badge } from "react-bootstrap";
import { FaGraduationCap, FaCheckCircle } from "react-icons/fa";
import DocumentUploadBox from "./DocumentUploadBox";
import "./Education.css";

function UGSection({
  data = {},
  onChange,
  errors = {},
  file = null,
  docUrl = "",
  onFileChange,
  onFileRemove,
}) {
  const isFilled = Boolean(
    data.ugInstituteName?.trim() ||
    data.ugUniversityName?.trim() ||
    data.ugDegree?.trim() ||
    data.ugDepartmentCourse?.trim() ||
    data.ugYearOfPassing ||
    data.ugCgpa ||
    file ||
    docUrl ||
    data.ugDocumentUrl ||
    data.ugDocument
  );

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white edu-icon-ug"
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
                placeholder="Enter College / Institute Name"
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
                placeholder="Enter Affiliated University"
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
                placeholder="Enter Degree (e.g., B.E, B.Tech, BCA, B.Sc, B.Com)"
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
                placeholder="Enter Department / Specialization (e.g., Computer Science)"
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
                placeholder="Enter Passing Year (YYYY)"
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
                placeholder="Enter CGPA (e.g., 8.5)"
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

        {/* Optional Document Upload */}
        {(onFileChange || docUrl || file || data.ugDocumentUrl || data.ugDocument) && (
          <div className="mt-3 pt-3 border-top">
            <DocumentUploadBox
              label="Upload UG Degree Certificate / Consolidated Marksheet (Optional)"
              docUrl={docUrl || data.ugDocumentUrl || data.ugDocument}
              file={file}
              onFileChange={onFileChange}
              onFileRemove={onFileRemove}
              fieldName="ugDocument"
              required={false}
            />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default UGSection;
