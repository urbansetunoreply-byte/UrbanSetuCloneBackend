
import axios from 'axios';
import Listing from '../models/listing.model.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Service to handle Vector Embeddings using OpenAI
 * Model: text-embedding-3-small (Cost effective and high performance)
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';

/**
 * Generate embedding for a single text string
 * @param {string} text 
 * @returns {Promise<number[]>} 1536-dimensional vector
 */
export const generateEmbedding = async (text) => {
    try {
        if (!text || !text.trim()) return null;

        // Clean text to avoid newline issues
        const cleanText = text.replace(/\n/g, ' ');

        const response = await axios.post(
            EMBEDDING_URL,
            {
                input: cleanText,
                model: "text-embedding-3-small"
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.data[0].embedding;
    } catch (error) {
        console.error("Embedding Error:", error?.response?.data || error.message);
        throw error;
    }
};

/**
 * Create a rich text representation of a listing for embedding
 * @param {Object} listing 
 * @returns {string} Optimized text description
 */
export const createListingDescription = (listing) => {
    // Combine all relevant fields into a semantic paragraph
    // This gives the AI context about "vibe", "location", and "features"

    return `
        Property Name: ${listing.name}.
        Description: ${listing.description}.
        Type: ${listing.type} property in ${listing.city}, ${listing.state}.
        Location: ${listing.address}.
        Features: ${listing.bedrooms} Bedrooms, ${listing.bathrooms} Bathrooms, ${listing.area || 'unknown'} sq ft.
        Price: ${listing.offer ? listing.discountPrice : listing.regularPrice} INR.
        Amenities: ${listing.furnished ? 'Furnished' : 'Unfurnished'}, ${listing.parking ? 'Parking available' : 'No parking'}.
        Vibe: ${listing.description.includes('modern') ? 'Modern' : 'Traditional'} style living.
    `.trim();
};

/**
 * Calculate Cosine Similarity between two vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Score between -1 and 1 (1 = identical)
 */
export const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Search listings using Vector Similarity
 * @param {string} queryText - User's natural language query
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Sorted listings
 */
export const vectorSearchListings = async (queryText, limit = 5) => {
    try {
        // 1. Generate vector for the user's query
        const queryVector = await generateEmbedding(queryText);
        if (!queryVector) return [];

        // 2. Fetch all listings with embeddings (Pro-tip: In production, use Pinecone/MongoDB Atlas Vector Search)
        // Since we are using standard MongoDB for now, we have to fetch and calculate in-memory.
        // This is fine for < 5000 listings.

        const listings = await Listing.find({
            vectorEmbedding: { $exists: true, $ne: [] },
            visibility: 'public' // Only show public listings
        }).select('+vectorEmbedding name description city regularPrice imageUrls type bedrooms bathrooms area');

        // 3. Calculate similarity scores
        const scoredListings = listings.map(listing => {
            const score = cosineSimilarity(queryVector, listing.vectorEmbedding);
            return {
                ...listing.toObject(),
                similarityScore: score
            };
        });

        // 4. Sort by highest similarity
        scoredListings.sort((a, b) => b.similarityScore - a.similarityScore);

        // 5. Return top N results (removing the heavy vector data)
        return scoredListings.slice(0, limit).map(({ vectorEmbedding, ...rest }) => rest);

    } catch (error) {
        console.error("Vector Search Error:", error);
        return [];
    }
};

/**
 * Background Job: Seed Embeddings for listings that lack them
 * Designed to key OpenAI Rate Limits in mind (Free Tier friendly)
 */
export const seedMissingEmbeddings = async () => {
    console.log("🌱 Starting Vector Embeddings Seeding...");

    // Find listings without embeddings
    const listings = await Listing.find({
        vectorEmbedding: { $exists: false }
    }).limit(50); // Process in small batches

    console.log(`Found ${listings.length} listings pending embedding generation.`);

    for (const listing of listings) {
        try {
            const text = createListingDescription(listing);
            const vector = await generateEmbedding(text);

            listing.vectorEmbedding = vector;
            await listing.save();

            console.log(`✅ Embedded: ${listing.name}`);

            // Rate Limit Safety: Wait 2 seconds between requests
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`Failed to embed listing ${listing._id}:`, error.message);
            // If Rate Limit hit, stop for 20 seconds
            if (error?.response?.status === 429) {
                console.log("⏳ Rate Limit Hit. Pausing for 20 seconds...");
                await new Promise(resolve => setTimeout(resolve, 20000));
            }
        }
    }

    console.log("🌱 Batch Seeding Complete.");
};
