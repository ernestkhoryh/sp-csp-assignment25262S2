// \backend\src\model\adminModel.js

const db = require('./databaseConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'config'));

// Get all admins
const readAllUsers = async () => {
  const [rows] = await db.query('SELECT * FROM user');
  return rows;
};

// Get admin by userid
const readUserByUserid = async (userid) => {
  const [rows] = await db.query(
    'SELECT * FROM user WHERE userid = ?',
    [userid]
  );
  return rows[0];
};

// Insert admin
const createUser = async (username, email, role, password) => {
  try {
    console.log('=== REGISTRATION DEBUG ===');
    console.log('Input password:', password);
    console.log('Input password length:', password.length);
    
    // Fresh hash creation
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hash created:', hashedPassword);
    const [result] = await db.query(
      'INSERT INTO user (username, email, role, password) VALUES (?, ?, ?, ?)',
      [username, email, role, hashedPassword]
    );
    
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update admin - handles all fields (except userid)
const updateUserByUserid = async (userid, updateData) => {
  const allowedFields = ['username', 'email', 'role', 'password'];
  const updates = [];
  const values = [];
  
  // Build dynamic update query based on provided fields
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      if (key === 'password') {
        // Only hash password if it's a non-empty string
        if (value && typeof value === 'string' && value.trim() !== '') {
          const hashedPassword = await bcrypt.hash(value.trim(), 10);
          updates.push(`${key} = ?`);
          values.push(hashedPassword);
        } else {
          // Skip password update if empty/null/undefined
          continue;
        }
      } else {
        // Add other fields directly (skip if null/undefined)
        if (value !== null && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    }
  }
  
  // If no valid fields to update
  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  // Add userid to the end of values array
  values.push(userid);
  
  const query = `UPDATE user SET ${updates.join(', ')} WHERE userid = ?`;
  
  const [result] = await db.query(query, values);
  return result;
};

// Delete admin
const dropUserByUserid = async (userid) => {
  const [result] = await db.query(
    'DELETE FROM user WHERE userid = ?',
    [userid]
  );
  return result;
};

// Login - accepts email or username
const loginModelByCred = async (identifier, password) => {
  console.log('\n=== LOGIN FUNCTION CALLED ===');
  console.log('Identifier:', identifier);
  console.log('Password:', password);
  console.log('Input password length:', password.length);

  // Determine if identifier is email or username
  const isEmail = identifier.includes('@');
  const queryField = isEmail ? 'email' : 'username';
  
  console.log('Querying by:', queryField);
  
  const [rows] = await db.query(
    `SELECT * FROM user WHERE ${queryField} = ?`,
    [identifier]
  );

  console.log('Rows found:', rows.length);
  
  if (rows.length === 0) {
    console.log('No user found');
    return null;
  }

  const user = rows[0];
  console.log('User found:', user.username);
  console.log('DB password full:', user.password);
  console.log('DB password length:', user.password.length);

  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Password match:', isMatch);

  if (!isMatch) {
    console.log('Password does not match');
    return null;
  }

  const payload = {
    userid: user.userid,
    username: user.username,
    role: user.role
  };

  console.log('Login successful, creating token');
 const token = jwt.sign(payload, config.secretKey, { expiresIn: '24h' });
  return { token, user: payload };
};




// Create travel listing
const insertTravelListing = async (data, callback) => {
  try {
    const [result] = await db.query(
      `INSERT INTO travel_listing (title, description, country, travelPeriod, price, imageURL, dateInserted)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.country,
        data.travelPeriod,
        data.price,
        data.imageURL,
        data.dateInserted,
      ]
    );
    callback(null, result);
  } catch (error) {
    callback(error);
  }
};

// ================ ITINERARY FUNCTIONS =================

const selectItineraryByTravelId = async (travelID, callback) => {
  try {
    const [rows] = await db.query(
      'SELECT itineraryID, travelID, day, activity FROM itinerary WHERE travelID = ? ORDER BY day ASC',
      [travelID]
    );
    callback(null, rows);
  } catch (error) {
    callback(error);
  }
};

const selectItineraryByItineraryId = async (itineraryID, callback) => {
  try {
    const [rows] = await db.query(
      'SELECT itineraryID, travelID, day, activity FROM itinerary WHERE itineraryID = ?',
      [itineraryID]
    );
    callback(null, rows);
  } catch (error) {
    callback(error);
  }
};

const updateItineraryByItineraryId = async (itineraryID, data, callback) => {
  try {
    const [result] = await db.query(
      'UPDATE itinerary SET travelID = ?, day = ?, activity = ? WHERE itineraryID = ?',
      [data.travelID, data.day, JSON.stringify(data.activity), itineraryID]
    );
    callback(null, result);
  } catch (error) {
    callback(error);
  }
};

const deleteItineraryByItineraryId = async (itineraryID, callback) => {
  try {
    const [result] = await db.query(
      'DELETE FROM itinerary WHERE itineraryID = ?',
      [itineraryID]
    );
    callback(null, result);
  } catch (error) {
    callback(error);
  }
};

// =========== TRAVEL-LISTING MODEL FUNCTIONS (DATABASE OPERATIONS ONLY) ===========

// Create travel listing
const createTravelListing = async (title, description, country, travelPeriod, price, imageURL) => {
  const [result] = await db.query(
    'INSERT INTO travel_listing (title, description, country, travelPeriod, price, imageURL) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, country, travelPeriod, price, imageURL]
  );
  return result;
};

// Update travel listing
const updateTravelListingByTravelid = async (travelID, title, description, country, travelPeriod, price, imageURL) => {
  const [result] = await db.query(
    'UPDATE travel_listing SET title = ?, description = ?, country = ?, travelPeriod = ?, price = ?, imageURL = ? WHERE travelID = ?',
    [title, description, country, travelPeriod, price, imageURL, travelID]
  );
  return result;
};

// Delete travel listing
const dropTravelListingByTravelid = async (travelID) => {
  const [result] = await db.query(
    'DELETE FROM travel_listing WHERE travelID = ?',
    [travelID]
  );
  return result;
};


// =========== ITINERARY MODEL FUNCTIONS (DATABASE OPERATIONS ONLY) ===========

// Read All Itineraries

// Read all itineraries
const readAllItineraries = async () => {
  const [rows] = await db.query(
    `SELECT itineraryID, travelID, day, activity
     FROM itinerary
     ORDER BY travelID ASC, day ASC`
  );

  return rows;};

const readItineraryByItineraryid = async (ItineraryID)=> {
  const [rows] = await db.query(
    `SELECT itineraryID, travelID, day, activity
     FROM itinerary
     WHERE itineraryID = ?`,[ItineraryID]
  );
  return rows[0];
};


// Create Itinerary
const createItineraryByTravelid = async(travelID, data) => {
  const [result] = await db.query(
    'INSERT INTO itinerary (travelID, day, activity) VALUES (?,?,?)',
            [travelID, data.day, JSON.stringify(data.activity)]
           );
  return result;
};

// Update itinerary - DEBUGGED MODEL FUNCTION
const updateItineraryByItineraryid = async (itineraryID, data) => {
  console.log('=== DEBUG MODEL FUNCTION ===');
  console.log('itineraryID:', itineraryID);
  console.log('data object:', data);
  console.log('Values being passed to query:', {
    travelID: data.travelID,
    day: data.day,
    activity: data.activity,
    itineraryID: itineraryID
  });
  
  const [result] = await db.query(
    'UPDATE itinerary SET travelID = ?, day = ?, activity = ? WHERE itineraryID = ?',
    [data.travelID, data.day, data.activity, itineraryID]
  );
  
  console.log('Query executed successfully');
  return result;
};

// Delete travel listing
const dropItineraryByItineraryid = async (itineraryID) => {
  const [result] = await db.query(
    'DELETE FROM itinerary WHERE itineraryID = ?',
    [itineraryID]
  );
  return result;
};

module.exports = {

// Travel-listing functions
readAllUsers,
readUserByUserid,
createUser,
updateUserByUserid,
dropUserByUserid,
loginModelByCred,

// Travel-listing functions
createTravelListing,
updateTravelListingByTravelid,
dropTravelListingByTravelid,

// Itinerary functions
readAllItineraries,
readItineraryByItineraryid,
createItineraryByTravelid,
updateItineraryByItineraryid,
dropItineraryByItineraryid

};