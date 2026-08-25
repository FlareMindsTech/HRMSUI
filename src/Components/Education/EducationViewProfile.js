import React from "react";
import { Card, Row, Col, Badge, Button, Table } from "react-bootstrap";
import {
  FaGraduationCap,
  FaSchool,
  FaTools,
  FaCertificate,
  FaUserGraduate,
  FaBook,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaDownload,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaEdit,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";

function EducationViewProfile({
  data = {},
  onEditClick,
  isHrOrAdmin = false,
}) {
  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}/${url.replace(/^\/+/, "")}`;
  };

  const getDocIcon = (url = "") => {
    const lower = url.toLowerCase();
    if (lower.endsWith(".pdf")) return <FaFilePdf className="text-danger" size={16} />;
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return <FaFileImage className="text-primary" size={16} />;
    }
    return <FaFileAlt className="text-success" size={16} />;
  };

  const hasITI = Boolean(data.itiinstituteName || data.iticourse);
  const hasDiploma = Boolean(data.diplomainstitution || data.diplomacourse);
  const hasPG = Boolean(data.pgInstituteName || data.pgDegree);
  const hasPhD = Boolean(data.phdInstituteName || data.phdResearchArea);

  return (
    <div>
      {/* Overview Top Card */}
      <Card className="border-0 rounded-4 shadow-sm mb-4 bg-white overflow-hidden">
        <div
          className="p-4 text-white d-flex align-items-center justify-content-between flex-wrap gap-3"
          style={{ background: "linear-gradient(135deg, #0f2a1e 0%, #154530 100%)" }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 p-3 text-white d-flex align-items-center justify-content-center"
              style={{ background: "rgba(45, 197, 138, 0.25)", border: "1px solid rgba(45, 197, 138, 0.4)" }}
            >
              <FaGraduationCap size={28} style={{ color: "#2DC58A" }} />
            </div>
            <div>
              <div className="extra-small text-uppercase tracking-wider" style={{ color: "#2DC58A" }}>
                Employee Educational Portfolio
              </div>
              <h5 className="fw-bold mb-0">Highest Qualification: {data.highestQualification || "UG"}</h5>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {data.isVerified ? (
              <Badge bg="success" className="px-3 py-2 rounded-pill fs-7 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm">
                <FaCheckCircle /> Authenticated & Verified
              </Badge>
            ) : (
              <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fs-7 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm">
                <FaClock /> Pending Verification
              </Badge>
            )}

            <Button
              variant="outline-light"
              size="sm"
              className="rounded-pill px-3 py-1.5 extra-small fw-semibold"
              onClick={onEditClick}
            >
              <FaEdit className="me-1" /> Edit Qualifications
            </Button>
          </div>
        </div>

        {data.remarks && (
          <div className="p-3 bg-light border-bottom d-flex align-items-center gap-2">
            <span className="badge bg-info-subtle text-info border border-info-subtle extra-small">HR Note</span>
            <span className="extra-small text-dark">{data.remarks}</span>
          </div>
        )}
      </Card>

      {/* Grid of Qualifications */}
      <Row className="g-4">
        {/* 1. SSLC */}
        <Col md={6} xs={12}>
          <Card className="border-0 rounded-4 shadow-sm h-100 bg-white overflow-hidden">
            <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaSchool className="text-success" />
                <span className="fw-bold text-dark small">SSLC (Secondary School Leaving Certificate)</span>
              </div>
              <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small rounded-pill">10th</Badge>
            </div>
            <Card.Body className="p-3.5">
              <Table borderless size="sm" className="mb-2 extra-small">
                <tbody>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ width: "40%" }}>School Name</td>
                    <td className="text-dark fw-bold">{data.sslcSchoolName || "—"}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Board</td>
                    <td className="text-dark">{data.sslcBoard || "—"}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Passing Year</td>
                    <td className="text-dark">{data.sslcYearOfPassing || "—"}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Percentage</td>
                    <td className="text-dark fw-bold text-success">
                      {data.sslcPercentage ? `${data.sslcPercentage}%` : "—"}
                    </td>
                  </tr>
                </tbody>
              </Table>

              {(data.sslcDocumentUrl || data.sslcDocument) && (
                <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                  <span className="extra-small text-muted d-flex align-items-center gap-1.5">
                    {getDocIcon(data.sslcDocumentUrl || data.sslcDocument)} SSLC Marksheet Attached
                  </span>
                  <div className="d-flex gap-1.5">
                    <a
                      href={getFullUrl(data.sslcDocumentUrl || data.sslcDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaEye className="me-1" /> View Document
                    </a>
                    <a
                      href={getFullUrl(data.sslcDocumentUrl || data.sslcDocument)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaDownload />
                    </a>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* 2. HSC */}
        <Col md={6} xs={12}>
          <Card className="border-0 rounded-4 shadow-sm h-100 bg-white overflow-hidden">
            <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaSchool className="text-success" />
                <span className="fw-bold text-dark small">HSC (Higher Secondary Certificate)</span>
              </div>
              <Badge bg="success-subtle" className="text-success border border-success-subtle extra-small rounded-pill">12th</Badge>
            </div>
            <Card.Body className="p-3.5">
              <Table borderless size="sm" className="mb-2 extra-small">
                <tbody>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ width: "40%" }}>School / College</td>
                    <td className="text-dark fw-bold">{data.hscSchoolName || "—"}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Board</td>
                    <td className="text-dark">{data.hscBoard || "—"}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Passing Year</td>
                    <td className="text-dark">{data.hscYearOfPassing || "—"}</td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">Percentage</td>
                    <td className="text-dark fw-bold text-success">
                      {data.hscPercentage ? `${data.hscPercentage}%` : "—"}
                    </td>
                  </tr>
                </tbody>
              </Table>

              {(data.hscDocumentUrl || data.hscDocument) && (
                <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                  <span className="extra-small text-muted d-flex align-items-center gap-1.5">
                    {getDocIcon(data.hscDocumentUrl || data.hscDocument)} HSC Certificate Attached
                  </span>
                  <div className="d-flex gap-1.5">
                    <a
                      href={getFullUrl(data.hscDocumentUrl || data.hscDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaEye className="me-1" /> View Document
                    </a>
                    <a
                      href={getFullUrl(data.hscDocumentUrl || data.hscDocument)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaDownload />
                    </a>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* 3. Undergraduate (UG) */}
        <Col md={12}>
          <Card className="border-0 rounded-4 shadow-sm bg-white overflow-hidden">
            <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaGraduationCap className="text-primary" />
                <span className="fw-bold text-dark small">Undergraduate Degree (UG / Bachelor's)</span>
              </div>
              <Badge bg="primary-subtle" className="text-primary border border-primary-subtle extra-small rounded-pill">
                Primary Degree
              </Badge>
            </div>
            <Card.Body className="p-3.5">
              <Row className="g-3">
                <Col md={6}>
                  <Table borderless size="sm" className="mb-0 extra-small">
                    <tbody>
                      <tr>
                        <td className="text-muted fw-semibold" style={{ width: "40%" }}>Institute / College</td>
                        <td className="text-dark fw-bold">{data.ugInstituteName || "—"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted fw-semibold">University</td>
                        <td className="text-dark">{data.ugUniversityName || "—"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted fw-semibold">Degree</td>
                        <td className="text-dark fw-bold text-primary">{data.ugDegree || "—"}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless size="sm" className="mb-0 extra-small">
                    <tbody>
                      <tr>
                        <td className="text-muted fw-semibold" style={{ width: "40%" }}>Department / Course</td>
                        <td className="text-dark">{data.ugDepartmentCourse || "—"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted fw-semibold">Year of Passing</td>
                        <td className="text-dark">{data.ugYearOfPassing || "—"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted fw-semibold">CGPA</td>
                        <td className="text-dark fw-bold text-success">
                          {data.ugCgpa ? `${data.ugCgpa} / 10` : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>

              {(data.ugDocumentUrl || data.ugDocument) && (
                <div className="pt-3 border-top mt-3 d-flex align-items-center justify-content-between">
                  <span className="extra-small text-muted d-flex align-items-center gap-1.5">
                    {getDocIcon(data.ugDocumentUrl || data.ugDocument)} UG Degree Certificate Attached
                  </span>
                  <div className="d-flex gap-1.5">
                    <a
                      href={getFullUrl(data.ugDocumentUrl || data.ugDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaEye className="me-1" /> View Document
                    </a>
                    <a
                      href={getFullUrl(data.ugDocumentUrl || data.ugDocument)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaDownload /> Download
                    </a>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* 4. ITI (if present) */}
        {hasITI && (
          <Col md={6} xs={12}>
            <Card className="border-0 rounded-4 shadow-sm h-100 bg-white overflow-hidden">
              <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FaTools className="text-info" />
                  <span className="fw-bold text-dark small">Industrial Training Institute (ITI)</span>
                </div>
                <Badge bg="info-subtle" className="text-info border border-info-subtle extra-small rounded-pill">Vocational</Badge>
              </div>
              <Card.Body className="p-3.5">
                <Table borderless size="sm" className="mb-2 extra-small">
                  <tbody>
                    <tr>
                      <td className="text-muted fw-semibold" style={{ width: "40%" }}>Institute</td>
                      <td className="text-dark fw-bold">{data.itiinstituteName || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Course / Trade</td>
                      <td className="text-dark">{data.iticourse || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Duration</td>
                      <td className="text-dark">{data.itiduration || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Passing Year</td>
                      <td className="text-dark">{data.itiyearOfPassing || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Percentage</td>
                      <td className="text-dark fw-bold text-success">
                        {data.itipercentage ? `${data.itipercentage}%` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </Table>

                {(data.itiDocumentUrl || data.itiDocument) && (
                  <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                    <span className="extra-small text-muted d-flex align-items-center gap-1.5">
                      {getDocIcon(data.itiDocumentUrl || data.itiDocument)} ITI Certificate Attached
                    </span>
                    <a
                      href={getFullUrl(data.itiDocumentUrl || data.itiDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaEye className="me-1" /> View Document
                    </a>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* 5. Diploma (if present) */}
        {hasDiploma && (
          <Col md={6} xs={12}>
            <Card className="border-0 rounded-4 shadow-sm h-100 bg-white overflow-hidden">
              <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FaCertificate className="text-purple" style={{ color: "#6f42c1" }} />
                  <span className="fw-bold text-dark small">Polytechnic Diploma</span>
                </div>
                <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle extra-small rounded-pill">Diploma</Badge>
              </div>
              <Card.Body className="p-3.5">
                <Table borderless size="sm" className="mb-2 extra-small">
                  <tbody>
                    <tr>
                      <td className="text-muted fw-semibold" style={{ width: "40%" }}>Institution</td>
                      <td className="text-dark fw-bold">{data.diplomainstitution || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Course</td>
                      <td className="text-dark">{data.diplomacourse || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Duration</td>
                      <td className="text-dark">{data.diplomaduration || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Passing Year</td>
                      <td className="text-dark">{data.diplomayearOfPassing || "—"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted fw-semibold">Percentage</td>
                      <td className="text-dark fw-bold text-success">
                        {data.diplomapercentage ? `${data.diplomapercentage}%` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </Table>

                {(data.diplomaDocumentUrl || data.diplomaDocument) && (
                  <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                    <span className="extra-small text-muted d-flex align-items-center gap-1.5">
                      {getDocIcon(data.diplomaDocumentUrl || data.diplomaDocument)} Diploma Certificate Attached
                    </span>
                    <a
                      href={getFullUrl(data.diplomaDocumentUrl || data.diplomaDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaEye className="me-1" /> View Document
                    </a>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* 6. PG (if present) */}
        {hasPG && (
          <Col md={12}>
            <Card className="border-0 rounded-4 shadow-sm bg-white overflow-hidden">
              <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FaUserGraduate className="text-info" />
                  <span className="fw-bold text-dark small">Postgraduate Degree (PG / Master's)</span>
                </div>
                <Badge bg="info-subtle" className="text-info border border-info-subtle extra-small rounded-pill">Master's</Badge>
              </div>
              <Card.Body className="p-3.5">
                <Row className="g-3">
                  <Col md={6}>
                    <Table borderless size="sm" className="mb-0 extra-small">
                      <tbody>
                        <tr>
                          <td className="text-muted fw-semibold" style={{ width: "40%" }}>Institute</td>
                          <td className="text-dark fw-bold">{data.pgInstituteName || "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">University</td>
                          <td className="text-dark">{data.pgUniversityName || "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">Degree</td>
                          <td className="text-dark fw-bold text-info">{data.pgDegree || "—"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <Table borderless size="sm" className="mb-0 extra-small">
                      <tbody>
                        <tr>
                          <td className="text-muted fw-semibold" style={{ width: "40%" }}>Course / Specialization</td>
                          <td className="text-dark">{data.pgDepartmentCourse || "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">Passing Year</td>
                          <td className="text-dark">{data.pgYearOfPassing || "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">CGPA</td>
                          <td className="text-dark fw-bold text-success">
                            {data.pgCgpa ? `${data.pgCgpa} / 10` : "—"}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                {(data.pgDocumentUrl || data.pgDocument) && (
                  <div className="pt-3 border-top mt-3 d-flex align-items-center justify-content-between">
                    <span className="extra-small text-muted d-flex align-items-center gap-1.5">
                      {getDocIcon(data.pgDocumentUrl || data.pgDocument)} PG Degree Certificate Attached
                    </span>
                    <a
                      href={getFullUrl(data.pgDocumentUrl || data.pgDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaEye className="me-1" /> View Document
                    </a>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* 7. PhD (if present) */}
        {hasPhD && (
          <Col md={12}>
            <Card className="border-0 rounded-4 shadow-sm bg-white overflow-hidden">
              <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FaBook className="text-danger" />
                  <span className="fw-bold text-dark small">Doctorate Degree (PhD)</span>
                </div>
                <Badge bg="danger-subtle" className="text-danger border border-danger-subtle extra-small rounded-pill">Doctorate</Badge>
              </div>
              <Card.Body className="p-3.5">
                <Row className="g-3">
                  <Col md={6}>
                    <Table borderless size="sm" className="mb-0 extra-small">
                      <tbody>
                        <tr>
                          <td className="text-muted fw-semibold" style={{ width: "40%" }}>Institute</td>
                          <td className="text-dark fw-bold">{data.phdInstituteName || "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">University</td>
                          <td className="text-dark">{data.phdUniversityName || "—"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <Table borderless size="sm" className="mb-0 extra-small">
                      <tbody>
                        <tr>
                          <td className="text-muted fw-semibold" style={{ width: "40%" }}>Research Area</td>
                          <td className="text-dark fw-bold">{data.phdResearchArea || "—"}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">Award Year</td>
                          <td className="text-dark">{data.phdYearOfPassing || "—"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                {(data.phdDocumentUrl || data.phdDocument) && (
                  <div className="pt-3 border-top mt-3 d-flex align-items-center justify-content-between">
                    <span className="extra-small text-muted d-flex align-items-center gap-1.5">
                      {getDocIcon(data.phdDocumentUrl || data.phdDocument)} PhD Thesis / Degree Attached
                    </span>
                    <a
                      href={getFullUrl(data.phdDocumentUrl || data.phdDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm py-0 px-2 extra-small rounded-pill"
                    >
                      <FaEye className="me-1" /> View Document
                    </a>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}

export default EducationViewProfile;
