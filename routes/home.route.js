import { Router } from "express";
import { renderHomePage, renderRegisterPage,renderLoginPage,renderContactUsPage,renderHowToJoin,renderCreateAuctionPage,renderProfilePage } from "../controllers/home.controller.js";
import { authenticateToken } from "../middlewares/auth.js";
const homeRouter = Router();

// Route to render the home page
homeRouter.get("/",authenticateToken,renderHomePage);
homeRouter.get("/register", renderRegisterPage);
homeRouter.get("/login", renderLoginPage);
homeRouter.get("/contactus",authenticateToken, renderContactUsPage);
homeRouter.get("/howtojoin",authenticateToken, renderHowToJoin);
homeRouter.get("/create-auction",authenticateToken, renderCreateAuctionPage);
homeRouter.get("/profile", authenticateToken,renderProfilePage);

export { homeRouter };