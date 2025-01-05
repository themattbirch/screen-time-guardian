// src/components/IconMapper.tsx

import React from 'react';
import {
  Trophy,
  Star,
  Badge,
  Sun,
  Moon,
  X as XIcon, // Renamed to avoid confusion with the generic 'X' import
  Settings as SettingsIcon,
  // Import additional icons as needed
} from 'lucide-react';

interface IconMapperProps {
  iconName: string;
  className?: string;
}

export const IconMapper: React.FC<IconMapperProps> = ({ iconName, className }) => {
  const icons: { [key: string]: React.ReactNode } = {
    trophy: <Trophy className={className} />,
    star: <Star className={className} />,
    badge: <Badge className={className} />,
    sun: <Sun className={className} />,
    moon: <Moon className={className} />,
    x: <XIcon className={className} />,
    settings: <SettingsIcon className={className} />,
    // Add more mappings as needed
  };

  return <>{icons[iconName.toLowerCase()] || <Trophy className={className} />}</>;
};
