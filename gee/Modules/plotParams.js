// ===============
// || UI Panels ||
// ===============
// ------------
// Info Panel
// ------------
exports.infoPanel = function() {
  var FIRECAMLabelShort = ui.Label('FIRECAM Online Tool', {margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
  var FIRECAMLabelLong = ui.Label('Fire Inventories: Regional Evaluation, Comparison, and Metrics', {margin: '8px 30px 0px 8px', fontSize: '16px'});
  var githubRepoLabel = ui.Label('Documentation: github.com/tianjialiu/FIRECAM', {margin: '8px 8px 5px 8px', fontSize: '13px'});
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});
  
  return ui.Panel([
      FIRECAMLabelShort, FIRECAMLabelLong, githubRepoLabel, inputParamsLabel,
    ]);
};

// ------------
// Year Panel
// ------------
exports.yearSelectPanel = function() {
  var timeRangeLabel = ui.Label('1) Select Time Range:', {margin: '8px 8px 8px 8px', fontSize: '14.5px'});
  var startYearLabel = ui.Label('Start Year:', {margin: '8px 20px 8px 20px', fontSize: '14.5px'});
  var startYearSlider = ui.Slider({min: 2003, max: 2016, value: 2005, step: 1});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '8px 20px 8px 20px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: 2003, max: 2016, value: 2015, step: 1, style: {margin: '8px 8px 8px 14px'}});
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
      ui.Panel([startYearLabel, startYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}), //
      ui.Panel([endYearLabel, endYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    ]);
};

exports.getYears = function(yearSelectPanel) {
  return {
    startYear:yearSelectPanel.widgets().get(1).widgets().get(1).getValue(),
    endYear:yearSelectPanel.widgets().get(2).widgets().get(1).getValue()
  };
};

// -----------------
// Region Panel
// -----------------
exports.regionSelectPanel = function(regionNames) {
  var regionLabel = ui.Label('2) Select Region:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var regionSelect = ui.Select({items: regionNames.sort(), value: 'EQAS - Equatorial Asia', style: {stretch: 'horizontal'}});
  return ui.Panel([regionLabel, regionSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

exports.getRegions = function(regionSelectPanel) {
  return regionSelectPanel.widgets().get(1).getValue();
};

// -----------------
// Species Panel
// -----------------
exports.speciesSelectPanel = function() {
  var speciesLabel = ui.Label('3) Select Species:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
  var speciesList = ['CO','CO2','CH4','OC','BC','PM2.5'];
  var speciesSelect = ui.Select({items: speciesList, value: 'CO2', style: {stretch: 'horizontal'}});
  return ui.Panel([speciesLabel, speciesSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

exports.getSpecies = function(speciesSelectPanel) {
  return speciesSelectPanel.widgets().get(1).getValue();
};

// -----------------
// Submit Button
// -----------------
exports.submitButton = function() {
  return ui.Button({label: 'Submit',  style: {stretch: 'horizontal'}});
};

// --------
// Legends
// --------
var colPal_RdBu = ['#2166AC','#67A9CF','#D1E5F0','#F7F7F7','#FDDBC7','#EF8A62','#B2182B'];
var colPal_Blues = ['#EFF3FF','#C6DBEF','#9ECAE1','#6BAED6','#4292C6','#2171B5','#084594'];
var colPal_Reds = ['#FEE5D9','#FCBBA1','#FC9272','#FB6A4A','#EF3B2C','#CB181D','#99000D'];
var colPal_Grays = ['#F7F7F7','#D9D9D9','#BDBDBD','#969696','#737373','#525252','#252525'];
var colPal_Spectral = ['#3288BD','#99D594','#E6F598','#FFFFBF','#FEE08B','#FC8D59','#D53E4F'];
  
exports.colPal_RdBu = colPal_RdBu;
exports.colPal_Blues = colPal_Blues;
exports.colPal_Reds = colPal_Reds;
exports.colPal_Grays = colPal_Grays;
exports.colPal_Spectral = colPal_Spectral;

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

exports.legendPanel = function(controlPanel) {
  controlPanel.add(ui.Label('----------------------------------------------------------------------------------', {margin: '-5px 8px 12px 8px', stretch: 'horizontal'}));
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

exports.emiLegend = function(speciesLabel, units, maxVal, maxValPos) {
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

exports.lulc_colPal = ['#000000','#05450A','#92AF1F','#6A2424','#D99125','#F7E174','#FF0000'];

exports.lulcLegend = function(colPal) {
  colPal[7] = '#800080';
  var labels = ['Boreal Forest','Tropical Forest','Temperate Forest',
    'Woody Savanna/Shrubland','Savanna/Grassland','Cropland','Urban/Built-Up','Peatland'];
  
  var lulcLegendPanel = ui.Panel({
    style: {
      padding: '2px 9px 8px 9px',
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
  
  return lulcLegendPanel;
};

// -----------
// Plot Panel
// -----------
exports.plotPanelLabel = ui.Label('Regional Emissions', {fontWeight: 'bold', fontSize: '20px', margin: '12px 8px 8px 18px'});
