import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children, align = 'right', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUpward: boolean }>({ top: 0, left: 0, openUpward: false });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;
      const menuWidth = 224; // w-56 = 14rem = 224px

      let left = align === 'right' ? rect.right - menuWidth : rect.left;
      left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));

      setCoords({
        top: openUpward ? rect.top : rect.bottom,
        left,
        openUpward,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => setIsOpen(false);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        // Check if click is inside portal menu
        const target = event.target as HTMLElement;
        if (!target.closest?.('.dropdown-portal-menu')) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="inline-block text-left" ref={triggerRef}>
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: coords.openUpward ? 5 : -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: coords.openUpward ? 5 : -5 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: coords.openUpward ? 'auto' : `${coords.top + 6}px`,
                bottom: coords.openUpward ? `${window.innerHeight - coords.top + 6}px` : 'auto',
                left: `${coords.left}px`,
              }}
              className={cn(
                'dropdown-portal-menu z-[9999] w-56 rounded-md border border-border bg-surface shadow-xl focus:outline-none overflow-hidden',
                className
              )}
            >
              <div className="py-1" role="menu" aria-orientation="vertical" onClick={() => setIsOpen(false)}>
                {children}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export const DropdownMenuItem: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'cursor-pointer px-4 py-2 text-sm text-foreground hover:bg-muted/10 hover:text-primary transition-colors',
        className
      )}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  );
};

export const DropdownMenuDivider: React.FC = () => {
  return <div className="my-1 h-px w-full bg-border" />;
};

export default DropdownMenu;
