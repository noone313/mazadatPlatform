import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { createBid } from '../controllers/bid.controller.js';


const bidRouter = Router();


bidRouter.post('/bids', authenticateToken, createBid);


export { bidRouter };