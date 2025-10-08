import React, { useState, useEffect, useCallback, useContext } from 'react';
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
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Add as AddIcon
} from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';
import { staffService } from '../services';
import StaffMemberEditDrawer from '../components/molecules/StaffMemberEditDrawer';
import type { TeamMember } from '../types';
import { getContainerStyles, getCardStyles, getGridSpacing, getScrollableContainerStyles } from '../utils/themeUtils';
import { StaffHeaderControlsContext } from './StaffManagement';

const TeamMembers: React.FC = () => {
  // const navigate = useNavigate();
  const theme = useTheme();
  const { setHeaderControls } = useContext(StaffHeaderControlsContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [staffMembers, setStaffMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Load staff members
  useEffect(() => {
    loadStaffMembers();
  }, []);

  // Filter members when search term changes
  useEffect(() => {
    applyFilters();
  }, [staffMembers, searchTerm]);

  // Set header controls
  useEffect(() => {
    if (isMobile) {
      // Mobile: Icon-only toolbar at bottom
      setHeaderControls(
        <>
          <TextField
            placeholder="Search team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            variant="outlined"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: 40,
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <IconButton
            onClick={handleAddMember}
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              width: 40,
              height: 40
            }}
          >
            <PersonAddIcon fontSize="small" />
          </IconButton>
        </>
      );
    } else {
      // Desktop: Full controls
      setHeaderControls(
        <>
          <TextField
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              minWidth: 300,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                height: 36
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {filteredMembers.length} of {staffMembers.length}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAddMember}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Member
          </Button>
        </>
      );
    }

    return () => setHeaderControls(null);
  }, [searchTerm, filteredMembers.length, staffMembers.length, isMobile, setHeaderControls]);

  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await staffService.getStaff();
      if (response.success) {
        setStaffMembers(response.data);
      } else {
        setError(response.message);
      }
    } catch {
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...staffMembers];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        `${member.personalInfo.firstName} ${member.personalInfo.lastName}`.toLowerCase().includes(searchLower) ||
        member.personalInfo.email.toLowerCase().includes(searchLower) ||
        member.personalInfo.phone?.includes(searchTerm) ||
        member.employment.role.toLowerCase().includes(searchLower)
      );
    }

    setFilteredMembers(filtered);
  }, [staffMembers, searchTerm]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, memberId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedMemberId(memberId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMemberId(null);
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    setDrawerOpen(true);
  };

  const handleEditMember = () => {
    if (selectedMemberId) {
      const member = staffMembers.find(m => m.id === selectedMemberId);
      if (member) {
        setSelectedMember(member);
        setDrawerOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleDeleteMember = () => {
    if (selectedMemberId) {
      const member = staffMembers.find(m => m.id === selectedMemberId);
      if (member) {
        setMemberToDelete(member);
        setDeleteDialogOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleSaveMember = async (member: TeamMember) => {
    try {
      let response;
      if (selectedMember) {
        response = await staffService.updateStaffMember(member.id, member);
      } else {
        // For new members, extract only the required fields for creation
        const createData = {
          firstName: member.personalInfo.firstName,
          lastName: member.personalInfo.lastName,
          email: member.personalInfo.email,
          phone: member.personalInfo.phone,
          role: member.employment.role,
          department: member.employment.department,
          employmentType: member.employment.employmentType,
          hourlyRate: member.employment.hourlyRate,
          hireDate: member.personalInfo.hireDate
        };
        response = await staffService.createStaffMember(createData);
      }

      if (response.success) {
        await loadStaffMembers();
        setDrawerOpen(false);
        setSelectedMember(null);
      } else {
        setError(response.message);
      }
    } catch {
      setError('Failed to save staff member');
    }
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      const response = await staffService.deleteStaffMember(memberToDelete.id);
      if (response.success) {
        await loadStaffMembers();
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      } else {
        setError(response.message);
      }
    } catch {
      setError('Failed to delete staff member');
    }
  };


  const getStatusColor = (status: TeamMember['employment']['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'on-leave':
        return 'info';
      case 'terminated':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: TeamMember['employment']['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'on-leave':
        return 'On Leave';
      case 'terminated':
        return 'Terminated';
      default:
        return status;
    }
  };

  const getAvatarColor = (firstName: string, lastName: string) => {
    const colors = ['#1976d2', '#7b1fa2', '#388e3c', '#f57c00', '#d32f2f', '#00796b'];
    const name = `${firstName}${lastName}`;
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      ...getContainerStyles('full')
    }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, mx: isMobile ? 2 : 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Staff Members - Responsive Layout */}
      {isMobile ? (
        /* Mobile Card View */
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: getGridSpacing().xs,
          width: '100%',
          ...getScrollableContainerStyles()
        }}>
          {filteredMembers.map((member) => (
            <Card key={member.id} sx={{
              ...getCardStyles(),
              width: '100%',
              overflow: 'hidden'
            }}>
              <CardContent sx={{
                p: 2,
                '&:last-child': { pb: 2 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(member.personalInfo.firstName, member.personalInfo.lastName),
                      width: 48,
                      height: 48,
                      fontSize: '16px',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                    src={member.personalInfo.avatar}
                  >
                    {getInitials(member.personalInfo.firstName, member.personalInfo.lastName)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={600} sx={{
                      mb: 0.5,
                      fontSize: '1.1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {member.personalInfo.firstName} {member.personalInfo.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {member.employment.role}
                    </Typography>
                    <Chip
                      label={getStatusLabel(member.employment.status)}
                      size="small"
                      color={getStatusColor(member.employment.status)}
                      sx={{ fontSize: '11px', height: 24 }}
                    />
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, member.id)}
                    size="small"
                    sx={{ flexShrink: 0 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mt: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="body2" color="primary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontSize: '0.875rem'
                    }}>
                      {member.personalInfo.email}
                    </Typography>
                  </Box>
                  {member.personalInfo.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{
                        fontSize: '0.875rem'
                      }}>
                        {formatPhoneNumber(member.personalInfo.phone)}
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{
                    fontSize: '0.75rem',
                    mt: 0.5
                  }}>
                    Hired: {new Date(member.personalInfo.hireDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper} sx={{
          borderRadius: 2,
          ...getScrollableContainerStyles()
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Name
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Contact Information
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Hired
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
              {filteredMembers.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(member.personalInfo.firstName, member.personalInfo.lastName),
                          width: 40,
                          height: 40,
                          fontSize: '14px',
                          fontWeight: 600
                        }}
                        src={member.personalInfo.avatar}
                      >
                        {getInitials(member.personalInfo.firstName, member.personalInfo.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {member.personalInfo.firstName} {member.personalInfo.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.employment.role}
                        </Typography>
                        <Chip
                          label={getStatusLabel(member.employment.status)}
                          size="small"
                          color={getStatusColor(member.employment.status)}
                          sx={{ mt: 0.5, fontSize: '11px', height: 20 }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="primary">
                          {member.personalInfo.email}
                        </Typography>
                      </Box>
                      {member.personalInfo.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatPhoneNumber(member.personalInfo.phone)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(member.personalInfo.hireDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, member.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMembers.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No staff members found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Get started by adding your first staff member'
                }
              </Typography>
              {staffMembers.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAddMember}
                >
                  Add First Staff Member
                </Button>
              )}
            </Box>
          )}
        </TableContainer>
      )}

      {/* Empty state for mobile */}
      {isMobile && filteredMembers.length === 0 && !loading && (
        <Card sx={{
          ...getCardStyles(),
          mt: 2,
          p: 4,
          textAlign: 'center',
          width: '100%'
        }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No staff members found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm
              ? 'Try adjusting your search'
              : 'Get started by adding your first staff member'
            }
          </Typography>
          {staffMembers.length === 0 && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddMember}
              fullWidth
              size="large"
            >
              Add First Staff Member
            </Button>
          )}
        </Card>
      )}

      {/* Row Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditMember}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Profile
        </MenuItem>
        <MenuItem onClick={handleDeleteMember} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Remove Staff Member
        </MenuItem>
      </Menu>

      {/* Staff Member Edit Drawer */}
      <StaffMemberEditDrawer
        open={drawerOpen}
        member={selectedMember}
        onSave={handleSaveMember}
        onCancel={() => {
          setDrawerOpen(false);
          setSelectedMember(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Staff Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove{' '}
            <strong>
              {memberToDelete?.personalInfo.firstName} {memberToDelete?.personalInfo.lastName}
            </strong>{' '}
            from your staff? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Their employment status will be changed to "terminated" and they will no longer appear in active staff lists.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteMember} color="error" variant="contained">
            Remove Staff Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamMembers;