import React, { useState } from 'react';
import {
  Card, CardContent, Typography, List, ListItem, ListItemText,
  Button, TextField, Stack, Divider, Box
} from '@mui/material';

export default function UserProfile({ userId, form, setForm, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ ...form });

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(editForm);
    setEditMode(false);
  };

  return (
    <Card sx={{ mb: 3, background: '#e0f2f1', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: 'forestgreen', fontWeight: 600, mb: 2 }}>
          User Profile
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="User ID" secondary={userId} />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Name"
              secondary={
                editMode
                  ? <TextField name="name" value={editForm.name} onChange={handleEditChange} size="small" />
                  : form.name || 'N/A'
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Email"
              secondary={
                editMode
                  ? <TextField name="email" value={editForm.email} onChange={handleEditChange} size="small" />
                  : form.email || 'N/A'
              }
            />
          </ListItem>
        </List>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          {!editMode ? (
            <Button variant="outlined" onClick={() => setEditMode(true)}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleSave} color="success">
                Save
              </Button>
              <Button variant="outlined" onClick={() => setEditMode(false)} color="secondary">
                Cancel
              </Button>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}