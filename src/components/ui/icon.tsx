import React from 'react';
import { View } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const IconWrapper = ({ children, className }: IconWrapperProps) => {
  return (
    <StyledView className={className}>
      {children}
    </StyledView>
  );
};
