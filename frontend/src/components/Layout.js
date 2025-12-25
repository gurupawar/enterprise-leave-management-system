import React from 'react';
import { Nav, Navbar, Container, Row, Col } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
      { path: '/attendance', label: 'Attendance', icon: 'fas fa-clock', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] }
    ];

    if (user?.role === 'EMPLOYEE') {
      items.push(
        { path: '/apply-leave', label: 'Apply Leave', icon: 'fas fa-plus-circle', roles: ['EMPLOYEE'] },
        { path: '/my-leaves', label: 'My Leaves', icon: 'fas fa-calendar-check', roles: ['EMPLOYEE'] }
      );
    }

    if (['MANAGER', 'HR', 'ADMIN'].includes(user?.role)) {
      items.push(
        { path: '/approvals', label: 'Pending Approvals', icon: 'fas fa-tasks', roles: ['MANAGER', 'HR', 'ADMIN'] },
        { path: '/team-calendar', label: 'Team Calendar', icon: 'fas fa-calendar-alt', roles: ['MANAGER', 'HR', 'ADMIN'] },
        { path: '/employee-directory', label: 'Employee Directory', icon: 'fas fa-users', roles: ['MANAGER', 'HR', 'ADMIN'] }
      );
    }

    if (['HR', 'ADMIN'].includes(user?.role)) {
      items.push(
        { path: '/leave-types', label: 'Leave Types', icon: 'fas fa-cogs', roles: ['HR', 'ADMIN'] },
        { path: '/announcements', label: 'Announcements', icon: 'fas fa-bullhorn', roles: ['HR', 'ADMIN'] },
        { path: '/reports', label: 'Reports', icon: 'fas fa-chart-bar', roles: ['HR', 'ADMIN'] }
      );
    }

    // Add Files for all users to view
    items.push(
      { path: '/files', label: 'Files & Documents', icon: 'fas fa-folder-open', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
      { path: '/profile', label: 'My Profile', icon: 'fas fa-user-circle', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
      { path: '/expenses', label: 'Expenses', icon: 'fas fa-receipt', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] }
    );

    if (['HR', 'ADMIN'].includes(user?.role)) {
      items.push(
        { path: '/assets', label: 'Asset Management', icon: 'fas fa-laptop', roles: ['HR', 'ADMIN'] }
      );
    }

    return items.filter(item => item.roles.includes(user?.role));
  };

  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        <Col md={3} lg={2} className="sidebar">
          <div className="sidebar-brand text-white">
            <div className="d-flex align-items-center">
              <i className="fas fa-building me-2 fs-4"></i>
              <div>
                <h5 className="mb-0">HRMS Pro</h5>
                <small className="text-light opacity-75">Leave Management</small>
              </div>
            </div>
          </div>
          
          <div className="text-white p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                   style={{width: '40px', height: '40px'}}>
                <i className="fas fa-user text-white"></i>
              </div>
              <div>
                <div className="fw-semibold">{user?.firstName} {user?.lastName}</div>
                <small className="text-light opacity-75">{user?.email}</small>
                <div>
                  <span className="badge bg-primary mt-1">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Nav className="flex-column py-3">
            {getMenuItems().map(item => (
              <LinkContainer key={item.path} to={item.path}>
                <Nav.Link className="text-white-50 d-flex align-items-center">
                  <i className={`${item.icon} me-3`}></i>
                  {item.label}
                </Nav.Link>
              </LinkContainer>
            ))}
            <Nav.Link 
              className="text-white-50 d-flex align-items-center mt-3" 
              onClick={logout}
              style={{ cursor: 'pointer' }}
            >
              <i className="fas fa-sign-out-alt me-3"></i>
              Logout
            </Nav.Link>
          </Nav>
        </Col>
        
        <Col md={9} lg={10} className="main-content">
          <div className="p-4">
            {children}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Layout;