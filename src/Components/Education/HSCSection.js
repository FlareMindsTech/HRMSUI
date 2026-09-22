import React from "react";
import { Card, Row, Col, Form, Badge } from "react-bootstrap";
import { FaSchool, FaCheckCircle } from "react-icons/fa";
import DocumentUploadBox from "./DocumentUploadBox";
import "./Education.css";

function HSCSection({
  data = {},
  onChange,
  errors = {},
  file = null,
  docUrl = "",
  onFileChange,
  onFileRemove,
}) {
  const isFilled = Boolean(data.hscSchoolName?.trim() || data.hscBoard?.trim() || data.hscYearOfPassing || data.hscPercentage || file || docUrl || data.hscDocumentUrl || data.hscDocument);

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white edu-icon-hsc"
          >
            <FaSchool size={15} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark mb-0">Higher Secondary Certificate (HSC / 12th / PUC)</h6>
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
          {/* School Name */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                School / College Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="Enter School / College Name"
                value={data.hscSchoolName || ""}
                onChange={(e) => onChange("hscSchoolName", e.target.value)}
                isInvalid={Boolean(errors.hscSchoolName)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.hscSchoolName}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          {/* Board */}
          <Col md={6} xs={12}>
            <Form.Group>
              <Form.Label className="extra-small fw-bold text-dark">
                Board / Council <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                size="sm"
                placeholder="Enter Board / Council (e.g., State Board, CBSE, ISC, PUC)"
                value={data.hscBoard || ""}
                onChange={(e) => onChange("hscBoard", e.target.value)}
                isInvalid={Boolean(errors.hscBoard)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.hscBoard}
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
                placeholder="Enter Passing Year (YYYY)"
                min="1960"
                max={new Date().getFullYear()}
                value={data.hscYearOfPassing || ""}
                onChange={(e) => onChange("hscYearOfPassing", e.target.value)}
                isInvalid={Boolean(errors.hscYearOfPassing)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.hscYearOfPassing}
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
                placeholder="Enter Percentage (%)"
                value={data.hscPercentage || ""}
                onChange={(e) => onChange("hscPercentage", e.target.value)}
                isInvalid={Boolean(errors.hscPercentage)}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid" className="extra-small">
                {errors.hscPercentage}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        {/* Optional Document Upload */}
        {(onFileChange || docUrl || file || data.hscDocumentUrl || data.hscDocument) && (
          <div className="mt-3 pt-3 border-top">
            <DocumentUploadBox
              label="Upload HSC / 12th Marksheet (Optional)"
              docUrl={docUrl || data.hscDocumentUrl || data.hscDocument}
              file={file}
              onFileChange={onFileChange}
              onFileRemove={onFileRemove}
              fieldName="hscDocument"
              required={false}
            />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default HSCSection;
