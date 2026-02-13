// \backend\src\controller\adminController.js

const adminModel = require('../model/adminModel');

const bcrypt = require('bcrypt');

// Debug: Immediately check if import worked
console.log('=== ADMIN CONTROLLER LOADED ===');
console.log('adminModel exists?', !!adminModel);
if (adminModel) {
  console.log('adminModel methods:', Object.keys(adminModel));
  console.log('loginModelByCred available?', !!adminModel.loginModelByCred);
} else {
  console.log('ERROR: adminModel is null or undefined!');
}

// ================ ADMIN FUNCTIONS =================
// Admin login

const loginControl = async (req, res, next) => {

  console.log('loginControl called with body:', req.body);
  
  // Try to get identifier from either email or username field
  const { email, username, password } = req.body;
  const identifier = email || username;
  
  console.log('Calling loginModelByCred with:', { identifier, password });
  
  try {
    const authResult = await adminModel.loginModelByCred(identifier, password);
 // If token is null, login failed
    if (!authResult || !authResult.token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email/username or password' 
      });
    }
    
    // Login successful - return token
    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      token: authResult.token,
      // Optional: include user info
      user: authResult.user
    });
  } catch (error) {
    console.error('Error in loginControl:', error.message);
    console.error('Full error:', error);

    // Handle specific database errors
    if (error.code === 'ER_PARSE_ERROR') {
      return res.status(500).json({ 
        success: false, 
        message: 'Database query error' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
};

const testToken = (req, res) => {
  res.status(200).json({
    success: true,    
        message: 'Token is valid!',
    user: req.user, // This comes from your JWT middleware
    timestamp: new Date().toISOString()  });
}

// Middleware to check if username or email already exists

const checkUsernameOrEmailExist = async (req, res, next) => {
  const data = { email: req.body.email, username: req.body.username, password: req.body.password };
  
  console.log('checkUsernameOrEmailExist called with:', data);
  
  // Check email first
  if (data.email) {
    adminModel.validateEmail(data.email, (emailError, emailResults) => {
      if (emailError) {
        console.error("Error checking email:", emailError);
        return res.status(500).json({
          success: false,
          error: { message: "Error checking email existence" }
        });
      }
      
      if (emailResults && emailResults.length > 0) {
        return res.status(409).json({
          success: false,
          error: { message: "Email already exists" }
        });
      }
      
      // Email is available, now check username if provided
      if (data.username) {
        adminModel.validateUsername(data.username, (usernameError, usernameResults) => {
          if (usernameError) {
            console.error("Error checking username:", usernameError);
            return res.status(500).json({
              success: false,
              error: { message: "Error checking username existence" }
            });
          }
          
          if (usernameResults && usernameResults.length > 0) {
            return res.status(409).json({
              success: false,
              error: { message: "Username already exists" }
            });
          }
          
          // Both are available
          next();
        });
      } else {
        // No username to check
        next();
      }
    });
  } else {
    // No email provided - maybe just checking username
    if (data.username) {
      adminModel.validateUsername(data.username, (usernameError, usernameResults) => {
        if (usernameError) {
          console.error("Error checking username:", usernameError);
          return res.status(500).json({
            success: false,
            error: { message: "Error checking username existence" }
          });
        }
        
        if (usernameResults && usernameResults.length > 0) {
          return res.status(409).json({
            success: false,
            error: { message: "Username already exists" }
          });
        }
        
        next();
      });
    } else {
      // Neither email nor username provided
      return res.status(400).json({
        success: false,
        error: { message: "Email or username required" }
      });
    }
  }
};
    
const postUser = async (req, res, next) => { 

  console.log('\n=== POST USER CONTROLLER ===');
  console.log('Request body:', req.body);

  const userid = req.params.userid;
  const updateData = req.params.body;

    try {
        const { email, username, password, role = 'admin' } = req.body;
        
        // Validate required fields
        if (!email || !username || !password) {
            return res.status(400).json({
                success: false,
                error: { message: "At least one of Email, username, and password is required" }
            });
        }              

        const result = await adminModel.createUser(username, email, role, password);
        console.log('User created successfully');

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                insertId: result.insertId,
                email: email,
                username: username,
                role: role
            }
        });
        
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            error: { message: "Error creating user", details: error.message }
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const results = await adminModel.readAllUsers();
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: error.message });
    }
};  

const getUserByUserid = async (req, res) => {
    const userid = req.params.userid;
    try {
        const results = await adminModel.readUserByUserid(userid);
        if (!results) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: error.message });
    }
};

const putUserByUserid = async (req, res) => {
    console.log('=== PUT USER START ===');
    console.log('User ID:', req.params.userid);
    console.log('Update data:', req.body);
    
    const userid = req.params.userid;
    const updateData = req.body;
    
    try {
        console.log('About to call model function...');
        const result = await adminModel.updateUserByUserid(userid, updateData);
        console.log('Model function completed successfully');
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: result
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
    console.log('=== PUT USER END ===');
};

const delUserByUserid = async (req, res) => {
    const userid = req.params.userid;
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({ error: error.message });
        } else {
            res.status(204).send();
        }
    };
    adminModel.dropUserByUserid(userid, callback);
};

// ================ TRAVEL LISTING FUNCTIONS =================

// Create new travel listing
const postTravelListing = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    const {
      title,
      description,
      country,
      travelPeriod,
      price,
      imageURL
    } = req.body;

    // Validate required fields
    if (!title || !description || !country || !travelPeriod || !price || !imageURL) {
      return res.status(400).json({
        success: false,
        error: { message: "All fields are required: title, description, country, travelPeriod, price, imageURL" }
      });
    }

    // Call model function (this should return a promise, not expect response object)
    const result = await adminModel.createTravelListing(
      title,
      description,
      country,
      travelPeriod,
      price,
      imageURL
    );

    res.status(201).json({
      success: true,
       result,
      insertedId: result.insertId
    });
  } catch (error) {
    console.error("Error creating travel listing:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const putTravelListingByTravelid = async (req, res) => {
  try {
    const travelID = req.params.travelID;
    
    const {
      title,
      description,
      country,
      travelPeriod,
      price,
      imageURL
    } = req.body;

    // Call model function (returns a promise)
    const result = await adminModel.updateTravelListingByTravelid(
      travelID,       
      title,
      description,
      country,
      travelPeriod,
      price,
      imageURL
    );

    res.status(200).json({
      success: true,
       result
    });
  } catch (error) {
    console.error("Error updating travel listing:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete listing
const delTravelListingByTravelid = async (req, res) => {
  try {
    const travelID = req.params.travelID;

    // Call model function (returns a promise)
    const result = await adminModel.dropTravelListingByTravelid(travelID);

    res.status(200).json({  // Changed from 204 to 200 to return data
      success: true,
      message: 'Travel listing deleted successfully',
       result
    });
  } catch (error) {
    console.error("Error deleting travel listing:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================ ITINERARY FUNCTIONS =================

// Get all itineraries

const getAllItineraries = async (req, res) => {
  try {
    // Call the model function (which returns a promise)
    const results = await adminModel.readAllItineraries();
    
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching all itineraries:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get itinerary by itineraryID
const getItineraryByItineraryid = async (req, res) => {
  try {
    const itineraryID = req.params.itineraryID;

    // Call model function (returns a promise)
    const result = await adminModel.readItineraryByItineraryid(itineraryID);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create itinerary
const postItineraryByTravelid = async (req, res) => {
  try {
    const travelID = req.params.travelID;

    console.log('🔍 === DEBUG START ===');
    console.log('🔍 travelID:', travelID, 'type:', typeof travelID);
    console.log('🔍 req.body:', req.body);
    console.log('🔍 req.body.day:', req.body.day, 'type:', typeof req.body.day);
    console.log('🔍 req.body.activity:', req.body.activity);

    const data = {
      day: req.body.day,
      activity: req.body.activity
    };

    // Validate required fields
    if (!data.day || !data.activity) {
      return res.status(400).json({
        success: false,
        error: { message: "Day and activity are required" }
      });
    }

    // Call model function (returns a promise)
    const result = await adminModel.createItineraryByTravelid(travelID, data);

    res.status(201).json({
      success: true,
      data: {
        itineraryID: result.insertId,
        travelID: travelID,
        day: data.day,
        activity: data.activity
      }
    });
  } catch (error) {
    console.error("Error creating itinerary:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update itinerary - CORRECTED CONTROLLER
const putItineraryByItineraryid = async (req, res) => {
  try {
    const itineraryID = req.params.itineraryID;
    
    console.log('=== DEBUG PUT ITINERARY ===');
    console.log('itineraryID:', itineraryID);
    console.log('req.body:', req.body);
    
    const data = {
      travelID: req.body.travelID,
      day: req.body.day,
      activity: req.body.activity
    };
    
    console.log('Processed data:', data);
    console.log('typeof activity:', typeof data.activity);
    console.log('activity value:', data.activity);

    // Validate required fields
    if (!data.day || !data.activity || !data.travelID) {
      return res.status(400).json({
        success: false,
        error: { message: "Day, activity, and travelID are required" }
      });
    }

    // Ensure activity is a string, not an object
    if (typeof data.activity === 'object') {
      data.activity = JSON.stringify(data.activity);
    }

    // Call model function
    const result = await adminModel.updateItineraryByItineraryid(itineraryID, data);

    res.status(200).json({
      success: true,
       result
    });
  } catch (error) {
    console.error("Error updating itinerary:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// Delete itinerary - MODERN ASYNC/AWAIT VERSION
const delItineraryByItineraryid = async (req, res) => {
  try {
    const itineraryID = req.params.itineraryID;

    // Call model function (returns a promise)
    const result = await adminModel.dropItineraryByItineraryid(itineraryID);

    res.status(200).json({  // Changed from 204 to 200 to return data
      success: true,
      message: 'Itinerary deleted successfully',
       result
    });
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
// ================ Debug FUNCTIONS =================

const debugModelMethods = (req, res) => {
    console.log('🔍 Checking adminModel methods...');
    
    const allMethods = Object.keys(adminModel);
    const functionMethods = allMethods.filter(key => typeof adminModel[key] === 'function');
    
    const travelMethods = functionMethods.filter(method => 
        method.toLowerCase().includes('travel') || 
        method.toLowerCase().includes('listing')
    );
    
    res.json({
        success: true,
        totalMethods: functionMethods.length,
        allMethods: functionMethods,
        travelRelatedMethods: travelMethods,
        hint: "Look for methods like 'getTravelListingByTravelId', 'findTravelListingByTravelid', etc."
    });
};


module.exports = {
  loginControl,
  testToken,
  postUser,  
  checkUsernameOrEmailExist,

  getAllUsers,
  getUserByUserid,
  putUserByUserid,
  delUserByUserid,

  postTravelListing,
  putTravelListingByTravelid,
  delTravelListingByTravelid,

  getItineraryByItineraryid,
  getAllItineraries,
  postItineraryByTravelid,
  delItineraryByItineraryid,
  putItineraryByItineraryid,

  debugModelMethods
};

