'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const UploadedPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-md rounded p-6">
        <h1 className="text-2xl font-bold text-green-600 mb-4 text-center">
          Product Uploaded Successfully!
        </h1>
        <p className="text-gray-700 mb-6 text-center">
          Your product has been uploaded and is waiting for Admin approval.
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Go Back to Profile
        </button>
      </div>
    </div>
  );
};

export default UploadedPage;
