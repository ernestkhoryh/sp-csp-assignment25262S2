// \backend\src\app.js

const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const publicController = require('./controller/publicController');
const adminController = require('./controller/adminController');
const authorizer=require('./authorization/verifyToken');
const { authenticateToken } = require('./middlewares/auth');
// const {validateIntID} = require('./authorization/validate');

// const userRoutes = require('./routes/userRoutes');
// const publicRoutes = requires('./routes/publicRoutes');
// const adminRoutes = requires('./routes/adminRoutes');


const validate=require('./authorization/validate');

const cors= require('cors');

const app = express();


console.log('adminController:', adminController);
console.log('typeof getAllUsers:', typeof adminController.getAllUsers);
console.log('authorizer type:', typeof authorizer);
console.log('authorizer.verifyToken:', typeof authorizer.verifyToken);


app.use(express.json());  // Built-in Express JSON parser
app.use(express.urlencoded({ extended: true }));


const allowedOrigins = [
  process.env.BASE_URL,
  process.env.REACT_APP_FRONTEND_URL,
  'http://localhost:3001',
  'http://127.0.0.1:3001'
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header (e.g. Postman/server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));


//-----Routes--------------

app.get('/', function (req, res) {
    res.send("This confirms your webserver is running");
});


//----User-Routes--------------

//GET /user/ - Admin/Protected route
app.get('/user', 
    // validate.validateIntID('userid'), 
    authorizer.verifyToken, 
    adminController.getAllUsers);

//GET /user/:userid - Admin/Protected route
app.get('/user/:userid', 
    // validate.validateIntID('userid'), 
    authorizer.verifyToken,
    adminController.getUserByUserid
);


//POST /user - Public route
app.post('/user', 
    validate.validateInsertion,
    adminController.postUser
);

//PUT /user/:userid - Admin/Protected route
app.put('/user/:userid', 
    validate.validateIntID('userid'),
    authorizer.verifyToken,
    adminController.putUserByUserid
);


//DELETE /user/:userid - Admin/Protected route
app.delete('/user/:userid', 
    validate.validateIntID('userid'),
    authorizer.verifyToken ,
    adminController.delUserByUserid
);

// POST /user/login - Public route
app.post('/user/login', adminController.loginControl);


app.post('/user/register', 
    validate.validateInsertion,
    adminController.postUser
);


app.get('/test-token', authenticateToken, adminController.testToken);

//----Travel-Listings-Routes--------------

//GET /travel-listings/
app.get('/travel-listings', 
    publicController.getAllTravelListings);

// POST /travel-listings
app.post('/travel-listings', 
    adminController.postTravelListing  
);


// GET /travel-listings/search
app.get('/travel-listings/search', 
    publicController.findTravellistingsByDescriptionSubstring
);

// GET /travel-listings/:travelID/itineraries
app.get('/travel-listings/:travelID/itineraries', 
    publicController.getItinerariesByTravelid  
);

// GET /travel-listings/:travelID
app.get('/travel-listings/:travelID', 
    publicController.getTravelListingByTravelid 
);


app.put('/travel-listings/:travelID', 
    validate.validateIntID('travelID'),
    adminController.putTravelListingByTravelid  
);

app.delete('/travel-listings/:travelID', 
    authorizer.verifyToken,
    validate.validateIntID('travelID'),
    adminController.delTravelListingByTravelid  
);


//----Itineraries-Routes--------------

//GET /itineraries/
app.get('/itineraries', 
    adminController.getAllItineraries);

app.get('/itineraries/:itineraryID',
    adminController.getItineraryByItineraryid);

app.put('/itineraries/:itineraryID', 
    validate.validateIntID('itineraryID'),
    adminController.putItineraryByItineraryid
);

app.post('/travel-listings/:travelID/itinerary', 
    authorizer.verifyToken,
    validate.validateIntID('travelID'),
    adminController.postItineraryByTravelid 
);

app.delete('/itineraries/:itineraryID', 
    validate.validateIntID('itineraryID'),
    adminController.delItineraryByItineraryid
);

//------Debug-route-------------------------

console.log("=== DEBUG / REGISTERED ROUTES ===");

app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).map(m => m.toUpperCase())
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods).map(m => m.toUpperCase())
          });
        }
      });
    }
  });
  
  res.json({
    routes: routes,
    loginFunctionExists: !!adminController.loginControl,
    loginRouteExpected: '/user/login'
  });
});

console.log('validate:', validate);
console.log('validateInsertion:', validate.validateInsertion);
console.log('publicController:', publicController);
console.log('loginControl:', adminController.loginControl);

module.exports = app;