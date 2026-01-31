import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add, Edit, Delete, Lock, Search } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import RoleEditorDrawer from '@/components/molecules/RoleEditorDrawer';
import { useRoles, useDeleteRole } from '@/hooks/useRoles';
import type { RoleResponse } from '@/types/role';

interface RoleManagementProps {
  businessId: string;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ businessId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: roles, isLoading, error } = useRoles(businessId);
  const deleteMutation = useDeleteRole(businessId);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleResponse | null>(null);

  // Filter roles by search query
  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    if (!searchQuery.trim()) return roles;

    const query = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
    );
  }, [roles, searchQuery]);

  // Separate default and custom roles
  const defaultRoles = useMemo(
    () => filteredRoles.filter((r) => r.isDefault),
    [filteredRoles]
  );
  const customRoles = useMemo(
    () => filteredRoles.filter((r) => !r.isDefault),
    [filteredRoles]
  );

  // Calculate permission summary for a role
  const getPermissionSummary = (role: RoleResponse): string => {
    const permissions = role.permissions;
    const enabledCount = Object.values(permissions).filter((v) => v === true).length;
    const totalCount = Object.keys(permissions).length;
    return `${enabledCount}/${totalCount} permissions`;
  };

  const handleCreateRole = () => {
    setEditingRoleId(null);
    setEditorOpen(true);
  };

  const handleEditRole = (roleId: string) => {
    setEditingRoleId(roleId);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingRoleId(null);
  };

  const handleDeleteClick = (role: RoleResponse) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await deleteMutation.mutateAsync(roleToDelete.id);
      enqueueSnackbar('Role deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete role';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load roles. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Search and Create */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" startIcon={<Add />} onClick={handleCreateRole}>
          Create Custom Role
        </Button>
      </Box>

      {/* Default Roles Section */}
      {defaultRoles.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Default Roles
          </Typography>
          <Grid container spacing={2}>
            {defaultRoles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 },
                  }}
                  onClick={() => handleEditRole(role.id)}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {role.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip label="Default" size="small" color="primary" />
                          {role.isImmutable && (
                            <Chip icon={<Lock sx={{ fontSize: '1rem' }} />} label="Protected" size="small" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    {role.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {role.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {getPermissionSummary(role)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5 }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRole(role.id);
                      }}
                    >
                      {role.isImmutable ? 'View' : 'Edit'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Custom Roles Section */}
      <Box>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Custom Roles
        </Typography>
        {customRoles.length === 0 ? (
          <Alert severity="info">
            No custom roles yet. Click "Create Custom Role" to add one tailored to your team's needs.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {customRoles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 },
                  }}
                  onClick={() => handleEditRole(role.id)}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {role.name}
                        </Typography>
                      </Box>
                    </Box>
                    {role.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {role.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {getPermissionSummary(role)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5 }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(role);
                      }}
                    >
                      <Delete />
                    </IconButton>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRole(role.id);
                      }}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Role Editor Drawer */}
      <RoleEditorDrawer
        open={editorOpen}
        onClose={handleCloseEditor}
        businessId={businessId}
        roleId={editingRoleId}
        onSaved={handleCloseEditor}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be
            undone. Staff members currently assigned this role will need to be reassigned.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
