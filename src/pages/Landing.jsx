import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Landing.css';

const Landing = () => {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, []);

  return (
    <div className="landing">
      <Header />
      
      <section className="hero">
        <div className="container">
          <h1>Transform Education<br /><span>Management</span></h1>
          <p>Connect teachers and students with our modern, efficient platform. Manage batches, fees, attendance — all in one place.</p>
          <Link to="/register" className="btn btn-primary btn-large">Get Started Free</Link>
        </div>
      </section>

      <section className="connected">
        <div className="container">
          <h2>Connected on Vidya</h2>
          <p className="section-subtitle">One platform that links teachers, organizations, and students.</p>
          <div className="connected-grid">
            <div className="connected-card">
              <div className="connected-icon">👩‍🏫</div>
              <div className="connected-stat">100+</div>
              <div className="connected-title">Teachers Connected</div>
              <div className="connected-desc">Run batches, track fees, attendance, and announcements.</div>
            </div>
            <div className="connected-card">
              <div className="connected-icon">🏢</div>
              <div className="connected-stat">50+</div>
              <div className="connected-title">Organizations Connected</div>
              <div className="connected-desc">Manage multiple teachers and batches under one dashboard.</div>
            </div>
            <div className="connected-card">
              <div className="connected-icon">🎓</div>
              <div className="connected-stat">300+</div>
              <div className="connected-title">Students Enrolled</div>
              <div className="connected-desc">Enroll, access study material, and stay updated with notices.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="about">
        <div className="container">
          <h2>Why Choose Vidya?</h2>
          <p className="section-subtitle">Everything you need to run a world-class tutoring operation</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Batch Management</h3>
              <p>Create and manage multiple batches with ease — set schedules, subjects, and capacity limits.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Fee Tracking</h3>
              <p>Track payments and send automated reminders. Never lose track of pending dues again.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>GPS Attendance</h3>
              <p>Location-based attendance verification ensures students are physically present in class.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📢</div>
              <h3>Announcements</h3>
              <p>Instant notifications via WhatsApp. Keep students informed in real-time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Track performance and earnings with detailed monthly dashboards and insights.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure</h3>
              <p>JWT authentication and encrypted data storage keeps your information safe always.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="container">
          <h2>Simple Pricing</h2>
          <p className="section-subtitle">No hidden fees. No credit card required.</p>
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Teachers</h3>
              <div className="price">Free</div>
              <p className="price-desc">Everything you need to teach</p>
              <ul>
                <li>Unlimited batches</li>
                <li>Student management</li>
                <li>Fee tracking</li>
                <li>WhatsApp notifications</li>
              </ul>
              <Link to="/register/teacher" className="btn btn-primary btn-full">Start Teaching</Link>
            </div>
            <div className="pricing-card">
              <h3>Organization</h3>
              <div className="price">Free</div>
              <p className="price-desc">Multi-teacher coaching management</p>
              <ul>
                <li>Organization dashboard</li>
                <li>Multiple teachers per batch</li>
                <li>Batch-wise fee tracking</li>
                <li>Teacher salary tracking</li>
              </ul>
              <Link to="/register/organization" className="btn btn-primary btn-full">Start as Organization</Link>
            </div>
            <div className="pricing-card">
              <h3>Students</h3>
              <div className="price">Free</div>
              <p className="price-desc">Everything you need to learn</p>
              <ul>
                <li>Join multiple batches</li>
                <li>GPS attendance</li>
                <li>Access notes &amp; syllabus</li>
                <li>Multi-batch discounts</li>
              </ul>
              <Link to="/register/student" className="btn btn-primary btn-full">Start Learning</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <p className="section-subtitle">Got questions? We have answers.</p>
          <div className="faq-list">
            <div className="faq-item">
              <h3>How does the teacher code work?</h3>
              <p>Each teacher gets a unique 6-digit code that students use to find and enroll in their batches.</p>
            </div>
            <div className="faq-item">
              <h3>What is GPS-based attendance?</h3>
              <p>Students can only mark attendance when they are within 500 meters of the class location.</p>
            </div>
            <div className="faq-item">
              <h3>Can students join multiple batches?</h3>
              <p>Yes! Students get automatic discounts when joining multiple batches from the same teacher.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Vidya. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
