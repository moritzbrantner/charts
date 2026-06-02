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
    <nav className="flex flex-wrap gap-2" aria-label="Examples navigation">
      {links.map((link) => {
        const active = page === link.id;

        return (
          <a
            key={link.id}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
