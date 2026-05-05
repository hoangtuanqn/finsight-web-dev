'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  appName?: string;
}

export const Button = ({ children, className, appName, type = 'button', ...props }: ButtonProps) => {
  return (
    <button type={type} className={className} {...props}>
      {children}
    </button>
  );
};
