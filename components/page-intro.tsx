import type { ReactNode } from "react";

/** Title and one-line dek at the top of a list page; no eyebrow, no brand colour. `children` sit under the dek. */
export function PageIntro({ title, dek, children }: { title: string; dek?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 lg:mb-10">
      <h1 className="mb-3 text-[25px] leading-[1.25] text-balance text-ink lg:mb-4 lg:text-[40px] lg:leading-[1.18]">
        {title}
      </h1>
      {dek && <p className="text-[16px] leading-[1.6] text-ink-2 lg:text-[19px]">{dek}</p>}
      {children}
    </header>
  );
}
