'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Filters from "../../components/layouts/Filters";
import CusstomPagination from '../../components/layouts/CusstomPagination'; 

const Categories = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
  const [loading, setLoading] = useState(true);  // Manage loading state

  const currentPage = Number(searchParams.get('page')) || 1;
  const selectedCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('min') || '';
  const maxPrice = searchParams.get('max') || '';
  const ratings = searchParams.get('ratings') || '';

  const categoriesPerPage = 9;

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);  // Start loading when fetching begins
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
          setTotalCategoriesCount(data.totalCategoriesCount);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);  // Stop loading after fetch is done
      }
    };

    fetchCategories();
  }, [currentPage, selectedCategory, minPrice, maxPrice, ratings]);

  if (loading) {
    return <div>Loading...</div>;  // Display loading state
  }

  return (
    <>

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

      <div className="pb-32"> 
        <CusstomPagination
          resPerPage={categoriesPerPage}
          productsCount={totalCategoriesCount}
          dynamicPath="/categories"
        />
      </div>
    </>
  );
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Categories />
    </Suspense>
  );
}
