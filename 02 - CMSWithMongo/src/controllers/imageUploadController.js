const uuidv4 = require("uuid").v4;
const path = require("path");
const fs = require("fs");

exports.uploadImage = (req, res) => {

  // Check if files exist in request
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: "No files were uploaded" });
  }

  if (!req.files.file) {
    return res.status(400).json({ error: "No image file uploaded with field name 'file'" });
  }

  const imageFile = req.files.file;

  // Validate file size
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (imageFile.size > maxSize) {
    return res.status(400).json({ error: "Image file size exceeds the limit of 5 MB" });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(imageFile.mimetype)) {
    return res.status(400).json({ 
      error: "Invalid file type. Only JPEG, PNG, and GIF are allowed",
      receivedType: imageFile.mimetype 
    });
  }

  const fileName = uuidv4() + path.extname(imageFile.name);
  
  // Create correct upload path
  const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads');
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  // Save the image file
  imageFile.mv(path.join(uploadPath, fileName), (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to upload image" });
    }

    // Return the image URL
    const imageUrl = `/uploads/${fileName}`;
    res.status(200).json({ 
      message: "Image uploaded successfully", 
      imageUrl,
      filename: fileName
    });
  });
};
