import axios from 'axios';
import Listing from '../models/listing.model.js';
import dotenv from 'dotenv';
import { getGroqListingsRecommendation } from './groqRecommendationService.js';
dotenv.config();

/**
 * Service to handle AI Real Estate Recommendations
 * Powered by Groq LLM (Llama 3.3 70B)
 */

/**
 * Generate embedding stub (Deprecated in favor of Groq Search)
 */
export const generateEmbedding = async (text) => null;

/**
 * Create a rich text representation of a listing for AI analysis (Groq or Vectors)
 */
export const createListingDescription = (listing) => {
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
 * Search listings using AI Recommendation (Groq Primary)
 */
export const vectorSearchListings = async (queryText, limit = 10) => {
    try {
        console.log("🚀 Invoking Groq AI Recommender for optimized search...");
        return await getGroqListingsRecommendation(queryText, limit);
    } catch (error) {
        console.error("AI Search Error:", error);
        return [];
    }
};

/**
 * Seed Missing Embeddings (Deprecated - now handled by real-time Groq)
 */
export const seedMissingEmbeddings = async () => {
    console.log("🌱 Embedding seeding is no longer required as we use real-time Groq Search.");
};
