'use client';

import React from 'react';
import Image from 'next/image';
import ContextSwitcher from './ContextSwitcher';
import {
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen = false }) => {

  return (
    <header className={`glass border-b border-border-color sticky top-0 z-40 shadow-sm transition-all duration-300 ${isMenuOpen ? 'lg:backdrop-blur-none backdrop-blur-sm brightness-95' : ''}`}>
      <div className="px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            {/* Healui Logo */}
            <div className="flex items-center">
              <div className="relative h-8 sm:h-10 lg:h-12 w-auto">
                <Image
                  src="/healui-logo/Healui Logo Final-10.png"
                  alt="Healui"
                  width={150}
                  height={48}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Section - Menu & Context Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Context Switcher */}
            <div className="context-switcher">
              <ContextSwitcher />
            </div>
            
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;