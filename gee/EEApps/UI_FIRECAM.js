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
// --------------
// Input Params |
// --------------
var sYear = 2003; var eYear = 2016;
var nMonth = (eYear-sYear+1)*12-1;
var projFolder = 'users/tl2581/';

var invNames = ['GFEDv4s','FINNv1p5','GFASv1p2','QFEDv2p5r1','FEERv1p0_G1p2'];
var bandNames = ['CO','CO2','CH4','OC','BC','PM2p5'];
var bandMulti = ee.Image([1e3,1e3,1e6,1e6,1e6,1e6]).rename(bandNames);
var bandMaxVal = ee.List([100,2000,2000,3000,500,5000]);
var bandMaxPos = ee.List([235,228,228,228,235,228]);
var bandUnits = ee.List(['Gg','Gg','Mg','Mg','Mg','Mg']);
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

var basisCodes = [2,13,3,9,12,6,7,8,11,1,4,10,5,0];
var basisRegions = ee.FeatureCollection(projFolder + 'basisRegions_0p5deg');

// ------------------------------------
// - - - - - - FIRECAM.js - - - - - - |
// ------------------------------------
// ----------------------------------
// Relative Fire Confidence Metrics
// ----------------------------------
// Metric 1: areal BA-AF discrepancy
var RFCM1 = ee.Image([projFolder + 'RelFireConfidence/RFCM1_areal_BA_AF_discrepancy']);
// Metric 2: FRP-weighted cloud/haze burden on satellite observing conditions
var RFCM2 = ee.Image([projFolder + 'RelFireConfidence/RFCM2_cloud_haze_burden']);
// Metric 3: burn size and fragmentation
var RFCM3 = ee.Image([projFolder + 'RelFireConfidence/RFCM3_fireBAComponentSize']);
// Metric 4: topography variance
var RFCM4 = ee.Image([projFolder + 'RelFireConfidence/RFCM4_topo_variance']);
// Metric 5: additional small fires from VIIRS
var RFCM5 = ee.Image([projFolder + 'RelFireConfidence/RFCM5_additionalFRP_VIIRS']);

// ----------------------------------
// Global Fire Emissions Inventories
// ----------------------------------
var gfedv4s = ee.ImageCollection(projFolder + 'GFEDv4s_sp');
var finnv1p5 = ee.ImageCollection(projFolder + 'FINNv1p5_sp');
var gfasv1p2 = ee.ImageCollection(projFolder + 'GFASv1p2_sp');
var qfedv2p5 = ee.ImageCollection(projFolder + 'QFEDv2p5r1_sp');
var feerv1p0_g1p2 = ee.ImageCollection(projFolder + 'FEERv1p0_G1p2_sp');

var aggProj = ee.Image(gfedv4s.first())
  .reproject({crs: 'EPSG:4326', crsTransform: [0.5,0,-180,0,-0.5,90]})
  .projection();
  
var gfedList = gfedv4s.toList(500,0);
var finnList = finnv1p5.toList(500,0);
var gfasList = gfasv1p2.toList(500,0);
var qfedList = qfedv2p5.toList(500,0);
var feerList = feerv1p0_g1p2.toList(500,0);

var getBand = function(imageList, iMonth, renameBands, species) {
  var image = ee.Image(imageList.get(iMonth));

  return ee.Image(image.select('.*_0-5deg').divide(1e9)
    .rename(renameBands).select(species)
    .reproject({crs: aggProj, scale: aggProj.nominalScale()})
    .copyProperties(image,['system:time_start']));
};


var getEmiByMonth = function(species) {
  
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

var plotEmiTS = function(plotPanel, imageCol, regionShp,
  speciesLabel, timePeriod) {
  
  var chart = ui.Chart.image.series({
    imageCollection: imageCol.select(invNames,['b1','b2','b3','b4','b5']),
    region: regionShp,
    reducer: ee.Reducer.sum().unweighted(),
    scale: aggProj.nominalScale(),
    xProperty: 'system:time_start',
  }).setChartType('LineChart')
    .setSeriesNames(['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1.0-G1.2'])
    .setOptions({
      title: timePeriod + ' Regional Fire Emissions',
      vAxis: {title: ['Emissions (Tg ' + speciesLabel + ')']},
      height: '230px',
      series: {
        0: {color: '777777'},
        1: {color: '87CEEB'},
        2: {color: 'FF0000'},
        3: {color: 'FDB751'},
        4: {color: '800080'},
      }
    });
  
  plotPanel.add(chart);
};

// ---------------------------------------
// - - - - - - plotParams.js - - - - - - |
// ---------------------------------------
// ------------
// Info Panel
// ------------
var infoPanel = function() {
  var FIRECAMLabelShort = ui.Label('FIRECAM Online Tool', {margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
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
var waitMessage = ui.Label(' *** Computations will take a few seconds to be completed *** ', {margin: '-4px 8px 12px 8px', fontSize: '11.6px', textAlign: 'center', stretch: 'horizontal'});

// --------
// Legends
// --------
var colPal_RdBu = ['#2166AC','#67A9CF','#D1E5F0','#F7F7F7','#FDDBC7','#EF8A62','#B2182B'];
var colPal_Blues = ['#EFF3FF','#C6DBEF','#9ECAE1','#6BAED6','#4292C6','#2171B5','#084594'];
var colPal_Reds = ['#FEE5D9','#FCBBA1','#FC9272','#FB6A4A','#EF3B2C','#CB181D','#99000D'];
var colPal_Grays = ['#F7F7F7','#D9D9D9','#BDBDBD','#969696','#737373','#525252','#252525'];
var colPal_Spectral = ['#3288BD','#99D594','#E6F598','#FFFFBF','#FEE08B','#FC8D59','#D53E4F'];

var continuousLegend = function(controlPanel, title, colPal, minVal,
  maxVal, units, maxValPos) {
  var continuousLegendPanel = ui.Panel({
    style: {
      padding: '0px 0px 5px 8px'
    }
  });
  controlPanel.add(continuousLegendPanel);
  
  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '16px', margin: '0 0 6px 8px'});
  continuousLegendPanel.add(legendTitle);
  continuousLegendPanel.add(ui.Label(units, {margin: '-6px 0 6px 8px'}));

  var makeRow = function(colPal) {
    var colorBox = ui.Label('', {
        backgroundColor: colPal,
        padding: '8px 21.5px',
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
  continuousLegendPanel.add(ui.Label(minVal, {margin: '-6px 0px 0px 8px'}));
  continuousLegendPanel.add(ui.Label(maxVal, {margin: '-17px 5px 5px ' + maxValPos + 'px', textAlign: 'right'}));
};


var legendPanel = function(controlPanel) {
  controlPanel.add(ui.Label('----------------------------------------------------------------------------------', {margin: '-10px 8px 12px 8px', stretch: 'horizontal'}));
  controlPanel.add(ui.Label('Legends', {fontWeight: 'bold', fontSize: '20px', margin: '-3px 8px 8px 8px'}));

  controlPanel.add(ui.Label('', {margin: '0px 0px 4px 0px'}));
  
  continuousLegend(controlPanel,'Areal BA-AF Discrepancy',
    colPal_RdBu, -1, 1, 'Metric 1: normalized difference', 303);
  continuousLegend(controlPanel,'Cloud/Haze Obscuration',
    colPal_Blues, 0, 1, 'Metric 2: fractional, FRP-weighted', 303);
  continuousLegend(controlPanel,'Burn Size/Fragmentation',
    colPal_Reds, 0, 2, 'Metric 3: km2 / fragment', 303);
  continuousLegend(controlPanel,'Topography Variance',
    colPal_Grays, 0, 1000, 'Metric 4: m2', 278);
  continuousLegend(controlPanel,'VIIRS FRP Outside MODIS Burn Extent',
    colPal_Reds, 0, 1, 'Metric 5: fractional', 303);
};

var emiLegend = function(speciesLabel, units, maxVal, maxValPos) {
  var emiLegendPanel = ui.Panel({
    style: {
      padding: '6px 3px 5px 0px',
      position: 'bottom-right'
    }
  });
  
  var legendTitle = ui.Label('Average Annual Fire Emissions', {fontWeight: 'bold', fontSize: '16px', margin: '0 0 6px 8px'});
  emiLegendPanel.add(legendTitle);
  emiLegendPanel.add(ui.Label(units + ' ' + speciesLabel + '/yr, 2003-2016', {margin: '-6px 0 6px 8px'}));
  
  var colPal = colPal_Spectral;
  
  var makeRow = function(colPal) {
    var colorBox = ui.Label('', {
        backgroundColor: colPal,
        padding: '8px 18px',
        margin: '0 0 4px 0px',
    });
    return ui.Panel({widgets: [colorBox], layout: ui.Panel.Layout.Flow('vertical')});
  };
  
  var colPalWidget = []; var labelWidget = [];
  for (var i = 0; i < colPal.length; i++) {
    colPalWidget[i] = makeRow(colPal[i]);
  }
  
  emiLegendPanel.add(ui.Panel({widgets: colPalWidget, layout: ui.Panel.Layout.Flow('horizontal'),
    style: {margin: '0 0 6px 8px'}}));
  emiLegendPanel.add(ui.Label(0, {margin: '-6px 0px 0px 8px'}));
  emiLegendPanel.add(ui.Label(maxVal, {margin: '-17px 5px 0px ' + maxValPos + 'px', textAlign: 'right'}));
  
  return emiLegendPanel;
};

// -----------
// Plot Panel
// -----------
var plotPanelLabel = ui.Label('Regional Emissions', {fontWeight: 'bold', fontSize: '20px', margin: '12px 8px 8px 18px'});

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
var plotPanelParent = ui.Panel([plotPanelLabel, plotPanel], null, {width: '450px'});

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
legendPanel(controlPanel);
ui.root.clear(); ui.root.add(controlPanel);
ui.root.add(map); ui.root.add(plotPanelParent);

// Run calculations, linked to submit button
submitButton.onClick(function() {
  
  // Input Parameters:
  var region = getRegions(regionSelectPanel);
  var species = getRegions(speciesSelectPanel);
  
  var basisID = basisCodes.indexOf(regionNames.indexOf(region)) + 1;
  var regionShp = getRegionShp(basisID);

  var speciesIdx = bandNames.indexOf(species);
  var maxVal = bandMaxVal.get(speciesIdx).getInfo();
  var maxPos = bandMaxPos.get(speciesIdx).getInfo();
  var speciesLabel = bandLabel.get(speciesIdx).getInfo();
  var unitsLabel = bandUnits.get(speciesIdx).getInfo();
  var spBandName = ee.List(bandNames).get(speciesIdx).getInfo();
  var vizParams = {palette: colPal_Spectral, min: 0, max: maxVal};
  
  var emiByMonth = getEmiByMonth(species);
  var emiByYr = getEmiByYr(emiByMonth);
  
  var emiByYrMean = ee.Image([projFolder + 'GFEIyrMean_sp/GFEIyrMean_' + spBandName])
    .multiply(bandMulti.select(species))
    .clip(basisRegions).reproject({crs: 'EPSG:4326', crsTransform: [0.5,0,-180,0,-0.5,90]});
 
  // Display Maps:
  map.clear(); map.centerObject(regionShp);
  map.addLayer(RFCM1.multiply(1e3), {palette: colPal_RdBu, min: -1e3, max: 1e3}, 'Metric 1: Areal BA-AF Discrepancy', false);
  map.addLayer(RFCM2.multiply(1e3), {palette: colPal_Blues, min: 0, max: 1e3}, 'Metric 2: Cloud/Haze Obscuration', false);
  map.addLayer(RFCM3.multiply(1e3), {palette: colPal_Reds, min: 0, max: 2e3}, 'Metric 3: Burn Size/Fragmentation', false);
  map.addLayer(RFCM4, {palette: colPal_Grays, min: 0, max: 1e3}, 'Metric 4: Topography Variance', false);
  map.addLayer(RFCM5.multiply(1e3), {palette: colPal_Reds, min: 0, max: 1e3}, 'Metric 5: VIIRS FRP Outside MODIS Burn Extent', false);

  map.addLayer(emiByYrMean.select('FEERv1p0_G1p2').selfMask(), vizParams, 'FEERv1.0-G1.2', false);
  map.addLayer(emiByYrMean.select('QFEDv2p5r1').selfMask(), vizParams, 'QFEDv2.5r1', false);
  map.addLayer(emiByYrMean.select('GFASv1p2').selfMask(), vizParams, 'GFASv1.2', false);
  map.addLayer(emiByYrMean.select('FINNv1p5').selfMask(), vizParams, 'FINNv1.5', false);
  map.addLayer(emiByYrMean.select('GFEDv4s').selfMask(), vizParams, 'GFEDv4s');
  
  map.addLayer(ee.Image().byte().rename('Selected Basis Region')
    .paint(ee.FeatureCollection(regionShp), 0, 2), {palette: '#000000'}, 'Selected Region');
    
  map.add(emiLegend(speciesLabel, unitsLabel, maxVal, maxPos));
  
  // Display Charts:
  plotPanel = plotPanel.clear();
  plotEmiTS(plotPanel, emiByYr, regionShp, species, 'Annual');
  plotEmiTS(plotPanel, emiByMonth, regionShp, species, 'Monthly');
});
