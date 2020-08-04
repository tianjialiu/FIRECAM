/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var firms = ee.ImageCollection("FIRMS"),
    geometry = 
    /* color: #f5f5f5 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[17.764030566055794, 9.004885763150753],
          [17.764030566055794, 5.080438986378634],
          [24.619499316055794, 5.080438986378634],
          [24.619499316055794, 9.004885763150753]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// *****************************************************************
// =================================================================
// --------------- Instructions for FIRMS Explorer -------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// @author Tianjia Liu (tianjialiu@g.harvard.edu)
// Last updated: August 4, 2020

// Purpose: plot timeseries of MODIS/FIRMS active fire counts
// by region and day of year, across years
*/
// =================================================================
// **********************   --    Code    --   *********************
// =================================================================

// Note: The drawing tools code is based on the tutorial by Justin Braaten:
// https://developers.google.com/earth-engine/tutorials/community/drawing-tools-region-reduction

// Hide the drawing tools widget; we want a really simple interface.
// We'll add our own buttons for geometry selection.
var baseMap = require('users/tl2581/packages:baseMap.js');
Map.drawingTools().setShown(false);
Map.setOptions('Map', {'Dark': baseMap.darkTheme});

// Define symbols for the labels.
var symbol = {
  rectangle: '⬛',
  polygon: '🔺'
};

// Set up a ui.Panel to hold instructions and the geometry drawing buttons.
var startYearSlider = ui.Slider({min:2001,max:2020,value:2017,step:1,
  style:{stretch:'horizontal'}});
var endYearSlider = ui.Slider({min:2001,max:2020,value:2020,step:1,
  style:{stretch:'horizontal'}});
var doyText = ui.Textbox({placeholder:'1-100',value:'1-100',
  style:{stretch:'horizontal'}});

var changeSliderYr = function() {
  var startYr = startYearSlider.getValue();
  var endYr = endYearSlider.getValue();
  if (endYr < startYr) {endYearSlider.setValue(startYr)}
};

startYearSlider.onChange(changeSliderYr);
endYearSlider.onChange(changeSliderYr);

var submitButton = ui.Button({
  label: 'Submit',
  style: {stretch: 'horizontal',margin:'2px 8px 8px 8px'}
});
      
var mainPanel = ui.Panel({
  widgets: [
    ui.Label('FIRMS Active Fires',{fontSize:'18px',fontWeight:'bold',margin: '6px 8px 2px 8px'}),
    ui.Label('1) Select time range:',{fontSize:'14.5px'}),
    ui.Panel([ui.Label('Start Year: ',{color:'#777'}),startYearSlider],ui.Panel.Layout.Flow('horizontal'),{stretch:'horizontal',margin:'-5px -8px 0px 8px'}),
    ui.Panel([ui.Label('End Year: ',{color:'#777'}),endYearSlider],ui.Panel.Layout.Flow('horizontal'),{stretch:'horizontal',margin:'-7px -8px 0px 8px'}),
    ui.Label('Filter by the day of year [1-366]:',{color:'#333',fontSize:'12px',margin:'5px 0px 0px 16px'}),
    ui.Label('NASA\'s Julian day calendar',{fontSize:'12px',margin:'2px 0px 5px 16px'},'https://landweb.modaps.eosdis.nasa.gov/browse/calendar.html'),
    ui.Panel([ui.Label('DOY Range: ',{color:'#777',margin:'12px 0 0 8px'}),doyText],ui.Panel.Layout.Flow('horizontal'),{stretch:'horizontal',margin:'-3px 8px 0px 8px'}),
    ui.Label('2) Select a drawing mode:',{fontSize:'14.5px'}),
    ui.Button({
      label: symbol.rectangle + ' Rectangle',
      onClick: drawRectangle,
      style: {stretch: 'horizontal'}}),
    ui.Button({
      label: symbol.polygon + ' Polygon',
      onClick: drawPolygon,
      style: {stretch: 'horizontal',margin:'2px 8px 8px 8px'}}),
    ui.Label('On the map, draw a geometry. Limit to small regions. You can also edit and move the geometry.',
      {fontSize:'13.5px',margin:'3px 8px 7px 8px',color:'#777'}),
    submitButton
  ],
  style: {position: 'bottom-left', stretch:'horizontal', width: '220px'},
  layout: ui.Panel.Layout.Flow('vertical'),
});


// Define a panel to hold the time series chart.
var chartPanel = ui.Panel({
  style: {
    height: '235px',
    width: '600px',
    position: 'bottom-right'
  }
});

// Define a panel to hold the legend.
var legendPanel = ui.Panel({
  style: {
    padding: '6px 3px 5px 5px',
    position: 'bottom-right'
  }
});

// Add the main panel to the Map.
Map.add(mainPanel);

// Get the drawing tools widget object.
var drawingTools = Map.drawingTools();

// Clear any existing geometries.
var nLayers = drawingTools.layers().length();
while (nLayers > 0) {
  var layer = drawingTools.layers().get(0);
  drawingTools.layers().remove(layer);
  nLayers = drawingTools.layers().length();
}

// Initialize a dummy GeometryLayer with null geometry acts as a placeholder
// for drawn geometries.
var dummyGeometry = ui.Map.GeometryLayer({
  geometries: null, name: 'geometry', color: 'F5F5F5'});

// Add the dummy geometry as a layer of the drawing tools widget.
drawingTools.layers().add(dummyGeometry);


// Define a function to clear the geometry from the layer when a
// drawing mode button is clicked.
function clearGeometry() {
  var layers = drawingTools.layers();
  layers.get(0).geometries().remove(layers.get(0).geometries().get(0));
}

// Define function for dealing with a click on the rectangle button.
function drawRectangle() {
  clearGeometry();
  drawingTools.setShape('rectangle');
  drawingTools.draw();
}

// Define function for dealing with a click on the polygon button.
function drawPolygon() {
  clearGeometry();
  drawingTools.setShape('polygon');
  drawingTools.draw();
}

// Color palette
var colPal = ee.Dictionary({
  1: ['#F4622E'],
  2: ['#FECC5C','#F03B20'],
  3: ['#FED976','#FD8D3C','#E31A1C'],
  4: ['#FECC5C','#FD8D3C','#F03B20','#BD0026'],
  5: ['#FED976','#FEB24C','#FD8D3C','#F03B20','#BD0026'],
  6: ['#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#B10026'],
  7: ['#FFEDA0','#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#B10026'],
  8: ['#FFEDA0','#FED976','#FEB24C','#FD8D3C','#FC4E2A','#E31A1C','#BD0026','#800026'],
  9: ['#FFEDA0','#FEDB7B','#FEBB56','#FD9A41','#FC6D32','#F23A24','#D9131E','#B50026','#800026'],
  10: ['#FFEDA0','#FEDD7F','#FEC35E','#FDA546','#FC863A','#FC542B','#EB2B20','#D20E20','#AF0026','#800026'],
  11: ['#FFEDA0','#FEDF82','#FEC965','#FDAE4A','#FD943F','#FC6D32','#F64327','#E51F1D','#CC0A22','#AA0026','#800026'],
  12: ['#FFEDA0','#FEE085','#FECE6A','#FEB54F','#FD9D43','#FC8138','#FC592D','#F03623','#DF171C','#C70723','#A60026','#800026'],
  13: ['#FFEDA0','#FEE187','#FED26F','#FEBB56','#FDA546','#FD903D','#FC6D32','#F94928','#EB2B20','#D9131E','#C30424','#A30026','#800026'],
  14: ['#FFEDA0','#FEE289','#FED572','#FEC15C','#FDAC49','#FD9840','#FC7E37','#FC5C2E','#F43D25','#E6211E','#D40F1F','#BF0125','#A00026','#800026'],
  15: ['#FFEDA0','#FEE38B','#FED976','#FEC561','#FEB24C','#FD9F44','#FD8D3C','#FC6D32','#FC4E2A','#EF3423','#E31A1C','#D00C21','#BD0026','#9E0026','#800026'],
  16: ['#FFEDA0','#FEE38C','#FEDA78','#FEC965','#FEB751','#FDA546','#FD943F','#FC7C37','#FC5E2E','#F74327','#EB2B20','#DD161D','#CC0A22','#B80026','#9C0026','#800026'],
  17: ['#FFEDA0','#FEE48D','#FEDB7B','#FECC68','#FEBB56','#FDAB49','#FD9A41','#FC893A','#FC6D32','#FC512B','#F23A24','#E7231E','#D9131E','#C80822','#B50026','#9A0026','#800026'],
  18: ['#FFEDA0','#FEE48E','#FEDC7D','#FECF6C','#FEBF5A','#FDAF4B','#FDA044','#FD913D','#FC7A36','#FC602F','#F94728','#EE3222','#E41D1C','#D5101F','#C50623','#B20026','#990026','#800026'],
  19: ['#FFEDA0','#FEE58F','#FEDD7F','#FED26F','#FEC35E','#FEB44E','#FDA546','#FD9740','#FC863A','#FC6D32','#FC542B','#F53F26','#EB2B20','#E0181C','#D20E20','#C30424','#AF0026','#970026','#800026'],
  20: ['#FFEDA0','#FEE590','#FEDE81','#FED471','#FEC662','#FEB852','#FDAA48','#FD9C42','#FD8E3C','#FC7936','#FC612F','#FA4B29','#F13824','#E8241E','#DC151D','#CE0C21','#C10224','#AC0026','#960026','#800026']
});

var continuousLegend = function(title, colPal, minVal, maxVal, units) {

  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '16px', margin: '0 0 6px 8px'});
  var unitsLabel = ui.Label(units, {margin: '-6px 0 6px 8px'});

  var vis = {min: minVal, max: maxVal, palette: colPal};

  var makeColorBarParams = function(palette) {
    return {
      bbox: [0, 0, 1, 0.1],
      dimensions: '110x15',
      format: 'png',
      min: 0,
      max: 1,
      palette: palette,
    };
  };

  // Create the color bar for the legend
  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: makeColorBarParams(vis.palette),
    style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
  });

  // Create a panel with three numbers for the legend
  var legendLabels = ui.Panel({
    widgets: [
      ui.Label(vis.min, {margin: '4px 8px'}),
      ui.Label('', {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'})
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

  return ui.Panel([legendTitle,unitsLabel,colorBar,legendLabels]);
};

// Define function to generate chart and add it to the chart panel.
var dirtyMap = false;
function chartBurnedArea() {
  // Make the chart panel visible the first time.
  if (dirtyMap === false) {
    Map.add(chartPanel);
    Map.add(legendPanel);
    dirtyMap = true;
  }
  
  // Clear the chart and legend panels.
  chartPanel.clear();
  legendPanel.clear();
  
  // Get the geometry.
  var aoi = drawingTools.layers().get(0).getEeObject();
  
  // Set drawing mode back to null.
  drawingTools.setShape(null);
  
  var startYear = startYearSlider.getValue();
  var endYear = endYearSlider.getValue();
  var doyRange = doyText.getValue().split('-');
  var startDay = parseFloat(doyRange[0]);
  var endDay = parseFloat(doyRange[1]);

  var nYear = ee.Number(endYear).subtract(ee.Number(startYear)).add(1);
  
  var firmsRange = ee.ImageCollection('FIRMS').select(['T21'],['FireCount'])
    .filterDate(ee.Date.fromYMD(startYear,1,1),ee.Date.fromYMD(endYear+1,1,1))
    .map(function(x) {
      return x.gt(0).selfMask().copyProperties(x,['system:time_start']);
    });
  
  var firmsYr = firmsRange.filter(ee.Filter.calendarRange(startYear,endYear,'year'))
    .filter(ee.Filter.calendarRange(startDay,endDay,'day_of_year'))
    .sum();
  
  Map.layers().remove(Map.layers().get(0));
  Map.addLayer(firmsYr.selfMask(),
    {palette:['yellow','orange','red'], min: 1, max: endYear-startYear+1},
    'FIRMS Count');

  var colPaln = colPal.get(ee.String(ee.Number(nYear).format()));

  var chart = ui.Chart.image.doySeriesByYear({
      imageCollection: firmsRange,
      bandName: 'FireCount',
      region: aoi,
      regionReducer: ee.Reducer.sum(),
      scale: 1000, 
      sameDayReducer: ee.Reducer.sum(),
      startDay: startDay,
      endDay: endDay
    }).setChartType('LineChart')
    .setOptions({
      vAxis: {
        title: 'Fire Counts',
        viewWindow: {
        min: 0,
      },
        format:'#####'
      },
      hAxis: {
        title: 'DOY',
        format: '###',
      },
      height: '211px',
      colors: colPaln.getInfo()
  });
  
  chartPanel.add(ui.Panel(chart,null,{margin: '-8px -8px 0px -18px'}));
  
  legendPanel.add(continuousLegend('Active Fires',colPaln,1,endYear-startYear+1,'number of years'));
}

submitButton.onClick(chartBurnedArea);
