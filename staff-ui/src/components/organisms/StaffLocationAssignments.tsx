import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete, Star, StarBorder } from '@mui/icons-material';
import { useStaffLocations, useAssignLocation, useRemoveLocation, useSetPrimaryLocation } from '@/hooks/useStaff';
import { useSnackbar } from 'notistack';

interface Location {
  id: string;
  businessName: string;
  address: string | null;
}

interface StaffLocationAssignmentsProps {
  businessId: string;
  staffId: string;
}

const StaffLocationAssignments: React.FC<StaffLocationAssignmentsProps> = ({ businessId, staffId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: staffLocations, isLoading, error } = useStaffLocations(businessId, staffId);
  const assignLocation = useAssignLocation(businessId, staffId);
  const removeLocation = useRemoveLocation(businessId, staffId);
  const setPrimaryLocation = useSetPrimaryLocation(businessId, staffId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Fetch available locations from business-management API
  useEffect(() => {
    if (addDialogOpen) {
      fetchAvailableLocations();
    }
  }, [addDialogOpen]);

  const fetchAvailableLocations = async () => {
    setLoadingLocations(true);
    try {
      const apiUrl = import.meta.env.VITE_BUSINESS_API_URL || '';
      const token = localStorage.getItem('stylemate-auth-token') || sessionStorage.getItem('stylemate-auth-token');

      const response = await fetch(`${apiUrl}/api/businesses/${businessId}/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const locations = await response.json();

      // Filter out already assigned locations
      const assignedLocationIds = staffLocations?.map(loc => loc.locationId) || [];
      const available = locations.filter((loc: Location) => !assignedLocationIds.includes(loc.id));

      setAvailableLocations(available);
    } catch (error) {
      enqueueSnackbar('Failed to load available locations', { variant: 'error' });
      console.error('Error fetching locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleAddLocation = async () => {
    if (!selectedLocationId) {
      enqueueSnackbar('Please select a location', { variant: 'warning' });
      return;
    }

    try {
      await assignLocation.mutateAsync({ locationId: selectedLocationId });
      enqueueSnackbar('Location assigned successfully', { variant: 'success' });
      setAddDialogOpen(false);
      setSelectedLocationId('');
    } catch (error) {
      enqueueSnackbar('Failed to assign location', { variant: 'error' });
    }
  };

  const handleRemoveLocation = async (locationId: string) => {
    try {
      await removeLocation.mutateAsync(locationId);
      enqueueSnackbar('Location removed successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to remove location', { variant: 'error' });
    }
  };

  const handleSetPrimary = async (locationId: string) => {
    try {
      await setPrimaryLocation.mutateAsync(locationId);
      enqueueSnackbar('Primary location updated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to set primary location', { variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load location assignments. Please try again.
      </Alert>
    );
  }

  const locations = staffLocations || [];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Location Assignments</Typography>
          <Button variant="contained" onClick={() => setAddDialogOpen(true)}>
            Add Location
          </Button>
        </Box>

        {locations.length === 0 ? (
          <Alert severity="info">
            No locations assigned. Click "Add Location" to assign this staff member to a location.
          </Alert>
        ) : (
          <List>
            {locations.map((location) => (
              <ListItem
                key={location.id}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {location.isPrimary ? (
                      <Chip
                        icon={<Star />}
                        label="Primary"
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    ) : (
                      <IconButton
                        edge="end"
                        onClick={() => handleSetPrimary(location.locationId)}
                        title="Set as Primary"
                      >
                        <StarBorder />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveLocation(location.locationId)}
                      disabled={location.isPrimary}
                      title={location.isPrimary ? 'Cannot remove primary location' : 'Remove location'}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <ListItemText
                  primary={location.locationName || location.locationId}
                  secondary={`Assigned: ${new Date(location.assignedAt).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      {/* Add Location Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Location</DialogTitle>
        <DialogContent>
          {loadingLocations ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : availableLocations.length === 0 ? (
            <Alert severity="info">
              All available locations have been assigned to this staff member.
            </Alert>
          ) : (
            <TextField
              select
              fullWidth
              label="Select Location"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              sx={{ mt: 2 }}
            >
              {availableLocations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.businessName}
                  {location.address && ` - ${location.address}`}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddLocation}
            variant="contained"
            disabled={!selectedLocationId || assignLocation.isPending}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default StaffLocationAssignments;
