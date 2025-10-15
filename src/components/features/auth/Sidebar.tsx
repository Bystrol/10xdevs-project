import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";

const LINKS = [
  {
    label: "Home",
    href: "/",
    dataTestId: "home-link",
  },
  {
    label: "Imports",
    href: "/imports",
    dataTestId: "imports-link",
  },
];

interface SidebarProps {
  email: string;
}

export default function Sidebar({ email }: SidebarProps) {
  const isLinkActive = (href: string) => {
    return window.location.pathname === href;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between">
      <div className="flex flex-col gap-12">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">WasteTrack Dashboard</h1>

        <div className="flex flex-col gap-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-testid={link.dataTestId}
              className={cn(isLinkActive(link.href) && "text-primary bg-primary/25 rounded-md", "p-2")}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <UserMenu email={email} />
    </div>
  );
}
