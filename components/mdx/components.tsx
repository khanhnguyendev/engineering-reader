import type { ComponentProps } from 'react';

export function A({ href, children, ...rest }: ComponentProps<'a'>) {
  const external = typeof href === 'string' && /^(https?:)?\/\//i.test(href);
  return (
    <a
      href={href}
      {...rest}
      {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
    >
      {children}
    </a>
  );
}

export function Code({ className, ...rest }: ComponentProps<'code'>) {
  // Highlighted blocks carry data attributes from rehype-pretty-code; leave them alone.
  const block = 'data-language' in rest || 'data-theme' in rest;
  if (block) return <code className={className} {...rest} />;
  return (
    <code
      className={`font-mono text-[0.9em] rounded-sm px-1 py-0.5 ${className ?? ''}`}
      style={{ background: 'var(--hairline)' }}
      {...rest}
    />
  );
}

export function Pre({ className, ...rest }: ComponentProps<'pre'>) {
  return <pre className={`code-block ${className ?? ''}`.trim()} {...rest} />;
}

export function Table(props: ComponentProps<'table'>) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  );
}

export function Ref({ id, locator }: { id: string; locator?: string }) {
  return (
    <a href={`#${id}`} className="ref">
      [{id}
      {locator ? ' ' + locator : ''}]
    </a>
  );
}

export const mdxComponents = { a: A, code: Code, pre: Pre, table: Table, Ref };
