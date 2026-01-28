import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model = null;

/**
 * Loads the MobileNet model if not already loaded
 */
export const loadModel = async () => {
    if (!model) {
        model = await mobilenet.load({
            version: 2,
            alpha: 1.0
        });
    }
    return model;
};

/**
 * Audit an image for quality and content
 * @param {HTMLImageElement|HTMLCanvasElement|ImageData} imageSource 
 */
export const auditImage = async (imageSource) => {
    try {
        const loadedModel = await loadModel();

        // 1. Content Prediction (What is in the image?)
        const predictions = await loadedModel.classify(imageSource);

        // 2. Technical Quality (Blur & Brightness)
        const quality = await checkTechnicalQuality(imageSource);

        return {
            predictions,
            quality,
            suggestions: generateSuggestions(predictions)
        };
    } catch (error) {
        console.error('Image Audit Error:', error);
        return null;
    }
};

/**
 * Analyzes brightness and basic contrast
 */
const checkTechnicalQuality = async (imageSource) => {
    const tensor = tf.browser.fromPixels(imageSource);

    // Calculate Mean Brightness
    const brightness = tf.mean(tensor).dataSync()[0];

    // Calculate Standard Deviation (for contrast)
    const std = tf.moments(tensor).variance.sqrt().dataSync()[0];

    tensor.dispose();

    return {
        brightness: brightness > 200 ? 'Too Bright' : brightness < 40 ? 'Too Dark' : 'Good',
        contrast: std < 20 ? 'Low Contrast' : 'Good',
        score: Math.min(100, Math.round((brightness / 255) * 50 + (std / 128) * 50))
    };
};

/**
 * Map generic ImageNet tags to Real Estate specific room names
 */
const generateSuggestions = (predictions) => {
    const tagMap = {
        'dining table': 'Dining Room',
        'studio couch': 'Living Room',
        'sofa': 'Living Room',
        'bed': 'Bedroom',
        'bathtub': 'Bathroom',
        'toilet': 'Washroom',
        'refrigerator': 'Kitchen',
        'microwave': 'Kitchen',
        'stove': 'Kitchen',
        'entertainment center': 'Media Room',
        'patio': 'Outdoor/Patio'
    };

    const detectedRooms = predictions
        .map(p => {
            const className = p.className.toLowerCase();
            const foundTag = Object.keys(tagMap).find(tag => className.includes(tag));
            return foundTag ? tagMap[foundTag] : null;
        })
        .filter(Boolean);

    return [...new Set(detectedRooms)]; // Return unique room suggestions
};
