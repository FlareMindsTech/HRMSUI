import React, { useState } from "react";
import { Card, Row, Col, Badge, Button, Modal } from "react-bootstrap";
import {
  FaFolderOpen,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";

function EducationDocuments({
  data = {},
  files = {},
}) {
  const [previewDoc, setPreviewDoc] = useState(null);

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}/${url.replace(/^\/+/, "")}`;
  };

  const documentSlots = [
    {
      id: "sslc",
      title: "SSLC / 10th Certificate",
      level: "Secondary (10th)",
      docUrl: data.sslcDocumentUrl || data.sslcDocument,
      file: files.sslcDocument,
      mandatory: true,
    },
    {
      id: "hsc",
      title: "HSC / 12th Certificate",
      level: "Higher Secondary (12th)",
      docUrl: data.hscDocumentUrl || data.hscDocument,
      file: files.hscDocument,
      mandatory: true,
    },
    {
      id: "iti",
      title: "ITI Certificate",
      level: "Vocational (ITI)",
      docUrl: data.itiDocumentUrl || data.itiDocument,
      file: files.itiDocument,
      mandatory: false,
    },
    {
      id: "diploma",
      title: "Diploma Certificate",
      level: "Polytechnic (Diploma)",
      docUrl: data.diplomaDocumentUrl || data.diplomaDocument,
      file: files.diplomaDocument,
      mandatory: false,
    },
    {
      id: "ug",
      title: "Undergraduate (UG) Degree",
      level: "Bachelor's Degree",
      docUrl: data.ugDocumentUrl || data.ugDocument,
      file: files.ugDocument,
      mandatory: true,
    },
    {
      id: "pg",
      title: "Postgraduate (PG) Degree",
      level: "Master's Degree",
      docUrl: data.pgDocumentUrl || data.pgDocument,
      file: files.pgDocument,
      mandatory: false,
    },
    {
      id: "phd",
      title: "PhD Degree Certificate",
      level: "Doctorate",
      docUrl: data.phdDocumentUrl || data.phdDocument,
      file: files.phdDocument,
      mandatory: false,
    },
  ];

  const getDocIcon = (urlOrName = "") => {
    const lower = urlOrName.toLowerCase();
    if (lower.endsWith(".pdf")) return <FaFilePdf className="text-danger" size={24} />;
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return <FaFileImage className="text-primary" size={24} />;
    }
    return <FaFileAlt className="text-success" size={24} />;
  };

  const handlePreview = (item) => {
    if (item.file) {
      const url = URL.createObjectURL(item.file);
      setPreviewDoc({
        title: item.title,
        url,
        isPdf: item.file.type.includes("pdf") || item.file.name.toLowerCase().endsWith(".pdf"),
        fileName: item.file.name,
      });
    } else if (item.docUrl) {
      const fullUrl = getFullUrl(item.docUrl);
      setPreviewDoc({
        title: item.title,
        url: fullUrl,
        isPdf: fullUrl.toLowerCase().endsWith(".pdf"),
        fileName: item.title,
      });
    }
  };

  return (
    <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
      <div className="p-3.5 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white"
            style={{ background: "linear-gradient(135deg, #E2C278 0%, #C49A55 50%, #B8860B 100%)", boxShadow: "0 2px 6px rgba(196, 154, 85, 0.28)" }}
          >
            <FaFolderOpen size={15} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-0">Education Documents & Certificates Portfolio</h6>
            <span className="extra-small text-muted">Consolidated certificate attachments repository</span>
          </div>
        </div>
      </div>

      <Card.Body className="p-4">
        <Row className="g-3">
          {documentSlots.map((item) => {
            const hasDoc = Boolean(item.file || item.docUrl);
            const fullUrl = item.docUrl ? getFullUrl(item.docUrl) : (item.file ? URL.createObjectURL(item.file) : "");

            return (
              <Col lg={4} md={6} xs={12} key={item.id}>
                <div
                  className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between transition-all"
                  style={{
                    background: hasDoc
                      ? "linear-gradient(135deg, #FFFFFF 0%, #FAF7F0 100%)"
                      : "#FFFFFF",
                    borderColor: hasDoc ? "rgba(196, 154, 85, 0.35)" : "rgba(0, 0, 0, 0.1)",
                    boxShadow: hasDoc ? "0 2px 8px rgba(196, 154, 85, 0.08)" : "none",
                  }}
                >
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="extra-small fw-bold text-muted text-uppercase">{item.level}</span>
                      {hasDoc ? (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: item.file ? "#9B7229" : "#166534",
                            background: item.file ? "rgba(196, 154, 85, 0.14)" : "rgba(22, 101, 52, 0.09)",
                            border: `1px solid ${item.file ? "rgba(196, 154, 85, 0.35)" : "rgba(22, 101, 52, 0.25)"}`,
                            padding: "2px 9px",
                            borderRadius: "9999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaCheckCircle size={10} color={item.file ? "#9B7229" : "#166534"} /> {item.file ? "Ready to Upload" : "Attached"}
                        </span>
                      ) : item.mandatory ? (
                        <Badge bg="danger-subtle" className="text-danger border border-danger-subtle extra-small rounded-pill">
                          <FaExclamationCircle className="me-1" /> Required
                        </Badge>
                      ) : (
                        <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle extra-small rounded-pill">
                          Optional
                        </Badge>
                      )}
                    </div>

                    <div className="d-flex align-items-center gap-2.5 my-2">
                      <div
                        className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "36px",
                          height: "36px",
                          background: "rgba(196, 154, 85, 0.12)",
                          border: "1px solid rgba(196, 154, 85, 0.25)",
                        }}
                      >
                        {getDocIcon(item.file?.name || item.docUrl || "")}
                      </div>
                      <div className="text-truncate">
                        <div className="small fw-bold text-dark text-truncate">{item.title}</div>
                        <span className="extra-small text-muted text-truncate d-block">
                          {item.file ? item.file.name : item.docUrl ? "Document in HRMS storage" : "No document attached"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {hasDoc && (
                    <div className="d-flex align-items-center gap-2 pt-2 border-top mt-2">
                      <button
                        type="button"
                        className="btn btn-sm py-1 px-2 extra-small rounded-pill flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1 fw-semibold"
                        style={{
                          background: "linear-gradient(135deg, #E2C278 0%, #C49A55 100%)",
                          color: "#1C1D1D",
                          border: "1px solid #C49A55",
                        }}
                        onClick={() => handlePreview(item)}
                      >
                        <FaEye size={11} /> View
                      </button>
                      {fullUrl && (
                        <a
                          href={fullUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-secondary btn-sm py-1 px-2 extra-small rounded-pill"
                        >
                          <FaDownload size={11} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </Card.Body>

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          show={Boolean(previewDoc)}
          onHide={() => setPreviewDoc(null)}
          size="lg"
          centered
          className="rounded-4"
        >
          <Modal.Header closeButton className="border-bottom p-3">
            <Modal.Title className="h6 fw-bold text-dark mb-0">
              <FaEye className="me-2 text-primary" /> {previewDoc.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-2 text-center" style={{ minHeight: "65vh" }}>
            {previewDoc.isPdf ? (
              <iframe
                src={previewDoc.url}
                title={previewDoc.title}
                width="100%"
                height="550px"
                className="border-0 rounded-3"
              />
            ) : (
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="img-fluid rounded-3 shadow-xs"
                style={{ maxHeight: "70vh", objectFit: "contain" }}
              />
            )}
          </Modal.Body>
          <Modal.Footer className="border-top p-2.5 d-flex justify-content-between">
            <a
              href={previewDoc.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-success btn-sm rounded-pill px-3 extra-small"
            >
              <FaDownload className="me-1" /> Download Certificate
            </a>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-pill px-3 extra-small"
              onClick={() => setPreviewDoc(null)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Card>
  );
}

export default EducationDocuments;
