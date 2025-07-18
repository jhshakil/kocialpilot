"use client";

import { useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Navigation from "./navigation";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">KocialPilot</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <Navigation isCollapsed={isCollapsed} />

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <p className="text-xs text-gray-500">
            AI-Powered Social Media Automation
          </p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
