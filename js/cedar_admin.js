window.Cedar = window.Cedar || {};

Cedar.Admin = function() {
  if (this.isEditMode()) {
    this.showGlobalActions();
  }

  this.scanDOM();
  this.observeDOM('body', _.bind(function() {
    this.scanDOM();
  }, this));
};

Cedar.Admin.prototype.scanDOM = function() {
  var cedarClass = "cedar-cms-editable";
  if (this.isEditMode()) {
    $('[data-cedar-id]').each(_.bind(function(index, el){
      var $el = $(el);
      if (!$el.hasClass(cedarClass)) {
        var editTools = $(this.getEditTools($el.data()));
        $el.prepend(editTools);
        $el.addClass(cedarClass + " clearfix");
      }
    }, this));
  }
};

Cedar.Admin.prototype.observeDOM = function(selector, callback) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  if (MutationObserver){
    var observer = new MutationObserver(function(mutations, observer) {
      if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
        observer.disconnect();
        callback();
        observer.observe($(selector)[0], { childList:true, subtree:true });
      }
    });
    observer.observe($(selector)[0], { childList:true, subtree:true });
  }
};

Cedar.Admin.prototype.isEditMode = function() {
  return this.isEditUrl();
};

Cedar.Admin.prototype.isEditUrl = function() {
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

Cedar.Admin.prototype.showGlobalActions = function() {
  $(document).ready(_.bind(function() {
    var $body = $('body');
    var globalActions = '<div class="cedar-cms-global-actions">' +
      '<a href="#" class="cedar-cms-global-action" onclick="window.location.reload();">' +
      '<span class="cedar-cms-icon cedar-cms-icon-edit"></span> ' +
      '<span class="cedar-cms-global-action-label">Refresh</span>' +
      '</a><br>' +
      '<a class="cedar-cms-global-action" href="' + this.getLogOffURL() + '">' +
      '<span class="cedar-cms-icon cedar-cms-icon-edit"></span> ' +
      '<span class="cedar-cms-global-action-label">Log Off Cedar</span>' +
      '</a>' +
      '</div>';
    $body.append(globalActions);
  }, this));
};

Cedar.Admin.prototype.getLogOffURL = function() {
  return this.removeURLParameter(window.location.href, 'cdrlogin');
};

Cedar.Admin.prototype.getEditTools = function(options) {
  var jsString = "if(event.stopPropagation){event.stopPropagation();}" +
  "event.cancelBubble=true;" +
  "window.location.href=this.attributes.href.value + \'&referer=' + encodeURIComponent(window.location.href) + '\';" +
  "return false;";

  var block = '<span class="cedar-cms-edit-tools">';
  block += '<a onclick="' + jsString + '" href="' + Cedar.config.server +
           '/cmsadmin/EditData?cdr=1&t=' +
           options.cedarType +
           '&o=' +
           encodeURIComponent(options.cedarId) +
           '" class="cedar-cms-edit-icon cedar-js-edit" >';
  block += '<i class="cedar-cms-icon cedar-cms-icon-right cedar-cms-icon-edit"></i></a>';
  block += '</span>';
  return block;
};

// adapted from stackoverflow:
// http://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript
Cedar.Admin.prototype.removeURLParameter = function(url, parameter) {
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
