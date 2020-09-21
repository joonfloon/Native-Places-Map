(function ($) {
   var _this = this;
   var _map = undefined;
   var _nameplaces={};
   var _layers = {};
   var _cssElements = [];

   _this.renderNamePlace = function(identifier) {
      var nameplacedata = _nameplaces[identifier];

      if (!nameplacedata) {
         // don't crash if the identifier is wrong
         return;
      }

      var latitude= parseFloat(nameplacedata["Latitude"]);
      var longitude= parseFloat(nameplacedata["Longitude"]);
      var navajoPlaceName= nameplacedata["Navajo Place Name"];
      var southernPaiuteName= nameplacedata["Southern Paiute Name"];
      var westernShoshoneName= nameplacedata["Western Shoshone (Goshute and Panamint) Name"];
      var uteName= nameplacedata["Ute Name"];
      var northernShoshoneName= nameplacedata["Northern Shoshone"];
//ok here is my attempt at distingutishing features//
      var mountainicon = L.icon({
      iconUrl: 'mountain.png';

      var marker = "mountainicon"
      if (feature.mountain)

       ;
//thats it
      var popupHTML ="";

      if (uteName && uteName.length > 1) {
         popupHTML += "<div class=\"uteName\">" + "Ute: " + uteName + "</div>";
      }

      if (southernPaiuteName && southernPaiuteName.length > 1) {
         popupHTML +=  "<div class=\"southernPaiuteName\">" + "Southern Paiute: " + southernPaiuteName + "</div>";
      }

      if (westernShoshoneName && westernShoshoneName.length > 1) {
         popupHTML +=  "<div class=\"westernShoshoneName\">" + "Western Shoshone: " + westernShoshoneName + "</div>";
      }

      if (northernShoshoneName && northernShoshoneName.length > 1) {
         popupHTML +=  "<div class=\"northernShoshoneName\">" + "Nothern Shoshone: " + northernShoshoneName + "</div>";
      }

      if (navajoPlaceName && navajoPlaceName.length > 1) {
         popupHTML +=  "<div class=\"navajoPlaceName\">" + "Navajo: " + navajoPlaceName + "</div>";
      }

      var polyLineCoordinatesString= nameplacedata["Polyline Coordinates"];
      var polyLineCoordinatesGEOJSON= JSON.parse(polyLineCoordinatesString);

      var marker= L.marker( [latitude, longitude] )
                 .bindPopup( popupHTML );

      var geoJSON = L.geoJSON( polyLineCoordinatesGEOJSON )
                 .bindPopup( popupHTML );

      // Add markers and GeoJSONs to individual layers
      var addToNavajoLayer =  navajoPlaceName && navajoPlaceName.length > 1;
      if (addToNavajoLayer) {
         marker.addTo(_layers["navajoLayer"]);
         geoJSON.addTo(_layers["navajoLayer"]);
      }

      var addToUteLayer =  uteName && uteName.length > 1;
      if (addToUteLayer) {
         marker.addTo(_layers["uteLayer"]);
         geoJSON.addTo(_layers["uteLayer"]);
      }

      var addToWesternShoshoneLayer =  westernShoshoneName && westernShoshoneName.length > 1;
      if (addToWesternShoshoneLayer) {
         marker.addTo(_layers["westernshoshoneLayer"]);
         geoJSON.addTo(_layers["westernshoshoneLayer"]);
      }

      var addToSouthernPaiuteLayer =  southernPaiuteName && southernPaiuteName.length > 1;
      if (addToSouthernPaiuteLayer) {
         marker.addTo(_layers["southernpaiuteLayer"]);
         geoJSON.addTo(_layers["southernpaiuteLayer"]);
      }

      var addToNorthernShoshoneLayer =  northernShoshoneName && northernShoshoneName.length > 1;
      if (addToNorthernShoshoneLayer) {
         marker.addTo(_layers["northernshoshoneLayer"]);
         geoJSON.addTo(_layers["northernshoshoneLayer"]);
      }
   };


   _this.onViewDataRecieved = function(data) {
      //render stuff on map
      var nameplaces=data.data;
      for (var nameplace of nameplaces){
         // parse the nameplace.data JSON into an object
         var nameplacedata=JSON.parse(nameplace.data);
         var identifier=nameplacedata["USGS ID Number"];

         if (!(identifier in _nameplaces)) {
            _nameplaces[identifier]=nameplacedata;
            _this.renderNamePlace(identifier);
         }
      }
   };
   //identify when moving the map
   _this.onViewchange = function() {
      var bounds = _map.getBounds();
      var latitude = (bounds._northEast.lat + bounds._southWest.lat) / 2;
      var longitude = (bounds._northEast.lng + bounds._southWest.lng) / 2;

      // use the total distance across the screen as a radius,
      var distance = _this.getDistanceKM(
         bounds._northEast.lat,
         bounds._northEast.lng,
         bounds._southWest.lat,
         bounds._southWest.lng,
      );
      // create list of markers rendered
      var seenFilter = "";
      var firstId = true;

      for (var id in _nameplaces) {
         if (!firstId) {
            seenFilter += ",";
         }
         firstId = false;
         seenFilter += id;
      }
      //return info to php for database
      var payload = {
         viewport : {
            center : {
               latitude : latitude,
               longitude : longitude
            },
            distance : distance
         },
         seenFilter : seenFilter
      };

      var serializedPayload = JSON.stringify(payload);

      console.log(serializedPayload);

      $.ajax({
         type: 'POST',
         url: Drupal.settings.basePath + 'native_map/get_view',
         dataType: 'json',
         success: _this.onViewDataRecieved,
         data: serializedPayload
       });
   };
   //fix for layer control rendering problem with one marker in multiple layers
   _this.fixLayerRendering = function(event) {
      var navajoLayer = _layers["navajoLayer"];
      var uteLayer = _layers["uteLayer"];
      var southernpaiuteLayer = _layers["southernpaiuteLayer"];
      var westernshoshoneLayer = _layers["westernshoshoneLayer"];
      var northernshoshoneLayer = _layers["northernshoshoneLayer"];

      // clear out previous css
      for (var index in _cssElements) {
          document.getElementsByTagName('head')[0].removeChild(_cssElements[index]);
      }

      _cssElements = [];

       var layerInputs = jQuery('.leaflet-control-layers-selector');

       function processLayer() {
         var input = jQuery(this);
          var isChecked = input.is(":checked");
          var checkboxName = input.parent().find('span').text().trim();
          var cssName = "";

          switch(checkboxName) {
            case "Navajo":
               _map.removeLayer(navajoLayer);
               if (isChecked) {
                   _map.addLayer(navajoLayer);
               }
               cssName = '.navajoPlaceName';
               break;
            case "Ute":
               _map.removeLayer(uteLayer);

               if (isChecked) {
                  _map.addLayer(uteLayer);
               }
               cssName = '.uteName';
               break;
            case "Southern Paiute":
               _map.removeLayer(southernpaiuteLayer);

               if (isChecked) {
                  _map.addLayer(southernpaiuteLayer);
               }
               cssName = '.southernPaiuteName';
               break;
            case "Western Shoshone":
               _map.removeLayer(westernshoshoneLayer);

               if (isChecked) {
                  _map.addLayer(westernshoshoneLayer);
               }
               cssName = '.westernShoshoneName';
               break;
            case "Northern Shoshone":
               _map.removeLayer(northernshoshoneLayer);

               if (isChecked) {
                  _map.addLayer(northernshoshoneLayer);
               }
               cssName = '.northernShoshoneName';
               break;
         }

         if (!isChecked) {
            var display = isChecked ? "initial" : "none";
            var cssRule = cssName + " { display:" + display + " }";

            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = cssRule;

            _cssElements.push(style);

            document.getElementsByTagName('head')[0].appendChild(style);
         }
       }

       layerInputs.each(processLayer);

       var layerInputs = jQuery('.leaflet-control-layers-selector');
       layerInputs.click(function() {
          setTimeout(function() {
              _this.fixLayerRendering();
          },1);
       });
   };

   _this.init = function() {
      var $mainContainer = jQuery("#replaceMe");

      $mainContainer.height("90%");
      _map = L.map('replaceMe').setView([39.3055, -111.6703], 9);

      $mainContainer.parentsUntil().height("100%");

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
         subdomains: 'abcd',
         maxZoom: 19
      }).addTo(_map);

      //alternative basemap tileset: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

      // Add layers
      var navajoLayer = L.layerGroup();
      _layers["navajoLayer"] = navajoLayer;
      navajoLayer.addTo(_map);

      var uteLayer = L.layerGroup();
      _layers["uteLayer"] = uteLayer;
      uteLayer.addTo(_map);

      var southernpaiuteLayer = L.layerGroup();
      _layers["southernpaiuteLayer"] = southernpaiuteLayer;
      southernpaiuteLayer.addTo(_map);

      var westernshoshoneLayer = L.layerGroup();
      _layers["westernshoshoneLayer"] = westernshoshoneLayer;
      westernshoshoneLayer.addTo(_map);

      var northernshoshoneLayer = L.layerGroup();
      _layers["northernshoshoneLayer"] = northernshoshoneLayer;
      northernshoshoneLayer.addTo(_map);

      var overlays = {"Navajo": navajoLayer,
                      "Ute": uteLayer,
                      "Southern Paiute": southernpaiuteLayer,
                      "Western Shoshone": westernshoshoneLayer,
                      "Northern Shoshone": northernshoshoneLayer};

      L.control.layers(null, overlays)
                .addTo( _map );

      // rendering fix for initial page resizing
      _map.invalidateSize();

      // fetch new data when the map is moved
      _map.on('moveend', _this.onViewchange);

      var layerInputs = jQuery('.leaflet-control-layers-selector');
      layerInputs.click(function() {
         setTimeout(function() {
             _this.fixLayerRendering();
         },1);
      });

      // scroll the map into view
      jQuery('html, body').animate(
         {
           scrollTop: $mainContainer.offset().top - 80,
         },
         500,
         'linear'
      );

      // fetch data on page load
      _this.onViewchange();
   };

   function toRad(Value)
   {
       return Value * Math.PI / 180;
   }

   _this.getDistanceKM = function(lat1, lon1, lat2, lon2) {
      var R = 6371; // km
      var dLat = toRad(lat2-lat1);
      var dLon = toRad(lon2-lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var d = R * c;
      return d;
   }

   Drupal.behaviors.native_map = {
     attach: function (context, settings) {
        _this.init();
     }
   };

 }(jQuery));
