// *****************************************************************
// =================================================================
// ---------------- Instructions for FIRECAM Tool --------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// Author: Tianjia Liu
// Last updated: January 28, 2019

// Purpose: explore regional differences in fire emissions from five
// global fire emissions inventories (GFED, FINN, GFAS, QFED, FEER)
// for six species (CO, CO2, CH4, OC, BC, PM2.5)

// Click 'Run' to initialize the user interface
*/
// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// ----------------
// Import Modules |
// ----------------
var plotParams = require('users/tl2581/FIRECAM:Modules/plotParams.js');
var FIRECAM = require('users/tl2581/FIRECAM:Modules/emissions.js');
var lulc = require('users/tl2581/FIRECAM:Modules/lulc.js');

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
  style: {width: '345px'}
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
var yearSelectPanel = plotParams.yearSelectPanel();
var regionSelectPanel = plotParams.regionSelectPanel(regionNames);
var speciesSelectPanel = plotParams.speciesSelectPanel();

// Display Panels
controlPanel.add(infoPanel);
controlPanel.add(yearSelectPanel);
controlPanel.add(regionSelectPanel);
controlPanel.add(speciesSelectPanel);
controlPanel.add(submitButton);
plotParams.legendPanel(controlPanel);
plotParams.lulcLegend(controlPanel,plotParams.lulcPeat_colPal);
ui.root.clear(); ui.root.add(controlPanel);
ui.root.add(map); ui.root.add(plotPanelParent);

// Run calculations, linked to submit button
submitButton.onClick(function() {
  
  // Input Parameters:
  var sYear = plotParams.getYears(yearSelectPanel).startYear;
  var eYear = plotParams.getYears(yearSelectPanel).endYear;
 
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
  
  var emiByMonth = FIRECAM.getEmiByMonth(species, sYear, eYear);
  var emiByYr = FIRECAM.getEmiByYr(emiByMonth, sYear, eYear);
  
  var emiByYrMean = ee.Image(['projects/GlobalFires/GFEIyrMean_sp/GFEIyrMean_' + spBandName])
    .clip(FIRECAM.basisRegions).reproject({crs: 'EPSG:4326', crsTransform: [0.5,0,-180,0,-0.5,90]});
  var emiByYrMeanAdj = emiByYrMean.multiply(bandMulti.select(species));
  
  var mapYr = ee.Number((sYear + eYear)/2).round();
  var lulcMapYr = lulc.getLULCmap(mapYr);
  
  // Display Maps:
  map.clear(); map.centerObject(regionShp);
  map.addLayer(lulcMapYr, {palette: plotParams.lulc_colPal, min: 1, max: 7}, 'Land Use/ Land Cover ' + mapYr.getInfo(), false);
  map.addLayer(lulc.peat.gt(0).selfMask(), {palette: ['#800080']}, 'Peatlands', false);
  
  map.addLayer(FIRECAM.RFCM1.multiply(1e3), {palette: plotParams.colPal_RdBu, min: -1e3, max: 1e3}, 'Metric 1: BA-AFA Discrepancy', false);
  map.addLayer(FIRECAM.RFCM2.multiply(1e3), {palette: plotParams.colPal_Blues, min: 0, max: 1e3}, 'Metric 2: Cloud/Haze Obscuration', false);
  map.addLayer(FIRECAM.RFCM3.multiply(1e3), {palette: plotParams.colPal_Reds, min: 0, max: 2e3}, 'Metric 3: Burn Size/Fragmentation', false);
  map.addLayer(FIRECAM.RFCM4, {palette: plotParams.colPal_Grays, min: 0, max: 1e3}, 'Metric 4: Topography Variance', false);
  map.addLayer(FIRECAM.RFCM5.multiply(1e3), {palette: plotParams.colPal_Reds, min: 0, max: 1e3}, 'Metric 5: VIIRS FRP Outside MODIS Burn Extent', false);

  map.addLayer(emiByYrMeanAdj.select('FEERv1p0_G1p2').selfMask(), vizParams, 'FEERv1.0-G1.2', false);
  map.addLayer(emiByYrMeanAdj.select('QFEDv2p5r1').selfMask(), vizParams, 'QFEDv2.5r1', false);
  map.addLayer(emiByYrMeanAdj.select('GFASv1p2').selfMask(), vizParams, 'GFASv1.2', false);
  map.addLayer(emiByYrMeanAdj.select('FINNv1p5').selfMask(), vizParams, 'FINNv1.5', false);
  map.addLayer(emiByYrMeanAdj.select('GFEDv4s').selfMask(), vizParams, 'GFEDv4s');
  
  map.addLayer(ee.Image().byte().rename('Selected Basis Region')
    .paint(ee.FeatureCollection(regionShp), 0, 2), {palette:'#000000'}, 'Selected Region');
    
  map.add(plotParams.emiLegend(speciesLabel, unitsLabel, maxVal, maxPos));
  
  // Display Charts:
  plotPanel = plotPanel.clear();
  
  var totalChart = FIRECAM.plotEmiBar(plotPanel, emiByYrMean, regionShp, species, 'Annual');
  plotPanel.add(totalChart); plotPanel.add(ui.Label('', {margin: '-28px 8px 8px'}));
  
  var annualChart = FIRECAM.plotEmiTS(plotPanel, emiByYr, regionShp,
    species, 'Annual', 'Y', sYear, eYear, 1, 1, null);
  
  if (eYear-sYear <= 5) {
    var nYear = eYear-sYear+1;
    annualChart = FIRECAM.updateOpts(annualChart, species, 'Annual', 'Y', (sYear-1), eYear, 12, 2, nYear);
    annualChart.setChartType('ScatterChart');
  }
  
  plotPanel.add(annualChart); plotPanel.add(ui.Label('', {margin: '-25px 8px 8px'}));
  
  var monthlyChart = FIRECAM.plotEmiTS(plotPanel, emiByMonth, regionShp,
    species, 'Monthly', 'MMM Y', sYear, eYear, 1, 12, null);
  plotPanel.add(monthlyChart);
  
});
