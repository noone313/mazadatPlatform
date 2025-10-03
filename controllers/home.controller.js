import { getUserStats, getUserAuctions, getUserBids, getRecentActivity } from '../controllers/profile.controller.js';


export async function renderHomePage(req, res) {
  try {
    const user = req.user || null;
    res.render('home',{user});
    } catch (error) {
    console.error("Error rendering home page:", error);
    res.status(500).send("Internal Server Error");
    }
}



export async function renderRegisterPage(req, res) {
  try {
      const user = req.user || null;
    res.render('register',{user});
  } catch (error) {
    console.error("Error rendering register page:", error);
    res.status(500).send("Internal Server Error");
  }
}



export async function renderLoginPage(req, res) {
  try {
    const user = req.user || null;
    const {success,error} = req.query;
    res.render('login', {success,error,user});
  } catch (error) {
    console.error("Error rendering login page:", error);
    res.status(500).send("Internal Server Error");
  }
}



export async function renderContactUsPage(req,res) {
  try {
     const user = req.user || null;
    res.render('contactUS',{user});
    } catch (error) {
    console.error("Error rendering contact us page:", error);
    res.status(500).send("Internal Server Error");
  }
}

export async function renderHowToJoin(req,res) {
  try{
     const user = req.user || null;
    res.render('howToJoin',{user});
  } catch (error) {
    console.error("Error rendering how to join page:", error);
    res.status(500).send("Internal Server Error");
  }
}




export async function renderCreateAuctionPage(req,res) {
  try {
     const user = req.user || null;
    res.render('createAuction',{user});
    } catch (error) {
    console.error("Error rendering create auction page:", error);
    res.status(500).send("Internal Server Error");
  } 
}




export async function renderProfilePage(req, res) {
  try {
    const user = req.user;

    const [stats, auctions, bids, activity] = await Promise.all([
      getUserStats(user.id),
      getUserAuctions(user.id),
      getUserBids(user.id),
      getRecentActivity(user.id)
    ]);

    return res.render("profile", {
      user: {
        ...user,
        stats,
        auctions,
        bids,
        recent_activity: activity
      }
    });
  } catch (error) {
    console.error("Error rendering profile page:", error);
    res.status(500).send("Internal Server Error");
  }
}

