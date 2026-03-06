import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, ListGroup
} from 'react-bootstrap';
import {
  FaCalendarAlt, FaCalendarCheck, FaClock, FaCheckCircle,
  FaTimesCircle, FaInfoCircle, FaPlus, FaChevronRight
} from 'react-icons/fa';

function LeaveRequest() {
  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    startDate: '2024-03-10',
    endDate: '2024-03-12',
    totalDays: 3,
    isHalfDay: false,
    title: 'Family Function',
    reason: 'Need to attend a family function in my hometown.',
    type: 'Paid',
  });

  const [leaveHistory] = useState([
    {
      id: "LRQ-001",
      leaveType: "Sick Leave",
      startDate: "2024-02-15",
      endDate: "2024-02-16",
      totalDays: 2,
      isHalfDay: false,
      title: "Viral Fever",
      reason: "Suffering from viral fever, advised bed rest.",
      status: "Approved",
      approvedBy: "HR Manager",
      appliedOn: "2024-02-14",
    },
    {
      id: "LRQ-002",
      leaveType: "Casual Leave",
      startDate: "2024-01-20",
      endDate: "2024-01-20",
      totalDays: 0.5,
      isHalfDay: true,
      title: "Personal Work",
      reason: "Need half day for bank related work.",
      status: "Rejected",
      approvedBy: "Team Lead",
      appliedOn: "2024-01-18",
    }
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return <Badge bg="success" className="rounded-pill px-3">Approved</Badge>;
      case 'Rejected': return <Badge bg="danger" className="rounded-pill px-3">Rejected</Badge>;
      default: return <Badge bg="warning" className="rounded-pill px-3 text-dark">Pending</Badge>;
    }
  };

  return (
    <Container fluid className="p-3 no-scrollbar" style={{ height: 'calc(100vh - var(--header-height))', overflowY: 'auto' }}>
      {/* Header Section */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h4 className="fw-bold mb-0" style={{ color: 'var(--primary-color)' }}>Leave Management</h4>
          <p className="text-muted small mb-0">Apply for leaves and track your requests.</p>
        </Col>
        <Col xs="auto">
          <div className="d-flex gap-3">
            <Card className="border-0 shadow-sm px-3 py-2 text-center bg-white">
              <span className="text-muted extra-small d-block mb-1">Available Balance</span>
              <h5 className="fw-bold mb-0 text-primary">12 Days</h5>
            </Card>
            <Card className="border-0 shadow-sm px-3 py-2 text-center bg-white">
              <span className="text-muted extra-small d-block mb-1">Leaves Taken</span>
              <h5 className="fw-bold mb-0 text-success">08 Days</h5>
            </Card>
          </div>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Left Side: Apply Leave Form */}
        <Col lg={5}>
          <Card className="premium-card border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                  <FaCalendarPlus size={20} />
                </div>
                <h5 className="fw-bold mb-0">Apply New Leave</h5>
              </div>

              <Form>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Leave Type</Form.Label>
                      <Form.Select name="leaveType" value={formData.leaveType} onChange={handleChange} className="form-control-sm shadow-none">
                        <option>Casual Leave</option>
                        <option>Sick Leave</option>
                        <option>Annual Leave</option>
                        <option>Maternity Leave</option>
                        <option>Comp Off</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">From Date</Form.Label>
                      <Form.Control type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="form-control-sm shadow-none" />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">To Date</Form.Label>
                      <Form.Control type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="form-control-sm shadow-none" />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Check
                      type="checkbox"
                      id="half-day"
                      label="Apply for Half Day"
                      name="isHalfDay"
                      checked={formData.isHalfDay}
                      onChange={handleChange}
                      className="small text-muted"
                    />
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Leave Title</Form.Label>
                      <Form.Control type="text" placeholder="e.g., Vacation / Emergency" name="title" value={formData.title} onChange={handleChange} className="form-control-sm shadow-none" />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Reason for Leave</Form.Label>
                      <Form.Control as="textarea" rows={3} placeholder="Please provide details..." name="reason" value={formData.reason} onChange={handleChange} className="form-control-sm shadow-none" />
                    </Form.Group>
                  </Col>

                  <Col md={12} className="mt-4">
                    <Button variant="primary" className="w-100 rounded-pill gradient-bg border-0 py-2 shadow-sm d-flex align-items-center justify-content-center gap-2" style={{ backgroundColor: 'var(--primary-color)' }}>
                      <FaPlus /> Submit Request
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side: Leave History */}
        <Col lg={7}>
          <Card className="premium-card border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success">
                    <FaCalendarCheck size={20} />
                  </div>
                  <h5 className="fw-bold mb-0">Leave History</h5>
                </div>
                <Button variant="link" className="text-decoration-none small p-0 text-primary">View All <FaChevronRight size={10} /></Button>
              </div>

              <div className="table-responsive no-scrollbar">
                <Table borderless hover className="align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="text-muted border-bottom">
                    <tr>
                      <th className="fw-medium py-3">Leave Details</th>
                      <th className="fw-medium py-3">Duration</th>
                      <th className="fw-medium py-3 text-center">Status</th>
                      <th className="fw-medium py-3 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.map((req, idx) => (
                      <tr key={idx} className="border-bottom-light">
                        <td className="py-3">
                          <div className="fw-bold text-dark mb-0">{req.leaveType}</div>
                          <small className="text-muted">{req.title}</small>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2 text-dark">
                            <FaClock size={12} className="text-muted" />
                            <span>{req.totalDays} Days</span>
                          </div>
                          <small className="text-muted">{req.startDate} to {req.endDate}</small>
                        </td>
                        <td className="py-3 text-center">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="py-3 text-end">
                          <Button variant="link" className="text-muted p-0 shadow-none"><FaInfoCircle size={16} /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Leave Policy Card */}
              <div className="mt-4 p-3 bg-light rounded-4 border-start border-4 border-warning">
                <div className="d-flex gap-2">
                  <FaInfoCircle size={20} className="text-warning mt-1" />
                  <div>
                    <h6 className="fw-bold mb-1">Company Policy Tip</h6>
                    <p className="text-muted small mb-0">Leaves should be applied at least 2 days in advance. Medical leaves require a certificate for more than 3 days.</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

const FaCalendarPlus = ({ size }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height={size} width={size} xmlns="http://www.w3.org/2000/svg">
    <path d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448zM312 328H232V248C232 243.6 228.4 240 224 240C219.6 240 216 243.6 216 248V328H136C131.6 328 128 331.6 128 336C128 340.4 131.6 344 136 344H216V424C216 428.4 219.6 432 224 432C228.4 432 232 428.4 232 424V344H312C316.4 344 320 340.4 320 336C320 331.6 316.4 328 312 328Z"></path>
  </svg>
);

export default LeaveRequest;