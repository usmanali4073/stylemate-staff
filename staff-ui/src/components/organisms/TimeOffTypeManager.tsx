import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  useTimeOffTypes,
  useCreateTimeOffType,
  useUpdateTimeOffType,
  useDeleteTimeOffType,
} from '@/hooks/useTimeOff';
import type { TimeOffTypeResponse } from '@/types/timeOff';

interface TimeOffTypeManagerProps {
  businessId: string;
}

const DEFAULT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Coral
  '#98D8C8', // Mint
  '#FFD93D', // Yellow
  '#B19CD9', // Purple
  '#F95D6A', // Pink
];

const TimeOffTypeManager: React.FC<TimeOffTypeManagerProps> = ({ businessId }) => {
  const { data: types = [], isLoading } = useTimeOffTypes(businessId);
  const createMutation = useCreateTimeOffType(businessId);
  const updateMutation = useUpdateTimeOffType(businessId);
  const deleteMutation = useDeleteTimeOffType(businessId);

  const [isCreating, setIsCreating] = useState(false);
  const [editingType, setEditingType] = useState<TimeOffTypeResponse | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    color: DEFAULT_COLORS[0],
  });

  const [error, setError] = useState<string | null>(null);

  const handleStartCreate = () => {
    setFormData({ name: '', color: DEFAULT_COLORS[0] });
    setIsCreating(true);
    setError(null);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setFormData({ name: '', color: DEFAULT_COLORS[0] });
    setError(null);
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await createMutation.mutateAsync({
        name: formData.name,
        color: formData.color,
      });
      handleCancelCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create time-off type');
    }
  };

  const handleStartEdit = (type: TimeOffTypeResponse) => {
    setEditingType(type);
    setFormData({ name: type.name, color: type.color });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setFormData({ name: '', color: DEFAULT_COLORS[0] });
    setError(null);
  };

  const handleUpdate = async () => {
    if (!editingType) return;
    try {
      setError(null);
      await updateMutation.mutateAsync({
        typeId: editingType.id,
        data: {
          name: formData.name,
          color: formData.color,
        },
      });
      handleCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time-off type');
    }
  };

  const handleDelete = async (typeId: string) => {
    try {
      setError(null);
      await deleteMutation.mutateAsync(typeId);
      setDeleteDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete time-off type');
      setDeleteDialog(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading time-off types...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Time-off Types
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleStartCreate}
          disabled={isCreating}
        >
          Add Type
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Create Form */}
      {isCreating && (
        <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
          <Stack spacing={2}>
            <TextField
              label="Type Name"
              size="small"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Maternity Leave"
            />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {DEFAULT_COLORS.map(color => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: color,
                      cursor: 'pointer',
                      border: 2,
                      borderColor: formData.color === color ? 'primary.main' : 'transparent',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={handleCancelCreate}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleCreate}
                disabled={!formData.name || createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Types List */}
      <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        {types.length === 0 ? (
          <ListItem>
            <ListItemText secondary="No time-off types. Add one to get started." />
          </ListItem>
        ) : (
          types.map((type, index) => (
            <ListItem
              key={type.id}
              sx={{
                borderBottom: index < types.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}
              secondaryAction={
                editingType?.id === type.id ? (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={handleCancelEdit}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={handleUpdate} disabled={updateMutation.isPending}>
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleStartEdit(type)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {!type.isDefault && (
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(type.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )
              }
            >
              {editingType?.id === type.id ? (
                <Box sx={{ display: 'flex', gap: 2, flex: 1, mr: 2, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    sx={{ flex: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {DEFAULT_COLORS.map(color => (
                      <Box
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: color,
                          cursor: 'pointer',
                          border: 2,
                          borderColor: formData.color === color ? 'primary.main' : 'transparent',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: type.color,
                    }}
                  />
                  <ListItemText
                    primary={type.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {type.isDefault && (
                          <Chip label="Default" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                        {!type.isActive && (
                          <Chip label="Inactive" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Box>
                    }
                  />
                </Box>
              )}
            </ListItem>
          ))
        )}
      </List>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Time-off Type</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this time-off type? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteDialog && handleDelete(deleteDialog)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeOffTypeManager;
