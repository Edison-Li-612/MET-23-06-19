var ndtiVis = {"opacity":1,"bands":["nd"],"min":-0.19028132468092593,"max":-0.043331651575001635,"palette":["ffff00","008000","0000ff"]},
    Dimna_Lake_Shape = ee.FeatureCollection("projects/supply-chain-observatory/assets/Dimna_Lake_Shape"),
    Subarnarekha_River_Section = ee.FeatureCollection("projects/supply-chain-observatory/assets/Subarnarekha_River_Section"),
    geometry = /* color: #d63000 */ee.Geometry.Point([86.19993508299703, 22.787459236439584]);


var startDate = '2020-01-01';
var endDate = '2020-01-30';


var dataset_name = "COPERNICUS/S2_HARMONIZED";

var geometries = {
  'Dimna Lake': Dimna_Lake_Shape,
  'Subarnarekha River': Subarnarekha_River_Section
};

// Create and add the legend
var nSteps = 100;
function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, nSteps, 0.1],
    dimensions: '100x20',
    format: 'png',
    min: 0,
    max: nSteps,
    palette: palette,
  };
}

var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0).int(),
  params: makeColorBarParams(ndtiVis.palette),
  style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '12px'},
});

var legendLabels = ui.Panel({
  widgets: [
    ui.Label('Min', {margin: '0px 42px 0px 8px'}),
    ui.Label('Max', {margin: '0px 8px 0px 42px'})
  ],
  layout: ui.Panel.Layout.flow('horizontal')
});

var legendTitle = ui.Label({
  value: 'Water Turbidity Index',
  style: {
    fontWeight: 'bold',
    textAlign: 'center',
    stretch: 'horizontal'
  }
});

var legendPanel = ui.Panel({
  widgets: [legendTitle, colorBar, legendLabels],
  style: {
    padding: '8px',
    
  }
});
Map.add(legendPanel);




// Create a UI panel
var panel = ui.Panel({
  style: {width: '400px', padding: '10px'}
});

// Add the panel to the map
ui.root.insert(0,panel);

// Add a title to the panel
panel.add(ui.Label({
  value: 'Analysing Turbidity of Water Bodies',
  style: {fontSize: '20px', fontWeight: 'bold'}
}));



panel.add(ui.Label('Select Water Bodies:', {fontSize:'16px',fontWeight: 'bold'}));
// Create a drop-down list (select widget) for geometries
var select = ui.Select({
  items: Object.keys(geometries),
  style: {fontSize: '16px'}, // Larger label for the drop-down list
  placeholder: 'Select a Water Body'
});

// Add the select widget to the panel
panel.add(select);




// Add date range sliders
var startDateSlider = ui.DateSlider({
  start: '2015-01-01',
  end: '2023-12-31',
  value: startDate,
  period: 30,
  onChange: function(date) {
    startDate = ee.Date(date.start()).format('YYYY-MM-dd').getInfo();
  },
  style: {stretch: 'horizontal'}
});

var endDateSlider = ui.DateSlider({
  start: '2015-01-01',
  end: '2023-12-31',
  value: endDate,
  period: 30,
  onChange: function(date) {
    endDate = ee.Date(date.start()).format('YYYY-MM-dd').getInfo();
  },
  style: {stretch: 'horizontal'}
});

// Add the notification panel for updating the date range
var dateRangeNotification = ui.Label('', {color: 'green', fontWeight: 'bold', shown: false});

// Add the update button to update the map based on the new date range
var updateButton = ui.Button({
  label: 'Update Date Range',
  onClick: function() {
    updateLayersWithNewDateRange();
    dateRangeNotification.setValue('Date range updated successfully.');
    dateRangeNotification.style().set('shown',true)

    ui.util.setTimeout(function() {
      dateRangeNotification.style().set('shown', false);
    }, 5000);
  }
});


panel.add(ui.Label('Select Date Range:', {fontSize:'16px',fontWeight: 'bold'}));
panel.add(ui.Label('Start Date', {fontWeight: 'bold'}));
panel.add(startDateSlider);
panel.add(ui.Label('End Date', {fontWeight: 'bold'}));
panel.add(endDateSlider);
panel.add(updateButton);
panel.add(dateRangeNotification);



// Add the notification panel for applying the water body
var waterbodyNotification = ui.Label('', {color: 'green', fontWeight: 'bold', shown: false});

// Add the notification panel if the added body alrady exists
var existNotification = ui.Label('');

// Add the notification panel if the added body alrady exists
var noshapeNotification = ui.Label('No Water Body being selected', {color: 'red', fontWeight: 'bold', shown: false});

// Add a button to apply the selected geometry
var applyButton = ui.Button({
  label: 'Apply Selection',
  onClick: function() {
    var selected = select.getValue();
    if (selected) {
      var aoi = geometries[selected];
      var layerName = 'NDTI ' + selected + ': ' + startDate + ' - ' + endDate;
      if (layerExists(layerName)) {
        waterbodyNotification.style().set('shown', false);
        existNotification.style().set('shown', true);
    
        existNotification.style().set('color', 'red');
        existNotification.setValue('Layer for ' + selected + ' with date range ' + startDate + ' - ' + endDate + ' already exists.');
    
        ui.util.setTimeout(function() {
          existNotification.style().set('shown', false);
        }, 5000);
        return;
      } else {
        addedShapesTitle.style().set('shown',true);
        updateNDTI(aoi, selected);
        waterbodyNotification.setValue('Water Body shape file applied successfully.');
        waterbodyNotification.style().set('shown', true);

        ui.util.setTimeout(function() {
          waterbodyNotification.style().set('shown', false);
        }, 5000);
      }
    } else{
      noshapeNotification.style().set('shown', true)

      ui.util.setTimeout(function() {
        noshapeNotification.style().set('shown', false);
      }, 5000)
    }
  },
  style: { width: '200px', height: '50px', fontWeight:'bold',fontSize:'14px'}
});
panel.add(applyButton);
panel.add(waterbodyNotification);
panel.add(existNotification);
panel.add(noshapeNotification);

// Function to update all layers with the new date range
function updateLayersWithNewDateRange() {
  var layers = Map.layers();
  for (var i = 0; i < layers.length(); i++) {
    var layer = layers.get(i);
    var label = layer.getName().replace('NDTI ', '');
    if (label in geometries) {
      var aoi = geometries[label];
      Map.layers().remove(layer);
      updateNDTI(aoi, label);
    }
  }
}



// Add a notification panel

// Add a list to show the names of added shapes
var addedShapesList = ui.Panel();
var addedShapesTitle = ui.Label('Added Shapes',{fontWeight: 'bold', shown:false})
panel.add(addedShapesTitle);
panel.add(addedShapesList);




// Add a drop-down list to center the map around added labels
var centerLabel = ui.Label('Center the map around:', {fontWeight: 'bold', shown: false});
var centerSelect = ui.Select({
  placeholder: 'Center map around',
  onChange: function(selected) {
    if (selected) {
      // Split the selected string to extract the geometry name
      var name = selected.split(':')[0].trim();
      console.log('Extracted name for centering:', name); // Debugging log

      var aoi = geometries[name];
      if (aoi) {
        Map.centerObject(aoi, 14); // Center the map around the geometry
      } else {
        console.error('Geometry not found for extracted name:', name); // Error log
      }
    }
  },
  style: {fontSize: '16px', shown: false}, // Larger label for the drop-down list
  disabled: true // Initially disabled
});
panel.add(centerLabel);
panel.add(centerSelect);





// Add a drop-down list to remove layers
var removeLabel = ui.Label('Remove Shapes:', {fontWeight: 'bold', shown: false});
var removeSelect = ui.Select({
  placeholder: 'Remove a Water Body',
  style: {fontSize: '16px',shown: false}, // Larger label for the drop-down list
  disabled: true // Initially disabled
});

// Add a button to remove the selected geometry
var removeButton = ui.Button({
  label: 'Remove Selection',
  onClick: function() {
    var selected = removeSelect.getValue();
    if (selected) {
      removeLayer(selected);
      updateAddedShapesList();
    }
  },
  style: {fontSize: '16px', shown:false}
});
panel.add(removeLabel);
panel.add(removeSelect);
panel.add(removeButton);

// Function to check if a layer already exists
function layerExists(layerName) {
  var layers = Map.layers();
  for (var i = 0; i < layers.length(); i++) {
    if (layers.get(i).getName() === layerName) {
      return true;
    }
  }
  return false;
}



// Function to update the list of added shapes
function updateAddedShapesList() {
  addedShapesList.clear();
  var layers = Map.layers();
  var addedShapes = [];
  for (var i = 0; i < layers.length(); i++) {
    var name = layers.get(i).getName().replace('NDTI ', '');
    addedShapes.push(name);
  }
  if (addedShapes.length === 0) {
    addedShapesList.add(ui.Label('No shapes being analysed'));
    centerSelect.setDisabled(true);
    removeSelect.setDisabled(true);
    centerLabel.style().set('shown', false);
    centerSelect.style().set('shown', false);
    removeLabel.style().set('shown', false);
    removeSelect.style().set('shown', false);
    removeButton.style().set('shown', false);
  } else {
    addedShapes.forEach(function(shape) {
      addedShapesList.add(ui.Label(shape));
    });
    centerSelect.setDisabled(false);
    removeSelect.setDisabled(false);
    centerLabel.style().set('shown', true);
    centerSelect.style().set('shown', true);
    removeLabel.style().set('shown', true);
    removeSelect.style().set('shown', true);
    removeButton.style().set('shown', true);
  }
  centerSelect.items().reset(addedShapes);
  removeSelect.items().reset(addedShapes);
}




// Function to compute and display NDTI for a given AOI
function updateNDTI(aoi, label) {
  var image_collection = ee.ImageCollection(dataset_name)
                  .filterDate(startDate, endDate)
                  .filterBounds(aoi)
                  .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 1)
                  .median();

  var image_clipped = image_collection.clip(aoi);

  var NDTI = image_clipped.normalizedDifference(['B4', 'B3']);

  var NDTI_Max = NDTI.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: aoi,
    scale: 30,
    maxPixels: 1e9
  });

  var NDTI_Min = NDTI.reduceRegion({
    reducer: ee.Reducer.min(),
    geometry: aoi
  });

  print(label + ' NDTI Max:', NDTI_Max);
  print(label + ' NDTI Min:', NDTI_Min);

  var layerName = 'NDTI ' + label + ': ' + startDate + ' - ' + endDate;

  Map.addLayer(NDTI, ndtiVis, layerName);
  Map.centerObject(aoi, 14);

  updateAddedShapesList(); // Update the list of added shapes
}


var removeNotification = ui.Label('');

// Function to remove a layer by label
function removeLayer(label) {
  var layers = Map.layers();
  for (var i = 0; i < layers.length(); i++) {
    if (layers.get(i).getName() === 'NDTI ' + label) {
      Map.layers().remove(layers.get(i));
      break;
    }
  }
  removeNotification.setValue('Layer for ' + label + ' removed.');

  ui.util.setTimeout(function() {
    removeNotification.setValue('');
  }, 5000);
}

panel.add(removeNotification);

// Set the initial base layer to satellite imagery
Map.setOptions('SATELLITE');


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

// Add the opacity control to the UI panel
panel.add(opacityLabel);
panel.add(opacitySlider);


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

// Add the zoom control to the UI panel
panel.add(zoomLabel);
panel.add(zoomSlider);

