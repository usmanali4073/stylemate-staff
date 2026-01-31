import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Skeleton,
  Snackbar,
  Alert,
  Button,
} from '@mui/material';
import { PersonAdd as PersonAddIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useActiveBusinessId } from '@/hooks/useActiveBusinessId';
import { useStaffMembers, useChangeStaffStatus } from '@/hooks/useStaff';
import StaffCard from '@/components/atoms/StaffCard';
import StaffFilters from '@/components/molecules/StaffFilters';
import StaffMemberEditDrawer from '@/components/molecules/StaffMemberEditDrawer';
import type { StaffStatus, PermissionLevel } from '@/types/staff';

const TeamMembers: React.FC = () => {
  const navigate = useNavigate();
  const businessId = useActiveBusinessId();

  const { data: staffMembers = [], isLoading, error } = useStaffMembers(businessId);
  const changeStatusMutation = useChangeStaffStatus(businessId || '');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'All'>('All');
  const [permissionFilter, setPermissionFilter] = useState<PermissionLevel | 'All'>('All');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Filter staff members
  const filteredStaff = useMemo(() => {
    let filtered = [...staffMembers];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((member) => member.status === statusFilter);
    }

    if (permissionFilter !== 'All') {
      filtered = filtered.filter((member) => member.permissionLevel === permissionFilter);
    }

    return filtered;
  }, [staffMembers, searchTerm, statusFilter, permissionFilter]);

  const handleEditStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedStaffId(null);
  };

  const handleStatusChange = async (staffId: string, status: StaffStatus) => {
    if (!businessId) return;

    try {
      await changeStatusMutation.mutateAsync({
        staffId,
        data: { status },
      });
      setSnackbarMessage(`Staff member status changed to ${status}`);
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage(`Failed to change status: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSnackbarOpen(true);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load staff members: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          textAlign: 'center',
          gap: 2,
          p: { xs: 2, sm: 3 },
        }}
      >
        <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Typography variant="h5" fontWeight={600} color="text.secondary">
          Add your first team member
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Start building your team by adding staff members who can manage appointments and services.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Filters */}
      <StaffFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        permissionFilter={permissionFilter}
        onPermissionFilterChange={setPermissionFilter}
      />

      {/* Staff Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredStaff.length} of {staffMembers.length} staff members
      </Typography>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No staff members found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredStaff.map((staff) => (
            <Grid key={staff.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <StaffCard
                staff={staff}
                onEdit={handleEditStaff}
                onStatusChange={handleStatusChange}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Drawer */}
      <StaffMemberEditDrawer
        open={drawerOpen}
        staffId={selectedStaffId}
        onClose={handleCloseDrawer}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default TeamMembers;
