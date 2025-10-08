import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ShiftData {
  id: string;
  staff: string;
  role: string;
  date: string;
  time: string;
  duration: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const mockShifts: ShiftData[] = [
  {
    id: '1',
    staff: 'Wendy Smith',
    role: 'Stylist',
    date: 'Mon, 23 Sep',
    time: '9:00 AM - 5:00 PM',
    duration: '8h',
    status: 'scheduled'
  },
  {
    id: '2',
    staff: 'Usman Ali',
    role: 'Barber',
    date: 'Mon, 23 Sep',
    time: '10:00 AM - 6:00 PM',
    duration: '8h',
    status: 'scheduled'
  },
  {
    id: '3',
    staff: 'Tak Shah',
    role: 'Assistant',
    date: 'Tue, 24 Sep',
    time: '12:00 PM - 8:00 PM',
    duration: '8h',
    status: 'scheduled'
  }
];

const Shifts: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('MilkMan');
  const [activeTab, setActiveTab] = useState(0);
  const [shifts, setShifts] = useState<ShiftData[]>(mockShifts);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftData | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const currentWeek = 'This week';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAddShift = () => {
    setSelectedShift(null);
    setAddDialogOpen(true);
  };

  const handleEditShift = (shift: ShiftData) => {
    setSelectedShift(shift);
    setAddDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteShift = (shift: ShiftData) => {
    setSelectedShift(shift);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, shift: ShiftData) => {
    setAnchorEl(event.currentTarget);
    setSelectedShift(shift);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedShift(null);
  };

  const confirmDeleteShift = () => {
    if (selectedShift) {
      setShifts(prevShifts => prevShifts.filter(shift => shift.id !== selectedShift.id));
      setDeleteDialogOpen(false);
      setSelectedShift(null);
    }
  };

  const handleSaveShift = (formData: Record<string, string>) => {
    if (selectedShift) {
      // Edit existing shift
      setShifts(prevShifts =>
        prevShifts.map(shift =>
          shift.id === selectedShift.id
            ? { ...shift, ...formData }
            : shift
        )
      );
    } else {
      // Add new shift
      const newShift: ShiftData = {
        id: String(Date.now()),
        staff: formData.staff || 'New Staff',
        role: formData.role || 'Staff',
        date: formData.date || 'Today',
        time: formData.time || '9:00 AM - 5:00 PM',
        duration: formData.duration || '8h',
        status: formData.status || 'scheduled'
      };
      setShifts(prevShifts => [...prevShifts, newShift]);
    }
    setAddDialogOpen(false);
    setSelectedShift(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Compact Header with All Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <IconButton size="small" onClick={() => navigate('/staff')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight={600}>
            Shifts
          </Typography>

          {/* Location Filter Integrated */}
          <FormControl size="small">
            <InputLabel>Location</InputLabel>
            <Select
              value={selectedLocation}
              label="Location"
              onChange={(e) => setSelectedLocation(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="MilkMan">MilkMan</MenuItem>
              <MenuItem value="Other">Other Location</MenuItem>
            </Select>
          </FormControl>

          {/* Week Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Box sx={{ textAlign: 'center', minWidth: 120 }}>
              <Typography variant="body2" fontWeight={500}>
                {currentWeek}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                21 - 27 Sep, 2025
              </Typography>
            </Box>
            <IconButton size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            size="small"
          >
            Options
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={handleAddShift}
          >
            Add Shift
          </Button>
        </Box>
      </Box>

      {/* View Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Schedule View" />
          <Tab label="List View" />
          <Tab label="Calendar View" />
        </Tabs>
      </Box>

      {/* Shifts Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  Staff Member
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  Role
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  Date
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  Time
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  Duration
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  Status
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={600}>
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map((shift) => (
              <TableRow key={shift.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {shift.staff}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {shift.role}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {shift.date}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {shift.time}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={shift.duration}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '12px' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={shift.status}
                    size="small"
                    color={getStatusColor(shift.status)}
                    sx={{ fontSize: '12px', textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, shift)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Stats */}
      <Box sx={{ mt: 3, display: 'flex', gap: 3 }}>
        <Box sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          flex: 1
        }}>
          <Typography variant="h6" fontWeight={600}>
            {shifts.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Shifts
          </Typography>
        </Box>
        <Box sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          flex: 1
        }}>
          <Typography variant="h6" fontWeight={600}>
            24h
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Hours
          </Typography>
        </Box>
        <Box sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          flex: 1
        }}>
          <Typography variant="h6" fontWeight={600}>
            3
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Staff
          </Typography>
        </Box>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedShift && handleEditShift(selectedShift)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Shift
        </MenuItem>
        <MenuItem onClick={() => selectedShift && handleDeleteShift(selectedShift)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Cancel Shift
        </MenuItem>
      </Menu>

      {/* Add/Edit Shift Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedShift ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Staff Member"
              defaultValue={selectedShift?.staff || ''}
            />
            <TextField
              fullWidth
              label="Role"
              defaultValue={selectedShift?.role || ''}
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              defaultValue={selectedShift?.date || new Date().toISOString().split('T')[0]}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Time"
              defaultValue={selectedShift?.time || ''}
              placeholder="e.g., 9:00 AM - 5:00 PM"
            />
            <TextField
              fullWidth
              label="Duration"
              defaultValue={selectedShift?.duration || ''}
              placeholder="e.g., 8h"
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                defaultValue={selectedShift?.status || 'scheduled'}
                label="Status"
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleSaveShift({})}
            variant="contained"
          >
            {selectedShift ? 'Update Shift' : 'Add Shift'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Cancel Shift</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this shift for{' '}
            <strong>{selectedShift?.staff}</strong> on {selectedShift?.date}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. The shift will be removed from the schedule.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Keep Shift</Button>
          <Button onClick={confirmDeleteShift} color="error" variant="contained">
            Cancel Shift
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Shifts;