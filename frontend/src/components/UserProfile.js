import React, { useState } from 'react';
import {
  Card, CardContent, Typography, List, ListItem, ListItemText,
  Button, TextField, Stack, Divider, Box
} from '@mui/material';

export default function UserProfile({ userId, form, setForm, onSave, friends, onAddFriend, onRemoveFriend }) {
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ ...form });
  const [friendName, setFriendName] = useState('');

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(editForm);
    setEditMode(false);
  };

  const handleAddFriend = () => {
    if (friendName.trim()) {
      onAddFriend(friendName.trim());
      setFriendName('');
    }
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
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Friends
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Add Friend"
              value={friendName}
              onChange={e => setFriendName(e.target.value)}
              sx={{ width: 180 }}
            />
            <Button variant="contained" onClick={handleAddFriend} color="primary">
              Add
            </Button>
          </Stack>
        </Box>
        <List dense>
          {friends && friends.length > 0 ? (
            friends.map((f, idx) => (
              <ListItem
                key={f.id || f.name || idx}
                secondaryAction={
                  <Button color="secondary" size="small" onClick={() => onRemoveFriend(f)}>
                    Remove
                  </Button>
                }
              >
                <ListItemText primary={f.name} />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No friends added yet." />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
}