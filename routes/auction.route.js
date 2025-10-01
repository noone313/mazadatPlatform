import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { createAuction,getAllAuctions,getAuction } from '../controllers/auction.controller.js';
import {uploadAuctionImage} from '../middlewares/multer.js'
const auctionRouter = Router();


auctionRouter.post('/auctions',uploadAuctionImage,authenticateToken,createAuction);
auctionRouter.get('/auctions/:id',authenticateToken,getAuction);
auctionRouter.get('/auctions',getAllAuctions);

export {auctionRouter};