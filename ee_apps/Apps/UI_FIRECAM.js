// *****************************************************************
// =================================================================
// ---------------- Instructions for FIRECAM Tool --------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// Author: Tianjia Liu
// Last updated: June 1, 2019

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
var projFolder = 'projects/GlobalFires/';

var sYear_abs = 2003; var eYear_abs = 2016;

var invNames = ['GFEDv4s','FINNv1p5','GFASv1p2','QFEDv2p5r1','FEERv1p0_G1p2'];
var bandNames = ['CO','CO2','CH4','OC','BC','PM2p5'];

var speciesNames = ['CO - Carbon Monoxide', 'CO2 - Carbon Dioxide',
  'CH4 - Methane', 'OC - Organic Carbon', 'BC - Black Carbon',
  'PM2.5 - Particulate Matter <2.5 um'];
  
var speciesList = {
  'CO - Carbon Monoxide': 'CO',
  'CO2 - Carbon Dioxide': 'CO2',
  'CH4 - Methane': 'CH4',
  'OC - Organic Carbon': 'OC',
  'BC - Black Carbon': 'BC',
  'PM2.5 - Particulate Matter <2.5 um': 'PM2.5'
};

var bandNamesList = {
  'CO': 'CO',
  'CO2': 'CO2',
  'CH4': 'CH4',
  'OC': 'OC',
  'BC': 'BC',
  'PM2.5': 'PM2p5'
};

var bandMaxValList = {
  'CO': 100,
  'CO2': 2000,
  'CH4': 2000,
  'OC': 3000,
  'BC': 500,
  'PM2.5': 5000
};

var bandUnitsList = {
  'CO': 'Gg',
  'CO2': 'Gg',
  'CH4': 'Mg',
  'OC': 'Mg',
  'BC': 'Mg',
  'PM2.5': 'Mg'
};

var bandMulti = {
  'CO': 1e3,
  'CO2': 1e3,
  'CH4': 1e6,
  'OC': 1e6,
  'BC': 1e6,
  'PM2.5': 1e6
};

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

// Countries/ Sub-regions (those with neglible emissions were excluded)
var countryNames = ['Afghanistan', 'Albania', 'Algeria',
  'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 
  'Austria', 'Azerbaijan', 'Bangladesh', 'Bahamas',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia & Herzegovina', 'Botswana', 'Brazil', 
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Myanmar (Burma)', 'Burundi',
  'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
  'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Costa Rica', 'Cote d\'Ivoire', 'Croatia', 'Cuba', 'Cyprus',
  'Czechia', 'Democratic Republic of the Congo', 'Denmark',
  'Djibouti', 'Dominican Republic', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia',
  'Falkland Islands', 'Finland', 'France', 'French Guiana',
  'Gabon', 'Gambia', 'Gaza Strip', 'Georgia', 'Germany', 'Ghana',
  'Gibraltar', 'Greece', 'Grenada', 'Guadeloupe', 'Guatemala',
  'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'North Korea', 'South Korea', 'Kosovo',
  'Kuwait', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Lithuania', 'Macedonia', 'Madagasgar', 'Malawi',
  'Malaysia', 'Mali', 'Martinique', 'Mauritania', 'Mexico',
  'Moldova', 'Mongolia', 'Montenegro', 'Montserrat', 'Morocco',
  'Mozambique', 'Namibia', 'Nepal', 'Netherlands', 'New Caledonia',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Norway',
  'Oman', 'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay',
  'Peru', 'Philippines', 'Poland', 'Portugual', 'Puerto Rico',
  'Qatar', 'Republic of the Congo', 'Romania', 'Russia', 'Rwanda',
  'Saint Lucia', 'Sao Tome & Principe', 'Saudi Arabia', 'Senegal',
  'Sierra Leone', 'Serbia', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
  'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Trinidad & Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'United States (Alaska)',
  'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Vanuatu',
  'West Bank', 'Western Sahara', 'Yemen', 'Zambia', 'Zimbabwe'
];

// dictionary to rename countries
var countryList = {
  'Bahamas': 'Bahamas, The',
  'Myanmar (Burma)': 'Burma',
  'Central African Republic': 'Central African Rep',
  'Democratic Republic of the Congo': 'Dem Rep of the Congo',
  'Denmark': 'Denmark',
  'Gambia': 'Gambia, The', 
  'North Korea': 'Korea, North',
  'South Korea': 'Korea, South',
  'Rep of the Congo': 'Rep of the Congo',
  'Solomon Islands': 'Solomon Is',
};

// ---------------------------------
// - - - - - - FIRECAM - - - - - - |
// ---------------------------------
// ----------------------------------
// Relative Fire Confidence Metrics
// ----------------------------------
// Metric 1: areal BA-AF discrepancy
var RFCM1 = ee.Image([projFolder + 'RelFireConfidence/RFCM1_BA_AFA_discrepancy']);
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

var crs = 'EPSG:4326';
var crsTrans = [0.5,0,-180,0,-0.5,90];

var aggProj = gfedv4s.first()
  .reproject({crs: crs, crsTransform: crsTrans})
  .projection();

var getBand = function(imageList, iMonth, species) {
  var image = ee.Image(imageList.get(iMonth));

  return ee.Image(image.select('.*_0-5deg').divide(1e9)
    .rename(bandNames).select(species)
    .reproject({crs: aggProj, scale: aggProj.nominalScale()})
    .copyProperties(image,['system:time_start']));
};

var getEmiByMonth = function(species, sYear, eYear) {
  
  var nMonth = (eYear-sYear+1)*12-1;
  var filterAllYrs = ee.Filter.calendarRange(sYear,eYear,'year');
  
  var gfedList = gfedv4s.filter(filterAllYrs).toList(500,0);
  var finnList = finnv1p5.filter(filterAllYrs).toList(500,0);
  var gfasList = gfasv1p2.filter(filterAllYrs).toList(500,0);
  var qfedList = qfedv2p5.filter(filterAllYrs).toList(500,0);
  var feerList = feerv1p0_g1p2.filter(filterAllYrs).toList(500,0);
  
  var emiByMonth = ee.List.sequence(0,nMonth,1).map(function(iMonth) {
    var gfed = getBand(gfedList,iMonth,species);
    var finn = getBand(finnList,iMonth,species);
    var gfas = getBand(gfasList,iMonth,species);
    var qfed = getBand(qfedList,iMonth,species);
    var feer = getBand(feerList,iMonth,species);
  
    var emiAll = gfed.addBands(finn).addBands(gfas).addBands(qfed).addBands(feer)
      .rename(invNames).reproject({crs: aggProj, scale: aggProj.nominalScale()})
      .copyProperties(gfed,['system:time_start']);
    
    return emiAll;
  });
  
  return ee.ImageCollection(emiByMonth);
};
  
var getEmiByYr = function(emiByMonth, sYear, eYear) {

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

var globalShp = basisRegions.geometry().bounds();

var getCountryShp = function(region) {
  return ee.Image(1).clip(ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
    .filter(ee.Filter.eq('country_na',region)))
    .reproject({crs: crs, crsTransform: crsTrans}).gt(0)
    .reduceToVectors({geometry: basisRegions.union()});
};

var getGridShp = function(region) {
  return ee.Image(1).clip(region)
    .reproject({crs: crs, crsTransform: crsTrans}).gt(0)
    .reduceToVectors({geometry: basisRegions.union()});
};

var colPal = {
  0: {color: '777777'},
  1: {color: '87CEEB'},
  2: {color: 'FF0000'},
  3: {color: 'FDB751'},
  4: {color: '800080'},
};
      
var plotEmiTS = function(plotPanel, imageCol, regionShp,
  speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth, nLines) {
  
  return ui.Chart.image.series({
    imageCollection: imageCol.select(invNames,['b1','b2','b3','b4','b5']),
    region: regionShp,
    reducer: ee.Reducer.sum().unweighted(),
    scale: aggProj.nominalScale(),
    xProperty: 'system:time_start',
  }).setChartType('LineChart')
    .setSeriesNames(['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1.0-G1.2'])
    .setOptions({
      title: timePeriod + ' Fire Emissions',
      vAxis: {title: 'Emissions (Tg ' + speciesLabel + ')'},
      hAxis: {
        format: dateFormat, 
        viewWindowMode:'explicit',
        viewWindow: {
          min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
          max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
        },
        gridlines: {count: nLines}
      },
      height: '230px',
      series: colPal
    });
};

var updateOpts = function(emiTS, speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth, nLines) {
  
  return emiTS.setOptions({
      title: timePeriod + ' Fire Emissions',
      vAxis: {title: 'Emissions (Tg ' + speciesLabel + ')'},
      hAxis: {
        format: dateFormat, 
        viewWindowMode:'explicit',
        viewWindow: {
          min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
          max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
        },
        gridlines: {count: nLines}
      },
      height: '230px',
      series: colPal
    });
};

var plotEmiBar = function(plotPanel, imageCol, regionShp,
  speciesLabel, timePeriod) {
  
  var ts_chart = ui.Chart.image.series({
    imageCollection: imageCol
      .select(invNames,['b1','b2','b3','b4','b5'])
      .set('xName','Average, ' + sYear_abs + '-' + eYear_abs),
    region: regionShp,
    reducer: ee.Reducer.sum().unweighted(),
    scale: aggProj.nominalScale(),
    xProperty: 'xName',
  }).setChartType('ColumnChart')
  .setSeriesNames(['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1.0-G1.2'])
    .setOptions({
      title: 'Average ' + timePeriod + ' Fire Emissions (' + sYear_abs + '-' + eYear_abs + ')',
      vAxis: {title: 'Emissions (Tg ' + speciesLabel + ')'},
      hAxis: {gridlines: {count: 0}},
      height: '230px',
      series: colPal
    });
    
  return ts_chart;
};

// ------------------------------
// - - - - - - LULC - - - - - - |
// ------------------------------
// ------------------------------
// MODIS MCD12Q1 aggregated LULC
// based on FINNv1.0 delineation
// ------------------------------
/*
1: Evergreen Needleleaf Forests (BOR)
2: Evergreen Broadleaf Forests (TROP)
3: Deciduous Needleleaf Forests (BOR)
4: Deciduous Broadleaf Forests (TEMP)
5: Mixed Forests (TEMP)
6: Closed Shrublands (WS)
7: Open Shrublands (WS)
8: Woody Savannas (WS)
9: Savannas (SG)
10: Grasslands (SG)
11: Permanent Wetlands (SG)
12: Croplands (CROP)
13: Urban and Built-up Lands
14: Cropland/Natural Vegetation Mosaics (SG)
15: Permanent Snow and Ice
16: Barren (SG)
17: Water Bodies
*/

var getLULCmap = function(mapYr) {
  var mcd12q1Yr = ee.Image(ee.ImageCollection('MODIS/006/MCD12Q1')
    .filter(ee.Filter.calendarRange(mapYr,mapYr,'year')).first())
    .select('LC_Type1');

  var BOR = mcd12q1Yr.eq(1).add(mcd12q1Yr.eq(3)).gt(0);
  var TROP = mcd12q1Yr.eq(2).multiply(2);
  var TEMP = mcd12q1Yr.eq(4).add(mcd12q1Yr.eq(5)).gt(0).multiply(3);
  var WS = mcd12q1Yr.eq(6).add(mcd12q1Yr.eq(7)).add(mcd12q1Yr.eq(8))
    .gt(0).multiply(4);
  var SG = mcd12q1Yr.eq(9).add(mcd12q1Yr.eq(10)).add(mcd12q1Yr.eq(11))
    .add(mcd12q1Yr.eq(14)).add(mcd12q1Yr.eq(16)).gt(0).multiply(5);
  var CROP = mcd12q1Yr.eq(12).multiply(6);
  var URBAN = mcd12q1Yr.eq(13).multiply(7);
  
  return BOR.add(TROP).add(TEMP).add(WS).add(SG)
    .add(CROP).add(URBAN).selfMask();
};

// -----------------------------------
// Peatland distribution from GFEDv4s
// -----------------------------------
var peat = ee.Image(projFolder + 'GFEDv4s_peatCfrac');

// -------------------------------------
// - - - - - - Plot Params - - - - - - |
// -------------------------------------
// ------------
// Info Panel
// ------------
var infoPanel = function() {
  var FIRECAMLabelShort = ui.Label('FIRECAM Online Tool', {margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
  var FIRECAMLabelLong = ui.Label('Fire Inventories: Regional Evaluation, Comparison, and Metrics', {margin: '8px 30px 0px 8px', fontSize: '16px'});
  var githubRepoLabel = ui.Label('Documentation: github.com/tianjialiu/FIRECAM', {margin: '8px 8px 3px 8px', fontSize: '13px'}, 'https://github.com/tianjialiu/FIRECAM');
  var citationLabel = ui.Label('Citation: Liu et al. (in review) | [EarthArXiv]', {margin: '0px 8px 5px 8px', fontSize: '13px'}, 'https://eartharxiv.org/nh57j/');
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 8px', fontWeight: 'bold', fontSize: '20px'});
  
  return ui.Panel([
      FIRECAMLabelShort, FIRECAMLabelLong, githubRepoLabel, citationLabel, inputParamsLabel,
    ]);
};

// -----------
// Year Panel
// -----------
var yearSelectPanel = function() {
  var timeRangeLabel = ui.Label('1) Select Time Range:', {margin: '8px 8px 8px 12px', fontSize: '14.5px'});
  var startYearLabel = ui.Label('Start Year:', {margin: '3px 20px 8px 24px', fontSize: '14.5px'});
  var startYearSlider = ui.Slider({min: sYear_abs, max: eYear_abs, value: 2005, step: 1, style: {margin: '3px 8px 8px 14px'}});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '5px 20px 8px 24px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: sYear_abs, max: eYear_abs, value: 2015, step: 1, style: {margin: '5px 8px 8px 14px'}});
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

var getYears = function(yearSelectPanel) {
  return {
    startYear:yearSelectPanel.widgets().get(1).widgets().get(1).getValue(),
    endYear:yearSelectPanel.widgets().get(2).widgets().get(1).getValue()
  };
};

// -----------------
// Region Panel
// -----------------
var regionTypeSelectPanel = function(map) {
  var regionLabel = ui.Label('2) Select Bounds Type:', {padding: '5px 0px 0px 4px', fontSize: '14.5px'});
  var regionTypeSelect = ui.Select({items: ['Global', 'Basis Region', 'Country/ Sub-Region', 'Pixel', 'Custom'],
    value: 'Basis Region', style: {stretch: 'horizontal'},
    onChange: function(selected) {
      regionSelectPanel.clear();
      if (selected == 'Global') {}
      if (selected == 'Basis Region') {setRegionList(regionNames, 'EQAS - Equatorial Asia')}
      if (selected == 'Country/ Sub-Region') {setRegionList(countryNames, 'Indonesia')}
      if (selected == 'Pixel') {setCoords(map)}
      if (selected == 'Custom') {setBounds(map)}
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
  var regionLabel = ui.Label('Select Region:', {padding: '5px 0px 0px 20px', fontSize: '14.5px'});
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
  
  var lonBox = ui.Textbox({value: 111.25});
  lonBox.style().set('stretch', 'horizontal');
  var latBox = ui.Textbox({value: -2.75});
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
    var cursorBounds = ee.String('Print lon/lat coordinates of cursor: [' +
      ee.Number(coords.lon).format('%.2f').getInfo() +
      ', ' + ee.Number(coords.lat).format('%.2f').getInfo() + ']').getInfo();
    regionSelectPanel.widgets().get(0).widgets().get(2).setValue(cursorBounds);
  });
  
  return regionSelectPanel.add(boundsPanel);
};

var getBounds = function(regionSelectPanel) {
  var bounds = regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(0).getValue();
  
  return ee.Geometry.Polygon(ee.String(bounds).decodeJSON(),'EPSG:4326',false);
};

// -----------------
// Species Panel
// -----------------
var speciesSelectPanel = function() {
  var speciesLabel = ui.Label('3) Select Species:', {padding: '5px 0px 0px 4px', fontSize: '14.5px'});
  var speciesSelect = ui.Select({items: speciesNames, value: 'CO2 - Carbon Dioxide', style: {stretch: 'horizontal'}});
  return ui.Panel([speciesLabel, speciesSelect], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'});
};

var getSpecies = function(speciesSelectPanel) {
  return speciesSelectPanel.widgets().get(1).getValue();
};

// -----------------
// Submit Button
// -----------------
var submitButton = ui.Button({label: 'Submit',  style: {stretch: 'horizontal'}});

// --------
// Legends
// --------
// RColorBrewer and RCartoColor color palettes
var colPal_RdBu = ['#2166AC','#67A9CF','#D1E5F0','#F7F7F7','#FDDBC7','#EF8A62','#B2182B'];
var colPal_Blues = ['#FFFFFF','#EFF3FF','#C6DBEF','#9ECAE1','#6BAED6','#4292C6','#2171B5','#084594'];
var colPal_Reds = ['#FEE5D9','#FCBBA1','#FC9272','#FB6A4A','#EF3B2C','#CB181D','#99000D'];
var colPal_OrRed = ['#FFFFFF','#FEF0D9','#FDD49E','#FDBB84','#FC8D59','#EF6548','#D7301F','#990000'];
var colPal_Grays = ['#F7F7F7','#D9D9D9','#BDBDBD','#969696','#737373','#525252','#252525'];
var colPal_Spectral = ['#3288BD','#99D594','#E6F598','#FFFFBF','#FEE08B','#FC8D59','#D53E4F'];
var colPal_Sunset = ['#F3E79B','#FAC484','#F8A07E','#EB7f86','#CE6693','#A059A0','#5C53A5'];

var continuousLegend = function(controlPanel, title, colPal, minVal, maxVal, units) {
  var continuousLegendPanel = ui.Panel({
    style: {
      padding: '0px 8px 5px 8px'
    }
  });
  
  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '16px', margin: '0 0 6px 8px'});
  var unitsLabel = ui.Label(units, {margin: '-6px 0 6px 8px'});

  var vis = {min: minVal, max: maxVal, palette: colPal};

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
      ui.Label('', {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'})
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
  
  controlPanel.add(continuousLegendPanel);
  continuousLegendPanel.add(legendTitle).add(unitsLabel).add(colorBar).add(legendLabels);
};


var legendPanel = function(controlPanel) {
  controlPanel.add(ui.Label('Legends', {fontWeight: 'bold', fontSize: '20px', margin: '10px 8px 8px 16px'}));
  controlPanel.add(ui.Label('', {margin: '0px 0px 4px 0px'}));
  
  continuousLegend(controlPanel,'BA-AFA Discrepancy',
    colPal_RdBu, -1, 1, 'Metric 1: normalized difference');
  continuousLegend(controlPanel,'Cloud/Haze Obscuration',
    colPal_Blues, 0, 1, 'Metric 2: fractional, FRP-weighted');
  continuousLegend(controlPanel,'Burn Size/Fragmentation',
    colPal_OrRed, 0, 2, 'Metric 3: sq. km / fragment');
  continuousLegend(controlPanel,'Topography Variance',
    colPal_Grays, 0, 1000, 'Metric 4: sq. m');
  continuousLegend(controlPanel,'VIIRS FRP Outside MODIS Burn Extent',
    colPal_Sunset, 0, 1, 'Metric 5: fractional');
};

var emiLegend = function(speciesLabel, units, maxVal) {
  
  var emiLegendPanel = ui.Panel({
    style: {
      padding: '3px 10.5px 3px 3px',
      position: 'bottom-right'
    }
  });
  
  var legendTitle = ui.Label('Average Annual Fire Emissions',
    {fontWeight: 'bold', fontSize: '16px', margin: '5px 0 6px 8px'});

  var legendSubtitle = ui.Label(units + ' ' + speciesLabel + '/yr (' + sYear_abs + '-' + eYear_abs + ')',
    {margin: '-6px 0 6px 8px'});

  var vis = {min: 0, max: maxVal, palette: colPal_Spectral};

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
      ui.Label('', {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'})
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });
  
  emiLegendPanel.add(legendTitle).add(legendSubtitle).add(colorBar).add(legendLabels);
  
  return emiLegendPanel;
};

var lulc_colPal = ['#000000','#05450A','#92AF1F','#6A2424','#D99125','#F7E174','#FF0000'];
var lulcPeat_colPal = ['#000000','#05450A','#92AF1F','#6A2424','#D99125','#F7E174','#FF0000','#800080'];

var lulcLegend = function(controlPanel, colPal) {
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
  
  controlPanel.add(lulcLegendPanel);
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
  style: {width: '345px'}
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
var yearSelectPanel = yearSelectPanel();
var regionTypeSelectPanel = regionTypeSelectPanel(map);
var regionSelectPanel = ui.Panel();
setRegionList(regionNames, 'EQAS - Equatorial Asia');
var speciesSelectPanel = speciesSelectPanel();

// Display Panels
controlPanel.add(infoPanel).add(yearSelectPanel)
  .add(regionTypeSelectPanel).add(regionSelectPanel)
  .add(speciesSelectPanel).add(submitButton);
legendPanel(controlPanel);
lulcLegend(controlPanel,lulcPeat_colPal);
ui.root.clear(); ui.root.add(controlPanel);
ui.root.add(map); ui.root.add(plotPanelParent);

// Run calculations, linked to submit button
submitButton.onClick(function() {
  
  // Input Parameters:
  var sYear = getYears(yearSelectPanel).startYear;
  var eYear = getYears(yearSelectPanel).endYear;
  
  var regionType = getRegionType(regionTypeSelectPanel);
  var regionShp = [];
  
  var speciesLong = getSpecies(speciesSelectPanel);
  var species = speciesList[speciesLong];
  
  var spBandName = bandNamesList[species];
  var maxVal = bandMaxValList[species];
  var speciesLabel = species;
  var unitsLabel = bandUnitsList[species];
  
  var vizParams = {palette: colPal_Spectral, min: 0, max: maxVal};
  
  var emiByMonth = getEmiByMonth(species, sYear, eYear);
  var emiByYr = getEmiByYr(emiByMonth, sYear, eYear);
  
  var emiByYrMean = ee.Image([projFolder + 'GFEIyrMean_sp/GFEIyrMean_' + spBandName])
    .clip(basisRegions).reproject({crs: crs, crsTransform: crsTrans});
  var emiByYrMeanAdj = emiByYrMean.multiply(bandMulti[species]);
  
  var mapYr = ee.Number((sYear + eYear)/2).round();
  var lulcMapYr = getLULCmap(mapYr);
  
  // Display Maps:
  map.clear();
  map.add(emiLegend(speciesLabel, unitsLabel, maxVal));
  
  map.addLayer(ee.Image(1).clip(basisRegions).rename('Basis Regions'),
    {palette: '#000000', opacity: 0.8}, 'Basis Regions');
    
  map.addLayer(lulcMapYr, {palette: lulc_colPal, min: 1, max: 7}, 'Land Use/ Land Cover ' + mapYr.getInfo(), false);
  map.addLayer(peat.gt(0).selfMask(), {palette: ['#800080']}, 'Peatlands', false);
  
  map.addLayer(RFCM5.multiply(1e3), {palette: colPal_Sunset, min: 0, max: 1e3}, 'Metric 5: VIIRS FRP Outside MODIS Burn Extent', false);
  map.addLayer(RFCM4, {palette: colPal_Grays, min: 0, max: 1e3}, 'Metric 4: Topography Variance', false);
  map.addLayer(RFCM3.multiply(1e3), {palette: colPal_OrRed, min: 0, max: 2e3}, 'Metric 3: Burn Size/Fragmentation', false);
  map.addLayer(RFCM2.multiply(1e3), {palette: colPal_Blues, min: 0, max: 1e3}, 'Metric 2: Cloud/Haze Obscuration', false);
  map.addLayer(RFCM1.multiply(1e3), {palette: colPal_RdBu, min: -1e3, max: 1e3}, 'Metric 1: Areal BA-AF Discrepancy', false);
  
  map.addLayer(emiByYrMeanAdj.select('FEERv1p0_G1p2').selfMask(), vizParams, 'FEERv1.0-G1.2', false);
  map.addLayer(emiByYrMeanAdj.select('QFEDv2p5r1').selfMask(), vizParams, 'QFEDv2.5r1', false);
  map.addLayer(emiByYrMeanAdj.select('GFASv1p2').selfMask(), vizParams, 'GFASv1.2', false);
  map.addLayer(emiByYrMeanAdj.select('FINNv1p5').selfMask(), vizParams, 'FINNv1.5', false);
  map.addLayer(emiByYrMeanAdj.select('GFEDv4s').selfMask(), vizParams, 'GFEDv4s');
  
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
      var cursorBounds = ee.String('Print lon/lat coordinates of cursor: [' +
        ee.Number(coords.lon).format('%.2f').getInfo() +
        ', ' + ee.Number(coords.lat).format('%.2f').getInfo() + ']').getInfo();
      regionSelectPanel.widgets().get(0).widgets().get(2).setValue(cursorBounds);
    });
    regionShp = getGridShp(getBounds(regionSelectPanel));
    
    map.centerObject(regionShp);
    map.addLayer(ee.Image().byte().rename('Selected Region')
      .paint(ee.FeatureCollection(regionShp), 0, 1), {palette: '#FF0000'}, 'Selected Region');
  }

  if (regionType == 'Global') {
    regionShp = globalShp;
    map.setCenter(0,0,1);
  }
  
  // Display Charts:
  plotPanel = plotPanel.clear();
  
  var totalChart = plotEmiBar(plotPanel, emiByYrMean, regionShp, species, 'Annual');
  plotPanel.add(totalChart); plotPanel.add(ui.Label('', {margin: '-28px 8px 8px'}));
  
  var annualChart = plotEmiTS(plotPanel, emiByYr, regionShp,
    species, 'Annual', 'Y', sYear, eYear, 1, 1, null);
  
  if (eYear-sYear <= 5) {
    var nYear = eYear-sYear+1;
    annualChart = updateOpts(annualChart, species, 'Annual', 'Y', (sYear-1), eYear, 12, 2, nYear);
    annualChart.setChartType('ScatterChart');
  }
  
  plotPanel.add(annualChart); plotPanel.add(ui.Label('', {margin: '-25px 8px 8px'}));
  
  var monthlyChart = plotEmiTS(plotPanel, emiByMonth, regionShp,
    species, 'Monthly', 'MMM Y', sYear, eYear, 1, 12, null);
  if (regionType != 'Global' | eYear-sYear === 0) {
    plotPanel.add(monthlyChart);
  }
});
