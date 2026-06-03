import api from "./axiosConfig";

export const getProducts = (params) =>
  api.get("/products", { params });

export const getProductBySlug = (slug) =>
  api.get(`/products/${slug}`);

export const getCategories = () =>
  api.get("/products/categories");

export const getFlavors = () =>
  api.get("/products/flavors");

export const getSizes = () =>
  api.get("/products/sizes");