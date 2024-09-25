/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CusstomPagination from '../../../components/layouts/CusstomPagination';

const CategoryPage = ({ params }) => {
  const [subcategories, setSubcategories] = useState([]);
  const [totalSubcategories, setTotalSubcategories] = useState(0);
  const [resPerPage, setResPerPage] = useState(6); // Example: Showing 6 items per page

  const router = useRouter();
  const searchParams = useSearchParams();
  let page = searchParams.get('page') || 1;
  page = Number(page);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await fetch(`/api/subcategories?category=${params.category}&page=${page}&limit=${resPerPage}`);
        const data = await res.json();

        if (data.success) {
          setSubcategories(data.subcategories);
          setTotalSubcategories(data.totalSubcategories); // Total number of subcategories
        } else {
          console.error('Failed to fetch subcategories:', data.message);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };

    fetchSubcategories();
  }, [params.category, page]);

  return (
    <>
      <nav className="bg-gray-800 p-4 mt-2">
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="text-white hover:text-gray-300 m-5">
              Products
            </Link>
          </li>
          <li>
            <Link href="/categories" className="text-white hover:text-gray-300 m-5">
              Categories
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-white hover:text-gray-300 ml-9">
              Services
            </Link>
          </li>
        </ul>
      </nav>

      {/* Back Button */}
      <div className="p-4 flex">
        <Image
          src="/assets/icons/back.png"
          alt="Back to Categories"
          width={30}
          height={30}
          className="hover:opacity-80 cursor-pointer mr-10"
          onClick={() => router.back()}
        />
        <h1 className="text-2xl font-bold ml-14 text-center">{params.category}</h1>
      </div>

      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory._id}
              className="subcategory-card cursor-pointer bg-white shadow-md p-4 rounded-lg transform transition-transform duration-200 hover:scale-105"
              onClick={() => router.push(`/category/${params.category}/${subcategory.name}`)}
            >
              <div className="flex justify-center items-center">
                <Image
                  src={subcategory.image.url || '/images/default_product.png'}
                  alt={subcategory.name}
                  height={240}
                  width={240}
                  className="object-contain"
                />
              </div>
              <h2 className="text-center mt-2 text-lg font-semibold">{subcategory.name}</h2>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <CusstomPagination
          resPerPage={3}
          productsCount={totalSubcategories}
          dynamicPath={`/category/${params.category}`}
          className="mt-10"
        />
      </div>
    </>
  );
};

export default CategoryPage;
