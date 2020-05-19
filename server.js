const axios = require('axios').default;
const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const cors = require('cors');
const CryptoJS = require("crypto-js");
const ObjectID = mongodb.ObjectID;
const Rebuy = require('./public/rebuy.js');

// the three collections Mongo db will use
const BOT_COLLECTION = "bot";
const HISTORY_COLLECTION = "balancesHistory";
const REBUY_COLLECTION = "configuration";

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/dist/')); // link to angular repo
// app.use(express.static(__dirname + '/public')); // js functions
app.use(cors());
app.options('*', cors());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, client) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  
  // Save database object from the callback for reuse.
  db = client.db();
  console.log("Database connection ready");
  
  // Initialize the app.
  let server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log("App now running on port", port);
  });
});

// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

// simple Authentication for select routes
const checkAdminKey = function (req, res, callback) {
  
  const hash = CryptoJS.SHA1(process.env.ADMINKEY).toString();
  if (req.query.adminKey && req.query.adminKey === hash) {
    callback(req, res);
  } else {
    handleError(res, 'Unauthorized call', 'Bad admin key', 401);
  }
}

// GENERAL
app.get("/api/info", function(req, res) {  
  res.status(200).json({
    tradingApiSet: !!process.env.BINANCE_API_KEY_TRADE && !!process.env.BINANCE_SECRET_KEY_TRADE,
    withdrawApiSet: !!process.env.BINANCE_API_KEY_WITHDRAW && !!process.env.BINANCE_SECRET_KEY_WITHDRAW
  });
});

// HISTORY_COLLECTION
/* GET: get balances history for available exchanges */
app.get("/api/balances-history", function(req, res) {
  db.collection(HISTORY_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get history");
    } else {
      res.status(200).json(docs);
    }
  });
})

// BOT_COLLECTION

/*  "/api/bot"
 *    GET: finds all bots
 *    POST: creates a new bot
 */
app.get("/api/bot", function(req, res) {
  db.collection(BOT_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get bots.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/bot", function(req, res) {

  checkAdminKey(req, res, function(req, res) {
  
    const newBot = req.body;
    newBot.createDate = new Date();

    if (!req.body.exchange) {
      handleError(res, "Invalid user input", "Must provide an exchange.", 400);
    } else if (!req.body.pair) {
      handleError(res, "Invalid user input", "Must provide a pair.", 400);
    } else if (!req.body.strategy) {
      handleError(res, "Invalid user input", "Must provide a strategy.", 400);
    } else if (!req.body.status) {
      handleError(res, "Invalid user input", "Must provide status ('up'/'down').", 400);
    } else if (!req.body.parameters) {
      handleError(res, "Invalid user input", "Must provide parameters.", 400);
    } else if (!req.body.parameters.maxSpread) {
      handleError(res, "Invalid user input", "Must provide maxSpread.", 400);
    } else if (!req.body.parameters.setSpread) {
      handleError(res, "Invalid user input", "Must provide setSpread.", 400);
    } else {
      db.collection(BOT_COLLECTION).insertOne(newBot, function(err, doc) {
        if (err) {
          handleError(res, err.message, "Failed to create new contact.");
        } else {
          res.status(201).json(doc.ops[0]);
        }
      });
    }
  });
});

/*  "/api/bot"
 *    PUT: update bot by id (must set query param 'adminKey')
 *    DELETE: deletes bot by id (must set query param 'adminKey')
 */
app.put("/api/bot/:id", function(req, res) {

  checkAdminKey(req, res, function (req, res) {

    var updateDoc = req.body;
    delete updateDoc._id;
    
    if (!req.body.exchange) {
      handleError(res, "Invalid user input", "Must provide an exchange.", 400);
    } else if (!req.body.pair) {
      handleError(res, "Invalid user input", "Must provide a pair.", 400);
    } else if (!req.body.strategy) {
      handleError(res, "Invalid user input", "Must provide a strategy.", 400);
    } else if (!req.body.parameters) {
      handleError(res, "Invalid user input", "Must provide parameters.", 400);
    } else if (!req.body.status) {
      handleError(res, "Invalid user input", "Must provide status ('up'/'down').", 400);
    }  else if (!req.body.parameters.maxSpread) {
      handleError(res, "Invalid user input", "Must provide maxSpread.", 400);
    } else if (!req.body.parameters.setSpread) {
      handleError(res, "Invalid user input", "Must provide setSpread.", 400);
    } else {
      db.collection(BOT_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, {$set: {...updateDoc}}, function(err, doc) {
        if (err) {
          handleError(res, err.message, "Failed to update bot");
        } else {
          updateDoc._id = req.params.id;
          res.status(200).json(updateDoc);
        }
      });
    }
  });
});

app.delete("/api/bot/:id", function(req, res) {

  checkAdminKey(req, res, function(req, res) {

    db.collection(BOT_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
      if (err) {
        handleError(res, err.message, "Failed to delete bot");
      } else {
        res.status(200).json(req.params.id);
      }
    });
  });
});

/*  "/api/execute"
 *    get: executes every bot's strategy and the re-buy strategy
 */
app.get("/api/execute", function(req, res) {

  checkAdminKey(req, res, function(req, res) {

    /* db.collection(BOT_COLLECTION).find({}).toArray(function(err, doc) {
      console.log(doc);
    }); */
    db.collection(REBUY_COLLECTION).find({}).toArray(function(err, doc) {

      if (doc && doc[0]) {
        Rebuy.rebuy(doc[0], (strategy) => {
          console.log(strategy);
          db.collection(REBUY_COLLECTION).updateOne({_id: new ObjectID(strategy._id)}, {$set: {...strategy}});
        });
      }
    });

    res.status(200).json();    
  });
});

const executeBotStrategy = function(bot) {
  
}

app.get("/api/nano-balance/:address", function (req, res, next) {
  // get nano balance 🙏🙏🙏 thank you nanocrawler.cc
  axios(`https://api.nanocrawler.cc/v2/accounts/${req.params.address}`).then(response => {
    res.status(200).json(response.data);
  }).catch(error => {
    handleError(res, "could not get nano balance", "bad address", 400);
  });
});

// REBUY_COLLECTION
/*  "/api/rebuy"
 *    GET: finds the rebuy settings object (only 1 will be available)
 *    POST: creates a new rebuy settings object
 */

app.get("/api/rebuy", function(req, res) {
  db.collection(REBUY_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get rebuy object.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/rebuy", function(req, res) {
  checkAdminKey(req, res, function(req, res) {
    
    let newStrategy = req.body;
    newStrategy.createDate = new Date();

    if (!req.body.nanoLimit || parseInt(req.body.nanoLimit) < 1) {
      handleError(res, "Invalid user input", "nanoLimit parameter must be greater than 1.", 400);
    } else if (!req.body.address) {
      handleError(res, "Invalid user input", "Most provide nano address", 400);
    } else if (!req.body.pair)  {
      handleError(res, "Invalid user input", "Most provide exchange parameter", 400);
    } else if (!req.body.pair) {
      handleError(res, "Invalid user input", "Most provide a nano pair parameter", 400);
    } else if (!req.body.status) {
      handleError(res, "Invalid user input", "Most provide a status for functionality ('up' or'down')", 400);
    } else {
      db.collection(REBUY_COLLECTION).countDocuments({}, function(error, count) {
        if (error) {
          handleError(res, error.message, "Failed to check for existing strategies", 400);
        } else if (count < 1) {
          db.collection(REBUY_COLLECTION).insertOne(newStrategy, function(err, doc) {
            if (err) {
              handleError(res, err.message, "Failed to create new rebuy strategy.", 400);
            } else {
              res.status(201).json(doc.ops[0]);
            }
          });
        } else {
          handleError(res, "Max 1 rebuy strategy.", "Rebuy strategy already exists", 400);
        }
      });
    }
  });
});

/*  "/api/rebuy"
 *    PUT: update rebuy settings object by id (from query parameter)
 */
app.put("/api/rebuy", function(req, res) {

  checkAdminKey(req, res, function(req, res) {
    
    let newStrategy = req.body;
    delete newStrategy._id;

    if (!req.body.nanoLimit || parseInt(req.body.nanoLimit) < 1) {
      handleError(res, "Invalid user input", "nanoLimit parameter must be greater than 1.", 400);
    } else if (!req.body.address) {
      handleError(res, "Invalid user input", "Most provide nano address", 400);
    } else if (!req.body.pair)  {
      handleError(res, "Invalid user input", "Most provide exchange parameter", 400);
    } else if (!req.body.pair) {
      handleError(res, "Invalid user input", "Most provide a nano pair parameter", 400);
    } else if (!req.body.status) {
      handleError(res, "Invalid user input", "Most provide a status for functionality ('up' or'down')", 400);
    } else {
      db.collection(REBUY_COLLECTION).updateOne({_id: new ObjectID(req.query.id)},{$set: {...newStrategy}}, function(err, doc) {
        if (err) {
          handleError(res, err.message, "Failed to create new rebuy strategy.");
        } else {
          newStrategy._id = req.query.id;
          res.status(201).json(doc);
        }
      });
    }
  });
});
