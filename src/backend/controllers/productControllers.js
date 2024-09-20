// backend/controllers/productControllers.js

import Product from "../models/product";
import APIFilters from "../utils/APIFilters";

export const newProduct = async (req, res) => {
  try {
    console.log(req.body); // To verify subcategory field in the request

    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error in newProduct:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


export const getProducts = async (req, res) => {
  try {
    const resPerPage = 3;
    const productsCount = await Product.countDocuments();

    const apiFilters = new APIFilters(Product.find(), req.query)
      .search()
      .filter();

    let products = await apiFilters.query;
    const filteredProductsCount = products.length;

    apiFilters.pagination(resPerPage);

    products = await apiFilters.query.clone();

    res.status(200).json({
      success: true,
      productsCount,
      resPerPage,
      filteredProductsCount,
      products,
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.query.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error in getProduct:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
