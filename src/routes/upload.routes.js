import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadExcel } from '../controllers/upload.controller.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/excel/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

router.post('/', upload.single('file'), uploadExcel);

export default router;
