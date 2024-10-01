import React from 'react';
import Link from 'next/link';
import Categories from './categories/page'

import Search from '../components/layouts/Search';



const HomePage = async () => {
  return (
    <>
    <Search />
      {/* Navigation Bar */}
      <nav className="bg-gray-800 p-4 mt-2">
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="text-white hover:text-gray-300 m-5 ">
            Categories
            </Link>
          </li>
          <li>
            <Link href="/product" className="text-white hover:text-gray-300 m-5 ">
              Products
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-white hover:text-gray-300 ml-9">
              Services
            </Link>
          </li>
        </ul>
      </nav>

      {/* Product List */}
      <Categories />
    </>
  );
};

export default HomePage;
