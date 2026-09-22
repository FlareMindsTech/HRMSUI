import React, { useMemo } from "react";
import { Card, Row, Col, Form, Button, Badge, InputGroup } from "react-bootstrap";
import {
  FaMoneyBillWave,
  FaCalculator,
  FaInfoCircle,
  FaCheckCircle,
  FaCoins,
  FaFileContract,
  FaUserGraduate,
  FaHandHoldingUsd,
} from "react-icons/fa";

/**
 * Enterprise Compensation & CTC Breakdown Card Component
 * Supports: Salary (Full CTC & Allowances Breakdown), Stipend (Internships), Contract Payment (Consultants), Unpaid (Exempted)
 */
const CompensationCard = ({
  data = {},
  isEditMode = true,
  onChange = () => {},
  onSave = null,
  saving = false,
  readOnly = false,
}) => {
  // Compensation sub-object or top-level fallback
  const comp = data.compensation || data;
  const compType = comp.compensationType || data.compensationType || (data.isUnpaid ? "UNPAID" : "SALARY");
  const isUnpaid = compType === "UNPAID" || Boolean(data.isUnpaid || comp.isUnpaid);

  // Helper updater
  const handleFieldUpdate = (field, value, extraFields = {}) => {
    const updatedComp = {
      ...(data.compensation || {}),
      ...comp,
      [field]: value,
      ...extraFields,
    };
    onChange("compensation", updatedComp);

    // Sync legacy/top-level fields if relevant
    if (field === "compensationType") {
      onChange("compensationType", value);
      onChange("isUnpaid", value === "UNPAID");
      if (value === "UNPAID") {
        onChange("salary", "UNPAID");
        onChange("compensationAmount", "");
      }
    } else if (field === "annualCtc" || field === "monthlyGross" || field === "stipendAmount" || field === "contractRate") {
      if (compType !== "UNPAID") {
        onChange("compensationAmount", value);
        onChange("salary", value);
      }
    }
  };

  // ── Auto-Calculate Breakdown from Annual CTC ──
  const handleAutoCalculateFromCtc = (ctcInput) => {
    const numericCtc = parseFloat(String(ctcInput).replace(/[^0-9.]/g, "")) || 0;
    if (numericCtc <= 0) return;

    const monthlyGross = Math.round(numericCtc / 12);
    const basic = Math.round(monthlyGross * 0.50); // 50% Basic
    const hra = Math.round(basic * 0.40);          // 40% of Basic
    const conveyance = 1600;                        // Standard Conveyance
    const medical = 1250;                           // Standard Medical
    const fixedSum = basic + hra + conveyance + medical;
    const specialAllowance = Math.max(0, monthlyGross - fixedSum);

    // Deductions
    const pfEmployee = Math.min(Math.round(basic * 0.12), 1800); // 12% capped or standard
    const pfEmployer = pfEmployee;
    const pt = monthlyGross > 15000 ? 200 : 0;
    const esiEmployee = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0075) : 0;
    const esiEmployer = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0325) : 0;
    const totalDeductions = pfEmployee + pt + esiEmployee;
    const netTakeHome = Math.max(0, monthlyGross - totalDeductions);

    const updated = {
      ...(data.compensation || {}),
      compensationType: "SALARY",
      annualCtc: String(numericCtc),
      monthlyGross: String(monthlyGross),
      basicSalary: String(basic),
      hra: String(hra),
      conveyanceAllowance: String(conveyance),
      medicalAllowance: String(medical),
      specialAllowance: String(specialAllowance),
      otherAllowances: comp.otherAllowances || "0",
      pfEmployee: String(pfEmployee),
      pfEmployer: String(pfEmployer),
      professionalTax: String(pt),
      esiEmployee: String(esiEmployee),
      esiEmployer: String(esiEmployer),
      netTakeHome: String(netTakeHome),
    };

    onChange("compensation", updated);
    onChange("compensationAmount", String(numericCtc));
    onChange("salary", String(numericCtc));
  };

  // Compute live totals if not set
  const computedGross = useMemo(() => {
    if (compType === "SALARY") {
      const b = parseFloat(comp.basicSalary) || 0;
      const h = parseFloat(comp.hra) || 0;
      const c = parseFloat(comp.conveyanceAllowance) || 0;
      const m = parseFloat(comp.medicalAllowance) || 0;
      const s = parseFloat(comp.specialAllowance) || 0;
      const o = parseFloat(comp.otherAllowances) || 0;
      const sum = b + h + c + m + s + o;
      return sum > 0 ? sum : parseFloat(comp.monthlyGross) || (parseFloat(comp.annualCtc) ? Math.round(parseFloat(comp.annualCtc) / 12) : 0);
    }
    if (compType === "STIPEND") {
      return parseFloat(comp.stipendAmount) || 0;
    }
    if (compType === "CONTRACT_PAYMENT") {
      return parseFloat(comp.contractRate) || 0;
    }
    return 0;
  }, [comp, compType]);

  const computedDeductions = useMemo(() => {
    if (compType !== "SALARY") return 0;
    const pfe = parseFloat(comp.pfEmployee) || 0;
    const pt = parseFloat(comp.professionalTax) || 0;
    const esie = parseFloat(comp.esiEmployee) || 0;
    const tds = parseFloat(comp.tdsMonthly) || 0;
    return pfe + pt + esie + tds;
  }, [comp, compType]);

  const computedNet = useMemo(() => {
    if (compType === "SALARY") {
      const net = computedGross - computedDeductions;
      return net > 0 ? net : (parseFloat(comp.netTakeHome) || computedGross);
    }
    if (compType === "STIPEND") {
      return parseFloat(comp.stipendAmount) || 0;
    }
    if (compType === "CONTRACT_PAYMENT") {
      const rate = parseFloat(comp.contractRate) || 0;
      const tdsRate = parseFloat(comp.contractTdsRate) || 0;
      return Math.round(rate - (rate * (tdsRate / 100)));
    }
    return 0;
  }, [comp, compType, computedGross, computedDeductions]);

  return (
    <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
      {/* ── Card Header ── */}
      <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 38,
              height: 38,
              background: isUnpaid ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
              color: isUnpaid ? "#D97706" : "#059669",
              fontSize: 18,
            }}
          >
            <FaMoneyBillWave />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold mb-0 text-dark">Compensation & CTC Structure</h6>
              <Badge
                bg={
                  isUnpaid
                    ? "warning-subtle"
                    : compType === "STIPEND"
                    ? "info-subtle"
                    : compType === "CONTRACT_PAYMENT"
                    ? "primary-subtle"
                    : "success-subtle"
                }
                className={`border ${
                  isUnpaid
                    ? "text-warning-emphasis border-warning-subtle"
                    : compType === "STIPEND"
                    ? "text-info-emphasis border-info-subtle"
                    : compType === "CONTRACT_PAYMENT"
                    ? "text-primary-emphasis border-primary-subtle"
                    : "text-success border-success-subtle"
                } px-2.5 py-1 extra-small rounded-pill fw-semibold`}
              >
                {compType.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-muted extra-small mb-0">
              {isUnpaid
                ? "Unpaid engagement — statutory payroll and bank mandates exempted"
                : "Salary breakdown, fixed & variable earnings, statutory contributions, and net pay"}
            </p>
          </div>
        </div>

        {onSave && isEditMode && (
          <Button
            variant="success"
            size="sm"
            className="rounded-pill px-3 py-1 extra-small fw-semibold text-white shadow-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Compensation"}
          </Button>
        )}
      </Card.Header>

      <Card.Body className="p-4">
        {/* ── Key Summary Metrics Strip (When Monitored) ── */}
        {!isUnpaid && (
          <div className="p-3 bg-light rounded-3 border mb-4">
            <Row className="g-3 text-center align-items-center">
              {compType === "SALARY" && (
                <>
                  <Col md={3} xs={6} className="border-end">
                    <div className="extra-small text-muted text-uppercase fw-bold">Annual CTC</div>
                    <div className="fs-6 fw-bold text-dark mt-0.5">
                      ₹ {comp.annualCtc ? Number(comp.annualCtc).toLocaleString("en-IN") : "—"}
                    </div>
                  </Col>
                  <Col md={3} xs={6} className="border-end">
                    <div className="extra-small text-muted text-uppercase fw-bold">Monthly Gross</div>
                    <div className="fs-6 fw-bold text-primary mt-0.5">
                      ₹ {computedGross > 0 ? Number(computedGross).toLocaleString("en-IN") : "—"}
                    </div>
                  </Col>
                  <Col md={3} xs={6} className="border-end">
                    <div className="extra-small text-muted text-uppercase fw-bold">Monthly Deductions</div>
                    <div className="fs-6 fw-bold text-danger mt-0.5">
                      - ₹ {computedDeductions > 0 ? Number(computedDeductions).toLocaleString("en-IN") : "0"}
                    </div>
                  </Col>
                  <Col md={3} xs={6}>
                    <div className="extra-small text-muted text-uppercase fw-bold">Net In-Hand (Est.)</div>
                    <div className="fs-6 fw-bold text-success mt-0.5">
                      ₹ {computedNet > 0 ? Number(computedNet).toLocaleString("en-IN") : "—"} / mo
                    </div>
                  </Col>
                </>
              )}

              {compType === "STIPEND" && (
                <>
                  <Col md={4} xs={6} className="border-end">
                    <div className="extra-small text-muted text-uppercase fw-bold">Monthly Stipend</div>
                    <div className="fs-6 fw-bold text-success mt-0.5">
                      ₹ {comp.stipendAmount ? Number(comp.stipendAmount).toLocaleString("en-IN") : "—"}
                    </div>
                  </Col>
                  <Col md={4} xs={6} className="border-end">
                    <div className="extra-small text-muted text-uppercase fw-bold">Duration</div>
                    <div className="fs-6 fw-bold text-dark mt-0.5">
                      {comp.stipendDurationMonths ? `${comp.stipendDurationMonths} Months` : "Standard Duration"}
                    </div>
                  </Col>
                  <Col md={4} xs={12}>
                    <div className="extra-small text-muted text-uppercase fw-bold">Payment Frequency</div>
                    <div className="fs-6 fw-bold text-primary mt-0.5">
                      {comp.payFrequency || "Monthly Cycle"}
                    </div>
                  </Col>
                </>
              )}

              {compType === "CONTRACT_PAYMENT" && (
                <>
                  <Col md={4} xs={6} className="border-end">
                    <div className="extra-small text-muted text-uppercase fw-bold">Contract Fee / Rate</div>
                    <div className="fs-6 fw-bold text-primary mt-0.5">
                      ₹ {comp.contractRate ? Number(comp.contractRate).toLocaleString("en-IN") : "—"}
                    </div>
                  </Col>
                  <Col md={4} xs={6} className="border-end">
                    <div className="extra-small text-muted text-uppercase fw-bold">TDS Withholding</div>
                    <div className="fs-6 fw-bold text-warning mt-0.5">
                      {comp.contractTdsRate || "10"}% (u/s 194J)
                    </div>
                  </Col>
                  <Col md={4} xs={12}>
                    <div className="extra-small text-muted text-uppercase fw-bold">Net Payout (Est.)</div>
                    <div className="fs-6 fw-bold text-success mt-0.5">
                      ₹ {computedNet > 0 ? Number(computedNet).toLocaleString("en-IN") : "—"}
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </div>
        )}

        {/* ── Section 1: Engagement Terms & Structure Setup ── */}
        <div className="p-3 bg-white border rounded-3 mb-3">
          <div className="extra-small text-uppercase fw-bold text-muted mb-3 d-flex align-items-center justify-content-between pb-2 border-bottom">
            <span className="d-flex align-items-center gap-1.5">
              <FaFileContract className="text-primary" /> Compensation Model & Terms
            </span>
            {isEditMode && !readOnly && compType === "SALARY" && (
              <Button
                variant="outline-primary"
                size="sm"
                className="py-0.5 px-2 extra-small rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
                onClick={() => handleAutoCalculateFromCtc(comp.annualCtc || "600000")}
                title="Automatically calculate Basic, HRA, Allowances & PF based on Annual CTC"
              >
                <FaCalculator size={11} /> Auto-Compute Breakdown
              </Button>
            )}
          </div>

          <Row className="g-3">
            <Col md={3} sm={6}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-uppercase">Compensation Type *</Form.Label>
                {isEditMode && !readOnly ? (
                  <Form.Select
                    size="sm"
                    value={compType}
                    onChange={(e) => handleFieldUpdate("compensationType", e.target.value)}
                  >
                    <option value="SALARY">Salary (Standard Payroll)</option>
                    <option value="STIPEND">Stipend (Intern / Trainee)</option>
                    <option value="UNPAID">Unpaid / Volunteer</option>
                    <option value="CONTRACT_PAYMENT">Contract Payment (Consultant)</option>
                  </Form.Select>
                ) : (
                  <div className="fw-semibold text-dark small">{compType.replace(/_/g, " ")}</div>
                )}
              </Form.Group>
            </Col>

            <Col md={3} sm={6}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-uppercase">Pay Frequency</Form.Label>
                {isEditMode && !readOnly ? (
                  <Form.Select
                    size="sm"
                    value={comp.payFrequency || "MONTHLY"}
                    onChange={(e) => handleFieldUpdate("payFrequency", e.target.value)}
                    disabled={isUnpaid}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="ONE_TIME">One Time</option>
                    <option value="NONE">None</option>
                  </Form.Select>
                ) : (
                  <div className="fw-semibold text-dark small">{comp.payFrequency ? comp.payFrequency.replace(/_/g, " ") : "Monthly"}</div>
                )}
              </Form.Group>
            </Col>

            <Col md={3} sm={6}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-uppercase">Currency</Form.Label>
                {isEditMode && !readOnly ? (
                  <Form.Select
                    size="sm"
                    value={comp.currency || "INR"}
                    onChange={(e) => handleFieldUpdate("currency", e.target.value)}
                    disabled={isUnpaid}
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </Form.Select>
                ) : (
                  <div className="fw-semibold text-dark small">{comp.currency || "INR (₹)"}</div>
                )}
              </Form.Group>
            </Col>

            <Col md={3} sm={6}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-uppercase">Effective Date</Form.Label>
                {isEditMode && !readOnly ? (
                  <Form.Control
                    size="sm"
                    type="date"
                    value={comp.effectiveDate ? new Date(comp.effectiveDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleFieldUpdate("effectiveDate", e.target.value)}
                  />
                ) : (
                  <div className="fw-semibold text-dark small">
                    {comp.effectiveDate ? new Date(comp.effectiveDate).toLocaleDateString() : "Immediate"}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* ── Case 1: UNPAID Engagement Notice ── */}
        {isUnpaid && (
          <div className="p-4 bg-warning-subtle border border-warning-subtle rounded-3 text-dark mb-3">
            <div className="d-flex align-items-start gap-3">
              <div className="p-2 bg-warning text-white rounded-circle flex-shrink-0">
                <FaInfoCircle size={20} />
              </div>
              <div>
                <h6 className="fw-bold text-warning-emphasis mb-1">Unpaid / Volunteer Engagement</h6>
                <p className="text-muted extra-small mb-2" style={{ maxWidth: 650 }}>
                  This candidate is registered with an unpaid engagement agreement (such as an academic internship, volunteering, or honorary role).
                  All salary computations, tax deductions, and bank account verifications are exempted.
                </p>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="success-subtle" className="text-success border border-success-subtle px-2.5 py-1 extra-small">
                    <FaCheckCircle className="me-1" /> Bank Details Exempted
                  </Badge>
                  <Badge bg="info-subtle" className="text-info-emphasis border border-info-subtle px-2.5 py-1 extra-small">
                    Statutory Exemption Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Case 2: SALARY Structure ── */}
        {!isUnpaid && compType === "SALARY" && (
          <div>
            {/* Earnings & Allowances */}
            <div className="p-3 bg-white border rounded-3 mb-3">
              <div className="extra-small text-uppercase fw-bold text-muted mb-3 pb-2 border-bottom d-flex align-items-center justify-content-between">
                <span className="d-flex align-items-center gap-1.5 text-success">
                  <FaCoins /> Fixed Earnings & Salary Components (Monthly)
                </span>
                <span className="extra-small text-muted font-monospace">All figures in {comp.currency || "INR"}</span>
              </div>

              <Row className="g-3">
                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Annual CTC (Cost to Company) *</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 600000"
                          value={comp.annualCtc || ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const num = parseFloat(raw) || 0;
                            const extra = num > 0 ? { monthlyGross: String(Math.round(num / 12)) } : {};
                            handleFieldUpdate("annualCtc", raw, extra);
                          }}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-bold text-dark small">₹ {comp.annualCtc ? Number(comp.annualCtc).toLocaleString("en-IN") : "—"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Monthly Gross Salary *</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 50000"
                          value={comp.monthlyGross || ""}
                          onChange={(e) => handleFieldUpdate("monthlyGross", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-bold text-primary small">₹ {comp.monthlyGross ? Number(comp.monthlyGross).toLocaleString("en-IN") : "—"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Basic Salary *</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 25000"
                          value={comp.basicSalary || ""}
                          onChange={(e) => handleFieldUpdate("basicSalary", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-semibold text-dark small">₹ {comp.basicSalary ? Number(comp.basicSalary).toLocaleString("en-IN") : "—"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">House Rent Allowance (HRA)</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 10000"
                          value={comp.hra || ""}
                          onChange={(e) => handleFieldUpdate("hra", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-semibold text-dark small">₹ {comp.hra ? Number(comp.hra).toLocaleString("en-IN") : "0"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Conveyance Allowance</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 1600"
                          value={comp.conveyanceAllowance || ""}
                          onChange={(e) => handleFieldUpdate("conveyanceAllowance", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-semibold text-dark small">₹ {comp.conveyanceAllowance ? Number(comp.conveyanceAllowance).toLocaleString("en-IN") : "0"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Medical Allowance</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 1250"
                          value={comp.medicalAllowance || ""}
                          onChange={(e) => handleFieldUpdate("medicalAllowance", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-semibold text-dark small">₹ {comp.medicalAllowance ? Number(comp.medicalAllowance).toLocaleString("en-IN") : "0"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Special Allowance</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 12150"
                          value={comp.specialAllowance || ""}
                          onChange={(e) => handleFieldUpdate("specialAllowance", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-semibold text-dark small">₹ {comp.specialAllowance ? Number(comp.specialAllowance).toLocaleString("en-IN") : "0"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Other Fixed Allowances</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 0"
                          value={comp.otherAllowances || ""}
                          onChange={(e) => handleFieldUpdate("otherAllowances", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-semibold text-dark small">₹ {comp.otherAllowances ? Number(comp.otherAllowances).toLocaleString("en-IN") : "0"}</div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={4} sm={6}>
                  <Form.Group>
                    <Form.Label className="extra-small fw-bold text-uppercase">Variable Pay / Performance (Annual)</Form.Label>
                    {isEditMode && !readOnly ? (
                      <InputGroup size="sm">
                        <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                        <Form.Control
                          placeholder="e.g. 50000"
                          value={comp.variablePay || ""}
                          onChange={(e) => handleFieldUpdate("variablePay", e.target.value)}
                        />
                      </InputGroup>
                    ) : (
                      <div className="fw-semibold text-dark small">₹ {comp.variablePay ? Number(comp.variablePay).toLocaleString("en-IN") : "0"}</div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>
        )}

        {/* ── Case 3: STIPEND Structure ── */}
        {!isUnpaid && compType === "STIPEND" && (
          <div className="p-3 bg-white border rounded-3 mb-3">
            <div className="extra-small text-uppercase fw-bold text-muted mb-3 pb-2 border-bottom d-flex align-items-center gap-1.5 text-info">
              <FaUserGraduate /> Internship & Trainee Stipend Terms
            </div>

            <Row className="g-3">
              <Col md={4} sm={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-uppercase">Monthly Stipend Amount *</Form.Label>
                  {isEditMode && !readOnly ? (
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                      <Form.Control
                        placeholder="e.g. 15000"
                        value={comp.stipendAmount || data.compensationAmount || ""}
                        onChange={(e) => handleFieldUpdate("stipendAmount", e.target.value)}
                      />
                    </InputGroup>
                  ) : (
                    <div className="fw-bold text-dark small">₹ {comp.stipendAmount ? Number(comp.stipendAmount).toLocaleString("en-IN") : "—"}</div>
                  )}
                </Form.Group>
              </Col>

              <Col md={4} sm={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-uppercase">Internship Duration (Months)</Form.Label>
                  {isEditMode && !readOnly ? (
                    <Form.Control
                      size="sm"
                      placeholder="e.g. 6"
                      value={comp.stipendDurationMonths || ""}
                      onChange={(e) => handleFieldUpdate("stipendDurationMonths", e.target.value)}
                    />
                  ) : (
                    <div className="fw-semibold text-dark small">{comp.stipendDurationMonths ? `${comp.stipendDurationMonths} Months` : "—"}</div>
                  )}
                </Form.Group>
              </Col>

              <Col md={4} sm={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-uppercase">Performance Bonus / Incentive (₹)</Form.Label>
                  {isEditMode && !readOnly ? (
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                      <Form.Control
                        placeholder="e.g. 5000"
                        value={comp.bonus || ""}
                        onChange={(e) => handleFieldUpdate("bonus", e.target.value)}
                      />
                    </InputGroup>
                  ) : (
                    <div className="fw-semibold text-dark small">₹ {comp.bonus ? Number(comp.bonus).toLocaleString("en-IN") : "0"}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>
        )}

        {/* ── Case 4: CONTRACT_PAYMENT Structure ── */}
        {!isUnpaid && compType === "CONTRACT_PAYMENT" && (
          <div className="p-3 bg-white border rounded-3 mb-3">
            <div className="extra-small text-uppercase fw-bold text-muted mb-3 pb-2 border-bottom d-flex align-items-center gap-1.5 text-primary">
              <FaHandHoldingUsd /> Contract Payment & Professional Fee Structure
            </div>

            <Row className="g-3">
              <Col md={4} sm={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-uppercase">Contract Fee / Rate Amount *</Form.Label>
                  {isEditMode && !readOnly ? (
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light text-muted">₹</InputGroup.Text>
                      <Form.Control
                        placeholder="e.g. 75000"
                        value={comp.contractRate || data.compensationAmount || ""}
                        onChange={(e) => handleFieldUpdate("contractRate", e.target.value)}
                      />
                    </InputGroup>
                  ) : (
                    <div className="fw-bold text-dark small">₹ {comp.contractRate ? Number(comp.contractRate).toLocaleString("en-IN") : "—"}</div>
                  )}
                </Form.Group>
              </Col>

              <Col md={4} sm={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-uppercase">Billing Terms / Structure</Form.Label>
                  {isEditMode && !readOnly ? (
                    <Form.Select
                      size="sm"
                      value={comp.contractPaymentTerms || "MONTHLY_FIXED"}
                      onChange={(e) => handleFieldUpdate("contractPaymentTerms", e.target.value)}
                    >
                      <option value="MONTHLY_FIXED">Monthly Fixed Retainer</option>
                      <option value="MILESTONE_BASED">Milestone-based Invoicing</option>
                      <option value="HOURLY_RATE">Hourly / Time-Material Rate</option>
                    </Form.Select>
                  ) : (
                    <div className="fw-semibold text-dark small">{(comp.contractPaymentTerms || "MONTHLY_FIXED").replace(/_/g, " ")}</div>
                  )}
                </Form.Group>
              </Col>

              <Col md={4} sm={6}>
                <Form.Group>
                  <Form.Label className="extra-small fw-bold text-uppercase">TDS Rate (%)</Form.Label>
                  {isEditMode && !readOnly ? (
                    <InputGroup size="sm">
                      <Form.Control
                        placeholder="e.g. 10"
                        value={comp.contractTdsRate || "10"}
                        onChange={(e) => handleFieldUpdate("contractTdsRate", e.target.value)}
                      />
                      <InputGroup.Text className="bg-light text-muted">%</InputGroup.Text>
                    </InputGroup>
                  ) : (
                    <div className="fw-semibold text-dark small">{comp.contractTdsRate || "10"}%</div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CompensationCard;
