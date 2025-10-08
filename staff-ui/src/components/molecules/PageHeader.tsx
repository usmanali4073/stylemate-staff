import React from 'react';
import { Box, Typography } from '@mui/material';
import BackButton from '../atoms/BackButton';

interface PageHeaderProps {
  title: string;
  subtitle?: string | number;
  showBackButton?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  backTo = '/staff',
  actions
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      {showBackButton && <BackButton to={backTo} />}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;