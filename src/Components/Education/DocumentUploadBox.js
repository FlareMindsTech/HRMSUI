import React, { useRef } from "react";
import { Button, Badge } from "react-bootstrap";
import {
  FaFileUpload,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaTrash,
  FaSyncAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";

function DocumentUploadBox({
  label = "Upload Certificate / Marksheet",
  docUrl = "",
  file = null,
  onFileChange,
  onFileRemove,
  fieldName = "document",
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
  error = "",
}) {
  const fileInputRef = useRef(null);

  // Format document URL if relative
  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}/${url.replace(/^\/+/, "")}`;
  };

  const fullDocUrl = getFullUrl(docUrl);

  const getDocIcon = (urlOrName = "") => {
    const lower = urlOrName.toLowerCase();
    if (lower.endsWith(".pdf")) return <FaFilePdf className="text-danger" size={20} />;
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return <FaFileImage className="text-primary" size={20} />;
    }
    return <FaFileAlt className="text-success" size={20} />;
  };

  const getFileName = (url = "") => {
    if (!url) return "Certificate Document";
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "Certificate Document";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="mt-2">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <label className="form-label extra-small fw-bold text-dark mb-0">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        {docUrl && (
          <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small py-1 px-2 rounded-pill">
            <FaCheckCircle className="me-1" /> Document Attached
          </Badge>
        )}
      </div>

      {/* When a new file is chosen in this session */}
      {file ? (
        <div className="p-2.5 rounded-3 bg-white border border-success border-opacity-50 d-flex align-items-center justify-content-between flex-wrap gap-2 shadow-xs">
          <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: "70%" }}>
            {getDocIcon(file.name)}
            <div className="text-truncate">
              <div className="small fw-semibold text-dark text-truncate">{file.name}</div>
              <span className="extra-small text-muted">{formatFileSize(file.size)} • Ready to upload</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="py-0 px-2 extra-small rounded-pill"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaSyncAlt className="me-1" /> Replace
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              className="py-0 px-2 extra-small rounded-pill"
              onClick={onFileRemove}
            >
              <FaTrash />
            </Button>
          </div>
        </div>
      ) : docUrl ? (
        /* When an existing document exists on the backend */
        <div className="p-2.5 rounded-3 bg-light border border-secondary-subtle d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: "65%" }}>
            {getDocIcon(docUrl)}
            <div className="text-truncate">
              <div className="small fw-semibold text-dark text-truncate">{getFileName(docUrl)}</div>
              <span className="extra-small text-muted">Stored in HRMS Records</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <a
              href={fullDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill d-inline-flex align-items-center"
            >
              <FaEye className="me-1" /> View
            </a>
            <a
              href={fullDocUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary btn-sm py-0 px-2 extra-small rounded-pill d-inline-flex align-items-center"
            >
              <FaDownload className="me-1" /> Download
            </a>
            <Button
              variant="outline-success"
              size="sm"
              className="py-0 px-2 extra-small rounded-pill"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaSyncAlt className="me-1" /> Replace
            </Button>
          </div>
        </div>
      ) : (
        /* Empty upload state */
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-3 rounded-3 text-center cursor-pointer transition-all bg-white border border-2 border-dashed ${
            error ? "border-danger bg-danger-subtle bg-opacity-10" : "border-secondary-subtle hover-border-success"
          }`}
          style={{
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
        >
          <div className="d-flex flex-column align-items-center justify-content-center py-1">
            <div
              className="rounded-circle p-2 mb-1.5 d-flex align-items-center justify-content-center"
              style={{ background: "rgba(45, 197, 138, 0.12)", color: "#2DC58A" }}
            >
              <FaFileUpload size={18} />
            </div>
            <div className="small fw-semibold text-dark mb-0.5">
              Click to browse or drag & drop certificate
            </div>
            <div className="extra-small text-muted">Supports PDF, JPG, PNG (Max 10MB)</div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        name={fieldName}
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) {
            onFileChange(picked);
          }
          e.target.value = "";
        }}
      />

      {error && <div className="text-danger extra-small mt-1">{error}</div>}
    </div>
  );
}

export default DocumentUploadBox;
