/**
 * Global object for settings and storage
 */
window.Cedar = window.Cedar || {};
window.Cedar = $.extend({}, window.Cedar, {
  initialized: false,
  store: null,
  auth: null
});
window.Cedar.config = window.Cedar.config || {
  liveMode: true
};

/**
* Cedar.Init
*
* Initialize Application object
*
*/
Cedar.Init = function(options) {
  return new Cedar.Application(options);
};

/**
 * Global function to display message to console if Cedar.debug = true
 *
 * @param <string> message
 */
Cedar.debug = function(msg) {
  if (Cedar.config.debug) {
    window.console.log(msg);
  }
};

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

  if (this.options.server === undefined) {
    throw 'Cedar Error: must provide "server" value on Init()';
  }

  Cedar.config.server = this.getProtocol() + this.options.server;
  Cedar.config.api = this.getProtocol() + this.options.server + '/api';
  Cedar.config.debug = this.options.debug;
  Cedar.config.wait = this.options.wait;
  Cedar.config.fetch = this.options.fetch;

  if (Cedar.events === undefined) {
    Cedar.events = new Cedar.Events();
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

  this.initializeHTML();
};

Cedar.Application.prototype.initializeHTML = function() {
  $('[data-cedar-id]').each(function(){
    var $this = $(this);
    $this.data("cedarObject", new Cedar.ContentEntry({
      el: this,
      cedarId: $this.data("cedarId")
    }));

    Cedar.events.on("content:loaded", function() {
      $this.data("cedarObject").render();
    }.bind(this));
  });
  Cedar.events.trigger("content:loaded");
};

Cedar.Application.prototype.getProtocol = function() {
  if (this.options.forceHttps || window.location.protocol === 'https:') {
    return 'https://';
  } else {
    return 'http://';
  }
};

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
};


/**
 * Cedar.Auth
 *
 * responsible for determining if we're in edit mode
 */
Cedar.Auth = function() {
  return;
};

Cedar.Auth.prototype.isEditMode = function() {
  return this.isEditUrl();
};

Cedar.Auth.prototype.isEditUrl = function() {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  var i = 0;
  while (i < sURLVariables.length) {
    if (sURLVariables[i] === 'cdrlogin') {
      return true;
    }
    i++;
  }
  return false;
};

Cedar.Auth.prototype.getLogOffURL = function() {
  return this.removeURLParameter(window.location.href, 'cdrlogin');
};

/**
 * Cedar.Events
 */
Cedar.Events = function() {
  this.eventCollection = {};
};

Cedar.Events.prototype.trigger = function(eventName) {
  if (!this.eventCollection[eventName]) {
    this.eventCollection[eventName] = document.createEvent('Event');
    this.eventCollection[eventName].initEvent(eventName, true, true);
  }
  document.dispatchEvent(this.eventCollection[eventName]);
};

Cedar.Events.prototype.on = function(eventName, eventCallback) {
  document.addEventListener(eventName, eventCallback);
};

// adapted from stackoverflow:
// http://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript
Cedar.Auth.prototype.removeURLParameter = function(url, parameter) {
  var splitUrl = url.split('#');
  var serverUrl = splitUrl[0];
  var clientUrl = splitUrl[1] || '';
  if (clientUrl) {
    clientUrl = '#' + clientUrl;
  }
  // prefer to use l.search if you have a location/link object
  var splitServerUrl= serverUrl.split('?');
  if (splitServerUrl.length>=2) {

    var prefix = encodeURIComponent(parameter); //+'=';
    var pars = splitServerUrl[1].split(/[&;]/g);

    //reverse iteration as may be destructive
    var i = pars.length - 1;
    while (i >= 0) {
      // idiom for string.startsWith
      if (pars[i].lastIndexOf(prefix, 0) !== -1) {
        pars.splice(i, 1);
      }
      i--;
    }

    var updatedServerUrl= splitServerUrl[0];
    if (pars.length > 0) {
      updatedServerUrl += '?'+pars.join('&');
    }
    return updatedServerUrl + clientUrl;
  } else {
    return url;
  }
};


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

  var fail;
  var uid;
  try {
    uid = new Date;
    (this.cache = window.localStorage).setItem(uid, uid);
    fail = this.cache.getItem(uid) != uid;
    this.cache.removeItem(uid);
    fail && (this.cache = false);
  } catch (exception) {
    this.cache = {};
  }

  if (Cedar.config.fetch) {
    this.refresh();
  }
};

/**
 * store a single json item by key
 *
 * @param <string> 'key'
 * @param <json> 'item'
 */
Cedar.Store.prototype.put = function ( key, item ) {
  this.cache[key] = typeof item === "string" ? item : JSON.stringify(item);
};

// Return promise of parsed content from local or remote storage
Cedar.Store.prototype.get = function(key) {
  return this.getDeferred(key).then(function(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  });
};

// Return local content immediately if possible. Otherwise return deferred remote content
Cedar.Store.prototype.getDeferred = function(key) {
  var cachedDeferred = this.cachedDeferred(key);
  var remoteDeferred = this.remoteDeferred(key);

  if (Cedar.config.wait || !this.cache[key]) {
    Cedar.debug('checking remote: ' + key);
    return remoteDeferred;
  } else {
    Cedar.debug('get from cache: ' + key);
    return cachedDeferred;
  }
};

// Deferred object containing local content
Cedar.Store.prototype.cachedDeferred = function(key) {
  return $.Deferred().resolve(this.cache[key]);
};

// Refresh local storage if needed and then return content
Cedar.Store.prototype.remoteDeferred = function(key) {
  return this.refresh().then(function() {
    return this.cachedDeferred(key);
  }.bind(this));
};

// Check content version and update if needed
Cedar.Store.prototype.refresh = function() {
  return this.checkVersion().then(function() {
    if (this.loaded) {
      return $.Deferred().resolve();
    } else {
      return this.getRemote();
    }
  }.bind(this));
};

// Get content objects from server and save to local storage
Cedar.Store.prototype.getRemote = function(options) {
  var defaultOptions = {
    path: '/queries/contententries/'
  };
  options = $.extend({}, defaultOptions, options);
  var defaultParams = {};
  var params = $.extend({}, defaultParams, {
    guidfilter: options.filter
  });

  return this.lockedRequest({
    path: options.path,
    params: params,
    success: function(response) {
      $.each(response, function (index, value) {
        if (value.hasOwnProperty('id') && value.settings.hasOwnProperty('content')) {
          this.put(value.id, value);
          Cedar.debug("storing: " + value.id);
        }
      }.bind(this));
      Cedar.debug("local storage was updated");
      this.loaded = true;
      Cedar.events.trigger("content:loaded");
    }.bind(this)
  });
};

/**
 * clear the local storage or remove a single locally store item by key
 *
 * @param {ID} key
 */
 Cedar.Store.prototype.clear = function(key) {
   if (key === undefined) {
     if (window.hasOwnProperty('localStorage')) {
       this.cache.clear();
     } else {
       this.cache = {};
     }
   }
   else {
     delete this.cache[key];
   }
 };

/**
 * set the locally stored data version number
 *
 * @return <string> data version number
 */
Cedar.Store.prototype.setVersion = function(id) {
  Cedar.debug("updating to version #" + id);
  this.cache["___CEDAR__DATA__FINGERPRINT___"] = id;
};

/**
 * return the currently stored data version number
 *
 * @return <string> data version number
 */
Cedar.Store.prototype.getVersion = function() {
  return this.cache["___CEDAR__DATA__FINGERPRINT___"];
};

/**
 * Query the server for the latest data version number
 *
 * @return <Deferred>
 */
Cedar.Store.prototype.checkVersion = function() {
  return this.lockedRequest({
    path: '/queries/status',
    success: function(response) {
      Cedar.debug("checking version #" + this.getVersion());

      // response.settings.version is being returned as an array and must be converted
      if ( this.getVersion() !== response.settings.version.toString() ) {
        Cedar.debug('setting version: ' + response.settings.version);
        this.loaded = false;
        this.setVersion(response.settings.version);
      } else {
        Cedar.debug("version is up to date");
        this.loaded = true;
        Cedar.events.trigger("content:loaded");
      }
    }.bind(this)
  });
};

// Returns an already resolving getJSON request if it matches
Cedar.Store.prototype.lockedRequest = function(options) {
  options = options || {};
  this.requestCache || (this.requestCache = {});

  var requestKey = JSON.stringify({path: options.path, params: options.params});
  var request = $.Deferred().resolve();

  if (Cedar.config.liveMode) {
    request = $.getJSON(Cedar.config.api + options.path, options.params)
      .then(function(response) {
        options.success(response);
      }.bind(this));
  }

  return this.requestCache[requestKey] || (this.requestCache[requestKey] = request);
};


/*
Cedar.ContentObject
Parent class for all Cedar content object types
*/
Cedar.ContentObject = function(options) {
  var defaults = {
    el: '<div />'
  };
  this.options = $.extend({}, defaults, options);
  this.$el = $(this.options.el);
};

Cedar.ContentObject.prototype = {
  render: function() {
    this.load().then(function() {
      this.$el.html(this.toString());
    }.bind(this));
  },

  load: function() {
    return Cedar.store.get(this.options.cedarId).then(function(data) {
      this.setContent(data);
      return this;
    }.bind(this));
  },

  getContent: function() {
    return this.content || this.options.defaultContent;
  },

  setContent: function(data) {
    this.content = data;
  },

  getContentWithEditTools: function() {
    return this.getEditOpen() + this.getContent() + this.getEditClose();
  },

  toString: function() {
    return Cedar.auth.isEditMode() ? this.getContentWithEditTools() : this.getContent();
  },

  toJSON: function() {
    return {
      content: this.getContent()
    };
  },

  getEditOpen: function() {
    var jsString = "if(event.stopPropagation){event.stopPropagation();}" +
    "event.cancelBubble=true;" +
    "window.location.href=this.attributes.href.value + \'&referer=' + encodeURIComponent(window.location.href) + '\';" +
    "return false;";

    var block = '<span class="cedar-cms-editable clearfix">';
    block += '<span class="cedar-cms-edit-tools">';
    block += '<a onclick="' + jsString + '" href="' + Cedar.config.server +
             '/cmsadmin/EditData?cdr=1&t=ContentEntry&o=' +
             encodeURIComponent(this.options.cedarId) +
             '" class="cedar-cms-edit-icon cedar-js-edit" >';
    block += '<i class="cedar-cms-icon cedar-cms-icon-right cedar-cms-icon-edit"></i></a>';
    block += '</span>';
    return block;
  },

  getEditClose: function() {
    return '</span>';
  }
};

Cedar.ContentObject.prototype.constructor = Cedar.ContentObject;

/*
Cedar.ContentEntry
basic content block class
*/
Cedar.ContentEntry = function(options) {
  Cedar.ContentObject.call(this, options);
};
Cedar.ContentEntry.prototype = Object.create(Cedar.ContentObject.prototype);
Cedar.ContentEntry.prototype.constructor = Cedar.ContentEntry;

Cedar.ContentEntry.prototype.setContent = function(data) {
  this.content = (data && (data.settings && data.settings.content)) || '';
};

/*
Cedar.Program
program object class
*/
Cedar.Program = function(options) {
  Cedar.ContentObject.call(this, options);
};
Cedar.Program.prototype = Object.create(Cedar.ContentObject.prototype);
Cedar.Program.prototype.constructor = Cedar.Program;

Cedar.Program.prototype.setContent = function(data) {
  this.content = (data && (data.settings && JSON.parse(data.settings.content))) || '';
};

Cedar.Program.prototype.toJSON = function(data) {
  return this.content;
};
