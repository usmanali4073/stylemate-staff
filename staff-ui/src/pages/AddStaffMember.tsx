import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const colorOptions = [
  '#3B82F6', '#60A5FA', '#93C5FD', '#3F83F4', '#8B5CF6', '#A855F7',
  '#EC4899', '#F472B6', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#10B981', '#06B6D4'
];

interface NavigationItem {
  id: string;
  label: string;
  active?: boolean;
  badge?: string;
}

const personalNavigation: NavigationItem[] = [
  { id: 'profile', label: 'Profile', active: true },
  { id: 'addresses', label: 'Addresses' },
  { id: 'emergency', label: 'Emergency contacts' }
];

const workspaceNavigation: NavigationItem[] = [
  { id: 'services', label: 'Services', badge: '4' },
  { id: 'locations', label: 'Locations' },
  { id: 'merchant', label: 'Merchant account' },
  { id: 'settings', label: 'Settings' }
];

const payNavigation: NavigationItem[] = [
  { id: 'wages', label: 'Wages and timesheets' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'payruns', label: 'Pay runs' }
];

const AddStaffMember: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [country, setCountry] = useState('');
  const [birthday, setBirthday] = useState('');
  const [year, setYear] = useState('');
  const [calendarColor, setCalendarColor] = useState(colorOptions[0]);
  const [jobTitle, setJobTitle] = useState('');
  const [startDate, setStartDate] = useState('22 September');
  const [startYear, setStartYear] = useState('2025');
  const [endDate, setEndDate] = useState('');
  const [endYear, setEndYear] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [teamMemberId, setTeamMemberId] = useState('');
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState('profile');

  const handleClose = () => {
    navigate('/staff');
  };

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving staff member...');
    navigate('/staff');
  };

  const renderNavigationSection = (title: string, items: NavigationItem[]) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1, px: 2 }}>
        {title}
      </Typography>
      <List sx={{ py: 0 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.id}
            selected={item.active || activeSection === item.id}
            onClick={() => setActiveSection(item.id)}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                }
              }
            }}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: item.active ? 600 : 400
              }}
            />
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '11px',
                  backgroundColor: 'error.main',
                  color: 'error.contrastText'
                }}
              />
            )}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left Sidebar */}
      <Box sx={{
        width: 280,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: 2
      }}>
        {renderNavigationSection('Personal', personalNavigation)}
        {renderNavigationSection('Workspace', workspaceNavigation)}
        {renderNavigationSection('Pay', payNavigation)}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h5" fontWeight={600}>
            Add team member
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={handleClose}>
              Close
            </Button>
            <Button variant="contained" onClick={handleSave}>
              Add
            </Button>
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 4, maxWidth: 800 }}>
          {activeSection === 'profile' && (
            <>
              {/* Profile Picture */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Box sx={{ position: 'relative', mr: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.light',
                      color: 'primary.main'
                    }}
                  >
                    <EditIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: -5,
                      right: -5,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider'
                    }}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Personal Information */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="First name *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">+1</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Additional phone number"
                    value={additionalPhone}
                    onChange={(e) => setAdditionalPhone(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">+1</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={country}
                      label="Country"
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      <MenuItem value="">Select country</MenuItem>
                      <MenuItem value="us">United States</MenuItem>
                      <MenuItem value="ca">Canada</MenuItem>
                      <MenuItem value="uk">United Kingdom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Birthday"
                    placeholder="Day and month"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </Grid>
              </Grid>

              {/* Calendar Color */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Calendar color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {colorOptions.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setCalendarColor(color)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: calendarColor === color ? '3px solid' : '2px solid transparent',
                        borderColor: calendarColor === color ? 'primary.main' : 'transparent',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Job Title */}
              <Box sx={{ mt: 4 }}>
                <TextField
                  fullWidth
                  label="Job title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  helperText="Visible to clients online"
                />
              </Box>

              {/* Work Details */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Work details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Manage your team member's start date, end employment details
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Start date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Year"
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="End date"
                      placeholder="Day and month"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Year"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Employment type</InputLabel>
                      <Select
                        value={employmentType}
                        label="Employment type"
                        onChange={(e) => setEmploymentType(e.target.value)}
                      >
                        <MenuItem value="">Select an option</MenuItem>
                        <MenuItem value="fulltime">Full-time</MenuItem>
                        <MenuItem value="parttime">Part-time</MenuItem>
                        <MenuItem value="contractor">Contractor</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Team member ID"
                      value={teamMemberId}
                      onChange={(e) => setTeamMemberId(e.target.value)}
                      helperText="An identifier used for external systems like payroll"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Notes */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add a private note only viewable in the team member list"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${notes.length}/1000`}
                />
              </Box>
            </>
          )}

          {activeSection === 'addresses' && (
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Addresses
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your team member's correspondence addresses.
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />}>
                Add an address
              </Button>
            </Box>
          )}

          {/* Other sections would be implemented similarly */}
        </Box>
      </Box>
    </Box>
  );
};

export default AddStaffMember;