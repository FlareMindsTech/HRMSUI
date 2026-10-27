import React from "react";
import { Modal } from "react-bootstrap";
import Button from "./Button";

/**
 * ConfirmModal — shared delete/cancel confirmation dialog.
 *
 * Rules:
 * - Width: 480px default (.modal-ui-confirm)
 * - Header (danger/warning title + close), body, fixed footer
 * - Footer with [Cancel secondary] on left of [Confirm danger-filled] on the right
 * - Tokens only (no hex, no !important)
 */
function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onClose,
  confirmLabel = "Yes, Delete",
  cancelLabel = "Cancel",
  confirmVariant = "danger-filled",
  cancelVariant = "secondary",
  loading = false,
  centered = true,
  backdrop = "static",
  keyboard = true,
  dialogClassName = "",
  titleClassName = "text-danger d-flex align-items-center gap-2",
}) {
  const modalDialogClassName = ["modal-ui-confirm", dialogClassName].filter(Boolean).join(" ");

  // Normalise confirmVariant: if caller passes "danger", use "danger-filled" for delete confirm dialog
  const resolvedConfirmVariant = confirmVariant === "danger" ? "danger-filled" : confirmVariant;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      dialogClassName={modalDialogClassName}
    >
      <Modal.Header closeButton>
        <Modal.Title className={titleClassName}>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        {message}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={cancelVariant}
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={resolvedConfirmVariant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;
