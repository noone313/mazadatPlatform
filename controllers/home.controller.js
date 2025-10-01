import { getUserStats, getUserAuctions, getUserBids, getRecentActivity } from '../controllers/profile.controller.js';


export async function renderHomePage(req, res) {
  try {
   
    res.render('home');
    } catch (error) {
    console.error("Error rendering home page:", error);
    res.status(500).send("Internal Server Error");
    }
}



export async function renderRegisterPage(req, res) {
  try {
    res.render('register');
  } catch (error) {
    console.error("Error rendering register page:", error);
    res.status(500).send("Internal Server Error");
  }
}



export async function renderLoginPage(req, res) {
  try {
    const {success,error} = req.query;
    res.render('login', {success,error});
  } catch (error) {
    console.error("Error rendering login page:", error);
    res.status(500).send("Internal Server Error");
  }
}



export async function renderContactUsPage(req,res) {
  try {
    res.render('contactUS');
    } catch (error) {
    console.error("Error rendering contact us page:", error);
    res.status(500).send("Internal Server Error");
  }
}

export async function renderHowToJoin(req,res) {
  try{
    res.render('howToJoin');
  } catch (error) {
    console.error("Error rendering how to join page:", error);
    res.status(500).send("Internal Server Error");
  }
}




export async function renderCreateAuctionPage(req,res) {
  try {
    res.render('createAuction');
    } catch (error) {
    console.error("Error rendering create auction page:", error);
    res.status(500).send("Internal Server Error");
  } 
}




export async function renderProfilePage(req, res) {
  try {
    const user = req.user;
    
    // جلب البيانات الحقيقية من قاعدة البيانات
    const userStats = await getUserStats(user.id);
    const userAuctions = await getUserAuctions(user.id);
    const userBids = await getUserBids(user.id);
    const recentActivity = await getRecentActivity(user.id);

    res.render('profile', { 
      user: {
        ...user,
        stats: userStats,
        auctions: userAuctions,
        bids: userBids,
        recent_activity: recentActivity
      }
    });
  } catch (error) {
    console.error("Error rendering profile page:", error);
    res.status(500).send("Internal Server Error");
  }
}

