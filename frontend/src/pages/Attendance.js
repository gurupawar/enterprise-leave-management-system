import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTodayStatus(selectedUser);
    fetchAttendanceHistory(selectedUser);
    if (user?.role && ['MANAGER', 'HR', 'ADMIN'].includes(user.role)) fetchEmployees();
    
    // Update current time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const fetchTodayStatus = async (userId = '') => {
    try {
      let url = '/api/attendance/today';
      if (userId) url += `?userId=${userId}`;
      const response = await api.get(url);
      setTodayStatus(response.data);
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  const fetchAttendanceHistory = async (userId = '') => {
    try {
      let url = '/api/attendance?limit=50';
      if (userId) url += `&userId=${userId}`;
      const response = await api.get(url);
      setAttendanceHistory(response.data.attendance || response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees/directory');
      const profiles = response.data.profiles || [];
      const users = profiles.map(p => p.userId).filter(Boolean);
      setEmployees(users);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCheckIn = async () => {
    if (selectedUser && selectedUser !== user?.id) return toast.error('Cannot check in for another user');
    setLoading(true);
    try {
      // Get location if available
      let location = null;
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      }

      await api.post('/api/attendance/checkin', { location });
      toast.success(
        <div className="d-flex align-items-center">
          <i className="fas fa-check-circle me-2"></i>
          Checked in successfully!
        </div>
      );
      fetchTodayStatus();
      fetchAttendanceHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error checking in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (selectedUser && selectedUser !== user?.id) return toast.error('Cannot check out for another user');
    setLoading(true);
    try {
      let location = null;
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      }

      await api.post('/api/attendance/checkout', { location });
      toast.success(
        <div className="d-flex align-items-center">
          <i className="fas fa-check-circle me-2"></i>
          Checked out successfully!
        </div>
      );
      fetchTodayStatus();
      fetchAttendanceHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error checking out');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      Present: 'success',
      Absent: 'danger',
      'Half Day': 'warning',
      Late: 'warning',
      'On Leave': 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatTime = (dateString) => {
    return dateString ? new Date(dateString).toLocaleTimeString() : 'N/A';
  };

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const downloadCSV = async () => {
    try {
      const params = new URLSearchParams();
      const d = new Date();
      params.append('month', d.getMonth() + 1);
      params.append('year', d.getFullYear());
      if (selectedUser) params.append('userId', selectedUser);

      const resp = await api.get(`/api/attendance/report?${params.toString()}`);
      const rows = resp.data.attendance || [];
      const headers = ['Employee','Date','Check In','Check Out','Total Hours','Status'];
      const csv = [headers.join(',')].concat(rows.map(r => {
        const emp = r.userId ? `${r.userId.firstName || ''} ${r.userId.lastName || ''}`.trim() : '';
        const date = new Date(r.date).toLocaleDateString();
        const checkIn = r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '';
        const checkOut = r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '';
        const total = r.totalHours ? `${Math.floor(r.totalHours)}h ${Math.floor((r.totalHours - Math.floor(r.totalHours))*60)}m` : '';
        const status = r.status || '';
        return `"${emp}","${date}","${checkIn}","${checkOut}","${total}","${status}"`;
      })).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Error generating report');
      console.error(error);
    }
  };

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-clock me-3 text-primary"></i>
          Attendance Tracking
        </h1>
        <p className="text-muted mb-0">Track your daily attendance and working hours</p>
      </div>

      <Row>
        {/* Today's Status */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <i className="fas fa-calendar-day me-2 text-primary"></i>
                  <div>
                    <div>Today's Attendance</div>
                    <small className="text-muted">
                      {todayStatus?.user ? `${todayStatus.user.firstName || ''} ${todayStatus.user.lastName || ''}` : ''}
                    </small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {user?.role && ['MANAGER','HR','ADMIN'].includes(user.role) && (
                    <Form.Select size="sm" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{width: '220px'}}>
                      <option value="">View Self / All</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </Form.Select>
                  )}
                  <div className="text-muted">{currentTime.toLocaleDateString()} - {currentTime.toLocaleTimeString()}</div>
                </div>
              </Card.Header>
            <Card.Body>
              {todayStatus ? (
                <Row>
                  <Col md={6}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-1">Check In</h6>
                        <div className="text-muted">{formatTime(todayStatus.checkInTime)}</div>
                      </div>
                      <div className="text-end">
                        {(!selectedUser || selectedUser === user?.id) ? (
                          !todayStatus.hasCheckedIn ? (
                            <Button
                              variant="success"
                              onClick={handleCheckIn}
                              disabled={loading}
                              className="d-flex align-items-center"
                            >
                              {loading ? (
                                <div className="loading-spinner me-2"></div>
                              ) : (
                                <i className="fas fa-sign-in-alt me-2"></i>
                              )}
                              Check In
                            </Button>
                          ) : (
                            <Badge bg="success" className="fs-6">
                              <i className="fas fa-check me-1"></i>
                              Checked In
                            </Badge>
                          )
                        ) : (
                          todayStatus.hasCheckedIn ? (
                            <Badge bg="success" className="fs-6">Checked In</Badge>
                          ) : (
                            <Badge bg="secondary" className="fs-6">No Record</Badge>
                          )
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-1">Check Out</h6>
                        <div className="text-muted">{formatTime(todayStatus.checkOutTime)}</div>
                      </div>
                      <div className="text-end">
                        {(!selectedUser || selectedUser === user?.id) ? (
                          (!todayStatus.hasCheckedOut && todayStatus.hasCheckedIn) ? (
                            <Button
                              variant="danger"
                              onClick={handleCheckOut}
                              disabled={loading}
                              className="d-flex align-items-center"
                            >
                              {loading ? (
                                <div className="loading-spinner me-2"></div>
                              ) : (
                                <i className="fas fa-sign-out-alt me-2"></i>
                              )}
                              Check Out
                            </Button>
                          ) : todayStatus.hasCheckedOut ? (
                            <Badge bg="danger" className="fs-6">
                              <i className="fas fa-check me-1"></i>
                              Checked Out
                            </Badge>
                          ) : (
                            <Badge bg="secondary" className="fs-6">Pending</Badge>
                          )
                        ) : (
                          todayStatus.hasCheckedOut ? (
                            <Badge bg="danger" className="fs-6">Checked Out</Badge>
                          ) : (
                            <Badge bg="secondary" className="fs-6">No Record</Badge>
                          )
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="text-center p-3 bg-light rounded">
                      <h4 className="text-primary mb-1">{formatDuration(todayStatus.totalHours)}</h4>
                      <small className="text-muted">Total Hours</small>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="text-center p-3 bg-light rounded">
                      <h4 className="mb-1">{getStatusBadge(todayStatus.status)}</h4>
                      <small className="text-muted">Status</small>
                    </div>
                  </Col>
                </Row>
              ) : (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <p className="text-muted">Loading today's status...</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center">
              <i className="fas fa-chart-bar me-2 text-success"></i>
              This Week Summary
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="row">
                  <div className="col-6 mb-3">
                    <div className="text-success fs-4 fw-bold">5</div>
                    <small className="text-muted">Present Days</small>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="text-primary fs-4 fw-bold">40h</div>
                    <small className="text-muted">Total Hours</small>
                  </div>
                  <div className="col-6">
                    <div className="text-warning fs-4 fw-bold">2</div>
                    <small className="text-muted">Late Days</small>
                  </div>
                  <div className="col-6">
                    <div className="text-danger fs-4 fw-bold">0</div>
                    <small className="text-muted">Absent Days</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Attendance History */}
      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <i className="fas fa-history me-2 text-info"></i>
          <div>Recent Attendance History</div>
          <div className="d-flex align-items-center gap-2">
            {user?.role && ['MANAGER','HR','ADMIN'].includes(user.role) && (
              <>
                <Form.Select size="sm" value={selectedUser} onChange={e => { setSelectedUser(e.target.value); fetchAttendanceHistory(e.target.value); }} style={{width: '220px'}}>
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </Form.Select>
                <Button size="sm" variant="outline-primary" onClick={downloadCSV}><i className="fas fa-download me-1"></i>Download</Button>
              </>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {attendanceHistory.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <tr>
                    <th style={{
                      color: '#475569',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      padding: '1rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                    }}>Date</th>
                    {user?.role && ['MANAGER','HR','ADMIN'].includes(user.role) && <th style={{
                      color: '#475569',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      padding: '1rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                    }}>Employee</th>}
                    <th style={{
                      color: '#475569',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      padding: '1rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                    }}>Check In</th>
                    <th style={{
                      color: '#475569',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      padding: '1rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                    }}>Check Out</th>
                    <th style={{
                      color: '#475569',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      padding: '1rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                    }}>Total Hours</th>
                    <th style={{
                      color: '#475569',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      padding: '1rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map(record => (
                    <tr key={record._id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      {user?.role && ['MANAGER','HR','ADMIN'].includes(user.role) && (
                        <td>{record.userId ? `${record.userId.firstName} ${record.userId.lastName}` : ''}</td>
                      )}
                      <td>{formatTime(record.checkIn)}</td>
                      <td>{formatTime(record.checkOut)}</td>
                      <td>{formatDuration(record.totalHours)}</td>
                      <td>{getStatusBadge(record.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times text-muted fs-1 mb-3"></i>
              <p className="text-muted mb-0">No attendance records found</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Attendance;