import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, ProgressBar, Nav,ListGroup
} from 'react-bootstrap';
import {
  FaClock, FaCalendarAlt, FaCheckCircle, FaClipboardList,
  FaLink, FaLayerGroup, FaDotCircle, FaChevronRight,
  FaSignOutAlt, FaSignInAlt, FaHistory
} from 'react-icons/fa';

function Attendance() {
  const [activeTab, setActiveTab] = useState('summary');
  const [reportFormData, setReportFormData] = useState({
    reportDate: '2024-03-05',
    shift: 'General Shift (09:00 AM - 06:00 PM)',
    title: 'Development of Onboarding Module',
    description: 'Developed the dynamic array-based form sections for professional and education details. Fixed the isSectionComplete initialization bug.',
    preference: 4,
    referenceLink: 'https://github.com/FlareMindsTech/HRMSUI/pull/123',
    type: 'Development'
  });

  const [reports] = useState([
    {
      id: "RPT-1244",
      reportDate: "2024-03-04",
      shift: "General Shift",
      title: "UI Bug Fixes",
      description: "Fixed alignment issues in mobile view for the dashboard KPI cards.",
      preference: 3,
      submittedAt: "2024-03-04 06:15 PM",
      type: "Bug Fix"
    },
    {
      id: "RPT-1243",
      reportDate: "2024-03-03",
      shift: "General Shift",
      title: "API Integration",
      description: "Integrated the employee profile API with the live preview card.",
      preference: 5,
      submittedAt: "2024-03-03 06:30 PM",
      type: "Feature"
    }
  ]);

  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setReportFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPriorityBadge = (pref) => {
    if (pref >= 4) return <Badge bg="success" className="rounded-pill px-2">High</Badge>;
    if (pref === 3) return <Badge bg="info" className="rounded-pill px-2">Medium</Badge>;
    return <Badge bg="secondary" className="rounded-pill px-2">Low</Badge>;
  };

  return (
    <Container fluid className="p-3 no-scrollbar" style={{ height: 'calc(100vh - var(--header-height))', overflowY: 'auto' }}>
      {/* Page Header & Stats */}
      <Row className="mb-4 g-3 align-items-center">
        <Col md={6}>
          <h4 className="fw-bold mb-0" style={{ color: 'var(--primary-color)' }}>Attendance & Daily Reports</h4>
          <p className="text-muted small mb-0">Manage your work logs and daily presence.</p>
        </Col>
        <Col md={6} className="d-flex justify-content-md-end gap-2">
          <Card className="border-0 shadow-sm px-3 py-2 bg-gradient-premium text-white d-flex flex-row align-items-center gap-3">
            <div className="text-start">
              <span className="extra-small opacity-75 d-block">Work Time Today</span>
              <h5 className="fw-bold mb-0">07h 45m</h5>
            </div>
            <Button variant="light" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '35px', height: '35px' }}>
              <FaSignOutAlt className="text-danger" size={14} />
            </Button>
          </Card>
        </Col>
      </Row>

      <Nav variant="pills" className="premium-nav mb-4 gap-2">
        <Nav.Item>
          <Nav.Link active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} className="rounded-pill px-4 py-2 small">
            <FaLayerGroup className="me-2" /> Attendance Summary
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'daily-report'} onClick={() => setActiveTab('daily-report')} className="rounded-pill px-4 py-2 small">
            <FaClipboardList className="me-2" /> Daily Reports
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'summary' ? (
        <Row className="g-3">
          <Col lg={8}>
            <Card className="premium-card border-0 shadow-sm mb-3">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0"><FaCalendarAlt className="me-2 text-primary" /> This Month</h5>
                  <Button variant="outline-primary" size="sm" className="rounded-pill px-3 extra-small">Download Log</Button>
                </div>
                <div className="table-responsive no-scrollbar">
                  <Table borderless hover className="align-middle" style={{ fontSize: '0.85rem' }}>
                    <thead className="text-muted bg-light">
                      <tr>
                        <th className="py-2 px-3 fw-medium">Date</th>
                        <th className="py-2 px-3 fw-medium">In Time</th>
                        <th className="py-2 px-3 fw-medium">Out Time</th>
                        <th className="py-2 px-3 fw-medium">Total Hours</th>
                        <th className="py-2 px-3 fw-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map(day => (
                        <tr key={day} className="border-bottom-light">
                          <td className="py-3 px-3 fw-bold">0{day} Mar, 2024</td>
                          <td className="py-3 px-3"><FaSignInAlt className="text-success me-2" /> 09:05 AM</td>
                          <td className="py-3 px-3"><FaSignOutAlt className="text-danger me-2" /> 06:15 PM</td>
                          <td className="py-3 px-3">09h 10m</td>
                          <td className="py-3 px-3"><Badge bg="success-subtle" className="text-success fw-medium rounded-pill border border-success-subtle">Present</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="premium-card border-0 shadow-sm mb-3 text-center">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3">Monthly Attendance</h6>
                <div className="position-relative d-inline-block mb-3">
                  <svg width="120" height="120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary-color)" strokeWidth="10" strokeDasharray="314" strokeDashoffset="45" strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <h4 className="fw-bold mb-0">85%</h4>
                  </div>
                </div>
                <Row className="g-2 text-start">
                  <Col xs={6}>
                    <div className="p-2 bg-light rounded-3 text-center">
                      <span className="text-muted extra-small d-block">Expected</span>
                      <span className="fw-bold">22</span>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-2 bg-light rounded-3 text-center">
                      <span className="text-muted extra-small d-block">Present</span>
                      <span className="fw-bold text-success">19</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            <Card className="premium-card border-0 shadow-sm">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3"><FaHistory className="me-2 text-warning" /> Late Comings</h6>
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0 py-2 border-0 small d-flex justify-content-between align-items-center">
                    <div>
                      <span className="d-block fw-bold">Feb 28, 2024</span>
                      <span className="extra-small text-muted">09:35 AM (+35m)</span>
                    </div>
                    <Badge bg="warning-subtle" className="text-warning">Late</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row className="g-3">
          {/* Daily Report Submission Form (Based on JSON) */}
          <Col lg={5}>
            <Card className="premium-card border-0 shadow-sm mb-3 h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                    <FaClipboardList size={20} />
                  </div>
                  <h5 className="fw-bold mb-0">Submit Daily Report</h5>
                </div>
                <Form>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Report Date</Form.Label>
                        <Form.Control type="date" name="reportDate" value={reportFormData.reportDate} onChange={handleReportChange} className="form-control-sm" />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Shift</Form.Label>
                        <Form.Select name="shift" value={reportFormData.shift} onChange={handleReportChange} className="form-control-sm">
                          <option>General Shift (09:00 AM - 06:00 PM)</option>
                          <option>Night Shift (10:00 PM - 07:00 AM)</option>
                          <option>Morning Shift (06:00 AM - 02:00 PM)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Work Title</Form.Label>
                        <Form.Control type="text" name="title" value={reportFormData.title} onChange={handleReportChange} className="form-control-sm" placeholder="Short summary of task" />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Description of Work</Form.Label>
                        <Form.Control as="textarea" rows={4} name="description" value={reportFormData.description} onChange={handleReportChange} className="form-control-sm" style={{ fontSize: '0.85rem' }} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Work Type</Form.Label>
                        <Form.Control type="text" name="type" value={reportFormData.type} onChange={handleReportChange} className="form-control-sm" placeholder="e.g., Dev / QA / Bug" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Preference (0-5)</Form.Label>
                        <Form.Control type="number" min="0" max="5" name="preference" value={reportFormData.preference} onChange={handleReportChange} className="form-control-sm" />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Reference Link</Form.Label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-light border-end-0"><FaLink size={12} className="text-muted" /></span>
                          <Form.Control type="text" name="referenceLink" value={reportFormData.referenceLink} onChange={handleReportChange} className="border-start-0" placeholder="Jira / Github link" />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={12} className="mt-4">
                      <Button variant="primary" className="w-100 rounded-pill gradient-bg border-0 py-2 shadow-sm fw-bold" style={{ backgroundColor: 'var(--primary-color)' }}>
                        Submit Report
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Report History */}
          <Col lg={7}>
            <Card className="premium-card border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4">Report History</h5>
                <div className="d-flex flex-column gap-3 no-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {reports.map((rpt, idx) => (
                    <Card key={idx} className="border rounded-4 bg-light bg-opacity-50 hover-shadow transition-all border-light-subtle">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>{rpt.title}</h6>
                            <span className="extra-small text-muted"><FaCalendarAlt className="me-1" /> {rpt.reportDate} • <FaClock className="me-1" /> {rpt.shift}</span>
                          </div>
                          <Badge bg="primary-subtle" className="text-primary rounded-pill px-2" style={{ fontSize: '0.7rem' }}>{rpt.type}</Badge>
                        </div>
                        <p className="small text-muted mb-3 lh-sm" style={{ fontSize: '0.82rem' }}>{rpt.description}</p>
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light">
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-1">
                              <span className="extra-small text-muted">Priority:</span>
                              {getPriorityBadge(rpt.preference)}
                            </div>
                            <a href="#" className="extra-small text-primary text-decoration-none d-flex align-items-center gap-1">
                              <FaLink size={10} /> Reference
                            </a>
                          </div>
                          <span className="extra-small text-muted">Submitted: {rpt.submittedAt}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Attendance;