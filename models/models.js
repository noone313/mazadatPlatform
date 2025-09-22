import { Sequelize, DataTypes } from "sequelize";
import { config } from "dotenv";
config();

const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
});


// ======================== MODELS ========================
const User = sequelize.define("User", {
  user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  address:{type:DataTypes.STRING(200) },
  phone: { type: DataTypes.STRING(20),unique:true },
  role: { type: DataTypes.ENUM("buyer","seller","admin"), defaultValue: "buyer" }, // buyer, seller, admin
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: "Users", timestamps: false });

const Category = sequelize.define("Category", {
  category_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
}, { tableName: "Categories", timestamps: false });

const Auction = sequelize.define("Auction", {
  auction_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  start_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  current_price: { type: DataTypes.DECIMAL(10, 2) },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  status: {type: DataTypes.ENUM("active", "closed", "cancelled"),defaultValue: "active"},
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: "Auctions", timestamps: false });

const Bid = sequelize.define("Bid", {
  bid_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  bid_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: "Bids", timestamps: false });

const Payment = sequelize.define("Payment", {
  payment_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_method: { type: DataTypes.STRING(50) },
  payment_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING(20), defaultValue: "pending" }, // pending, completed, failed
}, { tableName: "Payments", timestamps: false });

const Notification = sequelize.define("Notification", {
  notification_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  message: { type: DataTypes.TEXT, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: "Notifications", timestamps: false });

const AuctionImage = sequelize.define("AuctionImage", {
  image_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  image_url: { type: DataTypes.STRING(255), allowNull: false },
}, { tableName: "AuctionImages", timestamps: false });

// ======================== RELATIONS ========================

// User <-> Auction (seller)
User.hasMany(Auction, { foreignKey: "seller_id", onDelete: "CASCADE" });
Auction.belongsTo(User, { as: "Seller", foreignKey: "seller_id" });

// Category <-> Auction
Category.hasMany(Auction, { foreignKey: "category_id", onDelete: "SET NULL" });
Auction.belongsTo(Category, { foreignKey: "category_id", onDelete: "SET NULL" });

// Auction <-> Bid
Auction.hasMany(Bid, { foreignKey: "auction_id", onDelete: "CASCADE" });
Bid.belongsTo(Auction, { foreignKey: "auction_id", onDelete: "CASCADE" });

// User <-> Bid (bidder)
User.hasMany(Bid, { foreignKey: "bidder_id", onDelete: "CASCADE" });
Bid.belongsTo(User, { as: "Bidder", foreignKey: "bidder_id",onDelete: "CASCADE" });

// Auction <-> Payment
Auction.hasOne(Payment, { foreignKey: "auction_id", onDelete: "CASCADE" });
Payment.belongsTo(Auction, { foreignKey: "auction_id", onDelete: "CASCADE" });

// User <-> Payment (buyer)
User.hasMany(Payment, { foreignKey: "buyer_id", onDelete: "SET NULL" });
Payment.belongsTo(User, { foreignKey: "buyer_id", onDelete: "SET NULL" });

// User <-> Notification
User.hasMany(Notification, { foreignKey: "user_id", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });

// Auction <-> AuctionImage
Auction.hasMany(AuctionImage, { foreignKey: "auction_id", onDelete: "CASCADE" });
AuctionImage.belongsTo(Auction, { foreignKey: "auction_id", onDelete: "CASCADE" });

// ======================== START ========================
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ تم الاتصال بقاعدة البيانات");

    await sequelize.sync({ alter: true });
    console.log("🔄 تم تحديث الجداول تلقائيًا");
  } catch (error) {
    console.error("❌ خطأ فادح:", error);
    process.exit(1);
  }
};

export {
  sequelize,
  startServer,
  User,
  Category,
  Auction,
  Bid,
  Payment,
  Notification,
  AuctionImage,
};



