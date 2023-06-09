(function () {
  WonderPush.registerPlugin("optin-blurb", {

    /**
     * @typedef {Object} OptinBlurb.Options
     * @property {String} [message] - The blurb text.
     * @property {WonderPushPluginSDK.URLFilters|undefined} [urlFilters] - URL filters to apply before showing the blurb.
     * @property {boolean} [noIcon] - Do not display an icon.
     * @property {String} [querySelector] - The blurb will be installed inside nodes matching this query selector.
     * @property {boolean} [insertBefore] - When true, the blurb is inserted before any other child of the parent. Defaults to false, meaning the blurb is inserted after all children.
     * @property {String} [cssPrefix] - Defaults to 'wonderpush-'.
     * @property {String} [linkStyle] - Will be used as the "style" attribute of the link element;
     * @property {String} [style] - Will be used as the "style" attribute of the container element;
     * @property {String} [bellIconColor] - Color of the bell icon. Defaults to #ff6f61
     * @property {String} [alignment] - 'left', 'right' or 'center'. Defaults to 'left'.
     * @property {String} [bellIcon] - URL of the bell icon. Use a transpared image whose alpha channel will be used to draw the icon, in the color specified by bellIconColor.
     * @property {String} [horizontalPadding] - Horizontal padding of blurb. Defaults to 0
     * @property {String} [verticalPadding] - Horizontal padding of blurb. Defaults to 0
     * @property {String} [imgUrl] - When given, the specified image will be used instead of the bell icon.
     * @property {boolean} [multiple] - When true, the blurb will be installed inside each node returned by document.querySelectorAll. Otherwise, the blurb will be installed in the node returned by document.querySelector(). Defaults to false.   */
    /**
     * The WonderPush JavaScript SDK instance.
     * @external WonderPushPluginSDK
     * @see {@link https://wonderpush.github.io/wonderpush-javascript-sdk/latest/WonderPushPluginSDK.html|WonderPush JavaScript Plugin SDK reference}
     */
    /**
     * WonderPush Web SDK plugin to present the user an opt-in blurb inciting users to subscribe to push notifications.
     * @class OptinBlurb
     * @param {external:WonderPushPluginSDK} WonderPushSDK - The WonderPush SDK instance provided automatically on instantiation.
     * @param {OptinBlurb.Options} options - The plugin options.
     */
    window: function OptinBlurb(WonderPushSDK, options) {
      options = options || {};
      // Do not show anything on unsupported browsers.
      if (!WonderPushSDK.isNativePushNotificationSupported()) {
        return {
        };
      }
      var translations = {
        "fr": {
          "Subscribe to our latest news and updates": "Abonnez-vous pour recevoir nos dernières offres",
        },
        "es": {
        },
        "it": {
        },
        "de": {
        },
        "pt": {
        },
        "nl": {
        },
        "pl": {
        },
      };
      var cssPrefix = 'wonderpush-';
      if (options.cssPrefix) cssPrefix = options.cssPrefix;
      var catchRegistrationErrors = function(error) {
        if (error instanceof WonderPush.Errors.UserCancellationError || error instanceof WonderPush.Errors.PermissionError) {
          console.warn(error);
          return;
        }
        console.error(error);
      };
      var locales = WonderPushSDK.getLocales ? WonderPushSDK.getLocales() || [] : [];
      var language = locales.map(function(x) { return x.split(/[-_]/)[0]; })[0] || (navigator.language || '').split('-')[0];

      /**
       * Translates the given text
       * @param text
       * @returns {*}
       */
      var _ = function (text) {
        if (translations.hasOwnProperty(language) && translations[language][text]) return translations[language][text];
        return text;
      };
      var message = options.message ? _(options.message) : _("Subscribe to our latest news and updates");
      WonderPushSDK.loadStylesheet('style.css');

      function Blurb() {
        this.element = document.createElement('div');
        this.element.classList.add(cssPrefix + 'blurb');
        if (options.style) {
          for (var key in options.style) {
            this.element.style[key] = options.style[key];
          }
        }
        if (options.alignment === 'right') this.element.classList.add(cssPrefix + 'align-right');
        if (options.alignment === 'center') this.element.classList.add(cssPrefix + 'align-center');
        this.element.style.display = 'none';
        this.element.style.padding = (options.verticalPadding || '0') + ' ' + (options.horizontalPadding || '0');
        if (options.imgUrl) {
          var img = document.createElement('img');
          img.src = options.imgUrl;
          this.element.appendChild(img);
        } else if (!options.noIcon) {
          var iconContainer = document.createElement('div');
          this.element.appendChild(iconContainer);
          iconContainer.classList.add(cssPrefix + 'icon-container');
          var icon = document.createElement('div');
          iconContainer.appendChild(icon);
          icon.classList.add(cssPrefix + 'icon');
          if (options.bellIconColor) {
            iconContainer.style.backgroundColor = options.bellIconColor;
          }
          var assets = WonderPushSDK.getAssets();
          var iconUrl = options.bellIcon || assets.bell;
          icon.style.maskImage = "url("+iconUrl+")";
          icon.style.setProperty('-webkit-mask-image', icon.style.maskImage);
        }
        var link = document.createElement('a');
        this.element.appendChild(link);
        if (options.linkStyle) {
          for (var styleKey in options.linkStyle) {
            link.style[styleKey] = options.linkStyle[styleKey];
          }
        }
        link.href = '#';
        link.textContent = message;
        link.addEventListener('click', function(e) {
          e.preventDefault();
        }.bind(this));
        this.element.addEventListener('click', function() {
          WonderPushSDK.subscribeToNotifications().catch(catchRegistrationErrors);
        });

        this.attach = function(parent) {
          if (!parent) return;
          parent.insertBefore(this.element, options.insertBefore ? (parent.firstChild || null) : null);
        }.bind(this);

        this.detach = function() {
          var parent = this.element.parentNode;
          if (parent) parent.removeChild(this.element);
        }.bind(this);

        this.show = function() {
          this.element.style.display = '';
        }.bind(this);

        this.hide = function() {
          this.element.style.display = 'none';
        }.bind(this);
      }

      var blurbs = [];

      function recreateBlurbs() {

        WonderPushSDK.logDebug('recreateBlurbs');

        // Detach all existing blurbs
        blurbs.forEach(x => x.detach());
        blurbs = [];

        // Check that we are at the right place
        if (options.urlFilters && WonderPushSDK.currentURLPassesFilters && !WonderPushSDK.currentURLPassesFilters(options.urlFilters)) {
          WonderPushSDK.logDebug('Current URL does not match url filters', options.urlFilters);
          return;
        }

        // Create and attach blurbs
        var querySelector = options.querySelector || '.wonderpush-blurb';
        var parents = options.multiple ? document.querySelectorAll(querySelector) : [document.querySelector(querySelector)];
        parents.forEach(function(parent) {
          if (!parent) {
            WonderPushSDK.logWarn('No element corresponding to selector', querySelector);
            return;
          }
          var blurb = new Blurb();
          blurbs.push(blurb);
          blurb.attach(parent);
        });

        // Show / hide them depending on the current subscription state
        if (WonderPushSDK.Notification.getSubscriptionState() === WonderPushSDK.SubscriptionState.SUBSCRIBED) {
          blurbs.forEach(function(blurb) { blurb.hide(); });
        } else {
          blurbs.forEach(function(blurb) { blurb.show(); });
        }

      }

      // Handle subscription state changes
      window.addEventListener('WonderPushEvent', function (event) {
        if (!event.detail || !event.detail.state || event.detail.name !== 'subscription') return;
        if (event.detail.state === WonderPushSDK.SubscriptionState.UNSUBSCRIBED) {
          WonderPushSDK.logDebug('Subscription state changed to unsubscribed, showing blurbs');
          blurbs.forEach(function(blurb) { blurb.show(); });
        }
        if (event.detail.state === WonderPushSDK.SubscriptionState.SUBSCRIBED) {
          WonderPushSDK.logDebug('Subscription state changed to subscribed, hiding blurbs');
          blurbs.forEach(function(blurb) { blurb.hide(); });
        }
        if (event.detail.state === WonderPushSDK.SubscriptionState.DENIED) {
          WonderPushSDK.logDebug('Subscription state changed to denied, showing blurbs');
          blurbs.forEach(function(blurb) { blurb.show(); });
        }
      }.bind(this));

      // ! Listen to a new URL
      var url = window.location.href;
      setInterval(() => {
        if (window.location.href === url) return;
        url = window.location.href;
        WonderPushSDK.logDebug('Change of URL detected, recreate blurbs');
        recreateBlurbs();
      }, 1000);

      // ! Listen to the end of window loading
      if (window.document.readyState === 'complete') {
        recreateBlurbs();
      } else {
        window.addEventListener("load", recreateBlurbs);
      }
    }
  });
})();
