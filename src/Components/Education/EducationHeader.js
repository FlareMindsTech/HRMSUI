import React from "react";
import { Row, Col, Form, Button, Badge } from "react-bootstrap";
import {
  FaGraduationCap,
  FaSyncAlt,
  FaEye,
  FaEdit,
  FaUserGraduate,
} from "react-icons/fa";

function EducationHeader({
  employees = [],
  selectedUserId = "",
  onSelectUser,
  currentEmployee = null,
  viewMode = "form", // "form" or "profile"
  onToggleViewMode,
  onRefresh,
  loading = false,
  isHrOrAdmin = false,
}) {
  return (
    <div className="p-4 rounded-4 bg-white border border-light-subtle shadow-sm mb-4">
      <Row className="align-items-center g-3">
        <Col lg={6} md={12}>
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 p-3 d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
              style={{
                background: "linear-gradient(135deg, #2DC58A 0%, #1a9e6e 100%)",
                width: 52,
                height: 52,
              }}
            >
              <FaGraduationCap size={26} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold text-dark mb-0">Education Management</h4>
                <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill extra-small px-2 py-1">
                  Academic & Certifications
                </Badge>
              </div>
              <p className="text-muted small mb-0 mt-1">
                Manage employee qualification records, marksheets, certificates, and HR verification status.
              </p>
            </div>
          </div>
        </Col>

        <Col lg={6} md={12}>
          <div className="d-flex align-items-center justify-content-lg-end gap-2 flex-wrap">
            {/* Employee Selector for HR / Admin */}
            {isHrOrAdmin && employees.length > 0 && (
              <div style={{ minWidth: 220, maxWidth: 280 }} className="flex-grow-1 flex-lg-grow-0">
                <Form.Select
                  size="sm"
                  className="rounded-pill border-secondary-subtle extra-small fw-semibold py-1.5 px-3"
                  value={selectedUserId || ""}
                  onChange={(e) => onSelectUser(e.target.value)}
                >
                  <option value="">Select Employee Record...</option>
                  {employees.map((emp) => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.designation || "Employee"})
                    </option>
                  ))}
                </Form.Select>
              </div>
            )}

            {/* View Mode Toggle: Form vs Profile */}
            <div className="btn-group rounded-pill p-1 bg-light border border-secondary-subtle">
              <Button
                variant={viewMode === "form" ? "success" : "light"}
                size="sm"
                className={`rounded-pill py-1 px-3 extra-small fw-semibold border-0 ${
                  viewMode === "form" ? "text-white shadow-xs" : "text-muted"
                }`}
                style={viewMode === "form" ? { background: "#2DC58A" } : {}}
                onClick={() => onToggleViewMode("form")}
              >
                <FaEdit className="me-1" /> Edit Form
              </Button>
              <Button
                variant={viewMode === "profile" ? "success" : "light"}
                size="sm"
                className={`rounded-pill py-1 px-3 extra-small fw-semibold border-0 ${
                  viewMode === "profile" ? "text-white shadow-xs" : "text-muted"
                }`}
                style={viewMode === "profile" ? { background: "#2DC58A" } : {}}
                onClick={() => onToggleViewMode("profile")}
              >
                <FaEye className="me-1" /> View Profile
              </Button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-circle p-2 d-flex align-items-center justify-content-center"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh Education Data"
            >
              <FaSyncAlt className={loading ? "spin-animation" : ""} size={13} />
            </Button>
          </div>
        </Col>
      </Row>

      {/* Selected Employee Info Strip */}
      {currentEmployee && (
        <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted extra-small">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border">
              <FaUserGraduate className="me-1 text-primary" />
              {currentEmployee.firstName} {currentEmployee.lastName}
            </span>
            <span>•</span>
            <span>{currentEmployee.email || "No email"}</span>
            <span>•</span>
            <span>{currentEmployee.department || "General"} ({currentEmployee.designation || "Employee"})</span>
          </div>
          {currentEmployee.employeeCode && (
            <span className="fw-semibold text-dark">Emp ID: {currentEmployee.employeeCode}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default EducationHeader;
