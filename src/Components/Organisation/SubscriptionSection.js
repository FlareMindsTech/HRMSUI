import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Button, Badge, ProgressBar, Spinner } from "react-bootstrap";
import {
  FaCrown,
  FaCheckCircle,
  FaBuilding,
  FaUsers,
  FaHdd,
  FaCalendarAlt,
  FaShieldAlt,
  FaRocket,
  FaSyncAlt,
} from "react-icons/fa";
import { useBranch } from "../../context/BranchContext";
import { fetchOrganizationStructure } from "../../services/organizationService";

export default function SubscriptionSection() {
  const { organization } = useBranch();

  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState(null);
  const [subscription] = useState({
    planName: "Enterprise Tier (Unlimited SaaS)",
    status: "ACTIVE",
    billingCycle: "Annual",
    currentPeriodEnd: "2027-03-31",
    maxBranches: 10,
    maxEmployees: 500,
    maxStorageGB: 100,
    features: [
      "Multi-Branch & Campus Management",
      "Geofenced Mobile & Biometric Attendance",
      "Multi-Level Approval Hierarchy",
      "Automated Payroll & Statutory ECR Generation",
      "Role-Based Access Control (RBAC)",
      "Granular Organization Access Scoping",
      "Dedicated Database & Audit Logs",
      "24/7 Enterprise Technical Support",
    ],
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchOrganizationStructure().catch(() => null);
      setStructure(data);
    } catch (e) {
      console.warn("Subscription load notice:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const usedBranches = structure?.branches?.length || organization?.stats?.branchCount || 1;
  const usedEmployees = organization?.stats?.employeeCount || 1;
  const usedStorageGB = 4.2;

  const branchPercent = Math.min(Math.round((usedBranches / subscription.maxBranches) * 100), 100);
  const empPercent = Math.min(Math.round((usedEmployees / subscription.maxEmployees) * 100), 100);
  const storagePercent = Math.min(Math.round((usedStorageGB / subscription.maxStorageGB) * 100), 100);

  return (
    <div className="subscription-section">
      {/* ── Section Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <FaCrown className="text-warning" /> Subscription & Plan Limits
          </h3>
          <p className="text-muted small mb-0">
            View active SaaS license, resource quotas, enterprise limits, and billing cycle.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={loadData} className="d-flex align-items-center gap-1">
            <FaSyncAlt /> Refresh
          </Button>
          <Button variant="success" size="sm" className="d-flex align-items-center gap-1 fw-semibold">
            <FaRocket /> Upgrade Plan
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Loading subscription details...</p>
        </div>
      ) : (
        <>
          {/* ── Active Plan Card ── */}
          <Card className="border shadow-sm mb-4 bg-white">
            <Card.Body className="p-4">
              <Row className="align-items-center g-4">
                <Col md={8}>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 14,
                        background: "linear-gradient(135deg, #C79D58 0%, #C49A55 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.75rem",
                        flexShrink: 0,
                      }}
                    >
                      <FaCrown />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h4 className="fw-bold text-dark mb-0">{subscription.planName}</h4>
                        <Badge bg="success" className="d-flex align-items-center gap-1">
                          <FaCheckCircle size={10} /> {subscription.status}
                        </Badge>
                      </div>
                      <div className="text-muted small mt-1">
                        Active tenant license for <strong>{organization?.organizationName || "Your Organization"}</strong> • Billed {subscription.billingCycle}
                      </div>
                    </div>
                  </div>
                </Col>

                <Col md={4} className="text-md-end">
                  <div className="small text-muted">Renewal / Expiry Date</div>
                  <div className="fs-5 fw-bold text-dark mt-1 d-flex align-items-center justify-content-md-end gap-1">
                    <FaCalendarAlt className="text-primary small" /> {subscription.currentPeriodEnd}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* ── Resource Quota Meters ── */}
          <h5 className="fw-bold text-dark mb-3">Tenant Quota & Capacity Usage</h5>
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Card className="border shadow-sm h-100 bg-white p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaBuilding className="text-primary" />
                    <span className="fw-semibold text-dark">Branch Quota</span>
                  </div>
                  <span className="fw-bold text-dark">{usedBranches} / {subscription.maxBranches}</span>
                </div>
                <ProgressBar now={branchPercent} variant={branchPercent > 80 ? "warning" : "success"} style={{ height: 8 }} />
                <div className="small text-muted mt-2 d-flex justify-content-between">
                  <span>{subscription.maxBranches - usedBranches} branches available</span>
                  <span>{branchPercent}% used</span>
                </div>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border shadow-sm h-100 bg-white p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaUsers className="text-success" />
                    <span className="fw-semibold text-dark">Employee Capacity</span>
                  </div>
                  <span className="fw-bold text-dark">{usedEmployees} / {subscription.maxEmployees}</span>
                </div>
                <ProgressBar now={empPercent} variant={empPercent > 80 ? "warning" : "success"} style={{ height: 8 }} />
                <div className="small text-muted mt-2 d-flex justify-content-between">
                  <span>{subscription.maxEmployees - usedEmployees} slots available</span>
                  <span>{empPercent}% used</span>
                </div>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border shadow-sm h-100 bg-white p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaHdd className="text-info" />
                    <span className="fw-semibold text-dark">Cloud Storage</span>
                  </div>
                  <span className="fw-bold text-dark">{usedStorageGB} GB / {subscription.maxStorageGB} GB</span>
                </div>
                <ProgressBar now={storagePercent} variant="info" style={{ height: 8 }} />
                <div className="small text-muted mt-2 d-flex justify-content-between">
                  <span>Documents & Receipts</span>
                  <span>{storagePercent}% used</span>
                </div>
              </Card>
            </Col>
          </Row>

          {/* ── Included Enterprise Features ── */}
          <Card className="border shadow-sm bg-white">
            <Card.Header className="bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <FaShieldAlt className="text-success" /> Included Plan Capabilities & Feature Matrix
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                {subscription.features.map((feature, i) => (
                  <Col md={6} key={i}>
                    <div className="d-flex align-items-center gap-2 p-2 bg-light rounded border">
                      <FaCheckCircle className="text-success flex-shrink-0" />
                      <span className="small fw-semibold text-dark">{feature}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
