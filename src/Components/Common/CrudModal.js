import React from "react";
import { Modal, Form, Button } from "react-bootstrap";
import FeedbackAlert from "./FeedbackAlert";
import LoadingSpinner from "./LoadingSpinner";

/**
 * CrudModal — shared shell for the organisation CRUD (create/edit) modals.
 *
 * Mirrors the byte-identical modal chrome repeated across the Organisation
 * sections (JobGrades, Departments, Teams, Locations, ReportingHierarchy,
 * Designations, CostCenters, FinancialYears, Shifts, WorkCalendars,
 * HolidayCalendars ×2) so call sites render byte-identical markup to the
 * inline modals they replace:
 *  - `Modal size="lg" centered backdrop="static"` + `Form onSubmit` wrapper
 *  - plain `Header closeButton` + `Title d-flex align-items-center gap-2`
 *  - plain `Body` with the `FeedbackAlert danger` error slot first
 *  - plain `Footer` with Cancel (secondary) + Save (success submit, spinner)
 *
 * Presentational shell only: fields, field layout, validation, form state,
 * API calls, permission checks, submit handlers and all business logic stay
 * with the caller and render as `children`. Other modal dialects (staff
 * assignment, access configuration, CRUD modals outside Organisation) are
 * intentionally not covered.
 *
 * Props (show + onClose + title + onSubmit + children required):
 *  show         Modal visibility (caller-owned, e.g. showModal)
 *  onClose      close handler (wired to Modal onHide + Cancel button)
 *  title        title node, exact copy per site (icon + Add/Edit text)
 *  onSubmit     form submit handler (stays owned by the caller)
 *  saving       bool — disables both buttons + spinner in save slot
 *  saveLabel    save button text (exact copy per site, e.g. "Save Grade")
 *  modalError   error message for the danger slot (renders null when falsy)
 *  children     field grid (exact copy per site)
 */
function CrudModal({
  show,
  onClose,
  title,
  onSubmit,
  saving = false,
  saveLabel = "Save",
  modalError,
  children,
}) {
  return (
    <Modal show={show} onHide={onClose} size="lg" centered backdrop="static">
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FeedbackAlert variant="danger" message={modalError} />
          {children}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="success" type="submit" disabled={saving}>
            {saving ? <LoadingSpinner variant="button" size="sm" /> : saveLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default CrudModal;
