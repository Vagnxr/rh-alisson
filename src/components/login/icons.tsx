import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ children, size = 18, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconMail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

export const IconLock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const IconEye = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const IconEyeOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 3 21 21" />
    <path d="M10.6 6.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.1" />
    <path d="M6.1 6.1A18 18 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 5.4-1.5" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="m20 6-11 11-5-5" />
  </Icon>
);

export const IconAlert = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icon>
);

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </Icon>
);

export const IconSun = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Icon>
);

export const IconMoon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Icon>
);

export const IconShield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const IconHelp = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
  </Icon>
);

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC04"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.1V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function MSystemMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="143 154 207 134" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <g fill="currentColor">
        <path d="M303.32,279.97h0c-9.03,0-16.35-7.32-16.35-16.35v-83.97c0-9.03,7.32-16.35,16.35-16.35h0c9.03,0,16.35,7.32,16.35,16.35v83.97c0,9.03-7.32,16.35-16.35,16.35Z" />
        <rect x="216.46" y="163.29" width="32.71" height="116.68" rx="8.64" ry="8.64" />
        <path
          opacity="0.55"
          d="M319.67,213.58l-31.4,37.42c-.48.57-.91,1.16-1.31,1.77v10.85c0,9.03,7.32,16.35,16.35,16.35s16.35-7.32,16.35-16.35v-50.03Z"
        />
        <path
          opacity="0.55"
          d="M249.17,213.58l-31.4,37.42c-.48.57-.91,1.16-1.31,1.77v10.85c0,9.03,7.32,16.35,16.35,16.35s16.35-7.32,16.35-16.35v-50.03Z"
        />
        <path
          opacity="0.85"
          d="M292.81,276.15h0c-6.92-5.81-7.82-16.12-2.02-23.04l34.34-40.92c5.81-6.92,16.12-7.82,23.04-2.02h0c6.92,5.81,7.82,16.12,2.02,23.04l-34.34,40.92c-5.81,6.92-16.12,7.82-23.04,2.02Z"
        />
        <path d="M222.34,276.15h0c-6.92-5.81-7.82-16.12-2.02-23.04l70.47-83.98c5.81-6.92,16.12-7.82,23.04-2.02h0c6.92,5.81,7.82,16.12,2.02,23.04l-70.47,83.98c-5.81,6.92-16.12,7.82-23.04,2.02Z" />
        <path d="M151.83,276.15h0c-6.92-5.81-7.82-16.12-2.02-23.04l70.47-83.98c5.81-6.92,16.12-7.82,23.04-2.02h0c6.92,5.81,7.82,16.12,2.02,23.04l-70.47,83.98c-5.81,6.92-16.12,7.82-23.04,2.02Z" />
      </g>
    </svg>
  );
}
