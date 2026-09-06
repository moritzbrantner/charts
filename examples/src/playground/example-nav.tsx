import { chartPageLinks } from "./controls";

import type { ExamplePage } from "./model";

export function ExampleNav({ page }: { page: ExamplePage }) {
  const links: Array<{ href: string; id: ExamplePage; label: string }> = [
    { href: "./", id: "examples", label: "Examples" },
    { href: "./compose.html", id: "compose", label: "Compose" },
    ...chartPageLinks.map((link) => ({
      href: `./${link.path}`,
      id: link.id,
      label: link.label,
    })),
  ];

  return (
    <nav aria-label="Examples navigation" className="example-nav">
      {links.map((link) => {
        const active = page === link.id;

        return (
          <a
            aria-current={active ? "page" : undefined}
            className={`example-nav__link${active ? " example-nav__link--active" : ""}`}
            href={link.href}
            key={link.id}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
