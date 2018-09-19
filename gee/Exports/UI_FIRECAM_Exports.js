// *****************************************************************
// =================================================================
// ----------------------- FIRECAM Exports ---------------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// Author: Tianjia Liu
// Last updated: September 18, 2018

// Purpose: explore regional differences in fire emissions from five
// global fire emissions inventories (GFED, FINN, GFAS, QFED, FEER)
// for six species (CO, CO2, CH4, OC, BC, PM2.5); export monthly
// and annual timeseries

// 1. Click 'Run' to initialize the user interface
// 2. Select a region and species; exports can be started from 'Tasks'
*/
// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// --------------
// Input Params |
// --------------
var sYear = 2003; var eYear = 2016;
var projFolder = 'projects/GlobalFires/';

var invNames = ['GFEDv4s','FINNv1p5','GFASv1p2','QFEDv2p5r1','FEERv1p0_G1p2'];
var bandNames = ['CO','CO2','CH4','OC','BC','PM2p5'];
var bandLabel = ee.List(['CO','CO2','CH4','OC','BC','PM2.5']);

var gfedBandNames = ['DM','CO','CO2','CH4','OC','BC','PM2/5'];
var gfasBandNames = ['APT','FRP','CO','CO2','CH4','OC','BC','PM2/5'];
var finnBandNames = ['BA','CO','CO2','CH4','OC','BC','PM2/5'];
  
var regionNames = ['BONA - Boreal North America',
  'TENA - Temperate North America',
  'CEAM - Central America',
  'NHSA - Northern Hemisphere South America',
  'SHSA - Southern Hemisphere South America',
  'EURO - Europe', 'MIDE - Middle East', 'NHAF - Northern Hemisphere Africa',
  'SHAF - Southern Hemisphere Africa', 'BOAS - Boreal Asia',
  'CEAS - Central Asia', 'SEAS - Southeast Asia',
  'EQAS - Equatorial Asia', 'AUST - Australia and New Zealand'];

var regionNamesShort = ['BONA', 'TENA', 'CEAM',
  'NHSA', 'SHSA', 'EURO', 'MIDE', 'NHAF', 'SHAF',
  'BOAS', 'CEAS', 'SEAS', 'EQAS', 'AUST'];
  
var basisCodes = [2,13,3,9,12,6,7,8,11,1,4,10,5,0];
var basisRegions = ee.FeatureCollection(projFolder + 'basisRegions_0p5deg');

// ------------------------------------
// - - - - - - FIRECAM.js - - - - - - |
// ------------------------------------
// ----------------------------------
// Global Fire Emissions Inventories
// ----------------------------------
var gfedv4s = ee.ImageCollection(projFolder + 'GFEDv4s_sp');
var finnv1p5 = ee.ImageCollection(projFolder + 'FINNv1p5_sp');
var gfasv1p2 = ee.ImageCollection(projFolder + 'GFASv1p2_sp');
var qfedv2p5 = ee.ImageCollection(projFolder + 'QFEDv2p5r1_sp');
var feerv1p0_g1p2 = ee.ImageCollection(projFolder + 'FEERv1p0_G1p2_sp');

var aggProj = gfedv4s.first()
  .reproject({crs: 'EPSG:4326', crsTransform: [0.5,0,-180,0,-0.5,90]})
  .projection();

var getBand = function(imageList, iMonth, renameBands, species) {
  var image = ee.Image(imageList.get(iMonth));

  return ee.Image(image.select('.*_0-5deg').divide(1e9)
    .rename(renameBands).select(species)
    .reproject({crs: aggProj, scale: aggProj.nominalScale()})
    .copyProperties(image,['system:time_start']));
};

var getEmiByMonth = function(species) {
  
  var nMonth = (eYear-sYear+1)*12-1;
  var filterAllYrs = ee.Filter.calendarRange(sYear,eYear,iYear);
  
  var gfedList = gfedv4s.filter(filterAllYrs).toList(500,0);
  var finnList = finnv1p5.filter(filterAllYrs).toList(500,0);
  var gfasList = gfasv1p2.filter(filterAllYrs).toList(500,0);
  var qfedList = qfedv2p5.filter(filterAllYrs).toList(500,0);
  var feerList = feerv1p0_g1p2.filter(filterAllYrs).toList(500,0);

  var emiByMonth = ee.List.sequence(0,nMonth,1).map(function(iMonth) {
    var gfed = getBand(gfedList,iMonth,gfedBandNames,species);
    var finn = getBand(finnList,iMonth,finnBandNames,species);
    var gfas = getBand(gfasList,iMonth,gfasBandNames,species);
    var qfed = getBand(qfedList,iMonth,bandNames,species);
    var feer = getBand(feerList,iMonth,bandNames,species);
  
    var emiAll = gfed.addBands(finn).addBands(gfas).addBands(qfed).addBands(feer)
      .rename(invNames).reproject({crs: aggProj, scale: aggProj.nominalScale()})
      .copyProperties(gfed,['system:time_start']);
    
    return emiAll;
  });
  
  return ee.ImageCollection(emiByMonth);
};
  
var getEmiByYr = function(emiByMonth) {

  var emiByYr = ee.List.sequence(sYear,eYear,1).map(function(iYear) {
    var filterYr = ee.Filter.calendarRange(iYear,iYear,'year');

    var emiAll = ee.Image(emiByMonth.filter(filterYr).sum())
      .reproject({crs: aggProj, scale: aggProj.nominalScale()})
      .set('system:time_start',ee.Date.fromYMD(iYear,1,1).millis());
    
      return emiAll;
  });

  return ee.ImageCollection(emiByYr);
};

var getRegionShp = function(basisID) {
  return basisRegions.filterMetadata('basis','equals',basisID);
};

var getEmiTS = function(imageCol, regionShp, timeFormat) {
  var emiTS = imageCol.toList(500,0)
    .map(function(image) {
      var sumEmi = ee.Image(image).reduceRegions({
        collection: regionShp,
        reducer: ee.Reducer.sum().unweighted(),
        crs: aggProj,
        crsTransform: [0.5,0,-180,0,-0.5,90]
      }).toList(1,0).get(0);
      
      var date = ee.Date(ee.Image(image).get('system:time_start')).format(timeFormat);
      sumEmi = ee.Feature(sumEmi).set('Time',date);
      
      return sumEmi;
  });
  
  return ee.FeatureCollection(emiTS);
};

// ---------------------------------------
// - - - - - - plotParams.js - - - - - - |
// ---------------------------------------
// ------------
// Info Panel
// ------------
var infoPanel = function() {
  var FIRECAMLabelShort = ui.Label('FIRECAM Exports', {margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
  var FIRECAMLabelLong = ui.Label('Fire Inventories: Regional Evaluation, Comparison, and Metrics', {margin: '8px 30px 0px 8px', fontSize: '16px'});
  var githubRepoLabel = ui.Label('Documentation: github.com/tianjialiu/FIRECAM', {margin: '8px 8px 5px 8px', fontSize: '13px'});
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});
  
  return ui.Panel([
      FIRECAMLabelShort, FIRECAMLabelLong, githubRepoLabel, inputParamsLabel,
    ]);
};

// -----------------
// Region Panel
// -----------------
var regionSelectPanel = function(regionNames) {
  var regionLabel = ui.Label('1) Select Region:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var regionSelect = ui.Select({items: regionNames.sort(), value: 'EQAS - Equatorial Asia', style: {stretch: 'horizontal'}});
  return ui.Panel([regionLabel, regionSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

var getRegions = function(regionSelectPanel) {
  return regionSelectPanel.widgets().get(1).getValue();
};

// -----------------
// Species Panel
// -----------------
var speciesSelectPanel = function() {
  var speciesLabel = ui.Label('2) Select Species:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var speciesList = ['CO','CO2','CH4','OC','BC','PM2.5'];
  var speciesSelect = ui.Select({items: speciesList, value: 'CO2', style: {stretch: 'horizontal'}});
  return ui.Panel([speciesLabel, speciesSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

var getSpecies = function(speciesSelectPanel) {
  return speciesSelectPanel.widgets().get(1).getValue();
};

// -----------------
// Submit Button
// -----------------
var submitButton = ui.Button({label: 'Submit',  style: {stretch: 'horizontal'}});
var waitMessage = ui.Label(' *** See "Tasks" to start exports *** ', {margin: '-4px 8px 12px 8px', fontSize: '12.5px', textAlign: 'center', stretch: 'horizontal'});

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '350px'}
});

// Map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(0,10,2);
map.setControlVisibility({fullscreenControl: false});

var infoPanel = infoPanel();
var regionSelectPanel = regionSelectPanel(regionNames);
var speciesSelectPanel = speciesSelectPanel();

// Display Panels
controlPanel.add(infoPanel);
controlPanel.add(regionSelectPanel);
controlPanel.add(speciesSelectPanel);
controlPanel.add(submitButton);
controlPanel.add(waitMessage);
ui.root.clear(); ui.root.add(controlPanel);
ui.root.add(map);

// Run exports, linked to submit button
submitButton.onClick(function() {
  
  // Input Parameters:
  var region = getRegions(regionSelectPanel);
  var species = getRegions(speciesSelectPanel);
  
  var basisID = basisCodes.indexOf(regionNames.indexOf(region)) + 1;
  var basisCodeName = ee.List(regionNamesShort).get(basisID - 1).getInfo();
  var regionShp = getRegionShp(basisID);

  var speciesIdx = bandNames.indexOf(species);
  var speciesLabel = bandLabel.get(speciesIdx).getInfo();

  var emiByMonth = getEmiByMonth(species);
  var emiByYr = getEmiByYr(emiByMonth);

  Export.table.toDrive({
    collection: getEmiTS(emiByYr, regionShp, 'Y'),
    description: speciesLabel + '_Tg_Annual_' + basisCodeName,
    selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
  });
 
  Export.table.toDrive({
    collection: getEmiTS(emiByMonth, regionShp, 'Y-MM'),
    description: speciesLabel + '_Tg_Monthly_' + basisCodeName,
    selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
  });
  
});
