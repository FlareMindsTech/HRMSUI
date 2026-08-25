import React, { useState } from "react";
import { Card, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { FaFileContract, FaCheck, FaSave } from "react-icons/fa";

const StatutoryDetailsCard = ({
  data,
  isEditMode,
  onChange,
  onSave,
  saving,
}) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const uan = String(data?.uanNo || "").trim();
    const pf = String(data?.pfNo || "").trim();
    const esi = String(data?.esiNo || "").trim();

    if (uan && !/^[0-9]{12}$/.test(uan)) {
      errs.uanNo = "UAN must be exactly 12 digits (numbers only)";
    }

    if (pf && (pf.length < 5 || pf.length > 22)) {
      errs.pfNo = "PF Number must be between 5 and 22 characters";
    }

    if (esi && !/^[0-9]{17}$/.test(esi)) {
      errs.esiNo = "ESI Number must be exactly 17 digits (numbers only)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveClick = () => {
    if (validate()) {
      onSave();
    }
  };

  const hasAnyStatutory = Boolean(data?.uanNo || data?.pfNo || data?.esiNo);

  return (
    <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
      <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 36,
              height: 36,
              background: "rgba(245, 158, 11, 0.12)",
              color: "#D97706",
              fontSize: 16,
            }}
          >
            <FaFileContract />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-0">Statutory Details</h6>
            <span className="extra-small text-muted">Employee Provident Fund (EPF), UAN, and ESIC identifiers</span>
          </div>
        </div>
        <div>
          {hasAnyStatutory ? (
            <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill extra-small px-2.5 py-1">
              <FaCheck className="me-1" /> Configured
            </Badge>
          ) : (
            <Badge bg="secondary-subtle" className="text-secondary border rounded-pill extra-small px-2.5 py-1">
              Optional / None
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
                    UAN Number
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="12 digits Universal Account Number"
                    maxLength={12}
                    value={data?.uanNo || ""}
                    isInvalid={Boolean(errors.uanNo)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      onChange("uanNo", val);
                      if (errors.uanNo) setErrors({ ...errors, uanNo: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.uanNo}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    12 digits EPF identifier
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    PF Number
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. MH/BAN/0012345/000/0012345"
                    maxLength={22}
                    value={data?.pfNo || ""}
                    isInvalid={Boolean(errors.pfNo)}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      onChange("pfNo", val);
                      if (errors.pfNo) setErrors({ ...errors, pfNo: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.pfNo}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    5-22 alphanumeric characters
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    ESI Number
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="17 digits ESIC identifier"
                    maxLength={17}
                    value={data?.esiNo || ""}
                    isInvalid={Boolean(errors.esiNo)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      onChange("esiNo", val);
                      if (errors.esiNo) setErrors({ ...errors, esiNo: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.esiNo}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    17 digits insurance number
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
                  <FaSave /> {saving ? "Saving..." : "Save Statutory Details"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Row className="g-3">
            <Col md={4} xs={12}>
              <div className="extra-small text-muted text-uppercase fw-bold">UAN Number</div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">{data?.uanNo || "Not Provided"}</div>
            </Col>

            <Col md={4} xs={12}>
              <div className="extra-small text-muted text-uppercase fw-bold">PF Number</div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">{data?.pfNo || "Not Provided"}</div>
            </Col>

            <Col md={4} xs={12}>
              <div className="extra-small text-muted text-uppercase fw-bold">ESI Number</div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">{data?.esiNo || "Not Provided"}</div>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default StatutoryDetailsCard;
