import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary  = async (filePath) => {
    try {
        if(!filePath) return null;
        const responce = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        });
        console.log("file is upload on cloudinary successfully", responce.url);
        return responce;
    } catch (error) {
        fs.unlinkSync(filePath);
        return null;
    }
}

export default uploadOnCloudinary;