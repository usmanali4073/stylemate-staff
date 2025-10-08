// Theme utilities for micro-frontend integration with portal shell

// Container types from portal shell
export type ContainerType = 'boxed' | 'full';

/**
 * Get container styles based on container type
 * This should eventually read from portal shell theme context
 */
export const getContainerStyles = (containerType: ContainerType = 'full') => {
  if (containerType === 'boxed') {
    return {
      maxWidth: 'lg',
      mx: 'auto',
      px: { xs: 2, sm: 3, md: 4 }
    };
  }

  return {
    px: { xs: 2, sm: 3, md: 4 },
    width: '100%'
  };
};

/**
 * Get consistent card styles
 */
export const getCardStyles = () => ({
  borderRadius: 2,
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)'
  }
});

/**
 * Get mobile-optimized spacing
 */
export const getMobileSpacing = () => ({
  xs: 1,
  sm: 2,
  md: 3
});

/**
 * Get responsive grid spacing
 */
export const getGridSpacing = () => ({
  xs: 2,
  sm: 2,
  md: 3
});

/**
 * Get scrollbar-free container styles
 */
export const getScrollableContainerStyles = () => ({
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(0,0,0,0.3)',
  },
});

/**
 * Common mobile breakpoints
 */
export const MOBILE_BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
} as const;