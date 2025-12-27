import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  // Hidden CRM access - 5 clicks on footer logo
  const handleFooterLogoClick = useCallback((e) => {
    e.preventDefault();
    clickCountRef.current++;
    
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 2000);
    
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      navigate('/crm');
    }
  }, [navigate]);

  // Form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert('Thanks for reaching out! We\'ll get back to you within 24 hours.');
    e.target.reset();
  };

  useEffect(() => {
    // Update document title
    document.title = 'NJ Developments | Custom Digital Solutions';

    // Load Font Awesome
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(faLink);

    // Navbar scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (document.head.contains(faLink)) {
        document.head.removeChild(faLink);
      }
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="bg-gradient-animation"></div>
      
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#home" className="logo">
            <img src="/logo.png" alt="NJ Developments" className="logo-img" />
          </a>
          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <li><a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
            <li><a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a></li>
            <li><a href="#portfolio" onClick={() => setMobileMenuOpen(false)}>Portfolio</a></li>
            <li><a href="#process" onClick={() => setMobileMenuOpen(false)}>Process</a></li>
            <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a></li>
            <li><a href="#contact" className="btn-nav" onClick={() => setMobileMenuOpen(false)}>Get Started</a></li>
          </ul>
          <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <div>
            <div className="hero-badge">Custom Digital Solutions</div>
            <h1>We Build <span className="gradient-text">Digital Experiences</span> That Drive Growth</h1>
            <p>From stunning websites to custom platforms, we transform your business with technology solutions that actually work.</p>
            <div className="hero-buttons">
              <a href="#contact" className="btn btn-primary">Start Your Project</a>
              <a href="#services" className="btn btn-secondary">Our Services</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Client Focused</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Live Support</span>
              </div>
              <div className="stat">
                <span className="stat-number">Fast</span>
                <span className="stat-label">Delivery</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <i className="fas fa-code"></i>
              <span>Clean Code</span>
            </div>
            <div className="floating-card card-2">
              <i className="fas fa-mobile-alt"></i>
              <span>Mobile First</span>
            </div>
            <div className="floating-card card-3">
              <i className="fas fa-rocket"></i>
              <span>Fast & Secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">What We Do</span>
            <h2>Services That <span className="gradient-text">Transform</span> Your Business</h2>
            <p>We deliver end-to-end digital solutions tailored to your unique needs</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-globe"></i></div>
              <h3>Website Development</h3>
              <p>Professional, mobile-first websites designed to convert visitors into customers. SEO optimized and lightning fast.</p>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Custom Design</li>
                <li><i className="fas fa-check"></i> Mobile Responsive</li>
                <li><i className="fas fa-check"></i> SEO Optimized</li>
              </ul>
            </div>
            <div className="service-card featured">
              <div className="featured-badge">Popular</div>
              <div className="service-icon"><i className="fas fa-shopping-cart"></i></div>
              <h3>Online Ordering & POS</h3>
              <p>Seamless ordering systems with Toast, Square, or custom solutions. Integrated payment processing with Stripe.</p>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Toast Integration</li>
                <li><i className="fas fa-check"></i> Stripe Payments</li>
                <li><i className="fas fa-check"></i> DoorDash Drive</li>
              </ul>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-cogs"></i></div>
              <h3>Custom Platforms</h3>
              <p>Purpose-built systems that replace fragmented tools. Tournaments, memberships, scheduling, and more.</p>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Admin Dashboards</li>
                <li><i className="fas fa-check"></i> Member Management</li>
                <li><i className="fas fa-check"></i> Custom Workflows</li>
              </ul>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-search"></i></div>
              <h3>Google Business & SEO</h3>
              <p>Get found when customers search. Google Business optimization and local SEO to drive foot traffic.</p>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Google Maps Ranking</li>
                <li><i className="fas fa-check"></i> Local SEO</li>
                <li><i className="fas fa-check"></i> Review Management</li>
              </ul>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-headset"></i></div>
              <h3>Ongoing Support</h3>
              <p>We don't just build and leave. Live support, updates, and maintenance to keep everything running smoothly.</p>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Priority Support</li>
                <li><i className="fas fa-check"></i> Menu Updates</li>
                <li><i className="fas fa-check"></i> Monthly Reports</li>
              </ul>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-chart-line"></i></div>
              <h3>Growth Strategy</h3>
              <p>Data-driven insights to help you understand what's working and where to focus for maximum ROI.</p>
              <ul className="service-features">
                <li><i className="fas fa-check"></i> Analytics Setup</li>
                <li><i className="fas fa-check"></i> Conversion Tracking</li>
                <li><i className="fas fa-check"></i> Growth Reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="process">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How We Work</span>
            <h2>Simple Process, <span className="gradient-text">Powerful Results</span></h2>
            <p>We keep things straightforward so you can focus on running your business</p>
          </div>
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Discovery Call</h3>
                <p>We learn about your business, goals, and challenges. No tech jargon—just a real conversation about what you need.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Custom Proposal</h3>
                <p>You receive a clear, detailed proposal with transparent pricing. No hidden fees, no surprises.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Build & Launch</h3>
                <p>We build your solution fast without cutting corners. You're involved every step of the way.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">04</div>
              <div className="step-content">
                <h3>Ongoing Partnership</h3>
                <p>Launch is just the beginning. We provide continuous support, updates, and optimization.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <span className="section-tag">About Us</span>
              <h2>Built by Developers Who <span className="gradient-text">Understand Business</span></h2>
              <p>NJ Developments was founded with one mission: to give small and medium businesses access to the same powerful digital tools that big companies use—without the enterprise price tag.</p>
              <p>We're not a faceless agency. We're developers who pick up the phone, solve problems fast, and actually care if your business grows.</p>
              <div className="about-features">
                <div className="about-feature">
                  <i className="fas fa-handshake"></i>
                  <span>Partner-Level Service</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-bolt"></i>
                  <span>Fast Turnaround</span>
                </div>
                <div className="about-feature">
                  <i className="fas fa-dollar-sign"></i>
                  <span>Transparent Pricing</span>
                </div>
              </div>
            </div>
            <div className="about-image">
              <div className="about-card">
                <div className="team-member">
                  <div className="member-avatar">JF</div>
                  <div className="member-info">
                    <h4>Javier Flores</h4>
                    <p>Co-Founder & Developer</p>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">NK</div>
                  <div className="member-info">
                    <h4>Nolan Krieger</h4>
                    <p>Co-Founder & Developer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="portfolio">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Our Work</span>
            <h2>Projects We've <span className="gradient-text">Built</span></h2>
            <p>Real solutions for real businesses. Check out some of our live projects.</p>
          </div>
          <div className="portfolio-grid">
            <a href="https://golfcove.web.app/" target="_blank" rel="noopener noreferrer" className="portfolio-card">
              <div className="portfolio-image">
                <div className="portfolio-overlay">
                  <span className="view-project"><i className="fas fa-external-link-alt"></i> View Live Site</span>
                </div>
                <div className="portfolio-placeholder golf-cove">
                  <i className="fas fa-golf-ball"></i>
                </div>
              </div>
              <div className="portfolio-info">
                <span className="portfolio-tag">Entertainment Venue</span>
                <h3>Golf Cove</h3>
                <p>Premium indoor golf & multisport simulator destination in North Haven, CT.</p>
                <div className="portfolio-tech">
                  <span>Website</span>
                  <span>Booking System</span>
                  <span>Memberships</span>
                </div>
              </div>
            </a>
            <a href="https://ice-cream-productions.web.app/" target="_blank" rel="noopener noreferrer" className="portfolio-card">
              <div className="portfolio-image">
                <div className="portfolio-overlay">
                  <span className="view-project"><i className="fas fa-external-link-alt"></i> View Live Site</span>
                </div>
                <div className="portfolio-placeholder ice-cream">
                  <i className="fas fa-graduation-cap"></i>
                </div>
              </div>
              <div className="portfolio-info">
                <span className="portfolio-tag">Non-Profit / Education</span>
                <h3>Ice Cream Productions</h3>
                <p>Alternative learning program helping at-risk youth succeed.</p>
                <div className="portfolio-tech">
                  <span>Website</span>
                  <span>Donations</span>
                  <span>E-Commerce</span>
                </div>
              </div>
            </a>
            <a href="https://odies-621b1.web.app/" target="_blank" rel="noopener noreferrer" className="portfolio-card">
              <div className="portfolio-image">
                <div className="portfolio-overlay">
                  <span className="view-project"><i className="fas fa-external-link-alt"></i> View Live Site</span>
                </div>
                <div className="portfolio-placeholder odies">
                  <i className="fas fa-pizza-slice"></i>
                </div>
              </div>
              <div className="portfolio-info">
                <span className="portfolio-tag">Restaurant & Bar</span>
                <h3>Odie's Place</h3>
                <p>Hamden's favorite neighborhood bar serving New Haven style pizza.</p>
                <div className="portfolio-tech">
                  <span>Website</span>
                  <span>Toast Integration</span>
                  <span>Online Ordering</span>
                </div>
              </div>
            </a>
            <a href="https://chip-simulator.web.app/" target="_blank" rel="noopener noreferrer" className="portfolio-card">
              <div className="portfolio-image">
                <div className="portfolio-overlay">
                  <span className="view-project"><i className="fas fa-external-link-alt"></i> View Live Site</span>
                </div>
                <div className="portfolio-placeholder chip-sim">
                  <i className="fas fa-coins"></i>
                </div>
              </div>
              <div className="portfolio-info">
                <span className="portfolio-tag">Web Application</span>
                <h3>Chip Simulator</h3>
                <p>Digital chip tracker for live poker & blackjack games.</p>
                <div className="portfolio-tech">
                  <span>Web App</span>
                  <span>Texas Hold'em</span>
                  <span>Blackjack</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Business?</h2>
            <p>Let's talk about how we can help you grow with a custom digital solution.</p>
            <a href="#contact" className="btn btn-light">Get Your Free Consultation</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Get In Touch</span>
            <h2>Let's <span className="gradient-text">Start Building</span></h2>
            <p>Ready to take your business to the next level? Reach out and let's talk.</p>
          </div>
          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-card">
                <div className="contact-icon"><i className="fas fa-envelope"></i></div>
                <div className="contact-details">
                  <h4>Email Us</h4>
                  <a href="mailto:javflores.ct@gmail.com">javflores.ct@gmail.com</a>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-icon"><i className="fas fa-phone"></i></div>
                <div className="contact-details">
                  <h4>Call Us</h4>
                  <a href="tel:860-987-7606">860-987-7606</a>
                </div>
              </div>
              <div className="contact-card">
                <div className="contact-icon"><i className="fas fa-map-marker-alt"></i></div>
                <div className="contact-details">
                  <h4>Location</h4>
                  <p>Connecticut, USA</p>
                </div>
              </div>
            </div>
            <form className="contact-form" onSubmit={handleFormSubmit}>
              <div className="form-group">
                <input type="text" name="name" placeholder="Your Name" required />
              </div>
              <div className="form-group">
                <input type="email" name="email" placeholder="Your Email" required />
              </div>
              <div className="form-group">
                <input type="text" name="business" placeholder="Business Name" />
              </div>
              <div className="form-group">
                <select name="service">
                  <option value="">Select a Service</option>
                  <option value="website">Website Development</option>
                  <option value="ordering">Online Ordering & POS</option>
                  <option value="platform">Custom Platform</option>
                  <option value="seo">Google Business & SEO</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <textarea name="message" placeholder="Tell us about your project..." rows="4"></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-full">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo footer-logo" onClick={handleFooterLogoClick} style={{cursor: 'pointer'}}>
                <img src="/logo.png" alt="NJ Developments" className="logo-img" />
              </div>
              <p>Building digital solutions that drive real business growth.</p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#portfolio">Portfolio</a></li>
                <li><a href="#process">Process</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-services">
              <h4>Services</h4>
              <ul>
                <li><a href="#services">Website Development</a></li>
                <li><a href="#services">Online Ordering</a></li>
                <li><a href="#services">Custom Platforms</a></li>
                <li><a href="#services">Google SEO</a></li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:javflores.ct@gmail.com"><i className="fas fa-envelope"></i> javflores.ct@gmail.com</a></li>
                <li><a href="tel:860-987-7606"><i className="fas fa-phone"></i> 860-987-7606</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 NJ Developments. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cursor Glow Effect */}
      <div className="cursor-glow"></div>
    </div>
  );
}
