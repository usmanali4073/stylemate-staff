import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import PermissionCheckboxGroup from './PermissionCheckboxGroup';
import { useRole, useRoles, useCreateRole, useUpdateRole } from '@/hooks/useRoles';
import type { CreateRoleRequest, UpdateRoleRequest, RolePermissions } from '@/types/role';

interface RoleEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  roleId?: string | null;
  onSaved?: () => void;
}

interface FormData {
  name: string;
  description: string;
  cloneFromRoleId: string;
}

const RoleEditorDrawer: React.FC<RoleEditorDrawerProps> = ({
  open,
  onClose,
  businessId,
  roleId,
  onSaved,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = !!roleId;

  // Hooks
  const { data: role, isLoading: isLoadingRole } = useRole(businessId, roleId);
  const { data: allRoles, isLoading: isLoadingRoles } = useRoles(businessId);
  const createMutation = useCreateRole(businessId);
  const updateMutation = useUpdateRole(businessId);

  // State
  const [permissions, setPermissions] = useState<RolePermissions>({
    schedulingView: false,
    schedulingManage: false,
    timeOffView: false,
    timeOffManage: false,
    timeOffApprove: false,
    staffView: false,
    staffManage: false,
    servicesView: false,
    servicesManage: false,
    clientsView: false,
    clientsManage: false,
    reportsView: false,
    reportsExport: false,
    settingsView: false,
    settingsManage: false,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      cloneFromRoleId: '',
    },
  });

  const cloneFromRoleId = watch('cloneFromRoleId');

  // Reset form when drawer opens with role data
  useEffect(() => {
    if (open && isEditMode && role) {
      reset({
        name: role.name,
        description: role.description || '',
        cloneFromRoleId: '',
      });
      setPermissions(role.permissions);
      setSubmitError(null);
    } else if (open && !isEditMode) {
      reset({
        name: '',
        description: '',
        cloneFromRoleId: '',
      });
      setPermissions({
        schedulingView: false,
        schedulingManage: false,
        timeOffView: false,
        timeOffManage: false,
        timeOffApprove: false,
        staffView: false,
        staffManage: false,
        servicesView: false,
        servicesManage: false,
        clientsView: false,
        clientsManage: false,
        reportsView: false,
        reportsExport: false,
        settingsView: false,
        settingsManage: false,
      });
      setSubmitError(null);
    }
  }, [open, isEditMode, role, reset]);

  // Handle clone from role selection
  useEffect(() => {
    if (cloneFromRoleId && allRoles) {
      const sourceRole = allRoles.find((r) => r.id === cloneFromRoleId);
      if (sourceRole) {
        setPermissions(sourceRole.permissions);
      }
    }
  }, [cloneFromRoleId, allRoles]);

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitError(null);

      if (isEditMode && roleId) {
        // Update existing role
        const updateData: UpdateRoleRequest = {
          name: role?.isDefault ? undefined : data.name, // Can't change default role names
          description: data.description || undefined,
          permissions,
        };

        await updateMutation.mutateAsync({ roleId, data: updateData });
        enqueueSnackbar('Role updated successfully', { variant: 'success' });
      } else {
        // Create new role
        const createData: CreateRoleRequest = {
          name: data.name,
          description: data.description || undefined,
          permissions,
          cloneFromRoleId: data.cloneFromRoleId || undefined,
        };

        await createMutation.mutateAsync(createData);
        enqueueSnackbar('Role created successfully', { variant: 'success' });
      }

      if (onSaved) onSaved();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save role';
      setSubmitError(message);
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleClose = () => {
    reset();
    setPermissions({
      schedulingView: false,
      schedulingManage: false,
      timeOffView: false,
      timeOffManage: false,
      timeOffApprove: false,
      staffView: false,
      staffManage: false,
      servicesView: false,
      servicesManage: false,
      clientsView: false,
      clientsManage: false,
      reportsView: false,
      reportsExport: false,
      settingsView: false,
      settingsManage: false,
    });
    setSubmitError(null);
    onClose();
  };

  const isLoading = isLoadingRole || isLoadingRoles;
  const isDefaultRole = role?.isDefault || false;
  const isOwnerRole = role?.name === 'Owner';
  const isPermissionsDisabled = isOwnerRole; // Owner role permissions cannot be changed

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500 },
          maxWidth: '100%',
        },
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            {isEditMode ? 'Edit Role' : 'Create Custom Role'}
          </Typography>
          <IconButton onClick={handleClose} edge="end">
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Warning for default roles */}
            {isDefaultRole && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  This is a default role
                </Typography>
                <Typography variant="body2">
                  Permission changes will affect all staff assigned to this role.
                  {isOwnerRole && ' Owner role permissions cannot be modified.'}
                </Typography>
              </Alert>
            )}

            {/* Error Message */}
            {submitError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Basic Information */}
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Basic Information
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Role name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Role Name"
                      fullWidth
                      required
                      disabled={isDefaultRole} // Can't rename default roles
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Box>

              {/* Clone from dropdown (only in create mode) */}
              {!isEditMode && allRoles && allRoles.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Controller
                    name="cloneFromRoleId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Clone From (Optional)</InputLabel>
                        <Select {...field} label="Clone From (Optional)">
                          <MenuItem value="">
                            <em>Start from scratch</em>
                          </MenuItem>
                          {allRoles.map((r) => (
                            <MenuItem key={r.id} value={r.id}>
                              {r.name}
                              {r.isDefault && ' (Default)'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Permissions */}
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Permissions
              </Typography>

              <PermissionCheckboxGroup
                permissions={permissions}
                onChange={setPermissions}
                disabled={isPermissionsDisabled}
              />
            </form>
          </>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isSubmitting || createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : isEditMode
              ? 'Save Changes'
              : 'Create Role'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default RoleEditorDrawer;
