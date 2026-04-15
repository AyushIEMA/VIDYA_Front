import React from 'react';
import { Link } from 'react-router-dom';
import './RegisterChoice.css';

const RegisterChoice = () => {
  return (
    <div className="register-choice-page">
      <div className="container">
        <h1>Join Vidya</h1>
        <p className="subtitle">Choose your role to get started</p>

        <div className="choice-cards">
          <Link to="/register/teacher" className="choice-card">
            <h2>Register as Teacher</h2>
            <p>Create batches, manage students, and track fees</p>
          </Link>

          <Link to="/register/student" className="choice-card">
            <h2>Register as Student</h2>
            <p>Enroll in batches, mark attendance, and access materials</p>
          </Link>

          <Link to="/register/organization" className="choice-card">
            <h2>Register as Organization</h2>
            <p>Manage multiple teachers and batches under one org</p>
          </Link>
        </div>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterChoice;
