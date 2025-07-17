import React, { useState, useEffect } from 'react';
import DatePicker from "react-multi-date-picker";
import './App.css';

const API_URL = 'https://glorious-orbit-jj4jpg5vwp4hpgjx-5000.app.github.dev/api';
const SECTIONS = ['morning', 'midday', 'afternoon', 'evening'];

function App() {
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [dateSections, setDateSections] = useState({});
  const [userAvailability, setUserAvailability] = useState([]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful! Please log in.');
        setView('login');
      } else {
        setMessage(data.message || 'Registration failed.');
      }
    } catch {
      setMessage('Network error.');
    }
  };

  const login = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUserId(data.userId);
        setMessage('Login successful!');
        setView('dashboard');
        fetchAvailability();
      } else {
        setMessage(data.message || 'Login failed.');
      }
    } catch {
      setMessage('Network error.');
    }
  };

  const handleSectionChange = (dateStr, section) => {
    setDateSections(prev => {
      const current = prev[dateStr] || [];
      return {
        ...prev,
        [dateStr]: current.includes(section)
          ? current.filter(s => s !== section)
          : [...current, section]
      };
    });
  };

  const handleDatesChange = dates => {
    setSelectedDates(dates);
    const newDateSections = {};
    dates.forEach(d => {
      const dateStr = d.format("YYYY-MM-DD");
      newDateSections[dateStr] = dateSections[dateStr] || [];
    });
    setDateSections(newDateSections);
  };

  const setAvail = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const availability = selectedDates.map(d => ({
        date: d.format("YYYY-MM-DD"),
        sections: dateSections[d.format("YYYY-MM-DD")] || []
      }));
      const res = await fetch(`${API_URL}/availability/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, availability }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Availability updated!');
      } else {
        setMessage(data.message || 'Failed to set availability.');
      }
    } catch {
      setMessage('Network error.');
    }
  };

  const findMatchesByEmail = async e => {
    e.preventDefault();
    setMessage('');
    setMatches([]);
    try {
      const res = await fetch(`${API_URL}/availability/match-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches || []);
        setMessage('Matching dates found!');
      } else {
        setMessage(data.message || 'Failed to find matches.');
      }
    } catch {
      setMessage('Network error.');
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`${API_URL}/availability/${userId}`);
      const data = await res.json();
      if (res.ok && data.availability) {
        setUserAvailability(data.availability);
      }
    } catch {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAvailability();
    }
  }, [userId]);

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>GolfBuddy</h1>
      {view === 'register' && (
        <form onSubmit={register}>
          <h2>Register</h2>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required /><br />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required /><br />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required /><br />
          <button type="submit">Register</button>
          <p>
            Already have an account?{' '}
            <button type="button" onClick={() => setView('login')}>Login</button>
          </p>
          <div style={{ color: 'red' }}>{message}</div>
        </form>
      )}
      {view === 'login' && (
        <form onSubmit={login}>
          <h2>Login</h2>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required /><br />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required /><br />
          <button type="submit">Login</button>
          <p>
            No account?{' '}
            <button type="button" onClick={() => setView('register')}>Register</button>
          </p>
          <div style={{ color: 'red' }}>{message}</div>
        </form>
      )}
      {view === 'dashboard' && (
        <div>
          <h2>Welcome!</h2>
          <p>User ID: {userId}</p>
          <p>Token: {token ? `${token.slice(0, 16)}...` : ''}</p>
          <button onClick={() => setView('login')}>Log out</button>
          <div style={{ color: 'green' }}>{message}</div>
          <hr />
          <form onSubmit={setAvail}>
            <h3>Set Your Availability</h3>
            <DatePicker
              multiple
              value={selectedDates}
              onChange={handleDatesChange}
              format="YYYY-MM-DD"
            />
            <br />
            {selectedDates.map(d => {
              const dateStr = d.format("YYYY-MM-DD");
              return (
                <div key={dateStr} style={{ marginBottom: 8 }}>
                  <strong>{dateStr}</strong>
                  <div>
                    {SECTIONS.map(section => (
                      <label key={section} style={{ marginRight: 8 }}>
                        <input
                          type="checkbox"
                          checked={dateSections[dateStr]?.includes(section) || false}
                          onChange={() => handleSectionChange(dateStr, section)}
                        />
                        {section}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            <button type="submit">Save Availability</button>
          </form>
          <hr />
          <form onSubmit={findMatchesByEmail}>
            <h3>Find Matching Dates</h3>
            <input
              type="email"
              placeholder="Friend's Email"
              value={friendEmail}
              onChange={e => setFriendEmail(e.target.value)}
              required
            /><br />
            <button type="submit">Find Matches</button>
          </form>
          {matches.length > 0 && (
            <div>
              <h4>Matching Dates & Sections:</h4>
              <ul>
                {matches.map(match => (
                  <li key={match.date}>
                    {match.date}: {match.sections.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {userAvailability.length > 0 && (
            <div>
              <h3>Your Saved Availability</h3>
              <ul>
                {userAvailability.map((a, idx) => (
                  <li key={idx}>
                    {a.date ? new Date(a.date).toISOString().split('T')[0] : a.date}:
                    {a.sections && a.sections.length > 0
                      ? ` ${a.sections.join(', ')}`
                      : ' (no sections selected)'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <hr />
          <a
            href="https://www.golfnow.com/tee-times/search?location=80134"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', margin: '20px 0', textAlign: 'center', fontSize: '1.2em', color: '#007bff' }}
          >
            Search Tee Times Near 80134 on GolfNow
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
