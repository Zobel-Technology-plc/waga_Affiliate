'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './ActionDetailsPage.module.css';

const ActionDetailsPage = ({ params }) => {
  const { actionname } = params;
  const decodedActionName = decodeURIComponent(actionname);
  const [actionData, setActionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const router = useRouter();
  const itemsPerPage = 50; // Number of items per page

  useEffect(() => {
    const fetchActionData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/user/actions?actionName=${actionname}&page=${currentPage}&limit=${itemsPerPage}`
        );
        if (response.data.success) {
          setActionData(response.data.actions);
          setTotalPages(Math.ceil(response.data.total / itemsPerPage));
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch users for the selected action');
      } finally {
        setLoading(false);
      }
    };

    fetchActionData();
  }, [actionname, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Users who completed: {decodedActionName}
      </h1>

      <div className={styles.tableContainer}>
      <table className={styles.table}>
  <thead>
    <tr>
      <th>#</th> {/* Numbers Column */}
      <th>User ID</th>
      <th>Action Name</th>
      <th>Points Earned</th>
    </tr>
  </thead>
  <tbody>
    {actionData.map((action, index) => (
      <tr key={action.userId} className={styles.tr}>
        <td className={styles.td}>
          {(currentPage - 1) * itemsPerPage + index + 1} {/* Global Index */}
        </td>
        <td
          className={styles.linkCell}
          onClick={() => router.push(`/admin/user/${action.userId}`)}
        >
          {action.userId}
        </td>
        <td className={styles.td}>
          {action.action} {/* Extracted Action Name */}
        </td>
        <td className={styles.td}>
          {new Intl.NumberFormat().format(action.points)}
        </td>
      </tr>
    ))}
  </tbody>
</table>

      </div>

      <div className={styles.pagination}>
        <button
          className={styles.paginationButton}
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className={styles.paginationInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className={styles.paginationButton}
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ActionDetailsPage;
