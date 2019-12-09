// *****************************************************************
// =================================================================
// ------------- Instructions for SMOKE-FIRECAM Tool ------------ ||
// =================================================================
// *****************************************************************
/*
// Documentation:
// https://github.com/tianjialiu/SMOKE-Policy-Tool
// https://github.com/tianjialiu/FIRECAM

// Author: Tianjia Liu
// Last updated: December 8, 2019

// Purpose: explore how the modeled impact of Indonesian fires
// on public health in Equatorial Asia differs in using
// five different fire emissions inventories:
// GFEDv4s, FINNv1.5, GFASv1.2, QFEDv2.5r1, FEERv1-G1.2

// Citation:
// Liu et al. (in press) Diagnosing spatial uncertainties and
// relative biases in global fire emissions inventories:
// Indonesia as regional case study. Remote. Sens. Environ.
// EarthArXiv: https://dx.doi.org/10.31223/osf.io/nh57j

// To start: click 'Run' above the code editor to initialize the
// user interface

// Business-As-Usual (BAU) scenarios (Steps 1-3):
// ||Step 1|| Choose an input year: 2005-2029
// ||Step 2|| Choose an emissions + meteorology year: 2005-2009
// (e.g. El Niño conditions: 2006)
// ||Step 3|| Choose a receptor (population-weighted): Singapore, Indonesia, Malaysia

// ||Step 4|| Submit Scenario: the script will freeze for ~4-7 seconds
// as Google Earth Engine makes the necessary computations:
// map layers will display in the center panel;
// legends will display below 'Submit Scenario' in the left panel;
// public health charts will display in the right panel

// -----------
//  - Code - |
// -----------
// * SMOKE policy tool Javascript code was adapted from 
//   Python code developed by Karen Yu (https://github.com/kyu0110/policy-tool)
// * UI functions were adapted and modified from LandTrendr-GEE UI (https://emapr.github.io/LT-GEE/index.html)

// ------------------
// - Publications - |
// ------------------
// 1. Liu et al. (2020) Diagnosing spatial uncertainties and
// relative biases in global fire emissions inventories:
// Indonesia as regional case study. Remote Sens. Environ. 237, 111557.
// https://doi.org/10.1016/j.rse.2019.111557

// 2. Marlier, M.E. et al. (2019). Fires, Smoke Exposure, and Public Health:
// An Integrative Framework to Maximize Health Benefits from Peatland Restoration.
// GeoHealth. 3, 178-189. https://doi.org/10.1029/2019GH000191

// 3. Koplitz, S.N. et al. (2016). Public health impacts of the severe haze in
// Equatorial Asia in September–October 2015: demonstration of a new framework for
// informing fire management strategies to reduce downwind smoke exposure.
// Environ. Res. Lett. 11(9), 094023. https://doi.org/10.1088/1748-9326/11/9/094023

// 4. Kim, P.S. et al. (2015). Sensitivity of population smoke exposure to fire
// locations in Equatorial Asia.
// Atmos. Environ. 102, 11-17. https://doi.org/10.1016/j.atmosenv.2014.09.045
*/
// =================================================================
// *****************   --    User Interface    --   ****************
// =================================================================
// ----------------
// Import Modules |
// ----------------
var plotParams = require('users/smokepolicytool/firecam:Modules/plotParams.js');
var smokePM = require('users/smokepolicytool/firecam:Modules/smokePM.js');
var smokeHealth = require('users/smokepolicytool/firecam:Modules/smokeHealth.js');
var firecam = require('users/tl2581/FIRECAM:Modules/FIRECAM_params.js');
var baseMap = require('users/tl2581/packages:baseMap.js');
var colPals = require('users/tl2581/packages:colorPalette.js');

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

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '350px', maxWidth: '350px'}
});

// Plot panel
var plotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var plotPanelParent = ui.Panel([plotParams.plotPanelLabel, plotPanel], null,
  {width: '400px', maxWidth: '400px'});
  
// Map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(112,-2,5);
map.setControlVisibility({fullscreenControl: false});

var submitButton = plotParams.submitButton();
var yearPanel = plotParams.yearPanel();
var receptorSelectPanel = plotParams.receptorSelectPanel();
var clickCounter = 0;

// Display Panels
controlPanel.add(yearPanel);
controlPanel.add(receptorSelectPanel);
controlPanel.add(submitButton);
controlPanel.add(plotParams.waitMessage);

ui.root.clear();
  
var init_panels = ui.SplitPanel({firstPanel: controlPanel,
  secondPanel: map});
  
var ui_panels = ui.SplitPanel({
  firstPanel: ui.Panel([init_panels]),
  secondPanel: plotPanelParent
});

ui.root.add(init_panels);

// Run calculations, linked to submit button
submitButton.onClick(function() {
  clickCounter = clickCounter + 1;
  if (clickCounter == 1) {
    ui.root.remove(init_panels);
    ui.root.add(ui_panels);
    plotParams.legendPanel(controlPanel);
  }
  
  // Scenario Parameters:
  var inputYear = plotParams.getYears(yearPanel).inputYear;
  var metYear = plotParams.getYears(yearPanel).metYear;
  var receptor = plotParams.getReceptor(receptorSelectPanel);
  var inEmiInvName = smokePM.getInvName(plotParams.getInvName(yearPanel));

  // Display Maps:
  var sensitivityMap = smokePM.getSensMap(metYear,receptor);
  var PMExposureMap = smokePM.getPMmap(inEmiInvName,inputYear,metYear,receptor);
  var emissMap = smokePM.getEmissMap(inEmiInvName,inputYear,metYear,receptor);

  map.clear(); map.setCenter(108,-1,6);
  map.setOptions('Dark', {'Map':[], 'Dark':baseMap.darkTheme}, ['Map','Dark']);
 
  map.addLayer(RFCM5.multiply(1e3), {palette: colPals.Sunset, min: 0, max: 1e3}, 'Metric 5: Additional VIIRS FRP', false);
  map.addLayer(RFCM4, {palette: colPals.Grays, min: 0, max: 1e3}, 'Metric 4: Topography', false);
  map.addLayer(RFCM3.multiply(1e3), {palette: colPals.OrRed, min: 0, max: 2e3}, 'Metric 3: Burn Size', false);
  map.addLayer(RFCM2.multiply(1e3), {palette: colPals.Blues, min: 0, max: 1e3}, 'Metric 2: Cloud/Haze', false);
  map.addLayer(RFCM1.multiply(1e3), {palette: colPals.RdBu, min: -1e3, max: 1e3}, 'Metric 1: Areal BA-AF', false);

  map.addLayer(sensitivityMap.updateMask(sensitivityMap.gt(1e4)),
    {palette: smokePM.sensColRamp, max: 1e5, opacity: 0.4},'GEOS-Chem Adjoint Sensitivity (Jul-Oct)',false);
  map.addLayer(PMExposureMap.multiply(100).selfMask(),
    {palette: smokePM.PMRamp, max: 20},'PM2.5 Exposure (Jul-Oct), scaled by 100', true);
  map.addLayer(emissMap.selfMask(),
    {palette: smokePM.emissColRamp, max: 5},'OC+BC Emissions (Jul-Oct)', false);

  // Display Charts:
  var PMts = smokePM.getPM(inEmiInvName,inputYear,metYear,receptor);
  var PMavg = smokePM.getPMavg(inEmiInvName,inputYear,metYear,receptor);
  var OCtot = smokePM.getEmissTotal(inEmiInvName,inputYear,metYear,'OC');
  var BCtot = smokePM.getEmissTotal(inEmiInvName,inputYear,metYear,'BC');
  
  smokePM.getPMchart(PMts,PMavg,OCtot,BCtot,plotPanel);
  smokePM.getPMContrByProvChart(inEmiInvName,PMExposureMap,plotPanel);
  smokeHealth.getMortalityChart(PMts,receptor,plotPanel);

});
