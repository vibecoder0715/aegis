import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  inverted?: boolean;
}

/**
 * Clean vector recreation of user's attached Aegis "A" emblem (dark navy #07152E, crisp geometry, zero checkerboard).
 */
export const AegisEmblemSvg: React.FC<LogoProps> = ({
  className = '',
  size = 36,
  inverted = false,
}) => {
  const fill = inverted ? '#FFFFFF' : '#07152E';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Aegis emblem"
    >
      <path
        d="M49 9C47.5 9 46 10.2 44.8 12.6L8 88C7.1 89.8 8.7 91.5 10.6 90.4C26.5 81 42.5 76.5 60 76.5C77.5 76.5 93.5 81 109.4 90.4C111.3 91.5 112.9 89.8 112 88L75.2 12.6C74 10.2 72.5 9 71 9H49ZM60 29L80.5 68.5C74 66.8 67.2 66 60 66C52.8 66 46 66.8 39.5 68.5L60 29Z"
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M17.5 84.5C31 74.5 45.2 69.5 60 69.5C74.8 69.5 89 74.5 102.5 84.5C88.5 78.2 74.2 75 60 75C45.8 75 31.5 78.2 17.5 84.5Z"
        fill={fill}
      />
    </svg>
  );
};

/**
 * Clean vector recreation of the full "Aegis" wordmark combining the custom "A" emblem + crisp geometric "egis".
 */
export const AegisWordmarkSvg: React.FC<{ height?: number; inverted?: boolean; className?: string }> = ({
  height = 36,
  inverted = false,
  className = '',
}) => {
  const fill = inverted ? '#FFFFFF' : '#07152E';
  const width = Math.round(height * 2.68);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 290 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Aegis"
    >
      {/* Custom curved-bridge "A" mark */}
      <g transform="translate(4, 6)">
        <path
          d="M44 8C42.6 8 41.2 9 40 11.4L6 82C5.2 83.7 6.7 85.2 8.4 84.2C23.5 75.5 38.5 71.2 55 71.2C71.5 71.2 86.5 75.5 101.6 84.2C103.3 85.2 104.8 83.7 104 82L70 11.4C68.8 9 67.4 8 66 8H44ZM55 27.5L74 63.8C68 62.3 61.6 61.6 55 61.6C48.4 61.6 42 62.3 36 63.8L55 27.5Z"
          fill={fill}
          fillRule="evenodd"
          clipRule="evenodd"
        />
        <path
          d="M15.5 78.8C28.2 69.5 41.4 64.9 55 64.9C68.6 64.9 81.8 69.5 94.5 78.8C81.2 73 68 70.1 55 70.1C42 70.1 28.8 73 15.5 78.8Z"
          fill={fill}
        />
      </g>

      {/* Bold geometric "egis" matching reference weight & x-height */}
      <text
        x="114"
        y="83"
        fill={fill}
        fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
        fontWeight="800"
        fontSize="82"
        letterSpacing="-3.5"
      >
        egis
      </text>
    </svg>
  );
};
