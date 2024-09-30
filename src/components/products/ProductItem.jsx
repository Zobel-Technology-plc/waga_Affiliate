import React, { useContext, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import CartContext from "@/context/CartContext";
import { useRouter } from "next/navigation";

const ProductItem = ({ product }) => {
  const { cart, addItemToCart } = useContext(CartContext);
  const [inCart, setInCart] = useState(false);
  const [notification, setNotification] = useState(""); // State for notification message
  const router = useRouter();

  useEffect(() => {
    const isInCart = cart.cartItems.some((item) => item.product === product._id);
    setInCart(isInCart);
  }, [cart.cartItems, product._id]);

  const addToCartHandler = () => {
    try {
      addItemToCart({
        product: product._id,
        name: product.name,
        price: product.price,
        commission: product.commission, // Ensure correct commission is passed
        image: product.images[0]?.url || "/images/default_product.png",
        stock: product.stock,
        seller: product.seller,
      });

      setInCart(true);
      setNotification(`${product.name} has been added to your cart!`);

      // Hide the notification after 3 seconds
      setTimeout(() => {
        setNotification("");
      }, 3000);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    }
  };

  const handleViewInCart = () => {
    router.push('/cart');
  };

  return (
    <article className="border border-gray-200 overflow-hidden bg-white shadow-sm rounded mb-5">
      <div className="flex flex-col items-center md:items-stretch md:flex-row">
        <div className="md:w-1/4 flex justify-center md:justify-start p-3">
          <div style={{ width: "100%", height: "auto", position: "relative" }}>
            <Image
              src={product?.images[0]?.url || "/images/default_product.png"}
              alt={product.name}
              height="240"
              width="240"
              className="object-contain"
            />
          </div>
        </div>
        <div className="md:w-2/4 flex flex-col justify-center p-4">
          <Link href={`/product/${product._id}`} className="hover:text-blue-600 text-lg font-semibold" passHref>
            {product.name}
          </Link>
        </div>
        <div className="md:w-1/4 flex flex-col justify-center items-center md:items-start border-t md:border-t-0 md:border-l border-gray-200 p-5">
          {product?.price > 0 && (
            <span className="text-xl font-semibold text-black">
              {product.price} Birr
            </span>
          )}
          <span className="text-xl text-black">
            Commission: {product?.commission} birr
          </span>
          {/* Conditionally render free delivery */}
          {product?.freeDelivery && <p className="text-green-500">Free Delivery</p>}
          <div className="my-3">
            {inCart ? (
              <button
                className="px-4 py-2 inline-block text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 cursor-pointer"
                onClick={handleViewInCart}
              >
                View in Cart
              </button>
            ) : (
              <button
                className="px-4 py-2 inline-block text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 cursor-pointer"
                onClick={addToCartHandler}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div className="absolute top-0 right-0 bg-green-500 text-white p-2 rounded-md">
          {notification}
        </div>
      )}
    </article>
  );
};

export default ProductItem;
