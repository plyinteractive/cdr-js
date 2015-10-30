(function() {
  window.Cedar = window.Cedar || {};

  /**
  * Cedar.Iframe
  *
  * Class for handling "iframe mode" of Cedar CMS admin screens
  *
  */
  Cedar.Iframe = function(options) {
    var defaults = {
      originCookieName: "cedarContentOrigin"
    };

    this.options = $.extend({}, $.extend({}, defaults, window.Cedar.config), options);

    if (this.isIframeMode()) {
      this.listenToParent();
      this.processDOM();
    }
  };

  Cedar.Iframe.prototype.isIframeMode = function() {
    return window.location.search.indexOf('iframeMode') >= 0;
  };

  Cedar.Iframe.prototype.listenToParent = function() {
    $(window).on("message", _.bind(function(event){
      document.cookie = this.options.originCookieName + "=" + event.originalEvent.origin;
    }, this));
  };

  Cedar.Iframe.prototype.callParentMethod = function(methodName) {
    window.parent.postMessage(methodName, this.getCookie(this.options.originCookieName));
  };

  Cedar.Iframe.prototype.parentHideIframe = function() {
    this.callParentMethod('hideIframe');
  };

  Cedar.Iframe.prototype.parentReload = function() {
    this.callParentMethod('hideIframeReload');
  };

  Cedar.Iframe.prototype.processDOM = function() {
    $('.cms-dashboard').hide();
    $('#cmsToolbarPlaceholder').hide();
    var iframeForm = $('#editForm');
    iframeForm.on('submit', _.bind(this.parentReload, this));
    iframeForm.find('.s-cancel-edit').click(_.bind(this.parentHideIframe, this));
  };

  Cedar.Iframe.prototype.getCookie = function(cname) {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for(var i=0; i<ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0)==' ') c = c.substring(1);
          if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
      }
      return "";
  };
})();
