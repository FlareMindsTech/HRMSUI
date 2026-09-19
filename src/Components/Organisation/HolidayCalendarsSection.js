import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  InputGroup,
  Nav,
} from "react-bootstrap";
import {
  FaUmbrellaBeach,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchHolidayCalendars,
  createHolidayCalendar,
  updateHolidayCalendar,
  deleteHolidayCalendar,
  fetchDeclaredHolidays,
  declareBulkHoliday,
  cancelDeclaredHoliday,
  fetchBranchesDropdown,
  fetchDepartmentsDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function HolidayCalendarsSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("holidays"); // "holidays" | "calendars"

  const [holidayCalendars, setHolidayCalendars] = useState([]);
  const [declaredHolidays, setDeclaredHolidays] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Calendar Modal State
  const [showCalModal, setShowCalModal] = useState(false);
  const [editingCal, setEditingCal] = useState(null);
  const [calFormData, setCalFormData] = useState({
    calendarName: "",
    calendarCode: "",
    year: new Date().getFullYear(),
    branchId: "",
    description: "",
    status: "ACTIVE",
  });

  // Holiday Declaration Modal State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayFormData, setHolidayFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    holidayType: "COMPANY_HOLIDAY",
    scope: "ALL",
    branchId: "",
    targetDepartment: "",
    reason: "",
    isOptional: false,
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete / Cancel Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingType, setDeletingType] = useState(""); // "calendar" | "holiday"
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const canManageCalendars = isSystemAdmin || hasPermission("holidayCalendar.create") || hasPermission("holidayCalendar.update");
  const canDeclareHoliday = isSystemAdmin || hasPermission("attendance.modify") || hasPermission("holiday.create");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (activeSubTab === "calendars") {
        const res = await fetchHolidayCalendars({
          page,
          limit: 10,
          search,
          year: filterYear,
        });
        if (res.success) {
          setHolidayCalendars(res.data || []);
          if (res.pagination) {
            setTotalRecords(res.pagination.totalRecords || 0);
          }
        }
      } else {
        const res = await fetchDeclaredHolidays({
          year: filterYear,
        });
        if (res.success || Array.isArray(res.data)) {
          const list = res.data || [];
          setDeclaredHolidays(list);
          setTotalRecords(list.length);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load holiday data");
    } finally {
      setLoading(false);
    }
  }, [activeSubTab, page, search, filterYear]);

  const loadAuxiliaryData = async () => {
    try {
      const [brList, deptList] = await Promise.all([
        fetchBranchesDropdown().catch(() => []),
        fetchDepartmentsDropdown().catch(() => []),
      ]);
      setBranches(brList);
      setDepartments(deptList);
    } catch (err) {
      console.warn("Failed to load branches/departments:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  // Open Calendar Form
  const handleOpenCalendarCreate = () => {
    setEditingCal(null);
    setCalFormData({
      calendarName: `Holiday Calendar ${filterYear}`,
      calendarCode: `HOL-CAL-${filterYear}`,
      year: filterYear,
      branchId: "",
      description: "",
      status: "ACTIVE",
    });
    setModalError("");
    setShowCalModal(true);
  };

  const handleOpenCalendarEdit = (cal) => {
    setEditingCal(cal);
    setCalFormData({
      calendarName: cal.calendarName || "",
      calendarCode: cal.calendarCode || "",
      year: cal.year || filterYear,
      branchId: cal.branchId?._id || cal.branchId || "",
      description: cal.description || "",
      status: cal.status || "ACTIVE",
    });
    setModalError("");
    setShowCalModal(true);
  };

  // Open Holiday Declaration Form
  const handleOpenHolidayCreate = () => {
    setHolidayFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      holidayType: "COMPANY_HOLIDAY",
      scope: "ALL",
      branchId: "",
      targetDepartment: "",
      reason: "",
      isOptional: false,
    });
    setModalError("");
    setShowHolidayModal(true);
  };

  const handleSaveCalendar = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        calendarName: calFormData.calendarName.trim(),
        calendarCode: calFormData.calendarCode.trim().toUpperCase(),
        year: Number(calFormData.year) || filterYear,
        branchId: calFormData.branchId || null,
        description: calFormData.description,
        status: calFormData.status,
      };

      if (editingCal) {
        const res = await updateHolidayCalendar(editingCal._id, payload);
        setSuccess(res.message || "Holiday calendar updated successfully");
      } else {
        const res = await createHolidayCalendar(payload);
        setSuccess(res.message || "Holiday calendar created successfully");
      }
      setShowCalModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save holiday calendar");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        title: holidayFormData.title.trim(),
        date: holidayFormData.date,
        holidayType: holidayFormData.holidayType,
        scope: holidayFormData.scope,
        branchId: holidayFormData.branchId || null,
        targetDepartment: holidayFormData.targetDepartment || null,
        reason: holidayFormData.reason || holidayFormData.title,
        isOptional: holidayFormData.isOptional,
      };

      const res = await declareBulkHoliday(payload);
      setSuccess(res.message || "Holiday declared successfully");
      setShowHolidayModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to declare holiday");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setModalLoading(true);
      if (deletingType === "calendar") {
        const res = await deleteHolidayCalendar(deletingId);
        setSuccess(res.message || "Holiday calendar deleted");
      } else {
        const res = await cancelDeclaredHoliday(deletingId);
        setSuccess(res.message || "Declared holiday cancelled");
      }
      setShowDeleteModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Operation failed");
      setShowDeleteModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div>
          <h3 className="org-section-title">
            <FaUmbrellaBeach className="text-success me-2" /> Holiday Calendars & Public Holidays
          </h3>
          <p className="org-section-sub">
            Declare official company holidays, festival breaks, regional days off, and annual holiday catalogs.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Nav variant="pills" activeKey={activeSubTab} onSelect={(k) => { setActiveSubTab(k); setPage(1); }}>
            <Nav.Item>
              <Nav.Link eventKey="holidays" className="py-1 px-3">Declared Holidays</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="calendars" className="py-1 px-3">Annual Calendars</Nav.Link>
            </Nav.Item>
          </Nav>
          {activeSubTab === "holidays" && canDeclareHoliday && (
            <Button variant="success" className="org-action-btn ms-2" onClick={handleOpenHolidayCreate}>
              <FaPlus className="me-2" /> Declare Holiday
            </Button>
          )}
          {activeSubTab === "calendars" && canManageCalendars && (
            <Button variant="success" className="org-action-btn ms-2" onClick={handleOpenCalendarCreate}>
              <FaPlus className="me-2" /> Add Calendar
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Year Filter Bar ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={3}>
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 small fw-semibold text-secondary">Year:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filterYear}
                  onChange={(e) => { setFilterYear(Number(e.target.value)); setPage(1); }}
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {activeSubTab === "calendars" && (
              <Col md={5}>
                <InputGroup size="sm">
                  <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                  <Form.Control
                    placeholder="Search calendar name or code..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </InputGroup>
              </Col>
            )}
            <Col className="text-end text-muted small">
              Total: <strong>{totalRecords}</strong>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Table: Declared Holidays or Calendars ── */}
      <Card className="org-table-card">
        {activeSubTab === "holidays" ? (
          <Table responsive hover className="org-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Date & Day</th>
                <th>Holiday Name</th>
                <th>Holiday Type</th>
                <th>Applicable Scope</th>
                <th>Branch / Dept</th>
                <th>Optional?</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" variant="success" className="me-2" />
                    Loading declared holidays...
                  </td>
                </tr>
              ) : declaredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No declared holidays for {filterYear}.
                  </td>
                </tr>
              ) : (
                declaredHolidays.map((h) => {
                  const dateObj = h.date ? new Date(h.date) : null;
                  const dayName = dateObj ? dateObj.toLocaleDateString("en-US", { weekday: "short" }) : "";
                  return (
                    <tr key={h._id}>
                      <td>
                        <div className="fw-semibold text-dark font-monospace">{h.date}</div>
                        <div className="small text-muted">{dayName}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{h.title || h.holidayName}</div>
                        <div className="small text-muted">{h.reason}</div>
                      </td>
                      <td>
                        <Badge bg="light" className="text-dark border">
                          {h.holidayType ? h.holidayType.replace("_", " ") : "COMPANY"}
                        </Badge>
                      </td>
                      <td>
                        <span className="small text-secondary fw-semibold">
                          {h.scope || "ALL"}
                        </span>
                      </td>
                      <td>
                        <div className="small text-muted">
                          {h.branchId?.branchName || h.targetDepartment || "Organization-Wide"}
                        </div>
                      </td>
                      <td>
                        {h.isOptional ? (
                          <Badge bg="warning" text="dark">Optional</Badge>
                        ) : (
                          <span className="text-muted small">Mandatory</span>
                        )}
                      </td>
                      <td>
                        <Badge bg={h.status === "ACTIVE" ? "success" : "secondary"}>
                          {h.status || "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="text-end">
                        {canDeclareHoliday && h.status !== "CANCELLED" && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-1"
                            title="Cancel Holiday"
                            onClick={() => {
                              setDeletingType("holiday");
                              setDeletingId(h._id);
                              setDeletingName(h.title || h.holidayName);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        ) : (
          <Table responsive hover className="org-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Calendar Code & Name</th>
                <th>Year</th>
                <th>Associated Branch</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" variant="success" className="me-2" />
                    Loading holiday calendars...
                  </td>
                </tr>
              ) : holidayCalendars.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No holiday calendars found for {filterYear}.
                  </td>
                </tr>
              ) : (
                holidayCalendars.map((cal) => (
                  <tr key={cal._id}>
                    <td>
                      <div className="fw-semibold text-dark">{cal.calendarName}</div>
                      <div className="small font-monospace text-muted">{cal.calendarCode}</div>
                    </td>
                    <td>
                      <Badge bg="light" className="text-primary border font-monospace">
                        {cal.year}
                      </Badge>
                    </td>
                    <td>
                      {cal.branchId ? (
                        <div className="small">
                          <FaCodeBranch className="text-secondary me-1" />
                          {cal.branchId.branchName}
                        </div>
                      ) : (
                        <span className="text-muted small">Global / All Branches</span>
                      )}
                    </td>
                    <td>
                      <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: "200px" }}>
                        {cal.description || "-"}
                      </span>
                    </td>
                    <td>
                      <Badge bg={cal.status === "ACTIVE" ? "success" : "secondary"}>
                        {cal.status}
                      </Badge>
                    </td>
                    <td className="text-end">
                      {canManageCalendars && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary p-1"
                          title="Edit Calendar"
                          onClick={() => handleOpenCalendarEdit(cal)}
                        >
                          <FaEdit />
                        </Button>
                      )}
                      {canManageCalendars && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-1"
                          title="Delete Calendar"
                          onClick={() => {
                            setDeletingType("calendar");
                            setDeletingId(cal._id);
                            setDeletingName(cal.calendarName);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ── Declare Holiday Modal ── */}
      <Modal show={showHolidayModal} onHide={() => setShowHolidayModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSaveHoliday}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaUmbrellaBeach className="text-success" /> Declare Official Holiday
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Holiday Title / Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Independence Day, Diwali"
                    value={holidayFormData.title}
                    onChange={(e) => setHolidayFormData({ ...holidayFormData, title: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={holidayFormData.date}
                    onChange={(e) => setHolidayFormData({ ...holidayFormData, date: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Holiday Category</Form.Label>
                  <Form.Select
                    value={holidayFormData.holidayType}
                    onChange={(e) => setHolidayFormData({ ...holidayFormData, holidayType: e.target.value })}
                  >
                    <option value="COMPANY_HOLIDAY">Company Holiday</option>
                    <option value="PUBLIC">National Public Holiday</option>
                    <option value="REGIONAL">State / Regional Holiday</option>
                    <option value="FESTIVAL">Festival Holiday</option>
                    <option value="BULK_LEAVE">Company-Wide Bulk Leave</option>
                    <option value="OPTIONAL">Optional / Restricted Holiday</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Applicable Scope</Form.Label>
                  <Form.Select
                    value={holidayFormData.scope}
                    onChange={(e) => setHolidayFormData({ ...holidayFormData, scope: e.target.value })}
                  >
                    <option value="ALL">Entire Organization (All Employees)</option>
                    <option value="BRANCH">Specific Branch</option>
                    <option value="DEPARTMENT">Specific Department</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {holidayFormData.scope === "BRANCH" && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Select Branch <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      required
                      value={holidayFormData.branchId}
                      onChange={(e) => setHolidayFormData({ ...holidayFormData, branchId: e.target.value })}
                    >
                      <option value="">-- Choose Branch --</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>{b.branchName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              {holidayFormData.scope === "DEPARTMENT" && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Select Department <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      required
                      value={holidayFormData.targetDepartment}
                      onChange={(e) => setHolidayFormData({ ...holidayFormData, targetDepartment: e.target.value })}
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.departmentName}>{d.departmentName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description / Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Occasion or compliance notes regarding this declared holiday"
                    value={holidayFormData.reason}
                    onChange={(e) => setHolidayFormData({ ...holidayFormData, reason: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  id="optHolidayCheck"
                  label="Is Floating / Optional Holiday (Employees can elect to take this off)"
                  checked={holidayFormData.isOptional}
                  onChange={(e) => setHolidayFormData({ ...holidayFormData, isOptional: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowHolidayModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Declare Holiday"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Create / Edit Calendar Modal ── */}
      <Modal show={showCalModal} onHide={() => setShowCalModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSaveCalendar}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaCalendarAlt className="text-success" />
              {editingCal ? "Edit Holiday Calendar" : "Add Holiday Calendar"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Calendar Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. National Holidays 2026"
                    value={calFormData.calendarName}
                    onChange={(e) => setCalFormData({ ...calFormData, calendarName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Calendar Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. HOL-CAL-2026"
                    value={calFormData.calendarCode}
                    onChange={(e) => setCalFormData({ ...calFormData, calendarCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="number"
                    min="2000"
                    max="2100"
                    value={calFormData.year}
                    onChange={(e) => setCalFormData({ ...calFormData, year: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Associated Branch</Form.Label>
                  <Form.Select
                    value={calFormData.branchId}
                    onChange={(e) => setCalFormData({ ...calFormData, branchId: e.target.value })}
                  >
                    <option value="">-- All Branches / Global --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.branchName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={calFormData.description}
                    onChange={(e) => setCalFormData({ ...calFormData, description: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={calFormData.status}
                    onChange={(e) => setCalFormData({ ...calFormData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCalModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Calendar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete / Cancel Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Cancel / Delete {deletingType === "calendar" ? "Calendar" : "Holiday"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to {deletingType === "calendar" ? "delete" : "cancel"} <strong>{deletingName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={modalLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={modalLoading}>
            {modalLoading ? <Spinner size="sm" animation="border" /> : "Yes, Proceed"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default HolidayCalendarsSection;
