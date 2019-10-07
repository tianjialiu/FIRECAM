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
  return basisRegions.filterMetadata('basis','equals',basisID);
};

exports.globalShp = basisRegions.geometry().bounds();

exports.getCountryShp = function(region) {
  return ee.Image(1).clip(ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
    .filter(ee.Filter.eq('country_na',region)))
    .reproject({crs: crs, crsTransform: crsTrans}).gt(0)
    .reduceToVectors({geometry: basisRegions.union()});
};

exports.getGridShp = function(region) {
  return ee.Image(1).clip(region)
    .reproject({crs: crs, crsTransform: crsTrans}).gt(0)
    .reduceToVectors({geometry: basisRegions.union()});
};

exports.getEmiByMonth = function(species, sYear, eYear) {

  var filterYr = ee.Filter.calendarRange(sYear,eYear,'year');
  var emiByMonth = FIRECAM_sp.filter(filterYr)
    .map(function(image) {
      return image.select('.*_' + bandNamesList[species])
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
    .setSeriesNames(['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1.0-G1.2'])
    .setOptions({
      title: timePeriod + ' Fire Emissions',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        titleTextStyle: {fontSize: '12'},
        format: '####.#'
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
        format: '####.#'
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
  }).setChartType('ColumnChart')
  .setSeriesNames(['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1.0-G1.2'])
    .setOptions({
      title: 'Average ' + timePeriod + ' Fire Emissions (' + sYear + '-' + eYear + ')',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        titleTextStyle: {fontSize: '12'},
        viewWindowMode:'explicit',
        viewWindow: {min: 0},
        format: '####.#'
      },
      height: '230px',
      series: colPal
    });
};

exports.plotEmiBarSD = function(imageCol, regionShp,
  speciesLabel, timePeriod, sYear, eYear) {
  
  var invOrder = {
    0:'GFEDv4s',
    1:'FINNv1p5',
    2:'GFASv1p2',
    3:'QFEDv2p5r1',
    4:'FEERv1p0_G1p2'
  };
  
  var emiByYearRegion = ee.FeatureCollection(imageCol.toList(500,0)
    .map(function(x) {
      var sumRegion = ee.Image(x).reduceRegions({
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
 
  var inDate = 'Date(' + sYear + ',0)';
  var dataTable = {
    cols: [{id: 'Date', label: 'Date', type: 'date'}],
    rows: []
  };

  var i = 1;
  invNames.forEach(function(invName) {
    dataTable.cols[i++] = {
      type: 'number',
      id: invName,
      label: invName,
    };
    dataTable.cols[i++] = {
      type: 'number',
      id: invName + '_range',
      label: invName + '_range',
      role: 'interval'
    };
    dataTable.cols[i++] = {
      type: 'number',
      id: invName + '_range',
      label: invName + '_range',
      role: 'interval'
    };
  });

  var invNum = [0,1,2,3,4];
  invNum.forEach(function(inv) {
    var summInv = getStats(invNames[inv]);
    dataTable.rows[inv] = {c:{0:{v:inDate}}};
    dataTable.rows[inv].c[inv*3+1] = {v:summInv[0].getInfo()};
    dataTable.rows[inv].c[inv*3+2] = {v:summInv[1].getInfo()};
    dataTable.rows[inv].c[inv*3+3] = {v:summInv[2].getInfo()};
  });
  
  var avg_chart = ui.Chart(dataTable)
    .setChartType('ColumnChart')
    .setSeriesNames('GFEDv4s',0)
    .setSeriesNames('FINNv1.5',3)
    .setSeriesNames('GFASv1.2',6)
    .setSeriesNames('QFEDv2.5r1',9)
    .setSeriesNames('FEERv1.0-G1.2',12)
    .setOptions({
      title: 'Average ' + timePeriod + ' Fire Emissions (' + sYear + '-' + eYear + ')',
      titleTextStyle: {fontSize: '13.5'},
      vAxis: {
        title: 'Emissions (Tg ' + speciesLabel + ')',
        titleTextStyle: {fontSize: '12'},
        format: '####.#'
      },
      hAxis: {
        format:' ',
        viewWindowMode:'explicit',
        viewWindow: {
          min: ee.Date.fromYMD(sYear,1,1).advance(-1,'month').millis().getInfo(),
          max: ee.Date.fromYMD(sYear,1,1).advance(1,'month').millis().getInfo()
        }
      },
      series: colPal,
      height: '230px'
  });
  
  return avg_chart;
  
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

exports.lulc_colPal = ['#000000','#05450A','#92AF1F','#6A2424','#D99125','#F7E174','#FF0000'];
exports.lulcPeat_colPal = ['#000000','#05450A','#92AF1F','#6A2424','#D99125','#F7E174','#FF0000','#800080'];

// -----------------------------------
// Peatland distribution from GFEDv4s
// -----------------------------------
exports.peat = ee.Image(projFolder + 'GFEDv4s_peatCfrac');
