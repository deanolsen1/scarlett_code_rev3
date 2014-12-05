$(document).ready(function() {
	var markers;
    var SMFilter = [];
	var PageFilter = [];
    
    L.mapbox.accessToken = 'pk.eyJ1Ijoic3poYW5nMjQ5IiwiYSI6Im9jN0UtRWMifQ.vCDJzEeXrVAIOFVLSD3Afg';
    var map = L.mapbox.map('map', 'szhang249.i6n0bn3j');
    map.setView([48.878, 2.358], 15);
    
	$.getJSON("data/Locationsv4.geojson")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info, data);
            //createLegend(info.min,info.max);
			createSliderUI(info.pages, info, data);
            menuSelection(info.SMs, info, data);
            updateMenu(info, data);
		})
		.fail(function() { alert("There has been a problem loading the data.")});
    
	function menuSelection(SMs, info, data) {
        var SMOptions = [];
        for (var index in SMs) {
            SMOptions.push("<input type=\"checkbox\" name=\"SMFilter\" value=\""+ SMs[index] +"\">" + SMs[index] + "</input>");
        }
        
        $("#SubjectiveMarkers").html(SMOptions.join("<br />"));
        $("#SubjectiveMarkers").on("click", function(event) {
            updateMenu(info, data);
        });
    }
    
    function updateMenu(info, data){
       SMFilter = [];
       $( "input:checkbox[name=SMFilter]:checked").each(function(){
           SMFilter.push($(this).val());
       });
	   /*PageFilter = [];
	   $( "input:range-slider[name=PageFilter]:input change").each(function(){
			PageFilter.push($(this).val());
		});*/
				
        createPropSymbols(info, data);
    }
    
	function updatePages(info, data) {
		PageFilter = [];
		$( "input:output[name=PageFilter]:input change").each(function(){
			PageFilter.push($(this).val());
		});
		createPropSymbols(info, data);
	}
        
    function processData(data) {
        var pages = [];
        var pageTracker = [];
        var SMs = []
        var SMTracker = [];
        
        for (var feature in data.features) {

			var properties = data.features[feature].properties;

            if (pageTracker[properties.Page] === undefined) {
                pages.push(properties.Page);
                pageTracker[properties.Page] = 1;
            }
            if (SMTracker[properties.SM] === undefined) {
                SMs.push(properties.SM);
                SMTracker[properties.SM] = 1;
            }
		}
        return { 
            SMs : SMs,
            pages : pages.sort(function(a,b){return a - b}) 
        };
    };
	//console.log(pages);
    
    function createPropSymbols(info, data, currentPage) {
        if (map.hasLayer(markers)){
            map.removeLayer(markers);
        };
		markers = L.geoJson(data, {
            filter: function(feature, layer) {
			
			if (currentPage){
				//uncheck all menu boxes

				//if page number matches currentPage, put feature on map
				if (feature.properties.Page == currentPage){
					return true;
				}
				else {
					return false;
				}
				
				//AND check the feature's correct box in the menu
			}
			else {
				if ($.inArray(feature.properties.SM,SMFilter) !== -1) {  
                   return true;
                }
				else {
					return false;
				};
			}
			
			
           },
			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

                    fillColor: PropColor(feature.properties.SM),
				    color: PropColor(feature.properties.SM),
                    weight: 3,
				    fillOpacity: 0.7
                }).on({
					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: '#000000'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: PropColor(feature.properties.SM) });
					}
				});
			}
		}).addTo(map);
		updatePropSymbols();
	} // end createPropSymbols()
	
    
    function PropColor(SM) {
        return "#c897d9";
        if(UVIndex >= "11") {
            return  "#b765a5";
        }
        else if (UVIndex >= "8") {
            return "#e4320e";
        }
        else if (UVIndex >= "6") {
            return "#ed8f00";
        }
        else {
            return "#fff209";
        }
	} // end PropColor()

    function updatePropSymbols() {
		markers.eachLayer(function(layer) {
			var props = layer.feature.properties;
			var	radius = calcPropRadius(props.SM);
			var	popupContent = "<i><b>" + props.SM + "</b></i>" + " <br>"+ props.Address +"<br>page " + props.Page ;
            
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });
            layer.options.color = PropColor(props.SM);
            layer.options.fillColor = PropColor(props.SM);
		});
	} // end updatePropSymbols
    
	function calcPropRadius(attributeValue) {
		var scaleFactor = 10,
			area = attributeValue * attributeValue * scaleFactor;
		return 10;
	} // end calcPropRadius
	
	function createSliderUI(Pages, info, data) {
		var sliderControl = L.control({ position: 'bottomleft'} );
		sliderControl.onAdd = function(map) {
			var slider = L.DomUtil.create("input", "range-slider");
			L.DomEvent.addListener(slider, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});
			$(slider)
				.attr({'type':'range', 
                       'max': Pages[Pages.length-1], 
                       'min':Pages[0], 
                       'step': 1,
					   'width' : 4,
                       'value': String(Pages[0])})
		        .on('input change', function() {
		        	//updatePropSymbols(Pages[$(this).val().toString()]);
					createPropSymbols(info, data, this.value);
		            $(".temporal-legend").text(this.value);
		        });
			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(Pages[0]);
		
	} // end createSliderUI()
    
	function createTemporalLegend(startTimestamp) {
		var temporalLegend = L.control({ position: 'bottomleft' });
		temporalLegend.onAdd = function(map) {
			var output = L.DomUtil.create("output", "temporal-legend");
			return output;
		}
		temporalLegend.addTo(map);
		$(".temporal-legend").text(startTimestamp);
	}	// end createTemporalLegend()

	
	
});
