import express from "express";
import { getAllProducts, createProduct, getProduct, updateProduct, deleteProduct } from "../controllers/productController.js";

const productRoutes = express.Router();

productRoutes.get("/", getAllProducts);

productRoutes.get("/:id", getProduct);

productRoutes.post("/", createProduct);

productRoutes.put("/:id", updateProduct);

productRoutes.delete("/:id", deleteProduct);

export default productRoutes;
