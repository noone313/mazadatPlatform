import { Router } from 'express';
import { login,register,delete_my_account,update_my_account } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
const userRouter = Router();



userRouter.post('/users/register',register);

userRouter.post('/users/login',login);

userRouter.delete('/users/:id',authenticateToken,delete_my_account);

userRouter.put("/users/me", authenticateToken, update_my_account);

export { userRouter };