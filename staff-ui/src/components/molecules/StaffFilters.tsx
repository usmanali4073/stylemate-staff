import React from 'react';
import {
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { StaffStatus, PermissionLevel } from '@/types/staff';

interface StaffFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StaffStatus | 'All';
  onStatusFilterChange: (value: StaffStatus | 'All') => void;
  permissionFilter: PermissionLevel | 'All';
  onPermissionFilterChange: (value: PermissionLevel | 'All') => void;
}

const StaffFilters: React.FC<StaffFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  permissionFilter,
  onPermissionFilterChange,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3,
        alignItems: { xs: 'stretch', md: 'center' },
      }}
    >
      {/* Search Field */}
      <TextField
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ flex: 1, minWidth: { xs: '100%', md: 300 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Status Filter */}
      <ToggleButtonGroup
        value={statusFilter}
        exclusive
        onChange={(_, value) => {
          if (value !== null) {
            onStatusFilterChange(value);
          }
        }}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            px: 2,
            py: 0.75,
            textTransform: 'none',
            fontSize: '0.875rem',
          },
        }}
      >
        <ToggleButton value="All">All</ToggleButton>
        <ToggleButton value="Active">Active</ToggleButton>
        <ToggleButton value="Suspended">Suspended</ToggleButton>
        <ToggleButton value="Archived">Archived</ToggleButton>
      </ToggleButtonGroup>

      {/* Permission Filter */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Permission</InputLabel>
        <Select
          value={permissionFilter}
          label="Permission"
          onChange={(e) => onPermissionFilterChange(e.target.value as PermissionLevel | 'All')}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Basic">Basic</MenuItem>
          <MenuItem value="Low">Low</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="High">High</MenuItem>
          <MenuItem value="Owner">Owner</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default StaffFilters;
