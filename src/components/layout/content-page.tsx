import type { ReactNode } from "react";

export function ContentPage({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="w-full">
      <header className="mb-8 sm:mb-10">
        <p className="m-0 mb-3 text-[11px] font-bold tracking-[0.16em] text-brand">
          {label}
        </p>
        <h1 className="m-0  text-[30px] leading-tight font-semibold tracking-tight sm:text-[38px]">
          {title}
        </h1>
        <p className="m-0 mt-4  text-base leading-7 text-secondary">
          {description}
        </p>
      </header>
      <div className="rounded-xl border border-solid border-line bg-white p-6 sm:p-8 lg:p-10">
        <div className=" text-sm leading-7 text-secondary [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_p]:my-3 [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-ink [&_.button]:mt-5 [&_.button]:text-sm">
          {children}
        </div>
      </div>
    </article>
  );
}
