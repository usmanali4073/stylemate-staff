import React from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';

interface StaffCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ sx?: object }>;
  colorKey: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  count?: number;
  onClick: () => void;
}

const StaffCard: React.FC<StaffCardProps> = ({
  title,
  description,
  icon: IconComponent,
  colorKey,
  count,
  onClick
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: theme => (theme.shape.borderRadius as number) / 8,
        backgroundColor: theme => theme.palette.background.paper,
        border: theme => theme.palette.mode === 'dark' ? 'none' : '1px solid',
        borderColor: 'divider',
        boxShadow: theme => theme.palette.mode === 'dark' ? 1 : 0,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 8px 24px 0 rgba(0,0,0,0.4)'
            : '0 8px 24px 0 rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ height: '100%' }}
      >
        <CardContent sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                backgroundColor: theme.palette[colorKey].main,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                flexShrink: 0,
                boxShadow: `0 4px 14px 0 ${theme.palette[colorKey].main}33`
              }}
            >
              <IconComponent sx={{
                color: theme.palette[colorKey].contrastText || 'white',
                fontSize: 24
              }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  fontWeight={600}
                >
                  {title}
                  {count && (
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        ml: 1,
                        height: 20,
                        fontSize: '11px',
                        backgroundColor: 'primary.main',
                        color: 'white'
                      }}
                    />
                  )}
                </Typography>
                <ChevronRight
                  sx={{
                    display: { xs: 'block', md: 'none' },
                    color: 'text.secondary',
                    fontSize: 24
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.5 }}
              >
                {description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StaffCard;