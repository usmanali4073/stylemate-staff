import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Schedule,
} from '@mui/icons-material';
import { useLatestInvitation, useSendInvitation, useResendInvitation } from '@/hooks/useInvitations';
import { useSnackbar } from 'notistack';

interface InvitationStatusProps {
  businessId: string;
  staffId: string;
  staffEmail: string;
  hasPendingInvitation: boolean;
}

const InvitationStatus: React.FC<InvitationStatusProps> = ({
  businessId,
  staffId,
  staffEmail,
  hasPendingInvitation,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: invitation, isLoading, error } = useLatestInvitation(businessId, staffId);
  const sendInvitation = useSendInvitation(businessId, staffId);
  const resendInvitation = useResendInvitation(businessId, staffId);

  const handleSendInvitation = async () => {
    try {
      await sendInvitation.mutateAsync();
      enqueueSnackbar('Invitation sent successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to send invitation', { variant: 'error' });
    }
  };

  const handleResendInvitation = async () => {
    try {
      await resendInvitation.mutateAsync();
      enqueueSnackbar('Invitation resent successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to resend invitation', { variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // No invitation exists
  if (error || !invitation) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Schedule color="action" />
            <Typography variant="h6">No Invitation Sent</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send an invitation to {staffEmail} to allow them to accept their staff position and set up their account.
          </Typography>
          <Button
            variant="contained"
            onClick={handleSendInvitation}
            disabled={sendInvitation.isPending}
          >
            Send Invitation
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Invitation accepted
  if (invitation.status === 'Accepted') {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircle color="success" />
            <Typography variant="h6">Invitation Accepted</Typography>
            <Chip label="Accepted" color="success" size="small" />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Email: {invitation.email}
            </Typography>
            {invitation.acceptedAt && (
              <Typography variant="body2" color="text.secondary">
                Accepted on: {new Date(invitation.acceptedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Invitation expired
  if (invitation.isExpired || invitation.status === 'Expired') {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Error color="error" />
            <Typography variant="h6">Invitation Expired</Typography>
            <Chip label="Expired" color="error" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The invitation sent to {invitation.email} has expired. Send a new invitation to allow them to accept their position.
          </Typography>
          <Button
            variant="contained"
            onClick={handleResendInvitation}
            disabled={resendInvitation.isPending}
          >
            Resend Invitation
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Invitation pending
  const expiresAt = new Date(invitation.expiresAt);
  const createdAt = new Date(invitation.createdAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isNearExpiry = daysUntilExpiry <= 2;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Schedule color="warning" />
          <Typography variant="h6">Invitation Pending</Typography>
          <Chip label="Pending" color="warning" size="small" />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Email: {invitation.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sent: {createdAt.toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Expires: {expiresAt.toLocaleDateString()} ({daysUntilExpiry} days remaining)
          </Typography>
        </Box>

        {isNearExpiry && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This invitation will expire soon. Consider resending if the recipient needs more time.
          </Alert>
        )}

        <Button
          variant="outlined"
          onClick={handleResendInvitation}
          disabled={resendInvitation.isPending}
        >
          Resend Invitation
        </Button>
      </CardContent>
    </Card>
  );
};

export default InvitationStatus;
