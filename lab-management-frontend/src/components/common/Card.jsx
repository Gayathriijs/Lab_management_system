import React from 'react';

const Card = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`card ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;