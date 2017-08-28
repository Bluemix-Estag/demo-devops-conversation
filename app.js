// CHANGE LINES 95,96,97

// Module dependencies.

var express = require('express'),
    routes = require('./routes'),
    cors = require('cors'),
    http = require('http'),
    path = require('path'),
    request = require('request'),
    cfenv = require('cfenv'),
    fs = require('fs'),
    request = require('request'),
    watson = require('watson-developer-cloud'),
    app = express(),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    logger = require('morgan'),
    errorHandler = require('errorhandler'),
    multipart = require('connect-multiparty'),
    multipartMiddleware = multipart();

// Bluemix Variables to use
var vcapLocal = null;
var appEnv = null;
var appEnvOpts = {};
var conversationWorkspace;
var conversation;
var db;
var cloudant;
var fileToUpload;
var dbname = "materiais";
var database;
var context = {};


// CHANGE THIS VARIABLES, ALSO IN VCAP-LOCAL.JSON
var WORKSPACE_ID = 'YOUR CONVERSATION WORKSPACE ID GOES HERE';
var CONVERSATIONNAME = 'YOUR CONVERSATION WORKSPACE NAME';
var CONVERSATIONPWD = 'YOUR CONVERSATION WORKSPACE PWD';
var CONVERSATIONSERVICENAME = 'CONVERSATION SERVICE NAME';


// all environments
app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));


// root route.
app.get('/', routes.index);


// reads vcap-local.json and gets credentials
fs.stat('./vcap-local.json', function (err, stat) {
    if (err && err.code === 'ENOENT') {
        // file does not exist
        console.log('No vcap-local.json');
        initializeAppEnv();
    } else if (err) {
        console.log('Error retrieving local vcap: ', err.code);
    } else {
        vcapLocal = require("./vcap-local.json");
        console.log("Loaded local VCAP", vcapLocal);
        appEnvOpts = {
            vcap: vcapLocal
        };
        initializeAppEnv();
    }
});


// get the app environment from Cloud Foundry, defaulting to local VCAP
function initializeAppEnv() {
    appEnv = cfenv.getAppEnv(appEnvOpts);
    if (appEnv.isLocal) {
        require('dotenv').load();
    }
    if(appEnv.services.conversation){
        console.log("Services");
        // 1 ****************
        initConversation();
    }else{
        console.error("No Conversation service exists");
    }
}

// get conversation credentials
function initConversation() {
    // 2 ****************
    var conversationCredentials = appEnv.getServiceCreds(CONVERSATIONSERVICENAME);
    console.log(conversationCredentials);
    var conversationUsername = CONVERSATIONNAME;
    var conversationPassword = CONVERSATIONPWD;
    var conversationURL = 'https://gateway.watsonplatform.net/conversation/api';
    conversation = watson.conversation({
        url: conversationURL
        , username: conversationUsername
        , password: conversationPassword
        , version_date: '2017-08-23'
        , version: 'v1'
    });
    // check if the workspace ID is specified in the environment
    conversationWorkspace = "ResultadoJogos";
    // if not, look it up by name or create one
    if (!conversationWorkspace) {
        const workspaceName = CONVERSATION_NAME; // Workspace name goes here.
        console.log('No conversation workspace configured in the environment.');
        console.log(`Looking for a workspace named '${workspaceName}'...`);
        conversation.listWorkspaces((err, result) => {
            if (err) {
                console.log('Conversation not setup.', err);
            }
            else {
                const workspace = result.workspaces.find(workspace => workspace.name === workspaceName);
                if (workspace) {
                    conversationWorkspace = workspace.workspace_id;
                    console.log("Using Watson Conversation with username", conversationUsername, "and workspace", conversationWorkspace);
                }
            }
        });
    }
    else {
        console.log('Workspace ID was specified as an environment variable.');
        console.log("Using Watson Conversation with username", conversationUsername, "and workspace", conversationWorkspace);
    }
}


// Add headers
app.use(function (req, res, next) {
    
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
    
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    
        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);
    
        // Pass to next layer of middleware
        next();
});

// REST to return conversation
app.get('/myapp/api/v1/conversation', function(req,res){
    // Object received through POST METHOD.
    var text = (req.query.text != null)?req.query.text:null;
    console.log("Context: " + JSON.stringify(context));
    if(text != null){
        conversation.message({
            workspace_id: WORKSPACE_ID,
            input: {'text': text},
            context: context
          },  function(err, response) {
            if (err)
              console.log('Error:', err);
            else{
              var output = (response.output.text[0] != null)?response.output.text[0]:null
              context = response.context;
              res.send(output);
            }
          });
    }else{
        res.send("Error")
    }
});

app.get('/teste', function(req,res){
    res.send("IT works.")
});

http.createServer(app).listen(app.get('port'), '0.0.0.0', function () {
    console.log('Express server listening on port ' + app.get('port'));
});