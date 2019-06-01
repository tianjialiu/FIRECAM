// *****************************************************************
// =================================================================
// --- Global Fire Emissions Database, v4s (GFEDv4s) Explorer --- ||
// =================================================================
// *****************************************************************
// Data from: https://www.globalfiredata.org/
// Citation: van der Werf et al. (2017)
// Global fire emissions estimates during 1997-2016
// https://doi.org/10.5194/essd-9-697-2017

// Author: Tianjia Liu
// Last updated: June 1, 2019

// ---------------
// Global Params |
// ---------------
var invName = 'GFEDv4s';
var projFolder = 'projects/GlobalFires/';

// GFEDv4s
var invCol = ee.ImageCollection(projFolder + invName);

// Ancillary: Area per grid cell, m2
var gridArea = ee.Image(projFolder + 'GFEDv4ancill').select('area_m2');

// Projection: Geographic, 0.25deg
var crsTrans = [0.25,0,-180,0,0.25,90];
var crs = 'EPSG:4326';
var scale = invCol.first().projection().nominalScale();

// 14 Basis Regions from GFEDv4s
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
var basisRegions = ee.FeatureCollection(projFolder + 'basisRegions_0p25deg');

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

// -------------------
// GFEDv4s Emissions |
// -------------------

// Emissions factors from DM (g species/ kg DM)
// https://www.geo.vu.nl/~gwerf/GFED/GFED4/ancill/GFED4_Emission_Factors.txt
var EFlist = {
  'DM': [[1000, 1000, 1000, 1000, 1000, 1000]],
  'C': [[488.273, 464.989, 489.416, 491.751, 570.055, 480.352]],
  'CO2': [[1686, 1489, 1647, 1643, 1703, 1585]],
  'CO': [[63, 127, 88, 93, 210, 102]],
  'CH4': [[1.94, 5.96, 3.36, 5.07, 20.8, 5.82]],
  'NHMC': [[3.4, 8.4, 8.4, 1.7, 1.7, 9.9]],
  'H2': [[1.7, 2.03, 2.03, 3.36, 3.36, 2.59]],
  'NOx': [[3.9, 0.9, 1.92, 2.55, 1, 3.11]],
  'N2O': [[0.2, 0.41,0.16, 0.2, 0.2, 0.1]],
  'PM2.5': [[7.17, 15.3, 12.9, 9.1, 9.1, 6.26]],
  'TPM': [[8.5, 17.6, 17.6, 13, 13, 12.4]],
  'TPC': [[3, 10.1, 10.1, 5.24, 6.06, 3.05]],
  'OC': [[2.62, 9.6, 9.6, 4.71, 6.02, 2.3]],
  'BC': [[0.37, 0.5, 0.5, 0.52, 0.04, 0.75]],
  'SO2': [[0.48, 1.1, 1.1, 0.4, 0.4, 0.4]],
  'C2H6': [[0.66, 1.79, 0.63, 0.71, 0.71, 0.91]],
  'CH3OH': [[1.18, 2.82, 1.74, 2.43, 8.46, 3.29]],
  'C2H5OH': [[0.024, 0.055, 0.1, 0.037, 0.037, 0.035]],
  'C3H8': [[0.1, 0.44, 0.22, 0.126, 0.126, 0.28]],
  'C2H2': [[0.24, 0.18, 0.26, 0.44, 0.06, 0.27]],
  'C2H4': [[0.82, 1.42, 1.17, 1.06, 2.57, 1.46]],
  'C3H6': [[0.79, 1.13, 0.61, 0.64, 3.05, 0.68]],
  'C5H8': [[0.039, 0.15, 0.099, 0.13, 1.38, 0.38]],
  'C10H16': [[0.081, 2.003, 2.003, 0.15, 0.15, 0.005]],
  'C7H8': [[0.08, 0.48, 0.19, 0.26, 1.55, 0.19]],
  'C6H6': [[0.2, 1.11, 0.27, 0.39, 3.19, 0.15]],
  'C8H10': [[0.014, 0.18, 0.13, 0.11, 0.11, 0.114]],
  'Toluene Lump': [[0.270, 1.626, 0.540, 0.697, 4.360, 0.415]],
  'Higher Alkenes': [[0.133, 0.385, 0.369, 0.267, 0.267, 0.333]],
  'Higher Alkanes': [[0.055, 0.349, 0.225, 0.072, 0.072, 0.340]],
  'CH2O': [[0.73, 1.86, 2.09, 1.73, 1.4, 2.08]],
  'C2H4O': [[0.57, 0.77, 0.77, 1.55, 3.27, 1.24]],
  'C3H6O': [[0.16, 0.75, 0.54, 0.63, 1.25, 0.45]],
  'NH3': [[0.52, 2.72, 0.84, 1.33, 1.33, 2.17]],
  'C2H6S': [[0.0013, 0.00465, 0.008, 0.00135, 0.00135, 0.0013]],
  'HCN': [[0.41, 1.52, 0.72, 0.42, 8.11, 0.29]],
  'HCOOH': [[0.21, 0.57, 0.28, 0.79, 0.38, 1]],
  'CH3COOH': [[3.55, 4.41, 2.13, 3.05, 8.97, 5.59]],
  'MEK': [[0.181, 0.22, 0.13, 0.5, 0.5, 0.9]],
  'CH3COCHO': [[0.73, 0.73, 0.73, 0.73, 0.73, 0.73]],
  'HOCH2CHO': [[0.25, 0.86, 0.86, 0.74, 0.74, 0.71]]
};

var speciesNames = ['BA - Burned Area','DM - Dry Matter', 'C - Carbon',
  'CO2 - Carbon Dioxide', 'CO - Carbon Monoxide', 'CH4 - Methane',
  'NHMC - Non-Methane Hydrocarbons', 'H2 - Hydrogen',
  'NOx - Nitrogen Oxides', 'N2O - Nitrous Oxide',
  'PM2.5 - Particulate Matter <2.5 um', 'TPM - Total Particulate Matter',
  'TPC - Total Carbon from Aerosols', 'OC - Organic Carbon',
  'BC - Black Carbon', 'SO2 - Sulfur Dioxide', 'C2H6 - Ethane',
  'CH3OH - Methanol', 'C2H5OH - Ethanol', 'C3H8 - Propane',
  'C2H2 - Acetylene', 'C2H4 - Ethylene', 'C3H6 - Propene',
  'C5H8 - Isoprene', 'C10H16 - Limonene', 'C7H8 - Toluene',
  'C6H6 - Benzene', 'C8H10 - Xylene', 'Toluene Lump',
  'Higher Alkenes', 'Higher Alkanes', 'CH2O - Formaldehyde',
  'C2H4O - Acetaldehyde', 'C3H6O - Acetone', 'NH3 - Ammonia',
  'C2H6S - Dimethyl Sulfide', 'HCN - Hydrogen Cyanide',
  'HCOOH - Formic Acid', 'CH3COOH - Acetic Acid',
  'MEK - Methyl Eythl Ketone', 'CH3COCHO - Methylglyoxal',
  'HOCH2CHO - Glycoaldehyde'
];
  
var speciesList = {
  'BA - Burned Area': 'BA',
  'DM - Dry Matter': 'DM',
  'C - Carbon': 'C',
  'CO2 - Carbon Dioxide': 'CO2',
  'CO - Carbon Monoxide': 'CO',
  'CH4 - Methane': 'CH4',
  'NHMC - Non-Methane Hydrocarbons': 'NHMC',
  'H2 - Hydrogen': 'H2',
  'NOx - Nitric Oxides': 'NOx',
  'N2O - Nitrous Oxide': 'N2O',
  'PM2.5 - Particulate Matter <2.5 um': 'PM2.5',
  'TPM - Total Particulate Matter': 'TPM',
  'TPC - Total Carbon from Aerosols': 'TPC',
  'OC - Organic Carbon': 'OC',
  'BC - Black Carbon': 'BC',
  'SO2 - Sulfur Dioxide': 'SO2',
  'C2H6 - Ethane': 'C2H6',
  'CH3OH - Methanol': 'CH3OH',
  'C2H5OH - Ethanol': 'C2H5OH',
  'C3H8 - Propane': 'C3H8',
  'C2H2 - Acetylene': 'C2H2',
  'C2H4 - Ethylene': 'C2H4',
  'C3H6 - Propene': 'C3H6',
  'C5H8 - Isoprene': 'C5H8',
  'C10H16 - Limonene': 'C10H16',
  'C7H8 - Toluene': 'C7H8',
  'C6H6 - Benzene': 'C6H6',
  'C8H10 - Xylene': 'C8H10',
  'Toluene Lump': 'Toluene Lump',
  'Higher Alkenes': 'Higher Alkenes',
  'Higher Alkanes': 'Higher Alkanes',
  'CH2O - Formaldehyde': 'CH2O',
  'C2H4O - Acetaldehyde': 'C2H4O',
  'C3H6O - Acetone': 'C3H6O',
  'NH3 - Ammonia': 'NH3',
  'C2H6S - Dimethyl Sulfide': 'C2H6S',
  'HCN - Hydrogen Cyanide': 'HCN',
  'HCOOH - Formic Acid': 'HCOOH',
  'CH3COOH - Acetic Acid': 'CH3COOH',
  'MEK - Methyl Eythl Ketone': 'MEK',
  'CH3COCHO - Methylglyoxal': 'CH3COCHO',
  'HOCH2CHO - Glycoaldehyde': 'HOCH2CHO'
};

// Land Use/ Land Cover (LULC) types - abbreviation
// 1. Savanna, 2. Boreal Forest, 3. Temperate Forest,
// 4. Deforestation/ Tropical Forest, 5. Peatland,
// 6. Agricultural
var LULC = ['SAVA','BORF','TEMF','DEFO','PEAT','AGRI'];
var LULCtot = ['Total','SAVA','BORF','TEMF','DEFO','PEAT','AGRI'];

// Calculate emissions of input species by month in kg/ grid cell
var getEmiByMonth = function(EFs, varType, sYear, eYear) {
  
  var filterYr = ee.Filter.calendarRange(sYear, eYear, 'year');
  var invCol_Yrs = invCol.filter(filterYr);
  
  var emiByMonth = invCol_Yrs.map(function(gfedMon) {
   
    if (varType == 'BA') {
      var BAfrac = gfedMon.select('burned_fraction');
      var BAsf = gfedMon.select('small_fire_fraction');
      
      var BA = BAfrac.addBands(BAfrac.multiply(BAsf))
        .multiply(gridArea).divide(1e6).rename(['BA','BAsf'])
        .reproject({crs: crs, crsTransform: crsTrans})
        .copyProperties(gfedMon,['system:time_start']);
      
      return BA;
    } else {
      var DM = gfedMon.select('DM'); // kg per m2
      var DMfrac = gfedMon.select('DM_.*'); // fraction
      var sp = DM.multiply(DMfrac).multiply(EFs).multiply(gridArea)
        .multiply(1e-12); // Tg per grid cell
      
      var spTotal = sp.reduce(ee.Reducer.sum());
      var emiAll = spTotal.addBands(sp).rename(LULCtot)
        .reproject({crs: crs, crsTransform: crsTrans})
        .copyProperties(gfedMon,['system:time_start']);
    
      return emiAll;
    }

  });
  
  return ee.ImageCollection(emiByMonth);
};

// Calculate emissions of input species by year in kg/ grid cell
var getEmiByYr = function(emiByMonth, sYear, eYear) {

  var emiByYr = ee.List.sequence(sYear,eYear,1).map(function(iYear) {
    var filterYr = ee.Filter.calendarRange(iYear,iYear,'year');

    var emiAll = ee.Image(emiByMonth.filter(filterYr).sum())
      .reproject({crs: crs, crsTransform: crsTrans})
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

var colPalseries = {
  0: {color: '000000'},
  1: {color: '777777'},
  2: {color: '87CEEB'},
  3: {color: 'FF0000'},
  4: {color: 'FDB751'},
  5: {color: '800080'},
  6: {color: 'DB7093'},
};

var colPalseries_BA = {
  0: {color: '000000'},
  1: {color: 'FF0000'},
};

var plotEmiTS = function(plotPanel, imageCol, regionShp,
  speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth, nLines) {
  
  if (speciesLabel == 'BA') {
    return ui.Chart.image.series({
      imageCollection: imageCol.select(['BA','BAsf'],['b1','b2']),
      region: regionShp,
      reducer: ee.Reducer.sum().unweighted(),
      scale: scale,
      xProperty: 'system:time_start',
    }).setChartType('LineChart')
      .setSeriesNames(['BA','BA from small fires'])
      .setOptions({
        title: timePeriod + ' Burned Area',
        vAxis: {title: 'Burned Area (sq. km)'},
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
        series: colPalseries_BA,
      });
  } else {
    return ui.Chart.image.series({
      imageCollection: imageCol.select(LULCtot,['b1','b2','b3','b4','b5','b6','b7']),
      region: regionShp,
      reducer: ee.Reducer.sum().unweighted(),
      scale: scale,
      xProperty: 'system:time_start',
    }).setChartType('LineChart')
      .setSeriesNames(LULCtot)
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
        series: colPalseries,
      });
    }
};

var updateOpts = function(emiTS, speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth, nLines) {
  
  if (speciesLabel == 'BA') {
    return emiTS.setOptions({
      title: timePeriod + ' Burned Area',
      vAxis: {title: 'Burned Area (sq. km)'},
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
      series: colPalseries_BA
    });
  } else {
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
      series: colPalseries
    });
  }

};

// ------------
// Info Panel
// ------------
var infoPanel = function() {
  var GFEDLabelShort = ui.Label('GFEDv4s Explorer', {margin: '6px 0px 0px 8px', fontWeight: 'bold', fontSize: '24px', border: '1px solid black', padding: '3px 3px 3px 3px'});
  var GFEDLabelLong = ui.Label('Global Fire Emissions Database, version 4s', {margin: '8px 8px 0px 8px', fontSize: '16px'});
  var paperLabel = ui.Label('Citation: van der Werf et al. (2017, ESSD)', {margin: '5px 0px 5px 8px', fontSize: '13px'}, 'https://doi.org/10.5194/essd-9-697-2017');
  var websiteLabel = ui.Label('[Data]', {margin: '5px 0px 5px 8px', fontSize: '13px'}, 'https://www.globalfiredata.org/');
  var FIRECAMLabel = ui.Label('To compare GFEDv4s with other inventories, please use the', {margin: '2px 0px 1px 8px', fontSize: '11.8px'});
  var FIRECAMLabellink = ui.Label('FIRECAM tool', {margin: '0px 0px 5px 8px', fontSize: '12px'}, 'https://globalfires.earthengine.app/view/firecam');
  var inputParamsLabel = ui.Label('Input Parameters', {margin: '8px 8px 5px 5px', fontWeight: 'bold', fontSize: '20px'});
  
  return ui.Panel([
      GFEDLabelShort, GFEDLabelLong,
      ui.Panel([paperLabel, websiteLabel], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
      FIRECAMLabel, FIRECAMLabellink,
      inputParamsLabel
    ]);
};

// -----------
// Year Panel
// -----------
var yearSelectPanel = function() {
  var timeRangeLabel = ui.Label('1) Select Time Range:', {margin: '8px 8px 8px 8px', fontSize: '14.5px'});
  var startYearLabel = ui.Label('Start Year:', {margin: '3px 20px 8px 20px', fontSize: '14.5px'});
  var startYearSlider = ui.Slider({min: 1997, max: 2016, value: 2005, step: 1, style: {margin: '3px 8px 8px 14px'}});
  startYearSlider.style().set('stretch', 'horizontal');
  
  var endYearLabel = ui.Label('End Year:', {margin: '3px 20px 8px 20px', fontSize: '14.5px'});
  var endYearSlider = ui.Slider({min: 1997, max: 2016, value: 2015, step: 1, style: {margin: '3px 8px 8px 14px'}});
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
      ui.Panel([startYearLabel, startYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
      ui.Panel([endYearLabel, endYearSlider], ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'}),
    ]);
};

var getYears = function(yearSelectPanel) {
  return {
    startYear:yearSelectPanel.widgets().get(1).widgets().get(1).getValue(),
    endYear:yearSelectPanel.widgets().get(2).widgets().get(1).getValue()
  };
};

// -------------
// Region Panel
// -------------
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
  
  var lonBox = ui.Textbox({value: 111.125});
  lonBox.style().set('stretch', 'horizontal');
  var latBox = ui.Textbox({value: -2.875});
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
  var speciesLabel = ui.Label('3) Select Species:', {padding: '5px 0px 0px 0px', fontSize: '14.5px'});
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
// Legend
// --------
var colPal_Spectral = ['#3288BD','#99D594','#E6F598','#FFFFBF','#FEE08B','#FC8D59','#D53E4F'];

var emiLegend = function(speciesLabel, units, maxVal, sYear, eYear) {
  
  var legendTitle = ui.Label('Average Annual Fire Emissions',
    {fontWeight: 'bold', fontSize: '16px', margin: '5px 0 6px 8px'});

  var legendSubtitle = ui.Label(units + ' ' + speciesLabel + '/yr (' + sYear + '-' + eYear + ')',
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
      ui.Label((vis.max / 2),
        {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(vis.max, {margin: '4px 8px'})
      ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

  var legendPanel = ui.Panel({
    widgets: [legendTitle, legendSubtitle, colorBar, legendLabels],
    style: {margin: '0px 0px -2px 0px'}
  });
  
  return legendPanel;
};

// -----------
// Plot Panel
// -----------
var plotPanelLabel = ui.Label('Emissions by Land Use/Land Cover', {fontWeight: 'bold', fontSize: '20px', margin: '7px 8px 5px 18px'});

// -----------------------------------
// - - - - - - UI PANELS - - - - - - |
// -----------------------------------
// Control panel
var controlPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '345px', position: 'bottom-left'}
});

// Plot panel
var plotPanel = ui.Panel(null, null, {stretch: 'horizontal'});
var plotPanelParent = ui.Panel([plotPanelLabel, plotPanel], null,
  {width: '450px', position: 'bottom-right'});

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
ui.root.clear();
ui.root.add(map);
map.add(controlPanel.add(infoPanel).add(yearSelectPanel).add(regionTypeSelectPanel)
  .add(regionSelectPanel).add(speciesSelectPanel).add(submitButton));

// Run calculations, linked to submit button
var counter = 0;
submitButton.onClick(function() {
  map.clear();
  counter = counter + 1;
  
  // Input Parameters:
  var sYear = getYears(yearSelectPanel).startYear;
  var eYear = getYears(yearSelectPanel).endYear;

  var xYears = ee.List.sequence(sYear,eYear,1);
  
  var regionShp = getRegionShp(basisID);
  var regionType = getRegionType(regionTypeSelectPanel);
  
  var speciesLong = getSpecies(speciesSelectPanel);
  var speciesLabel = speciesList[speciesLong];
  
  // Default Map
  var display_sp = 'DM'; var unitsLabel = 'Mg'; var maxVal = 500;
  
  var EFs_display = ee.Image(EFlist[display_sp]).rename(LULC)
    .reproject({crs: crs, crsTransform: crsTrans});
  var emiByMonth_display = getEmiByMonth(EFs_display, display_sp, sYear, eYear);
  var emiByYr_display = getEmiByYr(emiByMonth_display, sYear, eYear);
  var emiByYrMean_display = emiByYr_display.reduce(ee.Reducer.mean()).divide(1e6);

  // Display Maps:
  var legendPanel = emiLegend(display_sp, unitsLabel, maxVal, sYear, eYear);
  
  if (counter > 1) {controlPanel.remove(controlPanel.widgets().get(6))}
  map.add(controlPanel); controlPanel.add(legendPanel);

  map.addLayer(ee.Image(1).clip(basisRegions).rename('Basis Regions'),
    {palette: '#000000', opacity: 0.8}, 'Basis Regions');
    
  map.addLayer(emiByYrMean_display.select('Total.*').multiply(1e9).selfMask(),
    {palette: colPal_Spectral, min: 0, max: maxVal}, 'GFEDv4s');

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
    map.setCenter(50,0,1);
  }
  
  // Retrieve emissions factors
  var EFs = ee.Image(EFlist[speciesLabel]).rename(LULC)
    .reproject({crs: crs, crsTransform: crsTrans});
  
  var emiByMonth = getEmiByMonth(EFs, speciesLabel, sYear, eYear);
  var emiByYr = getEmiByYr(emiByMonth, sYear, eYear);
  
  // Display Charts:
  if (speciesLabel == 'BA') {
    plotPanelParent.widgets().get(0).setValue('Burned Area');
  } else {
    plotPanelParent.widgets().get(0).setValue('Emissions by Land Use/Land Cover');
  }
  
  map.add(plotPanelParent);
  plotPanel = plotPanel.clear();
  
  var annualChart = plotEmiTS(plotPanel, emiByYr, regionShp,
    speciesLabel, 'Annual', 'Y', sYear, eYear, 1, 1, null);
  
  if (eYear-sYear <= 5) {
    var nYear = eYear-sYear+1;
    annualChart = updateOpts(annualChart, speciesLabel, 'Annual', 'Y', (sYear-1), eYear, 12, 2, nYear);
    annualChart.setChartType('ScatterChart');
  }
  
  plotPanel.add(annualChart); plotPanel.add(ui.Label('', {margin: '-25px 8px 8px'}));
  
  var monthlyChart = plotEmiTS(plotPanel, emiByMonth, regionShp,
    speciesLabel, 'Monthly', 'MMM Y', sYear, eYear, 1, 12, null);
  if (regionType != 'Global' | eYear-sYear === 0) {
    plotPanel.add(monthlyChart);
  }
});


