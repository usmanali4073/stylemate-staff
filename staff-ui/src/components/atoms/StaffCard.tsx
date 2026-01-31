import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import type { StaffMemberListResponse, PermissionLevel, StaffStatus } from '@/types/staff';

interface StaffCardProps {
  staff: StaffMemberListResponse;
  onEdit: (staffId: string) => void;
  onStatusChange: (staffId: string, status: StaffStatus) => void;
}

const StaffCard: React.FC<StaffCardProps> = ({ staff, onEdit, onStatusChange }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (status: StaffStatus) => {
    onStatusChange(staff.id, status);
    handleMenuClose();
  };

  const getPermissionColor = (level: PermissionLevel): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (level) {
      case 'Owner':
        return 'secondary'; // purple
      case 'High':
        return 'error'; // red
      case 'Medium':
        return 'warning'; // orange
      case 'Low':
        return 'info'; // blue
      case 'Basic':
        return 'default'; // grey
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: StaffStatus): 'default' | 'success' | 'warning' => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Suspended':
        return 'warning';
      case 'Archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (firstName: string, lastName: string) => {
    const colors = ['#1976d2', '#7b1fa2', '#388e3c', '#f57c00', '#d32f2f', '#00796b'];
    const name = `${firstName}${lastName}`;
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Avatar */}
            <Avatar
              src={staff.photoUrl || undefined}
              sx={{
                bgcolor: staff.photoUrl ? undefined : getAvatarColor(staff.firstName, staff.lastName),
                width: 56,
                height: 56,
                fontSize: '1.25rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {!staff.photoUrl && getInitials(staff.firstName, staff.lastName)}
            </Avatar>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Name and Actions */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                  {staff.firstName} {staff.lastName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(staff.id);
                    }}
                    sx={{ padding: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{ padding: 0.5 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Job Title */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {staff.jobTitle || 'No job title'}
              </Typography>

              {/* Email */}
              <Typography
                variant="body2"
                color="primary"
                sx={{
                  mb: 1.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {staff.email}
              </Typography>

              {/* Badges Row */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Permission Level */}
                <Chip
                  label={staff.permissionLevel}
                  size="small"
                  color={getPermissionColor(staff.permissionLevel)}
                  sx={{ fontSize: '0.75rem', height: 24 }}
                />

                {/* Status */}
                <Chip
                  label={staff.status}
                  size="small"
                  color={getStatusColor(staff.status)}
                  sx={{ fontSize: '0.75rem', height: 24 }}
                />

                {/* Bookable Indicator */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: staff.isBookable ? 'success.lighter' : 'action.hover',
                  }}
                >
                  <CalendarIcon
                    sx={{
                      fontSize: 14,
                      color: staff.isBookable ? 'success.main' : 'text.disabled',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      color: staff.isBookable ? 'success.main' : 'text.disabled',
                    }}
                  >
                    {staff.isBookable ? 'Bookable' : 'Not Bookable'}
                  </Typography>
                </Box>

                {/* Primary Location */}
                {staff.primaryLocationName && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    📍 {staff.primaryLocationName}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Status Change Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('Active')}>Set Active</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Suspended')}>Suspend</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Archived')}>Archive</MenuItem>
      </Menu>
    </>
  );
};

export default StaffCard;
