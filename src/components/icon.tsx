import type { CSSProperties } from "react";
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  const paths: Record<string, React.ReactNode> = {
    box: (
      <>
        <path d="m3 7 9-5 9 5-9 5-9-5Zm0 0v10l9 5 9-5V7M12 12v10M7.5 4.5l9 5" />
      </>
    ),
    layers: (
      <>
        <path d="m2 7 10-5 10 5-10 5L2 7Zm0 5 10 5 10-5M2 17l10 5 10-5" />
      </>
    ),
    print: (
      <>
        <path d="M6 9V3h12v6M6 18H3v-8h18v8h-3M6 14h12v7H6zM17 11h1" />
      </>
    ),
    save: (
      <>
        <path d="M4 3h14l3 3v15H3V3h1Zm3 0v6h10V3M7 21v-8h10v8" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    reset: (
      <>
        <path d="M3 10a9 9 0 1 1 2 8M3 3v7h7" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
    weight: (
      <>
        <path d="M5 7h14l3 14H2L5 7Z" />
        <circle cx="12" cy="5" r="3" />
      </>
    ),
    ruler: (
      <>
        <path d="M3 3h18v18H3zM7 3v5m5-5v3m5-3v5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name] ?? paths.box}
    </svg>
  );
}
