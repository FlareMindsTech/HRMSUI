import React from "react";
import { Modal, Form } from "react-bootstrap";
import FeedbackAlert from "./FeedbackAlert";
import Button from "./Button";

/**
 * CrudModal — shared shell for the organisation CRUD (create/edit) modals.
 *
 * Rules:
 * - Width: 640px form default (.modal-ui-form), support 480 confirm (.modal-ui-confirm) or 960 wide (.modal-ui-wide)
 * - Header (title + close), body scrolls, header/footer fixed
 * - Footer with [Cancel secondary] on left of [Primary action] on the right
 * - Tokens only (no hex, no !important)
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
  width = 640,
  dialogClassName = "",
}) {
  const widthClass =
    width === 480
      ? "modal-ui-confirm"
      : width === 960
        ? "modal-ui-wide"
        : "modal-ui-form";

  const modalDialogClassName = [widthClass, dialogClassName].filter(Boolean).join(" ");

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      dialogClassName={modalDialogClassName}
    >
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <FeedbackAlert variant="danger" message={modalError} className="mb-3" />
          )}
          {children}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={saving}
          >
            {saveLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default CrudModal;
