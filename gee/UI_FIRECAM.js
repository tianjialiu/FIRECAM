// *****************************************************************
// =================================================================
// ---------------- Instructions for FIRECAM Tool --------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// Author: Tianjia Liu
// Last updated: September 18, 2018

// Purpose: explore regional differences in fire emissions from five
// global fire emissions inventories (GFED, FINN, GFAS, QFED, FEER)
// for six species (CO, CO2, CH4, OC, BC, PM2.5)
*/
// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// ----------------
// Import Modules |
// ----------------
var plotParams = require('users/tl2581/FIRECAM:Modules/plotParams.js');
var FIRECAM = require('users/tl2581/FIRECAM:Modules/FIRECAM.js');

// --------------
// Input Params |
// --------------
var bandNames = ['CO','CO2','CH4','OC','BC','PM2/5'];
var bandMulti = ee.Image([1e3,1e3,1e6,1e6,1e6,1e6]).rename(bandNames);
var bandMaxVal = ee.List([100,2000,2000,3000,500,5000]);
var bandMaxPos = ee.List([235,228,228,228,235,228]);
var bandUnits = ee.List(['Gg','Gg','Mg','Mg','Mg','Mg']);
var bandLabel = ee.List(['CO','CO2','CH4','OC','BC','PM2.5']);

var regionNames = ['BONA - Boreal North America',
  'TENA - Temperate North America',
  'CEAM - Central America',
  'NHSA - Northern Hemisphere South America',
  'SHSA - Southern Hemisphere South America',
  'EURO - Europe', 'MIDE - Middle East', 'NHAF - Northern Hemisphere Africa',
  'SHAF - Southern Hemisphere Africa', 'BOAS - Boreal Asia',
  'CEAS - Central Asia', 'SEAS - Southeast Asia',
  'EQAS - Equatorial Asia', 'AUST - Australia and New Zealand'];

var basisCodes = [2,13,3,9,12,6,7,8,11,1,4,10,5,0];

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '335px'}
});

// Plot panel
var plotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var plotPanelParent = ui.Panel([plotParams.plotPanelLabel, plotPanel], null, {width: '450px'});

// Map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(0,10,2);
map.setControlVisibility({fullscreenControl: false});

var submitButton = plotParams.submitButton();
var infoPanel = plotParams.infoPanel();
var regionSelectPanel = plotParams.regionSelectPanel(regionNames);
var speciesSelectPanel = plotParams.speciesSelectPanel();

// Display Panels
controlPanel.add(infoPanel);
controlPanel.add(regionSelectPanel);
controlPanel.add(speciesSelectPanel);
controlPanel.add(submitButton);
controlPanel.add(plotParams.waitMessage);
plotParams.legendPanel(controlPanel);
ui.root.clear(); ui.root.add(controlPanel);
ui.root.add(map); ui.root.add(plotPanelParent);

// Run calculations, linked to submit button
submitButton.onClick(function() {
  
  // Input Parameters:
  var region = plotParams.getRegions(regionSelectPanel);
  var species = plotParams.getRegions(speciesSelectPanel);
  
  var basisID = basisCodes.indexOf(regionNames.indexOf(region)) + 1;
  var regionShp = FIRECAM.getRegionShp(basisID);

  var speciesIdx = bandNames.indexOf(species);
  var maxVal = bandMaxVal.get(speciesIdx).getInfo();
  var maxPos = bandMaxPos.get(speciesIdx).getInfo();
  var speciesLabel = bandLabel.get(speciesIdx).getInfo();
  var unitsLabel = bandUnits.get(speciesIdx).getInfo();
  var spBandName = ee.List(bandNames).get(speciesIdx).getInfo();
  var vizParams = {palette: plotParams.colPal_Spectral, min: 0, max: maxVal};
  
  var emiByMonth = FIRECAM.getEmiByMonth(species);
  var emiByYr = FIRECAM.getEmiByYr(emiByMonth);
  
  var emiByYrMean = ee.Image(['projects/GlobalFires/GFEIyrMean_sp/GFEIyrMean_' + spBandName])
    .multiply(bandMulti.select(species))
    .clip(FIRECAM.basisRegions).reproject({crs: 'EPSG:4326', crsTransform: [0.5,0,-180,0,-0.5,90]});

  // Display Maps:
  map.clear(); map.centerObject(regionShp);
  map.addLayer(FIRECAM.RFCM1.multiply(1e3), {palette: plotParams.colPal_RdBu, min: -1e3, max: 1e3}, 'Metric 1: Areal BA-AF Discrepancy', false);
  map.addLayer(FIRECAM.RFCM2.multiply(1e3), {palette: plotParams.colPal_Blues, min: 0, max: 1e3}, 'Metric 2: Cloud/Haze Obscuration', false);
  map.addLayer(FIRECAM.RFCM3.multiply(1e3), {palette: plotParams.colPal_Reds, min: 0, max: 2e3}, 'Metric 3: Burn Size/Fragmentation', false);
  map.addLayer(FIRECAM.RFCM4, {palette: plotParams.colPal_Grays, min: 0, max: 1e3}, 'Metric 4: Topography Variance', false);
  map.addLayer(FIRECAM.RFCM5.multiply(1e3), {palette: plotParams.colPal_Reds, min: 0, max: 1e3}, 'Metric 5: VIIRS FRP Outside MODIS Burn Extent', false);

  map.addLayer(emiByYrMean.select('FEERv1p0_G1p2').selfMask(), vizParams, 'FEERv1.0-G1.2', false);
  map.addLayer(emiByYrMean.select('QFEDv2p5r1').selfMask(), vizParams, 'QFEDv2.5r1', false);
  map.addLayer(emiByYrMean.select('GFASv1p2').selfMask(), vizParams, 'GFASv1.2', false);
  map.addLayer(emiByYrMean.select('FINNv1p5').selfMask(), vizParams, 'FINNv1.5', false);
  map.addLayer(emiByYrMean.select('GFEDv4s').selfMask(), vizParams, 'GFEDv4s');
  
  map.addLayer(ee.Image().byte().rename('Selected Basis Region')
    .paint(ee.FeatureCollection(regionShp), 0, 2), {palette:'#000000'}, 'Selected Region');
    
  map.add(plotParams.emiLegend(speciesLabel, unitsLabel, maxVal, maxPos));
  
  // Display Charts:
  plotPanel = plotPanel.clear();
  FIRECAM.plotEmiTS(plotPanel, emiByYr, regionShp, species, 'Annual');
  FIRECAM.plotEmiTS(plotPanel, emiByMonth, regionShp, species, 'Monthly');
});
