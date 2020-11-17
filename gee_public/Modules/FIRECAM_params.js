// ===================
// FIRECAM_params.js |
// ===================
// ---------------------------------
// Define FIRECAM-related variables
// ---------------------------------

var projFolder = 'projects/GlobalFires/';
exports.projFolder = projFolder;

var basisRegions = ee.FeatureCollection(projFolder + 'basisRegions_0p5deg');
exports.basisRegions = basisRegions;

var invNames = ['GFEDv4s','FINNv1p5','GFASv1p2','QFEDv2p5r1','FEERv1p0_G1p2'];
exports.invNames = invNames;

var invDispNames = ['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1.0-G1.2'];

exports.speciesNames = ['CO - Carbon Monoxide', 'CO2 - Carbon Dioxide',
  'CH4 - Methane', 'OC - Organic Carbon', 'BC - Black Carbon',
  'PM2.5 - Particulate Matter <2.5 μm'];
  
exports.speciesList = {
  'CO - Carbon Monoxide': 'CO',
  'CO2 - Carbon Dioxide': 'CO2',
  'CH4 - Methane': 'CH4',
  'OC - Organic Carbon': 'OC',
  'BC - Black Carbon': 'BC',
  'PM2.5 - Particulate Matter <2.5 μm': 'PM2.5'
};

var bandNamesList = {
  'CO': 'CO',
  'CO2': 'CO2',
  'CH4': 'CH4',
  'OC': 'OC',
  'BC': 'BC',
  'PM2.5': 'PM25'
};

exports.bandNamesList = bandNamesList;

exports.bandMaxValList = {
  'CO': 100,
  'CO2': 2000,
  'CH4': 2000,
  'OC': 3000,
  'BC': 500,
  'PM2.5': 5000
};

exports.bandUnitsList = {
  'CO': 'Gg',
  'CO2': 'Gg',
  'CH4': 'Mg',
  'OC': 'Mg',
  'BC': 'Mg',
  'PM2.5': 'Mg'
};

exports.bandMulti = {
  'CO': 1e3,
  'CO2': 1e3,
  'CH4': 1e6,
  'OC': 1e6,
  'BC': 1e6,
  'PM2.5': 1e6
};

// ----------------------------------
// Relative Fire Confidence Metrics
// ----------------------------------
// Metric 1: areal BA-AF discrepancy
exports.RFCM1 = ee.Image([projFolder + 'RelFireConfidence/RFCM1_BA_AFA_discrepancy']);
// Metric 2: FRP-weighted cloud/haze burden on satellite observing conditions
exports.RFCM2 = ee.Image([projFolder + 'RelFireConfidence/RFCM2_cloud_haze_burden']);
// Metric 3: burn size and fragmentation
exports.RFCM3 = ee.Image([projFolder + 'RelFireConfidence/RFCM3_fireBAComponentSize']);
// Metric 4: topography variance
exports.RFCM4 = ee.Image([projFolder + 'RelFireConfidence/RFCM4_topo_variance']);
// Metric 5: additional small fires from VIIRS
exports.RFCM5 = ee.Image([projFolder + 'RelFireConfidence/RFCM5_additionalFRP_VIIRS']);

// ----------------------------------
// Global Fire Emissions Inventories
// ----------------------------------
var FIRECAM_sp = ee.ImageCollection(projFolder + 'FIRECAM');

// Projection: Geographic, 0.5deg
var crs = 'EPSG:4326';
var crsTrans = [0.5,0,-180,0,-0.5,90];
var aggProj = FIRECAM_sp.first()
  .projection();

exports.crs = crs;
exports.crsTrans = crsTrans;
exports.aggProj = aggProj;

// ---------------------
// Reducers and Charts |
// ---------------------
exports.getRegionShp = function(basisID) {
  return basisRegions.filterMetadata('basis','equals',basisID)
    .geometry();
};

exports.globalShp = basisRegions.geometry().bounds();

var lsib_0p5deg = ee.FeatureCollection(projFolder + 'ADM_shp/LSIB_basis_0p5deg');
exports.getCountryShp = function(region) {
  return lsib_0p5deg.filter(ee.Filter.eq('country_na',region))
    .first().geometry();
};

exports.getGridShp = function(region) {
  return ee.Image(1).clip(region)
    .reproject({crs: crs, crsTransform: crsTrans}).gt(0)
    .reduceToVectors({geometry: basisRegions.union()})
    .geometry();
};

exports.getEmiByMonth = function(species, sYear, eYear) {

  var filterYr = ee.Filter.calendarRange(sYear,eYear,'year');
  var emiByMonth = FIRECAM_sp.filter(filterYr)
    .map(function(image) {
      return image.multiply(image.gte(0))
        .select('.*_' + bandNamesList[species])
        .rename(invNames).divide(1e9)
        .reproject({crs: crs, crsTransform: crsTrans})
        .copyProperties(image,['system:time_start']);
      });
  
  return ee.ImageCollection(emiByMonth);
};
  
exports.getEmiByYr = function(emiByMonth, sYear, eYear) {

  var emiByYr = ee.List.sequence(sYear,eYear,1).map(function(iYear) {
    var filterYr = ee.Filter.calendarRange(iYear,iYear,'year');

    var emiAll = ee.Image(emiByMonth.filter(filterYr).sum())
      .reproject({crs: crs, crsTransform: crsTrans})
      .set('system:time_start',ee.Date.fromYMD(iYear,1,1).millis());
    
      return emiAll;
  });

  return ee.ImageCollection(emiByYr);
};


var colPal = {
  0: {color: '777777'},
  1: {color: '87CEEB'},
  2: {color: 'FF0000'},
  3: {color: 'FDB751'},
  4: {color: '800080'},
};
      
exports.plotEmiTS = function(imageCol, regionShp,
  speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth, nLines) {
  
  return ui.Chart.image.series({
    imageCollection: imageCol.select(invNames,['b1','b2','b3','b4','b5']),
    region: regionShp,
    reducer: ee.Reducer.sum().unweighted(),
    scale: aggProj.nominalScale(),
    xProperty: 'system:time_start',
  }).setChartType('LineChart')
    .setSeriesNames(invDispNames)
    .setOptions({
      title: timePeriod + ' Fire Emissions',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        titleTextStyle: {fontSize: '12'},
        format: '####.###########'
      },
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
          
exports.updateOpts = function(emiTS, speciesLabel, timePeriod, dateFormat, 
  sYear, eYear, sMonth, eMonth) {
  
  var nLines = eYear-sYear;
  if (nLines == 2) {sMonth = 7; eMonth = 7}

  return emiTS.setOptions({
      title: timePeriod + ' Fire Emissions',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        titleTextStyle: {fontSize: '12'},
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
      series: colPal
    });
};

exports.plotEmiBar = function(imageCol, regionShp,
  speciesLabel, timePeriod, sYear, eYear) {
  
  return ui.Chart.image.series({
    imageCollection: imageCol
      .select(invNames,['b1','b2','b3','b4','b5'])
      .set('xName',''),
    region: regionShp,
    reducer: ee.Reducer.sum().unweighted(),
    scale: aggProj.nominalScale(),
    xProperty: 'xName',
  }).setSeriesNames(invDispNames)
    .setOptions({
      title: 'Average ' + timePeriod + ' Fire Emissions (' + sYear + '-' + eYear + ')',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        titleTextStyle: {fontSize: '12'},
        viewWindowMode:'explicit',
        viewWindow: {min: 0},
        format: '####.###########'
      },
      height: '230px',
      series: colPal
    }).setChartType('ColumnChart');
};

exports.plotEmiBarInt = function(imageCol, regionShp,
  speciesLabel, timePeriod, sYear, eYear, plotPanel) {
  
  var invOrder = {
    0:'GFEDv4s',
    1:'FINNv1p5',
    2:'GFASv1p2',
    3:'QFEDv2p5r1',
    4:'FEERv1p0_G1p2'
  };
  
  var emiByYearRegion = ee.FeatureCollection(imageCol
    .map(function(image) {
      var sumRegion = image.reduceRegions({
        collection: regionShp,
        reducer: ee.Reducer.sum().unweighted(),
        scale: aggProj.nominalScale(),
      }).first();
      return sumRegion;
    }));
  
  var getStats = function(invName) {
    var tot_mean = ee.Number(emiByYearRegion.aggregate_mean(invName));
    var tot_min = ee.Number(emiByYearRegion.aggregate_min(invName));
    var tot_max = ee.Number(emiByYearRegion.aggregate_max(invName));

    return [tot_mean, tot_min, tot_max];
  };
  
  var dataTable = [null];
  
  var invNum = [0,1,2,3,4];
  invNum.forEach(function(inv) {
    var summInv = getStats(invNames[inv]);
    dataTable[inv*3+1] = summInv[0];
    dataTable[inv*3+2] = summInv[1];
    dataTable[inv*3+3] = summInv[2];
  });
  
  var colNames = ee.List([[
    {label: 'Inventory', type: 'string'},
    {label: 'GFEDv4s'}, {id: 'p25', role: 'interval'}, {id: 'p75', role: 'interval'},
    {label: 'FINNv1.5'}, {id: 'p25', role: 'interval'}, {id: 'p75', role: 'interval'},
    {label: 'GFASv1.2'}, {id: 'p25', role: 'interval'}, {id: 'p75', role: 'interval'},
    {label: 'QFEDv2.5r1'}, {id: 'p25', role: 'interval'}, {id: 'p75', role: 'interval'},
    {label: 'FEERv1.0-G1.2'}, {id: 'p25', role: 'interval'}, {id: 'p75', role: 'interval'}
  ]]);

  dataTable = colNames.cat([dataTable]);

  dataTable.evaluate(function(dataTable) {
    var avg_chart = ui.Chart(dataTable)
      .setChartType('ColumnChart')
      .setOptions({
        title: 'Average ' + timePeriod + ' Fire Emissions (' + sYear + '-' + eYear + ')',
        titleTextStyle: {fontSize: '13.5'},
        vAxis: {
          title: 'Emissions (Tg ' + speciesLabel + ')',
          titleTextStyle: {fontSize: '12'},
          format: '####.###########'
        },
        hAxis: {
          format:' ',
          viewWindowMode:'explicit',
        },
        series: colPal,
        height: '230px'
    });
    plotPanel.insert(0,avg_chart);
  });
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

exports.getLULCmap = function(mapYr) {
  var mcd12q1Yr = ee.Image(ee.ImageCollection('MODIS/006/MCD12Q1')
    .filter(ee.Filter.calendarRange(mapYr,mapYr,'year')).first())
    .select('LC_Type1');
    
  mcd12q1Yr = mcd12q1Yr.expression(
    '(lc==1 | lc==3) + (lc==2)*2 + (lc>=4 & lc<=5)*3 + (lc>=6 & lc<=8)*4' +
    '+ (lc>=9 & lc<=11 | lc==14 | lc==16)*5 + (lc==12)*6 + (lc==13)*7',
      {lc: mcd12q1Yr});
  
  return mcd12q1Yr;
};

exports.lulc_colPal = ['#000000','#05450A','#92AF1F','#6A2424','#D99125','#F7E174','#FF0000'];
exports.lulcPeat_colPal = ['#000000','#05450A','#92AF1F','#6A2424','#D99125','#F7E174','#FF0000','#800080'];

// -----------------------------------
// Peatland distribution from GFEDv4s
// -----------------------------------
exports.peat = ee.Image(projFolder + 'GFEDv4s_ancill').select('peatFrac');
