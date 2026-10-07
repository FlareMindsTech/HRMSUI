import React, { useRef } from "react";
import {
  FaFileUpload,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaTrashAlt,
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

  const getDocVisual = (urlOrName = "") => {
    const lower = urlOrName.toLowerCase();
    if (lower.endsWith(".pdf")) {
      return {
        icon: <FaFilePdf size={22} color="#DC2626" />,
        bg: "rgba(239, 68, 68, 0.1)",
        border: "rgba(239, 68, 68, 0.28)",
        typeLabel: "PDF",
      };
    }
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
      return {
        icon: <FaFileImage size={22} color="#2563EB" />,
        bg: "rgba(37, 99, 235, 0.1)",
        border: "rgba(37, 99, 235, 0.28)",
        typeLabel: "IMG",
      };
    }
    return {
      icon: <FaFileAlt size={22} color="#9B7229" />,
      bg: "rgba(196, 154, 85, 0.14)",
      border: "rgba(196, 154, 85, 0.35)",
      typeLabel: "DOC",
    };
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
    <div className="mt-3">
      {/* Label / Topic Header */}
      <div
        className="d-flex align-items-center justify-content-between"
        style={{ marginBottom: "10px" }}
      >
        <label
          className="form-label extra-small fw-bold text-dark mb-0 text-uppercase"
          style={{ fontSize: "11.5px", letterSpacing: "0.5px" }}
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
        {docUrl && !file && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#166534",
              background: "rgba(22, 101, 52, 0.09)",
              border: "1px solid rgba(22, 101, 52, 0.25)",
              padding: "2px 10px",
              borderRadius: "9999px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FaCheckCircle size={11} color="#166534" /> Document Attached
          </span>
        )}
      </div>

      {/* State 1: When a new file is chosen in this session */}
      {file ? (
        (() => {
          const visual = getDocVisual(file.name);
          return (
            <div
              className="rounded-3 d-flex align-items-center justify-content-between flex-wrap transition-all"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #FAF7F0 100%)",
                border: "1px solid rgba(196, 154, 85, 0.38)",
                boxShadow: "0 2px 10px rgba(196, 154, 85, 0.08)",
                padding: "14px 18px",
                gap: "16px",
              }}
            >
              {/* Left file icon and details */}
              <div
                className="d-flex align-items-center text-truncate"
                style={{ maxWidth: "70%", gap: "14px" }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: visual.bg,
                    border: `1px solid ${visual.border}`,
                  }}
                >
                  {visual.icon}
                </div>
                <div
                  className="text-truncate"
                  style={{ display: "flex", flexDirection: "column", gap: "5px" }}
                >
                  <div
                    className="small fw-bold text-truncate"
                    style={{
                      color: "#1C1D1D",
                      letterSpacing: "-0.01em",
                      fontSize: "13.5px",
                      lineHeight: "1.3",
                    }}
                    title={file.name}
                  >
                    {file.name}
                  </div>
                  <div
                    className="d-flex align-items-center flex-wrap"
                    style={{ gap: "8px" }}
                  >
                    {file.size && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#555",
                          background: "#FFFFFF",
                          border: "1px solid rgba(0, 0, 0, 0.12)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        {formatFileSize(file.size)}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#9B7229",
                        background: "rgba(196, 154, 85, 0.15)",
                        border: "1px solid rgba(196, 154, 85, 0.35)",
                        padding: "2px 9px",
                        borderRadius: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FaCheckCircle size={11} color="#9B7229" /> Ready to upload
                    </span>
                  </div>
                </div>
              </div>

              {/* Right action buttons */}
              <div
                className="d-flex align-items-center flex-shrink-0"
                style={{ gap: "10px" }}
              >
                <button
                  type="button"
                  className="btn btn-sm d-inline-flex align-items-center transition-all"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#8C621E",
                    background: "#FFFFFF",
                    border: "1px solid rgba(196, 154, 85, 0.4)",
                    borderRadius: "9999px",
                    padding: "5px 14px",
                    gap: "6px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(196, 154, 85, 0.12)";
                    e.currentTarget.style.borderColor = "#C49A55";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.borderColor = "rgba(196, 154, 85, 0.4)";
                  }}
                >
                  <FaSyncAlt size={11} /> Replace
                </button>

                <button
                  type="button"
                  className="btn btn-sm d-inline-flex align-items-center justify-content-center transition-all"
                  style={{
                    fontSize: "12px",
                    color: "#DC2626",
                    background: "#FFF5F5",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "9999px",
                    padding: "5px 12px",
                  }}
                  title="Remove File"
                  onClick={onFileRemove}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FEE2E2";
                    e.currentTarget.style.borderColor = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFF5F5";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                  }}
                >
                  <FaTrashAlt size={12} />
                </button>
              </div>
            </div>
          );
        })()
      ) : docUrl ? (
        /* State 2: When an existing document exists on the backend */
        (() => {
          const visual = getDocVisual(docUrl);
          return (
            <div
              className="rounded-3 d-flex align-items-center justify-content-between flex-wrap transition-all"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #FAF7F0 100%)",
                border: "1px solid rgba(196, 154, 85, 0.32)",
                boxShadow: "0 2px 8px rgba(196, 154, 85, 0.06)",
                padding: "14px 18px",
                gap: "16px",
              }}
            >
              <div
                className="d-flex align-items-center text-truncate"
                style={{ maxWidth: "65%", gap: "14px" }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: visual.bg,
                    border: `1px solid ${visual.border}`,
                  }}
                >
                  {visual.icon}
                </div>
                <div
                  className="text-truncate"
                  style={{ display: "flex", flexDirection: "column", gap: "5px" }}
                >
                  <div
                    className="small fw-bold text-truncate"
                    style={{ color: "#1C1D1D", fontSize: "13.5px" }}
                    title={getFileName(docUrl)}
                  >
                    {getFileName(docUrl)}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#166534",
                        background: "rgba(22, 101, 52, 0.08)",
                        border: "1px solid rgba(22, 101, 52, 0.2)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        display: "inline-block",
                      }}
                    >
                      Stored in HRMS Records
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="d-flex align-items-center flex-shrink-0"
                style={{ gap: "8px" }}
              >
                <a
                  href={fullDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm d-inline-flex align-items-center transition-all"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1C1D1D",
                    background: "linear-gradient(135deg, #E2C278 0%, #C49A55 100%)",
                    border: "1px solid #C49A55",
                    borderRadius: "9999px",
                    padding: "5px 14px",
                    gap: "5px",
                    textDecoration: "none",
                  }}
                >
                  <FaEye size={12} /> View
                </a>
                <a
                  href={fullDocUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm d-inline-flex align-items-center transition-all"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#555",
                    background: "#FFFFFF",
                    border: "1px solid rgba(0, 0, 0, 0.15)",
                    borderRadius: "9999px",
                    padding: "5px 14px",
                    gap: "5px",
                    textDecoration: "none",
                  }}
                >
                  <FaDownload size={11} /> Download
                </a>
                <button
                  type="button"
                  className="btn btn-sm d-inline-flex align-items-center transition-all"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#8C621E",
                    background: "#FFFFFF",
                    border: "1px solid rgba(196, 154, 85, 0.4)",
                    borderRadius: "9999px",
                    padding: "5px 14px",
                    gap: "5px",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(196, 154, 85, 0.12)";
                    e.currentTarget.style.borderColor = "#C49A55";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.borderColor = "rgba(196, 154, 85, 0.4)";
                  }}
                >
                  <FaSyncAlt size={11} /> Replace
                </button>
              </div>
            </div>
          );
        })()
      ) : (
        /* State 3: Empty upload dropzone */
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload document. PDF, JPG, or PNG, maximum 10MB. Activate to browse files."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`rounded-3 text-center cursor-pointer transition-all ${
            error ? "border-danger bg-danger-subtle bg-opacity-10" : ""
          }`}
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAF7F0 100%)",
            border: error ? "1.5px dashed #DC2626" : "1.5px dashed rgba(196, 154, 85, 0.5)",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
            padding: "20px 16px",
            transition: "all 0.22s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#C49A55";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(196, 154, 85, 0.15)";
            e.currentTarget.style.background = "#FFFDF9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = error ? "#DC2626" : "rgba(196, 154, 85, 0.5)";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.02)";
            e.currentTarget.style.background = "linear-gradient(180deg, #FFFFFF 0%, #FAF7F0 100%)";
          }}
        >
          <div className="d-flex flex-column align-items-center justify-content-center py-1">
            <div
              className="rounded-circle p-2 mb-2 d-flex align-items-center justify-content-center"
              style={{
                width: "44px",
                height: "44px",
                background: "linear-gradient(135deg, rgba(226, 194, 120, 0.25) 0%, rgba(196, 154, 85, 0.25) 100%)",
                border: "1px solid rgba(196, 154, 85, 0.35)",
                color: "#9B7229",
              }}
            >
              <FaFileUpload size={20} />
            </div>
            <div className="small fw-bold text-dark mb-1">
              Click to browse or drag & drop document
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
