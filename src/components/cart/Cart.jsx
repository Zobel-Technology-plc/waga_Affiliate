"use client";

import React, { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CartContext from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import WebApp from "@twa-dev/sdk"; // Import the Telegram WebApp SDK

const Cart = () => {
  const { cart, addItemToCart, deleteItemFromCart, clearCart } = useContext(CartContext);
  const router = useRouter();
  const [userData, setUserData] = useState(null); // Holds user data from backend
  const [selectedOption, setSelectedOption] = useState("self");
  const [city, setCity] = useState(""); // Use city instead of address
  const [phoneNumber, setPhoneNumber] = useState(""); // Initialize phoneNumber state
  const [productCommissions, setProductCommissions] = useState({});
  const [notification, setNotification] = useState("");

  // Fetch userId from Telegram WebApp SDK
  useEffect(() => {
    if (typeof window !== "undefined" && WebApp.initDataUnsafe.user) {
      const userId = WebApp.initDataUnsafe.user.id; // Get userId from Telegram SDK
      fetchUserData(userId); // Fetch user data from backend using this userId
    }
  }, []);

  // Fetch user data from MongoDB backend using userId from Telegram SDK
  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        setUserData(data.user);
        // Pre-fill phoneNumber and city when the user selects "self"
        if (selectedOption === "self") {
          setPhoneNumber(data.user.phoneNumber);
          setCity(data.user.city);
        }
      } else {
        console.error("Failed to fetch user data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Fetch product commissions based on the cart items
  useEffect(() => {
    const fetchCommissions = async () => {
      const commissions = {};
      for (const item of cart.cartItems) {
        try {
          const response = await fetch(`/api/products/${item.product}`);
          const productData = await response.json();
          commissions[item.product] = productData?.product?.commission || 0;
        } catch (error) {
          console.error(`Failed to fetch commission for product ${item.product}:`, error);
        }
      }
      setProductCommissions(commissions);
    };

    if (cart.cartItems.length > 0) {
      fetchCommissions();
    }
  }, [cart.cartItems]);

  // Increase item quantity
  const increaseQty = (cartItem) => {
    const newQty = cartItem?.quantity + 1;
    if (newQty > Number(cartItem.stock)) return;
    addItemToCart({ ...cartItem, quantity: newQty });
  };

  // Decrease item quantity
  const decreaseQty = (cartItem) => {
    const newQty = cartItem?.quantity - 1;
    if (newQty <= 0) return;
    addItemToCart({ ...cartItem, quantity: newQty });
  };

  // Calculate total without commission
  const amountWithoutcom = cart?.cartItems?.reduce(
    (acc, item) => acc + Number(item.quantity) * Number(item.price),
    0
  );

  // Calculate total commission
  const commissionamount = cart?.cartItems?.reduce(
    (acc, item) => acc + Number(item.quantity) * Number(productCommissions[item.product] || 0),
    0
  ).toFixed(2);

  // Calculate total amount including commission
  const totalAmount = (Number(amountWithoutcom)).toFixed(2);

  // Handle order creation
  const handleContinue = async () => {
    try {
      const orderItems = cart.cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: (item.price * item.quantity).toFixed(2), // Total price for each item
        product: item.product,
      }));

      const userId = userData?._id;
      if (!userId) {
        console.error("User ID is not available. Cannot place order.");
        return;
      }
      if (orderItems.length === 0) {
        console.error("Cart is empty. Cannot place order.");
        return;
      }

      // Handle NaN for totalAmount
      const validTotalAmount = isNaN(totalAmount) ? "0" : totalAmount;

      // Calculate commission amount
      const commissionamount = cart.cartItems.reduce(
        (acc, item) => acc + Number(item.quantity) * Number(productCommissions[item.product] || 0),
        0
      ).toFixed(2);

      let orderDetails = {
        userId,
        orderItems,
        totalAmount: validTotalAmount, // Use validTotalAmount
        commissionamount: Number(commissionamount),
        commissionStatus: 'pending',
        orderFor: selectedOption,  // Use phone number from state
        phoneNumber,
        city,
      };

      if (selectedOption === "other") {
        if (!city || !phoneNumber) {
          const missingField = !city ? "City" : "Phone Number";
          setNotification(`${missingField} አላስገቡም እባክዎ /start የሚለውን በመጫን ${missingField} ያስገቡ፡፡`);
          
          // Clear notification after 3 seconds
          setTimeout(() => {
            setNotification("");
          }, 3000);
          return;
        }
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDetails),
      });

      if (response.ok) {
        clearCart();
        router.push("/order-confirmed");
      } else {
        console.error("Failed to create order:", response.statusText);
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <>
    {notification && (
        <div className="fixed top-5 right-5 bg-red-500 text-white p-3 rounded-md shadow-lg z-50">
          {notification}
        </div>
      )}

      <section className="py-5 sm:py-7 bg-blue-100">
        <div className="container max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-2">
            {cart?.cartItems?.length || 0} Item(s) in Cart
          </h2>
        </div>
      </section>

      {cart?.cartItems?.length > 0 ? (
        <section className="py-10">
          <div className="container max-w-screen-xl mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4">
              <main className="md:w-3/4">
                <article className="border border-gray-200 bg-white shadow-sm rounded mb-5 p-3 lg:p-5">
                {cart?.cartItems?.map((cartItem) => (
  <div key={cartItem.product}>
    <div className="flex flex-wrap lg:flex-row gap-5 mb-4 items-center">
      <div className="w-full lg:w-2/5 xl:w-2/4">
        <figure className="flex leading-5">
          <div>
            <div className="block w-24 h-24 md:w-32 md:h-32 rounded border border-gray-200 overflow-hidden relative">
              <Image
                src={cartItem.image}
                alt={cartItem.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>
          <figcaption className="ml-3">
            <p>
              <Link href="#">
                <span className="hover:text-blue-600">
                  {cartItem.name}
                </span>
              </Link>
            </p>
            <p className="mt-1 text-gray-400">
              Seller: {cartItem.seller}
            </p>
          </figcaption>
        </figure>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            className="bg-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-300 h-full w-12 rounded-l-md cursor-pointer outline-none transition-all duration-200 ease-in-out"
            onClick={() => decreaseQty(cartItem)}
          >
            <span className="m-auto text-2xl font-semibold">−</span>
          </button>
          <input
            type="number"
            className="outline-none text-center w-14 bg-white font-semibold text-lg hover:text-black focus:text-black text-gray-900 cursor-default flex items-center"
            name="custom-input-number"
            value={cartItem.quantity}
            readOnly
          />
          <button
            className="bg-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-300 h-full w-12 rounded-r-md cursor-pointer outline-none transition-all duration-200 ease-in-out"
            onClick={() => increaseQty(cartItem)}
          >
            <span className="m-auto text-2xl font-semibold">+</span>
          </button>
        </div>
        {cartItem.price > 0 && (
  <div className="text-right">
    <p className="font-semibold not-italic">
      {(cartItem.price * cartItem.quantity).toFixed(2)} birr
    </p>
    <small className="text-gray-400">
      {cartItem.price} / per item birr
    </small>
  </div>
)}

      </div>
      <div className="flex-auto">
        <div className="float-right">
          <button
            className="px-4 py-2 inline-block text-red-600 bg-white shadow-sm border border-gray-200 rounded-md hover:bg-gray-100 cursor-pointer"
            onClick={() => deleteItemFromCart(cartItem.product)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <hr className="my-4" />
  </div>
))}

                </article>
              </main>
              <aside className="md:w-1/4">
              <article className="border border-gray-200 bg-white shadow-sm rounded mb-5 p-3 lg:p-5">
  <ul className="mb-5">
    {/* Conditionally render Price if amountWithoutcom is greater than 0 */}
    {amountWithoutcom > 0 && (
      <li className="flex justify-between text-gray-600 mb-1">
        <span>Price:</span>
        <span>{amountWithoutcom} Birr</span>
      </li>
    )}

    <li className="flex justify-between text-gray-600 mb-1">
      <span>Total Units:</span>
      <span className="text-green-500">
        {cart?.cartItems?.reduce(
          (acc, item) => acc + item.quantity,
          0
        )}{" "}
        (Units)
      </span>
    </li>

    <li className="flex justify-between text-gray-600 mb-1">
      <span>Commission:</span>
      <span>{commissionamount} Birr</span>
    </li>

    {/* Conditionally render Total price if totalAmount is greater than 0 */}
    {totalAmount > 0 && (
      <li className="text-lg font-bold border-t flex justify-between mt-3 pt-3">
        <span>Total price:</span>
        <span>{totalAmount} Birr</span>
      </li>
    )}
  </ul>

  {/* Radio Buttons for "Self" or "Other" */}
  <div className="mb-5">
    <label className="mr-4">
      <input
        type="radio"
        value="self"
        checked={selectedOption === "self"}
        onChange={() => setSelectedOption("self")}
        className="mr-2"
      />
      Self
    </label>
    <label>
      <input
        type="radio"
        value="other"
        checked={selectedOption === "other"}
        onChange={() => setSelectedOption("other")}
        className="mr-2"
      />
      Other
    </label>
  </div>

  {/* Display City and Phone Number Form if "Other" is selected */}
  {selectedOption === "other" && (
    <div className="mb-5">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          type="text"
          className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter the city"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="text"
          className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter the phone number"
        />
      </div>
    </div>
  )}

  <button
    className="px-4 py-3 mb-2 inline-block text-lg w-full text-center font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 cursor-pointer"
    onClick={handleContinue}
  >
    Continue
  </button>

  <Link href="/" legacyBehavior>
    <a className="px-4 py-3 inline-block text-lg w-full text-center font-medium text-green-600 bg-white shadow-sm border border-gray-200 rounded-md hover:bg-gray-100">
      Back to shop
    </a>
  </Link>
</article>

              </aside>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-10">
          <div className="container max-w-screen-xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <Link href="/" legacyBehavior>
              <a className="px-4 py-2 inline-block text-lg font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                Back to Shop
              </a>
            </Link>
          </div>
        </section>
      )}
    </>
  );
};

export default Cart;
