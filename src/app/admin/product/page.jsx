'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const AdminProductPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    commission: '',
    category: '',
    subcategory: '',
    seller: '',
    stock: '',
    freeDelivery: false,
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProductId, setEditingProductId] = useState(null); // Track the product being edited
  const [showForm, setShowForm] = useState(false); // Flag to toggle form visibility
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Track delete confirmation modal
  const [productToDelete, setProductToDelete] = useState(null); // Track the product to be deleted

  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        const [categoryRes, subcategoryRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/subcategories?all=true'),
        ]);
        setCategories(categoryRes.data.categories);
        setSubCategories(subcategoryRes.data.subcategories);
      } catch (error) {
        console.error('Error fetching categories or subcategories:', error);
      }
    };
    fetchCategoriesAndSubcategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('/api/products');
        setProducts(data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: value,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  // Handle form submission for creating a new product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      Object.keys(product).forEach((key) => {
        formData.append(key, product[key]);
      });
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await axios.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setSuccess('Product created successfully!');
        setProduct({
          name: '',
          description: '',
          price: '',
          commission: '',
          category: '',
          subcategory: '',
          seller: '',
          stock: '',
          freeDelivery: false,
        });
        setImages([]);
        router.push('/admin/creation-success?type=Product');
      }
    } catch (err) {
      setError(err.response?.data.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setShowForm(false); // Hide form after submit
    }
  };

  // Handle inline editing for a specific product
  const handleInlineEdit = (productId) => {
    setEditingProductId(productId);
  };

  // Handle saving the edited product
  const handleSaveEdit = async (productId) => {
    const productToEdit = products.find((p) => p._id === productId);

    try {
      await axios.put(`/api/products/${productId}`, {
        name: productToEdit.name,
        price: productToEdit.price,
        commission: productToEdit.commission,
      });

      setSuccess('Product updated successfully!');
      setEditingProductId(null);
    } catch (error) {
      setError('Failed to update product');
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    try {
      await axios.delete(`/api/products/${productToDelete}`);
      setProducts(products.filter((p) => p._id !== productToDelete));
      setSuccess('Product deleted successfully!');
      setShowDeleteModal(false); // Close the modal
      setProductToDelete(null); // Clear selected product
    } catch (error) {
      setError('Failed to delete product');
    }
  };

  // Render the delete confirmation modal
  const renderDeleteModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md text-center">
        <p className="text-lg font-semibold mb-4">Are you sure you want to delete this product?</p>
        <button
          onClick={handleDeleteProduct}
          className="bg-red-600 text-white px-4 py-2 rounded mr-4 hover:bg-red-700 transition"
        >
          Yes
        </button>
        <button
          onClick={() => setShowDeleteModal(false)}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
        >
          No
        </button>
      </div>
    </div>
  );

  return (
    <div className=" mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{success}</div>}

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200"
      >
        {showForm ? 'Hide Form' : 'New Product'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label htmlFor="name" className="text-gray-700">Product Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
            placeholder="Enter product name"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="description" className="text-gray-700">Product Description</label>
          <textarea
            id="description"
            name="description"
            value={product.description}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
            placeholder="Enter product description"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="price" className="text-gray-700">Product Price</label>
          <input
            type="number"
            id="price"
            name="price"
            value={product.price}
            onChange={handleInputChange}
            className="border border-gray-300 rounded p-2 mt-1"
            placeholder="Enter product price"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="commission" className="text-gray-700">Product Commission</label>
          <input
            type="number"
            id="commission"
            name="commission"
            value={product.commission}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
            placeholder="Enter product commission"
          />
        </div>

        <div className="mb-4">
  <label className="block text-gray-700">Category</label>
  <select
    value={product.category}
    onChange={(e) => setProduct({ ...product, category: e.target.value })}
    className="w-full p-2 border border-gray-300 rounded"
    required
  >
    <option value="">Select Category</option>
    {categories.map((cat) => (
      <option key={cat._id} value={cat.name}>
        {cat.name}
      </option>
    ))}
  </select>
</div>


<div className="mb-4">
  <label className="block text-gray-700">Sub Category</label>
  <select
    value={product.subcategory}
    onChange={(e) => setProduct({ ...product, subcategory: e.target.value })}
    className="w-full p-2 border border-gray-300 rounded"
    required
  >
    <option value="">Select Sub Category</option>
    {subcategories.map((cat) => (
      <option key={cat._id} value={cat.name}>
        {cat.name}
      </option>
    ))}
  </select>
</div>

<div className="flex flex-col">
          <label htmlFor="seller" className="text-gray-700">Product Seller</label>
          <input
            type="text"
            id="seller"
            name="seller"
            value={product.seller}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
            placeholder="Enter product seller"
          />
        </div>


        <div className="flex flex-col">
          <label htmlFor="stock" className="text-gray-700">Stock</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={product.stock}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
            placeholder="Enter product stock"
          />
        </div>

        <div className="flex items-center">
          <label htmlFor="freeDelivery" className="text-gray-700 mr-2">Free Delivery</label>
          <input
            type="checkbox"
            id="freeDelivery"
            name="freeDelivery"
            checked={product.freeDelivery}
            onChange={handleInputChange}
            className="h-4 w-4"
          />
        </div>

        <div className="flex items-center">
          <label htmlFor="OnSale" className="text-gray-700 mr-2">On Sale</label>
          <input
            type="checkbox"
            id="onSale"
            name="onSale"
            checked={product.onSale}
            onChange={handleInputChange}
            className="h-4 w-4"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="images" className="text-gray-700">Product Images</label>
          <input
            type="file"
            id="images"
            name="images"
            multiple
            onChange={handleImageUpload}
            className="border border-gray-300 rounded p-2 mt-1"
          />
        </div>

        <div className="flex justify-center items-center">
  <button
    type="submit"
    className="w-32 bg-blue-600 text-white p-1 rounded mt-4 hover:bg-blue-700 transition duration-200"
    disabled={loading}
  >
    {loading ? 'Creating...' : 'Create Product'}
  </button>
</div>

      </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-md">
          <thead>
            <tr className="text-left border-b">
              <th className="px-4 py-2">Image</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Commission</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b">
                <td className="px-4 py-2">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      width={50}
                      height={50}
                      className="rounded"
                    />
                  ) : (
                    'No Image'
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingProductId === product._id ? (
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) =>
                        setProducts(
                          products.map((p) =>
                            p._id === product._id ? { ...p, name: e.target.value } : p
                          )
                        )
                      }
                      className="border border-gray-300 rounded p-1"
                    />
                  ) : (
                    product.name
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingProductId === product._id ? (
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) =>
                        setProducts(
                          products.map((p) =>
                            p._id === product._id ? { ...p, price: e.target.value } : p
                          )
                        )
                      }
                      className="border border-gray-300 rounded p-1"
                    />
                  ) : (
                    `${product.price} birr`
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingProductId === product._id ? (
                    <input
                      type="number"
                      value={product.commission}
                      onChange={(e) =>
                        setProducts(
                          products.map((p) =>
                            p._id === product._id ? { ...p, commission: e.target.value } : p
                          )
                        )
                      }
                      className="border border-gray-300 rounded p-1"
                    />
                  ) : (
                    `${product.commission} birr`
                  )}
                </td>
                <td className="px-4 py-2 flex">
                  {editingProductId === product._id ? (
                    <button
                      onClick={() => handleSaveEdit(product._id)}
                      className="bg-green-500 text-white p-2 rounded mr-2 w-24"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInlineEdit(product._id)}
                      className="bg-yellow-500 text-white p-2 rounded mr-2 w-24"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setProductToDelete(product._id);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-600 text-white p-2 rounded w-24"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteModal && renderDeleteModal()}
    </div>
  );
};

export default AdminProductPage;
