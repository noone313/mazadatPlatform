import { Router } from "express";
import { renderHomePage, renderRegisterPage,renderLoginPage,renderAuctionsPage } from "../controllers/home.controller.js";

const homeRouter = Router();

// Route to render the home page
homeRouter.get("/", renderHomePage);
homeRouter.get("/register", renderRegisterPage);
homeRouter.get("/login", renderLoginPage);
homeRouter.get("/auctions", renderAuctionsPage);

export { homeRouter };