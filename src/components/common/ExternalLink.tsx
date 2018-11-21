import React from 'react';

export default function ExternalLink({ href, children, ...props }: any) {
  return (
    <a target="_blank" rel="noopener noreferrer" href={href} {...props}>
      {children}
    </a>
  );
}
