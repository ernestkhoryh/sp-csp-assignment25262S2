const db = require('./databaseConfig');

const readAllTravelListings = async () => {
  const sql = `
    SELECT travelID, title, description, country,
           travelPeriod, price, imageURL, dateInserted
    FROM travel_listing
    ORDER BY dateInserted DESC
  `;

  const [rows] = await db.query(sql);
  return rows;
};

const searchTravellistingsByDescriptionSubstring = async (substring) => {
  const sql = `
    SELECT travelID, title, description, country,
           travelPeriod, price, imageURL, dateInserted
    FROM travel_listing
    WHERE description LIKE ?
    ORDER BY dateInserted DESC
  `;
  
  const likePattern = `%${substring}%`;
  const [rows] = await db.query(sql, [likePattern]);
  return rows;
}

const readTravelListingByTravelid = async (travelID) => {
  const sql = `
    SELECT travelID, title, description, country,
           travelPeriod, price, imageURL, dateInserted
    FROM travel_listing
    WHERE travelID = ?
  `;

  const [rows] = await db.query(sql, [travelID]);
  return rows[0]; // Return the first row (or undefined if not found)
};

const readItinerariesByTravelid = async (travelID) => {
  const sql = `
    SELECT itineraryID, travelID, day, activity
    FROM itinerary
    WHERE travelID = ?
    ORDER BY day ASC
  `;

  const [rows] = await db.query(sql, [travelID]);
  return rows;
};

const searchTravelListings = async (substring) => {
  const sql = `
    SELECT travelID, title, description, country,
           travelPeriod, price, imageURL, dateInserted
    FROM travel_listing
    WHERE description LIKE ?
    ORDER BY dateInserted DESC
  `;  
  const likePattern = `%${substring}%`;
  const [rows] = await db.query(sql, [likePattern]);
  return rows;
};


module.exports = {
  readAllTravelListings,  
  readTravelListingByTravelid,
  searchTravellistingsByDescriptionSubstring,

  readItinerariesByTravelid
};