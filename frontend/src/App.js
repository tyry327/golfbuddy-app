import React, { useState, useEffect } from 'react';
import DatePicker from "react-multi-date-picker";
import './App.css';

// MUI imports
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Snackbar,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';

const API_URL = 'https://glorious-orbit-jj4jpg5vwp4hpgjx-5000.app.github.dev/api';
const SECTIONS = ['morning', 'midday', 'afternoon', 'evening'];
const SECTION_TIME_RANGES = {
  morning:   { timemin: 12,  timemax: 20 },
  midday:    { timemin: 20, timemax: 28 },
  afternoon: { timemin: 28, timemax: 34 },
  evening:   { timemin: 34, timemax: 40 }
};

function formatGolfNowDate(dateStr) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month, day] = dateStr.split("-");
  return `${months[parseInt(month, 10) - 1]}+${parseInt(day, 10)}+${year}`;
}

async function getCoordsForZip(zip) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return {};
    const data = await res.json();
    const place = data.places && data.places[0];
    return place
      ? { latitude: place.latitude, longitude: place.longitude }
      : {};
  } catch {
    return {};
  }
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('golfbuddy_token') || '');
  const [userId, setUserId] = useState(() => localStorage.getItem('golfbuddy_userId') || '');
  const [view, setView] = useState(() => (localStorage.getItem('golfbuddy_token') && localStorage.getItem('golfbuddy_userId')) ? 'dashboard' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [dateSections, setDateSections] = useState({});
  const [userAvailability, setUserAvailability] = useState([]);
  const [searchZip, setSearchZip] = useState('80134');
  const [zipCoords, setZipCoords] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', text: '' });

  useEffect(() => {
    if (searchZip && searchZip.length >= 5) {
      getCoordsForZip(searchZip).then(setZipCoords);
    }
  }, [searchZip]);

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
        setSnackbar({ open: true, severity: 'success', text: 'Registration successful! Please log in.' });
        setView('login');
      } else {
        setSnackbar({ open: true, severity: 'error', text: data.message || 'Registration failed.' });
      }
    } catch {
      setSnackbar({ open: true, severity: 'error', text: 'Network error.' });
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
        localStorage.setItem('golfbuddy_token', data.token);
        localStorage.setItem('golfbuddy_userId', data.userId);
        setSnackbar({ open: true, severity: 'success', text: 'Login successful!' });
        setView('dashboard');
        fetchAvailability();
      } else {
        setSnackbar({ open: true, severity: 'error', text: data.message || 'Login failed.' });
      }
    } catch {
      setSnackbar({ open: true, severity: 'error', text: 'Network error.' });
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserId('');
    localStorage.removeItem('golfbuddy_token');
    localStorage.removeItem('golfbuddy_userId');
    setView('login');
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
        setSnackbar({ open: true, severity: 'success', text: 'Availability updated!' });
        fetchAvailability();
      } else {
        setSnackbar({ open: true, severity: 'error', text: data.message || 'Failed to set availability.' });
      }
    } catch {
      setSnackbar({ open: true, severity: 'error', text: 'Network error.' });
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
      if (res.ok && data.matches && data.matches.length > 0) {
        setMatches(data.matches);
        setSnackbar({ open: true, severity: 'success', text: 'Matching dates found!' });
      } else {
        setMatches([]);
        setSnackbar({ open: true, severity: 'info', text: 'No matching dates found.' });
      }
    } catch {
      setSnackbar({ open: true, severity: 'error', text: 'Network error.' });
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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%)',
        pb: 4
      }}
    >
      <Container maxWidth="sm" sx={{ pt: 4, pb: 4 }}>
        <Card sx={{ mb: 3, boxShadow: 6, borderRadius: 3 }}>
          <CardContent>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                color: 'forestgreen',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                fontWeight: 700,
                letterSpacing: 1
              }}
            >
              <GolfCourseIcon sx={{ fontSize: 40, color: 'forestgreen', mb: '2px' }} />
              GolfBuddy
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {view === 'register' && (
              <Box component="form" onSubmit={register} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Register</Typography>
                <TextField name="name" label="Name" value={form.name} onChange={handleChange} required />
                <TextField name="email" label="Email" type="email" value={form.email} onChange={handleChange} required />
                <TextField name="password" label="Password" type="password" value={form.password} onChange={handleChange} required />
                <Button type="submit" variant="contained" sx={{
                  background: '#388e3c',
                  color: '#fff',
                  fontWeight: 600,
                  border: '2px solid #2e7031',
                  textTransform: 'none',
                  '&:hover': { background: '#2e7031' }
                }}>Register</Button>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Button size="small" onClick={() => setView('login')}>Login</Button>
                </Typography>
              </Box>
            )}
            {view === 'login' && (
              <Box component="form" onSubmit={login} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Login</Typography>
                <TextField name="email" label="Email" type="email" value={form.email} onChange={handleChange} required />
                <TextField name="password" label="Password" type="password" value={form.password} onChange={handleChange} required />
                <Button type="submit" variant="contained" sx={{
                  background: '#388e3c',
                  color: '#fff',
                  fontWeight: 600,
                  border: '2px solid #2e7031',
                  textTransform: 'none',
                  '&:hover': { background: '#2e7031' }
                }}>Login</Button>
                <Typography variant="body2">
                  No account?{' '}
                  <Button size="small" onClick={() => setView('register')}>Register</Button>
                </Typography>
              </Box>
            )}
            {view === 'dashboard' && (
              <Box>
                <Typography variant="h6" align="center" sx={{ mb: 1, color: 'forestgreen', fontWeight: 600 }}>
                  Welcome!
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  <Button variant="outlined" size="small" color="secondary" onClick={handleLogout}>Log out</Button>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Card sx={{ mb: 2, background: '#f1f8e9', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'forestgreen', fontWeight: 600 }}>Set Your Availability</Typography>
                    <Box component="form" onSubmit={setAvail} sx={{ mt: 2 }}>
                      <DatePicker
                        multiple
                        value={selectedDates}
                        onChange={handleDatesChange}
                        format="YYYY-MM-DD"
                      />
                      <Box sx={{ mt: 2 }}>
                        {selectedDates.map(d => {
                          const dateStr = d.format("YYYY-MM-DD");
                          return (
                            <Box key={dateStr} sx={{ mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                <CalendarMonthIcon sx={{ fontSize: 18, mr: 0.5, mb: -0.5, color: 'forestgreen' }} />
                                {dateStr}
                              </Typography>
                              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                {SECTIONS.map(section => (
                                  <Chip
                                    key={section}
                                    label={section}
                                    color={dateSections[dateStr]?.includes(section) ? "success" : "default"}
                                    variant={dateSections[dateStr]?.includes(section) ? "filled" : "outlined"}
                                    onClick={() => handleSectionChange(dateStr, section)}
                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Box>
                      <Button type="submit" variant="contained" sx={{
                        mt: 2,
                        background: '#388e3c',
                        color: '#fff',
                        fontWeight: 600,
                        border: '2px solid #2e7031',
                        textTransform: 'none',
                        '&:hover': { background: '#2e7031' }
                      }}>
                        Save Availability
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                <Card sx={{ mb: 2, background: '#f1f8e9', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: 'forestgreen', fontWeight: 600 }}>Find Matching Dates</Typography>
                    <Box component="form" onSubmit={findMatchesByEmail} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      <TextField
                        type="email"
                        label="Friend's Email"
                        value={friendEmail}
                        onChange={e => setFriendEmail(e.target.value)}
                        required
                      />
                      <TextField
                        label="Enter Zip Code"
                        value={searchZip}
                        onChange={e => setSearchZip(e.target.value)}
                        inputProps={{ maxLength: 10 }}
                        sx={{ width: 180 }}
                      />
                      <Button type="submit" variant="contained" sx={{
                        background: '#388e3c',
                        color: '#fff',
                        fontWeight: 600,
                        border: '2px solid #2e7031',
                        textTransform: 'none',
                        '&:hover': { background: '#2e7031' }
                      }}>
                        Find Matches
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                {matches.length > 0 && (
                  <Card sx={{ mb: 2, background: '#e0f2f1', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1, color: 'forestgreen', fontWeight: 600 }}>
                        Matching Dates & Sections
                      </Typography>
                      <List>
                        {matches.map(match => (
                          <ListItem
                            key={match.date}
                            alignItems="flex-start"
                            sx={{
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              mb: 3, // Increased margin between days
                              p: 2,
                              border: '1px solid #b2dfdb',
                              borderRadius: 2,
                              background: '#ffffffcc'
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <CalendarMonthIcon sx={{ fontSize: 20, color: 'forestgreen' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'forestgreen' }}>
                                {match.date}
                              </Typography>
                            </Stack>
                            <Grid container spacing={2} sx={{ width: '100%' }}>
                              {match.sections.map(section => {
                                const range = SECTION_TIME_RANGES[section];
                                const hashParams = [
                                  `qc=GeoLocation`,
                                  `q=${encodeURIComponent(searchZip)}`,
                                  `facilitytype=0`,
                                  `sortby=Facilities.Distance.0`,
                                  `view=Course`,
                                  `date=${formatGolfNowDate(match.date)}`,
                                  `holes=3`,
                                  `radius=30`,
                                  range ? `timemax=${range.timemax}` : '',
                                  range ? `timemin=${range.timemin}` : '',
                                  `players=0`,
                                  `pricemax=10000`,
                                  `pricemin=0`,
                                  `promotedcampaignsonly=false`,
                                  `hotdealsonly=false`,
                                  zipCoords.longitude && zipCoords.latitude ? `longitude=${zipCoords.longitude}` : '',
                                  zipCoords.longitude && zipCoords.latitude ? `latitude=${zipCoords.latitude}` : ''
                                ].filter(Boolean);

                                const golfNowUrl = `https://www.golfnow.com/tee-times/search#${hashParams.join("&")}`;
                                const chronoGolfUrl = `https://www.chronogolf.com/clubs/${encodeURIComponent(searchZip)}?page=1&filters=%7B%22deals%22%3Afalse,%22onlineBooking%22%3Atrue%7D`;

                                return (
                                  <Grid
                                    item
                                    xs={12}
                                    sm={12}
                                    md={4}
                                    key={section}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: { xs: 'center', sm: 'center', md: 'flex-start' }
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'column', md: 'row' },
                                        alignItems: { xs: 'center', sm: 'center', md: 'center' },
                                        background: '#f1f8e9',
                                        borderRadius: 2,
                                        p: 1,
                                        width: '100%',
                                        minWidth: 0,
                                        boxShadow: 1,
                                        mb: 1,
                                        gap: { xs: 1, md: 0.5 }
                                      }}
                                    >
                                      <Chip
                                        icon={<AccessTimeIcon sx={{ fontSize: 14, color: 'forestgreen' }} />}
                                        label={section}
                                        color="success"
                                        sx={{
                                          mb: { xs: 1, md: 0 },
                                          fontWeight: 600,
                                          minWidth: 55,
                                          fontSize: 13,
                                          height: 28,
                                          px: 0.5,
                                          flexShrink: 0,
                                          textAlign: 'center'
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexDirection: { xs: 'row', md: 'row' },
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          gap: 1,
                                          width: { xs: '100%', md: 'auto' }
                                        }}
                                      >
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          href={golfNowUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          sx={{
                                            textTransform: 'none',
                                            borderColor: '#388e3c',
                                            color: '#388e3c',
                                            fontWeight: 600,
                                            background: '#fff',
                                            minWidth: 55,
                                            fontSize: 13,
                                            px: 0.5,
                                            height: 28,
                                            flexShrink: 0,
                                            '&:hover': {
                                              background: '#e8f5e9',
                                              borderColor: '#2e7031',
                                              color: '#2e7031'
                                            }
                                          }}
                                          title="GolfNow link will pre-fill date and time, but may require manual adjustment."
                                        >
                                          GolfNow
                                        </Button>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          href={chronoGolfUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          sx={{
                                            textTransform: 'none',
                                            background: '#66bb6a',
                                            color: '#fff',
                                            fontWeight: 600,
                                            border: '2px solid #388e3c',
                                            minWidth: 55,
                                            fontSize: 13,
                                            px: 0.5,
                                            height: 28,
                                            flexShrink: 0,
                                            '&:hover': {
                                              background: '#388e3c'
                                            }
                                          }}
                                          title="Chronogolf link will pre-fill location."
                                        >
                                          Chronogolf
                                        </Button>
                                      </Box>
                                    </Box>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </ListItem>
                        ))}
                      </List>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        * GolfNow and Chronogolf may not always honor all filters from the link. Please double-check date and time on their sites.
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                {userAvailability.length > 0 && (
                  <Card sx={{ background: '#f1f8e9', borderRadius: 2, mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: 'forestgreen', fontWeight: 600, mb: 2 }}>
                        Your Saved Availability
                      </Typography>
                      <List>
                        {userAvailability.map((a, idx) => (
                          <ListItem
                            key={idx}
                            sx={{
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              mb: 1,
                              p: 1.5,
                              border: '1px solid #b2dfdb',
                              borderRadius: 2,
                              background: '#fff',
                              boxShadow: 1,
                              gap: 1
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 120, mb: { xs: 1, sm: 0 } }}>
                              <CalendarMonthIcon sx={{ fontSize: 18, color: 'forestgreen' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'forestgreen' }}>
                                {a.date ? new Date(a.date).toISOString().split('T')[0] : a.date}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {a.sections && a.sections.length > 0 ? (
                                a.sections.map(sec => (
                                  <Chip
                                    key={sec}
                                    label={sec}
                                    color="success"
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      mb: 0.5,
                                      background: '#e8f5e9',
                                      color: 'forestgreen',
                                      border: '1px solid #a5d6a7'
                                    }}
                                  />
                                ))
                              ) : (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  (no sections selected)
                                </Typography>
                              )}
                            </Stack>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
                {/* User info at the bottom, subtle style */}
                <Box sx={{ mt: 3, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                  <Stack spacing={1} direction="row">
                    <Chip
                      icon={<LocationOnIcon />}
                      label={`User ID: ${userId}`}
                      size="small"
                      variant="outlined"
                      sx={{ bgcolor: '#f5f5f5', color: '#888' }}
                    />
                    <Chip
                      label={token ? `Token: ${token.slice(0, 8)}...` : ''}
                      size="small"
                      variant="outlined"
                      sx={{ bgcolor: '#f5f5f5', color: '#888' }}
                    />
                  </Stack>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 4, color: 'forestgreen', fontWeight: 500, fontSize: 18 }}>
                  ⛳ Happy Golfing with GolfBuddy!
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.text}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default App;
