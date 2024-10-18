'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { FaSearch, FaSun, FaMoon, FaBell } from 'react-icons/fa';

const AdminHeader = () => {
  const { data: session, status } = useSession();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (session) {
      console.log('Session data:', session);
    }
  }, [session]);

  if (status === 'loading') return <div>Loading...</div>;

  const handleDropdownToggle = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <header className="flex justify-between items-center px-6 py-3 bg-white shadow-md relative">
      <div className="flex items-center">
        <Image src="/images/Waga.png" alt="Logo" width={40} height={40} className="mr-2" />
        <h1 className="text-2xl font-bold ml-3">Waga Admin</h1>
      </div>
      <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
        <FaSearch className="text-gray-500 mr-2" />
        <input type="text" placeholder="Search" className="bg-transparent outline-none" />
      </div>
      <div className="flex items-center space-x-4">
        <FaSun className="text-gray-500 cursor-pointer" />
        <FaMoon className="text-gray-500 cursor-pointer" />
        <FaBell className="text-gray-500 cursor-pointer" />
        {session && session.user && (
          <div className="relative">
            {/* User Avatar and Name */}
            <div className="flex items-center cursor-pointer" onClick={handleDropdownToggle}>
              <Image
                src={session.user.image || '/images/default_avatar.png'}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-gray-700 ml-2">{session.user.username}</span>
            </div>

            {/* Dropdown Menu */}
            {dropdownVisible && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => console.log('Navigate to Settings')}
                >
                  Settings
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => signOut()}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
