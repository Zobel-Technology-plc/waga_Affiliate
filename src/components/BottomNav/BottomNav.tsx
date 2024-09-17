'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useScrollingEffect from '../../hooks/use-scroll';
import './app.css';

const BottomNav: React.FC = () => {
  const [activeLink, setActiveLink] = useState<string>('/');
  const scrollDirection = useScrollingEffect();
  const navClass = scrollDirection === 'up' ? '' : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname; // Get the current path
      setActiveLink(currentPath);
    }
  }, []);

  const handleLinkClick = (path: string) => {
    setActiveLink(path);
  };

  const getIconSize = (path: string) => (activeLink === path ? 50 : 34);

  return (
    <div className={`bottom-nav ${navClass}`}>
      <Link href="/" className={`nav-link ${activeLink === '/' ? 'active' : ''}`} onClick={() => handleLinkClick('/')}>
        <Image src="/assets/icons/home.svg" width={getIconSize('/')} height={getIconSize('/')} alt="Home" />
      </Link>
      <Link href="/earn" className={`nav-link ${activeLink === '/earn' ? 'active' : ''}`} onClick={() => handleLinkClick('/earn')}>
        <Image src="/assets/icons/money.svg" width={getIconSize('/earn')} height={getIconSize('/earn')} alt="Earn" />
      </Link>
      <Link href="/history" className={`nav-link ${activeLink === '/history' ? 'active' : ''}`} onClick={() => handleLinkClick('/history')}>
        <Image src="/assets/icons/history.svg" width={getIconSize('/history')} height={getIconSize('/history')} alt="Purchases" />
      </Link>
      <Link href="/profile" className={`nav-link ${activeLink === '/profile' ? 'active' : ''}`} onClick={() => handleLinkClick('/profile')}>
        <Image src="/assets/icons/profile.svg" width={getIconSize('/profile')} height={getIconSize('/profile')} alt="profile" />
      </Link>
    </div>
  );
};

export default BottomNav;
