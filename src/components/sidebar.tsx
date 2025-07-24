"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PenTool, Calendar, Share2, Menu, X, Bot } from "lucide-react";

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

const Sidebar = () => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Header */}
      <div className={cn("border-b border-gray-200", mobile ? "p-4" : "p-4")}>
        <div className="flex items-center justify-between">
          {(!isDesktopCollapsed || mobile) && (
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-xl font-bold text-gray-900">KocialPilot</h1>
            </div>
          )}
          {!mobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isDesktopCollapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1", mobile ? "p-4" : "p-4")}>
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-gray-100 hover:text-gray-900",
                    isActive ? "bg-blue-100 text-blue-700" : "text-gray-600",
                    mobile ? "w-full" : ""
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!isDesktopCollapsed || mobile) && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-gray-200", mobile ? "p-4" : "p-4")}>
        {(!isDesktopCollapsed || mobile) && (
          <p className="text-xs text-gray-500 text-center">
            AI-Powered Social Media Automation
          </p>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">KocialPilot</h1>
          </div>

          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="hidden">
                <SheetTitle></SheetTitle>
                <SheetDescription></SheetDescription>
              </SheetHeader>
              <div className="flex flex-col h-full bg-white">
                <NavContent mobile={true} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex">
        <div
          className={cn(
            "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-screen",
            isDesktopCollapsed ? "w-16" : "w-64"
          )}
        >
          <NavContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
