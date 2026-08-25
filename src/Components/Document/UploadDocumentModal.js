import React, { useState } from "react";
import { Modal, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { FaFileUpload, FaCloudUploadAlt, FaFilePdf, FaFileImage } from "react-icons/fa";

export const DOCUMENT_CATEGORIES = [
  { value: "OFFER_LETTER", label: "Offer Letter" },
  { value: "JOINING_DOC", label: "Joining Document" },
  { value: "ID_PROOF", label: "ID Proof" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "EXPERIENCE_LETTER", label: "Experience Letter" },
  { value: "PAYSLIP", label: "Payslip" },
  { value: "RELIEVING_LETTER", label: "Relieving Letter" },
  { value: "EXIT_DOC", label: "Exit Document" },
  { value: "OTHER", label: "Other" },
];

const UploadDocumentModal = ({
  show,
  onHide,
  onUpload,
  uploading,
}) => {
  const [category, setCategory] = useState("OFFER_LETTER");
  const [title, setTitle] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrlInput, setFileUrlInput] = useState("");
  const [useUrlMode, setUseUrlMode] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit");
        return;
      }
      setSelectedFile(file);
      setError("");
      if (!title) {
        // Auto populate title from file name without extension
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanTitle);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category) {
      setError("Please select a document category");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a document title");
      return;
    }
    if (!useUrlMode && !selectedFile) {
      setError("Please select a file to upload");
      return;
    }
    if (useUrlMode && !fileUrlInput.trim()) {
      setError("Please provide a valid document URL");
      return;
    }

    setError("");

    // Generate local blob / data URL or pass file
    let finalUrl = fileUrlInput.trim();
    if (selectedFile) {
      finalUrl = URL.createObjectURL(selectedFile);
    }

    onUpload({
      category,
      title: title.trim(),
      fileUrl: finalUrl,
      file: selectedFile,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      verificationStatus: "PENDING",
    });

    // Reset
    setTitle("");
    setSelectedFile(null);
    setFileUrlInput("");
    setExpiryDate("");
    setCategory("OFFER_LETTER");
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" className="rounded-4">
      <Modal.Header closeButton className="border-bottom py-3 px-4">
        <Modal.Title className="h6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <FaFileUpload className="text-success" /> Upload Employee Document
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {error && (
            <Alert variant="danger" className="py-2 px-3 extra-small mb-3">
              {error}
            </Alert>
          )}

          <Row className="g-3 mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                  Document Category *
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="fw-semibold"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} ({cat.value})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                  Document Title *
                </Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Signed Offer Letter 2026, Degree Certificate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="extra-small fw-bold text-dark text-uppercase">
                  Expiry Date (Optional)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="extra-small fw-bold text-dark text-uppercase mb-0">
                  {useUrlMode ? "Document Link / URL *" : "Choose Document File *"}
                </Form.Label>
                <span
                  className="extra-small text-primary cursor-pointer fw-semibold text-decoration-underline"
                  onClick={() => setUseUrlMode(!useUrlMode)}
                >
                  {useUrlMode ? "Upload File instead" : "Paste URL link instead"}
                </span>
              </div>

              {useUrlMode ? (
                <Form.Control
                  size="sm"
                  type="url"
                  placeholder="https://storage.company.com/docs/file.pdf"
                  value={fileUrlInput}
                  onChange={(e) => setFileUrlInput(e.target.value)}
                />
              ) : (
                <div
                  className="border border-2 border-dashed rounded-3 p-3 text-center bg-light cursor-pointer position-relative"
                  style={{ borderColor: selectedFile ? "#10B981" : "#D1D5DB" }}
                >
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <div className="py-2">
                    <FaCloudUploadAlt className="text-success fs-2 mb-2" />
                    {selectedFile ? (
                      <div>
                        <div className="fw-bold small text-dark d-flex align-items-center justify-content-center gap-1">
                          {selectedFile.type.includes("pdf") ? <FaFilePdf className="text-danger" /> : <FaFileImage className="text-primary" />}
                          {selectedFile.name}
                        </div>
                        <div className="extra-small text-muted mt-0.5">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="fw-semibold small text-dark">Click or Drag & Drop Document</div>
                        <div className="extra-small text-muted mt-0.5">Supports PDF, PNG, JPG, DOC (Max 10MB)</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top py-2.5 px-4 d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" size="sm" className="rounded-pill px-3 extra-small" onClick={onHide} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="success" size="sm" type="submit" className="rounded-pill px-4 extra-small" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UploadDocumentModal;
