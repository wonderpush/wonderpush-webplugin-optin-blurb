(function () {
  WonderPush.registerPlugin("optin-blurb", {

    /**
     * @typedef {Object} OptinBlurb.Options
     * @property {String} [message] - The blurb text.
     * @property {String} [querySelector] - The blurb will be installed inside nodes matching this query selector.
     * @property {boolean} [insertBefore] - When true, the blurb is inserted before any other child of the parent. Defaults to false, meaning the blurb is inserted after all children.
     * @property {String} [cssPrefix] - Defaults to 'wonderpush-'.
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
      const assets = WonderPushSDK.getAssets();
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
        if (options.alignment === 'right') this.element.classList.add(cssPrefix + 'align-right');
        if (options.alignment === 'center') this.element.classList.add(cssPrefix + 'align-center');
        this.element.style.display = 'none';
        this.element.style.padding = (options.verticalPadding || '0') + ' ' + (options.horizontalPadding || '0');
        if (options.imgUrl) {
          var img = document.createElement('img');
          img.src = options.imgUrl;
          this.element.appendChild(img);
        } else {
          var iconContainer = document.createElement('div');
          this.element.appendChild(iconContainer);
          iconContainer.classList.add(cssPrefix + 'icon-container');
          var icon = document.createElement('div');
          iconContainer.appendChild(icon);
          icon.classList.add(cssPrefix + 'icon');
          if (options.bellIconColor) {
            icon.style.backgroundColor = options.bellIconColor;
          }
          var assets = WonderPushSDK.getAssets();
          var iconUrl = options.bellIcon || assets.bell;
          icon.style.maskImage = "url("+iconUrl+")";
          icon.style.setProperty('-webkit-mask-image', icon.style.maskImage);
        }
        var link = document.createElement('a');
        this.element.appendChild(link);
        link.href = '#';
        link.textContent = message;
        link.addEventListener('click', function(e) {
          e.preventDefault();
        }.bind(this));
        this.element.addEventListener('click', function() {
          WonderPushSDK.subscribeToNotifications().catch(catchRegistrationErrors);
        });

        this.attach = function(parent) {
          parent.insertBefore(this.element, options.insertBefore ? (parent.firstChild || null) : null);
        }.bind(this);

        this.show = function() {
          this.element.style.display = '';
        }.bind(this);

        this.hide = function() {
          this.element.style.display = 'none';
        }.bind(this);
      }

      // Create the blurb(s)
      var blurbs = [];
      var querySelector = options.querySelector || '.wonderpush-blurb';
      var parents = options.multiple ? document.querySelectorAll(querySelector) : [document.querySelector(querySelector)];
      parents.forEach(function(parent) {
        var blurb = new Blurb();
        blurbs.push(blurb);
        blurb.attach(parent);
      });

      // Handle subscription state changes
      window.addEventListener('WonderPushEvent', function (event) {
        if (!event.detail || !event.detail.state || event.detail.name !== 'subscription') return;
        if (event.detail.state === WonderPushSDK.SubscriptionState.UNSUBSCRIBED) {
          blurbs.forEach(function(blurb) { blurb.show(); });
        }
        if (event.detail.state === WonderPushSDK.SubscriptionState.SUBSCRIBED) {
          blurbs.forEach(function(blurb) { blurb.hide(); });
        }
        if (event.detail.state === WonderPushSDK.SubscriptionState.DENIED) {
          blurbs.forEach(function(blurb) { blurb.show(); });
        }
      }.bind(this));

      // Main program
      if (WonderPushSDK.Notification.getSubscriptionState() === WonderPushSDK.SubscriptionState.SUBSCRIBED) {
        blurbs.forEach(function(blurb) { blurb.hide(); });
      } else {
        blurbs.forEach(function(blurb) { blurb.show(); });
      }
    }
  });
})();
