// *****************************************************************
// =================================================================
// ---------------- Instructions for FIRECAM Tool --------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// Author: Tianjia Liu
// Last updated: July 21, 2019

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

var regionNamesAbbrev = ['BONA','TENA','CEAM','NHSA','SHSA','EURO',
  'MIDE','NHAF','SHAF','BOAS','CEAS','SEAS','EQAS','AUST'];
  
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
  'Libya', 'Lithuania', 'Macedonia', 'Madagascar', 'Malawi',
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

var getCountryShp = function(region) {
  return ee.Image(1).clip(ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
    .filter(ee.Filter.eq('country_na',region)))
    .reproject({crs: crs, crsTransform: crsTrans}).gt(0)
    .reduceToVectors({geometry: basisRegions.union()});
};

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
  var startYearSlider = ui.Slider({min: sYear_abs, max: eYear_abs, value: 2003, step: 1, style: {margin: '3px 8px 8px 14px'}});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '3px 20px 8px 24px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: sYear_abs, max: eYear_abs, value: 2016, step: 1, style: {margin: '3px 8px 8px 14px'}});
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
  var regionTypeSelect = ui.Select({items: ['Basis Region','Country/ Sub-Region', 'Pixel'],
    value: 'Basis Region', style: {stretch: 'horizontal'},
    onChange: function(selected) {
      if (selected == 'Basis Region') {setRegionList(regionNames, 'EQAS - Equatorial Asia')}
      if (selected == 'Country/ Sub-Region') {setRegionList(countryNames, 'Indonesia')}
      if (selected == 'Pixel') {setCoords(map)}
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
  regionSelectPanel.clear();
  
  var regionLabel = ui.Label('Select Region:', {padding: '5px 0px 0px 20px', fontSize: '14.5px'});
  var regionSelect = ui.Select({items: shpNames.sort(), value: defaultName, style: {stretch: 'horizontal'}});
  
  return regionSelectPanel.add(
    ui.Panel([regionLabel, regionSelect], ui.Panel.Layout.Flow('horizontal'),
      {stretch: 'horizontal', margin: '-8px 0px 0px 0px'}));
};

var setCoords = function(map) {
  regionSelectPanel.clear();
  
  var coordsLabel = ui.Label('Enter lat/lon below or click on map to update coordinates',
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

var getCoordsName = function(regionSelectPanel) {

  var lon = parseFloat(regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(1).getValue());
  var lat = parseFloat(regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(3).getValue());
  
  lon = ee.Number(lon).multiply(10).round().divide(10);
  lat = ee.Number(lat).multiply(10).round().divide(10);
  
  var lonDirection = 'E'; var latDirection = 'N';
  if (lon < 0) {lonDirection = 'W'}
  if (lon < 0) {lonDirection = 'S'}
  
  return lon.abs().getInfo() + lonDirection + '_' + lat.abs().getInfo() + latDirection;
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
var waitMessage = ui.Label(' *** See "Tasks" to start exports *** ', {margin: '-4px 8px 12px 8px', fontSize: '12.5px', textAlign: 'center', stretch: 'horizontal'});

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '345px'}
});

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
  .add(speciesSelectPanel).add(submitButton).add(waitMessage);
ui.root.clear(); ui.root.add(controlPanel);
ui.root.add(map);

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

  map.addLayer(ee.Image(1).clip(basisRegions).rename('Basis Regions'),
    {palette: '#000000', opacity: 0.8}, 'Basis Regions');
    
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
      regionName =  ee.String(region).replace(' ','_').replace('\'','')
        .replace('&','_').replace('-','_').getInfo();
    }
    map.centerObject(regionShp);
    
    map.addLayer(ee.Image().byte().rename('Selected Region')
    .paint(ee.FeatureCollection(regionShp), 0, 1), {palette: '#FF0000'}, 'Selected Region');
  }
  
  if (regionType == 'Pixel') {
    map.onClick(function(coords) {
      regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(1).setValue(coords.lon);
      regionSelectPanel.widgets().get(0).widgets().get(1).widgets().get(3).setValue(coords.lat);
    });
    
    regionShp = getCoords(regionSelectPanel);
    regionName = getCoordsName(regionSelectPanel);
    
    map.centerObject(regionShp, 6);
    
    map.addLayer(regionShp, {}, 'Selected Pixel');
  }
  
  Export.table.toDrive({
    collection: getEmiTS(emiByYr, regionShp, 'Y'),
    description: speciesLabel + '_Tg_Annual_' + regionName + '_' + sYear + '_' + eYear,
    selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
  });
 
  Export.table.toDrive({
    collection: getEmiTS(emiByMonth, regionShp, 'Y-MM'),
    description: speciesLabel + '_Tg_Monthly_' + regionName + '_' + sYear + '_' + eYear,
    selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
  });

});
