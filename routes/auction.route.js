import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { createAuction, getAllAuctions, getAuction } from '../controllers/auction.controller.js';
import upload from '../middlewares/multer.js';

const auctionRouter = Router();

// استخدام multer مباشرة في المسار
auctionRouter.post('/auctions', 
  authenticateToken,
  upload.single('image'), // استخدم .single() مباشرة
  (req, res, next) => {
    console.log('🔄 After multer middleware');
    console.log('📁 File:', req.file);
    console.log('📦 Body:', req.body);
    next();
  },
  createAuction
);

auctionRouter.get('/auctions/:id', authenticateToken, getAuction);
auctionRouter.get('/auctions', authenticateToken, getAllAuctions);

export { auctionRouter };