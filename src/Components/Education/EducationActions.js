import React from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaSave, FaTimes, FaTrashAlt } from "react-icons/fa";

function EducationActions({
  isExisting = false,
  saving = false,
  onSave,
  onCancel,
  onDelete,
  canDelete = false,
}) {
  return (
    <div className="p-3.5 rounded-4 bg-white border border-light-subtle shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4">
      <div>
        {canDelete && (
          <Button
            variant="outline-danger"
            size="sm"
            className="rounded-pill px-3 py-1.5 extra-small fw-semibold"
            onClick={onDelete}
            disabled={saving}
          >
            <FaTrashAlt className="me-1" /> Delete Record
          </Button>
        )}
      </div>

      <div className="d-flex align-items-center gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-pill px-4 py-2 small fw-semibold"
          onClick={onCancel}
          disabled={saving}
        >
          <FaTimes className="me-1" /> Cancel
        </Button>

        <Button
          variant="dark"
          size="sm"
          className="rounded-pill px-4 py-2 small fw-semibold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #C49A55 0%, #B8860B 100%)", border: "none", color: "#1C1D1D" }}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Spinner size="sm" animation="border" className="me-1.5" />
              {isExisting ? "Updating..." : "Saving..."}
            </>
          ) : (
            <>
              <FaSave className="me-1.5" />
              {isExisting ? "Update Education" : "Save Education"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default EducationActions;
