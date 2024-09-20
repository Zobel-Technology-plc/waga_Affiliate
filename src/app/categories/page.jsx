'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Filters from "../../components/layouts/Filters";
import CusstomPagination from '../../components/layouts/CusstomPagination'; // Import the custom pagination component

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0); // Store total count of categories
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get all search params (e.g., page, category, min price, max price, ratings)
  const currentPage = Number(searchParams.get('page')) || 1;
  const selectedCategory = searchParams.get('category') || ''; // Get selected category from URL
  const minPrice = searchParams.get('min') || '';
  const maxPrice = searchParams.get('max') || '';
  const ratings = searchParams.get('ratings') || '';

  const categoriesPerPage = 9; // Define how many categories to show per page

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const query = new URLSearchParams({
          page: currentPage,
          limit: categoriesPerPage,
          category: selectedCategory,
          minPrice,
          maxPrice,
          ratings,
        });

        const res = await fetch(`/api/categories?${query.toString()}`);
        const data = await res.json();

        if (data.success) {
          setCategories(data.categories);
          setTotalCategoriesCount(data.totalCategoriesCount); // Assuming the API response includes total categories count
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [currentPage, selectedCategory, minPrice, maxPrice, ratings]); // Fetch categories whenever filters change

  return (
    <>
      <nav className="bg-gray-800 p-4 mt-2">
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="text-white hover:text-gray-300 m-5 ">
              Products
            </Link>
          </li>
          <li>
            <Link href="/categories" className="text-white hover:text-gray-300 m-5 ">
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
      <Filters />
      <h1 className="text-2xl font-bold m-7 text-center">Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 mb-10">
        {categories.map((category) => (
          <div
            key={category._id}
            className="category-card cursor-pointer bg-white shadow-md p-4 rounded-lg transform transition-transform duration-200 hover:scale-105"
            onClick={() => router.push(`/category/${category.name}`)}
          >
            <div className="flex justify-center items-center">
              <Image
                src={category.image.url || '/images/default_product.png'}
                alt={category.name}
                height={240}
                width={240}
                className="object-contain"
              />
            </div>
            <h2 className="text-center mt-2 text-lg font-semibold">{category.name}</h2>
          </div>
        ))}
      </div>

      {/* Add a div to give more space at the bottom */}
      <div className="pb-32"> {/* Add padding here to prevent bottom nav overlap */}
        <CusstomPagination
          resPerPage={categoriesPerPage}
          productsCount={totalCategoriesCount} // Use the total count of categories for pagination
          dynamicPath="/categories" // Ensure this points to the categories page
        />
      </div>
    </>
  );
};

export default CategoriesPage;
