import type { ComponentPropsWithoutRef } from "react";

/** One width and responsive gutter for the header, every page, and footer. */
export function Container({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`mx-auto w-full max-w-[1420px] px-6 sm:px-7 xl:px-12 print:max-w-none print:px-0 ${className}`}
      {...props}
    />
  );
}
