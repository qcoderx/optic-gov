import { useState } from 'react';

export const usePasswordToggle = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(!isVisible);

  return {
    isVisible,
    toggle,
    type: isVisible ? 'text' : 'password',
    icon: isVisible ? 'visibility' : 'visibility_off'
  };
};