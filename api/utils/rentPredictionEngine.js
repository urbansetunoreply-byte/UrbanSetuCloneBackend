/**
 * AI Rent Prediction Engine
 * Calculates rent predictions based on property features, location, and market data
 */

/**
 * Calculate predicted rent based on property features
 * @param {Object} listing - Property listing object
 * @param {Array} similarProperties - Array of similar properties with rent data
 * @returns {Object} Prediction results
 */
export const calculateRentPrediction = (listing, similarProperties = []) => {
  if (!listing || listing.type !== 'rent') {
    return null;
  }

  // Base rent from listing (if available)
  const baseRent = listing.monthlyRent || 0;

  // Calculate market average from similar properties
  let marketAverageRent = baseRent;
  if (similarProperties.length > 0) {
    const totalRent = similarProperties.reduce((sum, prop) => {
      return sum + (prop.monthlyRent || prop.regularPrice || 0);
    }, 0);
    marketAverageRent = Math.round(totalRent / similarProperties.length);
  }

  // If no similar properties, use base rent as market average
  if (marketAverageRent === 0 && baseRent > 0) {
    marketAverageRent = baseRent;
  }

  // Calculate predicted rent based on property features
  let predictedRent = marketAverageRent;

  // Adjust based on property size (area)
  if (listing.area) {
    const areaPerSqft = marketAverageRent / (listing.area || 1000);
    predictedRent = areaPerSqft * listing.area;
  }

  // Adjust based on bedrooms
  const bedroomMultiplier = {
    1: 0.85,
    2: 1.0,
    3: 1.15,
    4: 1.30,
    5: 1.45
  };
  const bedrooms = listing.bedrooms || 2;
  predictedRent *= (bedroomMultiplier[bedrooms] || 1.0);

  // Adjust based on bathrooms
  const bathroomMultiplier = {
    1: 0.90,
    2: 1.0,
    3: 1.10,
    4: 1.20
  };
  const bathrooms = listing.bathrooms || 2;
  predictedRent *= (bathroomMultiplier[bathrooms] || 1.0);

  // Adjust based on furnished status
  if (listing.furnished) {
    predictedRent *= 1.15; // 15% increase for furnished
  }

  // Adjust based on parking
  if (listing.parking) {
    predictedRent *= 1.10; // 10% increase for parking
  }

  // Adjust based on amenities
  let amenitiesMultiplier = 1.0;
  if (listing.amenities) {
    const amenityCount = Object.values(listing.amenities).filter(v => v === true).length;
    amenitiesMultiplier = 1 + (amenityCount * 0.02); // 2% per amenity
  }
  predictedRent *= amenitiesMultiplier;

  // Round to nearest 100
  predictedRent = Math.round(predictedRent / 100) * 100;

  // Calculate price comparison
  let priceComparison = 'fair';
  let priceDifference = 0;

  if (baseRent > 0) {
    priceDifference = ((baseRent - marketAverageRent) / marketAverageRent) * 100;
    
    if (priceDifference > 15) {
      priceComparison = 'overpriced';
    } else if (priceDifference < -15) {
      priceComparison = 'underpriced';
    } else {
      priceComparison = 'fair';
    }
  }

  // Generate influencing factors
  const influencingFactors = [];
  
  if (listing.furnished) {
    influencingFactors.push({
      factor: 'furnished',
      impact: 15,
      description: 'Furnished property increases rent value'
    });
  }

  if (listing.parking) {
    influencingFactors.push({
      factor: 'parking',
      impact: 10,
      description: 'Parking availability adds value'
    });
  }

  if (listing.area && listing.area > 1500) {
    influencingFactors.push({
      factor: 'size',
      impact: 12,
      description: 'Larger property size increases rent'
    });
  }

  if (bedrooms >= 4) {
    influencingFactors.push({
      factor: 'bedrooms',
      impact: 15,
      description: 'More bedrooms increase rent value'
    });
  }

  // Generate future rent predictions (next 3 years)
  const predictedFutureRent = [];
  const currentYear = new Date().getFullYear();
  const annualIncrease = 0.05; // 5% annual increase assumption

  for (let i = 1; i <= 3; i++) {
    const futureRent = Math.round(predictedRent * Math.pow(1 + annualIncrease, i));
    predictedFutureRent.push({
      year: currentYear + i,
      predictedRent: futureRent,
      confidence: 75 - (i * 5) // Decreasing confidence for further years
    });
  }

  return {
    predictedRent,
    marketAverageRent,
    priceComparison,
    priceDifference: Math.round(priceDifference * 10) / 10,
    predictedFutureRent,
    influencingFactors,
    dataPointsUsed: similarProperties.length,
    similarPropertiesCount: similarProperties.length
  };
};

/**
 * Calculate locality score based on property location and nearby amenities
 * @param {Object} listing - Property listing object
 * @param {Object} neighborhoodData - Optional neighborhood data
 * @returns {Object} Locality score breakdown
 */
export const calculateLocalityScore = (listing, neighborhoodData = {}) => {
  // Base scores (can be enhanced with actual data from APIs like Google Places, etc.)
  const baseScore = 5.0; // Default middle score

  // Safety score (can be enhanced with crime data)
  const safety = neighborhoodData.safetyScore || baseScore;

  // Accessibility score (based on location and transport)
  let accessibility = baseScore;
  if (listing.city) {
    // Major cities have better accessibility
    const majorCities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune', 'kolkata'];
    if (majorCities.includes(listing.city.toLowerCase())) {
      accessibility = 7.5;
    }
  }

  // Water availability (default assumption)
  const waterAvailability = neighborhoodData.waterAvailability || baseScore;

  // Schools (can be enhanced with actual school data)
  const schools = neighborhoodData.schoolScore || baseScore;

  // Offices (can be enhanced with business district data)
  const offices = neighborhoodData.offices || baseScore;

  // Traffic (inverse - less traffic is better)
  const traffic = neighborhoodData.trafficScore ? (10 - neighborhoodData.trafficScore) : baseScore;

  // Grocery stores (default assumption)
  const grocery = neighborhoodData.grocery || 6.0;

  // Medical facilities (default assumption)
  const medical = neighborhoodData.medical || 6.0;

  // Shopping (default assumption)
  const shopping = neighborhoodData.shopping || 6.0;

  // Calculate overall score using weighted average
  const weights = {
    safety: 0.20,
    accessibility: 0.15,
    waterAvailability: 0.10,
    schools: 0.10,
    offices: 0.10,
    traffic: 0.10,
    grocery: 0.10,
    medical: 0.08,
    shopping: 0.07
  };

  const overall = 
    (safety * weights.safety) +
    (accessibility * weights.accessibility) +
    (waterAvailability * weights.waterAvailability) +
    (schools * weights.schools) +
    (offices * weights.offices) +
    (traffic * weights.traffic) +
    (grocery * weights.grocery) +
    (medical * weights.medical) +
    (shopping * weights.shopping);

  return {
    safety: Math.round(safety * 10) / 10,
    accessibility: Math.round(accessibility * 10) / 10,
    waterAvailability: Math.round(waterAvailability * 10) / 10,
    schools: Math.round(schools * 10) / 10,
    offices: Math.round(offices * 10) / 10,
    traffic: Math.round(traffic * 10) / 10,
    grocery: Math.round(grocery * 10) / 10,
    medical: Math.round(medical * 10) / 10,
    shopping: Math.round(shopping * 10) / 10,
    overall: Math.round(overall * 10) / 10
  };
};

/**
 * Find similar properties for comparison
 * @param {Object} listing - Property listing object
 * @param {Array} allListings - All rental listings
 * @param {Number} limit - Maximum number of similar properties
 * @returns {Array} Similar properties
 */
export const findSimilarProperties = (listing, allListings = [], limit = 10) => {
  if (!listing || allListings.length === 0) {
    return [];
  }

  // Filter only rental properties
  const rentalListings = allListings.filter(l => 
    l.type === 'rent' && 
    l._id?.toString() !== listing._id?.toString()
  );

  // Score similarity based on:
  // 1. Same city (high weight)
  // 2. Similar bedrooms (high weight)
  // 3. Similar area (medium weight)
  // 4. Similar bathrooms (low weight)

  const scored = rentalListings.map(prop => {
    let score = 0;

    // City match
    if (prop.city && listing.city && prop.city.toLowerCase() === listing.city.toLowerCase()) {
      score += 50;
    }

    // Bedrooms match
    const bedroomDiff = Math.abs((prop.bedrooms || 0) - (listing.bedrooms || 0));
    score += Math.max(0, 30 - (bedroomDiff * 10));

    // Area similarity (within 20% difference)
    if (prop.area && listing.area) {
      const areaDiff = Math.abs(prop.area - listing.area) / listing.area;
      if (areaDiff <= 0.2) {
        score += 15;
      } else if (areaDiff <= 0.4) {
        score += 8;
      }
    }

    // Bathrooms match
    const bathroomDiff = Math.abs((prop.bathrooms || 0) - (listing.bathrooms || 0));
    score += Math.max(0, 5 - (bathroomDiff * 2));

    return { property: prop, score };
  });

  // Sort by score and return top matches
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.property);
};

