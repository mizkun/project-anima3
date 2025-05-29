import React from 'react';
import { motion } from 'framer-motion';

interface NeumorphismButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}

export const NeumorphismButton: React.FC<NeumorphismButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  title,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'neo-button-primary';
      case 'danger':
        return 'neo-button text-red-600';
      default:
        return 'neo-button';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  const baseClasses = `${getVariantClasses()} ${getSizeClasses()} font-medium rounded-xl transition-all duration-200 ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  } ${className}`;

  return (
    <motion.button
      className={baseClasses}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}; 