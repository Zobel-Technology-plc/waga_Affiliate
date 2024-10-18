'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CreationSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  if (!type) {
    return <div>Error: Type is not defined.</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-green-500">{`${type.charAt(0).toUpperCase() + type.slice(1)} Created Successfully! `}</h2>
      <p>{`The ${type} has been created successfully.`}</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
        onClick={() => router.push(`/admin/${type}`)}
      >
        Go to {`${type}`}
      </button>
    </div>
  );
};

const CreationSuccessPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <CreationSuccessContent />
  </Suspense>
);

export default CreationSuccessPage;
