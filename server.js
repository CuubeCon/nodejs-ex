//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
/**
 *  Select Debug Mode via env variable
 */
let debug = process.env.debug === "true";
console.log("Test: " + debug);

/**
 *
 * TWITCH BOT SECTION
 *
 */
// ES6 syntax
let TwitchJs = require('twitch-js').default;

// Define configuration options:
let opts = {
        identity: {
            username: 'cubeconlp',
                password: 'oauth:bhvq4jhuy4ymacztewuarm0drttz91'
                    },
        channels: [
            '#salz0r_tv',
           '#cubeconlp'
        ]
};

const token = 'oauth:bhvq4jhuy4ymacztewuarm0drttz91';
const username = 'cubeconlp';
const { api, chat , chatConstants} = new TwitchJs({ token, username, log: { level: 'warn' } });
//const channel = '#salz0r_tv';

chat.connect().then(globalUserState => {
    // Do stuff ...
    const channels = ['#noway4u_sir', '#ratirl'];

    Promise.all(channels.map(channel => {
        return chat.join(channel);
    })).then(channelStates => {
      // Listen to all messages from #noway4u_sir only
    
      chat.on('#noway4u_sir', message => {
        // Do stuff with message ...
      });
    
      // Listen to private messages from #noway4u_sir and #ratirl
      chat.on('PRIVMSG', privateMessage => {
        // Do stuff with privateMessage ...
      });
    
      // Listen to private messages from #noway4u_sir only
      chat.on('PRIVMSG/#noway4u_sir', privateMessage => {
        // Do stuff with privateMessage ...
      });
    
      // Listen to all private messages from #ratirl only
      chat.on('PRIVMSG/#ratirl', privateMessage => {
        // Do stuff with privateMessage ...
      });
    });
});

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
