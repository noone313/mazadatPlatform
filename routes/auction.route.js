import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { createAuction,getAuction } from '../controllers/auction.controller.js';
import {uploadAuctionImage} from '../middlewares/multer.js'
const auctionRouter = Router();


auctionRouter.post('/auctions',uploadAuctionImage,authenticateToken,createAuction);
auctionRouter.get('/auctions/:id',authenticateToken,getAuction);


export {auctionRouter};