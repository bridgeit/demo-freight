/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

(function(document) {
  'use strict';

  function finishLazyLoading(){
    // Grab a reference to our auto-binding template
    // and give it some initial binding values
    // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
    var app = document.querySelector('#app');

    //set default host;
    app.host = 'dev.bridgeit.io';

    app.displayInstalledToast = function() {
      // Check to make sure caching is actually enabled—it won't be in the dev environment.
      if (!document.querySelector('platinum-sw-cache').disabled) {
        document.querySelector('#caching-complete').show();
      }
    };

    // Listen for template bound event to know when bindings
    // have resolved and content has been stamped to the page
    app.addEventListener('dom-change', function() {
      console.log('Initializing demo');
      if( bridgeit.io.auth.isLoggedIn()){
        setTimeout(function(){
          setupNotificationListener();
          //initialize lastNotificationTimestamp so user list displays
          var demoData = app.$.demoView.$$('#demoData');
          if( demoData ){
             demoData.lastNotificationTimestamp = new Date().getTime();
          }
        }, 5000); 
      }
    });

    // Startup the Notification Push Listener after login
    window.addEventListener('onAfterLogin', function(){
      console.log('onAfterLogin callback: configuring notifications');
      setupNotificationListener();
    });

    function setupNotificationListener(){
      bridgeit.xio.push.attach('http://dev.bridgeit.io/pushio/demos/realms/freight', bridgeit.io.auth.getLastKnownUsername());
      bridgeit.xio.push.addListener(function (payload) {
          console.log('Notification: ', payload);

          //normalize payload TODO!!
          if( payload.message && typeof payload.message === 'object' && payload.message.message){
            payload.message = payload.message.message; 
          }

          //ignore first batch of notifications for admin as they are irrelevant
          payload.usernameFromGroup = payload.group.split('/').pop();
          if( payload.message === 'joined' && payload.username !== payload.usernameFromGroup ){
            console.log('suppressing notification display');
            return;
          }

          var messageToDisplay;
          if( payload.message === 'joined' ){
            messageToDisplay = payload.usernameFromGroup + ' joined';
          }
          else{
            messageToDisplay = payload.message;
          }

          var demoView = app.$.demoView;
          demoView.$$('demo-data').push('notifications', payload);

          demoView.message = messageToDisplay;
          demoView.querySelector('#toast').show();

          var demoData = demoView.$$('#demoData');
          if( demoData ){
            if( !demoData.notificationsByUser ){
              demoData.notificationsByUser = {};
            }
            var userNotificationList = demoData.notificationsByUser[payload.usernameFromGroup];
            if( !userNotificationList ){
              userNotificationList = demoData.notificationsByUser[payload.usernameFromGroup] = [];
            }
            userNotificationList.push(payload);
            demoData.lastNotificationTimestamp = payload.time;
          }
          else{
            console.warn('could not locate demoData element to store user notification');
          }
      });
      window.initializePushGroups(); //delegates to index.html for admins or client.html for regular users
    }

    

    // See https://github.com/Polymer/polymer/issues/1381
    window.addEventListener('WebComponentsReady', function() {
      // imports are loaded and elements have been registered
    });

    window.addEventListener('bridgeit-access-token-refreshed', function(e){
      console.log('demo app received event bridgeit-access-token-refreshed', e);
      bridgeit.xio.push.refreshConnection();
    });

    window.addEventListener('bridgeit-session-expired', function(e){
      console.log('demo app received event bridgeit-session-expired', e);
      bridgeit.xio.push.disconnect();
    });

    

    // Main area's paper-scroll-header-panel custom condensing transformation of
    // the appName in the middle-container and the bottom title in the bottom-container.
    // The appName is moved to top and shrunk on condensing. The bottom sub title
    // is shrunk to nothing on condensing.
    addEventListener('paper-header-transform', function(e) {
      var appName = document.querySelector('#mainToolbar .app-name');
      var middleContainer = document.querySelector('#mainToolbar .middle-container');
      var bottomContainer = document.querySelector('#mainToolbar .bottom-container');
      var detail = e.detail;
      var heightDiff = detail.height - detail.condensedHeight;
      var yRatio = Math.min(1, detail.y / heightDiff);
      var maxMiddleScale = 0.50;  // appName max size when condensed. The smaller the number the smaller the condensed size.
      var scaleMiddle = Math.max(maxMiddleScale, (heightDiff - detail.y) / (heightDiff / (1-maxMiddleScale))  + maxMiddleScale);
      var scaleBottom = 1 - yRatio;

      // Move/translate middleContainer
      Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', middleContainer);

      // Scale bottomContainer and bottom sub title to nothing and back
      Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)', bottomContainer);

      // Scale middleContainer appName
      Polymer.Base.transform('scale(' + scaleMiddle + ') translateZ(0)', appName);
    });

    // Close drawer after menu item is selected if drawerPanel is narrow
    app.onDataRouteClick = function() {
      var drawerPanel = document.getElementById('paperDrawerPanel');
      if (drawerPanel.narrow) {
        drawerPanel.closeDrawer();
      }
    };

    // Scroll page to top and expand header
    app.scrollPageToTop = function() {
      document.getElementById('mainContainer').scrollTop = 0;
    };
  }

  var webComponentsSupported = (
    'registerElement' in document &&
    'import' in document.createElement('link') &&
    'content' in document.createElement('template'));

  if( !webComponentsSupported ){
    var script = document.createElement('script');
    script.async = true;
    script.src = 'bower_components/webcomponentsjs/webcomponents-lite.min.js';
    script.onload = finishLazyLoading;
    document.head.appendChild(script);
  }
  else{
    finishLazyLoading();
  }  

})(document);