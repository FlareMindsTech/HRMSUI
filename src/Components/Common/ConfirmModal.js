import React from "react";
import { Modal, Button } from "react-bootstrap";
import LoadingSpinner from "./LoadingSpinner";

/**
 * ConfirmModal — shared delete/cancel confirmation dialog.
 *
 * Mirrors the centered delete-confirm `Modal` blocks repeated across the
 * app (all 14 org sections: JobGradesSection, TeamsSection,
 * DepartmentsSection, HolidayCalendarsSection, …) so call sites render
 * byte-identical markup to the inline modals they replace, and replaces
 * the blocking `window.confirm()` calls with the same accept/cancel
 * semantics in styled, testable chrome:
 *  - `Modal centered` + `Header closeButton` + danger title row
 *  - `Body` with the caller's exact message node
 *  - `Footer` with Cancel (secondary) + Confirm (danger, spinner while loading)
 *
 * Presentational only. Pending-item state, API calls, success/error
 * messages, permissions and all handlers stay with the caller — this
 * component only renders. The `loading` flag disables both buttons and
 * swaps the confirm label for the same small border spinner the inline
 * modals render today.
 *
 * Props (show + title + message + onConfirm + onClose required; rest optional):
 *  show              Modal visibility (caller-owned, e.g. showDeleteModal)
 *  title             title node (exact copy per site, e.g. <><FaTrash /> Delete Team</>)
 *  message           body node/string (exact copy per site, incl. <strong>{name}</strong>)
 *  onConfirm         confirm handler (stays owned by the caller)
 *  onClose           close handler (wired to Modal onHide + Cancel button)
 *  confirmLabel      confirm button text (default "Yes, Delete")
 *  cancelLabel       cancel button text (default "Cancel")
 *  confirmVariant    confirm Button variant (default "danger")
 *  cancelVariant     cancel Button variant (default "secondary")
 *  loading           bool — disables both buttons + spinner in confirm slot (default false)
 *  centered          Modal centered flag (default true — every site uses it)
 *  size              Modal size passthrough (all delete sites omit it)
 *  backdrop          Modal backdrop passthrough (delete sites omit it)
 *  keyboard          Modal keyboard passthrough
 *  dialogClassName   Modal dialogClassName passthrough
 *  titleClassName    Title classes (default "text-danger d-flex align-items-center gap-2")
 */
function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onClose,
  confirmLabel = "Yes, Delete",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  cancelVariant = "secondary",
  loading = false,
  centered = true,
  size,
  backdrop,
  keyboard,
  dialogClassName,
  titleClassName = "text-danger d-flex align-items-center gap-2",
}) {
  return (
    <Modal
      show={show}
      onHide={onClose}
      centered={centered}
      size={size}
      backdrop={backdrop}
      keyboard={keyboard}
      dialogClassName={dialogClassName}
    >
      <Modal.Header closeButton>
        <Modal.Title className={titleClassName}>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message}
      </Modal.Body>
      <Modal.Footer>
        <Button variant={cancelVariant} onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
          {loading ? <LoadingSpinner variant="button" size="sm" /> : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;
