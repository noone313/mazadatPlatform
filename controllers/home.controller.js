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

export async function renderAuctionsPage(req,res) {
  try { 

    res.render('auctions');
    } catch (error) {
    console.error("Error rendering auctions page:", error);
    res.status(500).send("Internal Server Error");
  }
}


