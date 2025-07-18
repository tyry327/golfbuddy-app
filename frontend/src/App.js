import React, { useState, useEffect } from 'react';
import DatePicker from "react-multi-date-picker";
import './App.css';

const API_URL = 'https://glorious-orbit-jj4jpg5vwp4hpgjx-5000.app.github.dev/api';
const SECTIONS = ['morning', 'midday', 'afternoon', 'evening'];
const SECTION_TIME_RANGES = {
  morning:   { timemin: 6,  timemax: 10 },
  midday:    { timemin: 11, timemax: 13 },
  afternoon: { timemin: 14, timemax: 16 },
  evening:   { timemin: 17, timemax: 20 }
};

function formatGolfNowDate(dateStr) {
  // Converts "YYYY-MM-DD" to "Mon+DD+YYYY" (e.g., "Jul+23+2025")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = dateStr.split("-");
  return `${months[parseInt(month, 10) - 1]}+${parseInt(day, 10)}+${year}`;
}

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
  const [searchZip, setSearchZip] = useState('80134');

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
    // eslint-disable-next-line
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
                    {match.date}:{" "}
                    {match.sections.map(section => {
                      const range = SECTION_TIME_RANGES[section];
                      const hashParams = [
                        `date=${formatGolfNowDate(match.date)}`,
                        `location=${encodeURIComponent(searchZip)}`
                      ];
                      if (range) {
                        hashParams.push(`timemin=${range.timemin}`);
                        hashParams.push(`timemax=${range.timemax}`);
                      }
                      const url = `https://www.golfnow.com/tee-times/search#${hashParams.join("&")}`;
                      return (
                        <span key={section} style={{ marginRight: 12 }}>
                          {section}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: 6, color: '#007bff', fontSize: '0.95em' }}
                            title="GolfNow link will pre-fill date and time, but may require manual adjustment."
                          >
                            View Tee Times
                          </a>
                        </span>
                      );
                    })}
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: '0.9em', color: '#888', marginTop: 8 }}>
                * GolfNow may not always honor all filters from the link. Please double-check date and time on their site.
              </div>
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
          <div style={{ margin: '20px 0' }}>
            <label>
              Enter Zip Code:{' '}
              <input
                type="text"
                value={searchZip}
                onChange={e => setSearchZip(e.target.value)}
                maxLength={10}
                style={{ width: 100 }}
              />
            </label>
          </div>
          <a
            href={`https://www.golfnow.com/tee-times/search?location=${encodeURIComponent(searchZip)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', margin: '20px 0', textAlign: 'center', fontSize: '1.2em', color: '#007bff' }}
          >
            Search Tee Times Near {searchZip || 'your zip'} on GolfNow
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
