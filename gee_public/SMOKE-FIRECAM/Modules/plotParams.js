// ===============
// || UI Panels ||
// ===============
// Imports:
var smokePM = require('users/smokepolicytool/firecam:Modules/smokePM.js');
var smokeHealth = require('users/smokepolicytool/firecam:Modules/smokeHealth.js');
var baseMap = require('users/tl2581/packages:baseMap.js');
var colPals = require('users/tl2581/packages:colorPalette.js');

// ------------
// Year Panel
// ------------
exports.yearPanel = function() {
  var policyToolLabel = ui.Label('SMOKE-FIRECAM Tool', {margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
  
  var infoLabel = ui.Label('The SMOKE-FIRECAM Tool is a version of the SMOKE Policy Tool that explores how the modeled impact of Indonesian fires on public health in Equatorial Asia differs in using five different fire emissions inventories.',
    {margin: '8px 20px 2px 8px', fontSize: '12px', color: '#777'});
  var SMOKE_websiteLabel = ui.Label('[SMOKE Policy Tool]', {margin: '0px 0px 5px 8px', fontSize: '12.5px'}, 'https://sites.google.com/view/smokepolicytool/home');
  var FIRECAM_websiteLabel = ui.Label('[FIRECAM]', {margin: '0px 0px 5px 8px', fontSize: '12.5px'}, 'https://sites.google.com/view/firecam/home');
  var websiteLabel = ui.Panel([SMOKE_websiteLabel, FIRECAM_websiteLabel],ui.Panel.Layout.flow('horizontal'));
  
  var paperLabel = ui.Label('Citation: Liu et al. (2020, Remote Sens. Environ.)', {margin: '5px 0px 5px 8px', fontSize: '12.5px'}, 'https://doi.org/10.1016/j.rse.2019.111557');
  var githubRepoLabel = ui.Label('GitHub: Code/Info', {margin: '0px 0px 5px 8px', fontSize: '12.5px'}, 'https://github.com/tianjialiu/SMOKE-Policy-Tool');

  var inputSectionLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});
  
  var invLabel = ui.Label('1) Select Inventory:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var invList = ['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1-G1.2'];
  var invSelect = ui.Select({items: invList, value: 'GFASv1.2', style: {stretch: 'horizontal'}});
  var invPanel = ui.Panel([invLabel, invSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});

  var inputYearLabel = ui.Label('2) Fire Emissions Year:', {fontSize: '14.5px'});
  var inputYearSlider = ui.Slider({min: 2003, max: 2016, value: 2015, step: 1});
  inputYearSlider.style().set('stretch', 'horizontal');
  
  var metYearLabel = ui.Label('3) Meteorology Year:', {fontSize: '14.5px'});
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
      paperLabel, githubRepoLabel],
      ui.Panel.Layout.Flow('vertical'), {stretch: 'horizontal'}),
    inputSectionLabel, invPanel,
    ui.Panel([inputYearLabel, inputYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    ui.Panel([metYearLabel, metYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    metYearMessage, metYearDescription, metYearRanking
  ]);
};

exports.getYears = function(yearPanel) {
  return {
    inputYear:yearPanel.widgets().get(4).widgets().get(1).getValue(),
    metYear:yearPanel.widgets().get(5).widgets().get(1).getValue()
  };
};

exports.getInvName = function(yearPanel) {
  return yearPanel.widgets().get(3).widgets().get(1).getValue();
};

// -----------------
// Receptor Panel
// -----------------
exports.receptorSelectPanel = function() {
  var receptorLabel = ui.Label('4) Select Receptor:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var receptorList = ['Singapore','Indonesia','Malaysia'];
  var receptorSelect = ui.Select({items: receptorList, value: 'Singapore', style: {stretch: 'horizontal'}});
  return ui.Panel([receptorLabel, receptorSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

exports.getReceptor = function(receptorSelectPanel) {
  return receptorSelectPanel.widgets().get(1).getValue();
};

// --------------------------------
// Remove Emissions From... Panels
// --------------------------------
exports.csn_csvPanel = function(csn_csvBox, controlPanel) {
  controlPanel.add(ui.Label('4) (Optional) Remove Emissions From:', {fontWeight: 400, color: 'red', fontSize: '14.5px'}));
  
  controlPanel.add(ui.Label('Concessions:', {margin: '-2px 0px -2px 8px', stretch: 'horizontal'}));
  controlPanel.add(ui.Panel([
    ui.Panel([csn_csvBox[0]], null, {margin: '-2px -10px 2px 5px', stretch: 'horizontal'}),
    ui.Panel([csn_csvBox[1]], null, {margin: '-2px -10px -2px 2px', stretch: 'horizontal'}),
    ui.Panel([csn_csvBox[2]], null, {margin: '-2px 0px -2px 18px', stretch: 'horizontal'}),
  ],
  ui.Panel.Layout.Flow('horizontal'), {margin: '2px 0px 4px 0px', stretch: 'horizontal'}));
  
  controlPanel.add(ui.Label('Other Regions/Conservation:', {margin: '-1px 0px 4px 8px', stretch: 'horizontal'}));
  controlPanel.add(ui.Panel([
    ui.Panel([csn_csvBox[3]], null, {margin: '-2px -10px -2px 5px', stretch: 'horizontal'}),
    ui.Panel([csn_csvBox[4]], null, {margin: '-10px -10px -2px 2px', stretch: 'horizontal'}),
    ui.Panel([csn_csvBox[5]], null, {margin: '-2px 0px -2px 18px', stretch: 'horizontal'}),
  ],
  ui.Panel.Layout.Flow('horizontal'), {margin: '2px 0px -4px 0px', stretch: 'horizontal'}));
};

exports.getChecked = function(box, list) {
  var checkedList = [];
    box.forEach(function(name, index) {
      var isChecked = box[index].getValue();
      if (isChecked) {checkedList.push([list[index][1]]);}
    });
  return ee.List(checkedList).flatten();
};

exports.provPanel = function(provBox) {
  var provLabel = ui.Label('By IDs: ', {margin: '8px 6px 8px 8px', stretch: 'vertical'});
  return ui.Panel([provLabel,provBox], ui.Panel.Layout.Flow('horizontal'), {margin: '-5px 8px 0px 8px', stretch: 'horizontal'});
};

exports.provOptionsPanel = function() {
  var provOptLabel = ui.Label('Indonesian provinces:', {padding: '5px 0px 0px 0px'});
  var provOptList = ['Block all fires','Target conservation efforts'];
  var provOptSelect = ui.Select({items: provOptList, value: 'Block all fires', style: {stretch: 'horizontal'}});
  return ui.Panel([provOptLabel, provOptSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

exports.getProvOptions = function(provOptionsPanel) {
  return provOptionsPanel.widgets().get(1).getValue();
};

// -----------------
// Submit Button
// -----------------
exports.submitButton = function() {
  return ui.Button({label: 'Submit Scenario',  style: {stretch: 'horizontal'}});
};

exports.waitMessage = ui.Label(' *** Computations will take a few seconds to be completed *** ', {margin: '-4px 8px 12px 8px', fontSize: '11.6px', textAlign: 'center', stretch: 'horizontal'});

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

exports.legendPanel = function(controlPanel) {
  controlPanel.add(ui.Label('----------------------------------------------------------------------------------',
    {margin: '-10px 8px 12px 8px', stretch: 'horizontal', textAlign: 'center'}));
  controlPanel.add(ui.Label('Legends', {fontWeight: 'bold', fontSize: '20px', margin: '-3px 8px 8px 15px'}));
  
  controlPanel.add(ui.Label('SMOKE Layers',
    {margin: '5px 0px 8px 15px', fontSize: '18.5px', fontWeight: '100'}));
  
  // SMOKE layers
  continuousLegend(controlPanel,'GEOS-Chem Adjoint Sensitivity',
    smokePM.sensColRamp, 0, '10⁵', 'Jul-Oct Average, (μg m⁻³) / (g m⁻² s⁻¹)', 13.8, 291);
  
  continuousLegend(controlPanel,'PM2.5 Exposure',
    smokePM.PMRamp, 0, 20, 'Jul-Oct Average, μg m⁻³, scaled by 100', 18.975, 293);
    
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
    
exports.brgLegend = function() {
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

exports.brgLegend = function() {
  var colPal = ['#00BFFF', '#000000'];
  var labels = ['Top 5 Priority', 'Other'];
  
  var brgLegendPanel = ui.Panel({
    style: {
      padding: '2px 10px 2px 9px',
      position: 'bottom-left'
    }
  });
   
  brgLegendPanel.add(ui.Label('BRG Sites', {fontWeight: 'bold', fontSize: '20px', margin: '6px 0 6px 0'}));
  
  var makeRow = function(colPal, labels) {
    var colorBox = ui.Label({
      style: {
        border: 'solid 2px ' + colPal,
        padding: '8px',
        margin: '0px 0 9px 0',
        fontSize: '16px',
      }
    });

    var description = ui.Label({value: labels, style: {margin: '2px 1px 4px 6px', fontSize: '15.5px'}});
    return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
  };
  
  for (var i = 0; i < labels.length; i++) {
    brgLegendPanel.add(makeRow(colPal[i], labels[i]));
  }
  
  return brgLegendPanel;
};

exports.discreteLegendMap = function(title, labels, colPal) {
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
exports.plotPanelLabel = ui.Label('Public Health Impacts', {fontWeight: 'bold', fontSize: '20px', margin: '12px 8px -3px 22px'});
