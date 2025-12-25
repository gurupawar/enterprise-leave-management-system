import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const EmployeeProfile = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [profile, setProfile] = useState({
    personalInfo: {
      phone: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      emergencyContact: { name: '', relationship: '', phone: '', email: '' },
      bloodGroup: '',
      maritalStatus: 'SINGLE'
    },
    professionalInfo: {
      employeeId: '',
      designation: '',
      workLocation: '',
      employmentType: 'FULL_TIME',
      skills: [],
      certifications: []
    },
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'SAVINGS'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      let response;
      if (id) {
        response = await api.get(`/api/employees/profile/${encodeURIComponent(id)}`);
      } else {
        response = await api.get('/api/employee-profiles/me');
      }
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to load profile';
      toast.error(msg);

      // Provide a minimal fallback so the page shows something related to the employee
        if (id) {
          // If current user is admin, try to fetch from employee-profiles list as a fallback
          if (user?.role === 'ADMIN') {
            try {
              const listRes = await api.get('/api/employee-profiles');
              const found = listRes.data.find(p => (p.userId?._id || p.userId) && (p.userId._id?.toString?.() === id || p.userId === id || p._id === id));
              if (found) {
                setProfile(found);
                return;
              }
            } catch (innerErr) {
              console.error('Fallback fetch from /api/employee-profiles failed:', innerErr);
            }
          }

          setProfile({
            _id: id,
            userId: { _id: id, firstName: 'Unknown', lastName: '' },
            workInfo: {},
            professionalInfo: {},
            personalInfo: {},
            skills: []
          });
        }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        if (user?.role !== 'ADMIN') {
          toast.error('Only admins can edit other profiles');
          return;
        }
        const userId = id;
        await api.put(`/api/employees/profile/${userId}`, profile);
        const userPayload = {
          firstName: profile.userId?.firstName,
          lastName: profile.userId?.lastName,
          email: profile.userId?.email,
          department: profile.professionalInfo?.department || profile.userId?.department
        };
        await api.put(`/api/users/${userId}`, userPayload);
        toast.success('Profile updated successfully');
      } else {
        await api.put('/api/employee-profiles/me', profile);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error updating profile');
    }
  };

  const updateNestedField = (section, field, value) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-user-circle me-3 text-primary"></i>
          {id ? 'Employee Profile' : 'My Profile'}
        </h1>
        <p className="text-muted">Manage your personal and professional information</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>First Name</Form.Label>
                  <Form.Control value={profile.userId?.firstName || ''} onChange={(e) => setProfile(prev => ({ ...prev, userId: { ...prev.userId, firstName: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control value={profile.userId?.lastName || ''} onChange={(e) => setProfile(prev => ({ ...prev, userId: { ...prev.userId, lastName: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={profile.userId?.email || ''} onChange={(e) => setProfile(prev => ({ ...prev, userId: { ...prev.userId, email: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
              <Col md={4} className="mt-2">
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Control value={profile.professionalInfo?.department || profile.userId?.department || ''} onChange={(e) => setProfile(prev => ({ ...prev, professionalInfo: { ...prev.professionalInfo, department: e.target.value }, userId: { ...prev.userId, department: e.target.value } }))} disabled={!!id && user?.role !== 'ADMIN'} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        <Tabs defaultActiveKey="personal" className="mb-4">
          <Tab eventKey="personal" title="Personal Info">
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        value={profile.personalInfo?.phone || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'phone', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.bloodGroup || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'bloodGroup', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Marital Status</Form.Label>
                      <Form.Select
                        value={profile.personalInfo?.maritalStatus || 'SINGLE'}
                        onChange={(e) => updateNestedField('personalInfo', 'maritalStatus', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <h6 className="mt-4 mb-3">Address</h6>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Street</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.address?.street || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'address', {
                          ...profile.personalInfo?.address,
                          street: e.target.value
                        })}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.address?.city || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'address', {
                          ...profile.personalInfo?.address,
                          city: e.target.value
                        })}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.personalInfo?.address?.state || ''}
                        onChange={(e) => updateNestedField('personalInfo', 'address', {
                          ...profile.personalInfo?.address,
                          state: e.target.value
                        })}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="professional" title="Professional Info">
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Employee ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.professionalInfo?.employeeId || ''}
                        onChange={(e) => updateNestedField('professionalInfo', 'employeeId', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Designation</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.professionalInfo?.designation || ''}
                        onChange={(e) => updateNestedField('professionalInfo', 'designation', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Work Location</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.professionalInfo?.workLocation || ''}
                        onChange={(e) => updateNestedField('professionalInfo', 'workLocation', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Employment Type</Form.Label>
                      <Form.Select
                        value={profile.professionalInfo?.employmentType || 'FULL_TIME'}
                        onChange={(e) => updateNestedField('professionalInfo', 'employmentType', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      >
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="INTERN">Intern</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-calendar-alt me-2"></i>
                        Date of Joining
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.userId?.joinDate ? new Date(profile.userId.joinDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'N/A'}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                      <Form.Text className="text-muted">
                        This is your official joining date with the company
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="bank" title="Bank Details">
            <Card>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.bankDetails?.accountNumber || ''}
                        onChange={(e) => updateNestedField('bankDetails', 'accountNumber', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bank Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.bankDetails?.bankName || ''}
                        onChange={(e) => updateNestedField('bankDetails', 'bankName', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>IFSC Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.bankDetails?.ifscCode || ''}
                        onChange={(e) => updateNestedField('bankDetails', 'ifscCode', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Type</Form.Label>
                      <Form.Select
                        value={profile.bankDetails?.accountType || 'SAVINGS'}
                        onChange={(e) => updateNestedField('bankDetails', 'accountType', e.target.value)}
                        disabled={!!id && user?.role !== 'ADMIN'}
                      >
                        <option value="SAVINGS">Savings</option>
                        <option value="CURRENT">Current</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        <div className="text-end">
          <Button variant="primary" type="submit" size="lg" disabled={!!id && user?.role !== 'ADMIN'}>
            <i className="fas fa-save me-2"></i>Save Profile
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EmployeeProfile;