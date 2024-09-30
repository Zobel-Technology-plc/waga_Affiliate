/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useState } from 'react';
import ProductItem from '../../../../components/products/ProductItem';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import CusstomPagination from '../../../../components/layouts/CusstomPagination';

const SubcategoryPage = ({ params }) => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [resPerPage, setResPerPage] = useState(9); // Example: 9 products per page

  const router = useRouter();
  const searchParams = useSearchParams();
  let page = searchParams.get('page') || 1;
  page = Number(page);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `/api/products/category?category=${params.category}&subcategory=${params.subcategory}&page=${page}&limit=${resPerPage}`
        );
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
          setTotalProducts(data.totalProducts); // Total number of products
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [params.category, params.subcategory, page]);

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
          alt="Back to Category"
          width={30}
          height={30}
          className="hover:opacity-80 cursor-pointer"
          onClick={() => router.back()}
        />
        <h1 className="text-2xl font-bold ml-10 text-center">{params.subcategory}</h1>
      </div>

      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductItem key={product._id} product={product} />
          ))}
        </div>

        {/* Pagination */}
        <CusstomPagination
          resPerPage={resPerPage}
          productsCount={totalProducts}
          dynamicPath={`/category/${params.category}/${params.subcategory}`}
        />
      </div>
    </>
  );
};

export default SubcategoryPage;
