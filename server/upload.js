import express from 'express';
import multer from 'multer';
import cloudinary from './cloudinary.js';
import fs from 'fs';

if (!fs.existsSync("temp")) {
  fs.mkdirSync("temp");
}

const router = express.Router();
const upload = multer({ dest: 'temp/' });

router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
    });
    fs.unlinkSync(req.file.path); 

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload to Cloudinary failed' });
  }
});

export { upload };
export default router;
