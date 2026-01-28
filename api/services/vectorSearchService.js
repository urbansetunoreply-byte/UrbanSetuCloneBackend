import axios from 'axios';
import Listing from '../models/listing.model.js';
import dotenv from 'dotenv';
import { getGroqListingsRecommendation } from './groqRecommendationService.js';
dotenv.config();

/**
 * Service to handle Vector Embeddings using Hugging Face
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
 * Free Tier Friendly!
 */

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const HF_API_URL = "https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

/**
 * Generate embedding for a single text string
 * @param {string} text 
 * @returns {Promise<number[]>} 384-dimensional vector
 */
export const generateEmbedding = async (text) => {
    try {
        if (!text || !text.trim()) return null;

        // Clean text
        const cleanText = text.replace(/\n/g, ' ').trim();

        const headers = {
            'Content-Type': 'application/json'
        };
        // DISABLING TOKEN TEMPORARILY AS IT WAS GIVING 401
        // if (HF_TOKEN && HF_TOKEN.startsWith('hf_')) {
        //     headers['Authorization'] = `Bearer ${HF_TOKEN}`;
        // }

        const response = await axios.post(
            HF_API_URL,
            {
                inputs: cleanText,
                options: { wait_for_model: true }
            },
            { headers }
        );

        // Hugging Face returns just the array of numbers: [0.1, 0.2, ...]
        if (Array.isArray(response.data)) {
            // Handle edge case where it returns nested array like [[0.1, ...]] (batch mode)
            if (Array.isArray(response.data[0])) {
                return response.data[0];
            }
            return response.data;
        }

        throw new Error("Unexpected response format from Hugging Face");

    } catch (error) {
        if (error?.response?.data) {
            console.error("Embedding Error Details:", JSON.stringify(error.response.data, null, 2));
        }
        console.error("Embedding Error:", error?.response?.data || error.message);

        // Detailed HF Error Handling
        if (error?.response?.data?.error?.includes("Loading")) {
            // Model is loading (~20s wait), handled by wait_for_model: true usually, but just in case
            throw new Error("Model is loading, please try again in 30 seconds.");
        }

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
    const esgInfo = listing.esg?.esgScore ? `ESG Rating: ${listing.esg.esgRating || 'B'} with a sustainability score of ${listing.esg.esgScore}/100.` : "";
    const localityInfo = listing.localityScore?.overall ? `Locality safety score: ${listing.localityScore.safety}/10, with overall accessibility: ${listing.localityScore.overall}/10.` : "";
    const furnishInfo = listing.furnished ? 'fully furnished with modern appliances' : 'unfurnished, offering a blank canvas';

    return `
        Property: ${listing.name}.
        Location: ${listing.city}, ${listing.district}, ${listing.state}. Area: ${listing.address || listing.landmark || 'central location'}.
        Financials: ${listing.type === 'rent' ? 'Monthly rental' : 'For sale'} at ${listing.offer ? listing.discountPrice : listing.regularPrice} INR.
        Space: ${listing.bedrooms} BHK (${listing.bedrooms} Bed, ${listing.bathrooms} Bath). Floor: ${listing.floor || 'Ground'} level.
        Description: ${listing.description}.
        Amenities: ${furnishInfo}, ${listing.parking ? 'dedicated parking spaces available' : 'no parking'}.
        ${esgInfo}
        ${localityInfo}
        Style: High-end quality with ${listing.description.toLowerCase().includes('luxury') ? 'luxury' : 'standard'} finishes.
    `.trim().replace(/\s\s+/g, ' ');
};

/**
 * Calculate Cosine Similarity between two vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Score between -1 and 1 (1 = identical)
 */
export const cosineSimilarity = (vecA, vecB) => {
    // Safety check for dimensions mismatch
    if (vecA.length !== vecB.length) {
        // console.warn(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
        return -1;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Search listings using AI Recommendation (Groq Primary)
 * falls back to vector similarity ONLY if embeddings are available and API works
 * @param {string} queryText - User's natural language query
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Sorted listings
 */
export const vectorSearchListings = async (queryText, limit = 10) => {
    try {
        console.log("🚀 Invoking Groq AI Recommender for optimized search...");

        // Use Groq as the main intelligent engine
        const recommendations = await getGroqListingsRecommendation(queryText, limit);

        if (recommendations && recommendations.length > 0) {
            return recommendations;
        }

        // Emergency Fallback: Vector Search if Groq somehow fails
        console.warn("Groq failed, attempting vector fallback...");
        const queryVector = await generateEmbedding(queryText).catch(() => null);

        if (queryVector) {
            const listings = await Listing.find({
                vectorEmbedding: { $exists: true, $ne: [] },
                visibility: 'public'
            }).limit(limit);

            return listings.map(l => l.toObject());
        }

        return [];

    } catch (error) {
        console.error("AI Search Error:", error);
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

            // Rate Limit Safety: Wait 5 seconds between requests (HF Free Tier)
            await new Promise(resolve => setTimeout(resolve, 5000));

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
