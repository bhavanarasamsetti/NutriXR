import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';
import './Auth.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useUser();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    bio: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Populate form with user data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      age: user.age || '',
      gender: user.gender || '',
      bio: user.bio || '',
      phone: user.phone || '',
    });
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error and success when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    setSuccess(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      newErrors.age = 'Please enter a valid age';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(false);

    // Simulate API call
    setTimeout(() => {
      // Update user in context
      updateProfile(formData);

      // Update user in localStorage users array
      const users = JSON.parse(localStorage.getItem('nutrixr-users') || '[]');
      const userIndex = users.findIndex((u) => u.id === user.id);

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          ...formData,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('nutrixr-users', JSON.stringify(users));
      }

      setLoading(false);
      setSuccess(true);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = () => {
    if (!user) return '?';
    const first = formData.firstName?.[0] || '';
    const last = formData.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <TopNav
        variant="profile"
        title="Edit Profile"
        subtitle="Update your personal information"
        onBack={() => navigate('/dashboard')}
      />

      <div className="auth-page" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="auth-container" style={{ marginTop: '40px' }}>
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {getInitials()}
            </div>
            <button type="button" className="change-avatar-btn">
              Change Avatar
            </button>
          </div>

          {success && (
            <div className="form-success" style={{ textAlign: 'center', marginBottom: '16px' }}>
              ✓ Profile updated successfully!
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-input"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-input"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-input"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="age">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  className="form-input"
                  placeholder="25"
                  value={formData.age}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.age && <span className="form-error">{errors.age}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="form-input"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                className="form-input"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
                disabled={loading}
                rows="4"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>

            <button
              type="button"
              className="auth-btn"
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                marginTop: '8px',
              }}
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

