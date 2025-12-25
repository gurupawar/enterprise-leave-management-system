import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Table, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Files = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [fileForm, setFileForm] = useState({
    type: 'ORGANIZATION',
    category: '',
    description: '',
    isPublic: true,
    targetUserId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchFiles();
    if (['HR', 'ADMIN'].includes(user?.role)) {
      fetchEmployees();
    }
  }, [user?.role]);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/api/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error fetching files');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      Object.keys(fileForm).forEach(key => {
        if (fileForm[key]) {
          formData.append(key, fileForm[key]);
        }
      });

      await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowModal(false);
      setFileForm({ type: 'ORGANIZATION', category: '', description: '', isPublic: true, targetUserId: '' });
      setSelectedFile(null);
      fetchFiles();
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Error uploading file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.delete(`/api/files/${fileId}`);
        fetchFiles();
        toast.success('File deleted successfully');
      } catch (error) {
        toast.error('Error deleting file');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between">
        <div>
          <h1 className="page-title mb-1">
            <i className="fas fa-folder-open me-3 text-primary"></i>
            Files & Documents
          </h1>
          <p className="text-muted mb-0">Manage organization and employee files</p>
        </div>
        {['HR', 'ADMIN'].includes(user?.role) && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-upload me-2"></i>Upload File
          </Button>
        )}
      </div>

      <Row>
        <Col>
          <Card className="modern-table-wrapper">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-folder me-2"></i>
                All Files
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {files.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Uploaded By</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map(file => (
                        <tr key={file._id}>
                          <td>
                            <div>
                              <div className="fw-semibold">
                                <i className="fas fa-file me-2 text-primary"></i>
                                {file.name}
                              </div>
                              {file.description && (
                                <small className="text-muted">{file.description}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg={file.type === 'ORGANIZATION' ? 'primary' : 'info'} className="px-3 py-2">
                              <i className={`fas fa-${file.type === 'ORGANIZATION' ? 'building' : 'user'} me-1`}></i>
                              {file.type}
                            </Badge>
                          </td>
                          <td>
                            <span className="text-muted">{file.category || 'N/A'}</span>
                          </td>
                          <td>
                            <span className="fw-semibold">{formatFileSize(file.size)}</span>
                          </td>
                          <td>
                            <div>
                              <div className="fw-semibold">{file.uploadedBy?.firstName} {file.uploadedBy?.lastName}</div>
                              <small className="text-muted">{file.uploadedBy?.email}</small>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">{new Date(file.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                href={`/api/files/download/${file._id}`}
                                target="_blank"
                              >
                                <i className="fas fa-download me-1"></i>
                                Download
                              </Button>
                              {['HR', 'ADMIN'].includes(user?.role) && (
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleDeleteFile(file._id)}
                                >
                                  <i className="fas fa-trash me-1"></i>
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="table-empty">
                  <i className="fas fa-folder-open"></i>
                  <p className="mb-0">No files uploaded yet</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upload Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload File</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFileUpload}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={fileForm.type}
                    onChange={(e) => setFileForm({...fileForm, type: e.target.value})}
                  >
                    <option value="ORGANIZATION">Organization File</option>
                    <option value="EMPLOYEE">Employee File</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={fileForm.category}
                    onChange={(e) => setFileForm({...fileForm, category: e.target.value})}
                    placeholder="e.g., Policy, Handbook, Form"
                  />
                </Form.Group>
              </Col>
              {fileForm.type === 'EMPLOYEE' && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Target Employee</Form.Label>
                    <Form.Select
                      value={fileForm.targetUserId}
                      onChange={(e) => setFileForm({...fileForm, targetUserId: e.target.value})}
                      required={fileForm.type === 'EMPLOYEE'}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} - {emp.department}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={fileForm.description}
                onChange={(e) => setFileForm({...fileForm, description: e.target.value})}
                placeholder="Brief description of the file"
              />
            </Form.Group>

            {fileForm.type === 'ORGANIZATION' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Make public to all employees"
                  checked={fileForm.isPublic}
                  onChange={(e) => setFileForm({...fileForm, isPublic: e.target.checked})}
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Upload File
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Files;