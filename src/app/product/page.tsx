'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import ListProducts from '../../components/products/ListProducts';
import Search from '../../components/layouts/Search';

const fetchOnSaleProducts = async (page: number) => {
  const url = `/api/products?onSale=true&page=${page}`;
  console.log('Fetching URL:', url); // Log the URL
  const { data } = await axios.get(url);
  return data;
};

const ProductsPage = () => {
  const [productsData, setProductsData] = useState({});
  const [loading, setLoading] = useState(true); // Loading state
  const [page, setPage] = useState(1); // Pagination state
  const [error, setError] = useState(null); // Error state

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);
        const products = await fetchOnSaleProducts(page);
        setProductsData(products);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setLoading(false);
      }
    };
    getProducts();
  }, [page]); // Fetch products on page change

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1); // Next page
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prevPage) => prevPage - 1); // Previous page
    }
  };

  return (
    <>
      <Search />
      {/* Navigation Bar */}
      <nav className="bg-gray-800 p-4 mt-2">
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="text-white hover:text-gray-300 m-5">
              Categories
            </Link>
          </li>
          <li>
            <Link href="/product" className="text-white hover:text-gray-300 m-5">
              On Sale
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-white hover:text-gray-300 ml-9">
              Services
            </Link>
          </li>
        </ul>
      </nav>

      {/* Show loading, error, or product list */}
      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          <ListProducts data={productsData} />

          {/* Pagination controls */}
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={handlePreviousPage}
              className={`px-4 py-2 rounded ${
                page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'
              }`}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              className="px-4 py-2 rounded bg-blue-500 text-white"
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default ProductsPage;
