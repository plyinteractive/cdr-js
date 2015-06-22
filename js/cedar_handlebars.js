Handlebars.registerHelper('cedar', function(options) {
  "use strict";

  var hashCode = function(string) {
    var hash = 0;
    if (string.length == 0) return hash;
    for (var i = 0; i < string.length; i++) {
      var character = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + character;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  var unescapeHtml = function(string) {
    var MAP = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'"
    };

    return string.replace(/&#?\w+;/g, function(c) {
      return MAP[c];
    });
  };

  var blockHelperStyle = function() {
    if (typeof options.fn === "function") {
      return true;
    } else {
      return false;
    }
  };

  var replaceElement = function(id, content) {
    // If rendered element exists than insert the content
    var renderedEl = document.getElementById(id);
    if (renderedEl !== null) {
      var parentEl = renderedEl.parentNode;
      var tempEl = document.createElement("div");
      tempEl.innerHTML = content;

      // Insert content node by node and then remove the existing element
      var nodeList = tempEl.childNodes;
      var nodeListLength = nodeList.length;
      for(var i = 0; i < nodeListLength; i++) {
        parentEl.insertBefore(nodeList[0], renderedEl);
      }
      parentEl.removeChild(renderedEl);
    }
  }

  var tagName = options.hash.tagName || "span";
  if (blockHelperStyle()) {
    tagName = options.hash.tagName || "div";
  }

  var outputEl = document.createElement(tagName);
  outputEl.id = "cedar-js-" + hashCode(options.hash.id);

  var output = '';

  var type = options.hash.type || 'ContentEntry';

  new window.Cedar[type]({ cedarId: options.hash.id, defaultContent: options.hash.default }).load().then(function(contentEntry){
    if (blockHelperStyle()) {
      if (Cedar.auth.isEditMode()) {
        output += contentEntry.getEditOpen();
      }
      output += unescapeHtml(options.fn(contentEntry.toJSON()));
      if (Cedar.auth.isEditMode()) {
        output += contentEntry.getEditClose();
      }
    } else {
      output = contentEntry.toString();
    }

    replaceElement(outputEl.id, output);
  });

  return new Handlebars.SafeString(output || outputEl.outerHTML);
});
