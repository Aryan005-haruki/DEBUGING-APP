const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

/**
 * PHASE 1: Storage Service
 * Store crawl results in MongoDB or fallback to JSON files
 */

const MONGO_URI = process.env.MONGO_URI || null;
const DB_NAME = 'healthchecker';
const COLLECTION_NAME = 'crawls';
const FALLBACK_DIR = path.join(__dirname, '../../data/crawls');

let mongoClient = null;
let db = null;

/**
 * Initialize storage (MongoDB or file-based)
 */
exports.init = async () => {
    if (MONGO_URI) {
        try {
            mongoClient = new MongoClient(MONGO_URI);
            await mongoClient.connect();
            db = mongoClient.db(DB_NAME);
            console.log('✅ Connected to MongoDB');
            return 'mongodb';
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            console.log('📁 Falling back to file-based storage');
            await ensureFallbackDir();
            return 'file';
        }
    } else {
        console.log('📁 Using file-based storage (MongoDB URI not configured)');
        await ensureFallbackDir();
        return 'file';
    }
};

async function ensureFallbackDir() {
    try {
        await fs.mkdir(FALLBACK_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create storage directory:', error);
    }
}

/**
 * Save crawl results
 */
exports.saveCrawl = async (crawlData) => {
    try {
        if (db) {
            // MongoDB storage
            const result = await db.collection(COLLECTION_NAME).insertOne({
                ...crawlData,
                savedAt: new Date()
            });
            console.log(`💾 Saved crawl to MongoDB: ${crawlData.crawlId}`);
            return { storage: 'mongodb', id: result.insertedId };
        } else {
            // File-based storage
            const filename = `${crawlData.crawlId}.json`;
            const filepath = path.join(FALLBACK_DIR, filename);
            await fs.writeFile(filepath, JSON.stringify(crawlData, null, 2));
            console.log(`💾 Saved crawl to file: ${filename}`);
            return { storage: 'file', path: filepath };
        }
    } catch (error) {
        console.error('Failed to save crawl:', error);
        throw error;
    }
};

/**
 * Get crawl by ID
 */
exports.getCrawl = async (crawlId) => {
    try {
        if (db) {
            // MongoDB retrieval
            const crawl = await db.collection(COLLECTION_NAME).findOne({ crawlId });
            return crawl;
        } else {
            // File-based retrieval
            const filename = `${crawlId}.json`;
            const filepath = path.join(FALLBACK_DIR, filename);
            const data = await fs.readFile(filepath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to get crawl:', error);
        return null;
    }
};

/**
 * Get recent crawls for a website
 */
exports.getRecentCrawls = async (websiteUrl, limit = 10) => {
    try {
        if (db) {
            // MongoDB query
            const crawls = await db.collection(COLLECTION_NAME)
                .find({ website: websiteUrl })
                .sort({ crawledAt: -1 })
                .limit(limit)
                .toArray();
            return crawls;
        } else {
            // File-based search
            const files = await fs.readdir(FALLBACK_DIR);
            const crawls = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filepath = path.join(FALLBACK_DIR, file);
                    const data = await fs.readFile(filepath, 'utf8');
                    const crawl = JSON.parse(data);
                    if (crawl.website === websiteUrl) {
                        crawls.push(crawl);
                    }
                }
            }

            // Sort by date and limit
            return crawls
                .sort((a, b) => new Date(b.crawledAt) - new Date(a.crawledAt))
                .slice(0, limit);
        }
    } catch (error) {
        console.error('Failed to get recent crawls:', error);
        return [];
    }
};

/**
 * Delete old crawls (cleanup)
 */
exports.cleanupOldCrawls = async (daysOld = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        if (db) {
            // MongoDB cleanup
            const result = await db.collection(COLLECTION_NAME).deleteMany({
                crawledAt: { $lt: cutoffDate.toISOString() }
            });
            console.log(`🧹 Deleted ${result.deletedCount} old crawls from MongoDB`);
            return result.deletedCount;
        } else {
            // File-based cleanup
            const files = await fs.readdir(FALLBACK_DIR);
            let deletedCount = 0;

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filepath = path.join(FALLBACK_DIR, file);
                    const data = await fs.readFile(filepath, 'utf8');
                    const crawl = JSON.parse(data);

                    if (new Date(crawl.crawledAt) < cutoffDate) {
                        await fs.unlink(filepath);
                        deletedCount++;
                    }
                }
            }

            console.log(`🧹 Deleted ${deletedCount} old crawl files`);
            return deletedCount;
        }
    } catch (error) {
        console.error('Failed to cleanup old crawls:', error);
        return 0;
    }
};

/**
 * Get storage statistics
 */
exports.getStats = async () => {
    try {
        if (db) {
            // MongoDB stats
            const totalCrawls = await db.collection(COLLECTION_NAME).countDocuments();
            const recentCrawls = await db.collection(COLLECTION_NAME).countDocuments({
                crawledAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
            });

            return {
                storage: 'mongodb',
                totalCrawls,
                recentCrawls: recentCrawls,
                connected: true
            };
        } else {
            // File-based stats
            const files = await fs.readdir(FALLBACK_DIR);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            return {
                storage: 'file',
                totalCrawls: jsonFiles.length,
                storageDir: FALLBACK_DIR,
                connected: true
            };
        }
    } catch (error) {
        return {
            storage: 'unknown',
            connected: false,
            error: error.message
        };
    }
};

/**
 * Close database connection
 */
exports.close = async () => {
    if (mongoClient) {
        await mongoClient.close();
        console.log('🔌 Closed MongoDB connection');
    }
};

module.exports = exports;
