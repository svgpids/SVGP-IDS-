const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

dotenv.config();

const app = express();
const PORT = 3000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// UPLOAD FOLDER
// ===============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer configuration
const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// ===============================
// CLOUDINARY
// ===============================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SVGP-IDS server is running",
        uploadEndpoint: "/upload"
    });
});

// ===============================
// UPLOAD IMAGE
// ===============================

app.post("/upload", upload.single("image"), async (req, res) => {

    let localFile = null;

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No image selected"
            });
        }

        localFile = req.file.path;

        console.log("Uploading:", req.file.originalname);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(localFile, {
            folder: "SVGP-IDS",
            resource_type: "image"
        });

        // Delete temporary local file
        if (fs.existsSync(localFile)) {
            fs.unlinkSync(localFile);
        }

        console.log("Cloudinary upload successful");
        console.log(result.secure_url);

        res.json({
            success: true,
            message: "Image uploaded successfully",
            imageUrl: result.secure_url,
            publicId: result.public_id,
            originalName: req.file.originalname
        });

    } catch (error) {

        console.error("UPLOAD ERROR:");
        console.error(error);

        // Delete temporary file if upload failed
        if (localFile && fs.existsSync(localFile)) {
            fs.unlinkSync(localFile);
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log("");
    console.log("========================================");
    console.log("        SVGP-IDS QR SERVER");
    console.log("========================================");
    console.log(`Server:  http://localhost:${PORT}`);
    console.log(`Upload:  http://localhost:${PORT}/upload`);
    console.log("========================================");
    console.log("");
});