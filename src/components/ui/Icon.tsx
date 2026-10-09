import React from 'react';

/**
 * One consistent icon family for the whole app: 24px grid, 1.6 stroke,
 * round caps/joins, currentColor. Replaces the mix of emoji and unicode glyphs.
 */
const PATHS = {
  meditate: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.2l.9 2.9 2.9.9-2.9.9-.9 2.9-.9-2.9-2.9-.9 2.9-.9z" fill="currentColor" stroke="none" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <rect x="5.5" y="11" width="3" height="6" rx="1" />
      <rect x="10.5" y="6" width="3" height="11" rx="1" />
      <rect x="15.5" y="13" width="3" height="4" rx="1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
  sunrise: (
    <>
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M3 20h18M12 2.5V8M9.5 5L12 2.5 14.5 5M4.2 11.2l1.4 1.4M19.8 11.2l-1.4 1.4" />
    </>
  ),
  sunset: (
    <>
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M3 20h18M12 2.5V8M9.5 5.5L12 8l2.5-2.5M4.2 11.2l1.4 1.4M19.8 11.2l-1.4 1.4" />
    </>
  ),
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  sparkle: <path d="M12 3.5l1.8 5.6a2 2 0 0 0 1.1 1.1L20.5 12l-5.6 1.8a2 2 0 0 0-1.1 1.1L12 20.5l-1.8-5.6a2 2 0 0 0-1.1-1.1L3.5 12l5.6-1.8a2 2 0 0 0 1.1-1.1z" />,
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" />
      <path d="M5 19l7-7" />
    </>
  ),
  wave: (
    <>
      <path d="M3 9c2.5-3 5.5-3 8 0s5.5 3 8 0" />
      <path d="M3 15c2.5-3 5.5-3 8 0s5.5 3 8 0" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  bellOff: (
    <>
      <path d="M8.5 5.6A6 6 0 0 1 18 11v4M6 11v5l-1.5 2H17" />
      <path d="M10 20.5a2 2 0 0 0 4 0M3 3l18 18" />
    </>
  ),
  play: <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z" />,
  pause: (
    <>
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  trash: (
    <>
      <path d="M4 7h16M10 3.5h4M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  flame: <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.5-5.4 3.7-8.3.3 1.9 1.3 3 2.4 3.6.3-2.9 1.6-5.3 3.6-7.1-.2 3.1 1 5 2.3 6.8 1 1.4 1.5 3 1.5 4.9 0 3.7-3 6.3-7 6.3z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.5M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.5-1.3" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  volume: (
    <>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 14.8A5 5 0 0 1 9.2 8.5a5 5 0 1 0 6.3 6.3z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  devices: (
    <>
      <rect x="2.5" y="5" width="13" height="9.5" rx="1.5" />
      <path d="M1.5 18h11" />
      <rect x="16" y="9" width="6" height="11" rx="1.5" />
      <path d="M18.5 17.5h1" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  cloud: <path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 10a4.3 4.3 0 0 1-.5 8.5z" />,
  cloudOff: (
    <>
      <path d="M3 3l18 18M8.3 7.4A6 6 0 0 1 18 10a4.3 4.3 0 0 1 2.4 7.4M16 18.5H7a4.5 4.5 0 0 1-1.5-8.7" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11.5A8 8 0 0 0 5.6 7M4 12.5A8 8 0 0 0 18.4 17" />
      <path d="M5 3.5V7.5h4M19 20.5v-4h-4" />
    </>
  ),
  logOut: (
    <>
      <path d="M14 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.7v.1" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7 10.5l5 5 5-5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  edit: <path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z" />,
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.5M9.5 2.5h5" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

export type IconName = keyof typeof PATHS;

interface Props extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

const Icon: React.FC<Props> = ({ name, size = 22, strokeWidth = 1.6, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {PATHS[name]}
  </svg>
);

export default Icon;
