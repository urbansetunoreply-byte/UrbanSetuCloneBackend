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

  // Base rent from listing - check multiple fields (monthlyRent, discountPrice, regularPrice)
  const baseRent = listing.monthlyRent || listing.discountPrice || listing.regularPrice || 0;

  // Calculate market average from similar properties
  let marketAverageRent = baseRent;
  if (similarProperties.length > 0) {
    const totalRent = similarProperties.reduce((sum, prop) => {
      // Check multiple price fields for similar properties
      const propRent = prop.monthlyRent || prop.discountPrice || prop.regularPrice || 0;
      return sum + propRent;
    }, 0);
    marketAverageRent = Math.round(totalRent / similarProperties.length);
  }

  // If no similar properties or market average is 0, use base rent as market average
  // If base rent is also 0, estimate based on property attributes
  if (marketAverageRent === 0) {
    if (baseRent > 0) {
      marketAverageRent = baseRent;
    } else {
      // Estimate base rent from property attributes if no price is set
      // Average rent per sqft in major Indian cities (approx ₹50-100 per sqft)
      const estimatedRentPerSqft = 75; // Mid-range estimate
      const estimatedBaseRent = (listing.area || 1000) * estimatedRentPerSqft;
      marketAverageRent = Math.round(estimatedBaseRent / 100) * 100; // Round to nearest 100
    }
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

  // Use actual listing rent if available, otherwise use predicted rent
  const actualRent = listing.monthlyRent || listing.discountPrice || listing.regularPrice || predictedRent;
  
  if (actualRent > 0 && marketAverageRent > 0) {
    priceDifference = ((actualRent - marketAverageRent) / marketAverageRent) * 100;
    
    if (priceDifference > 15) {
      priceComparison = 'overpriced';
    } else if (priceDifference < -15) {
      priceComparison = 'underpriced';
    } else {
      priceComparison = 'fair';
    }
  } else if (predictedRent > 0) {
    // If no actual rent, use predicted rent (should be close to market average)
    priceComparison = 'fair';
    priceDifference = 0;
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
export const calculateLocalityScore = (listing, neighborhoodData = {}, analyticsData = {}) => {
  // Base scores (can be enhanced with actual data from APIs like Google Places, etc.)
  const baseScore = 5.0; // Default middle score

  // Extract location data from analytics if available
  const locationData = analyticsData?.locationData || {};
  const amenities = locationData?.amenities || {};
  const transportData = locationData?.transportData || {};

  // Safety score (can be enhanced with crime data)
  // Use neighborhood data first, then analytics, then default
  const safety = neighborhoodData.safetyScore || 
                 analyticsData.safetyScore || 
                 (locationData.safety ? Math.min(10, locationData.safety) : baseScore);

  // Accessibility score (based on location, transport, and city)
  let accessibility = baseScore;
  if (listing.city) {
    // Major cities have better accessibility
    const majorCities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune', 'kolkata'];
    if (majorCities.includes(listing.city.toLowerCase())) {
      accessibility = 7.5;
    }
  }
  
  // Enhance accessibility based on transport data
  if (transportData.stations && Array.isArray(transportData.stations) && transportData.stations.length > 0) {
    // More transport stations = better accessibility (max 9.5)
    const stationCount = transportData.stations.length;
    accessibility = Math.min(9.5, accessibility + (stationCount * 0.3));
  }

  // Water availability (use neighborhood data or default)
  const waterAvailability = neighborhoodData.waterAvailability || 
                            analyticsData.waterAvailability || 
                            (locationData.waterSupply ? Math.min(10, locationData.waterSupply) : baseScore);

  // Schools (enhance with actual school data from analytics)
  let schools = baseScore;
  // Check schoolData first (from getSchoolData), then amenities
  if (analyticsData?.schoolData?.schools && Array.isArray(analyticsData.schoolData.schools)) {
    const schoolCount = analyticsData.schoolData.schools.length;
    // More schools = better score (1 school = 6.0, 5+ schools = 9.0)
    schools = Math.min(9.0, 5.0 + (schoolCount * 0.8));
  } else if (amenities.school && Array.isArray(amenities.school)) {
    const schoolCount = amenities.school.length;
    // More schools = better score (1 school = 6.0, 5+ schools = 9.0)
    schools = Math.min(9.0, 5.0 + (schoolCount * 0.8));
  } else if (amenities.schools && Array.isArray(amenities.schools)) {
    const schoolCount = amenities.schools.length;
    schools = Math.min(9.0, 5.0 + (schoolCount * 0.8));
  } else {
    schools = neighborhoodData.schoolScore || neighborhoodData.schools || baseScore;
  }

  // Offices (enhance with actual office/business data)
  let offices = baseScore;
  if (amenities.office && Array.isArray(amenities.office)) {
    const officeCount = amenities.office.length;
    // More offices = better for professionals (1 office = 6.0, 5+ offices = 9.0)
    offices = Math.min(9.0, 5.0 + (officeCount * 0.8));
  } else if (amenities.business && Array.isArray(amenities.business)) {
    const businessCount = amenities.business.length;
    offices = Math.min(9.0, 5.0 + (businessCount * 0.8));
  } else {
    offices = neighborhoodData.offices || neighborhoodData.office || baseScore;
  }

  // Traffic (inverse - less traffic is better)
  // Use traffic data from analytics or default
  let traffic = baseScore;
  if (locationData.traffic !== undefined) {
    // Lower traffic score is better, so invert (traffic score 0-10, where 10 is worst)
    traffic = Math.max(2.0, 10 - locationData.traffic);
  } else if (neighborhoodData.trafficScore !== undefined) {
    traffic = Math.max(2.0, 10 - neighborhoodData.trafficScore);
  } else {
    // Default: major cities have more traffic
    const majorCities = ['mumbai', 'delhi', 'bangalore'];
    if (listing.city && majorCities.includes(listing.city.toLowerCase())) {
      traffic = 4.5; // Slightly worse traffic in major cities
    }
  }

  // Grocery stores (enhance with actual data)
  let grocery = 6.0;
  if (amenities.grocery && Array.isArray(amenities.grocery)) {
    const groceryCount = amenities.grocery.length;
    // More grocery stores = better (1 store = 6.5, 5+ stores = 9.0)
    grocery = Math.min(9.0, 6.0 + (groceryCount * 0.6));
  } else if (amenities.supermarket && Array.isArray(amenities.supermarket)) {
    const marketCount = amenities.supermarket.length;
    grocery = Math.min(9.0, 6.0 + (marketCount * 0.6));
  } else {
    grocery = neighborhoodData.grocery || neighborhoodData.groceryStores || 6.0;
  }

  // Medical facilities (enhance with actual data)
  let medical = 6.0;
  if (amenities.hospital && Array.isArray(amenities.hospital)) {
    const hospitalCount = amenities.hospital.length;
    // More hospitals = better (1 hospital = 7.0, 3+ hospitals = 9.0)
    medical = Math.min(9.0, 6.0 + (hospitalCount * 1.0));
  } else if (amenities.medical && Array.isArray(amenities.medical)) {
    const medicalCount = amenities.medical.length;
    medical = Math.min(9.0, 6.0 + (medicalCount * 1.0));
  } else {
    medical = neighborhoodData.medical || neighborhoodData.hospitals || 6.0;
  }

  // Shopping (enhance with actual data)
  let shopping = 6.0;
  if (amenities.shopping && Array.isArray(amenities.shopping)) {
    const shoppingCount = amenities.shopping.length;
    // More shopping centers = better (1 center = 6.5, 5+ centers = 9.0)
    shopping = Math.min(9.0, 6.0 + (shoppingCount * 0.6));
  } else if (amenities.mall && Array.isArray(amenities.mall)) {
    const mallCount = amenities.mall.length;
    shopping = Math.min(9.0, 6.0 + (mallCount * 0.8));
  } else {
    shopping = neighborhoodData.shopping || neighborhoodData.shoppingCenters || 6.0;
  }

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

