import { User, Auction, Bid, AuctionImage, Category } from '../models/models.js';

// جلب إحصائيات المستخدم
export const getUserStats = async (userId) => {
  try {
    const activeAuctionsCount = await Auction.count({
      where: { seller_id: userId, status: 'active' }
    });

    // حساب المزادات التي فاز بها المستخدم (أكثر دقة: تحقق من أعلى مزايدة)
    const wonAuctions = await Auction.findAll({
      where: { status: 'closed' },
      include: [{
        model: Bid,
        as: 'Bids',
        where: { bidder_id: userId },
        required: true
      }]
    });

    let wonAuctionsCount = 0;
    for (const auction of wonAuctions) {
      const maxBid = await Bid.findOne({
        where: { auction_id: auction.auction_id },
        order: [['amount', 'DESC']]
      });
      if (maxBid && maxBid.bidder_id === userId) {
        wonAuctionsCount++;
      }
    }

    const totalBidsCount = await Bid.count({ where: { bidder_id: userId } });

    return {
      active_auctions: activeAuctionsCount,
      won_auctions: wonAuctionsCount,
      total_bids: totalBidsCount
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

// جلب مزادات المستخدم
export const getUserAuctions = async (userId) => {
  try {
    const auctions = await Auction.findAll({
      where: { seller_id: userId },
      include: [
        { model: Bid, as: 'Bids', attributes: ['bid_id'] },
        { model: AuctionImage, as: 'AuctionImages', attributes: ['image_url'] },
        { model: Category, attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return auctions.map(auction => ({
      auction_id: auction.auction_id,
      title: auction.title,
      description: auction.description,
      start_price: auction.start_price,
      current_price: auction.current_price,
      start_time: auction.start_time,
      end_time: auction.end_time,
      status: auction.status,
      created_at: auction.created_at,
      image: auction.AuctionImages.length > 0
        ? auction.AuctionImages[0].image_url
        : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      bids_count: auction.Bids.length,
      time_left: calculateTimeLeft(auction.end_time)
    }));
  } catch (error) {
    console.error('Error getting user auctions:', error);
    throw error;
  }
};

// جلب مزايدات المستخدم
export const getUserBids = async (userId) => {
  try {
    const bids = await Bid.findAll({
      where: { bidder_id: userId },
      include: [
        {
          model: Auction,
          as: 'Auction',
          include: [{ model: AuctionImage, as: 'AuctionImages', attributes: ['image_url'] }]
        }
      ],
      order: [['bid_time', 'DESC']]
    });

    const bidsWithStatus = await Promise.all(
      bids.map(async (bid) => {
        const maxBid = await Bid.findOne({
          where: { auction_id: bid.Auction.auction_id },
          order: [['amount', 'DESC']]
        });

        let status = 'outbid';
        if (maxBid && maxBid.bidder_id === userId) {
          status = 'winning';
        }

        return {
          bid_id: bid.bid_id,
          my_bid: bid.amount,
          current_price: maxBid ? maxBid.amount : bid.amount,
          status,
          auction_title: bid.Auction.title,
          auction_image: bid.Auction.AuctionImages.length > 0
            ? bid.Auction.AuctionImages[0].image_url
            : 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          time_left: calculateTimeLeft(bid.Auction.end_time)
        };
      })
    );

    return bidsWithStatus;
  } catch (error) {
    console.error('Error getting user bids:', error);
    throw error;
  }
};

// جلب النشاط الأخير
export const getRecentActivity = async (userId) => {
  try {
    const recentAuctions = await Auction.findAll({
      where: { seller_id: userId },
      limit: 3,
      order: [['created_at', 'DESC']]
    });

    const recentBids = await Bid.findAll({
      where: { bidder_id: userId },
      include: [{ model: Auction, as: 'Auction' }],
      limit: 3,
      order: [['bid_time', 'DESC']]
    });

    const activities = [];

    recentAuctions.forEach(auction => {
      activities.push({
        type: 'create',
        message: 'أنشأت مزاد جديد',
        details: auction.title,
        time: formatTimeAgo(auction.created_at),
        timestamp: auction.created_at
      });
    });

    recentBids.forEach(bid => {
      activities.push({
        type: 'bid',
        message: 'قدمت مزايدة',
        details: `على ${bid.Auction.title} بقيمة ${bid.amount} ر.س`,
        time: formatTimeAgo(bid.bid_time),
        timestamp: bid.bid_time
      });
    });

    const wonAuctions = await Auction.findAll({
      include: [{
        model: Bid,
        as: 'Bids',
        where: { bidder_id: userId },
        required: true
      }],
      where: { status: 'closed' },
      limit: 2,
      order: [['end_time', 'DESC']]
    });

    for (const auction of wonAuctions) {
      const maxBid = await Bid.findOne({
        where: { auction_id: auction.auction_id },
        order: [['amount', 'DESC']]
      });

      if (maxBid && maxBid.bidder_id === userId) {
        activities.push({
          type: 'win',
          message: 'فزت بمزاد',
          details: `${auction.title} بقيمة ${auction.current_price} ر.س`,
          time: formatTimeAgo(auction.end_time),
          timestamp: auction.end_time
        });
      }
    }

    // الترتيب الصحيح حسب التاريخ الفعلي
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return activities.slice(0, 5);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
};

// تحديث بيانات المستخدم
export const updateUserProfile = async (userId, updateData) => {
  try {
    const [affectedCount] = await User.update(updateData, {
      where: { user_id: userId }
    });

    if (affectedCount === 0) {
      throw new Error('User not found or no changes made');
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// دوال مساعدة
function calculateTimeLeft(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  if (diff <= 0) return 'انتهى';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diff = now - past;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  else if (hours < 24) return `منذ ${hours} ساعة`;
  else return `منذ ${days} يوم`;
}
// ======================== END ========================