// *****************************************************************
// =================================================================
// ------------------------- FIRECAM Tool ----------------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// @author Tianjia Liu (tianjialiu@g.harvard.edu)
// Last updated: April 15, 2023

// Purpose: explore regional differences in fire emissions from five
// global fire emissions inventories (GFED, FINN, GFAS, QFED, FEER)
// for six species (CO, CO2, CH4, OC, BC, PM2.5)
*/
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
var firecam = require('users/tl2581/FIRECAM:Modules/FIRECAM_params.js');

// --------------
// Input Params |
// --------------
var projFolder = firecam.projFolder;

// Projection: Geographic, 0.5deg
var crs = firecam.crs;
var crsTrans = firecam.crsTrans;
var aggProj = firecam.aggProj;

var invNames = firecam.invNames;
var speciesNames = firecam.speciesNames;
var speciesList = firecam.speciesList;

var bandNamesList = firecam.bandNamesList;
var bandMaxValList = firecam.bandMaxValList;
var bandUnitsList = firecam.bandUnitsList;
var bandMulti = firecam.bandMulti;

// 14 Basis Regions from GFEDv4s
var regionNames = gfed4_params.regionNames;
var basisCodes = gfed4_params.basisCodes;
var basisRegions = firecam.basisRegions;

// Countries/ sub-regions (those with neglible emissions were excluded)
var countryNames = baseRegions.countryNames;
// Dictionary to rename countries
var countryList = baseRegions.countryList;

// ---------------------------------
// - - - - - - FIRECAM - - - - - - |
// ---------------------------------
// ----------------------------------
// Relative Fire Confidence Metrics
// ----------------------------------
// Metric 1: areal BA-AF discrepancy
var RFCM1 = firecam.RFCM1;
// Metric 2: FRP-weighted cloud/haze burden on satellite observing conditions
var RFCM2 = firecam.RFCM2;
// Metric 3: burn size and fragmentation
var RFCM3 = firecam.RFCM3;
// Metric 4: topography variance
var RFCM4 = firecam.RFCM4;
// Metric 5: additional small fires from VIIRS
var RFCM5 = firecam.RFCM5;

// ---------------------
// Reducers and Charts |
// ---------------------
var getRegionShp = firecam.getRegionShp;
var globalShp = firecam.globalShp;
var getCountryShp = firecam.getCountryShp;
var getGridShp = firecam.getGridShp;

var getEmiByMonth = firecam.getEmiByMonth;
var getEmiByYr = firecam.getEmiByYr;
      
var plotEmiTS = firecam.plotEmiTS;
var updateOpts = firecam.updateOpts;
var plotEmiBar = firecam.plotEmiBar;
var plotEmiBarInt = firecam.plotEmiBarInt;

// MODIS MCD12Q1 aggregated LULC
// based on FINNv1.0 delineation
var getLULCmap = firecam.getLULCmap;

// Peatland distribution from GFEDv4s
var peat = firecam.peat; 

// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// ------------
// Info Panel |
// ------------
var infoPanel = function() {
  var FIRECAMLabelShort = ui.Label('FIRECAM Online Tool', {margin: '14px 0px 0px 13px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '5px'});
  var FIRECAMLabelLong = ui.Label('Fire Inventories: Regional Evaluation, Comparison, and Metrics', {margin: '8px 30px 0px 13px', fontSize: '16px', color: '#777'});
  var invLabel = ui.Label('GFEDv4s, FINNv1.5, GFASv1.2, QFEDv2.5r1, FEERv1.0-G1.2', {margin: '3px 5px 0px 13px', fontSize: '11.7px', color: '#999'});
  var websiteLabel = ui.Label('[Website]', {margin: '3px 5px 3px 13px', fontSize: '13px', color: '#5886E8'}, 'https://sites.google.com/view/firecam/home');
  var githubRepoLabel = ui.Label('GitHub: Code/Info', {margin: '0px 8px 5px 13px', fontSize: '13px', color: '#5886E8'}, 'https://github.com/tianjialiu/FIRECAM');
  var citationLabel = ui.Label('Citation: Liu et al. (2020, Remote Sens. Environ.)', {margin: '8px 8px 5px 13px', fontSize: '13px', color: '#5886E8'}, 'https://doi.org/10.1016/j.rse.2019.111557');
  var headDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),
    {margin: '10px 0px 5px 0px',height:'1.25px',border:'0.75px solid black',stretch:'horizontal'});
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 13px', fontWeight: 'bold', fontSize: '20px'});
  
  return ui.Panel({
    widgets: [FIRECAMLabelShort, FIRECAMLabelLong, invLabel, websiteLabel, citationLabel, 
      githubRepoLabel, headDivider, inputParamsLabel],
    style: {margin: '0px 0px 0px 0px'}
  });
};

// ------------
// Year Panel |
// ------------
var yearSelectPanel = function() {
  var timeRangeLabel = ui.Label('1) Select Time Range:', {margin: '8px 8px 8px 13px', fontSize: '14.5px'});
  var startYearLabel = ui.Label('Start Year:', {margin: '3px 20px 8px 29px', fontSize: '14.5px'});
  var startYearSlider = ui.Slider({min: 2003, max: 2022, value: 2005, step: 1, style: {margin: '3px 8px 8px 14px'}});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '3px 27px 8px 29px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: 2003, max: 2022, value: 2015, step: 1, style: {margin: '3px 8px 8px 14px'}});
  endYearSlider.style().set('stretch', 'horizontal');
  
  var changeSliderYr = function() {
    var startYr = startYearSlider.getValue();
    var endYr = endYearSlider.getValue();
    if (endYr < startYr) {endYearSlider.setValue(startYr)}
  };
  
  startYearSlider.onChange(changeSliderYr);
  endYearSlider.onChange(changeSliderYr);
  
  var betaLabel = ui.Label('Note: GFEDv4s emissions for 2017-22 and FINNv1.5 emissions for 2021-22 are preliminary',
    {margin: '3px 20px 8px 29px', fontSize: '12px', color: '#666'});
  
  return ui.Panel([
      timeRangeLabel,
      ui.Panel([startYearLabel, startYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
      ui.Panel([endYearLabel, endYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
      betaLabel
    ]);
};

var getYears = function(yearSelectPanel) {
  return {
    startYear:yearSelectPanel.widgets().get(1).widgets().get(1).getValue(),
    endYear:yearSelectPanel.widgets().get(2).widgets().get(1).getValue()
  };
};


// --------------
// Region Panel |
// --------------
var regionTypeSelectPanel = function(map) {
  var regionLabel = ui.Label('2) Select Bounds Type:', {padding: '5px 0px 0px 5px', fontSize: '14.5px'});
  var regionTypeSelect = ui.Select({items: ['Global', 'Basis Region', 'Country/ Sub-Region', 'Custom', 'Pixel', 'Draw'],
    value: 'Basis Region', style: {stretch: 'horizontal'},
    onChange: function(selected) {
      regionSelectPanel.clear(); map.unlisten();
      if (selected == 'Global') {}
      if (selected == 'Basis Region') {setRegionList(regionNames, 'EQAS - Equatorial Asia')}
      if (selected == 'Country/ Sub-Region') {setRegionList(countryNames, 'Indonesia')}
      if (selected == 'Pixel') {setCoords(map)}
      if (selected == 'Custom') {setBounds(map)}
      if (selected == 'Draw') {setDrawBounds(map)}
    }
  });
  
  return ui.Panel([regionLabel, regionTypeSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

var getRegionType = function(regionTypeSelectPanel) {
  return regionTypeSelectPanel.widgets().get(1).getValue();
};

var getRegions = function(regionSelectPanel) {
  return regionSelectPanel.widgets().get(0).widgets().get(1).getValue();
};

var setRegionList = function(shpNames, defaultName) {
  var regionLabel = ui.Label('Select Region:', {padding: '5px 0px 0px 21px', fontSize: '14.5px'});
  var regionSelect = ui.Select({items: shpNames.sort(), value: defaultName, style: {stretch: 'horizontal'}});
  
  return regionSelectPanel.add(
    ui.Panel([regionLabel, regionSelect], ui.Panel.Layout.Flow('horizontal'),
      {stretch: 'horizontal', margin: '-8px 0px 0px 0px'}));
};

var setCoords = function(map) {
  var coordsLabel = ui.Label('Enter lon/lat below or click on map to update coordinates',
    {margin: '3px 8px 6px 23px', fontSize: '11.5px'});

  var lonLabel = ui.Label('Lon (x):', {padding: '3px 0px 0px 15px', fontSize: '14.5px'});
  var latLabel = ui.Label('Lat (y):', {padding: '3px 0px 0px 0px', fontSize: '14.5px'});
  
  var lonBox = ui.Textbox({value: 111.25});
  lonBox.style().set('stretch', 'horizontal');
  var latBox = ui.Textbox({value: -2.75});
  latBox.style().set('stretch', 'horizontal');
  
  var coordsPanel = ui.Panel([
    coordsLabel, ui.Panel([lonLabel, lonBox, latLabel, latBox], ui.Panel.Layout.Flow('horizontal'),
      {stretch: 'horizontal', margin: '-5px 0px 0px 0px'})
    ]);

  map.onClick(function(coords) {
    regionSelectPanel.clear(); regionSelectPanel.add(coordsPanel);
    regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(1).setValue(coords.lon);
    regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(3).setValue(coords.lat);
  });
  
  return regionSelectPanel.add(coordsPanel);
};
    
var getCoords = function(regionSelectPanel) {
  var lon = parseFloat(regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(1).getValue());
  var lat = parseFloat(regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(3).getValue());
 
  return ee.Geometry.Point(lon,lat);
};

var setBounds = function(map) {
  var boundsLabel = ui.Label('Enter custom bounds as an array of lon/lat coordinates',
    {margin: '3px 8px 6px 23px', fontSize: '11.5px'});

  var coordsBox = ui.Textbox({value: '[[94,-10],[94,7.5],[120,7.5],[120,-10]]'});
  coordsBox.style().set('stretch', 'horizontal');
  
  var cursorBounds = ui.Label('Print lon/lat coordinates of cursor: (click on map)',
    {margin: '3px 8px 6px 23px', fontSize: '11.5px'});
  
  var boundsPanel = ui.Panel([
    boundsLabel, ui.Panel([coordsBox], ui.Panel.Layout.Flow('horizontal'),
      {stretch: 'horizontal', margin: '-5px 0px 0px 15px'}),
      cursorBounds
    ]);
    
  map.onClick(function(coords) {
    regionSelectPanel.clear(); regionSelectPanel.add(boundsPanel);
    var cursorBounds = ee.String('Print lon/lat coordinates of cursor: [' +
      ee.Number(coords.lon).format('%.2f').getInfo() +
      ', ' + ee.Number(coords.lat).format('%.2f').getInfo() + ']').getInfo();
    regionSelectPanel.widgets().get(0).widgets().get(2).setValue(cursorBounds);
  });
  
  return regionSelectPanel.add(boundsPanel);
};

var cursorBoundsText = function(coords) {
  var cursorText = ee.String('Print lon/lat coordinates of cursor: [' +
    ee.Number(coords.lon).format('%.2f').getInfo() +
    ', ' + ee.Number(coords.lat).format('%.2f').getInfo() + ']').getInfo();
  return cursorText;
};

var getBounds = function(regionSelectPanel) {
  var bounds = regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(0).getValue();
  
  return ee.Geometry.Polygon(ee.String(bounds).decodeJSON(),'EPSG:4326',false);
};

var drawMode = false;

var makeGeometry = function(coordsList) {
  var nCoords = coordsList.length().getInfo();
  if (nCoords == 1) {return ee.Geometry.Point(coordsList.get(0))}
  if (nCoords == 2) {return ee.Geometry.LineString(coordsList,crs,false)}
  if (nCoords > 2) {return ee.Geometry.Polygon(coordsList,crs,false)}
};

var drawnPoints = [];
var drawMap = function(coords) {
  if (drawMode) {
    if (map.layers().length() < 1) {drawnPoints = []}

    var coordsArray = [coords.lon, coords.lat];
    drawnPoints = ee.List(drawnPoints).add(coordsArray);

    var geometry = makeGeometry(drawnPoints);
    var geomLayer = ui.Map.Layer(geometry, {color: '#FF0000'}, 'Selected Region');
    map.layers().set(0, geomLayer);
  } 
};

var clearLayers = function(x) {map.remove(x)};

var setDrawBounds = function(map) {
  var drawButton = ui.Button({
    label: 'Start Drawing',
    onClick: function() {
      drawMode = !drawMode;
      drawButton.setLabel(drawMode ? 'Stop Drawing': 'Start Drawing');
      if (drawMode) {
        while (map.layers().length() > 0) {
        map.layers().map(clearLayers);
      }
     }
    }
  });

  var resetButton = ui.Button({
    label: 'Reset',
    onClick: function() {
      while (map.layers().length() > 0) {
        map.layers().map(clearLayers);
      }

      if (counter > 0) {map.remove(plotPanelParent)}
    }
  });

  var drawLabel = ui.Label('Draw a polygon on the map!',
    {margin: '3px 8px 6px 23px', fontSize: '11.5px'});

  var drawPanel = ui.Panel([
    drawLabel, ui.Panel([drawButton, resetButton], ui.Panel.Layout.Flow('horizontal'),
      {stretch: 'horizontal', margin: '-5px 0px 0px 15px'})
    ]);
    
  map.onClick(drawMap);
  return regionSelectPanel.add(drawPanel);
};

var getDrawGeometry = function(map, pos) {
  return map.layers().get(pos).get('eeObject');
};

// ---------------
// Species Panel |
// ---------------
var speciesSelectPanel = function() {
  var speciesLabel = ui.Label('3) Select Species:', {padding: '5px 0px 0px 5px', fontSize: '14.5px'});
  var speciesSelect = ui.Select({items: speciesNames, value: 'CO2 - Carbon Dioxide', style: {stretch: 'horizontal'}});
  return ui.Panel([speciesLabel, speciesSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

var getSpecies = function(speciesSelectPanel) {
  return speciesSelectPanel.widgets().get(1).getValue();
};

// ---------------
// Submit Button |
// ---------------
var submitButton = ui.Button({label: 'Submit',  style: {stretch: 'horizontal'}});

// ---------
// Legends |
// ---------
var continuousLegend = function(controlPanel, title, colPal, minVal, maxVal, units) {
  var continuousLegendPanel = ui.Panel({
    style: {
      padding: '0 3px 5px 5px'
    }
  });
  
  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '16px', margin: '0 0 6px 8px'});
  var unitsLabel = ui.Label(units, {margin: '-6px 0 6px 8px'});

  var vis = {min: minVal, max: maxVal, palette: colPal};

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
  
  controlPanel.add(continuousLegendPanel);
  continuousLegendPanel.add(legendTitle).add(unitsLabel).add(colorBar).add(legendLabels);
};


var legendPanel = function(controlPanel) {
  var footDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),
    {margin: '10px 0px 6px 0px',height:'1.25px',border:'0.75px solid black',stretch:'horizontal'});
  controlPanel.add(footDivider);
  controlPanel.add(ui.Label('Legend', {fontWeight: 'bold', fontSize: '20px', margin: '10px 8px 8px 13px'}));
  controlPanel.add(ui.Label('', {margin: '0 0 0 0'}));
  
  continuousLegend(controlPanel,'BA-AFA Discrepancy',
    colPals.RdBu, -1, 1, 'Metric 1: normalized difference');
  continuousLegend(controlPanel,'Cloud/Haze Obscuration',
    colPals.Blues, 0, 1, 'Metric 2: fractional, FRP-weighted');
  continuousLegend(controlPanel,'Burn Size/Fragmentation',
    colPals.OrRed, 0, 2, 'Metric 3: sq. km / fragment');
  continuousLegend(controlPanel,'Topography Variance',
    colPals.Grays, 0, 1000, 'Metric 4: sq. m');
  continuousLegend(controlPanel,'VIIRS FRP Outside MODIS Burn Extent',
    colPals.Sunset, 0, 1, 'Metric 5: fractional');
};

var emiLegend = function(speciesLabel, units, maxVal, sYear, eYear) {
  
  var emiLegendPanel = ui.Panel({
    style: {
      padding: '3px 10.5px 0px 3px',
      position: 'bottom-right'
    }
  });
  
  var legendTitle = ui.Label('Average Annual Fire Emissions',
    {fontWeight: 'bold', fontSize: '16px', margin: '5px 0 6px 8px'});

  var legendSubtitle = ui.Label(units + ' ' + speciesLabel + '/yr (' + sYear + '-' + eYear + ')',
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
      ui.Label('', {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'})
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
  
  emiLegendPanel.add(legendTitle).add(legendSubtitle).add(colorBar).add(legendLabels);
  
  return emiLegendPanel;
};

var lulc_colPal = firecam.lulc_colPal;
var lulcPeat_colPal = firecam.lulcPeat_colPal;

var lulcLegend = function(controlPanel, colPal) {
  var labels = ['Boreal Forest','Tropical Forest','Temperate Forest',
    'Woody Savanna/Shrubland','Savanna/Grassland','Cropland','Urban/Built-Up','Peatland'];
  
  var lulcLegendPanel = ui.Panel({
    style: {
      padding: '2px 9px 8px 5px',
      position: 'bottom-left'
    }
  });
   
  lulcLegendPanel.add(ui.Label('Land Use/Land Cover', {fontWeight: 'bold', fontSize: '18px', margin: '0px 0 7px 8px'}));
  
  var makeRow = function(colPal, labels) {
    var colorBox = ui.Label({
      style: {
        padding: '10px',
        margin: '0px 0 4px 8px',
        fontSize: '15px',
        backgroundColor: colPal
      }
    });

    var description = ui.Label({value: labels, style: {margin: '2px 1px 4px 6px', fontSize: '14.7px'}});
    return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
  };
  
  for (var i = 0; i < labels.length; i++) {
    lulcLegendPanel.add(makeRow(colPal[i], labels[i]));
  }
  
  controlPanel.add(lulcLegendPanel);
};

// -----------
// Plot Panel
// -----------
var plotPanelLabel = ui.Label('Regional Emissions', {fontWeight: 'bold', fontSize: '20px',
  margin: '12px 8px 5px 18px', padding: '0 0 3px 0'});

// ---------------------
// SMOKE-FIRECAM Panel |
// ---------------------
var SmokeFIRECAMPanel = function() {
  var titleLabel = ui.Label('Regional Example', {fontWeight: 'bold', fontSize: '14px',
    margin: '0px 0px 3px 0px'});
  var description = ui.Label('View the SMOKE-FIRECAM Tool to see an example on Indonesia fires of how using different inventories can impact modeled smoke exposure estimates.',
    {fontSize: '11px', margin: '2px 0px 0px 0px'});
  var link = ui.Label('[SMOKE-FIRECAM Tool]', {margin: '0px 0px 3px 0px', fontSize: '11.5px', color: '#5886E8'}, 'https://globalfires.earthengine.app/view/smoke-firecam-tool');
  return ui.Panel({
    widgets: [titleLabel,link,description],
    style: {
      position: 'top-left',
      width: '160px', maxWidth: '160px'
    }
  });
};

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '345px', maxWidth: '345px'}
});

// Plot panel
var plotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var plotPanelParent = ui.Panel({
  widgets: [plotPanelLabel, plotPanel],
  style: {width: '450px', maxWidth: '450px'}
});

// Map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(0,10,2);
map.setControlVisibility({fullscreenControl: false});
map.setOptions('Dark', {'Dark': baseMap.darkTheme});

var infoPanel = infoPanel();
var yearSelectPanel = yearSelectPanel();
var regionTypeSelectPanel = regionTypeSelectPanel(map);
var regionSelectPanel = ui.Panel();
setRegionList(regionNames, 'EQAS - Equatorial Asia');
var speciesSelectPanel = speciesSelectPanel();

// Display Panels
ui.root.clear(); 

var init_panels = ui.SplitPanel({firstPanel: controlPanel,
  secondPanel: map});

var ui_panels = ui.SplitPanel({
  firstPanel: ui.Panel([init_panels]),
  secondPanel: plotPanelParent
});

controlPanel.add(infoPanel).add(yearSelectPanel)
  .add(regionTypeSelectPanel).add(regionSelectPanel)
  .add(speciesSelectPanel)
  .add(ui.Panel([submitButton],null,{padding: '0 0 0 5px'}));
  
ui.root.add(ui_panels);

map.add(SmokeFIRECAMPanel());

var counter = 0;

// Run calculations, linked to submit button
submitButton.onClick(function() {
 
  // Dummy variables
  var drawMode = false;
  var regionType = getRegionType(regionTypeSelectPanel);
  var regionShp = [];
  
  // Retrieve user-defined bounds for 'Draw' option before clearing map
  if (regionType == 'Draw') {
    regionShp = getGridShp(getDrawGeometry(map,0));
  }
  
  if (counter === 0) {
    legendPanel(controlPanel);
    lulcLegend(controlPanel,lulcPeat_colPal);
  }
  
  counter = counter + 1;
  
  // Input Parameters:
  var sYear = getYears(yearSelectPanel).startYear;
  var eYear = getYears(yearSelectPanel).endYear;
  
  var speciesLong = getSpecies(speciesSelectPanel);
  var species = speciesList[speciesLong];
  
  var spBandName = bandNamesList[species];
  var maxVal = bandMaxValList[species];
  var speciesLabel = species;
  var unitsLabel = bandUnitsList[species];
  
  var vizParams = {palette: colPals.Spectral, min: 0, max: maxVal};
  
  var emiByMonth = getEmiByMonth(species, sYear, eYear);
  var emiByYr = getEmiByYr(emiByMonth, sYear, eYear);
  
  var emiByYrMean = emiByYr.mean()
    .reproject({crs: crs, crsTransform: crsTrans});
  var emiByYrMeanAdj = emiByYrMean.clip(basisRegions)
    .multiply(bandMulti[species]);
  
  var mapYr = ee.Number((sYear + eYear)/2).round();
  mapYr = ee.Algorithms.If(mapYr.gt(2018),2018,mapYr);
  var lulcMapYr = getLULCmap(mapYr);
  
  // Display Maps:
  map.clear(); map.setOptions('Dark', {'Dark': baseMap.darkTheme});
  map.add(emiLegend(speciesLabel, unitsLabel, maxVal, sYear, eYear));
    
  map.addLayer(lulcMapYr, {palette: lulc_colPal, min: 1, max: 7}, 'Land Use/Land Cover ' + mapYr.getInfo(), false);
  map.addLayer(peat.gt(0).selfMask(), {palette: ['#800080']}, 'Peatlands', false);
  
  map.addLayer(RFCM5.multiply(1e3), {palette: colPals.Sunset, min: 0, max: 1e3}, 'Metric 5: Additional VIIRS FRP', false);
  map.addLayer(RFCM4, {palette: colPals.Grays, min: 0, max: 1e3}, 'Metric 4: Topography', false);
  map.addLayer(RFCM3.multiply(1e3), {palette: colPals.OrRed, min: 0, max: 2e3}, 'Metric 3: Burn Size', false);
  map.addLayer(RFCM2.multiply(1e3), {palette: colPals.Blues, min: 0, max: 1e3}, 'Metric 2: Cloud/Haze', false);
  map.addLayer(RFCM1.multiply(1e3), {palette: colPals.RdBu, min: -1e3, max: 1e3}, 'Metric 1: Areal BA-AF', false);
  
  map.addLayer(emiByYrMeanAdj.select('FEERv1p0_G1p2').selfMask(), vizParams, 'FEERv1.0-G1.2', false);
  map.addLayer(emiByYrMeanAdj.select('QFEDv2p5r1').selfMask(), vizParams, 'QFEDv2.5r1', false);
  map.addLayer(emiByYrMeanAdj.select('GFASv1p2').selfMask(), vizParams, 'GFASv1.2', false);
  map.addLayer(emiByYrMeanAdj.select('FINNv1p5').selfMask(), vizParams, 'FINNv1.5', false);
  map.addLayer(emiByYrMeanAdj.select('GFEDv4s').selfMask(), vizParams, 'GFEDv4s');
  
  if (regionType == 'Basis Region' | regionType == 'Country/ Sub-Region') {
    var region = getRegions(regionSelectPanel);
    
    if (regionType == 'Basis Region') {
      var basisID = basisCodes.indexOf(regionNames.indexOf(region)) + 1;
      regionShp = getRegionShp(basisID);
    }
  
    if (regionType == 'Country/ Sub-Region') {
      if (ee.Dictionary(countryList).keys().contains(region).getInfo() === true) {
        region = countryList[region];
      }
      regionShp = getCountryShp(region);
    }
    map.centerObject(regionShp);
    map.addLayer(ee.Image().byte().rename('Selected Region')
      .paint(ee.FeatureCollection(regionShp), 0, 1), {palette: '#FF0000'}, 'Selected Region');
  }
  
  if (regionType == 'Pixel') {
    var coordsPanel = regionSelectPanel.widgets().get(0);
      map.onClick(function(coords) {
        regionSelectPanel.clear(); regionSelectPanel.add(coordsPanel);
        regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(1).setValue(coords.lon);
        regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(3).setValue(coords.lat);
      });
      
    regionShp = getGridShp(getCoords(regionSelectPanel));
    map.centerObject(regionShp, 6);
    map.addLayer(ee.Feature(ee.FeatureCollection(regionShp).first()).centroid(0.1),
      {}, 'Selected Pixel');
  }
  
  if (regionType == 'Custom') {
    var boundsPanel = regionSelectPanel.widgets().get(0);
    map.onClick(function(coords) {
      regionSelectPanel.clear(); regionSelectPanel.add(boundsPanel);
      var cursorBounds = cursorBoundsText(coords);
      regionSelectPanel.widgets().get(0).widgets().get(2).setValue(cursorBounds);
    });
    regionShp = getGridShp(getBounds(regionSelectPanel));
    
    map.centerObject(regionShp);
    map.addLayer(ee.Image().byte().rename('Selected Region')
      .paint(ee.FeatureCollection(regionShp), 0, 1), {palette: '#FF0000'}, 'Selected Region');
  }
  
  if (regionType == 'Draw') {
    regionSelectPanel.clear(); setDrawBounds(map);
    map.centerObject(regionShp);
    map.addLayer(ee.Image().byte().rename('Selected Region')
     .paint(ee.FeatureCollection(regionShp), 0, 1), {palette: '#FF0000'}, 'Selected Region');
  }

  if (regionType == 'Global') {
    regionShp = globalShp;
    map.setCenter(50,0,1);
  }
  
  // Display Charts:
  plotPanel = plotPanel.clear();
  
  var totalChart = plotEmiBar(emiByYrMean, regionShp, species, 'Annual', sYear, eYear);
  plotPanel.add(totalChart); plotPanel.add(ui.Label('', {margin: '-28px 8px 8px'}));

  var IntOptionSelect = ui.Select({
    items: ['Mean Only','Mean [Min, Max]'],
    value: 'Mean Only',
    onChange: function(selected) {
      plotPanel.remove(plotPanel.widgets().get(0));
      if (selected == 'Mean Only') {
        totalChart = plotEmiBar(emiByYrMean, regionShp, species, 'Annual', sYear, eYear);
        plotPanel.insert(0,totalChart);
      }
      if (selected == 'Mean [Min, Max]') {
        plotEmiBarInt(emiByYr, regionShp, species, 'Annual', sYear, eYear, plotPanel);
      }
    },
    style: {
      margin: '0px 75px 8px 5px',
      stretch: 'horizontal'
    }
  });
  
  var plotIntLabel = ui.Label('Change Plot:', {margin: '5px 15px 8px 20px', fontSize: '14px'});
  var plotIntPanel = ui.Panel({
    widgets: [plotIntLabel,IntOptionSelect],
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {margin: '-10px 100px 8px 8px'}
  });

  plotPanel.add(plotIntPanel);

  var annualChart = plotEmiTS(emiByYr, regionShp,
    species, 'Annual', 'Y', sYear, eYear, 1, 1, null);
  
  if (eYear-sYear <= 5) {
    annualChart = updateOpts(annualChart, species, 'Annual', 'Y', (sYear-1), eYear, 12, 2);
    annualChart.setChartType('ScatterChart');
  }
  
  plotPanel.add(annualChart); plotPanel.add(ui.Label('', {margin: '-25px 8px 8px'}));
  
  var monthlyChart = plotEmiTS(emiByMonth, regionShp,
    species, 'Monthly', 'MMM Y', sYear, eYear, 1, 12, null);
  if (regionType != 'Global' | eYear-sYear === 0) {
    plotPanel.add(monthlyChart);
  }

});

