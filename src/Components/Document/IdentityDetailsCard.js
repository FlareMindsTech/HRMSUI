import React, { useState } from "react";
import { Card, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { FaIdCard, FaCheck, FaEye, FaEyeSlash, FaSave, FaLock } from "react-icons/fa";

const IdentityDetailsCard = ({
  data,
  isEditMode,
  onChange,
  onSave,
  saving,
}) => {
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPan, setShowPan] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const aadhaar = String(data?.aadhaarNo || "").trim();
    const pan = String(data?.panNo || "").trim().toUpperCase();
    const passport = String(data?.passportNo || "").trim().toUpperCase();

    if (aadhaar && !/^[0-9]{12}$/.test(aadhaar)) {
      errs.aadhaarNo = "Aadhaar must be exactly 12 digits (numbers only)";
    }

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      errs.panNo = "Invalid PAN format (e.g. ABCDE1234F: 5 letters + 4 digits + 1 letter)";
    }

    if (passport && !/^[A-Z]{1}[0-9]{7}$/.test(passport)) {
      errs.passportNo = "Invalid Indian Passport format (e.g. A1234567: 1 letter + 7 digits)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveClick = () => {
    if (validate()) {
      onSave();
    }
  };

  const maskAadhaar = (val) => {
    if (!val) return "—";
    const str = String(val).replace(/\s/g, "");
    if (str.length !== 12) return str;
    return `XXXX XXXX ${str.slice(-4)}`;
  };

  const maskPan = (val) => {
    if (!val) return "—";
    const str = String(val);
    if (str.length !== 10) return str;
    return `XXXXX${str.slice(-5)}`;
  };

  const maskPassport = (val) => {
    if (!val) return "—";
    const str = String(val);
    if (str.length < 4) return str;
    return `${str[0]}••••••${str.slice(-1)}`;
  };

  const formatAadhaarInput = (val) => {
    const raw = val.replace(/\D/g, "").slice(0, 12);
    return raw;
  };

  return (
    <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
      <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 36,
              height: 36,
              background: "rgba(59, 130, 246, 0.12)",
              color: "#2563EB",
              fontSize: 16,
            }}
          >
            <FaIdCard />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-0">Identity Details</h6>
            <span className="extra-small text-muted">Government-issued identity cards and travel documents</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="light" className="text-muted border rounded-pill extra-small px-2 py-0.5">
            <FaLock className="me-1 text-secondary" /> Masked in View
          </Badge>
          {data?.aadhaarNo && data?.panNo ? (
            <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill extra-small px-2.5 py-1">
              <FaCheck className="me-1" /> Added
            </Badge>
          ) : (
            <Badge bg="warning-subtle" className="text-warning-emphasis border border-warning-subtle rounded-pill extra-small px-2.5 py-1">
              Incomplete
            </Badge>
          )}
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        {isEditMode ? (
          <div>
            <Row className="g-3 mb-3">
              <Col md={4} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    Aadhaar Number *
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="XXXX XXXX XXXX (12 digits)"
                    maxLength={12}
                    value={data?.aadhaarNo || ""}
                    isInvalid={Boolean(errors.aadhaarNo)}
                    onChange={(e) => {
                      const val = formatAadhaarInput(e.target.value);
                      onChange("aadhaarNo", val);
                      if (errors.aadhaarNo) setErrors({ ...errors, aadhaarNo: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.aadhaarNo}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    Exact 12 digits (unique)
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    PAN Number *
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="ABCDE1234F (10 characters)"
                    maxLength={10}
                    value={data?.panNo || ""}
                    isInvalid={Boolean(errors.panNo)}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      onChange("panNo", val);
                      if (errors.panNo) setErrors({ ...errors, panNo: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.panNo}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    5 Letters + 4 Digits + 1 Letter
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    Passport Number (Optional)
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="A1234567 (8 characters)"
                    maxLength={8}
                    value={data?.passportNo || ""}
                    isInvalid={Boolean(errors.passportNo)}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      onChange("passportNo", val);
                      if (errors.passportNo) setErrors({ ...errors, passportNo: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.passportNo}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    1 Letter + 7 Digits
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {onSave && (
              <div className="d-flex justify-content-end pt-2 border-top">
                <Button
                  variant="success"
                  size="sm"
                  className="rounded-pill px-4 extra-small d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={handleSaveClick}
                  disabled={saving}
                >
                  <FaSave /> {saving ? "Saving..." : "Save Identity Details"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Row className="g-3">
            <Col md={4} xs={12}>
              <div className="extra-small text-muted text-uppercase fw-bold d-flex align-items-center gap-1">
                Aadhaar Number
                <span
                  className="cursor-pointer text-secondary"
                  onClick={() => setShowAadhaar(!showAadhaar)}
                  title={showAadhaar ? "Hide" : "Show"}
                >
                  {showAadhaar ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">
                {showAadhaar ? data?.aadhaarNo || "—" : maskAadhaar(data?.aadhaarNo)}
              </div>
            </Col>

            <Col md={4} xs={12}>
              <div className="extra-small text-muted text-uppercase fw-bold d-flex align-items-center gap-1">
                PAN Number
                <span
                  className="cursor-pointer text-secondary"
                  onClick={() => setShowPan(!showPan)}
                  title={showPan ? "Hide" : "Show"}
                >
                  {showPan ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">
                {showPan ? data?.panNo || "—" : maskPan(data?.panNo)}
              </div>
            </Col>

            <Col md={4} xs={12}>
              <div className="extra-small text-muted text-uppercase fw-bold d-flex align-items-center gap-1">
                Passport Number
                {data?.passportNo && (
                  <span
                    className="cursor-pointer text-secondary"
                    onClick={() => setShowPassport(!showPassport)}
                    title={showPassport ? "Hide" : "Show"}
                  >
                    {showPassport ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">
                {data?.passportNo ? (showPassport ? data.passportNo : maskPassport(data.passportNo)) : "Not Provided"}
              </div>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default IdentityDetailsCard;
