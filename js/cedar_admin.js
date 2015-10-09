window.Cedar = window.Cedar || {};

Cedar.Admin = function() {
  if (this.isEditMode()) {
    this.toolbar();
  }

  this.scanDOM();
  this.observeDOM('body', _.bind(function() {
    this.scanDOM();
  }, this));
};

Cedar.Admin.prototype.scanDOM = function() {
  var cedarClass = "cedar-cms-editable";
  if (this.isEditMode()) {
    $('[data-cedar-type]').each(_.bind(function(index, el){
      var $el = $(el);
      if (!$el.hasClass(cedarClass)) {
        var editTools = $(this.getEditTools($el.data()));
        $el.prepend(editTools);
        $el.addClass(cedarClass + " clearfix");
        if (Cedar.config.inlineEditing) {
          $el.find('.cedar-js-edit').on('click', _.bind(this.loadIframeSrc, this));
        }
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

Cedar.Admin.prototype.loadIframeSrc = function(event) {
  event.preventDefault();
  this.$adminIframe.on("load", _.bind(function() {
    $(this.$adminIframe).off('load');
    $(this.$adminIframe).on('load', _.bind(function(event) {
      window.location.reload(true);
    }, this));
    try {
      var iframeContents = this.$adminIframe.contents();
      var iframeForm = iframeContents.find('#editForm');
      iframeContents.find('.cms-dashboard').hide();
      iframeContents.find('#cmsToolbarPlaceholder').hide();
      iframeForm.on('submit', _.bind(function(event) {
        this.$iframeContainer.hide();
      }, this));
      iframeForm.find('.s-cancel-edit').on('click', _.bind(this.hideIframe, this));
    } catch (error) {
    }
    this.$iframeContainer.show();
  }, this));
  this.$adminIframe.attr('src', event.currentTarget.href);
};

Cedar.Admin.prototype.isEditMode = function() {
  return this.hasEditModeCookie() || this.hasEditModeUrl();
};

Cedar.Admin.prototype.hasEditModeUrl = function() {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  var i = 0;
  while (i < sURLVariables.length) {
    if (sURLVariables[i] === 'cdrlogin') {
      document.cookie = "cedarEditMode=";
      return true;
    }
    i++;
  }
  return false;
};

Cedar.Admin.prototype.hasEditModeCookie = function() {
  return (new RegExp("(?:^|;\\s*)cedarEditMode\\s*\\=")).test(document.cookie);
};

Cedar.Admin.prototype.toolbar = function(show) {
  $(document).ready(_.bind(function() {
    this.$body = $('body');
    var globalActions = '<div class="cedar-cms-global-actions">' +
      '<a class="cedar-cms-global-action js-cedar-cms-log-off" href="#">' +
      '<span class="cedar-cms-icon cedar-cms-icon-nav"></span> ' +
      '<span class="cedar-cms-global-action-label">Log Off</span>' +
      '</a>' +
      '</div>';
    this.$body.append(globalActions);
    this.$body.addClass("cedar-cms-logged-in");
    $('.js-cedar-cms-log-off').on('click', _.bind(function(e) {
      this.logOff(e);
    }, this));

    if (Cedar.config.inlineEditing) {
      this.renderIframe();
    }
  }, this));
};

Cedar.Admin.prototype.renderIframe = function() {
  $(document).ready(_.bind(function() {
    var $body = $('.cedar-cms-global-actions');
    var $closeButton = $('<a class="cedar-cms-global-action js-cedar-cms-close-iframe" href="#">' +
      '<span class="cedar-cms-global-action-label">Close</span></a>');
    $closeButton.on("click", _.bind(this.hideIframe, this));
    this.$iframeContainer = $('<div class="cedar-cms-admin-iframe-container"></div>');
    this.$adminIframe = $('<iframe class="cedar-cms-admin-iframe" id="cedar-cms-admin-iframe">' +
      '</iframe>');
    this.$iframeContainer.append($closeButton);
    this.$iframeContainer.append(this.$adminIframe);
    $body.append(this.$iframeContainer);
    this.$iframeContainer.hide();
  }, this));
};

Cedar.Admin.prototype.hideIframe = function() {
  $(this.$adminIframe).off('load');
  this.$iframeContainer.hide();
};

Cedar.Admin.prototype.logOff = function(event) {
  event.preventDefault();
  document.cookie = "cedarEditMode=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  if (location.href === this.getLogOffURL()) {
    location.reload(true);
  } else {
    window.location.href = this.getLogOffURL();
  }
};

Cedar.Admin.prototype.getLogOffURL = function() {
  return this.removeURLParameter(window.location.href, 'cdrlogin');
};

Cedar.Admin.prototype.getEditLink = function(options) {
  var output = Cedar.config.server + '/cmsadmin/';
  output += options.cedarType === 'ContentEntry' ? 'Edit' : 'Select';
  output += 'Data?cdr=1&t=' + options.cedarType + '&o=' + encodeURIComponent(options.cedarId);
  output += '&referer=' + encodeURIComponent(window.location.href);

  return output;
};

Cedar.Admin.prototype.getEditTools = function(options) {
  var jsString = "if(event.stopPropagation){event.stopPropagation();}" +
  "event.cancelBubble=true;" +
  "window.location.href=this.attributes.href.value + \'&referer=' + encodeURIComponent(window.location.href) + '\';" +
  "return false;";

  var iconClass = options.cedarType === 'ContentEntry' ? 'edit' : 'list';

  var block = '<span class="cedar-cms-edit-tools">';
  block += '<a href="' + this.getEditLink(options) +
           '" class="cedar-cms-edit-icon cedar-js-edit" >';
  block += '<i class="cedar-cms-icon cedar-cms-icon-right cedar-cms-icon-' + iconClass + '"></i></a>';
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
