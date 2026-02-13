const publicModel = require("../model/publicModel.js");
// const publicController = require("../controller/publicController.js");
// const pool = require("../data/db");

// Debug: Immediately check if import worked
console.log('=== PUBLIC CONTROLLER LOADED ===');
console.log('publicModel exists?', !!publicModel);
if (publicModel) {
  console.log('publicModel methods:', Object.keys(publicModel));
} else {
  console.log('ERROR: publicModel is null or undefined!');
}


const getAllTravelListings = async (req, res) => {
  try {
      console.log('Fetching travel listings...');
      const listings = await publicModel.readAllTravelListings();
      console.log(`Found ${listings.length} listings`);
      res.json(listings);
  } catch (error) {
      console.error('Error fetching travel listings:', error);
      res.status(500).json({
          error: 'Failed to fetch travel listings',
          message: error.message
      });
  }
    };

const getItinerariesByTravelid = async (req, res) => {
        try {
            const travelID = parseInt(req.params.travelID);
            console.log(`Fetching itineraries for travelID: ${travelID}`);
            
            const itineraries = await publicModel.readItinerariesByTravelid(travelID);
            console.log(`Found ${itineraries.length} itineraries`);
                // Validate travelid
    if (isNaN(travelID) || travelID <= 0) {
      console.error('Invalid travelid:', req.params.travelid);
      return res.status(400).json({ error: 'Invalid travel ID' });
    }
        // Check if itineraries is undefined or null
        if (!itineraries) {
            console.log('No itineraries found or model returned undefined/null');
            return res.json([]); // Return empty array instead
        }
        
        // Check if it's an array
        if (!Array.isArray(itineraries)) {
            console.log('Warning: Model did not return an array. Type:', typeof itineraries);
            // If it's a single object, wrap it in an array
            if (itineraries && typeof itineraries === 'object') {
                return res.json([itineraries]);
            }
            return res.json([]);
        }
        
        console.log(`Found ${itineraries.length} itineraries`);
        res.json(itineraries);
    } catch (error) {
        console.error(`Error fetching itineraries for travelID ${req.params.travelID}:`, error);
        res.status(500).json({
            error: 'Failed to fetch itineraries',
            message: error.message
        });
    }
};

const getTravelListingByTravelid = async (req, res) => {
        try {
            const travelID = parseInt(req.params.travelID);
            console.log(`Fetching travel listing with ID: ${travelID}`);
            
            const listing = await publicModel.readTravelListingByTravelid(travelID);
            
            if (!listing) {
                return res.status(404).json({ 
                    error: 'Travel listing not found',
                    message: `No travel listing found with ID: ${travelID}`
                });
            }
            
            console.log('Found travel listing:', listing.title);
            res.json(listing);
        } catch (error) {
            console.error(`Error fetching travel listing ID ${req.params.travelID}:`, error);
            res.status(500).json({ 
                error: 'Failed to fetch travel listing',
                message: error.message 
            });
        }
    }

// const getTravelListingsByTravelid = (req, res) => {
//   const travelID = req.params.travelID;
//   const checksql = 'SELECT travelID FROM travel_listing WHERE travelID = ?';
//   pool.query(checksql, [travelID], (error, results) => {
//     if (error) {
//       console.error('Error fetching itinerary:', error);
//       return res.status(500).json({ error: 'Internal server error' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "Travel listing not found"
//       });
//     }

//     publicController.readTravelListingsByTravelId(travelID, (error, travelListing) => {
//       if (error) {
//         console.error('Error fetching travel listing:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       res.status(200).json(travelListing);
//     });
//   });
// };

const findTravellistingsByDescriptionSubstring = async (req, res) => {
  try {
      const { q } = req.query;
      
      if (!q || q.trim() === '') {
          return res.status(400).json({ 
              error: 'Search term is required'
          });
      }
      
      console.log(`Searching travel listings for: "${q}"`);
      const listings = await publicModel.searchTravellistingsByDescriptionSubstring(q);
      console.log(`Found ${listings.length} listings matching search`);
      res.json(listings);
  } catch (error) {
      console.error('Error searching travel listings:', error);
      res.status(500).json({ 
          error: 'Failed to search travel listings',
          message: error.message 
      });
  }
};

// const findTravelListingsByDescriptionSubstring = async (req, res) => {
//   try {
//       const { q } = req.query;
      
//       if (!q || q.trim() === '') {
//           return res.status(400).json({ 
//               error: 'Search term is required'
//           });
//       }
      
//       console.log(`Searching travel listings for: "${q}"`);
//       const listings = await publicModel.searchTravellistingsByDescriptionSubstring(q);
//       console.log(`Found ${listings.length} listings matching search`);
//       res.json(listings);
//   } catch (error) {
//       console.error('Error searching travel listings:', error);
//       res.status(500).json({ 
//           error: 'Failed to search travel listings',
//           message: error.message 
//       });
//   }
// };

module.exports = {
  getAllTravelListings,
  getTravelListingByTravelid,
  findTravellistingsByDescriptionSubstring,

  getItinerariesByTravelid
};