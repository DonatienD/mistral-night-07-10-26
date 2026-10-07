import { ReactNode } from 'react';

export type IconName = 
  | 'grid'
  | 'spark'
  | 'building'
  | 'file'
  | 'bell'
  | 'chevron'
  | 'arrow-up'
  | 'arrow-down'
  | 'users'
  | 'coins'
  | 'percent'
  | 'plus'
  | 'check'
  | 'alert'
  | 'menu'
  | 'close'
  | 'trash';

export function Icon({ 
  name, 
  size = 20 
}: { 
  name: IconName; 
  size?: number 
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    spark: <><path d="M12 3l1.1 3.4A6.5 6.5 0 0017.6 11L21 12l-3.4 1.1a6.5 6.5 0 00-4.5 4.5L12 21l-1.1-3.4a6.5 6.5 0 00-4.5-4.5L3 12l3.4-1.1a6.5 6.5 0 004.5-4.5L12 3z" /></>,
    building: <><path d="M4 21V5a2 2 0 012-2h9a2 2 0 012 2v16" /><path d="M17 9h2a1 1 0 011 1v11M8 7h1M12 7h1M8 11h1M12 11h1M8 15h1M12 15h1M2 21h20" /></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    bell: <><path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chevron: <path d="M9 18l6-6-6-6" />,
    'arrow-up': <><path d="M12 19V5M6 11l6-6 6 6" /></>,
    'arrow-down': <><path d="M12 5v14M18 13l-6 6-6-6" /></>,
    users: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
    coins: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    percent: <><path d="M19 5L5 19M7 5h.01M17 19h.01" /><circle cx="7" cy="5" r="2" /><circle cx="17" cy="19" r="2" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <path d="M20 6L9 17l-5-5" />,
    alert: <><path d="M10.3 3.7L2.2 18a2 2 0 001.8 3h16a2 2 0 001.8-3L13.7 3.7a2 2 0 00-3.4 0zM12 9v4M12 17h.01" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="M18 6L6 18M6 6l12 12" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
