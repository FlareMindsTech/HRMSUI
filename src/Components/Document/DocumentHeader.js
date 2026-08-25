import React from "react";
import { Card, Row, Col, Button, Form, Badge } from "react-bootstrap";
import {
  FaFolderOpen,
  FaPlus,
  FaTrash,
  FaSync,
  FaUserTie,
  FaEye,
  FaEdit,
  FaShieldAlt,
} from "react-icons/fa";

const DocumentHeader = ({
  employees,
  selectedUserId,
  onSelectUser,
  isHrOrAdmin,
  loading,
  hasRecord,
  isEditMode,
  setIsEditMode,
  onRefresh,
  onCreateNew,
  onDeleteRecord,
  selectedEmployeeName,
}) => {
  return (
    <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden bg-white">
      <div
        style={{
          height: 6,
          background: "linear-gradient(90deg, #10B981 0%, #059669 50%, #047857 100%)",
        }}
      />
      <Card.Body className="p-4">
        <Row className="align-items-center g-3">
          <Col lg={6} md={12}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                style={{
                  width: 52,
                  height: 52,
                  background: "linear-gradient(135deg, #E6F4EA 0%, #CEEAD6 100%)",
                  color: "#137333",
                  fontSize: 24,
                }}
              >
                <FaFolderOpen />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h4 className="fw-bold text-dark mb-0">Documents & Bank Details</h4>
                  <Badge
                    bg={hasRecord ? "success-subtle" : "warning-subtle"}
                    className={`border ${
                      hasRecord
                        ? "text-success border-success-subtle"
                        : "text-warning-emphasis border-warning-subtle"
                    } px-2.5 py-1 rounded-pill extra-small`}
                  >
                    {hasRecord ? "Record Active" : "No Document Record"}
                  </Badge>
                  {isHrOrAdmin && (
                    <Badge bg="secondary-subtle" className="text-secondary border px-2 py-1 rounded-pill extra-small d-flex align-items-center gap-1">
                      <FaShieldAlt className="text-primary" /> HR / Admin Access
                    </Badge>
                  )}
                </div>
                <p className="text-muted small mb-0 mt-1">
                  Manage employee banking, identity, statutory information, and uploaded employment documents.
                </p>
              </div>
            </div>
          </Col>

          <Col lg={6} md={12}>
            <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
              {/* Employee Selector for HR/Admin */}
              {isHrOrAdmin && employees && employees.length > 0 && (
                <div className="d-flex align-items-center gap-2">
                  <span className="extra-small text-muted fw-bold text-uppercase d-none d-sm-inline">
                    <FaUserTie className="me-1" /> Employee:
                  </span>
                  <Form.Select
                    size="sm"
                    className="rounded-3 border-secondary-subtle fw-semibold"
                    style={{ minWidth: 210, fontSize: "0.825rem" }}
                    value={selectedUserId || ""}
                    onChange={(e) => onSelectUser(e.target.value)}
                    disabled={loading}
                  >
                    {employees.map((emp) => (
                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              )}

              {/* Refresh */}
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-pill px-3 d-flex align-items-center gap-1 extra-small shadow-xs"
                onClick={onRefresh}
                disabled={loading}
                title="Reload Document Data"
              >
                <FaSync className={loading ? "fa-spin" : ""} />
                <span className="d-none d-sm-inline">Refresh</span>
              </Button>

              {/* Toggle View / Edit Mode */}
              {hasRecord && (
                <Button
                  variant={isEditMode ? "success" : "outline-success"}
                  size="sm"
                  className="rounded-pill px-3 d-flex align-items-center gap-1 extra-small shadow-xs"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? (
                    <>
                      <FaEye /> View Mode
                    </>
                  ) : (
                    <>
                      <FaEdit /> Edit Mode
                    </>
                  )}
                </Button>
              )}

              {/* Create new record if missing */}
              {!hasRecord && (
                <Button
                  variant="success"
                  size="sm"
                  className="rounded-pill px-3 d-flex align-items-center gap-1 extra-small shadow-xs text-white"
                  onClick={onCreateNew}
                >
                  <FaPlus /> Add Document Record
                </Button>
              )}

              {/* Delete record for Admin */}
              {hasRecord && isHrOrAdmin && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="rounded-pill px-2.5 extra-small shadow-xs"
                  onClick={onDeleteRecord}
                  title="Delete Document Record"
                >
                  <FaTrash />
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default DocumentHeader;
