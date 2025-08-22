'use client';

import React, { useState } from 'react';
import ContextSwitcher from './ContextSwitcher';
import {
  ChevronDown,
  Menu,
  X,
  Heart
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen = false }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);

  return (
    <header className="glass border-b border-border-color sticky top-0 z-40 shadow-sm">
      <div className="px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={onMenuToggle}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-healui-physio/10 transition-all duration-200 lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-text-gray" />
              ) : (
                <Menu className="h-5 w-5 text-text-gray" />
              )}
            </button>

            {/* Healui.ai Brand - Mobile First Design */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Icon Logo */}
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-gradient-physio rounded-lg shadow-sm">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              
              {/* Text Logo - Responsive */}
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-display font-bold bg-gradient-physio bg-clip-text text-transparent tracking-tight leading-none">
                  Healui.ai
                </h1>
                {/* Optional tagline for larger screens */}
                <span className="hidden lg:block text-xs text-text-light font-medium">
                  Physiotherapy Management
                </span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center">
            {/* Context Switcher - Always visible on desktop, mobile dropdown on mobile */}
            <div className="hidden sm:block">
              <ContextSwitcher />
            </div>
            
            {/* Mobile Context Switcher Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="p-2 rounded-lg hover:bg-healui-physio/10 transition-all duration-200"
              >
                <ChevronDown className="h-4 w-4 text-text-light" />
              </button>
              
              {/* Mobile Context Switcher Dropdown */}
              {showContextMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 glass rounded-xl shadow-2xl border border-border-color z-50">
                  <div className="p-3">
                    <ContextSwitcher />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;