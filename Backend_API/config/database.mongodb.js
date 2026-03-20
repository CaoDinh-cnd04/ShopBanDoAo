/**
 * MongoDB (Atlas) connection
 * Set MONGODB_URI trong .env (lấy từ MongoDB Atlas → Connect → Connection string).
 */
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'SportsEcommerce';

let client = null;
let db = null;

/**
 * Kết nối tới MongoDB Atlas (hoặc MongoDB local).
 * Gọi 1 lần khi start server.
 */
const connectMongo = async () => {
    if (client) return client;
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log('✅ Connected to MongoDB');
        return client;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        throw err;
    }
};

/**
 * Lấy instance database (sau khi đã connect).
 * Dùng trong controller: const db = getDb(); db.collection('users').find()...
 */
const getDb = () => {
    if (!db) {
        throw new Error('MongoDB chưa kết nối. Gọi connectMongo() trước (ví dụ trong server.js).');
    }
    return db;
};

/**
 * Đóng kết nối (graceful shutdown).
 */
const closeMongo = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB connection closed');
    }
};

module.exports = {
    connectMongo,
    getDb,
    closeMongo,
    dbName,
    ObjectId
};
