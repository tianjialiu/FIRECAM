// *****************************************************************
// =================================================================
// ---------------- Instructions for FIRECAM Tool --------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// Author: Tianjia Liu
// Last updated: October 2, 2019

// Purpose: explore regional differences in fire emissions from five
// global fire emissions inventories (GFED, FINN, GFAS, QFED, FEER)
// for six species (CO, CO2, CH4, OC, BC, PM2.5); export monthly
// and annual timeseries

// 1. Click 'Run' to initialize the User Interface on the map below
// 2. Select a region and species; exports can be started from 'Tasks'

// If you have your own shapefile, you can replace 'userShp' with
// an EE feature below. Use .union() if you have a featureCollection.
// You can also specify the name of your region with the
// 'userShpName' variable.

// By default, the map will not show the bounds of the region unless
// you set showRegionOnMap to true
*/

var showRegionOnMap = false;
var userShp = false;
var userShpName = 'CustomRegion';

// =================================================================
// *****************   --    User Interface    --   ****************
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
var sYear_abs = firecam.sYear_abs;
var eYear_abs = firecam.eYear_abs;

// Projection: Geographic, 0.5deg
var crs = firecam.crs;
var crsTrans = firecam.crsTrans;
var aggProj = firecam.aggProj;

var invNames = firecam.invNames;
var bandNames = firecam.bandNames;

var speciesNames = firecam.speciesNames;
var speciesList = firecam.speciesList;

var bandNamesList = firecam.bandNamesList;

// 14 Basis Regions from GFEDv4s
var regionNames = gfed4_params.regionNames;
var basisCodes = gfed4_params.basisCodes;
var basisRegions = firecam.basisRegions;
var regionNamesAbbrev = gfed4_params.regionNamesAbbrev;
  
// Countries/ sub-regions (those with neglible emissions were excluded)
var countryNames = baseRegions.countryNames;
// Dictionary to rename countries
var countryList = baseRegions.countryList;

// ---------------------------------
// - - - - - - FIRECAM - - - - - - |
// ---------------------------------
// ---------------------
// Reducers and Charts |
// ---------------------
var getRegionShp = firecam.getRegionShp;
var globalShp = firecam.globalShp;
var getCountryShp = firecam.getCountryShp;
var getGridShp = firecam.getGridShp;

var getEmiByMonth = firecam.getEmiByMonth;
var getEmiByYr = firecam.getEmiByYr;

// Generate output tables
var getEmiTS = function(imageCol, regionShp, timeFormat) {
  var emiTS = imageCol.toList(500,0)
    .map(function(image) {
      var sumEmi = ee.Image(image).reduceRegions({
        collection: regionShp,
        reducer: ee.Reducer.sum().unweighted(),
        crs: crs,
        crsTransform: crsTrans
      }).toList(1,0).get(0);
      
      var date = ee.Date(ee.Image(image).get('system:time_start')).format(timeFormat);
      sumEmi = ee.Feature(sumEmi).set('Time',date);
      
      return sumEmi;
  });
  
  return ee.FeatureCollection(emiTS);
};

// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// ------------
// Info Panel |
// ------------
var infoPanel = function() {
  var FIRECAMLabelShort = ui.Label('FIRECAM Online Tool', {margin: '14px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
  var FIRECAMLabelLong = ui.Label('Fire Inventories: Regional Evaluation, Comparison, and Metrics', {margin: '8px 30px 0px 8px', fontSize: '16px', color: '#777'});
  var websiteLabel = ui.Label('[Website]', {margin: '3px 5px 3px 8px', fontSize: '13px'}, 'https://sites.google.com/view/firecam/home');
  var githubRepoLabel = ui.Label('GitHub: Code/Info', {margin: '0px 8px 5px 8px', fontSize: '13px'}, 'https://github.com/tianjialiu/FIRECAM');
  var citationLabel = ui.Label('Citation: Liu et al. (in review)', {margin: '8px 8px 5px 8px', fontSize: '13px'}, 'https://eartharxiv.org/nh57j/');
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});
  
  return ui.Panel({
    widgets: [FIRECAMLabelShort, FIRECAMLabelLong, websiteLabel, citationLabel, 
      githubRepoLabel, inputParamsLabel],
    style: {margin: '0px 0px 0px 5px'}
  });
};

// ------------
// Year Panel |
// ------------
var yearSelectPanel = function() {
  var timeRangeLabel = ui.Label('1) Select Time Range:', {margin: '8px 8px 8px 13px', fontSize: '14.5px'});
  var startYearLabel = ui.Label('Start Year:', {margin: '3px 20px 8px 29px', fontSize: '14.5px'});
  var startYearSlider = ui.Slider({min: 2003, max: 2016, value: 2005, step: 1, style: {margin: '3px 8px 8px 14px'}});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '3px 20px 8px 29px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: 2003, max: 2016, value: 2015, step: 1, style: {margin: '3px 8px 8px 14px'}});
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


// --------------
// Region Panel |
// --------------
var regionTypeSelectPanel = function(map) {
  var regionLabel = ui.Label('2) Select Bounds Type:', {padding: '5px 0px 0px 5px', fontSize: '14.5px'});
  var regionTypeSelect = ui.Select({items: ['Global', 'Basis Region', 'Country/ Sub-Region'],
    value: 'Basis Region', style: {stretch: 'horizontal'},
    onChange: function(selected) {
      regionSelectPanel.clear();
      if (selected == 'Global') {}
      if (selected == 'Basis Region') {setRegionList(regionNames, 'EQAS - Equatorial Asia')}
      if (selected == 'Country/ Sub-Region') {setRegionList(countryNames, 'Indonesia')}
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

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '345px', maxWidth: '345px'}
});

// Map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(0,10,2);
map.setControlVisibility({fullscreenControl: false});
map.setOptions('Map', {'Map':[], 'Dark': baseMap.darkTheme}, ['Map','Dark']);

var infoPanel = infoPanel();
var yearSelectPanel = yearSelectPanel();
var regionTypeSelectPanel = regionTypeSelectPanel(map);
var regionSelectPanel = ui.Panel();
setRegionList(regionNames, 'EQAS - Equatorial Asia');
var speciesSelectPanel = speciesSelectPanel();

// Display Panels
ui.root.clear(); 
  
controlPanel.add(infoPanel).add(yearSelectPanel)
  .add(regionTypeSelectPanel).add(regionSelectPanel)
  .add(speciesSelectPanel)
  .add(ui.Panel([submitButton],null,{padding: '0 0 0 5px'}));

ui.root.add(controlPanel);
ui.root.add(map);

var counter = 0;

// Run calculations, linked to submit button
submitButton.onClick(function() {
 
  // Input Parameters:
  var sYear = getYears(yearSelectPanel).startYear;
  var eYear = getYears(yearSelectPanel).endYear;
  
  var regionType = getRegionType(regionTypeSelectPanel);
  var regionShp = [];
  var regionName = '';

  var speciesLong = getSpecies(speciesSelectPanel);
  var species = speciesList[speciesLong];
  
  var spBandName = bandNamesList[species];
  var speciesLabel = species;

  var emiByMonth = getEmiByMonth(species, sYear, eYear);
  var emiByYr = getEmiByYr(emiByMonth, sYear, eYear);
  
  // Display Maps:
  map.clear();

  if (showRegionOnMap) {
    map.addLayer(ee.Image(1).clip(basisRegions).rename('Basis Regions'),
      {palette: '#000000', opacity: 0.8}, 'Basis Regions');
  }
  
  if (regionType == 'Basis Region' | regionType == 'Country/ Sub-Region') {
    var region = getRegions(regionSelectPanel);
    
    if (regionType == 'Basis Region') {
      var basisID = basisCodes.indexOf(regionNames.indexOf(region)) + 1;
      regionShp = getRegionShp(basisID);
      regionName = regionNamesAbbrev[basisID - 1];
    }
  
    if (regionType == 'Country/ Sub-Region') {
      if (ee.Dictionary(countryList).keys().contains(region).getInfo() === true) {
          region = countryList[region];
        }
        regionShp = getCountryShp(region);
        regionName =  ee.String(region).split(' ').join('_').replace('\'','')
          .replace('&','_').replace('-','_').getInfo();
      }
    
    if (showRegionOnMap) {
      map.centerObject(regionShp);
      map.addLayer(ee.Image().byte().rename('Selected Region')
        .paint(ee.FeatureCollection(regionShp), 0, 1), {palette: '#FF0000'}, 'Selected Region');
    }
  }
  
  if (regionType == 'Global') {
    regionShp = globalShp;
    regionName = 'Global';
    
    if (userShp) {
      regionShp = userShp;
      regionName = userShpName;
    }
    
    if (showRegionOnMap) {
      map.setCenter(50,0,1);
      map.addLayer(ee.Image().byte().rename('Selected Region')
        .paint(ee.FeatureCollection(regionShp), 0, 1), {palette: '#FF0000'}, 'Selected Region');
    }
  }
  
  Export.table.toDrive({
    collection: getEmiTS(emiByYr, regionShp, 'Y'),
    description: bandNamesList[speciesLabel] + '_Tg_Annual_' + regionName + '_' + sYear + '_' + eYear,
    selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
  });
 
  Export.table.toDrive({
    collection: getEmiTS(emiByMonth, regionShp, 'Y-MM'),
    description: bandNamesList[speciesLabel] + '_Tg_Monthly_' + regionName + '_' + sYear + '_' + eYear,
    selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
  });

});
