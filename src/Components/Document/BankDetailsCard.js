import React, { useState } from "react";
import { Card, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { FaUniversity, FaCheck, FaEye, FaEyeSlash, FaSave, FaFileAlt, FaFileUpload } from "react-icons/fa";

const BankDetailsCard = ({
  data,
  isEditMode,
  onChange,
  onSave,
  saving,
  onPassbookChange,
  onPassbookPreview,
}) => {
  const [showAccountNo, setShowAccountNo] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const acc = String(data?.accountNo || "").trim();
    const ifsc = String(data?.ifsc || "").trim().toUpperCase();

    if (acc && !/^[0-9]{9,18}$/.test(acc)) {
      errs.accountNo = "Account number must be between 9 and 18 digits (numbers only)";
    }

    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      errs.ifsc = "Invalid IFSC format (e.g. SBIN0001234: 4 letters + 0 + 6 alphanumeric)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveClick = () => {
    if (validate()) {
      onSave();
    }
  };

  const maskAccountNo = (acc) => {
    if (!acc) return "—";
    const str = String(acc);
    if (str.length <= 4) return str;
    return `•••• •••• ${str.slice(-4)}`;
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
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              fontSize: 16,
            }}
          >
            <FaUniversity />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-0">Bank Details</h6>
            <span className="extra-small text-muted">Primary banking and salary disbursement account details</span>
          </div>
        </div>
        <div>
          {data?.accountNo && data?.ifsc ? (
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
              <Col md={6} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    Bank Name
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. State Bank of India, HDFC Bank, ICICI Bank"
                    value={data?.bankName || ""}
                    onChange={(e) => onChange("bankName", e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    Branch Name
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. Koramangala Branch, T. Nagar Branch"
                    value={data?.branchName || ""}
                    onChange={(e) => onChange("branchName", e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    Account Number *
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="9 to 18 digits account number"
                    maxLength={18}
                    value={data?.accountNo || ""}
                    isInvalid={Boolean(errors.accountNo)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      onChange("accountNo", val);
                      if (errors.accountNo) setErrors({ ...errors, accountNo: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.accountNo}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    Digits only (9-18 characters)
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6} xs={12}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                    IFSC Code *
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                    value={data?.ifsc || ""}
                    isInvalid={Boolean(errors.ifsc)}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      onChange("ifsc", val);
                      if (errors.ifsc) setErrors({ ...errors, ifsc: null });
                    }}
                  />
                  <Form.Control.Feedback type="invalid" className="extra-small">
                    {errors.ifsc}
                  </Form.Control.Feedback>
                  <Form.Text className="extra-small text-muted">
                    11 characters uppercase (e.g. HDFC0000123)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Optional Passbook / Cancelled Cheque Upload */}
            <div className="p-3 bg-light rounded-3 border border-light-subtle mb-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <span className="extra-small fw-bold text-dark d-flex align-items-center gap-1.5 mb-0.5">
                    <FaFileAlt className="text-success" /> Bank Passbook / Cancelled Cheque (Optional)
                  </span>
                  <span className="extra-small text-muted">Upload scan of bank passbook or cancelled cheque leaf</span>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {data?.passbookFileName && (
                    <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small py-1 px-2.5 rounded-pill">
                      <FaCheck className="me-1" /> {data.passbookFileName}
                    </Badge>
                  )}
                  {onPassbookPreview && data?.passbookFile && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="py-1 px-3 extra-small rounded-pill shadow-xs d-flex align-items-center gap-1"
                      onClick={() => onPassbookPreview(data.passbookFile, data.passbookFileName || "Bank Passbook")}
                    >
                      <FaEye /> View File
                    </Button>
                  )}
                  {onPassbookChange && (
                    <label className="btn btn-outline-success btn-sm py-1 px-3 extra-small rounded-pill mb-0 cursor-pointer shadow-xs d-flex align-items-center gap-1">
                      <FaFileUpload /> {data?.passbookFileName ? "Change File" : "Upload File"}
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onPassbookChange(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {onSave && (
              <div className="d-flex justify-content-end pt-2 border-top">
                <Button
                  variant="success"
                  size="sm"
                  className="rounded-pill px-4 extra-small d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={handleSaveClick}
                  disabled={saving}
                >
                  <FaSave /> {saving ? "Saving..." : "Save Bank Details"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Row className="g-3">
            <Col md={3} xs={6}>
              <div className="extra-small text-muted text-uppercase fw-bold">Bank Name</div>
              <div className="fw-semibold text-dark small mt-0.5">{data?.bankName || "—"}</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="extra-small text-muted text-uppercase fw-bold">Branch</div>
              <div className="fw-semibold text-dark small mt-0.5">{data?.branchName || "—"}</div>
            </Col>
            <Col md={3} xs={6}>
              <div className="extra-small text-muted text-uppercase fw-bold d-flex align-items-center gap-1">
                Account Number
                <span
                  className="cursor-pointer text-secondary"
                  onClick={() => setShowAccountNo(!showAccountNo)}
                  title={showAccountNo ? "Hide" : "Show"}
                >
                  {showAccountNo ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">
                {showAccountNo ? data?.accountNo || "—" : maskAccountNo(data?.accountNo)}
              </div>
            </Col>
            <Col md={3} xs={6}>
              <div className="extra-small text-muted text-uppercase fw-bold">IFSC Code</div>
              <div className="fw-semibold text-dark small font-monospace mt-0.5">{data?.ifsc || "—"}</div>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default BankDetailsCard;
