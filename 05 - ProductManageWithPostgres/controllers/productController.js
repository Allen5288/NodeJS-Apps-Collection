import sql from "../config/db.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await sql.query("SELECT * FROM products ORDER BY created_at DESC");
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
  // Logic to get all products
};

export const getProduct = async (req, res) => {
  // Logic to get a single product by ID
  const { id } = req.params;
  try {
    const product = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;
    if (product.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.status(200).json({ success: true, data: product[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const createProduct = async (req, res) => {
  // Logic to create a new product
  const { name, price, image } = req.body;
  if (!name || !price || !image) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }
  try {
    const newProduct = await sql`
        INSERT INTO products (name, price, image)
        VALUES (${name}, ${price}, ${image})
        RETURNING *
    `;
    res.status(201).json({ success: true, data: newProduct[0] });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  // Logic to update an existing product
  const { id } = req.params;
  const { name, price, image } = req.body;
  if (!name || !price || !image) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }
  try {
    const updatedProduct = await sql`
      UPDATE products
      SET name = ${name}, price = ${price}, image = ${image}
      WHERE id = ${id}
      RETURNING *
    `;
    if (updatedProduct.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.status(200).json({ success: true, data: updatedProduct[0] });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  // Logic to delete a product by ID
  const { id } = req.params;
  try {
    const deletedProduct = await sql`
      DELETE FROM products WHERE id = ${id} RETURNING *
    `;
    if (deletedProduct.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.status(200).json({ success: true, data: deletedProduct[0] });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
