// ===================
// GFEDv4s_params.js |
// ===================
// ---------------------------------
// Define GFEDv4s-related variables
// ---------------------------------

var projFolder = 'projects/GlobalFires/';

// GFEDv4s Inventory
var invCol = ee.ImageCollection(projFolder + 'GFEDv4s');
exports.invCol = invCol;

// Ancillary: Area pgeter grid cell, m2
var gridArea = ee.Image(projFolder + 'GFEDv4s_ancill').select('area_m2');
exports.gridArea = gridArea;

// Projection: Geographic, 0.25deg
var crsTrans = [0.25,0,-180,0,0.25,90];
var crs = 'EPSG:4326';
var scale = invCol.first().projection().nominalScale();

exports.invCol = invCol;
exports.crsTrans = crsTrans;
exports.crs = crs;
exports.scale = scale;

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

exports.regionNamesAbbrev = ['BONA','TENA','CEAM','NHSA','SHSA','EURO',
  'MIDE','NHAF','SHAF','BOAS','CEAS','SEAS','EQAS','AUST'];
  
var basisCodes = [2,13,3,9,12,6,7,8,11,1,4,10,5,0];
var basisRegions = ee.FeatureCollection(projFolder + 'basisRegions_0p25deg');

exports.regionNames = regionNames;
exports.basisCodes = basisCodes;
exports.basisRegions = basisRegions;

// -------------------
// GFEDv4s Emissions |
// -------------------

// Emissions factors from DM (g species/ kg DM)
// https://www.geo.vu.nl/~gwerf/GFED/GFED4/ancill/GFED4_Emission_Factors.txt
exports.EFlist = {
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

exports.speciesNames = ['BA - Burned Area','DM - Dry Matter', 'C - Carbon',
  'CO2 - Carbon Dioxide', 'CO - Carbon Monoxide', 'CH4 - Methane',
  'NHMC - Non-Methane Hydrocarbons', 'H2 - Hydrogen',
  'NOx - Nitrogen Oxides', 'N2O - Nitrous Oxide',
  'PM2.5 - Particulate Matter <2.5 μm', 'TPM - Total Particulate Matter',
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

exports.speciesNames_beta = ['DM - Dry Matter', 'C - Carbon',
  'CO2 - Carbon Dioxide', 'CO - Carbon Monoxide', 'CH4 - Methane',
  'NHMC - Non-Methane Hydrocarbons', 'H2 - Hydrogen',
  'NOx - Nitrogen Oxides', 'N2O - Nitrous Oxide',
  'PM2.5 - Particulate Matter <2.5 μm', 'TPM - Total Particulate Matter',
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

exports.speciesList = {
  'BA - Burned Area': 'BA',
  'DM - Dry Matter': 'DM',
  'C - Carbon': 'C',
  'CO2 - Carbon Dioxide': 'CO2',
  'CO - Carbon Monoxide': 'CO',
  'CH4 - Methane': 'CH4',
  'NHMC - Non-Methane Hydrocarbons': 'NHMC',
  'H2 - Hydrogen': 'H2',
  'NOx - Nitrogen Oxides': 'NOx',
  'N2O - Nitrous Oxide': 'N2O',
  'PM2.5 - Particulate Matter <2.5 μm': 'PM2.5',
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

exports.LULC = LULC;
exports.LULCtot = LULCtot;

// Calculate emissions of input species by month in kg/ grid cell
var getEmiByMonth = function(EFs, varType, sYear, eYear) {
  
  var filterYr = ee.Filter.calendarRange(sYear, eYear, 'year');
  var invCol_Yrs = invCol.filter(filterYr);
  
  var emiByMonth = invCol_Yrs.map(function(gfedMon) {
   
    if (varType == 'BA') {
      var BAfrac = gfedMon.select('burned_fraction');
      var BAsf = gfedMon.select('small_fire_fraction');
      
      var BA = BAfrac.addBands(BAfrac.multiply(BAsf))
        .multiply(gridArea).divide(1e9).rename(['BA','BA_smallfires'])
        .reproject({crs: crs, crsTransform: crsTrans})
        .copyProperties(gfedMon,['system:time_start']); // sq. km, in thousands
      
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


// Calculate emissions of input species by day in kg/ grid cell
var getEmiByDay = function(EFs, varType, inYear) {
  
  var filterYr = ee.Filter.calendarRange(inYear, inYear, 'year');
  var invCol_Yrs = invCol.filter(filterYr);
  
  var emiByDay = invCol_Yrs.map(function(gfedMon) {
   
    var dailyFrac = gfedMon.select(['Day.*']);
    var inMonth = gfedMon.date().get('month');
    
    if (varType == 'BA') {
      var BAfrac = gfedMon.select('burned_fraction');
      
      var BA = BAfrac.multiply(gridArea).divide(1e6).divide(1e3)
        .rename(['BA']);
          
      var BAday = BA.multiply(dailyFrac)
        .reproject({crs: crs, crsTransform: crsTrans});
        
      return BAday;
    } else {
      var DM = gfedMon.select('DM'); // kg per m2
      var DMfrac = gfedMon.select('DM_.*'); // fraction
      var sp = DM.multiply(DMfrac).multiply(EFs).multiply(gridArea)
        .multiply(1e-12); // Tg per grid cell
      
      var spTotal = sp.reduce(ee.Reducer.sum());
    
      var emiDay = spTotal.multiply(dailyFrac)
        .reproject({crs: crs, crsTransform: crsTrans});
    
      return emiDay;
    }
  });
  
  emiByDay = ee.ImageCollection(emiByDay).toBands();
  var nDays = emiByDay.bandNames().length();
  var firstDay = ee.Date.fromYMD(inYear,1,1);
  emiByDay = ee.ImageCollection(ee.List.sequence(0,nDays.subtract(1),1)
    .map(function(iDay) {
      return emiByDay.select([iDay]).rename('Total')
        .set('system:time_start',firstDay.advance(iDay,'day').millis());
    }));
      
  return emiByDay;
};

exports.getEmiByMonth = getEmiByMonth;
exports.getEmiByYr = getEmiByYr;
exports.getEmiByDay = getEmiByDay;

// ---------------------
// Reducers and Charts |
// ---------------------
exports.getRegionShp = function(basisID) {
  return basisRegions.filterMetadata('basis','equals',basisID)
    .geometry();
};

exports.globalShp = basisRegions.geometry().bounds();

var lsib_0p25deg = ee.FeatureCollection(projFolder + 'ADM_shp/LSIB_basis_0p25deg');
exports.getCountryShp = function(region) {
  return lsib_0p25deg.filter(ee.Filter.eq('country_na',region))
    .first().geometry();
};

exports.getGridShp = function(region) {
  return ee.Image(1).clip(region)
    .reproject({crs: crs, crsTransform: crsTrans}).gt(0)
    .reduceToVectors({geometry: basisRegions.union(), crs: crs, crsTransform: crsTrans})
    .geometry();
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

exports.plotEmiTS = function(imageCol, regionShp,
  speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth) {
  
  var featCol = imageCol.map(function(image) {
      return image.reduceRegions({
        collection: regionShp,
        reducer: ee.Reducer.sum().unweighted(),
        scale: scale
      }).first().copyProperties(image,['system:time_start']);
    });
    
  if (speciesLabel == 'BA') {
    return ui.Chart.feature.byFeature({
      features: ee.FeatureCollection(featCol),
      xProperty: 'system:time_start',
      yProperties: ['BA','BA_smallfires']
    }).setChartType('LineChart')
      .setSeriesNames(['BA','BA, small fires'])
      .setOptions({
        title: timePeriod + ' Burned Area',
        titleTextStyle: {fontSize: '13.5'},
        vAxis: {
          title: 'Burned Area (sq. km, thousands)',
          format: '####.###########'
        },
        hAxis: {
          format: dateFormat, 
          viewWindowMode:'explicit',
          viewWindow: {
            min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
            max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
          },
        },
        height: '230px',
        series: colPalseries_BA,
      });
  } else {
    return ui.Chart.feature.byFeature({
      features: ee.FeatureCollection(featCol),
      xProperty: 'system:time_start',
      yProperties: LULCtot
    }).setChartType('LineChart')
      .setSeriesNames(LULCtot)
      .setOptions({
        title: timePeriod + ' Fire Emissions',
        titleTextStyle: {fontSize: '13.5'},
        vAxis: {
          title: 'Emissions (Tg ' + speciesLabel + ')',
          format: '####.###########'
        },
        hAxis: {
          format: dateFormat, 
          viewWindowMode:'explicit',
          viewWindow: {
            min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
            max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
          },
        },
        height: '230px',
        series: colPalseries,
      });
    }
};

exports.updateOpts = function(emiTS, speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth) {
  
  var nLines = eYear-sYear;
  if (nLines == 2) {sMonth = 7; eMonth = 7}
  
  if (speciesLabel == 'BA') {
    return emiTS.setOptions({
      title: timePeriod + ' Burned Area',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Burned Area (sq. km)',
        format: '####.###########'
      },
      hAxis: {
        format: dateFormat, 
        viewWindowMode:'explicit',
        viewWindow: {
          min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
          max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
        },
        gridlines: {count: nLines},
        minorGridlines: {count: 0}
      },
      height: '230px',
      series: colPalseries_BA
    });
  } else {
    return emiTS.setOptions({
      title: timePeriod + ' Fire Emissions',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        format: '####.###########'
      },
      hAxis: {
        format: dateFormat, 
        viewWindowMode:'explicit',
        viewWindow: {
          min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
          max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
        },
        gridlines: {count: nLines},
        minorGridlines: {count: 0}
      },
      height: '230px',
      series: colPalseries
    });
  }
};

exports.plotEmiTSday = function(imageCol, inYear, regionShp, speciesLabel) {
  
  if (speciesLabel == 'BA') {
    return ui.Chart.image.series({
      imageCollection: imageCol,
      region: regionShp,
      reducer: ee.Reducer.sum().unweighted(),
      scale: scale,
      xProperty: 'system:time_start',
    }).setChartType('LineChart')
      .setSeriesNames(['BA'])
      .setOptions({
        title: 'Daily Burned Area (' + inYear + ')',
        titleTextStyle: {fontSize: '13.5'},
        vAxis: {
          title: 'Burned Area (sq. km, thousands)',
          format: '####.###########'
        },
        hAxis: {
          format: 'MMM-dd',
        },
        legend: {position: 'none'},
        height: '230px',
        series: {0: {color: '000000', lineWidth: 1.75}}
      });
  } else {
    return ui.Chart.image.series({
      imageCollection: imageCol,
      region: regionShp,
      reducer: ee.Reducer.sum().unweighted(),
      scale: scale,
      xProperty: 'system:time_start',
    }).setChartType('LineChart')
      .setSeriesNames(['Total'])
      .setOptions({
        title: 'Daily Fire Emissions (' + inYear + ')',
        titleTextStyle: {fontSize: '13.5'},
        vAxis: {
          title: 'Emissions (Tg ' + speciesLabel + ')',
          format: '####.###########'
        },
        hAxis: {
          format: 'MMM-dd'
        },
        legend: {position: 'none'},
        height: '230px',
        series: {0: {color: '000000', lineWidth: 1.75}}
      });
    }
};


// Andreae (2019) emissions factors
exports.EFlist_Andreae = {
  'CO2': [[1660, 1530, 1570, 1620, 1590, 1430]],
  'CO': [[69, 121, 113, 104, 260, 76]],
  'CH4': [[2.7, 5.5, 5.2, 6.5, 9.1, 5.7]],
  'H2': [[0.97, 1.64, 2.09, 3.09, 1.22, 2.645]],
  'NOx': [[2.49, 1.18, 3.02, 2.81, 1.24, 2.4]],
  'N2O': [[0.17, 0.24, 0.25, 0.2, 0.2, 0.09]],
  'PM2.5': [[6.7, 18.7, 18.5, 8.3, 18.9, 8.2]],
  'TPM': [[8.7, 15.3, 18.4, 10.9, 27.5, 12.9]],
  'TPC': [[3.2, 9.8, 8.4, 5.5, 14.3, 5.3]],
  'OC': [[3.0, 5.9, 10.9, 4.4, 14.2, 4.9]],
  'BC': [[ 0.53, 0.43, 0.55, 0.51, 0.1, 0.42]],
  'SO2': [[0.47, 0.75, 0.7, 0.77, 4.26, 0.8 ]],
  'C2H6': [[0.417, 1.79, 0.63, 0.71, 0.71, 0.91]],
  'CH3OH': [[1.348, 2.332, 2.186, 2.796, 2.543, 3.27]],
  'C2H5OH': [[0.036, 0.058, 0.076, 0.067, 0.17, 0.05]],
  'C3H8': [[0.134, 0.295, 0.276, 0.534, 0.99, 0.167]],
  'C2H2': [[0.313, 0.283, 0.311, 0.353, 0.111, 0.272]],
  'C2H4': [[0.832, 1.539, 1.113, 1.106, 1.474, 0.995]],
  'C3H6': [[0.462, 0.674, 0.599, 0.863, 1.14, 0.472]],
  'C5H8': [[0.101, 0.074, 0.095, 0.218, 0.518, 0.175]],
  'C7H8': [[0.191, 0.353, 0.273, 0.234, 0.445, 0.168]],
  'CH2O': [[1.228, 1.746, 2.044, 2.400, 1.072, 1.806]],
  'NH3': [[0.89, 2.46, 0.98, 1.33, 4.15, 0.99]],
  'C2H6S': [[0.0084, 0.002, 0.014, 0.002, 0.045, 0.05]],
  'HCN': [[0.44, 0.53, 0.64, 0.44, 4.40, 0.42]],
  'CH3COOH': [[0.395, 0.57, 0.2, 0.49, 0.229, 0.554]],
};

exports.speciesNames_Andreae = [
  'CO2 - Carbon Dioxide', 'CO - Carbon Monoxide', 'CH4 - Methane',
  'H2 - Hydrogen', 'NOx - Nitrogen Oxides', 'N2O - Nitrous Oxide',
  'PM2.5 - Particulate Matter <2.5 μm', 'TPM - Total Particulate Matter',
  'TPC - Total Carbon from Aerosols', 'OC - Organic Carbon',
  'BC - Black Carbon', 'SO2 - Sulfur Dioxide', 'C2H6 - Ethane',
  'CH3OH - Methanol', 'C2H5OH - Ethanol', 'C3H8 - Propane',
  'C2H2 - Acetylene', 'C2H4 - Ethylene', 'C3H6 - Propene',
  'C5H8 - Isoprene', 'C7H8 - Toluene', 'CH2O - Formaldehyde',
  'NH3 - Ammonia', 'C2H6S - Dimethyl Sulfide', 'HCN - Hydrogen Cyanide',
  'CH3COOH - Acetic Acid',
];

var compNames = ['Old','New'];

exports.combineBands_Andreae = function(imageCol_OldEFs, imageCol_NewEFs) {
  var combinedBands = imageCol_OldEFs.select('Total')
    .map(function(emiOldEFs) {
      var imageDate = ee.Date(emiOldEFs.get('system:time_start'));
      var emiNewEFs = ee.Image(imageCol_NewEFs
        .filterDate(imageDate, imageDate.advance(1,'day')).first())
        .select('Total');
      
      return emiOldEFs.addBands(emiNewEFs).rename(compNames);
    });
  return combinedBands;
};

exports.plotEmiTS_Andreae = function(imageCol,
  regionShp, speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth) {
  
  var featCol = imageCol.map(function(image) {
    return image.reduceRegions({
      collection: regionShp,
      reducer: ee.Reducer.sum().unweighted(),
      scale: scale,
    }).first().copyProperties(image,['system:time_start']);
  });
  
  return ui.Chart.feature.byFeature({
      features: ee.FeatureCollection(featCol),
      xProperty: 'system:time_start',
      yProperties: compNames
    }).setChartType('LineChart')
    .setSeriesNames(['Old EFs', 'New EFs (Andreae 2019)'])
    .setOptions({
      title: timePeriod + ' Fire Emissions',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        format: '####.###########'
      },
      hAxis: {
        format: dateFormat, 
        viewWindowMode:'explicit',
        viewWindow: {
          min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
          max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
        },
      },
      height: '230px',
      series: colPalseries_BA,
    });
};

exports.updateOpts_Andreae = function(emiTS, speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth) {
  
  var nLines = eYear-sYear;
  if (nLines == 2) {sMonth = 7; eMonth = 7}
  
  return emiTS.setOptions({
    title: timePeriod + ' Fire Emissions',
    titleTextStyle: {fontSize: '13.5'},
    vAxis: {
      title: 'Emissions (Tg ' + speciesLabel + ')',
      format: '####.###########'
    },
    hAxis: {
      format: dateFormat, 
      viewWindowMode:'explicit',
      viewWindow: {
        min: ee.Date.fromYMD(sYear,sMonth,1).millis().getInfo(),
        max: ee.Date.fromYMD(eYear,eMonth,1).millis().getInfo()
      },
      gridlines: {count: nLines},
      minorGridlines: {count: 0}
    },
    height: '230px',
    series: colPalseries_BA
  });
};

exports.plotCompTS = function(imageCol_mean, speciesLabel, regionShp) {
  
  var featCol = ee.ImageCollection([imageCol_mean]).map(function(image) {
    return image.reduceRegions({
      collection: regionShp,
      reducer: ee.Reducer.sum().unweighted(),
      scale: scale
    }).first().set('xName','')
    .copyProperties(image,['system:time_start']);
  });
  
  return ui.Chart.feature.byFeature({
    features: ee.FeatureCollection(featCol),
    xProperty: 'xName',
    yProperties: compNames
  }).setSeriesNames(['Old EFs', 'New EFs'])
    .setOptions({
      title: 'Average Annual Fire Emissions',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        textPosition: 'none',
        title: 'Emissions (Tg ' + speciesLabel + ')',
        format: '####.###########'
      },
      hAxis: {
        viewWindowMode: 'explicit',
        viewWindow: {min: 0}
      },
      series: colPalseries_BA,
      height: '175px',
  }).setChartType('BarChart');
};


exports.plotCompTS_text = function(imageCol_mean, regionShp) {
  
  return imageCol_mean.reduceRegions({
    collection: regionShp,
    reducer: ee.Reducer.sum().unweighted(),
    scale: scale
  }).first();
};

  