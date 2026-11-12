/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Auto Device Detection & Cross-Platform Responsive Engine
 * Automatically detects device class (Mobile Phone, Tablet, Workshop Touchbook, Desktop),
 * screen orientation, touch capabilities, and viewports.
 */

import { useState, useEffect } from 'react';

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop';

export interface DeviceState {
  category: DeviceCategory;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
  recommendedBytesPerRow: 8 | 16;
}

export function getDeviceInfo(): DeviceState {
  if (typeof window === 'undefined') {
    return {
      category: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
      orientation: 'landscape',
      width: 1440,
      height: 900,
      recommendedBytesPerRow: 16,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const orientation = width >= height ? 'landscape' : 'portrait';

  let category: DeviceCategory = 'desktop';
  if (width < 640) {
    category = 'mobile';
  } else if (width < 1024) {
    category = 'tablet';
  } else {
    category = 'desktop';
  }

  // On narrow mobile screens, 8 bytes per row fits naturally without overflowing
  const recommendedBytesPerRow: 8 | 16 = width < 640 ? 8 : 16;

  return {
    category,
    isMobile: category === 'mobile',
    isTablet: category === 'tablet',
    isDesktop: category === 'desktop',
    isTouch,
    orientation,
    width,
    height,
    recommendedBytesPerRow,
  };
}

export function useDeviceDetection(): DeviceState {
  const [device, setDevice] = useState<DeviceState>(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setDevice(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return device;
}
