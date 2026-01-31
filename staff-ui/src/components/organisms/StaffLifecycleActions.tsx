import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import { Warning, Archive, Delete, CheckCircle } from '@mui/icons-material';
import { useChangeStaffStatus, useDeleteStaffMember } from '@/hooks/useStaff';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import type { StaffStatus } from '@/types/staff';

interface StaffLifecycleActionsProps {
  businessId: string;
  staffId: string;
  currentStatus: StaffStatus;
}

const StaffLifecycleActions: React.FC<StaffLifecycleActionsProps> = ({
  businessId,
  staffId,
  currentStatus,
}) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const changeStatus = useChangeStaffStatus(businessId);
  const deleteStaff = useDeleteStaffMember(businessId);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'archive' | 'reactivate' | 'delete';
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: 'error' | 'warning' | 'success';
  } | null>(null);

  const handleSuspend = () => {
    setConfirmAction({
      type: 'suspend',
      title: 'Suspend Staff Member',
      message:
        "This will disable the staff member's access. They won't be able to log in until reactivated.",
      confirmLabel: 'Suspend',
      confirmColor: 'warning',
    });
    setConfirmDialogOpen(true);
  };

  const handleArchive = () => {
    setConfirmAction({
      type: 'archive',
      title: 'Archive Staff Member',
      message:
        'This will remove the staff member from the calendar and active roster. Historical data is preserved.',
      confirmLabel: 'Archive',
      confirmColor: 'error',
    });
    setConfirmDialogOpen(true);
  };

  const handleReactivate = () => {
    setConfirmAction({
      type: 'reactivate',
      title: 'Reactivate Staff Member',
      message:
        'This will restore the staff member to active status and allow them to log in again.',
      confirmLabel: 'Reactivate',
      confirmColor: 'success',
    });
    setConfirmDialogOpen(true);
  };

  const handleDelete = () => {
    setConfirmAction({
      type: 'delete',
      title: 'Delete Staff Member Permanently',
      message:
        'This will permanently delete this staff member. Past appointment records will be preserved but the profile will be removed. This cannot be undone.',
      confirmLabel: 'Delete Permanently',
      confirmColor: 'error',
    });
    setConfirmDialogOpen(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'delete') {
        await deleteStaff.mutateAsync(staffId);
        enqueueSnackbar('Staff member deleted successfully', { variant: 'success' });
        navigate('/staff');
      } else {
        let newStatus: StaffStatus;
        switch (confirmAction.type) {
          case 'suspend':
            newStatus = 'Suspended';
            break;
          case 'archive':
            newStatus = 'Archived';
            break;
          case 'reactivate':
            newStatus = 'Active';
            break;
          default:
            return;
        }

        await changeStatus.mutateAsync({ staffId, data: { status: newStatus } });
        enqueueSnackbar(`Staff member ${confirmAction.type}d successfully`, { variant: 'success' });

        if (confirmAction.type === 'archive') {
          navigate('/staff');
        }
      }

      setConfirmDialogOpen(false);
      setConfirmAction(null);
    } catch (error) {
      enqueueSnackbar(`Failed to ${confirmAction.type} staff member`, { variant: 'error' });
    }
  };

  const getStatusColor = (status: StaffStatus): 'success' | 'warning' | 'default' => {
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

  const getStatusIcon = (status: StaffStatus) => {
    switch (status) {
      case 'Active':
        return <CheckCircle />;
      case 'Suspended':
        return <Warning />;
      case 'Archived':
        return <Archive />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Staff Lifecycle Management
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, mt: 3 }}>
          {getStatusIcon(currentStatus)}
          <Typography variant="body1" color="text.secondary">
            Current Status:
          </Typography>
          <Chip label={currentStatus} color={getStatusColor(currentStatus)} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {currentStatus === 'Active' && (
            <>
              <Box>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  onClick={handleSuspend}
                  startIcon={<Warning />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={600}>
                      Suspend
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Disable access without removing from roster
                    </Typography>
                  </Box>
                </Button>
              </Box>

              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleArchive}
                  startIcon={<Archive />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={600}>
                      Archive
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Remove from active roster, preserve historical data
                    </Typography>
                  </Box>
                </Button>
              </Box>
            </>
          )}

          {currentStatus === 'Suspended' && (
            <>
              <Box>
                <Button
                  variant="outlined"
                  color="success"
                  fullWidth
                  onClick={handleReactivate}
                  startIcon={<CheckCircle />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={600}>
                      Reactivate
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Restore access and return to active status
                    </Typography>
                  </Box>
                </Button>
              </Box>

              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleArchive}
                  startIcon={<Archive />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={600}>
                      Archive
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Remove from active roster, preserve historical data
                    </Typography>
                  </Box>
                </Button>
              </Box>
            </>
          )}

          {currentStatus === 'Archived' && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Archived staff members can only be permanently deleted. Historical appointment
                records will be preserved.
              </Alert>

              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleDelete}
                  startIcon={<Delete />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
                >
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={600}>
                      Delete Permanently
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Remove staff profile permanently (cannot be undone)
                    </Typography>
                  </Box>
                </Button>
              </Box>
            </>
          )}
        </Box>
      </CardContent>

      {confirmAction && (
        <ConfirmDialog
          open={confirmDialogOpen}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          confirmColor={confirmAction.confirmColor}
          onConfirm={executeAction}
          onCancel={() => {
            setConfirmDialogOpen(false);
            setConfirmAction(null);
          }}
        />
      )}
    </Card>
  );
};

export default StaffLifecycleActions;
