import { Router } from "express";
import { renderHomePage, renderRegisterPage,renderLoginPage,renderContactUsPage,renderHowToJoin,renderCreateAuctionPage,renderProfilePage } from "../controllers/home.controller.js";
import { authenticateToken } from "../middlewares/auth.js";
const homeRouter = Router();

// Route to render the home page
homeRouter.get("/",renderHomePage);
homeRouter.get("/register", renderRegisterPage);
homeRouter.get("/login", renderLoginPage);
homeRouter.get("/contactus", renderContactUsPage);
homeRouter.get("/howtojoin", renderHowToJoin);
homeRouter.get("/create-auction",authenticateToken, renderCreateAuctionPage);
homeRouter.get("/profile", authenticateToken,renderProfilePage);

export { homeRouter };