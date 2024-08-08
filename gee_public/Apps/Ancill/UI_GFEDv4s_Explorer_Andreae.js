// *****************************************************************
// =================================================================
// --- Global Fire Emissions Database, v4s (GFEDv4s) Explorer --- ||
// =================================================================
// *****************************************************************
// Data from: https://www.globalfiredata.org/
// Citation: van der Werf et al. (2017)
// Global fire emissions estimates during 1997-2016
// https://doi.org/10.5194/essd-9-697-2017

// How do the new emissions factors from Andreae (2019) impact
// GFEDv4s emissions?

// @author Tianjia Liu (embrslab@gmail.com)
// Last updated: April 15, 2023

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
// Projection: Geographic, 0.25deg
var crsTrans = gfed4_params.crsTrans; 
var crs = gfed4_params.crs;
var scale = gfed4_params.scale;

// 14 Basis Regions from GFEDv4s
var regionNames = gfed4_params.regionNames;
var basisCodes = gfed4_params.basisCodes;
var basisRegions = gfed4_params.basisRegions;

// Countries/ sub-regions (those with neglible emissions were excluded)
var countryNames = baseRegions.countryNames;
// Dictionary to rename countries
var countryList = baseRegions.countryList;

// -------------------
// GFEDv4s Emissions |
// -------------------
// Emissions factors from DM (g species/ kg DM)
// https://www.geo.vu.nl/~gwerf/GFED/GFED4/ancill/GFED4_Emission_Factors.txt
var EFlist = gfed4_params.EFlist;
var EFlist_Andreae = gfed4_params.EFlist_Andreae;
var speciesNames = gfed4_params.speciesNames_Andreae;
var speciesList = gfed4_params.speciesList;

// Land Use/ Land Cover (LULC) types - abbreviation
// 1. Savanna, 2. Boreal Forest, 3. Temperate Forest,
// 4. Deforestation/ Tropical Forest, 5. Peatland,
// 6. Agricultural
var LULC = gfed4_params.LULC;

// Calculate emissions of input species by month in kg/ grid cell
var getEmiByMonth = gfed4_params.getEmiByMonth;

// Calculate emissions of input species by year in kg/ grid cell
var getEmiByYr = gfed4_params.getEmiByYr;

var combineBands_Andreae = gfed4_params.combineBands_Andreae;

// ---------------------
// Reducers and Charts |
// ---------------------
// Get features for regions
var getRegionShp = gfed4_params.getRegionShp;
var globalShp = gfed4_params.globalShp;
var getCountryShp = gfed4_params.getCountryShp;
var getGridShp = gfed4_params.getGridShp;

// Charts
var plotEmiTS = gfed4_params.plotEmiTS_Andreae;
var updateOpts = gfed4_params.updateOpts_Andreae;
var plotCompTS = gfed4_params.plotCompTS;
var plotCompTS_text = gfed4_params.plotCompTS_text;

// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// ------------
// Info Panel |
// ------------
var infoPanel = function() {
  var GFEDLabelShort = ui.Label('GFEDv4s Explorer', {margin: '6px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '5px', backgroundColor: '#FFFFFF00'});
  var GFEDLabelLong = ui.Label('Global Fire Emissions Database, version 4s', {margin: '8px 8px 0px 8px', fontSize: '16px'});
  var AndreaeLong = ui.Label('How much does the Andreae (2019, ACP) emissions factors update impact GFEDv4s emissions?', {margin: '5px 8px 0px 8px', fontSize: '12.5px'});
  var paperLabel = ui.Label('Citation: van der Werf et al. (2017, ESSD)', {margin: '5px 0px 5px 8px', fontSize: '12.5px', color: '#5886E8'}, 'https://doi.org/10.5194/essd-9-697-2017');
  var websiteLabel = ui.Label('[Data]', {margin: '5px 0px 5px 8px', fontSize: '12.5px', color: '#5886E8'}, 'https://www.globalfiredata.org/');
  var codeLabel = ui.Label('[Code]', {margin: '5px 0px 5px 4px', fontSize: '12.5px', color: '#5886E8'}, 'https://github.com/tianjialiu/FIRECAM/');
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});

  return ui.Panel({
    widgets: [
      GFEDLabelShort, GFEDLabelLong,
      ui.Panel([paperLabel, websiteLabel, codeLabel], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
      AndreaeLong, inputParamsLabel
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
      hideShowButton.style().set({padding: '0', margin: '0'});
      controlWrapper.style().set({width: '70px'});
    } else {
      controlWrapper.insert(0,controlPanel);
      hideShowButton.style().set({padding: '0', margin: '0 0 0 -55px'});
      controlWrapper.style().set({width: '360px'});
    }
  },
  style: {padding: '0 0 0 0px', margin: '0 0 0 -55px'}
});
  
// ------------
// Year Panel |
// ------------
var yearSelectPanel = function() {
  var timeRangeLabel = ui.Label('1) Select Time Range:', {margin: '8px 8px 8px 8px', fontSize: '14.5px'});
  var startYearLabel = ui.Label('Start Year:', {margin: '3px 20px 8px 24px', fontSize: '14.5px'});
  var startYearSlider = ui.Slider({min: 1997, max: 2022, value: 2005, step: 1, style: {margin: '3px 8px 8px 14px'}});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '3px 20px 8px 24px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: 1997, max: 2022, value: 2015, step: 1, style: {margin: '3px 8px 8px 21px'}});
  endYearSlider.style().set('stretch', 'horizontal');
  
  var changeSliderYr = function() {
    var startYr = startYearSlider.getValue();
    var endYr = endYearSlider.getValue();
    if (endYr < startYr) {endYearSlider.setValue(startYr)}
  };
  
  startYearSlider.onChange(changeSliderYr);
  endYearSlider.onChange(changeSliderYr);
  
  var betaLabel = ui.Label('Note: GFEDv4s emissions for 2017-22 are preliminary',
    {margin: '3px 20px 8px 24px', fontSize: '12px', color: '#666'});

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
  var regionLabel = ui.Label('2) Select Bounds Type:', {padding: '5px 0 0 1px', fontSize: '14.5px'});
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
  var regionLabel = ui.Label('Select Region:', {padding: '5px 0px 0px 17px', fontSize: '14.5px'});
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
  
  var lonBox = ui.Textbox({value: 111.125});
  lonBox.style().set('stretch', 'horizontal');
  var latBox = ui.Textbox({value: -2.875});
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
    var cursorBounds = cursorBoundsText(coords);
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

      if (counter > 0) {plotPanel = plotPanel.clear()}
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
  var speciesLabel = ui.Label('3) Select Species:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var speciesSelect = ui.Select({items: speciesNames, value: 'CO2 - Carbon Dioxide', style: {stretch: 'horizontal'}});
  
  return ui.Panel([speciesLabel, speciesSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

var getSpecies = function(speciesSelectPanel, pos) {
  return speciesSelectPanel.widgets().get(pos).getValue();
};

// -----------------
// Submit Button
// -----------------
var submitButton = ui.Button({label: 'Submit',  style: {stretch: 'horizontal'}});

// --------
// Legend
// --------
var emiLegend = function(speciesLabel, units, maxVal, sYear, eYear) {
  
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
      ui.Label((vis.max / 2),
        {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'})
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

  var legendPanel = ui.Panel({
    widgets: [legendTitle, legendSubtitle, colorBar, legendLabels],
    style: {margin: '0'}
  });
  
  return legendPanel;
};

// ------------
// Plot Panel |
// ------------
var plotPanelLabel = ui.Label('Emissions Comparison with Old/New EFs',
  {fontWeight: 'bold', fontSize: '20px', margin: '7px 8px 5px 18px'});

var addCharts = function(sYear, eYear, speciesLabel, regionShp, regionType) {

  // Retrieve emissions factors
  // original GFEDv4s EFs, mostly from Akagi et al. 2011
  var EFs = ee.Image(EFlist[speciesLabel]).rename(LULC)
    .reproject({crs: crs, crsTransform: crsTrans});
  
  // updated EFs from Andreae 2019
  var EFs_Andreae = ee.Image(EFlist_Andreae[speciesLabel]).rename(LULC)
    .reproject({crs: crs, crsTransform: crsTrans});
  
  var emiByMonth = getEmiByMonth(EFs, speciesLabel, sYear, eYear);
  var emiByYr = getEmiByYr(emiByMonth, sYear, eYear);
  
  var emiByMonth_Andreae = getEmiByMonth(EFs_Andreae, speciesLabel, sYear, eYear);
  var emiByYr_Andreae = getEmiByYr(emiByMonth_Andreae, sYear, eYear);
  
  var emiByMonth_comp = combineBands_Andreae(emiByMonth, emiByMonth_Andreae);
  var emiByYr_comp = combineBands_Andreae(emiByYr, emiByYr_Andreae);
  
  var emiByYr_compMean = ee.Image(emiByYr_comp.mean());
  
  // Display Charts:
  plotPanel = plotPanel.clear();
  
  var annualChart = plotEmiTS(emiByYr_comp, regionShp,
    speciesLabel, 'Annual', 'Y', sYear, eYear, 1, 1);
  
  if (eYear-sYear <= 5) {
    var nYear = eYear-sYear+1;
    annualChart = updateOpts(annualChart, speciesLabel, 'Annual', 'Y', (sYear-1), eYear, 12, 2);
    annualChart.setChartType('ScatterChart');
  }
  
  plotPanel.add(annualChart); plotPanel.add(ui.Label('', {margin: '-25px 8px 8px'}));
  plotPanel.add(plotCompTS(emiByYr_compMean, speciesLabel, regionShp));
  
  var avgBudget = plotCompTS_text(emiByYr_compMean, regionShp);
  var avgBudgetOld = ee.Number(avgBudget.get('Old'));
  var avgBudgetNew = ee.Number(avgBudget.get('New'));
  
  var perChange = (avgBudgetNew.subtract(avgBudgetOld)).divide(avgBudgetOld).multiply(100);
  var perChangeLabel = ui.Label('Percent Change: ' + 
    perChange.round().getInfo() + '%',
    {margin: '-3px 0px 13px 20px', fontSize: '13px', border: '1px solid black', padding: '3px'});
  
  plotPanel.add(perChangeLabel);
  
  var EFLabel = ui.Label('Emission Factors (g/kg)',
    {margin: '3px 0px 5px 20px', fontSize: '16px', fontWeight: 'bold'});

  var EFs_table = ee.FeatureCollection([
    ee.Feature(null,{EFs:'Original'})
      .set(ee.Dictionary.fromLists(LULC,ee.Array(EFlist[speciesLabel]).project([1]).toList())),
    ee.Feature(null,{EFs:'Updated'})
      .set(ee.Dictionary.fromLists(LULC,ee.Array(EFlist_Andreae[speciesLabel]).project([1]).toList()))
  ]);
  
  var EFs_tableChart = ui.Panel(
    ui.Chart.feature.byFeature(EFs_table,'EFs').setChartType('Table'),
    ui.Panel.Layout.flow('horizontal'), {margin: '0px 5px 10px 13px'});
  
  plotPanel.add(EFLabel);
  plotPanel.add(EFs_tableChart);
};

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '345px', position: 'bottom-left', padding: '0'}
});

var controlWrapper = ui.Panel({
  widgets: [controlPanel, hideShowButton],
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '360px', position: 'bottom-left', maxHeight: '90%'}
});

// Plot panel
var plotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var plotPanelParent = ui.Panel([plotPanelLabel, plotPanel], null,
  {maxWidth: '410px',padding: '5px 0px 8px 0px'});

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

// Display panels
ui.root.clear();

controlPanel = controlPanel.add(infoPanel).add(yearSelectPanel).add(regionTypeSelectPanel)
  .add(regionSelectPanel).add(speciesSelectPanel).add(submitButton);
  
map.add(controlWrapper);

var init_panels = ui.SplitPanel({firstPanel: map,
  secondPanel: plotPanelParent});

ui.root.add(init_panels);

// Run calculations, linked to submit button
var counter = 0;

submitButton.onClick(function() {

  // Dummy variables
  var drawMode = false;
  var regionType = getRegionType(regionTypeSelectPanel);
  var regionShp = [];
  
  // Retrieve user-defined bounds for 'Draw' option before clearing map
  if (regionType == 'Draw') {
    regionShp = getGridShp(getDrawGeometry(map,0));
  }

  // Clear map and panels
  map.clear(); map.setOptions('Dark', {'Dark': baseMap.darkTheme});
  counter = counter + 1;
  
  // Input Parameters:
  var sYear = getYears(yearSelectPanel).startYear;
  var eYear = getYears(yearSelectPanel).endYear;

  var xYears = ee.List.sequence(sYear,eYear,1);
  
  var speciesLong = getSpecies(speciesSelectPanel,1);
  var speciesLabel = speciesList[speciesLong];

  // Default Map: DM emissions
  var display_sp = 'DM'; var unitsLabel = 'Gg'; var maxVal = 500;
  
  var EFs_display = ee.Image(EFlist[display_sp]).rename(LULC)
    .reproject({crs: crs, crsTransform: crsTrans});
  
  var emiByMonth_display = getEmiByMonth(EFs_display, display_sp, sYear, eYear);
  var emiByYr_display = getEmiByYr(emiByMonth_display, sYear, eYear);
  var emiByYrMean_display = emiByYr_display.reduce(ee.Reducer.mean()).multiply(1e3);

  // Display Maps:
  var legendPanel = emiLegend(display_sp, unitsLabel, maxVal, sYear, eYear);
  
  if (counter > 1) {controlPanel.remove(controlPanel.widgets().get(6))}
  map.add(controlWrapper); controlPanel.add(legendPanel);
  
  map.addLayer(emiByYrMean_display.select('Total.*').selfMask(),
    {palette: colPals.Spectral, min: 0, max: maxVal}, 'GFEDv4s');

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

  addCharts(sYear, eYear, speciesLabel, regionShp, regionType);
  var speciesSelect = ui.Select({
    items: speciesNames,
    value: speciesLong,
    onChange: function() {
      map.remove(plotPanelParent);
      speciesLong = getSpecies(plotSpeciesPanel,1);
      speciesLabel = speciesList[speciesLong];
      addCharts(sYear, eYear, speciesLabel, regionShp, regionType);
      plotPanel.add(plotSpeciesPanel);
    },
    style: {
      margin: '0px 75px 8px 5px',
      stretch: 'horizontal'
    }
  });

    
  var plotSpeciesLabel = ui.Label('Change Plotted Species:', {margin: '5px 15px 8px 20px', fontSize: '14px'});
  var plotSpeciesPanel = ui.Panel([plotSpeciesLabel,speciesSelect], ui.Panel.Layout.Flow('horizontal'));

  plotPanel.add(plotSpeciesPanel);
});
