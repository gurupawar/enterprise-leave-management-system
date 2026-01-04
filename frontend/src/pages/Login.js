import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' or 'register'

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = { ...regData, role: "EMPLOYEE" };
    const result = await register(payload);

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-container d-flex align-items-center">
      <Container>
        <Row className="justify-content-center align-items-center">
          {/* Left: Illustration (hidden on small screens) */}
          <Col lg={7} className="d-none d-lg-flex justify-content-center">
            <div style={{ maxWidth: "720px", width: "100%", padding: "2rem" }}>
              <img
                src="/assets/signin-illustration.png"
                alt="Sign in illustration"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </Col>

          {/* Right: Sign-in form (keeps original layout and behaviour) */}
          <Col md={8} lg={5} xl={4}>
            <Card className="login-card border-0 shadow-lg fade-in-up">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div
                    className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i className="fas fa-building text-white fs-2"></i>
                  </div>
                  <h2 className="fw-bold text-dark mb-2">
                    Welcome to Backtick HRMS
                  </h2>
                  <p className="text-muted">Sign in to your HRMS account</p>
                </div>

                {error && (
                  <Alert variant="danger" className="d-flex align-items-center">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                {mode === "login" ? (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center">
                        <i className="fas fa-envelope me-2 text-primary"></i>
                        Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        className="form-control-lg"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="d-flex align-items-center">
                        <i className="fas fa-lock me-2 text-primary"></i>
                        Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="form-control-lg"
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-100 d-flex align-items-center justify-content-center"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner me-2"></div>
                          Signing In...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt me-2"></i>
                          Sign In
                        </>
                      )}
                    </Button>
                  </Form>
                ) : (
                  <Form onSubmit={handleRegister}>
                    <Row>
                      <Col xs={12} md={6} className="mb-3">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          name="firstName"
                          value={regData.firstName}
                          onChange={handleRegChange}
                          required
                        />
                      </Col>
                      <Col xs={12} md={6} className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          name="lastName"
                          value={regData.lastName}
                          onChange={handleRegChange}
                          required
                        />
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={regData.email}
                        onChange={handleRegChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={regData.password}
                        onChange={handleRegChange}
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner me-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          {" "}
                          <i className="fas fa-user-plus me-2"></i> Register
                        </>
                      )}
                    </Button>
                  </Form>
                )}

                <div className="text-center mt-3">
                  {mode === "login" ? (
                    <p className="mb-0">
                      Don't have an account?{" "}
                      <Button
                        variant="link"
                        onClick={() => {
                          setMode("register");
                          setError("");
                        }}
                      >
                        Register
                      </Button>
                    </p>
                  ) : (
                    <p className="mb-0">
                      Already have an account?{" "}
                      <Button
                        variant="link"
                        onClick={() => {
                          setMode("login");
                          setError("");
                        }}
                      >
                        Sign In
                      </Button>
                    </p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
