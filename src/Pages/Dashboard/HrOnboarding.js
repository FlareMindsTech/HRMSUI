import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Nav, Form, Button, ProgressBar, Badge, ListGroup
} from 'react-bootstrap';
import {
  FaPhone, FaEnvelope, FaGlobe, FaLinkedin, FaEdit,
  FaUser, FaBriefcase, FaGraduationCap, FaHome,
  FaUsers, FaFileAlt, FaChevronRight, FaChevronLeft,
  FaCheckCircle, FaPlus, FaTrash
} from 'react-icons/fa';

function HrOnboarding() {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    firstName: 'Mike',
    lastName: 'Jordan',
    email: 'mike_jordan@gmail.com',
    dob: '18.03.1992',
    gender: 'Male',
    mobileNo: '+1 (123) 123-3333',
    skills: ['FinTech', 'Big Data', 'Software'],
    professional: [
      { designation: 'Sales Manager', companyName: 'Plarium', location: 'London, United Kingdom', website: 'www.mikejordan.com', linkedin: 'linkedin.com/mike-jordan' }
    ],
    education: [
      { degree: 'B.Sc Computer Science', university: 'Oxford University', percentage: '85%' }
    ],
    experience: [
      { experienceYears: '8 years', prevCompany: 'Plarium', roleDescription: 'Sales Manager' }
    ],
    addresses: [
      { addressLine1: '123 Baker Street', addressLine2: '', city: 'London', state: '', country: 'United Kingdom', postalCode: '' }
    ],
    // Documents & Bank
    bankName: '',
    accountNo: '',
    panNo: '',
    aadhaarNo: '',
    // Family
    familyMemberName: '',
    relationship: '',
    familyMobile: ''
  });

  const isSectionComplete = (tabId) => {
    if (tabId === 'personal') {
      const fields = ['firstName', 'lastName', 'email', 'mobileNo', 'dob', 'gender'];
      return fields.every(f => formData[f] && formData[f].toString().trim() !== '');
    }
    if (tabId === 'documents') {
      const fields = ['bankName', 'accountNo', 'panNo', 'aadhaarNo'];
      return fields.every(f => formData[f] && formData[f].toString().trim() !== '');
    }
    if (tabId === 'family') {
      const fields = ['familyMemberName', 'relationship', 'familyMobile'];
      return fields.every(f => formData[f] && formData[f].toString().trim() !== '' && formData[f] !== 'Select');
    }

    const sectionArrays = {
      professional: 'professional',
      address: 'addresses',
      education: 'education',
      experience: 'experience'
    };

    const sectionFields = {
      professional: ['designation', 'companyName', 'location'],
      address: ['addressLine1', 'city', 'country'],
      education: ['degree', 'university'],
      experience: ['experienceYears']
    };

    const arrayKey = sectionArrays[tabId];
    if (!arrayKey) return false;
    const firstEntry = formData[arrayKey][0];
    if (!firstEntry) return false;

    return sectionFields[tabId].every(f => firstEntry[f] && firstEntry[f].toString().trim() !== '');
  };

  // Calculate Progress
  const calculateProgress = () => {
    const fieldsToTrack = [
      'firstName', 'lastName', 'email', 'mobileNo', 'dob', 'gender',
      'panNo', 'aadhaarNo', 'bankName', 'accountNo',
      'familyMemberName', 'relationship', 'familyMobile'
    ];

    const filledFields = fieldsToTrack.filter(field => {
      const value = formData[field];
      return value && value.toString().trim() !== '' && value !== 'Select';
    });

    if (isSectionComplete('professional')) filledFields.push('prof');
    if (isSectionComplete('education')) filledFields.push('edu');
    if (isSectionComplete('experience')) filledFields.push('exp');
    if (isSectionComplete('address')) filledFields.push('addr');

    const totalFields = fieldsToTrack.length + 4;
    return Math.round((filledFields.length / totalFields) * 100);
  };

  const progress = calculateProgress();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (section, index, e) => {
    const { name, value } = e.target;
    const updatedArray = [...formData[section]];
    updatedArray[index] = { ...updatedArray[index], [name]: value };
    setFormData(prev => ({ ...prev, [section]: updatedArray }));
  };

  const addArrayItem = (section, emptyItem) => {
    setFormData(prev => ({ ...prev, [section]: [...formData[section], emptyItem] }));
  };

  const removeArrayItem = (section, index) => {
    if (formData[section].length > 1) {
      const updatedArray = formData[section].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [section]: updatedArray }));
    }
  };



  const tabs = [
    { id: 'personal', label: 'Personal', icon: <FaUser /> },
    { id: 'professional', label: 'Professional', icon: <FaBriefcase /> },
    { id: 'address', label: 'Address', icon: <FaHome /> },
    { id: 'education', label: 'Education', icon: <FaGraduationCap /> },
    { id: 'experience', label: 'Experience', icon: <FaBriefcase /> },
    { id: 'family', label: 'Family', icon: <FaUsers /> },
    { id: 'documents', label: 'Documents', icon: <FaFileAlt /> },
  ];

  const renderSection = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <Row className="g-2">
            <Col md={6}>
              <Form.Floating>
                <Form.Control type="text" name="firstName" placeholder="First Name" value={formData.firstName || ''} onChange={handleChange} />
                <label>First Name</label>
              </Form.Floating>
            </Col>
            <Col md={6}>
              <Form.Floating>
                <Form.Control type="text" name="lastName" placeholder="Last Name" value={formData.lastName || ''} onChange={handleChange} />
                <label>Last Name</label>
              </Form.Floating>
            </Col>
            <Col md={6}>
              <Form.Floating>
                <Form.Control type="email" name="email" placeholder="Email" value={formData.email || ''} onChange={handleChange} />
                <label>Email</label>
              </Form.Floating>
            </Col>
            <Col md={6}>
              <Form.Floating>
                <Form.Control type="text" name="mobileNo" placeholder="Mobile No" value={formData.mobileNo || ''} onChange={handleChange} />
                <label>Mobile No</label>
              </Form.Floating>
            </Col>
            <Col md={6}>
              <Form.Floating>
                <Form.Control type="text" name="dob" placeholder="Date of Birth" value={formData.dob || ''} onChange={handleChange} />
                <label>Date of Birth</label>
              </Form.Floating>
            </Col>
            <Col md={6}>
              <Form.Floating>
                <Form.Select name="gender" value={formData.gender || ''} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
                <label>Gender</label>
              </Form.Floating>
            </Col>
          </Row>
        );
      case 'professional':
        return (
          <div className="d-flex flex-column no-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {formData.professional.map((entry, index) => (
              <div key={index} className="p-2 border rounded-3 position-relative bg-white shadow-sm mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                  <span className="extra-small fw-bold text-muted">Role #{index + 1}</span>
                  {formData.professional.length > 1 && (
                    <Button variant="link" className="text-danger p-0 shadow-none lh-1" onClick={() => removeArrayItem('professional', index)}>
                      <FaTrash size={11} />
                    </Button>
                  )}
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control type="text" name="designation" placeholder="Designation" value={entry.designation || ''} onChange={(e) => handleArrayChange('professional', index, e)} />
                      <label>Designation</label>
                    </Form.Floating>
                  </Col>
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control type="text" name="companyName" placeholder="Company Name" value={entry.companyName || ''} onChange={(e) => handleArrayChange('professional', index, e)} />
                      <label>Company Name</label>
                    </Form.Floating>
                  </Col>
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control type="text" name="location" placeholder="Location" value={entry.location || ''} onChange={(e) => handleArrayChange('professional', index, e)} />
                      <label>Location</label>
                    </Form.Floating>
                  </Col>
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control type="text" name="website" placeholder="Website" value={entry.website || ''} onChange={(e) => handleArrayChange('professional', index, e)} />
                      <label>Website</label>
                    </Form.Floating>
                  </Col>
                  <Col md={12}>
                    <Form.Floating>
                      <Form.Control type="text" name="linkedin" placeholder="LinkedIn Profile" value={entry.linkedin || ''} onChange={(e) => handleArrayChange('professional', index, e)} />
                      <label>LinkedIn Profile</label>
                    </Form.Floating>
                  </Col>
                </Row>
              </div>
            ))}
            <Button variant="outline-primary" size="sm" className="w-100 rounded-pill border-dashed py-1 extra-small" onClick={() => addArrayItem('professional', { designation: '', companyName: '', location: '', website: '', linkedin: '' })}>
              <FaPlus size={10} className="me-1" /> Add Professional Record
            </Button>
          </div>
        );
      case 'address':
        return (
          <div className="d-flex flex-column no-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {formData.addresses.map((entry, index) => (
              <div key={index} className="p-2 border rounded-3 position-relative bg-white shadow-sm mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                  <span className="extra-small fw-bold text-muted">Address #{index + 1}</span>
                  {formData.addresses.length > 1 && (
                    <Button variant="link" className="text-danger p-0 shadow-none lh-1" onClick={() => removeArrayItem('addresses', index)}>
                      <FaTrash size={11} />
                    </Button>
                  )}
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control type="text" name="addressLine1" placeholder="Address Line 1" value={entry.addressLine1 || ''} onChange={(e) => handleArrayChange('addresses', index, e)} />
                      <label>Address Line 1</label>
                    </Form.Floating>
                  </Col>
                  <Col md={6}>
                    <Form.Floating>
                      <Form.Control type="text" name="addressLine2" placeholder="Address Line 2" value={entry.addressLine2 || ''} onChange={(e) => handleArrayChange('addresses', index, e)} />
                      <label>Address Line 2</label>
                    </Form.Floating>
                  </Col>
                  <Col md={4}>
                    <Form.Floating>
                      <Form.Control type="text" name="city" placeholder="City" value={entry.city || ''} onChange={(e) => handleArrayChange('addresses', index, e)} />
                      <label>City</label>
                    </Form.Floating>
                  </Col>
                  <Col md={4}>
                    <Form.Floating>
                      <Form.Control type="text" name="state" placeholder="State" value={entry.state || ''} onChange={(e) => handleArrayChange('addresses', index, e)} />
                      <label>State</label>
                    </Form.Floating>
                  </Col>
                  <Col md={4}>
                    <Form.Floating>
                      <Form.Control type="text" name="postalCode" placeholder="Postal Code" value={entry.postalCode || ''} onChange={(e) => handleArrayChange('addresses', index, e)} />
                      <label>Postal Code</label>
                    </Form.Floating>
                  </Col>
                  <Col md={12}>
                    <Form.Floating>
                      <Form.Control type="text" name="country" placeholder="Country" value={entry.country || ''} onChange={(e) => handleArrayChange('addresses', index, e)} />
                      <label>Country</label>
                    </Form.Floating>
                  </Col>
                </Row>
              </div>
            ))}
            <Button variant="outline-primary" size="sm" className="w-100 rounded-pill border-dashed py-1 extra-small" onClick={() => addArrayItem('addresses', { addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '' })}>
              <FaPlus size={10} className="me-1" /> Add Another Address
            </Button>
          </div>
        );
      case 'education':
        return (
          <div className="d-flex flex-column no-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {formData.education.map((entry, index) => (
              <div key={index} className="p-2 border rounded-3 position-relative bg-white shadow-sm mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1 px-1">
                  <span className="extra-small fw-bold text-muted">Education #{index + 1}</span>
                  {formData.education.length > 1 && (
                    <Button variant="link" className="text-danger p-0 shadow-none lh-1" onClick={() => removeArrayItem('education', index)}>
                      <FaTrash size={11} />
                    </Button>
                  )}
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="extra-small mb-0">Degree / Qualification</Form.Label>
                      <Form.Control size="sm" type="text" name="degree" value={entry.degree || ''} onChange={(e) => handleArrayChange('education', index, e)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="extra-small mb-0">University / School</Form.Label>
                      <Form.Control size="sm" type="text" name="university" value={entry.university || ''} onChange={(e) => handleArrayChange('education', index, e)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="extra-small mb-0">Percentage / CGPA</Form.Label>
                      <Form.Control size="sm" type="text" name="percentage" value={entry.percentage || ''} onChange={(e) => handleArrayChange('education', index, e)} />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
            <Button variant="outline-primary" size="sm" className="w-100 rounded-pill border-dashed py-1 extra-small" onClick={() => addArrayItem('education', { degree: '', university: '', percentage: '' })}>
              <FaPlus size={10} className="me-1" /> Add Education Detail
            </Button>
          </div>
        );
      case 'experience':
        return (
          <div className="d-flex flex-column no-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {formData.experience.map((entry, index) => (
              <div key={index} className="p-2 border rounded-3 position-relative bg-white shadow-sm mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1 px-1">
                  <span className="extra-small fw-bold text-muted">Experience #{index + 1}</span>
                  {formData.experience.length > 1 && (
                    <Button variant="link" className="text-danger p-0 shadow-none lh-1" onClick={() => removeArrayItem('experience', index)}>
                      <FaTrash size={11} />
                    </Button>
                  )}
                </div>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="extra-small mb-0">Total Experience</Form.Label>
                      <Form.Control size="sm" type="text" name="experienceYears" value={entry.experienceYears || ''} onChange={(e) => handleArrayChange('experience', index, e)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="extra-small mb-0">Previous Company</Form.Label>
                      <Form.Control size="sm" type="text" name="prevCompany" value={entry.prevCompany || ''} onChange={(e) => handleArrayChange('experience', index, e)} />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="extra-small mb-0">Description of Role</Form.Label>
                      <Form.Control as="textarea" rows={2} name="roleDescription" value={entry.roleDescription || ''} onChange={(e) => handleArrayChange('experience', index, e)} style={{ fontSize: '0.8rem' }} />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
            <Button variant="outline-primary" size="sm" className="w-100 rounded-pill border-dashed py-1 extra-small" onClick={() => addArrayItem('experience', { experienceYears: '', prevCompany: '', roleDescription: '' })}>
              <FaPlus size={10} className="me-1" /> Add Experience Record
            </Button>
          </div>
        );
      case 'family':
        return (
          <Row className="g-2">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="extra-small mb-0">Dependent Name</Form.Label>
                <Form.Control size="sm" type="text" name="familyMemberName" value={formData.familyMemberName || ''} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="extra-small mb-0">Relationship</Form.Label>
                <Form.Select size="sm" name="relationship" value={formData.relationship || ''} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="extra-small mb-0">Mobile Number</Form.Label>
                <Form.Control size="sm" type="text" name="familyMobile" value={formData.familyMobile || ''} onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>
        );
      case 'documents':
        return (
          <Row className="g-2">
            <Col md={12}><h6 className="fw-bold extra-small" style={{ color: 'var(--primary-color)' }}>Bank & ID Details</h6></Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="extra-small mb-0">Bank Name</Form.Label>
                <Form.Control size="sm" type="text" name="bankName" value={formData.bankName || ''} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="extra-small mb-0">Account Number</Form.Label>
                <Form.Control size="sm" type="text" name="accountNo" value={formData.accountNo || ''} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="extra-small mb-0">PAN Number</Form.Label>
                <Form.Control size="sm" type="text" name="panNo" placeholder="ABCDE1234F" value={formData.panNo || ''} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="extra-small mb-0">Aadhaar Number</Form.Label>
                <Form.Control size="sm" type="text" name="aadhaarNo" placeholder="0000 0000 0000" value={formData.aadhaarNo || ''} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={12} className="mt-2 text-center bg-light border border-dashed rounded-3 p-2">
              <FaFileAlt size={20} className="text-muted mb-1" />
              <p className="extra-small mb-0">Drag and drop or <span className="text-primary fw-bold">Browse</span></p>
              <span className="extra-small text-muted" style={{ fontSize: '0.65rem' }}>Aadhaar, PAN, Degree (PDF, Max 5MB)</span>
            </Col>
          </Row>
        );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="p-3 no-scrollbar" style={{ height: 'calc(100vh - var(--header-height))', overflowY: 'auto' }}>
      <Row className="mb-3 align-items-center">
        <Col>
          <h4 className="fw-bold mb-0" style={{ color: 'var(--primary-color)' }}>Employee Onboarding</h4>
          <p className="text-muted small mb-0">Fill in the details to onboard a new team member.</p>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            className="rounded-pill px-4 d-flex align-items-center gap-2 border-0 shadow-sm"
            style={{ backgroundColor: 'var(--primary-color)', fontSize: '0.85rem' }}
          >
            <FaPlus /> Create New Employee
          </Button>
        </Col>
      </Row>

      <Row>
        {/* Left Section: Live Preview (As requested based on image) */}
        <Col xl={8} className="mb-2">
          <Card className="premium-card mb-2 overflow-visible border-0 shadow-sm">
            <Card.Body className="gradient-bg p-2 d-flex flex-wrap align-items-center position-relative" style={{ minHeight: '150px' }}>
              <div className="position-absolute top-0 end-0 p-1">
                <Button variant="link" className="text-white p-0 opacity-75 hover-opacity-100 shadow-none">
                  <FaEdit /> <small>Edit</small>
                </Button>
              </div>

              <div className="me-2 mb-2 mb-md-0 position-relative" style={{ width: '110px', height: '110px' }}>
                <svg className="position-absolute top-0 start-0" width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="55" cy="55" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                  <circle
                    cx="55" cy="55" r="52" fill="none"
                    stroke="white" strokeWidth="4"
                    strokeDasharray="326.7"
                    strokeDashoffset={326.7 * (1 - progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle rounded-circle overflow-hidden shadow-sm d-flex align-items-center justify-content-center" style={{ width: '96px', height: '96px', background: 'white' }}>
                  <Card.Img
                    src={`https://img.freepik.com/premium-vector/man-avatar-profile-picture-isolated-background-avatar-profile-picture-man_1293239-4841.jpg?semt=ais_rp_progressive&w=740&q=80`}
                    alt="Profile"
                    className="w-100 h-100 object-fit-cover"
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-grow-1 text-white">
                <Card.Title as="h2" className="fw-bold mb-0 text-white" style={{ fontSize: '1.4rem' }}>{formData.firstName} {formData.lastName}</Card.Title>
                <Card.Text className="small opacity-90 mb-2 text-white">
                  {formData.professional[0]?.designation || 'Position'} at {formData.professional[0]?.companyName || 'Company'}
                </Card.Text>

                <Row className="g-2">
                  <Col md={6} className="d-flex align-items-center gap-2 text-white">
                    <div className="bg-white bg-opacity-20 rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                      <FaPhone size={11} className="text-white" />
                    </div>
                    <span className="small text-white">{formData.mobileNo}</span>
                  </Col>
                  <Col md={6} className="d-flex align-items-center gap-2 text-white">
                    <div className="bg-white bg-opacity-20 rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                      <FaEnvelope size={11} className="text-white" />
                    </div>
                    <span className="small text-white">{formData.email}</span>
                  </Col>
                  <Col md={6} className="mt-1 text-white">
                    <p className="mb-0 opacity-75 extra-small text-white" style={{ fontSize: '0.75rem' }}>
                      {formData.addresses[0]?.city}, {formData.addresses[0]?.country}
                    </p>
                    <p className="mb-0 opacity-75 extra-small text-white" style={{ fontSize: '0.75rem' }}>{formData.dob} (28 y.o.)</p>
                  </Col>
                  <Col md={6} className="mt-1 d-flex flex-column gap-1 text-white">
                    <div className="d-flex align-items-center gap-2 text-white">
                      <FaGlobe className="opacity-75 text-white" size={12} />
                      <span className="opacity-90 extra-small text-white" style={{ fontSize: '0.75rem' }}>{formData.professional[0]?.website}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-white">
                      <FaLinkedin className="opacity-75 text-white" size={12} />
                      <span className="opacity-90 extra-small text-white" style={{ fontSize: '0.75rem' }}>{formData.professional[0]?.linkedin}</span>
                    </div>
                  </Col>
                </Row>
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  {formData.skills.map((skill, i) => (
                    <Badge key={i} pill bg="white" className="shadow-sm extra-small py-1 px-2" style={{ color: 'var(--primary-color) !important', fontSize: '0.7rem' }}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card.Body >
          </Card >

          {/* Form Content */}
          < Card className="premium-card p-2 border-0 shadow-sm" >
            <Card.Body className="p-0">
              <h6 className="fw-bold mb-2">Onboarding Details</h6>
              <Nav variant="pills" className="gap-1 mb-2 no-scrollbar flex-nowrap overflow-x-auto">
                {tabs.map(tab => {
                  const isComplete = isSectionComplete(tab.id);
                  return (
                    <Nav.Item key={tab.id}>
                      <Nav.Link
                        active={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`d-flex align-items-center gap-1 extra-small py-1 px-2 position-relative transition-all ${isComplete && activeTab !== tab.id ? 'text-success fw-medium' : ''}`}
                        style={{
                          fontSize: '0.75rem',
                          borderBottom: isComplete && activeTab !== tab.id ? '2px solid #28a745' : activeTab === tab.id ? 'none' : '2px solid transparent',
                          borderRadius: activeTab === tab.id ? '4px' : '0'
                        }}
                      >
                        {tab.icon} {tab.label}
                        {isComplete && (
                          <FaCheckCircle
                            size={10}
                            className={activeTab === tab.id ? 'text-white ms-1' : 'text-success ms-1'}
                          />
                        )}
                      </Nav.Link>
                    </Nav.Item>
                  );
                })}
              </Nav>

              <div className="mt-1">
                {renderSection()}
              </div>

              <div className="mt-3 d-flex justify-content-between">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="rounded-pill px-3 d-flex align-items-center gap-1 extra-small"
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1].id);
                  }}
                  disabled={activeTab === tabs[0].id}
                >
                  <FaChevronLeft size={10} /> Previous
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-pill px-4 d-flex align-items-center gap-1 gradient-bg border-0 extra-small"
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                    else alert('Form submitted successfully!');
                  }}
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  {activeTab === tabs[tabs.length - 1].id ? 'Complete' : 'Next'} <FaChevronRight size={10} />
                </Button>
              </div>
            </Card.Body>
          </Card >
        </Col >

        {/* Right Section: Stats (Based on image) */}
        < Col xl={4} >
          <Card className="premium-card p-2 mb-2 text-center border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="fw-bold text-muted mb-0 extra-small">Progress</h6>
                <Button variant="link" className="p-0 extra-small shadow-none" style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }}>Edit</Button>
              </div>

              <div className="position-relative d-inline-block mx-auto mb-2">
                <svg width="100" height="100" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="60" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle
                    cx="75" cy="75" r="60" fill="none"
                    stroke="url(#gradient)" strokeWidth="12"
                    strokeDasharray="376.8"
                    strokeDashoffset={376.8 * (1 - progress / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 75 75)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#04f3f3ff" />
                      <stop offset="100%" stopColor="#064b4b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                  <h6 className="fw-bold mb-0">{progress}%</h6>
                  <span className="text-muted extra-small" style={{ fontSize: '0.6rem' }}>achieved</span>
                </div>
              </div>

              <div className="p-1 bg-light rounded-3 mb-1 text-start">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted extra-small" style={{ fontSize: '0.65rem' }}>Completion</span>
                  <span className="fw-bold extra-small" style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>{progress}%</span>
                </div>
                <ProgressBar
                  now={progress}
                  className="rounded-pill progress-teal"
                  style={{ height: '4px' }}
                />
                <p className="mt-1 mb-0 fw-medium extra-small" style={{ fontSize: '0.6rem', color: 'var(--primary-color)' }}>
                  {Math.round(progress / 100 * 17)} <span className="text-muted fw-normal">of 17 fields</span>
                </p>
              </div>
            </Card.Body>
          </Card>

          <Card className="premium-card p-2 border-0 shadow-sm">
            <Card.Body className="p-0 text-start">
              <h6 className="fw-bold mb-1 extra-small">Quick Actions</h6>
              <ListGroup variant="flush" className="gap-1">
                <ListGroup.Item action className="border rounded-3 d-flex align-items-center justify-content-between p-1 px-2 border-light-subtle extra-small">
                  <div>
                    <h6 className="mb-0 fw-bold extra-small" style={{ fontSize: '0.75rem' }}>Verify Documents</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>Pending 3 files</p>
                  </div>
                  <FaChevronRight className="text-muted" size={10} />
                </ListGroup.Item>
                <ListGroup.Item action className="border rounded-3 d-flex align-items-center justify-content-between p-1 px-2 border-light-subtle extra-small">
                  <div>
                    <h6 className="mb-0 fw-bold extra-small" style={{ fontSize: '0.75rem' }}>Asset Allocation</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>Laptop, ID Card</p>
                  </div>
                  <FaChevronRight className="text-muted" size={10} />
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col >
      </Row >
    </Container >
  );
}

export default HrOnboarding;