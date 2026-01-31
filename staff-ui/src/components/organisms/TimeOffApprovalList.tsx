import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  Stack,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  useTimeOffRequests,
  useApproveTimeOff,
  useDenyTimeOff,
  usePendingTimeOffCount,
} from '@/hooks/useTimeOff';
import type { TimeOffRequestResponse } from '@/types/timeOff';

interface TimeOffApprovalListProps {
  businessId: string;
}

const TimeOffApprovalList: React.FC<TimeOffApprovalListProps> = ({ businessId }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});

  const { data: pendingRequests = [] } = useTimeOffRequests(businessId, { status: 'Pending' });
  const { data: allRequests = [] } = useTimeOffRequests(businessId);
  const { data: pendingCount = 0 } = usePendingTimeOffCount(businessId);

  const approveMutation = useApproveTimeOff(businessId);
  const denyMutation = useDenyTimeOff(businessId);

  const [error, setError] = useState<string | null>(null);

  const displayRequests = activeTab === 'pending' ? pendingRequests : allRequests;

  const formatDateRange = (request: TimeOffRequestResponse): string => {
    const start = new Date(request.startDate + 'T00:00:00');
    const end = new Date(request.endDate + 'T00:00:00');

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (request.startDate === request.endDate) {
      if (!request.isAllDay && request.startTime && request.endTime) {
        return `${startStr}, ${request.startTime} - ${request.endTime}`;
      }
      return startStr;
    }

    return `${startStr} - ${endStr}`;
  };

  const calculateDuration = (request: TimeOffRequestResponse): string => {
    if (!request.isAllDay && request.startTime && request.endTime && request.startDate === request.endDate) {
      // Calculate hours for partial day
      const start = new Date(`2000-01-01T${request.startTime}:00`);
      const end = new Date(`2000-01-01T${request.endTime}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return `${hours.toFixed(1)} hours`;
    }

    // Calculate days
    const start = new Date(request.startDate + 'T00:00:00');
    const end = new Date(request.endDate + 'T00:00:00');
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: 'success' | 'error' | 'warning' | 'default'; label: string }> = {
      Pending: { color: 'warning', label: 'Pending' },
      Approved: { color: 'success', label: 'Approved' },
      Denied: { color: 'error', label: 'Denied' },
      Cancelled: { color: 'default', label: 'Cancelled' },
    };
    return configs[status] || configs.Pending;
  };

  const handleApprove = async (requestId: string) => {
    try {
      setError(null);
      const notes = approvalNotes[requestId];
      await approveMutation.mutateAsync({
        requestId,
        data: notes ? { approvalNotes: notes } : undefined,
      });
      setApprovalNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });
      setExpandedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleDeny = async (requestId: string) => {
    try {
      setError(null);
      const notes = approvalNotes[requestId];
      await denyMutation.mutateAsync({
        requestId,
        data: notes ? { approvalNotes: notes } : undefined,
      });
      setApprovalNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });
      setExpandedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny request');
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Time-off Requests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Pending
              {pendingCount > 0 && (
                <Chip label={pendingCount} size="small" color="warning" sx={{ height: 20, minWidth: 20 }} />
              )}
            </Box>
          }
          value="pending"
        />
        <Tab label="All Requests" value="all" />
      </Tabs>

      {/* Requests List */}
      <Stack spacing={2}>
        {displayRequests.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary" textAlign="center">
                {activeTab === 'pending' ? 'No pending time-off requests' : 'No time-off requests'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          displayRequests.map(request => {
            const isExpanded = expandedRequest === request.id;
            const statusConfig = getStatusConfig(request.status);

            return (
              <Card key={request.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Avatar */}
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      {request.staffMemberName
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </Avatar>

                    {/* Main Content */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
                            {request.staffMemberName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: request.timeOffTypeColor,
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {request.timeOffTypeName}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip label={statusConfig.label} color={statusConfig.color} size="small" />
                      </Box>

                      {/* Date Range & Duration */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {formatDateRange(request)}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ mb: 1 }}>
                        {calculateDuration(request)}
                      </Typography>

                      {/* Notes */}
                      {request.notes && (
                        <Box sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Employee Notes:
                          </Typography>
                          <Typography variant="body2">{request.notes}</Typography>
                        </Box>
                      )}

                      {/* Approval Notes (for approved/denied requests) */}
                      {request.approvalNotes && (
                        <Box sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Manager Notes:
                          </Typography>
                          <Typography variant="body2">{request.approvalNotes}</Typography>
                        </Box>
                      )}

                      {/* Approval Info (for approved/denied requests) */}
                      {request.status !== 'Pending' && request.approvedByStaffName && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {request.status} by {request.approvedByStaffName} on{' '}
                          {new Date(request.approvedAt!).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                      )}

                      {/* Actions for Pending Requests */}
                      {request.status === 'Pending' && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckIcon />}
                              onClick={() => handleApprove(request.id)}
                              disabled={approveMutation.isPending || denyMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CloseIcon />}
                              onClick={() => handleDeny(request.id)}
                              disabled={approveMutation.isPending || denyMutation.isPending}
                            >
                              Deny
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                              sx={{
                                ml: 'auto',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                              }}
                            >
                              <ExpandMoreIcon />
                            </IconButton>
                          </Box>

                          {/* Collapsible Notes Field */}
                          <Collapse in={isExpanded}>
                            <TextField
                              label="Approval Notes (Optional)"
                              fullWidth
                              multiline
                              rows={3}
                              size="small"
                              value={approvalNotes[request.id] || ''}
                              onChange={(e) =>
                                setApprovalNotes(prev => ({ ...prev, [request.id]: e.target.value }))
                              }
                              placeholder="Add notes for the employee..."
                              sx={{ mt: 2 }}
                            />
                          </Collapse>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Stack>
    </Box>
  );
};

export default TimeOffApprovalList;
