import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Button,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import type { RolePermissions } from '@/types/role';

interface PermissionCheckboxGroupProps {
  permissions: RolePermissions;
  onChange: (permissions: RolePermissions) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

interface PermissionItem {
  key: keyof RolePermissions;
  label: string;
  description?: string;
}

interface PermissionAreaConfig {
  area: string;
  permissions: PermissionItem[];
}

const PERMISSION_AREAS: PermissionAreaConfig[] = [
  {
    area: 'Scheduling',
    permissions: [
      { key: 'schedulingView', label: 'View Schedule', description: 'View shifts and schedules' },
      { key: 'schedulingManage', label: 'Manage Schedule', description: 'Create, edit, and delete shifts' },
    ],
  },
  {
    area: 'Time-off',
    permissions: [
      { key: 'timeOffView', label: 'View Time-off', description: 'View time-off requests' },
      { key: 'timeOffManage', label: 'Manage Time-off', description: 'Create and cancel time-off requests' },
      { key: 'timeOffApprove', label: 'Approve Time-off', description: 'Approve or deny time-off requests' },
    ],
  },
  {
    area: 'Staff',
    permissions: [
      { key: 'staffView', label: 'View Staff', description: 'View staff member information' },
      { key: 'staffManage', label: 'Manage Staff', description: 'Add, edit, and remove staff members' },
    ],
  },
  {
    area: 'Services',
    permissions: [
      { key: 'servicesView', label: 'View Services', description: 'View service catalog' },
      { key: 'servicesManage', label: 'Manage Services', description: 'Create, edit, and delete services' },
    ],
  },
  {
    area: 'Clients',
    permissions: [
      { key: 'clientsView', label: 'View Clients', description: 'View client information' },
      { key: 'clientsManage', label: 'Manage Clients', description: 'Create, edit, and delete client profiles' },
    ],
  },
  {
    area: 'Reports',
    permissions: [
      { key: 'reportsView', label: 'View Reports', description: 'View business reports' },
      { key: 'reportsExport', label: 'Export Reports', description: 'Export reports to files' },
    ],
  },
  {
    area: 'Settings',
    permissions: [
      { key: 'settingsView', label: 'View Settings', description: 'View business and location settings' },
      { key: 'settingsManage', label: 'Manage Settings', description: 'Update business and location configuration' },
    ],
  },
];

const PermissionCheckboxGroup: React.FC<PermissionCheckboxGroupProps> = ({
  permissions,
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  // Calculate permission counts per area
  const areaStats = useMemo(() => {
    return PERMISSION_AREAS.map((area) => {
      const enabled = area.permissions.filter((p) => permissions[p.key]).length;
      const total = area.permissions.length;
      return { area: area.area, enabled, total };
    });
  }, [permissions]);

  const handleToggle = (key: keyof RolePermissions) => {
    if (disabled || readOnly) return;
    onChange({ ...permissions, [key]: !permissions[key] });
  };

  const handleSelectAll = (area: PermissionAreaConfig, selectAll: boolean) => {
    if (disabled || readOnly) return;
    const updated = { ...permissions };
    area.permissions.forEach((p) => {
      updated[p.key] = selectAll;
    });
    onChange(updated);
  };

  if (readOnly) {
    // Read-only mode: show chips instead of checkboxes
    return (
      <Box>
        {PERMISSION_AREAS.map((area, index) => (
          <Box key={area.area} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {area.area}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {area.permissions.map((permission) => (
                permissions[permission.key] && (
                  <Chip
                    key={permission.key}
                    label={permission.label}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )
              ))}
              {area.permissions.every((p) => !permissions[p.key]) && (
                <Typography variant="body2" color="text.secondary">
                  No permissions
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {PERMISSION_AREAS.map((area, index) => {
        const stats = areaStats[index];
        const allSelected = stats.enabled === stats.total;
        const someSelected = stats.enabled > 0 && stats.enabled < stats.total;

        return (
          <Accordion key={area.area} defaultExpanded={index === 0} disableGutters>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, pr: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {area.area}
                </Typography>
                <Chip
                  label={`${stats.enabled}/${stats.total}`}
                  size="small"
                  color={allSelected ? 'primary' : someSelected ? 'default' : 'default'}
                  variant={allSelected ? 'filled' : 'outlined'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll(area, !allSelected);
                  }}
                  disabled={disabled}
                  sx={{ textTransform: 'none' }}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
              <FormGroup>
                {area.permissions.map((permission) => (
                  <FormControlLabel
                    key={permission.key}
                    control={
                      <Checkbox
                        checked={permissions[permission.key]}
                        onChange={() => handleToggle(permission.key)}
                        disabled={disabled}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {permission.label}
                        </Typography>
                        {permission.description && (
                          <Typography variant="caption" color="text.secondary">
                            {permission.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default PermissionCheckboxGroup;
