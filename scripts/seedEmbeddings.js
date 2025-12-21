import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedMissingEmbeddings } from '../api/services/vectorSearchService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
dotenv.config({ path: 'api/.env' });

const runSeeder = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");

        // Support both naming conventions
        const mongoUri = process.env.MONGO_URI || process.env.MONGO;

        if (!mongoUri) {
            throw new Error("MONGO URI is missing in .env");
        }

        await mongoose.connect(mongoUri);
        console.log("✅ Connected to Database.");

        console.log("🚀 Starting Embedding Process...");
        console.log("Note: This script runs slowly (2s delay) to stay within Free Tier limits.");

        await seedMissingEmbeddings();

        console.log("✨ Seeding Completed Successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeder Failed:", error);
        process.exit(1);
    }
};

runSeeder();
