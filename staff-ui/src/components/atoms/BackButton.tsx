import React from 'react';
import { IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  sx?: object;
}

const BackButton: React.FC<BackButtonProps> = ({
  to = '/staff',
  sx = { mr: 2 }
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <IconButton sx={sx} onClick={handleClick}>
      <ArrowBackIcon />
    </IconButton>
  );
};

export default BackButton;