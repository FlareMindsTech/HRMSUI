import React, { useState, useMemo } from "react";
import { Row, Col, Form, Badge, Button, InputGroup, Alert, Spinner } from "react-bootstrap";
import {
  FaBuilding,
  FaCodeBranch,
  FaCheckCircle,
  FaGlobeAmericas,
  FaSearch,
  FaTimes,
  FaExclamationCircle,
  FaStar,
} from "react-icons/fa";
import "./BranchAccessSelector.css";

/**
 * Reusable Branch Access Selector Component
 * 
 * Props:
 * - organization: Object or String (Organization details or name)
 * - accessLevel: "ORGANIZATION" | "BRANCH"
 * - primaryBranchId: String
 * - branchIds: Array of Strings
 * - branches: Array of branch objects [{ _id, branchName, branchCode, city, status }]
 * - onChange: Function({ accessLevel, primaryBranchId, branchIds })
 * - disabled: Boolean
 * - errors: Object { accessLevel, primaryBranchId, branchIds }
 * - loading: Boolean
 */
function BranchAccessSelector({
  organization = null,
  accessLevel = "ORGANIZATION",
  primaryBranchId = "",
  branchIds = [],
  branches = [],
  onChange = () => {},
  disabled = false,
  errors = {},
  loading = false,
  showTitle = true,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const orgName = typeof organization === "object" && organization !== null
    ? (organization.organizationName || organization.displayName || organization.legalName || "Organization")
    : (organization || "Organization");
  const orgCode = typeof organization === "object" && organization !== null
    ? (organization.organizationCode || "")
    : "";

  // Handle Access Level Change
  const handleAccessLevelSelect = (level) => {
    if (disabled) return;
    if (level === "ORGANIZATION") {
      onChange({
        accessLevel: "ORGANIZATION",
        primaryBranchId: null,
        branchIds: [],
      });
    } else {
      // If switching to branch, set initial primary branch if available
      let initialPrimary = primaryBranchId;
      let initialBranchIds = Array.isArray(branchIds) ? [...branchIds] : [];
      if (!initialPrimary && branches.length > 0) {
        initialPrimary = String(branches[0]._id || branches[0].id);
      }
      if (initialPrimary && !initialBranchIds.includes(initialPrimary)) {
        initialBranchIds.push(initialPrimary);
      }
      onChange({
        accessLevel: "BRANCH",
        primaryBranchId: initialPrimary,
        branchIds: initialBranchIds,
      });
    }
  };

  // Handle Primary Branch Change
  const handlePrimaryBranchChange = (e) => {
    if (disabled) return;
    const selectedId = e.target.value;
    let nextBranchIds = Array.isArray(branchIds) ? [...branchIds] : [];
    if (selectedId && !nextBranchIds.includes(selectedId)) {
      nextBranchIds.push(selectedId);
    }
    onChange({
      accessLevel: "BRANCH",
      primaryBranchId: selectedId,
      branchIds: nextBranchIds,
    });
  };

  // Toggle Branch in Multi-Select
  const handleBranchToggle = (branchId) => {
    if (disabled) return;
    const bIdStr = String(branchId);
    let nextBranchIds = Array.isArray(branchIds) ? [...branchIds] : [];
    
    if (nextBranchIds.includes(bIdStr)) {
      // Removing branch
      nextBranchIds = nextBranchIds.filter((id) => id !== bIdStr);
      // If removing primary branch, reset primary branch
      let nextPrimary = primaryBranchId;
      if (primaryBranchId === bIdStr) {
        nextPrimary = nextBranchIds.length > 0 ? nextBranchIds[0] : "";
      }
      onChange({
        accessLevel: "BRANCH",
        primaryBranchId: nextPrimary,
        branchIds: nextBranchIds,
      });
    } else {
      // Adding branch
      nextBranchIds.push(bIdStr);
      let nextPrimary = primaryBranchId || bIdStr;
      onChange({
        accessLevel: "BRANCH",
        primaryBranchId: nextPrimary,
        branchIds: nextBranchIds,
      });
    }
  };

  // Select All Active Branches
  const handleSelectAll = () => {
    if (disabled || branches.length === 0) return;
    const allIds = branches.map((b) => String(b._id || b.id));
    const nextPrimary = primaryBranchId && allIds.includes(primaryBranchId) ? primaryBranchId : allIds[0];
    onChange({
      accessLevel: "BRANCH",
      primaryBranchId: nextPrimary,
      branchIds: allIds,
    });
  };

  // Clear All
  const handleClearAll = () => {
    if (disabled) return;
    onChange({
      accessLevel: "BRANCH",
      primaryBranchId: "",
      branchIds: [],
    });
  };

  // Filtered branches for search
  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return branches;
    const q = searchTerm.toLowerCase().trim();
    return branches.filter((b) => {
      const name = (b.branchName || "").toLowerCase();
      const code = (b.branchCode || "").toLowerCase();
      const city = (b.city || "").toLowerCase();
      return name.includes(q) || code.includes(q) || city.includes(q);
    });
  }, [branches, searchTerm]);

  const isBranchSpecific = accessLevel === "BRANCH";

  return (
    <div className="branch-access-selector-card">
      {showTitle && (
        <div className="branch-access-header-wrap mb-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <FaCodeBranch className="text-success" /> Organization & Branch Access Control
              </h6>
              <p className="extra-small text-muted mb-0">
                Define the administrative and operational branch boundary for this user.
              </p>
            </div>
            {orgName && (
              <Badge bg="light" text="dark" className="border px-2.5 py-1.5 rounded-pill d-flex align-items-center gap-1.5">
                <FaBuilding className="text-primary" size={11} />
                <span className="fw-bold">{orgName}</span>
                {orgCode && <span className="text-muted font-monospace ms-1">({orgCode})</span>}
              </Badge>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 text-muted">
          <Spinner animation="border" size="sm" variant="success" className="me-2" />
          <span className="small">Loading organizational branch hierarchy...</span>
        </div>
      ) : (
        <div className="branch-access-body">
          {/* ── 1. Access Level Cards (Radio Selection) ── */}
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-dark mb-2">
              Access Level <span className="text-danger">*</span>
            </Form.Label>
            <Row className="g-3">
              {/* Card 1: Organization-wide */}
              <Col md={6}>
                <div
                  className={`access-level-card ${!isBranchSpecific ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                  onClick={() => !disabled && handleAccessLevelSelect("ORGANIZATION")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="access-level-radio">
                      <div className={`radio-indicator ${!isBranchSpecific ? "checked" : ""}`} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <FaGlobeAmericas className={!isBranchSpecific ? "text-success" : "text-muted"} size={14} />
                        <span className="fw-bold text-dark small">Organization-wide</span>
                      </div>
                      <p className="extra-small text-muted mb-0">
                        Access all present and future branches across the organization.
                      </p>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Card 2: Branch-specific */}
              <Col md={6}>
                <div
                  className={`access-level-card ${isBranchSpecific ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                  onClick={() => !disabled && handleAccessLevelSelect("BRANCH")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="access-level-radio">
                      <div className={`radio-indicator ${isBranchSpecific ? "checked" : ""}`} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <FaCodeBranch className={isBranchSpecific ? "text-success" : "text-muted"} size={14} />
                        <span className="fw-bold text-dark small">Branch-specific</span>
                      </div>
                      <p className="extra-small text-muted mb-0">
                        Restrict visibility and actions to specific authorized branch locations.
                      </p>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
            {errors.accessLevel && (
              <div className="text-danger extra-small mt-1 d-flex align-items-center gap-1">
                <FaExclamationCircle size={10} /> {errors.accessLevel}
              </div>
            )}
          </Form.Group>

          {/* ── 2. Branch-specific Configuration (Revealed when Branch-specific is selected) ── */}
          {isBranchSpecific && (
            <div className="branch-specific-panel p-3.5 bg-light rounded-3 border mb-3">
              {branches.length === 0 ? (
                <Alert variant="warning" className="small py-2 mb-0">
                  <FaExclamationCircle className="me-1.5" /> No branches configured for this organization yet. Please add a branch in the Organisation section.
                </Alert>
              ) : (
                <>
                  {/* Primary Branch Dropdown */}
                  <Form.Group className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <Form.Label className="small fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                        <FaStar className="text-warning" size={12} /> Primary Branch / Base Location <span className="text-danger">*</span>
                      </Form.Label>
                      <span className="extra-small text-muted">Primary workplace for attendance & payroll</span>
                    </div>
                    <Form.Select
                      size="sm"
                      value={primaryBranchId || ""}
                      onChange={handlePrimaryBranchChange}
                      disabled={disabled}
                      className={`shadow-none branch-select-ctrl ${errors.primaryBranchId ? "is-invalid" : ""}`}
                    >
                      <option value="">-- Select Primary Branch --</option>
                      {branches.map((b) => (
                        <option key={b._id || b.id} value={b._id || b.id}>
                          {b.branchName} ({b.branchCode}) {b.city ? `— ${b.city}` : ""}
                        </option>
                      ))}
                    </Form.Select>
                    {errors.primaryBranchId && (
                      <div className="invalid-feedback extra-small d-block mt-1">
                        <FaExclamationCircle size={10} className="me-1" />
                        {errors.primaryBranchId}
                      </div>
                    )}
                  </Form.Group>

                  {/* Multi-select Branch Access Checklist */}
                  <Form.Group className="mb-0">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                      <div>
                        <Form.Label className="small fw-bold text-dark mb-0">
                          Branch Access Permissions <span className="text-danger">*</span>
                        </Form.Label>
                        <span className="extra-small text-muted ms-2">
                          ({branchIds.length} of {branches.length} authorized)
                        </span>
                      </div>
                      {!disabled && branches.length > 1 && (
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 extra-small text-success text-decoration-none fw-semibold"
                            onClick={handleSelectAll}
                          >
                            Select All
                          </Button>
                          <span className="text-muted extra-small">•</span>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 extra-small text-muted text-decoration-none"
                            onClick={handleClearAll}
                          >
                            Clear All
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Search Bar for Branches if > 4 */}
                    {branches.length > 4 && (
                      <div className="mb-2">
                        <InputGroup size="sm">
                          <InputGroup.Text className="bg-white border-end-0 text-muted">
                            <FaSearch size={11} />
                          </InputGroup.Text>
                          <Form.Control
                            type="search"
                            placeholder="Filter branches by name, code, or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-start-0 shadow-none extra-small"
                          />
                          {searchTerm && (
                            <Button
                              variant="light"
                              className="border border-start-0"
                              onClick={() => setSearchTerm("")}
                            >
                              <FaTimes size={10} className="text-muted" />
                            </Button>
                          )}
                        </InputGroup>
                      </div>
                    )}

                    {/* Checkbox List */}
                    <div className="branch-checklist-scroll">
                      <Row className="g-2">
                        {filteredBranches.map((branch) => {
                          const bId = String(branch._id || branch.id);
                          const isChecked = branchIds.includes(bId);
                          const isPrimary = String(primaryBranchId) === bId;

                          return (
                            <Col sm={6} key={bId}>
                              <div
                                className={`branch-check-item ${isChecked ? "checked" : ""} ${isPrimary ? "primary-item" : ""} ${disabled ? "disabled" : ""}`}
                                onClick={() => !disabled && handleBranchToggle(bId)}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="d-flex align-items-center justify-content-between gap-2 min-w-0">
                                  <div className="d-flex align-items-center gap-2 min-w-0">
                                    <Form.Check
                                      type="checkbox"
                                      id={`branch-chk-${bId}`}
                                      checked={isChecked}
                                      onChange={() => {}} // Handled by parent container click
                                      disabled={disabled}
                                      className="branch-custom-check"
                                    />
                                    <div className="min-w-0">
                                      <div className="fw-semibold text-dark small text-truncate">
                                        {branch.branchName}
                                      </div>
                                      <div className="extra-small text-muted font-monospace">
                                        {branch.branchCode} {branch.city ? `• ${branch.city}` : ""}
                                      </div>
                                    </div>
                                  </div>
                                  {isPrimary && (
                                    <Badge bg="warning" text="dark" className="extra-small px-2 py-0.5 rounded-pill flex-shrink-0">
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>

                    {errors.branchIds && (
                      <div className="text-danger extra-small mt-2 d-flex align-items-center gap-1">
                        <FaExclamationCircle size={10} /> {errors.branchIds}
                      </div>
                    )}
                  </Form.Group>
                </>
              )}
            </div>
          )}

          {/* Info pill for Organization-wide mode */}
          {!isBranchSpecific && (
            <div className="p-2.5 bg-light rounded-3 border d-flex align-items-center gap-2">
              <FaCheckCircle className="text-success flex-shrink-0" size={13} />
              <span className="extra-small text-muted">
                User will have unrestricted access across all existing ({branches.length}) and newly created branches.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BranchAccessSelector;
