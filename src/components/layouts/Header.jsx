/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WebApp from '@twa-dev/sdk';

const Header = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      setUserData(WebApp.initDataUnsafe.user);
    }
  }, []);

  return (
    <header className="bg-white py-2 border-b">
      <div className="container max-w-screen-xl mx-auto px-4">
        <div className="flex flex-wrap items-center">
          <div className="flex-shrink-0 mr-5">
            <a href="/">
              <Image
                src="https://res.cloudinary.com/dp7u7sr3a/image/upload/v1727934466/WagaLogo_lobzcv.png"
                height="0"
                width="60"
                alt="BuyItNow"
              />
            </a>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
          <Link
  href="/cart"
  className="px-2 py-1 inline-block text-center text-gray-700 bg-white shadow-sm border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300"
>
  {/* External image wrapped in an anchor tag */}
    <img
      src="/images/Cart.png"
      alt="Shopping Cart"
      width="40" // Adjust the width as needed
      height="40" // Adjust the height as needed
      className="inline-block"
    />
</Link>
            
            {userData ? (
              <Link href="/profile">
                <div className="flex items-center mb-4 space-x-3 mt-4 cursor-pointer">
                  <img
                    className="w-10 h-10 rounded-full"
                    src={userData.photo_url || "/images/default_avatar.png"} // Use Telegram profile picture
                  />
                  <div className="space-y-1 font-medium">
                    <p>{userData.first_name}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div>Loading...</div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
