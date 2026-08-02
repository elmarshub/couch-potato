import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, Clapperboard, Tv } from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

export const navLinks: NavLink[] = [
  { name: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
  {
    name: "Movies",
    href: "/movies",
    icon: <Clapperboard className="w-4 h-4" />,
  },
  { name: "Shows", href: "/tvshows", icon: <Tv className="w-4 h-4" /> },
];

interface NavbarLinksProps {
  pathname: string;
}

const NavbarLinks = ({ pathname }: NavbarLinksProps) => {
  return (
    <ul className="hidden md:flex items-center gap-6 lg:gap-8">
      {navLinks.map((link) => (
        <li key={link.name}>
          <Link
            href={link.href}
            className={cn(
              "relative flex items-center gap-2 text-sm lg:text-base font-medium transition-colors group py-2",
              pathname === link.href
                ? "text-white"
                : "text-gray-300 hover:text-white"
            )}
          >
            {link.icon}
            {link.name}
            {pathname === link.href && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            )}
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/50 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default NavbarLinks;
