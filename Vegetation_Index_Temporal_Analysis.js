Map.setOptions('SATELLITE');
// Load GEE feature collection for countries
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
// Filter to get the boundary of India
var india = countries.filter(ee.Filter.eq('country_na', 'India'));

var aoi = india.geometry()
//var aoi = dummyGeometry.geometry();

// Define the initial date range
var startDate = '2019-01-01';
var endDate = '2023-12-01';

var palette = ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red'];

// Default Dataset
var dataset_name = "MODIS/061/MOD13Q1";

// Default Band Selection
var interested_band = 'NDVI'

var visParams = {
  min: 0.0,
  max: 9000.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};




// Load the dataset
var image_collection = ee.ImageCollection(dataset_name)
                .select(interested_band)
                .filterDate(startDate, endDate)
                .filterBounds(aoi)
                .median();

var reduced_analysis_region = image_collection.reduce(ee.Reducer.mean()).clip(aoi);

// Add the layer to the map for visualization
Map.setCenter(86.20097,22.78608, 13); // Adjust zoom level as necessary

// Define the button to set AOI to the whole country
var setAOIToCountryButton = ui.Button({
  label: 'Inspect the index across India',
  onClick: function() {
    aoi = india.geometry();
    Map.setCenter(86.20097,22.78608, 6); // Adjust zoom level as necessary
    updateMap(); // Refresh the map with the new AOI
  },
  style: {stretch: 'horizontal', color:'green'}
});


// Legend
var nSteps = 100
// Creates a color bar thumbnail image for use in legend from the given color palette
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, nSteps, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 0,
    max: nSteps,
    palette: palette,
  };
}

// Create the colour bar for the legend
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0).int(),
  params: makeColorBarParams(visParams
    .palette),
  style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '12px'},
});

// Create a panel with two numbers for the legend
var legendLabels = ui.Panel({
  widgets: [
    ui.Label('Min', {margin: '0px 50px 0px 8px'}),
    ui.Label('Max', {margin: '0px 8px 0px 50px'})
  ],
  layout: ui.Panel.Layout.flow('horizontal')
});

// Legend title
var legendTitle = ui.Label({
  value: 'Vegetation Index',
  style: {
    fontWeight: 'bold',
    textAlign: 'center',
    stretch:'horizontal'
  }
});

// Add the legendPanel to the map
var legendPanel = ui.Panel({
  widgets: [legendTitle, colorBar, legendLabels],
  style: {
    padding:'8px',
    //position:'center'
  }
});
Map.add(legendPanel);




// Date sliders
var startDateSlider = ui.DateSlider({
  start: '2015-01-01',
  end: '2023-12-31',
  value: startDate,
  period: 1,
  style: {stretch: 'horizontal'}
});

var endDateSlider = ui.DateSlider({
  start: '2015-01-01',
  end: '2023-12-31',
  value: endDate,
  period: 1,
  style: {stretch: 'horizontal'}
});

var dateRangeButton = ui.Label({
  value: 'Current Date Range: ' + ee.Date(startDateSlider.getValue()[0]).format('YYYY-MM-dd').getInfo() + ' to ' + ee.Date(endDateSlider.getValue()[0]).format('YYYY-MM-dd').getInfo(),
  style: {stretch: 'horizontal', fontWeight:'bold', color:'blue', shown: true}
});


// Create success message
var successMessage2 = ui.Label({
  value: 'Date Range updated successfully. Please specify region of interest using the drawing tool',
  style: {color: 'green', fontWeight: 'bold', shown: false}
});

// Add the update button to update the map based on the new date range
var updateDateRangeButton = ui.Button({
  label: 'Update Date Range',
  onClick: function() {
    var startDate = ee.Date(startDateSlider.getValue()[0]);
    var endDate = ee.Date(endDateSlider.getValue()[0]);
    // Show success message
    successMessage2.style().set('shown', true);
    // Hide the message after 5 seconds
    ui.util.setTimeout(function() {
      successMessage2.style().set('shown', false);
      sidePanel.remove(successMessage2);
    }, 10000);

    // Update the date range button label
    dateRangeButton.setValue('Current Date Range: ' + ee.Date(startDateSlider.getValue()[0]).format('YYYY-MM-dd').getInfo() + ' to ' + ee.Date(endDateSlider.getValue()[0]).format('YYYY-MM-dd').getInfo());
  },
  style: {stretch: 'horizontal',shown:'false'}
});

// Set callback to update map when the dates change
startDateSlider.onChange(function() {
  if (updateDateRangeButton) {
    updateDateRangeButton.style().set('shown', true);
  }
});
endDateSlider.onChange(function() {
  if (updateDateRangeButton) {
    updateDateRangeButton.style().set('shown', true);
  }
});




// GIF Generation

var generateGifButton = ui.Button({
  label: 'Generate GIF to show evolution of the latest layer',
  onClick: generateGIF,
  style: {stretch: 'horizontal',shown:false}
});

// Add the button to close generated GIF
var closeGifButton = ui.Button({
  label: 'Close GIF',
  onClick: closeGIF,
  style: {stretch: 'horizontal', shown: false}
});

// Panel to display the GIF
var gifPanel = ui.Panel({
style: {width: '400px', height: '500px'}
});
gifPanel.style().set('shown', false);

// Function to shut down GIF
function closeGIF(){
  gifPanel.style().set('shown', false);
}




// Function to generate and export the GIF
function generateGIF() {
  // Load the Sentinel-5P NO2 dataset
  var image_collection = ee.ImageCollection(dataset_name)
                  .select(interested_band)
                  .filterDate(startDate, endDate)
                  .filterBounds(aoi);
  
  
  // Create RGB visualization images for use as animation frames.
  var rgbVis = image_collection.map(function(img) {
    return img.visualize(visParams).clip(aoi);
  });
  
  // Define GIF visualization parameters.
  var gifParams = {
    'region': aoi,
    'dimensions': 400,
    'crs': 'EPSG:3857',
    'framesPerSecond': 5,
    'format': 'gif',
    'loop':1
  };
  var gifUrl = rgbVis.getVideoThumbURL(gifParams);
  var gifLabel = ui.Label({
    value: 'GIF URL',
    targetUrl: gifUrl,
    style: {fontSize: '16px', color: 'blue'}
  });

  gifPanel.clear();
  gifPanel.add(gifLabel);
  gifPanel.style().set('shown', true);
  gifPanel.add(ui.Thumbnail(rgbVis, gifParams));

  // Populate the date dropdown after generating the GIF
  populateDateDropdown();
  selectDateLabel.style().set('shown', true);
  dateSelect.style().set('shown', true);
  closeGifButton.style().set('shown', true);
}



// Global variable to store the image collection
var imageCollection = null;

// Create the "Select Date" label and hide it initially
var selectDateLabel = ui.Label('Select Individual Date & Add Layer on the Map:', {fontWeight: 'bold', shown: false});

// Function to populate the dropdown with available dates
function populateDateDropdown() {
  imageCollection = ee.ImageCollection(dataset_name)
                  .select(interested_band)
                  .filterDate(startDate, endDate)
                  .filterBounds(aoi);
  
  // Fetch the system:time_start property and populate the dropdown list
  var dateList = imageCollection.aggregate_array('system:time_start').getInfo();
  
  // Convert timestamp to readable date format
  var formattedDateList = dateList.map(function(timestamp) {
    var date = ee.Date(timestamp).format('YYYY-MM-dd').getInfo();
    return {label: date, value: timestamp};
  });

  print(formattedDateList)

  // Populate the dropdown with formatted dates
  dateSelect.items().reset(formattedDateList);
}


// Create a dropdown list to select a date and display the corresponding image
var dateSelect = ui.Select({
  items: [],
  onChange: function(selectedTimestamp) {
    updateMapForTimestamp(selectedTimestamp);
  },
  style: {stretch: 'horizontal', shown: false},
  placeholder: 'Select A Date',
});

// Function to update the map for the selected timestamp
function updateMapForTimestamp(selectedTimestamp) {
  if (!imageCollection) {
    print('Please generate the GIF first.');
    return;
  }

  var selectedImage = imageCollection.filter(ee.Filter.eq('system:time_start', parseInt(selectedTimestamp))).first();
  var rgbImage = selectedImage.visualize(visParams).clip(aoi);
  Map.addLayer(rgbImage, {}, 'Vegetation Index for Date: ' + ee.Date(selectedTimestamp).format('YYYY-MM-dd').getInfo());
  if (pointLayer) {
    Map.layers().add(pointLayer);
  }
}

// Time Series Chart

// Global variable to track if the time series chart function is enabled
var timeSeriesChartEnabled = false;

var timeSeriesNote = ui.Label({
  value: 'Please click on map to specify the interested locaiton',
  style: {color:'green', fontWeight: 'bold', shown: false},
})

// Create a sidePanel for the chart
var chartPanel = ui.Panel({
  style: {
    position:'bottom-right',
    height: '900px',
    width: '400px',
    shown: false}
});

// Create a title label
var chartTitle = ui.Label({
  value: 'Vegetation Index Time Series Panel',
  style: {
    fontSize: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '10px 0'
  }
});

chartPanel.add(chartTitle);

Map.add(chartPanel);


// Add button to enable time series chart generation
var timeSeriesButton = ui.Button({
  label: 'Inspect Time Series Chart',
  onClick: 
    enableTimeSeriesChart
  ,
  style: {stretch: 'horizontal',shown:false}
});


// Add button to disable time series chart generation
var disabletimeSeriesButton = ui.Button({
    label: 'Close Time Series Chart',
    onClick: disableTimeSeriesChart,
    style: {stretch: 'horizontal', shown: false},
  });
  // Add the button to the side sidePanel



// Function to enable time series chart generation
function enableTimeSeriesChart() {
  drawingTools.setShape(null); // Disable drawing tools
  timeSeriesChartEnabled = true;
  Map.onClick(generateTimeSeriesChart);
  chartPanel.style().set('shown', true)
  disabletimeSeriesButton.style().set('shown', true);
  timeSeriesNote.style().set('shown', true)
}

// Function to disable time series chart generation
function disableTimeSeriesChart() {
    drawingTools.setShape(null); // Disable drawing tools
    timeSeriesChartEnabled = false;
    chartPanel.style().set('shown',false);
    timeSeriesNote.style().set('shown', false)
}

// Function to generate the tim e series chart and place a marker
function generateTimeSeriesChart(coords){
  if (!timeSeriesChartEnabled) return; // Check if the chart generation is enabled

  var point = ee.Geometry.Point([coords.lon, coords.lat]);

  // Clear existing marker
  if (pointLayer) {
    Map.layers().remove(pointLayer);
  }

  // Draw new marker
  pointGeometry = point;
  pointLayer = ui.Map.Layer(pointGeometry, {color: 'red', pointSize: 10}, 'Marker');
  Map.layers().add(pointLayer);

  var startDate = ee.Date(startDateSlider.getValue()[0]);
  var endDate = ee.Date(endDateSlider.getValue()[0]);

  var image_collection = ee.ImageCollection(dataset_name)
              .select(interested_band)
              .filterDate(startDate, endDate)
              .filterBounds(point);

  var chart = ui.Chart.image.series({
    imageCollection: image_collection,
    region: point,
    reducer: ee.Reducer.mean(),
    scale: Map.getScale(),
    xProperty: 'system:time_start'
  }).setOptions({
    title: 'Vegetation Index Time Series',
    hAxis: {title: 'Date'},
    vAxis: {title: 'Vegetation Index'},
    legend: {position: 'none'},
    titleTextStyle: {
      fontSize: 14,
      bold: true,
      alignment: 'center',
    }
  });
  
  var startDateString = startDate.format('YYYY-MM-dd').getInfo();
  var endDateString = endDate.format('YYYY-MM-dd').getInfo();
  
  var layerName = 'Mean Vegetation Index (' + startDateString + ' to ' + endDateString + ')';

  // Create labels for information
  var coordsLabel = ui.Label(
    'Longitude: ' + coords.lon.toFixed(6) +
    ', Latitude: ' + coords.lat.toFixed(6)
  );
  
  var layerLabel = ui.Label(
    'Layer: ' + layerName
  );

  // Create the infoPanel and add labels to it
  var infoPanel = ui.Panel([coordsLabel, layerLabel]);
  // Add the infoPanel and chart to the chartPanel

  chartPanel.add(infoPanel);
  chartPanel.add(chart);

  // Ensure the chartPanel is shown
  chartPanel.style().set('shown', true);
}


var notification = ui.Label({
  value: 'Please use the drawing tool to specify the area of interest',
  style: {color:'green', fontSize:'14px', fontWeight:'bold'}
})

// Create success message
var successMessage2 = ui.Label({
  value: 'Date Range updated successfully. Please specify region of interest using the drawing tool',
  style: {color: 'green', fontWeight: 'bold', shown: false}
});

var notification2 = ui.Label('Inspect time series chart', {fontSize:'16px',fontWeight: 'bold',shown: false});




// Create opacity control slider
var opacitySlider = ui.Slider({
  min: 0,
  max: 1,
  value: 1,  // Default opacity is fully opaque
  step: 0.01,
  style: {stretch: 'horizontal', margin: '10px 20px'}
});

// Add a label for the slider
var opacityLabel = ui.Label('Adjust Layer Opacity:', {fontWeight: 'bold'});

// Function to update layer opacity based on slider value
function updateOpacity() {
  var opacity = opacitySlider.getValue(); // Corrected to use the opacitySlider variable
  var layers = Map.layers();
  // Update the opacity for each layer
  layers.forEach(function(layer) {
    layer.setOpacity(opacity);
  });
}

// Set the onChange event handler for the opacity slider
opacitySlider.onChange(updateOpacity);



// Create zoom level control slider
var zoomSlider = ui.Slider({
  min: 0,
  max: 20, // Set the max zoom level as per your data resolution and user experience
  value: 13, // Default starting zoom level
  step: 1,
  style: {stretch: 'horizontal', margin: '10px 20px'}
});

// Add a label for the zoom slider
var zoomLabel = ui.Label('Adjust Map Zoom Level:', {fontWeight: 'bold'});

// Function to update map zoom level based on slider value
function updateZoom() {
  var zoomLevel = zoomSlider.getValue();
  Map.setZoom(zoomLevel);
}

// Set the onChange event handler for the zoom slider
zoomSlider.onChange(updateZoom);




// Right-hand Side UI Panel
var sidePanel = ui.Panel({
  widgets: [
    ui.Label('Analysing Vegetation', {fontSize:'20px',fontWeight: 'bold'}),
    notification,
    dateRangeButton,
    setAOIToCountryButton,
    generateGifButton,
    gifPanel,
    closeGifButton,
    selectDateLabel,
    dateSelect,
    notification2,
    timeSeriesNote,
    timeSeriesButton,
    disabletimeSeriesButton,
    opacityLabel,
    opacitySlider,
    zoomLabel,
    zoomSlider,
    ui.Label('Update Date Range', {fontSize:'16px',fontWeight: 'bold'}),
    ui.Label('Start Date', {fontWeight: 'bold'}),
    startDateSlider,
    ui.Label('End Date', {fontWeight: 'bold'}),
    endDateSlider,
    updateDateRangeButton,
    successMessage2,
  ],
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '400px'}
});

ui.root.add(sidePanel);







// Drawing Tool

// Create a sidePanel for drawing tools and controls
var drawingTools = Map.drawingTools();
drawingTools.setShown(false);

while (drawingTools.layers().length() > 0) {
  var layer = drawingTools.layers().get(0);
  drawingTools.layers().remove(layer);
}

var dummyGeometry = ui.Map.GeometryLayer({geometries: null, name: 'geometry', color: '23cba7'});
drawingTools.layers().add(dummyGeometry);

function clearGeometry() {
  var layers = drawingTools.layers();
  layers.get(0).geometries().remove(layers.get(0).geometries().get(0));
}

function drawRectangle() {
  clearGeometry();
  drawingTools.setShape('rectangle');
  drawingTools.draw();
  drawingTools.setShown(true);
}

function drawPolygon() {
  clearGeometry();
  drawingTools.setShape('polygon');
  drawingTools.draw();
  drawingTools.setShown(true);
}


drawingTools.onDraw(updateAOI);
drawingTools.onEdit(updateAOI);

var symbol = {
  rectangle: '⬛',
  polygon: '🔺',
};






// Marker Point Tool


var pointLayer = null;
var pointGeometry = null;

// Add input fields for longitude and latitude
var lonInput = ui.Textbox({
  placeholder: 'Longitude',
  style: {stretch: 'horizontal'}
});

var latInput = ui.Textbox({
  placeholder: 'Latitude',
  style: {stretch: 'horizontal'}
});

// Add button to place the marker on the map
var placeMarkerButton = ui.Button({
  label: 'Place Marker',
  onClick: placeMarker,
  style: {stretch: 'horizontal'}
});

// Function to place the marker on the map
function placeMarker() {
  var lon = parseFloat(lonInput.getValue());
  var lat = parseFloat(latInput.getValue());
  Map.setCenter(lon, lat);
  if (!isNaN(lon) && !isNaN(lat)) {
    pointGeometry = ee.Geometry.Point([lon, lat]);
    if (pointLayer) {
      Map.layers().remove(pointLayer);
    }
    pointLayer = ui.Map.Layer(pointGeometry, {color: 'red', pointSize: 10}, 'Marker');
    Map.layers().add(pointLayer);
  } else {
    print('Invalid longitude or latitude');
  }
}

// Function to delete the gifUrl variable if it exists
function deleteGifUrl() {
  if (typeof gifUrl !== 'undefined') {
    gifUrl.style().set('shown', false);
  } else {
  }
}




// Initialise Map

// UI Button
var initMapButton = ui.Button({
  label: 'Initialize Map',
  onClick: initializeMap,
  style: {stretch: 'horizontal'}
});

// Function to initialize the map and clear all layers
function initializeMap() {
  Map.clear();
  Map.setOptions('SATELLITE');
  Map.setCenter(86.20097,22.78608, 13);
  Map.add(legendPanel);
  Map.add(controlPanel);
  Map.add(chartPanel);
  selectDateLabel.style().set('shown', false);
  dateSelect.style().set('shown', false);
  generateGifButton.style().set('shown', false);
  gifPanel.style().set('shown', false);
  deleteGifUrl();
  // gifUrl.style().set('shown', false);
  timeSeriesButton.style().set('shown', false);
  disabletimeSeriesButton.style().set('shown',false);
  timeSeriesNote.style().set('shown', false);
  chartPanel.clear();
  chartPanel.style().set('shown',false);
  notification2.style().set('shown',false);
}



// Clearing Buttons

// Add button to clear the drawn polygon
var clearPolygonButton = ui.Button({
  label: 'Clear Polygon',
  onClick: clearPolygon,
  style: {stretch: 'horizontal'}
});

function clearPolygon() {
  var Layer = Map.layers().filter(function(layer) {
    return layer.getName() === 'Vegetation Index';
  });
  if (Layer.length > 0) {
    Map.layers().remove(Layer[0]);
  }
}

// Add button to clear the drawn marker
var clearMarkerButton = ui.Button({
  label: 'Clear Marker',
  onClick: clearMarker,
  style: {stretch: 'horizontal'}
});
// Function to clear the drawn marker
function clearMarker() {
  if (pointLayer) {
    Map.layers().remove(pointLayer);
    pointGeometry = null;
    pointLayer = null;
  }
}

function clearGeometry() {
  var layers = drawingTools.layers();
  if (layers.length() > 0 && layers.get(0).geometries().length() > 0) {
    
    layers.get(0).geometries().remove(layers.get(0).geometries().get(0));
    
  }
}




// Map Panel
var controlPanel = ui.Panel({
  widgets: [
    ui.Label('1. Specify coordinates to place a point.'),
    lonInput,
    latInput,
    placeMarkerButton,
    clearMarkerButton,
    ui.Label('2. Select a drawing mode and draw a geometry'),
    ui.Button({
      label: symbol.rectangle + ' Rectangle',
      onClick: drawRectangle,
      style: {stretch: 'horizontal'}
    }),
    ui.Button({
      label: symbol.polygon + ' Polygon',
      onClick: drawPolygon,
      style: {stretch: 'horizontal'}
    }),
    clearPolygonButton,
    initMapButton,
  ],
  style: {position: 'bottom-left', height:'450px',width:'300px'},
  layout: null,
});

Map.add(controlPanel);







// Function to update the map based on the selected dates
function updateMap() {
  var startDate = ee.Date(startDateSlider.getValue()[0]);
  var endDate = ee.Date(endDateSlider.getValue()[0]);

  var startDateString = startDate.format('YYYY-MM-dd').getInfo();
  var endDateString = endDate.format('YYYY-MM-dd').getInfo();
  
  var layerName = 'Mean Vegetation Index (' + startDateString + ' to ' + endDateString + ')';

  var reduced_analysis_region = image_collection.clip(aoi);

  clearGeometry();
  Map.addLayer(reduced_analysis_region, visParams, layerName);

  selectDateLabel.style().set('shown', false);
  dateSelect.style().set('shown', false);
  generateGifButton.style().set('shown', true);
  timeSeriesButton.style().set('shown', true)
  notification2.style().set('shown',true)

  if (pointLayer) {
    Map.layers().add(pointLayer);
  }else{}

  clearGeometry();  // Clear the drawn polygon after updating the map

}


// Function to update the area of interest (AOI)
function updateAOI() {
  var geometries = drawingTools.layers().get(0).geometries();
  if (geometries.length() > 0) {
    var drawnGeometry = geometries.get(0);
    aoi = drawnGeometry;
    drawingTools.stop();
    updateMap();
  }
}