import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Form, Button, Badge, Spinner } from 'react-bootstrap';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    leaveTypeId: ''
  });
  const [reportTable, setReportTable] = useState([]);

  useEffect(() => {
    fetchReportData();
    fetchEmployees();
    fetchLeaveTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchReportTable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dashboard/hr');
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees/directory?limit=1000');
      const profiles = response.data.profiles || [];
      setEmployees(profiles.filter(p => p.userId && p.userId._id));
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees list');
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await api.get('/api/leave-types');
      setLeaveTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchReportTable = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.leaveTypeId) params.append('leaveTypeId', filters.leaveTypeId);

      const response = await api.get(`/api/dashboard/export?${params}`);
      setReportTable(response.data || []);
    } catch (error) {
      console.error('Error fetching report table:', error);
      toast.error('Failed to load report data');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.leaveTypeId) params.append('leaveTypeId', filters.leaveTypeId);

      const response = await api.get(`/api/dashboard/export?${params}`);
      
      if (response.data && response.data.length > 0) {
        const headers = Object.keys(response.data[0]);
        const csvContent = [
          headers.join(','),
          ...response.data.map(row => 
            headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leave-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('Report exported successfully');
      } else {
        toast.warning('No data to export');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      MANAGER_APPROVED: 'info',
      HR_APPROVED: 'success',
      REJECTED: 'danger',
      CANCELLED: 'secondary'
    };
    return (
      <Badge bg={variants[status] || 'secondary'} className="px-3 py-2">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || '';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} className="mb-3" />
          <p className="text-muted fs-5">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        color: '#334155',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              <i className="fas fa-chart-line me-3"></i>
              Reports & Analytics
            </h1>
            <p className="text-muted mb-0">
              Comprehensive insights into leave management and employee statistics
            </p>
          </div>
          <div className="text-muted">
            <i className="fas fa-chart-bar" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
          </div>
        </div>
      </div>

      {/* Summary Cards (single non-wrapping row) */}
      <div className="d-flex flex-row flex-nowrap mb-4 analytics-grid" style={{gap: '1rem', overflowX: 'auto'}}>
        <div style={{flex: '0 0 25%'}}>
          <Card className="analytics-card variant-1 shadow-sm border-0 h-100">
            <div className="analytics-body">
              <div className="analytics-icon analytics-icon-1"><i className="fas fa-users fa-2x"></i></div>
              <div className="metric-value">{reportData?.totalEmployees || 0}</div>
              <div className="metric-label">Total Employees</div>
            </div>
          </Card>
        </div>
        <div style={{flex: '0 0 25%'}}>
          <Card className="analytics-card variant-2 shadow-sm border-0 h-100">
            <div className="analytics-body">
              <div className="analytics-icon analytics-icon-2"><i className="fas fa-clock fa-2x"></i></div>
              <div className="metric-value">{reportData?.pendingApprovals || 0}</div>
              <div className="metric-label">Pending Approvals</div>
            </div>
          </Card>
        </div>
        <div style={{flex: '0 0 25%'}}>
          <Card className="analytics-card variant-3 shadow-sm border-0 h-100">
            <div className="analytics-body">
              <div className="analytics-icon analytics-icon-3"><i className="fas fa-calendar-check fa-2x"></i></div>
              <div className="metric-value">{reportData?.leaveStats?.find(s => s._id === 'HR_APPROVED')?.count || 0}</div>
              <div className="metric-label">Approved Leaves</div>
            </div>
          </Card>
        </div>
        <div style={{flex: '0 0 25%'}}>
          <Card className="analytics-card variant-4 shadow-sm border-0 h-100">
            <div className="analytics-body">
              <div className="analytics-icon analytics-icon-4"><i className="fas fa-calendar-times fa-2x"></i></div>
              <div className="metric-value">{reportData?.leaveStats?.find(s => s._id === 'REJECTED')?.count || 0}</div>
              <div className="metric-label">Rejected Leaves</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4 g-4">
        <Col md={6}>
            <Card className="modern-table-wrapper h-100">
              <Card.Header className="panel-header-light">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="fas fa-chart-pie me-3"></i>
                  Leave Status Statistics
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {reportData?.leaveStats && reportData.leaveStats.length > 0 ? (
                  <div className="table-responsive">
                    <Table className="table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                          <th>Total Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.leaveStats.map(stat => (
                          <tr key={stat._id}>
                            <td>{getStatusBadge(stat._id)}</td>
                            <td>
                              <strong className="fs-5 text-primary">{stat.count}</strong>
                            </td>
                            <td>
                              <strong className="fs-5 text-success">{stat.totalDays}</strong> days
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="table-empty">
                    <i className="fas fa-chart-pie"></i>
                    <p className="mb-0">No statistics available</p>
                  </div>
                )}
              </Card.Body>
            </Card>
        </Col>
        <Col md={6}>
            <Card className="modern-table-wrapper h-100">
              <Card.Header className="panel-header-light">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="fas fa-chart-line me-3"></i>
                  Monthly Leave Trends
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {reportData?.monthlyTrends && reportData.monthlyTrends.length > 0 ? (
                  <div className="table-responsive">
                    <Table className="table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Leaves</th>
                          <th>Total Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.monthlyTrends.map(trend => (
                          <tr key={trend._id}>
                            <td>
                              <strong className="fs-5 text-primary">{getMonthName(trend._id)}</strong>
                            </td>
                            <td>
                              <span className="fw-semibold">{trend.count}</span>
                            </td>
                            <td>
                              <span className="fw-semibold">{trend.totalDays}</span> days
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="table-empty">
                    <i className="fas fa-chart-line"></i>
                    <p className="mb-0">No trends available</p>
                  </div>
                )}
              </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* Leave Type Usage */}
      <Card className="modern-table-wrapper mb-4">
        <Card.Header className="panel-header-light">
          <h5 className="mb-0 d-flex align-items-center">
            <i className="fas fa-list me-3"></i>
            Leave Type Usage
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {reportData?.leaveTypeUsage && reportData.leaveTypeUsage.length > 0 ? (
            <div className="table-responsive">
              <Table className="table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Number of Leaves</th>
                    <th>Total Days</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.leaveTypeUsage.map(usage => (
                    <tr key={usage._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="table-color-indicator"
                            style={{ backgroundColor: usage.leaveType?.color || '#6c757d' }}
                          ></div>
                          <span className="fw-semibold">{usage.leaveType?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <strong className="fs-5 text-primary">{usage.count}</strong>
                      </td>
                      <td>
                        <strong className="fs-5 text-success">{usage.totalDays}</strong> days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="table-empty">
              <i className="fas fa-list"></i>
              <p className="mb-0">No leave type usage data available</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Detailed Report with Filters */}
      <Card className="modern-table-wrapper">
        <Card.Header className="panel-header-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              <i className="fas fa-table me-3"></i>
              Detailed Leave Report
            </h5>
            <Button 
              variant="light" 
              onClick={handleExport}
              disabled={exporting || !filters.startDate || !filters.endDate}
              className="btn-modern"
            >
              <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-download'} me-2`}></i>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {/* Filters */}
          <div className="table-filters">
            <h6 className="mb-3 fw-bold text-muted">
              <i className="fas fa-filter me-2 text-primary"></i>
              Filter Options
            </h6>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted">
                    <i className="fas fa-calendar-alt me-2 text-primary"></i>
                    Start Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted">
                    <i className="fas fa-calendar-check me-2 text-primary"></i>
                    End Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted">
                    <i className="fas fa-user me-2 text-primary"></i>
                    Employee
                  </Form.Label>
                  <Form.Select
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  >
                    <option value="">All Employees</option>
                    {employees.map(emp => (
                      <option key={emp.userId?._id || emp._id} value={emp.userId?._id || emp._id}>
                        {emp.userId?.firstName || emp.firstName} {emp.userId?.lastName || emp.lastName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted">
                    <i className="fas fa-tags me-2 text-primary"></i>
                    Leave Type
                  </Form.Label>
                  <Form.Select
                    value={filters.leaveTypeId}
                    onChange={(e) => setFilters({ ...filters, leaveTypeId: e.target.value })}
                  >
                    <option value="">All Leave Types</option>
                    {leaveTypes.map(lt => (
                      <option key={lt._id} value={lt._id}>
                        {lt.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Report Table */}
          {!filters.startDate || !filters.endDate ? (
            <div className="table-empty">
              <i className="fas fa-info-circle"></i>
              <p className="mb-0">Please select a date range to view detailed report</p>
            </div>
          ) : reportTable.length === 0 ? (
            <div className="table-empty">
              <i className="fas fa-exclamation-triangle"></i>
              <p className="mb-0">No leave data found for the selected filters</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Is LOP</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {reportTable.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-semibold">{row.Employee}</div>
                      </td>
                      <td>
                        <span className="text-muted">{row.Email}</span>
                      </td>
                      <td>
                        <span className="text-muted">{row.Department || 'N/A'}</span>
                      </td>
                      <td>
                        <Badge bg="primary" className="px-2 py-1">{row.LeaveType}</Badge>
                      </td>
                      <td>
                        <span className="text-muted">{row.StartDate}</span>
                      </td>
                      <td>
                        <span className="text-muted">{row.EndDate}</span>
                      </td>
                      <td>
                        <strong className="text-primary">{row.Days}</strong>
                      </td>
                      <td>{getStatusBadge(row.Status)}</td>
                      <td>
                        <Badge bg={row.IsLOP === 'Yes' ? 'warning' : 'success'} className="px-2 py-1">
                          {row.IsLOP}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted" title={row.Reason}>
                          {row.Reason ? (row.Reason.length > 30 ? row.Reason.substring(0, 30) + '...' : row.Reason) : 'N/A'}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Reports;
