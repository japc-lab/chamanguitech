// Middleware for uploading images to Cloudinary
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary (set your credentials in environment variables)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use multer memory storage to get file buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to upload a single image file to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ ok: false, message: 'No file uploaded' });
    }
    try {
        const result = await cloudinary.uploader.upload_stream(
            { folder: 'pesaje/people', public_id: req.params.id }
        , (error, result) => {
            if (error) {
                return next(error);
            }
            req.cloudinaryUrl = result.secure_url;
            next();
        });
        // Pipe the file buffer to Cloudinary
        result.end(req.file.buffer);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    upload, // multer middleware for handling multipart/form-data
    uploadToCloudinary
};
