import express from "express";
import { Request, Response } from 'express';
import auth from '../middleware/auth.js';
import multer from "multer";
import cloudinary from "../config/cloudinary.js";


const uploadRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

uploadRouter.post('/', auth, upload.single('image'), async (req: Request, res: Response) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
     const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'grocery-del',
      public_id: `${Date.now()}-${req.file.originalname}`,
    });
    
    res.status(200).json({ message: 'File uploaded successfully', data: result.secure_url });








  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed' });


  }});

export default uploadRouter;