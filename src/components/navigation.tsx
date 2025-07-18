"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, PenTool, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Create Post",
    href: "/create-post",
    icon: PenTool,
  },
  {
    name: "Schedule Overview",
    href: "/schedule",
    icon: Calendar,
  },
  {
    name: "Social Media",
    href: "/social-media",
    icon: Share2,
  },
];

type Props = {
  isCollapsed: boolean;
};

const Navigation = ({ isCollapsed }: Props) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4">
      <ul className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors gap-3",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span
                  className={cn(
                    "inline-block transition-all duration-300 h-[20px]",
                    isCollapsed
                      ? "opacity-0 w-0 overflow-hidden"
                      : "opacity-100 w-auto ml-2"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
