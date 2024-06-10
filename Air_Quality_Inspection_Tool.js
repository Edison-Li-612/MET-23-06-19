Map.setOptions('SATELLITE');


// Load GEE feature collection for countries
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
// Filter to get the boundary of India
var india = countries.filter(ee.Filter.eq('country_na', 'India'));

var aoi = india.geometry();
//var aoi = dummyGeometry.geometry();

// Define the initial date range
var startDate = '2023-05-01';
var endDate = '2023-06-01';

var palette = ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red'];

// Default Dataset
var dataset_name = 'COPERNICUS/S5P/NRTI/L3_NO2';

// Default Band Selection
var interested_band = 'NO2_column_number_density'

// Default Visualisation Parameter for NO2
var visParams = {
  min: 0,
  max: 0.0002,
  palette: palette
}




// Define the dataset information
var datasetInfo = {
  'Aerosol': {
    'dataset_name': 'COPERNICUS/S5P/OFFL/L3_AER_AI',
    'interested_band': 'absorbing_aerosol_index',
    'visParams': {min: 0, max: 0.0002, palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']},
    'unit': 'n/a'
  },

  'NO2': {
    'dataset_name': 'COPERNICUS/S5P/NRTI/L3_NO2',
    'interested_band': 'NO2_column_number_density',
    'visParams': {min: 0, max: 0.0002, palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']},
    'unit': 'mol/m²'
  },
  'CO': {
    'dataset_name': 'COPERNICUS/S5P/NRTI/L3_CO',
    'interested_band': 'CO_column_number_density',
    'visParams': {min: 0, max: 0.05, palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']},
    'unit': 'mol/m²'
  },
  'O3': {
    'dataset_name': 'COPERNICUS/S5P/NRTI/L3_O3',
    'interested_band': 'O3_column_number_density',
    'visParams': {min: 0.12, max: 0.135, palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']},
    'unit': 'mol/m²'
  },
  'SO2': {
    'dataset_name': 'COPERNICUS/S5P/NRTI/L3_SO2',
    'interested_band': 'SO2_column_number_density',
    'visParams': {min: 0, max: 0.0005, palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']},
    'unit': 'mol/m²'
  },
  'HCHO': {
    'dataset_name': 'COPERNICUS/S5P/NRTI/L3_HCHO',
    'interested_band': 'tropospheric_HCHO_column_number_density',
    'visParams': {min: 0, max: 0.0003, palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']},
    'unit': 'mol/m²'
  },
  'CH4': {
    'dataset_name': 'COPERNICUS/S5P/OFFL/L3_CH4',
    'interested_band': 'CH4_column_volume_mixing_ratio_dry_air',
    'visParams': {min: 1800, max: 1950, palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']},
    'unit': 'mol fraction'
  }
};


// Define the button to set AOI to the whole country
var setAOIToCountryButton = ui.Button({
  label: 'Inspect the index across India',
  onClick: function() {
    aoi = india.geometry();
    updateMap(); // Refresh the map with the new AOI
  },
  style: {stretch: 'horizontal', color:'green'}
});



// Add the button to apply the dataset selection
var applySelectionButton = ui.Button({
  label: 'Apply Selection',
  onClick: updateDataset,
  style: {stretch: 'horizontal', shown: false}
});

// Create the dropdown button for dataset selection
var datasetSelect = ui.Select({
  items: Object.keys(datasetInfo),
  onChange: function(selected) {
    applySelectionButton.style().set('shown', true);
  },
  style: {stretch: 'horizontal'},
  //value: 'NO2',
});

// Create the label to display the unit
var infoLabel = ui.Label({
  value: 'Analysing Air Pollution',
  style: {fontSize: '20px', fontWeight: 'bold', stretch: 'horizontal'}
});

// Create success message
var successMessage = ui.Label({
  value: 'Dataset updated successfully. Please specify the analysis region using the drawing tool.',
  style: {color: 'green', fontWeight: 'bold', shown: false}
});

// Function to update the dataset parameters based on selection
function updateDataset() {
  var selected = datasetSelect.getValue();
  var info = datasetInfo[selected];
  dataset_name = info.dataset_name;
  interested_band = info.interested_band;
  visParams = info.visParams;

  // Update the unit label
  infoLabel.setValue( 'Selected Gas: ' + selected + ', Unit: '+ info.unit);

  // Show success message
  successMessage.style().set('shown', true);
  
  // Hide the message after 5 seconds
  ui.util.setTimeout(function() {
    successMessage.style().set('shown', false);
  }, 10000);
}


// Create success message
var successMessage3 = ui.Label({
  value: 'Layer Removed Successfully',
  style: {color: 'green', fontWeight: 'bold', shown: false}
});


var removeLabel = ui.Label('Remove Applied Layer:', {fontWeight: 'bold', shown: false});
var removeSelect = ui.Select({
  placeholder: 'Select a Layer to Remove',
  style: {fontSize: '16px', shown: false},
  disabled: true // Initially disabled until layers are added
});

// Add a button to remove the selected layer
var removeButton = ui.Button({
  label: 'Remove Selection',
  onClick: function() {
    var selected = removeSelect.getValue();
    if (selected) {
      removeLayer(selected);
      updateRemoveLayerList();
    }
    successMessage3.style().set('shown', true);
    // Hide the message after 5 seconds
    ui.util.setTimeout(function() {
      successMessage3.style().set('shown', false);
      side_panel.remove(successMessage);
    }, 5000);

  },
  style: {fontSize: '16px', shown: false}
});

function removeLayer(layerName) {
  var layers = Map.layers();
  for (var i = 0; i < layers.length(); i++) {
    if (layers.get(i).getName() === layerName) {
      Map.layers().remove(layers.get(i));
      break;
    }
  }
}

function updateRemoveLayerList() {
  var layers = Map.layers();
  var layerNames = [];
  for (var i = 0; i < layers.length(); i++) {
    layerNames.push(layers.get(i).getName());
  }
  removeSelect.items().reset(layerNames);
  removeSelect.setDisabled(layerNames.length === 0);

  // Show or hide the remove UI elements based on layer existence
  var showRemoveUI = layerNames.length > 0;
  removeLabel.style().set('shown', showRemoveUI);
  removeSelect.style().set('shown', showRemoveUI);
  removeButton.style().set('shown', showRemoveUI);
}








// Load the dataset
var image_collection = ee.ImageCollection(dataset_name)
                .select(interested_band)
                .filterDate(startDate, endDate)
                .filterBounds(aoi)
                .median();

var reduced_analysis_region = image_collection.reduce(ee.Reducer.mean()).clip(aoi);


Map.setCenter(86.20097,22.78608, 6);





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

// Create a side_panel with two numbers for the legend
var legendLabels = ui.Panel({
  widgets: [
    ui.Label('Min', {margin: '0px 50px 0px 8px'}),
    ui.Label('Max', {margin: '0px 8px 0px 50px'})
  ],
  layout: ui.Panel.Layout.flow('horizontal')
});


// Legend title
var legendTitle = ui.Label({
  value: 'Concentration',
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
      side_panel.remove(successMessage2);
    }, 10000);
  },
  style: {stretch: 'horizontal',shown:'false'}
});


// Date sliders
var startDateSlider = ui.DateSlider({
  start: '2023-01-01',
  end: '2023-12-31',
  value: startDate,
  period: 1,
  style: {stretch: 'horizontal'}
});

var endDateSlider = ui.DateSlider({
  start: '2023-01-01',
  end: '2023-12-31',
  value: endDate,
  period: 1,
  style: {stretch: 'horizontal'}
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
  label: 'Generate GIF to inspect evolution',
  onClick: generateGIF,
  style: {stretch: 'horizontal'}
});

// Add the button to close generated GIF
var closeGifButton = ui.Button({
  label: 'Close GIF',
  onClick: closeGIF,
  style: {stretch: 'horizontal'}
});

// Panel to display the GIF
var gifPanel = ui.Panel({
style: {width: '400px', height: '300px'}
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
  
  
  // Function to convert collection to GIF-compatible images
  function createImages(image_collection) {
    return image_collection.map(function(img) {
      var doy = ee.Date(img.get('system:time_start')).getRelative('day', 'year');
      return img.set('doy', doy);
    });
  }
  
  var gas_WithDOY = createImages(image_collection);
  
  var distinctDOY = gas_WithDOY.distinct('doy');
  
  // Debugging: print distinctDOY to verify it has multiple images
  // print('distinctDOY', distinctDOY);
  
  // Define a filter that identifies which images from the complete collection
  // match the DOY from the distinct DOY collection.
  var filter = ee.Filter.equals({leftField: 'doy', rightField: 'doy'});
  
  // Define a join.
  var join = ee.Join.saveAll('doy_matches');
  
  // Apply the join and convert the resulting FeatureCollection to an
  // ImageCollection.
  var joinCol = ee.ImageCollection(join.apply(distinctDOY, gas_WithDOY, filter));
  
  // Apply median reduction among matching DOY collections.
  var comp = joinCol.map(function(img) {
    var doyCol = ee.ImageCollection.fromImages(
      img.get('doy_matches')
    );
    return doyCol.reduce(ee.Reducer.median()).copyProperties(img,['doy']);
  });
  
  // Create RGB visualization images for use as animation frames.
  var rgbVis = comp.map(function(img) {
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
}

var selectGas = ui.Label({
  value: 'Select a gas index from below: ',
  style: {
    fontWeight: 'bold',
    color:'red',
    shown:'true'
  }
});


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
  value: 15, // Default starting zoom level
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
var side_panel = ui.Panel({
  widgets: [
    infoLabel,
    selectGas,
    datasetSelect,
    applySelectionButton,
    successMessage,
    setAOIToCountryButton,
    removeLabel,
    removeSelect,
    removeButton,
    successMessage3,
    opacityLabel,
    opacitySlider,
    zoomLabel,
    zoomSlider,
    ui.Label('Select Date Range', {fontSize:'16px',fontWeight: 'bold'}),
    ui.Label('Start Date', {fontWeight: 'bold'}),
    startDateSlider,
    ui.Label('End Date', {fontWeight: 'bold'}),
    endDateSlider,
    updateDateRangeButton,
    successMessage2,
    ui.Label('Inspect Evolution', {fontSize:'16px',fontWeight: 'bold'}),
    generateGifButton,
    gifPanel,
    closeGifButton,
  ],
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '400px'}
});

ui.root.add(side_panel);





// Drawing Tool

// Create a side_panel for drawing tools and controls
var drawingTools = Map.drawingTools();
//drawingTools.setShown(false);

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
  Map.onClick(generateTimeSeriesChart);
}

function drawPolygon() {
  clearGeometry();
  drawingTools.setShape('polygon');
  drawingTools.draw();
  drawingTools.setShown(true);
  Map.onClick(generateTimeSeriesChart);
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
  Map.setCenter(lon, lat, 15);
  if (!isNaN(lon) && !isNaN(lat)) {
    pointGeometry = ee.Geometry.Point([lon, lat]);
    var pointFeature = ee.Feature(pointGeometry);

    // Define a style for the point
    var pointStyle = {
      color: 'red',
      pointSize: 10,
      pointShape: 'circle'
    };

    if (pointLayer) {
      Map.layers().remove(pointLayer);
    }

    pointLayer = ui.Map.Layer(ee.FeatureCollection([pointFeature]).style(pointStyle), {}, 'Marker');
    Map.layers().add(pointLayer);
  } else {
    print('Invalid longitude or latitude');
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
  // Clear the map
  Map.clear();

  // Reset date sliders to initial values
  startDateSlider.setValue([startDate]);
  endDateSlider.setValue([endDate]);

  Map.setOptions('SATELLITE');
  Map.setCenter(86.20097,22.78608, 6);
  

  // Add the initial layers to the map
  Map.add(legendPanel);
  Map.add(controlPanel);
  Map.add(chartPanel);

  // Hide success messages
  successMessage.style().set('shown', false);
  successMessage2.style().set('shown', false);
  successMessage3.style().set('shown', false);
  
  // Reset other UI elements as needed
  removeLabel.style().set('shown', false);
  removeSelect.style().set('shown', false);
  removeButton.style().set('shown', false);

  // Update the remove layer list
  updateRemoveLayerList();

  // Reset other UI elements as needed
  applySelectionButton.style().set('shown', false);
  selectGas.style().set('shown', true);
  infoLabel.setValue('Analysing Air Pollution');
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
    return layer.getName() === 'Mean Concentration';
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






// **************************************

// Function to update the map based on the selected dates
function updateMap() {
  if (!dataset_name || !interested_band || !visParams) {
    print('Please select a dataset and apply the selection before updating the map.');
    return;
  }
  var startDate = ee.Date(startDateSlider.getValue()[0]);
  var endDate = ee.Date(endDateSlider.getValue()[0]);
  
  // Load the dataset
  var image_collection = ee.ImageCollection(dataset_name)
                            .select(interested_band)
                            .filterDate(startDate, endDate)
                            .filterBounds(aoi)
                            .median();
  
  var reduced_analysis_region = image_collection.reduce(ee.Reducer.median()).clip(aoi);

  var layerName = datasetSelect.getValue()+ ' Mean Concentration: ' + startDate.format('YYYY-MM-dd').getInfo() + ' - ' + endDate.format('YYYY-MM-dd').getInfo();

  // Map.clear();

  Map.addLayer(reduced_analysis_region, visParams, layerName);
  
  //Map.add(legendPanel);
  //Map.add(controlPanel);
  //Map.add(chartPanel);


  clearGeometry();  // Clear the drawn polygon after updating the map

  selectGas.style().set('shown',false);
  infoLabel.setValue( 'Analysing: ' + datasetSelect.getValue() + ', Unit: '+ datasetInfo[datasetSelect.getValue()].unit);
  updateRemoveLayerList();
}

// **************************************






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




// Time Series Chart


// Global variable to track if the time series chart function is enabled
var timeSeriesChartEnabled = false;


Map.onClick(generateTimeSeriesChart);

// Create a side_panel for the chart
var chartPanel = ui.Panel({
  style: {
    position:'bottom-right',
    height: '300px',
    width: '400px',
    shown: false}
});

Map.add(chartPanel);


// Add button to enable time series chart generation
var timeSeriesButton = ui.Button({
  label: 'Inspect Time Series Chart',
  onClick: enableTimeSeriesChart,
  style: {stretch: 'horizontal'}
});
// Add the button to the side side_panel
side_panel.widgets().add(timeSeriesButton);

// Add button to disable time series chart generation
var disabletimeSeriesButton = ui.Button({
    label: 'Disable Time Series Chart',
    onClick: disableTimeSeriesChart,
    style: {stretch: 'horizontal'},
  });
  // Add the button to the side side_panel

side_panel.widgets().add(disabletimeSeriesButton);


// Function to enable time series chart generation
function enableTimeSeriesChart() {
  drawingTools.setShape(null); // Disable drawing tools
  timeSeriesChartEnabled = true;
  Map.onClick(generateTimeSeriesChart);
}

// Function to disable time series chart generation
function disableTimeSeriesChart() {
    drawingTools.setShape(null); // Disable drawing tools
    timeSeriesChartEnabled = false;
    chartPanel.style().set('shown',false);
}





// Function to generate the time series chart and place a marker
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
    title: 'Concentration Time Series',
    hAxis: {title: 'Date'},
    vAxis: {title: 'Concentration'},
    legend: {position: 'none'}
  });

  // Add the chart to the chart panel
  chartPanel.widgets().reset([chart]);
  chartPanel.style().set('shown',true);
}