/*
MicroStrategy generic data connector SDK JavaScript library v1.0.
Used for MicroStrategy 10.7
Created date: 2016-12-20
*/

( function( global, factory ) {

  "use strict";

  if ( typeof module === "object" && typeof module.exports === "object" ) {

    // For CommonJS and CommonJS-like environments where a proper `window`
    // is present, execute the factory and get mstr.
    // For environments that do not have a `window` with a `document`
    // (such as Node.js), expose a factory as module.exports.
    module.exports = global.document ?
      factory( global, true ) :
      function( w ) {
        if ( !w.document ) {
          throw new Error( "MicroStrategy GDC requires a window with a document" );
        }
        return factory( w );
      };
  } else {
    factory( global );
  }

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( container, noGlobal ) {

  /** This file lists all of the enums which should available for the GDC */
  var allEnums = {
    authTypeEnum : {
      anonymous: "ANONYMOUS",
      basic: "BASIC",
      OAuth: "OAUTH"
    },

    dataTypeEnum : {
      bool: "BOOL",
      date: "DATE",
      datetime: "DATETIME",
      double: "DOUBLE",
      int: "INTEGER",
      string: "STRING",
      bigDecimal: "BIGDECIMAL",
	  bigInteger: "BIGINTEGER"
    },

    tableTypeEnum : {
      tableWithSchema: "TABLE_WITH_SCHEMA",
      rawTable: "RAW_TABLE"
    },

    phaseEnum : {
      init: "INIT",
      fetch: "FETCH_TABLE"
    }
  };


  //global variables
  var simulator = 0;

  //detect env functions. With new Function(""), variables in the current scope (if not global) do not apply to the newly constructed function.
  //MSTR web
  var isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
  
  //node js
  var isNode = new Function("try {return this===global;}catch(e){return false;}");
  

  //simulator. When simulator launch connector, a parameter 'simulator=1' will be added to connector url.
  var isSimulator = function(){
    return isBrowser() && (simulator == 1)
  }

  //TODO: add detection for one tier
  var isMstrDesktop = new Function("");



  // copy the enums as properties of the dest object
  function copyElement(dest, src) {
    for(var key in src) {
      dest[key] = src[key];
    }
  };


  //Cookies
  function setCookie(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
      var expires = "expires="+d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  function getCookie(cname) {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
              return c.substring(name.length, c.length);
          }
      }
      return "";
  }


  /*

  */
  function MstrAPI(mstrObj, privateMstrObj, globalObj){
    this.mstrObj = mstrObj;
    this._mstrObj = privateMstrObj;
    this.globalObj = globalObj;

  };

  MstrAPI.prototype.init = function(){
    console.log("Initialize mstr object");
    this.mstrObj.createConnector = this._createConnector.bind(this);
    this.mstrObj.registerConnector = this._registerConnector.bind(this);
    this.mstrObj.submit = this._submit.bind(this);

    copyElement(this.mstrObj, allEnums);
    //set phase to init
    this.mstrObj.phase = this.mstrObj.phaseEnum.init;
  };

  MstrAPI.prototype._createConnector = function() {
    var defaultImpls = {
      init: function(cb) { cb(); },
      close: function(cb) { cb(); },
    };

    return defaultImpls;
  };

  MstrAPI.prototype._registerConnector = function (gdc) {
    // do some error checking on the gdc
    var functionNames = ["init", "close", "fetchTable"];
    for (var ii = functionNames.length - 1; ii >= 0; ii--) {
      if (typeof(gdc[functionNames[ii]]) !== "function") {
        throw "The connector did not define the required function: " + functionNames[ii];
      }
    };

    console.log("Connector registered");

    this.globalObj._gdc = gdc;
    this._gdc = gdc;

    this._parseURL();

  };

  MstrAPI.prototype._parseURL = function(){
    /*Current version, mstr front-end will use url to pass information to connector. 
    And connector will also use url redirect to send back connection data to mstr web.
    */
    var queryString = this.globalObj.location.search.substring(1);

    queryString = decodeURIComponent(queryString.replace(/\+/g, " "));
    this._callbackURL = this._getParamByName("callback", queryString);
    //set cookies for callback
    if(this._callbackURL !== ""){
      console.log("set callback url to cookies ", this._callbackURL);
      setCookie("callback", this._callbackURL, 1);  
    }
    
    var uid = this._getParamByName("userId", queryString);
	if(uid !== ""){
	  if(isNode()){
	    this.mstrObj.userId = decodeURI(new Buffer(uid, 'base64').toString());
	  }
	  else{
		this.mstrObj.userId = decodeURI(this.globalObj.atob(uid));
	  }
    }
	
    var p = this._getParamByName("parameter", queryString);
	
    if(p !== ""){
	  if(isNode()){
	    this.mstrObj.parameter = JSON.parse(decodeURI(new Buffer(p, 'base64').toString()));
	  }
	  else{
		this.mstrObj.parameter = JSON.parse(decodeURI(this.globalObj.atob(p)));
	  }
    }
	
    
    //simulator flag
    simulator = this._getParamByName('simulator', queryString);
  }

  MstrAPI.prototype._getParamByName = function(pname, params){
    var sval = "";
    params = params.split("&");
    // split param and value into individual pieces
    for (var i=0; i<params.length; i++)
     {
       var temp = params[i].split("=");
       if ( [temp[0]] == pname ) { 
        sval = temp[1];
        //In case multiple '=' in params, put back other '=' to sval
        for(var ii = 2; ii < temp.length; ii++){
        sval = sval + "=" + temp[ii];
      }
      }
     }
    return sval;
  }

  MstrAPI.prototype._submit = function(){
    //payload will be sent to MSTR/simulator
    var payload = {};
	payload.versionNo = "1.0"; //SDK version. MSTR web can check this version number to find if SDK can work on current MSTR env.
    payload.connectionName = this.mstrObj.connectionName;
    payload.connectionData = this.mstrObj.connectionData;
    payload.authenticationInfo = this.mstrObj.authenticationInfo;
    payload.tableList = this.mstrObj.tableList;
    payload.fileType = this.mstrObj.fileType;
    payload.fetchURL = this.mstrObj.fetchURL; //MSTR will detect the existence and validation of fetchURL

    // Different run env need different data communication way.
    if (isSimulator() || this.mstrObj.simulator == 1){
      console.log("Run environment is simulator");
      container.opener.postMessage(JSON.stringify(payload), '*');
      this.globalObj.close();
    } else if(isNode()){
      console.log("Run environment is node js");
      //Add handler here
    } else if(isBrowser()){
      console.log("Run environment is MSTR web");
	  var parameters = "&code=" + this.globalObj.btoa(encodeURI(JSON.stringify(payload)));
	  //var parameters = "&code=" + this.globalObj.btoa(JSON.stringify(payload));
      //redirect to callback url
      if(this._callbackURL === ""){
        this._callbackURL = getCookie("callback");
      }
      console.log("callback url is ", this._callbackURL);
      //this.globalObj.location.href = encodeURI(this._callbackURL + parameters);
	  this.globalObj.location.href = this._callbackURL + parameters;
    }
  };


  //init function
  function init(){
    container.mstr = {};
    container._mstr = {};
    var mstrObj = new MstrAPI(container.mstr, container._mstr, container);
    mstrObj.init();
  };



  //Call init() to initialize mstr object.
  init();

});