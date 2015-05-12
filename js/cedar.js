/**
 * Global object for settings and storage
 */
var Cedar = {
  initialized: false,
  store: null,
  auth: null,
  config: {
    api: '',
    server: '',
    debug: false
  }
};


/**
* Cedar.Init
*
* Initialize Application object
*
*/
Cedar.Init = function(options) {
  return new Cedar.Application(options);
}

/**
 * Global function to display message to console if Cedar.debug = true
 *
 * @param <string> message
 */
Cedar.debug = function(msg) {
  if (Cedar.config.debug) {
    console.log(msg);
  }
}

/**
* Cedar.Application
*
* Application object for initializing and setting global values
*
* @param <Array> options
*   - server : 'test.cdr.plyinc.com' - *required
*   - debug : true | false
*   - fetch : true | false
*   - forceHttps : true | false
*/
Cedar.Application = function(options) {
  if ( Cedar.initialized ) {
    return;
  }

  var defaults = {
    debug: false,
    fetch: true,
    wait: false,
    forceHttps: false
  };

  this.options = $.extend({}, defaults, options);

  if ( typeof this.options.server === 'undefined' ) {
    throw 'Cedar Error: must provide "server" value on Init()';
  }

  Cedar.config.server = this.getProtocol() + this.options.server;
  Cedar.config.api = this.getProtocol() + this.options.server + '/api';
  Cedar.config.debug = this.options.debug;
  Cedar.config.wait = this.options.wait;
  Cedar.config.fetch = this.options.fetch;

  if (typeof Cedar.$ === "undefined") {
    Cedar.$ = jQuery({});
  }

  if ( Cedar.store === null ) {
    Cedar.store = new Cedar.Store();
  }

  if ( Cedar.auth === null ) {
    Cedar.auth = new Cedar.Auth();
  }

  if (Cedar.auth.isEditMode()) {
    this.showGlobalActions();
  }

  Cedar.initialized = true;

  this.initializeHTML()
}

Cedar.Application.prototype.initializeHTML = function() {
  $('[data-cedar-id]').each(function(){
    var $this = $(this);
    $this.data("cedarObject", new Cedar.ContentEntry({
      el: this,
      cedarId: $this.data("cedarId")
    }));

    Cedar.$.on("content:loaded", function() {
      $this.data("cedarObject").render();
    }.bind(this));
  });
  Cedar.$.trigger("content:loaded");
}

Cedar.Application.prototype.getProtocol = function() {
  if (this.options.forceHttps || window.location.protocol === 'https:') {
    return 'https://';
  } else {
    return 'http://';
  }
}

Cedar.Application.prototype.showGlobalActions = function() {
  $(document).ready(function() {
    var $body = $('body');
    var globalActions = '<div class="cedar-cms-global-actions">' +
      '<a href="#" class="cedar-cms-global-action" onclick="window.location.reload();">' +
      '<span class="cedar-cms-icon cedar-cms-icon-edit"></span> ' +
      '<span class="cedar-cms-global-action-label">Refresh</span>' +
      '</a><br>' +
      '<a class="cedar-cms-global-action" href="' + Cedar.auth.getLogOffURL() + '">' +
      '<span class="cedar-cms-icon cedar-cms-icon-edit"></span> ' +
      '<span class="cedar-cms-global-action-label">Log Off Cedar</span>' +
      '</a>' +
      '</div>';
    $body.append(globalActions);
  });
}


/**
 * Cedar.Auth
 *
 * responsible for determining if we're in edit mode
 */
Cedar.Auth = function() {
}
Cedar.Auth.prototype.isEditMode = function() {
  return this.isEditUrl();
}
Cedar.Auth.prototype.isEditUrl = function() {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    if (sURLVariables[i] == 'cdrlogin') {
      return true;
    }
  }
  return false;
}
Cedar.Auth.prototype.getLogOffURL = function() {
  return this.removeURLParameter(window.location.href, 'cdrlogin');
}
// adapted from stackoverflow: http://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript
Cedar.Auth.prototype.removeURLParameter = function(url, parameter) {
  var splitUrl = url.split('#');
  var serverUrl = splitUrl[0];
  var clientUrl = splitUrl[1] || '';
  if (clientUrl) {
    clientUrl = '#' + clientUrl;
  }
  //prefer to use l.search if you have a location/link object
  var splitServerUrl= serverUrl.split('?');
  if (splitServerUrl.length>=2) {

    var prefix = encodeURIComponent(parameter); //+'=';
    var pars = splitServerUrl[1].split(/[&;]/g);

    //reverse iteration as may be destructive
    for (var i= pars.length; i-- > 0;) {
      //idiom for string.startsWith
      if (pars[i].lastIndexOf(prefix, 0) !== -1) {
        pars.splice(i, 1);
      }
    }

    var updatedServerUrl= splitServerUrl[0];
    if (pars.length > 0) {
      updatedServerUrl += '?'+pars.join('&');
    }
    return updatedServerUrl + clientUrl;
  } else {
    return url;
  }
}


/**
 * Cedar.Store
 *
 * responsible for retrieving Cedar elements from server or local cache.
 *
 * different cedar types may use different api paths, therefore the paths
 * are passed into some functions
 */
Cedar.Store = function() {
  this.loaded = false;

  this.cache = localStorage;

  this.checkVersion = this.checkVersion().then(function() {
    if (Cedar.config.fetch) {
      Cedar.store.fetched = Cedar.store.refresh();
    }
  });

  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
/**
 * store a single json item by key
 *
 * @param <string> 'key'
 * @param <json> 'item'
 */
Cedar.Store.prototype.put = function ( key, item ) {
  localStorage[key] = JSON.stringify(item);
}

// Return local content immediately if possible. Otherwise return deferred remote content
Cedar.Store.prototype.get = function(key) {
  var cachedDeferred = this.cachedDeferred(key);
  var remoteDeferred = this.remoteDeferred(key);

  if (Cedar.config.wait || !this.cache[key]) {
    Cedar.debug('checking remote: ' + key);
    return remoteDeferred;
  } else {
    Cedar.debug('get from cache: ' + key);
    return cachedDeferred;
  }
}

// Deferred object containing local content
Cedar.Store.prototype.cachedDeferred = function(key) {
  return $.Deferred().resolve(this.cache[key]);
}

// Refresh local storage if needed and then return content
Cedar.Store.prototype.remoteDeferred = function(key) {
  return this.refresh().then(function() {
    return this.cachedDeferred(key);
  }.bind(this));
}

// Check content version and update if needed
Cedar.Store.prototype.refresh = function() {
  return this.checkVersion.then(function() {
    if (this.loaded) {
      return $.Deferred().resolve();
    } else {
      return this.getAll();
    }
  }.bind(this));
}

// Get all content objects from server and save to local storage
Cedar.Store.prototype.getAll = function(options) {
  var defaultOptions = {
    path: '/queries/contententries/'
  };
  options = $.extend({}, defaultOptions, options);
  var defaultParams = {};
  var params = $.extend({}, defaultParams, {
    guidfilter: options.filter
  });

  return $.getJSON(Cedar.config.api + options.path, params).then(function(response) {
    $.each(response, function (index, value) {
      if ("id" in value && "content" in value.settings) {
        this.put(value.id, value);
        Cedar.debug("storing: " + value.id);
      }
    }.bind(this));
    Cedar.debug("local storage was updated");
    this.loaded = true;
    Cedar.$.trigger("content:loaded");
  }.bind(this));
}

/**
 * clear the local storage or remove a single locally store item by key
 *
 * @param {ID} key
 */
Cedar.Store.prototype.clear = function( key ) {
  if ( typeof key === 'undefined' ) {
    localStorage.clear();
  }
  else {
    localStorage.removeItem(key);
  }
}
/**
 * set the locally stored data version number
 *
 * @return <string> data version number
 */
Cedar.Store.prototype.setVersion = function(id) {
  Cedar.debug("updating to version #" + id);
  localStorage["___CEDAR__DATA__FINGERPRINT___"] = id;
}
/**
 * return the currently stored data version number
 *
 * @return <string> data version number
 */
Cedar.Store.prototype.getVersion = function() {
  return localStorage["___CEDAR__DATA__FINGERPRINT___"];
}
/**
 * Query the server for the latest data version number
 *
 * @return <Deferred>
 */
Cedar.Store.prototype.checkVersion = function() {
  Cedar.debug("checking version #" + this.getVersion());
  return $.when($.getJSON(Cedar.config.api + '/queries/status'))

  .then( function(response) {
    if ( Cedar.store.getVersion() != response.settings.version ) {
      Cedar.debug('setting version: ' + response.settings.version);
      Cedar.store.loaded = false;
      Cedar.store.setVersion(response.settings.version);
    } else {
      Cedar.debug("version is up to date");
      Cedar.store.loaded = true;
      Cedar.$.trigger("content:loaded");
    }
  });
}

/**
 * Cedar.ContentEntry
 *
 * basic content block class
 *
 * options:
 *
 * {
 *  el (element or jQuery selector)
 * }
 */
Cedar.ContentEntry = function(options) {
  var defaults = {
    el: '<div />'
  };

  this.options = $.extend( {}, defaults, options );

  this.cedarId = this.options.cedarId;
  this.el = this.options.el;
  this.$el = $(this.el);
}

Cedar.ContentEntry.prototype.apiGet = function() {
  return '/objects/contententries/';
};

Cedar.ContentEntry.prototype.apiQuery = function() {
  return '/queries/contententries/';
};

Cedar.ContentEntry.prototype.apiFilter = function() {
  return 'guidfilter';
};

Cedar.ContentEntry.prototype.apiList = function() {
  return 'guidlist';
};

Cedar.ContentEntry.prototype.hasLocalContent = function() {
  if (typeof this.localContentExists === "undefined") {
    var content = localStorage[this.cedarId];
    this.localContentExists = false;
    if (typeof content !== "undefined") {
      var json = JSON.parse(content);
      if (typeof json.id !== "undefined") {
        this.localContentExists = true;
      }
    }
  }
  return this.localContentExists;
}

/**
 * parse the json for content and set this object's content
 *
 * @param <json>
 */
Cedar.ContentEntry.prototype.setContent = function(data) {
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  if (!data || data.code == 'UNKNOWN_ID'){
    this.content = '';
  } else if (typeof data.settings.content !== 'undefined') {
    this.content = data.settings.content;
  } else {
    this.content = '';
    Cedar.debug('Cedar Error: Unable to parse json');
  }
}
/**
 * return the object's content - takes into account edit mode styling
 *
 * @return <HTML>
 */
Cedar.ContentEntry.prototype.getContent = function(){
  if (Cedar.auth.isEditMode()) {
    return this.getEditOpen() + this.content + this.getEditClose();
  }
  else {
    return this.content;
  }
}
/**
 * is this a content entry json structure?
 *
 * @param <json>
 * @return <bool>
 */
Cedar.ContentEntry.prototype.isContentEntry = function (json) {
  if (typeof json === 'undefined') {
    return false;
  }
  if (typeof json.settings === 'undefined' && typeof json.settings.content === 'undefined') {
    return false;
  }

  return true;
}
/**
 * @return <json>
 */
Cedar.ContentEntry.prototype.toJSON = function(){
  return {
    content: this.content
  }
};
/**
 * fill self or provided element with content
 *
 * @param <element> optional
 */
Cedar.ContentEntry.prototype.fill = function(element) {
  if (typeof element !== 'undefined') {
    $(element).html(this.getContent());
  } else if (typeof this.$el !== 'undefined') {
    this.$el.html(this.getContent());
  }
}
/**
 * check store for this object's content
 */
Cedar.ContentEntry.prototype.retrieve = function() {
 return Cedar.store.get(this.cedarId).then(function(response) {
   this.setContent(response);
   return this;
 }.bind(this));
}
/**
 * retrive and fill the associated element
 */
Cedar.ContentEntry.prototype.render = function() {
  this.retrieve().done(function() {
    this.fill();
  }.bind(this));
}

/**
 * provides styling for edit box
 */
Cedar.ContentEntry.prototype.getEditOpen = function() {
  var jsString = "if(event.stopPropagation){event.stopPropagation();}" +
  "event.cancelBubble=true;" +
  "window.location.href=this.attributes.href.value + \'&referer=' + encodeURIComponent(window.location.href) + '\';" +
  "return false;";

  var block = '<span class="cedar-cms-editable clearfix">';
  block += '<span class="cedar-cms-edit-tools">';
  block += '<a onclick="' + jsString + '" href="' + Cedar.config.server +
           '/cmsadmin/EditData?cdr=1&t=ContentEntry&o=' + encodeURIComponent(this.cedarId) +
           '" class="cedar-cms-edit-icon cedar-js-edit" >';
  block += '<i class="cedar-cms-icon cedar-cms-icon-right cedar-cms-icon-edit"></i></a>';
  block += '</span>';
  return block;
}
Cedar.ContentEntry.prototype.getEditClose = function(){
  return '</span>';
}
