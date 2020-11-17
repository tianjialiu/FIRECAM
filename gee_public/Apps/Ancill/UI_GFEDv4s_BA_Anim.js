// *******************************************************************
// ===================================================================
// --- Global Fire Emissions Database, v4s (GFEDv4s) Animations --- ||
// ===================================================================
// *******************************************************************
// Data from: https://www.globalfiredata.org/
// Citation: van der Werf et al. (2017)
// Global fire emissions estimates during 1997-2016
// https://doi.org/10.5194/essd-9-697-2017

// @author Tianjia Liu (tianjialiu@g.harvard.edu)
// Last updated: September 26, 2019

// =================================================================
// **********************   --    Code    --   *********************
// =================================================================
// --------------
// Load Modules |
// --------------
var baseMap = require('users/tl2581/packages:baseMap.js');
var baseRegions = require('users/tl2581/packages:baseRegions.js');
var colPals = require('users/tl2581/packages:colorPalette.js');
var gfed4_params = require('users/tl2581/FIRECAM:Modules/GFEDv4s_params.js');

// --------------
// Input Params |
// --------------
// GFEDv4s
var gfedv4s = gfed4_params.invCol;

var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul',
  'Aug','Sep','Oct','Nov','Dec'];
  
var monthDict = {
  'Jan': 0,
  'Feb': 1,
  'Mar': 2,
  'Apr': 3,
  'May': 4,
  'Jun': 5,
  'Jul': 6,
  'Aug': 7,
  'Sep': 8,
  'Oct': 9,
  'Nov': 10,
  'Dec': 11
};

// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// ------------
// Info Panel |
// ------------
var infoPanel = function() {
  var GFEDLabelShort = ui.Label('GFEDv4s Burned Area', {margin: '6px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '5px', backgroundColor: '#FFFFFF00'});
  var GFEDLabelLong = ui.Label('Global Fire Emissions Database, version 4s', {margin: '8px 8px 0px 8px', fontSize: '16px'});
  var paperLabel = ui.Label('Citation: van der Werf et al. (2017, ESSD)', {margin: '5px 0px 5px 8px', fontSize: '12.5px'}, 'https://doi.org/10.5194/essd-9-697-2017');
  var websiteLabel = ui.Label('[Data]', {margin: '5px 0px 5px 8px', fontSize: '12.5px'}, 'https://www.globalfiredata.org/');
  var codeLabel = ui.Label('[Code]', {margin: '5px 0px 5px 4px', fontSize: '12.5px'}, 'https://github.com/tianjialiu/FIRECAM/');
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});

  return ui.Panel({
    widgets: [
      GFEDLabelShort, GFEDLabelLong,
      ui.Panel([paperLabel, websiteLabel, codeLabel], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
      inputParamsLabel
    ],
    style: {backgroundColor: '#FFFFFF00'}
  });
};

var hideMode = true;
var hideShowButton = ui.Button({
  label: 'Hide',
  onClick: function() {
    hideMode = !hideMode;
    hideShowButton.setLabel(hideMode ? 'Hide': 'Show');
    if (!hideMode) {
      controlWrapper.remove(controlPanel);
      hideShowButton.style().set({padding: '0', margin: '3px 0 3px 8px'});
      controlWrapper.style().set({width: '240px'});
      animWrapper.style().set({width: '233px'});
      panelWrapper.style().set({width: '240px'});
    } else {
      controlWrapper.insert(0,controlPanel);
      hideShowButton.style().set({padding: '0', margin: '0 0 0 -55px'});
      controlWrapper.style().set({width: '340px'});
      animWrapper.style().set({width: '333px'});
      panelWrapper.style().set({width: '340px'});
    }
  },
  style: {padding: '0', margin: '0 0 0 -55px'}
});
  
// ------------
// Year Panel |
// ------------
var yearSelectPanel = function() {
  var timeRangeLabel = ui.Label('1) Select Time Range:', {margin: '8px 8px 8px 8px', fontSize: '14.5px'});
  var startYearLabel = ui.Label('Start Year:', {margin: '3px 20px 8px 24px', fontSize: '14.5px'});
  var startYearSlider = ui.Slider({min: 1997, max: 2016, value: 2005, step: 1, style: {margin: '3px 8px 8px 14px'}});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '3px 20px 8px 24px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: 1997, max: 2016, value: 2015, step: 1, style: {margin: '3px 8px 8px 14px'}});
  endYearSlider.style().set('stretch', 'horizontal');
  
  var changeSliderYr = function() {
    var startYr = startYearSlider.getValue();
    var endYr = endYearSlider.getValue();
    if (endYr < startYr) {endYearSlider.setValue(startYr)}
  };
  
  startYearSlider.onChange(changeSliderYr);
  endYearSlider.onChange(changeSliderYr);
  
  return ui.Panel([
      timeRangeLabel,
      ui.Panel([startYearLabel, startYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
      ui.Panel([endYearLabel, endYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    ]);
};

var getYears = function(yearSelectPanel) {
  return {
    startYear:yearSelectPanel.widgets().get(1).widgets().get(1).getValue(),
    endYear:yearSelectPanel.widgets().get(2).widgets().get(1).getValue()
  };
};

// -----------------
// Submit Buttons
// -----------------
var playButton = ui.Button({label: '▶ ️️️Play',  style: {stretch: 'horizontal'}});
var stopButton = ui.Button({label: '🛑 Stop',  style: {stretch: 'horizontal'}});
var loadButton = ui.Button({label: 'Load Images',  style: {stretch: 'horizontal'}});

var waitMessage = ui.Label(' Please check the \'Layers\' tab in the upper-right corner of the map and wait until all images are fully loaded before initializing the animation. It takes a few seconds for the animation to begin.',
  {fontSize:'10pt', margin: '8px 8px 0 8px'});

// --------
// Legend
// --------
var getMonthLabel = function(month) {
  return ui.Label(month, {fontWeight: 'bold',
    fontSize: '20px', padding: '10px', position: 'bottom-right'});
};

var getLegend = function(speciesLabel, units, maxVal, sYear, eYear) {
  
  var legendTitle = ui.Label('Monthly Burned Area',
    {fontWeight: 'bold', fontSize: '16px', margin: '5px 0 6px 8px'});

  var legendSubtitle = ui.Label(units + ' ' + speciesLabel + '/yr',
    {margin: '-6px 0 6px 8px'});

  var vis = {min: 0, max: maxVal, palette: colPals.Spectral};

  var makeColorBarParams = function(palette) {
    return {
      bbox: [0, 0, 1, 0.1],
      dimensions: '100x10',
      format: 'png',
      min: 0,
      max: 1,
      palette: palette,
    };
  };

  // Create the color bar for the legend.
  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: makeColorBarParams(vis.palette),
    style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
  });

  // Create a panel with three numbers for the legend.
  var legendLabels = ui.Panel({
    widgets: [
      ui.Label(vis.min, {margin: '4px 8px'}),
      ui.Label((vis.max / 2),
        {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'})
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

  var legendPanel = ui.Panel({
    widgets: [legendTitle, legendSubtitle, colorBar, legendLabels],
    style: {margin: '0px 0px -2px 0px'}
  });
  
  return legendPanel;
};

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '325px', position: 'bottom-left', padding: '0'}
});

var controlWrapper = ui.Panel({
  widgets: [controlPanel, hideShowButton],
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '340px', position: 'bottom-left', padding: '8px 8px 0 8px'}
});

hideShowButton.setDisabled(true);

var animWrapper = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '333px', position: 'bottom-left', padding: '0 0 8px 8px'}
});

var panelWrapper = ui.Panel({
  widgets: [controlWrapper, animWrapper],
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '340px', position: 'bottom-left', padding: '0'}
});

var animButtons = ui.Panel({
  widgets: [playButton, stopButton],
  layout: ui.Panel.Layout.flow('horizontal')
});

// Map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(0,10,2);
map.setOptions('Dark', {'Dark': baseMap.darkTheme});
map.add(panelWrapper);
map.setControlVisibility({layerList: false});

var infoPanel = infoPanel();
var yearSelectPanel = yearSelectPanel();

controlPanel.add(infoPanel).add(yearSelectPanel).add(loadButton);
  
// Display panels
ui.root.clear();
ui.root.add(map);

var inputVar = 'BA'; var unitsLabel = 'avg. % grid'; var maxVal = 50;
var counter = 0;

loadButton.onClick(function() {
  
  hideShowButton.setDisabled(false);
  map.setControlVisibility({layerList: true});
  
  // Display panels
  map.clear();
  map.style().set({cursor:'crosshair'});
  map.setCenter(0,10,2);
  map.setOptions('Dark', {'Dark': baseMap.darkTheme});
  map.add(panelWrapper);
  
  // Filter by Year:
  var sYear = getYears(yearSelectPanel).startYear;
  var eYear = getYears(yearSelectPanel).endYear;
  
  var gfedv4sFiltered = gfedv4s
    .filter(ee.Filter.calendarRange(sYear,eYear,'year'));
  
  var legendPanel = getLegend(inputVar, unitsLabel, maxVal, sYear, eYear);
  var monthLabel = getMonthLabel(months[0]);
  
  map.add(monthLabel);
  
  if (counter === 0) {
    animWrapper.add(waitMessage).add(animButtons).add(legendPanel);
  }
  
  counter = counter + 1;
  
  var max_layer = 12;
  var getOpacity = function(layer) {
    return map.layers().get(layer).get('opacity');
  };
  
  var setOpacityLayer = function(layer, prev_layer) {
    map.layers().get(layer).set({opacity: 1});
    map.layers().get(prev_layer).set({opacity: 0.01});
  };
  
  var fun_anim = function(layer) {
    var prev_layer = layer-1;
    if (layer === 0) {prev_layer = max_layer - 1}
    setOpacityLayer(layer, prev_layer);
    monthLabel.setValue(months[layer]);
  };
  
  var fun_call = function() {
    var monthPos = monthDict[monthLabel.getValue()] + 1;
    if (monthPos == max_layer) {monthPos = 0}
    ui.util.setInterval(fun_anim(monthPos),delay);
  };

  // Load Images:
  var showFlag = true;
  for (var iMonth = 0; iMonth < max_layer; iMonth++) {
    var meanMonFire = gfedv4sFiltered.select('burned_fraction')
      .filter(ee.Filter.calendarRange(iMonth+1,iMonth+1,'month'))
      .mean().multiply(100);
  
    map.addLayer(meanMonFire.selfMask(),
      {palette: colPals.Spectral, min: 0, max: maxVal},
      months[iMonth], showFlag);
    
    if (iMonth > 0) {map.layers().get(iMonth).set({opacity: 0.01})}
  }
  
  playButton.onClick(function() {
    map.setControlVisibility({layerList: false});
    
    for (var iMonth = 0; iMonth < max_layer; iMonth++) {
      if (iMonth > 0) {
        map.layers().get(iMonth).set({opacity: 0.01, shown: true});
      } else {
        map.layers().get(iMonth).set({opacity: 1, shown: true});
        monthLabel.setValue(months[0]);
      }
    }

    ui.util.clear();
    var delay = 1e3*0.75; var delay_gap = 1e3*0.75;
    
    ui.util.setInterval(function() {
      for (iMonth = 0; iMonth < max_layer; iMonth++) {
        ui.util.setTimeout(fun_call, delay_gap * iMonth);
      }
    }, max_layer * delay_gap);
    
  });

  stopButton.onClick(function() {
    ui.util.clear();
  });

});
