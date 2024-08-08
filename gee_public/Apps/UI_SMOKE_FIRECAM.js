// *****************************************************************
// =================================================================
// ------------- Instructions for SMOKE-FIRECAM Tool ------------ ||
// =================================================================
// *****************************************************************
/*
// Documentation:
// https://github.com/tianjialiu/SMOKE-Policy-Tool
// https://github.com/tianjialiu/FIRECAM

// @author Tianjia Liu (embrslab@gmail.com)
// Last updated: January 19, 2023

// Purpose: explore how the modeled impact of Indonesian fires
// on smoke exposure in Equatorial Asia differs in using
// five different fire emissions inventories:
// GFEDv4s, FINNv1.5, GFASv1.2, QFEDv2.5r1, FEERv1-G1.2

// Citation:
// Liu et al. (2020) Diagnosing spatial uncertainties and
// relative biases in global fire emissions inventories:
// Indonesia as regional case study.
// Remote. Sens. Environ., 237, 111557
// https://doi.org/10.1016/j.rse.2019.111557

// To start: click 'Run' above the code editor to initialize the
// user interface

// Business-As-Usual (BAU) scenarios (Steps 1-3):
// ||Step 1|| Choose an input year: 2005-2029
// ||Step 2|| Choose an emissions + meteorology year: 2005-2009
// (e.g. El Niño conditions: 2006)
// ||Step 3|| Choose a receptor (population-weighted): Singapore, Indonesia, Malaysia

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
var smokePM = require('users/tl2581/FIRECAM:Modules/SMOKE_FIRECAM_params.js');
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
// ------------
// Year Panel
// ------------
var yearPanel = function() {
  var policyToolLabel = ui.Label('SMOKE-FIRECAM Tool', {margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
  
  var infoLabel = ui.Label('The SMOKE-FIRECAM Tool is a simplified version of the SMOKE Policy Tool that explores how the modeled impact of Indonesian fires on smoke exposure in Equatorial Asia differs in using five different fire emissions inventories.',
    {margin: '8px 20px 2px 8px', fontSize: '12px', color: '#777'});
  var SMOKE_websiteLabel = ui.Label('[SMOKE Policy Tool]', {margin: '0px 0px 5px 8px', fontSize: '12.5px', color: '#5886E8'}, 'https://sites.google.com/view/smokepolicytool/home');
  var FIRECAM_websiteLabel = ui.Label('[FIRECAM]', {margin: '0px 0px 5px 8px', fontSize: '12.5px', color: '#5886E8'}, 'https://sites.google.com/view/firecam/home');
  var websiteLabel = ui.Panel([SMOKE_websiteLabel, FIRECAM_websiteLabel],ui.Panel.Layout.flow('horizontal'));
  
  var paperLabel = ui.Label('Citation: Liu et al. (2020, Remote Sens. Environ.)', {margin: '5px 0px 5px 8px', fontSize: '12.5px', color: '#5886E8'}, 'https://doi.org/10.1016/j.rse.2019.111557');
  var githubRepoLabel = ui.Label('GitHub: Code/Info', {margin: '0px 0px 5px 8px', fontSize: '12.5px', color: '#5886E8'}, 'https://github.com/tianjialiu/SMOKE-Policy-Tool');

  var headDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),
    {margin: '10px 0px 5px 0px',height:'1px',border:'0.75px solid black',stretch:'horizontal'});
 
  var inputSectionLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});
  
  var inputYearLabel = ui.Label('1) Fire Emissions Year:', {fontSize: '14.5px'});
  var inputYearSlider = ui.Slider({min: 2003, max: 2022, value: 2015, step: 1});
  inputYearSlider.style().set('stretch', 'horizontal');
  
  var metYearLabel = ui.Label('2) Meteorology Year:', {fontSize: '14.5px'});
  var metYearSlider = ui.Slider({min: 2005, max: 2009, value: 2006, step: 1});
  metYearSlider.style().set('stretch', 'horizontal');
  
  inputYearSlider.onChange(function(slideYear) {
    return metYearSlider.setValue(smokePM.closestMetYear[slideYear]);
  });
  
  var metYearMessage = ui.Label('Once you select a fire emissions year, the meteorology year moves to the most closely-matched meteorology year (from 2005-2009) based on the average Jul-Oct rainfall rate.',
    {margin: '2px 8px 6px 15px', color: '#888', fontSize: '12px'});
  var metYearDescription = ui.Label('Jul-Oct Rainfall Rank: 0 (driest) - 10 (wettest)',
    {margin: '1px 0px 0px 25px', color: '#888', fontSize: '13.8px', fontWeight:'410'});
  var metYearRanking = ui.Label('2005: [7], 2006: [1.5], 2007: [6], 2008: [9], 2009: [3.5]',
    {margin: '3px 0px 8px 12px', color: '#999', fontSize: '13.5px'});

  return ui.Panel([
    policyToolLabel, ui.Panel([ui.Panel([infoLabel, websiteLabel],ui.Panel.Layout.Flow('vertical')),
      paperLabel, githubRepoLabel, headDivider],
      ui.Panel.Layout.Flow('vertical'), {stretch: 'horizontal'}),
    inputSectionLabel,
    ui.Panel([inputYearLabel, inputYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    ui.Panel([metYearLabel, metYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    metYearMessage, metYearDescription, metYearRanking
  ]);
};

var getYears = function(yearPanel) {
  return {
    inputYear:yearPanel.widgets().get(3).widgets().get(1).getValue(),
    metYear:yearPanel.widgets().get(4).widgets().get(1).getValue()
  };
};

// -----------------
// Receptor Panel
// -----------------
var receptorSelectPanel = function() {
  var receptorLabel = ui.Label('3) Select Receptor:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var receptorList = ['Singapore','Indonesia','Malaysia'];
  var receptorSelect = ui.Select({items: receptorList, value: 'Singapore', style: {stretch: 'horizontal'}});
  return ui.Panel([receptorLabel, receptorSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

var getReceptor = function(receptorSelectPanel) {
  return receptorSelectPanel.widgets().get(1).getValue();
};

// -----------------
// Submit Button
// -----------------
var submitButton = function() {
  return ui.Button({label: 'Submit',  style: {stretch: 'horizontal'}});
};

// --------
// Legends
// --------
var discreteLegend = function(controlPanel, title, labels, colPal) {
  var discreteLegendPanel = ui.Panel({
    style: {
      padding: '0px 0px 5px 8px'
    }
  });
  controlPanel.add(discreteLegendPanel);
   
  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '16px', margin: '0 0 6px 8px'});
  discreteLegendPanel.add(legendTitle);
  
  var makeRow = function(colPal, labels) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: colPal,
        padding: '8px',
        margin: '0 0 4px 10px'
      }
    });

    var description = ui.Label({value: labels, style: {margin: '0 0 5px 6px'}});
    return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
  }; 
  
  for (var i = 0; i < labels.length; i++) {
    discreteLegendPanel.add(makeRow(colPal[i], labels[i]));
  }
};

var continuousLegend = function(controlPanel, title, colPal, minVal,
  maxVal, units, stretchFactor, maxValPos) {
  var continuousLegendPanel = ui.Panel({
    style: {
      padding: '0px 0px 5px 8px'
    }
  });
  controlPanel.add(continuousLegendPanel);
  
  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '16px', margin: '0 0 6px 8px'});
  continuousLegendPanel.add(legendTitle);
  continuousLegendPanel.add(ui.Label(units,{margin: '-6px 0 6px 8px'}));

  var makeRow = function(colPal) {
    var colorBox = ui.Label('', {
        backgroundColor: colPal,
        padding: '8px' + ' ' + stretchFactor + 'px',
        margin: '0 0 4px 0px',
    });
    return ui.Panel({widgets: [colorBox], layout: ui.Panel.Layout.Flow('vertical')});
  };
  
  var colPalWidget = []; var labelWidget = [];
  for (var i = 0; i < colPal.length; i++) {
    colPalWidget[i] = makeRow(colPal[i]);
  }
  
  continuousLegendPanel.add(ui.Panel({widgets: colPalWidget, layout: ui.Panel.Layout.Flow('horizontal'),
    style: {margin: '0 0 6px 8px'}}));
  continuousLegendPanel.add(ui.Label(minVal,{margin: '-6px 0px 0px 8px'}));
  continuousLegendPanel.add(ui.Label(maxVal,{margin: '-17px 5px 0px ' + maxValPos + 'px', textAlign: 'right'}));
};

var legendPanel = function(controlPanel) {
  var footDivider = ui.Panel(ui.Label(),ui.Panel.Layout.flow('horizontal'),
    {margin: '6px 0px 20px 0px',height:'1px',border:'0.75px solid black',stretch:'horizontal'});
  controlPanel.add(footDivider);
  controlPanel.add(ui.Label('Legends', {fontWeight: 'bold', fontSize: '20px', margin: '-3px 8px 8px 15px'}));
  
  controlPanel.add(ui.Label('SMOKE Layers',
    {margin: '5px 0px 8px 15px', fontSize: '18.5px', fontWeight: '100'}));
  
  // SMOKE layers
  continuousLegend(controlPanel,'GEOS-Chem Adjoint Sensitivity',
    smokePM.sensColRamp, 0, '10⁵', 'Jul-Oct Average, (μg m⁻³) / (g m⁻² s⁻¹)', 13.8, 291);
  
  continuousLegend(controlPanel,'PM2.5 Exposure',
    smokePM.PMColRamp, 0, 20, 'Jul-Oct Average, μg m⁻³, scaled by 100', 18.975, 293);
    
  continuousLegend(controlPanel,'OC + BC Emissions',
    smokePM.emissColRamp, 0, 5, 'Jul-Oct Average, μg m⁻² s⁻¹', 18.975, 300);
  
  controlPanel.add(ui.Label('FIRECAM Metrics',
    {margin: '15px 0px 8px 15px', fontSize: '18.5px', fontWeight: '100'}));
  
  // FIRECAM metrics
  continuousLegend(controlPanel,'BA-AFA Discrepancy',
    colPals.RdBu, -1, 1, 'Metric 1: normalized difference', 21.686, 302);
  
  continuousLegend(controlPanel,'Cloud/Haze Obscuration',
    colPals.Blues, 0, 1, 'Metric 2: fractional, FRP-weighted', 18.975, 302);

  continuousLegend(controlPanel,'Burn Size/Fragmentation',
    colPals.OrRed, 0, 2, 'Metric 3: km² / fragment', 18.975, 302);
  
  continuousLegend(controlPanel,'Topography Variance',
    colPals.Grays, 0, 1000, 'Metric 4: m²', 21.686, 279);

  continuousLegend(controlPanel,'VIIRS FRP Outside MODIS Burn Extent',
    colPals.Sunset, 0, 1, 'Metric 5: fractional', 21.686, 302);
    
  controlPanel.add(ui.Label('', {margin: '0px 0px 5px 0px'}));
};
    
var brgLegend = function() {
  var discreteLegendPanel = ui.Panel({
    style: {
      padding: '0 9px 2px 9px',
      position: 'bottom-left'
    }
  });
   
  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '18px', margin: '6px 0 4px 0'});
  discreteLegendPanel.add(legendTitle);
  
  var makeRow = function(colPal, labels) {
    var colorBox = ui.Label({
      style: {
        border: '1px solid ' + colPal,
        padding: '8px',
        margin: '0 0 6px 0',
        fontSize: '14px',
      }
    });

    var description = ui.Label({value: labels, style: {margin: '0 0 4px 6px', fontSize: '13.5px'}});
    return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
  };
  
  for (var i = 0; i < labels.length; i++) {
    discreteLegendPanel.add(makeRow(colPal[i], labels[i]));
  }
  return discreteLegendPanel;
};

var discreteLegendMap = function(title, labels, colPal) {
  var discreteLegendPanel = ui.Panel({
    style: {
      padding: '0 9px 2px 9px',
      position: 'bottom-left'
    }
  });
   
  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '18.5px', margin: '6px 0 4px 0'});
  discreteLegendPanel.add(legendTitle);
  
  var makeRow = function(colPal, labels) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: colPal,
        padding: '8px',
        margin: '0 0 6px 0',
        fontSize: '14px',
      }
    });

    var description = ui.Label({value: labels, style: {margin: '0 0 4px 6px', fontSize: '13.5px'}});
    return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
  };
  
  for (var i = 0; i < labels.length; i++) {
    discreteLegendPanel.add(makeRow(colPal[i], labels[i]));
  }
  return discreteLegendPanel;
};

// -----------
// Plot Panel
// -----------
var plotPanelLabel = ui.Label('Fire-Related Smoke Exposure', {fontWeight: 'bold', fontSize: '20px', margin: '12px 8px 3px 22px'});

// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '350px', maxWidth: '350px'}
});

// Plot panel
var plotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var plotPanelParent = ui.Panel([plotPanelLabel, plotPanel], null,
  {width: '410px', maxWidth: '410px'});
  
// Map panel
var map = ui.Map();
map.style().set({cursor:'crosshair'});
map.setCenter(112,-2,5);
map.setControlVisibility({fullscreenControl: false});

var submitButton = submitButton();
var yearPanel = yearPanel();
var receptorSelectPanel = receptorSelectPanel();
var clickCounter = 0;

// Display Panels
controlPanel.add(yearPanel);
controlPanel.add(receptorSelectPanel);
controlPanel.add(submitButton);

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
    legendPanel(controlPanel);
  }
  
  // Scenario Parameters:
  var inputYear = getYears(yearPanel).inputYear;
  var metYear = getYears(yearPanel).metYear;
  var receptor = getReceptor(receptorSelectPanel);
  var inEmiInvName = 'GFASv1p2';
  
  // Display Maps:
  var sensitivityMap = smokePM.getSensMap(metYear,receptor);
  var PMExposureMap = smokePM.getPMmap(inEmiInvName,inputYear,metYear,receptor);
  var emissMap = smokePM.getEmissMap(inEmiInvName,inputYear,metYear,receptor);

  map.clear(); map.setCenter(108,-2,6);
  map.setOptions('Map', {'Map':[], 'Dark':baseMap.darkTheme}, ['Map','Dark']);
 
  map.addLayer(RFCM5.multiply(1e3), {palette: colPals.Sunset, min: 0, max: 1e3}, 'Metric 5: Additional VIIRS FRP', false);
  map.addLayer(RFCM4, {palette: colPals.Grays, min: 0, max: 1e3}, 'Metric 4: Topography', false);
  map.addLayer(RFCM3.multiply(1e3), {palette: colPals.OrRed, min: 0, max: 2e3}, 'Metric 3: Burn Size', false);
  map.addLayer(RFCM2.multiply(1e3), {palette: colPals.Blues, min: 0, max: 1e3}, 'Metric 2: Cloud/Haze', false);
  map.addLayer(RFCM1.multiply(1e3), {palette: colPals.RdBu, min: -1e3, max: 1e3}, 'Metric 1: Areal BA-AF', false);

  map.addLayer(sensitivityMap.updateMask(sensitivityMap.gt(1e4)),
    {palette: smokePM.sensColRamp, max: 1e5, opacity: 0.4},'GEOS-Chem Adjoint Sensitivity (Jul-Oct)',false);
  map.addLayer(PMExposureMap.multiply(100).selfMask(),
    {palette: smokePM.PMColRamp, max: 20},'PM2.5 Exposure (Jul-Oct)', true);
  map.addLayer(emissMap.selfMask(),
    {palette: smokePM.emissColRamp, max: 5},'OC+BC Emissions (Jul-Oct)', false);

  var invMapOptionSelect = ui.Select({
    items: smokePM.invDispNames,
    value: 'GFASv1.2',
    onChange: function(selected) {
      map.remove(map.layers().get(7)); map.remove(map.layers().get(6));
      var inInv = smokePM.invList[selected];
      PMExposureMap = smokePM.getPMmap(inInv,inputYear,metYear,receptor);
      emissMap = smokePM.getEmissMap(inInv,inputYear,metYear,receptor);
      map.addLayer(PMExposureMap.multiply(100).selfMask(),
        {palette: smokePM.PMColRamp, max: 20},'PM2.5 Exposure (Jul-Oct)', true);
      map.addLayer(emissMap.selfMask(),
        {palette: smokePM.emissColRamp, max: 5},'OC+BC Emissions (Jul-Oct)', false);
    },
    style: {
      margin: '0px 8px 0px 5px',
      stretch: 'horizontal'
    }
  });
  
  var mapInvLabel = ui.Label('Inventory on Map:', {margin: '0px 15px 8px 20px', fontSize: '14px'});
  var mapInvPanel = ui.Panel({
    widgets: [mapInvLabel,invMapOptionSelect],
    style: {
      position: 'bottom-right',
      margin: '0px 8px 8px 8px'
    }
  });
  
  map.add(mapInvPanel);
  
  // Display Charts:
  var PMtsInv = smokePM.getPMinv(inputYear,metYear,receptor);
  var PMtsAvg = smokePM.getPMavg(PMtsInv,inputYear,metYear);
  var PMchart = smokePM.getPMtsChart(PMtsInv);
  var PMprovChart = smokePM.getPMContrByProvChart(inEmiInvName,PMExposureMap);
  
  plotPanel.clear();
  
  var bestInvInfo = ui.Label('For this region, we find that smoke PM2.5 modeled using GFASv1.2 emissions most closely matches that of observations in terms of magnitude and variability.',
    {margin: '8px 20px 3px 22px', fontSize: '12px', color: '#777'});
  plotPanel.add(bestInvInfo);
  
  var IntOptionSelect = ui.Select({
    items: ['Monthly Timeseries','Jul-Oct Average'],
    value: 'Monthly Timeseries',
    onChange: function(selected) {
      plotPanel.remove(PMchart);
      if (selected == 'Monthly Timeseries') {
        PMchart = smokePM.getPMtsChart(PMtsInv);
      }
      if (selected == 'Jul-Oct Average') {
        PMchart = smokePM.getPMavgChart(PMtsAvg);
      }
      plotPanel.insert(1,PMchart);
    },
    style: {
      margin: '0px 25px 8px 5px',
      stretch: 'horizontal'
    }
  });
  
  var plotIntLabel = ui.Label('Change Plot:', {margin: '5px 15px 8px 20px', fontSize: '14px'});
  var plotIntPanel = ui.Panel({
    widgets: [plotIntLabel,IntOptionSelect],
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {margin: '-15px 100px 8px 8px'}
  });

  plotPanel.add(PMchart);
  plotPanel.add(plotIntPanel);
  
  var invOptionSelect = ui.Select({
    items: smokePM.invDispNames,
    value: 'GFASv1.2',
    onChange: function(selected) {
      plotPanel.remove(PMprovChart);
      var inInv = smokePM.invList[selected];
      PMExposureMap = smokePM.getPMmap(inInv,inputYear,metYear,receptor);
      PMprovChart = smokePM.getPMContrByProvChart(inInv,PMExposureMap);
      plotPanel.insert(3,PMprovChart);
    },
    style: {
      margin: '0px 25px 8px 5px',
      stretch: 'horizontal'
    }
  });
  
  var plotProvLabel = ui.Label('Change Inventory:', {margin: '5px 15px 8px 20px', fontSize: '14px'});
  var plotProvPanel = ui.Panel({
    widgets: [plotProvLabel,invOptionSelect],
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {margin: '-15px 100px 8px 8px'}
  });
  
  plotPanel.add(PMprovChart);
  plotPanel.add(plotProvPanel);
   
});
