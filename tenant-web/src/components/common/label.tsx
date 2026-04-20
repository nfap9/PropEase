import type { FC, ReactNode } from 'react';

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export const Label: FC<LabelProps> = ({ children, htmlFor, required, className }) => (
  <label htmlFor={htmlFor} className={className}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);
