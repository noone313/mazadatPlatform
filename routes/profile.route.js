import {Router} from 'express';
import { 
  getUserStats, 
  getUserAuctions, 
  getUserBids, 
  getRecentActivity, 
  updateUserProfile 
} from '../controllers/profile.controller.js';

const profileRouter = Router();

// جلب إحصائيات المستخدم
profileRouter.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await getUserStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user stats' });
  }
});

// جلب مزادات المستخدم
profileRouter.get('/auctions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const auctions = await getUserAuctions(userId);
    res.json({ success: true, data: auctions });
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user auctions' });
  }
});

// جلب مزايدات المستخدم
profileRouter.get('/bids/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bids = await getUserBids(userId);
    res.json({ success: true, data: bids });
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user bids' });
  }
});

// جلب النشاط الأخير
profileRouter.get('/activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const activity = await getRecentActivity(userId);
    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent activity' });
  }
});

// تحديث بيانات المستخدم
profileRouter.put('/update/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, email, phone, address } = req.body;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const updatedUser = await updateUserProfile(userId, updateData);
    
    res.json({ 
      success: true, 
      message: 'تم تحديث البيانات بنجاح',
      data: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update user profile' });
  }
});

// جلب جميع بيانات البروفايل دفعة واحدة
profileRouter.get('/all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [stats, auctions, bids, activity] = await Promise.all([
      getUserStats(userId),
      getUserAuctions(userId),
      getUserBids(userId),
      getRecentActivity(userId)
    ]);

    res.json({
      success: true,
      data: {
        stats,
        auctions,
        bids,
        activity
      }
    });
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile data' });
  }
});

export default profileRouter;