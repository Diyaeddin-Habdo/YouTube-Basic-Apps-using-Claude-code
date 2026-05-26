import React from 'react';

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const filledBase = {
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  stroke: 'none',
  'aria-hidden': true,
};

export const PlayIcon = ({ size = 14 }) => (
  <svg width={size} height={size} {...filledBase}>
    <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l10.79-6.86a1 1 0 0 0 0-1.68L9.54 4.3c-.67-.43-1.54.05-1.54.84z" />
  </svg>
);

export const PauseIcon = ({ size = 14 }) => (
  <svg width={size} height={size} {...filledBase}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

export const PrevIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...filledBase}>
    <path d="M6 5a1 1 0 0 1 2 0v14a1 1 0 0 1-2 0z" />
    <path d="M19.5 5.13v13.74c0 .8-.91 1.27-1.57.81l-9.86-6.87a1 1 0 0 1 0-1.62l9.86-6.87c.66-.46 1.57.01 1.57.81z" />
  </svg>
);

export const NextIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...filledBase}>
    <path d="M16 5a1 1 0 0 1 2 0v14a1 1 0 0 1-2 0z" />
    <path d="M4.5 5.13v13.74c0 .8.91 1.27 1.57.81l9.86-6.87a1 1 0 0 0 0-1.62L6.07 4.32c-.66-.46-1.57.01-1.57.81z" />
  </svg>
);

export const ShuffleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

export const RepeatIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

export const RepeatOneIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    <text
      x="12"
      y="15.5"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
      style={{ fontFamily: 'inherit' }}
    >
      1
    </text>
  </svg>
);

export const VolumeHighIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const VolumeMidIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const VolumeLowIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
  </svg>
);

export const VolumeMuteIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
);

export const SearchIcon = ({ size = 14 }) => (
  <svg width={size} height={size} {...baseProps}>
    <circle cx="11" cy="11" r="7" />
    <line x1="20.5" y1="20.5" x2="16.65" y2="16.65" />
  </svg>
);

export const MusicNoteIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...baseProps}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="16" r="3" fill="currentColor" stroke="none" />
  </svg>
);

export const DiscIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseProps}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

export const HeartIcon = ({ size = 14, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const PlusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} {...baseProps}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const FolderPlusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} {...baseProps}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

export const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} {...baseProps}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const XIcon = ({ size = 12 }) => (
  <svg width={size} height={size} {...baseProps}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const WindowMinIcon = ({ size = 12 }) => (
  <svg width={size} height={size} {...baseProps}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const WindowMaxIcon = ({ size = 12 }) => (
  <svg width={size} height={size} {...baseProps}>
    <rect x="5" y="5" width="14" height="14" rx="1" />
  </svg>
);

export function VolumeIconFor({ volume, muted, size = 16 }) {
  if (muted || volume === 0) return <VolumeMuteIcon size={size} />;
  if (volume < 0.34) return <VolumeLowIcon size={size} />;
  if (volume < 0.67) return <VolumeMidIcon size={size} />;
  return <VolumeHighIcon size={size} />;
}
