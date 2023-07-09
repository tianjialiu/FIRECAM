/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gcArea = ee.Image("users/smokepolicytool/area_m2/GC_grid"),
    IDNprovS = ee.FeatureCollection("users/smokepolicytool/IDN_adm/IDN_adm1_simplified");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ===============================
// Calculate OC+BC Emissions and
// Monthly Smoke PM2.5
// ===============================
var outputRegion = ee.Geometry.Rectangle([95,-11,141,6],'EPSG:4326',false);
var projFolder = 'users/smokepolicytool/';
var globalFiresFolder = 'projects/GlobalFires/';
var adjointFolder = projFolder + 'GC_adjoint_sensitivities/';

var crsLatLon = 'EPSG:4326';
var sens_gridRes = [0.6666666666666667,0,69.66666666666667,0,-0.5,55.25];

var invNames = ['GFEDv4s','FINNv1p5','GFASv1p2',
  'QFEDv2p5r1','FEERv1p0_G1p2'];
exports.invNames = invNames;

var invDispNames = ['GFEDv4s','FINNv1.5','GFASv1.2',
  'QFEDv2.5r1','FEERv1.0-G1.2'];
exports.invDispNames = invDispNames;

var invList = {
  'GFEDv4s': 'GFEDv4s',
  'FINNv1.5': 'FINNv1p5',
  'GFASv1.2': 'GFASv1p2',
  'QFEDv2.5r1': 'QFEDv2p5r1',
  'FEERv1.0-G1.2': 'FEERv1p0_G1p2'
};
exports.invList = invList;

var adjResList = {
  'GFEDv4s': '0p25deg',
  'FINNv1p5': '0p1deg',
  'GFASv1p2': '0p1deg',
  'QFEDv2p5r1': '0p1deg',
  'FEERv1p0_G1p2': '0p1deg'
};

var getInEmiInv = function(inEmiInvName) {
  return ee.ImageCollection(globalFiresFolder + inEmiInvName);
};

var getGridScale = function(inEmiInv) {
  return ee.Image(inEmiInv.select('OC').first()).projection();
};

var getGridArea = function(inEmiInv) {
  return ee.Image(inEmiInv.select('OC').first()).unmask(0).gte(0)
    .multiply(ee.Image.pixelArea());
};

var getRegionMask = function(gridScale) {
  return IDNprovS.reduceToImage(['ID'],'max').gte(0)
  .reproject({crs: gridScale, scale: gridScale.nominalScale()});
};

exports.getInvName = function(invName) {
  return invList[invName];
};

var sMonth = 7; var eMonth = 10; // Fire season (Jul-Oct)

// Conversion factors
var sf_timeSteps = 24 * 24 * 3; // account for number of physical time steps in adjoint simulation run
var sf_timeDay = 24 * 60 * 60; // seconds per day

// Find 3-letter code to using full name of receptor
var receptorList = {
  'Singapore': 'SGP',
  'Indonesia': 'IDN',
  'Malaysia': 'MYS'
};

var getReceptorCode = function(receptor) {
  return receptorList[receptor];
};

// Retrieve adjoint sensitivities for input receptor
var getSensitivity = function(receptor,inAdjointFolder) {
  return ee.ImageCollection(inAdjointFolder + getReceptorCode(receptor) + '_adjointSens_monthly');
};

// Reduces and converts an image to a feature
var imageToFeature = function(inImage,inRegion,gridScale) {
  var inImageCol = inImage.reduceRegions({
    collection: inRegion,
    reducer: ee.Reducer.sum().unweighted(),
    crs: gridScale,
    scale: gridScale.nominalScale()
  }).first();
  return ee.Feature(inImageCol);
};

// Monthly average OC + BC emissions (μg/m2/s)
var getEmissMon = function(inEmiInvName,inMonth,inYear,metYear,inSens) {
  var inEmiInv = getInEmiInv(inEmiInvName); 
  
  var gridScale = getGridScale(inEmiInv);
  var gridArea = getGridArea(inEmiInv);
  var regionMask = getRegionMask(gridScale);
  
  var filterYr_adj = ee.Filter.calendarRange(metYear,metYear,'year');
  var filterYr = ee.Filter.calendarRange(inYear,inYear,'year');
  var filterMon = ee.Filter.calendarRange(inMonth,inMonth,'month');
  
  // Emissions (kg)
  var emissMon = ee.Image(inEmiInv.filter(filterYr).filter(filterMon).first());
  
  // Sensitivity, monthly accumulation
  var sensMon = ee.Image(inSens.filter(filterYr_adj).filter(filterMon).first());
  var nDays = ee.Number(sensMon.get('ndays'));
  
  // OC, BC (kg)
  var oc_emiss = emissMon.select('OC');
  var bc_emiss = emissMon.select('BC');    
  
  // OC + BC conversion from (kg/grid cell/month) to (μg/m2/s)
  var emissMonTotal = oc_emiss.add(bc_emiss).multiply(regionMask)
    .divide(gridArea).multiply(1e9).divide(nDays).divide(sf_timeDay)
    .reproject({crs: gridScale, scale: gridScale.nominalScale()});

  return emissMonTotal;
};

// Smoke PM2.5 exposure (μg/m3), monthly [Emissions Rate x Sensitivity]
var getEmissReceptorMon = function(inEmiInvName,inMonth,inYear,metYear,inSens) {
  var inEmiInv = getInEmiInv(inEmiInvName);
  
  var gridScale = getGridScale(inEmiInv);
  var gridArea = getGridArea(inEmiInv);
  var regionMask = getRegionMask(gridScale);
  
  var filterYr_adj = ee.Filter.calendarRange(metYear,metYear,'year');
  var filterYr = ee.Filter.calendarRange(inYear,inYear,'year');
  var filterMon = ee.Filter.calendarRange(inMonth,inMonth,'month');
   
  // Emissions (kg)
  var emissMon = ee.Image(inEmiInv.filter(filterYr).filter(filterMon).first());

  // Sensitivity, monthly
  var sensMon = ee.Image(inSens.filter(filterYr_adj).filter(filterMon).first());
  var nDays = ee.Number(sensMon.get('ndays'));
    
  // OC, BC (kg)
  var oc_emiss = emissMon.select('OC');
  var bc_emiss = emissMon.select('BC');  
  
  // Split into GEOS-Chem hydrophobic and hydrophilic fractions
  var oc_phobic = oc_emiss.multiply(0.5 * 2.1);
  var oc_philic = oc_emiss.multiply(0.5 * 2.1);

  var bc_phobic = bc_emiss.multiply(0.8);
  var bc_philic = bc_emiss.multiply(0.2);
    
  var emiss_philic = oc_philic.add(bc_philic).rename('b1');
  var emiss_phobic = oc_phobic.add(bc_phobic).rename('b2');
  
  // 1. Convert OC + BC emissions from kg/grid cell/month to μg/m2/day
  var emissPart = emiss_philic.addBands(emiss_phobic)
    .multiply(1e9).divide(gridArea).divide(nDays)
    .reproject({crs: gridScale, scale: gridScale.nominalScale()});
    
  // 2. Convert downscaled accumulated monthly sensitivity (0.25deg) from
  // (μg/m3)/(kg/grid cell/timestep) to (μg/m3)/(μg/m2/day)
  var sensPart = sensMon.multiply(gridArea).multiply(1e-9)
    .divide(sf_timeSteps).divide(nDays)
    .reproject({crs: gridScale, scale: gridScale.nominalScale()});
    
  // 3. Multiply OC + BC emissions rate by sensitivity
  // for smoke PM2.5 concentrations (μg m-3)
  var emissReceptorMon = emissPart.multiply(sensPart).reduce(ee.Reducer.sum())
    .multiply(regionMask).reproject({crs: gridScale, scale: gridScale.nominalScale()});
  
  return emissReceptorMon;
};

// Smoke PM2.5 exposure (μg/m3), monthly time series
var getPM = function(inEmiInvName,inputYear,metYear,receptor) {
  var adjRes = adjResList[inEmiInvName];
  var adjointFolder_ds = projFolder + 'GC_adjoint_sensitivities_' + adjRes + '/';
  var inSens = getSensitivity(receptor,adjointFolder_ds);
  
  var inEmiInv = getInEmiInv(inEmiInvName); 
  var gridScale = getGridScale(inEmiInv);
  
  var emissReceptor = ee.List.sequence(1,12,1).map(function(iMonth) {
    var emissReceptorMon = getEmissReceptorMon(inEmiInvName,iMonth,inputYear,metYear,inSens);
    
    return imageToFeature(emissReceptorMon,outputRegion,gridScale)
      .select(['sum'],[inEmiInvName])
      .set('system:time_start',ee.Date.fromYMD(inputYear,iMonth,1).millis());
  });
  return(ee.FeatureCollection(emissReceptor));
};

exports.getPMinv = function(inputYear,metYear,receptor) {
    
  var PMts_GFED = getPM('GFEDv4s',inputYear,metYear,receptor);
  var PMts_FINN = getPM('FINNv1p5',inputYear,metYear,receptor);
  var PMts_GFAS = getPM('GFASv1p2',inputYear,metYear,receptor);
  var PMts_QFED = getPM('QFEDv2p5r1',inputYear,metYear,receptor);
  var PMts_FEER = getPM('FEERv1p0_G1p2',inputYear,metYear,receptor);
  
  var emissReceptor = ee.List.sequence(1,12,1).map(function(iMonth) {
    var filterMon = ee.Filter.calendarRange(iMonth,iMonth,'month');
    
    var PMmon_GFED = ee.Feature(PMts_GFED.filter(filterMon).first()).get('GFEDv4s');
    var PMmon_FINN = ee.Feature(PMts_FINN.filter(filterMon).first()).get('FINNv1p5');
    var PMmon_GFAS = ee.Feature(PMts_GFAS.filter(filterMon).first()).get('GFASv1p2');
    var PMmon_QFED = ee.Feature(PMts_QFED.filter(filterMon).first()).get('QFEDv2p5r1');
    var PMmon_FEER = ee.Feature(PMts_FEER.filter(filterMon).first()).get('FEERv1p0_G1p2');
    
    var PMtsMon = ee.Feature(null, {GFEDv4s: PMmon_GFED, FINNv1p5: PMmon_FINN,
      GFASv1p2: PMmon_GFAS, QFEDv2p5r1: PMmon_QFED, FEERv1p0_G1p2: PMmon_FEER});
    
    return PMtsMon.set('system:time_start',ee.Date.fromYMD(inputYear,iMonth,1).millis());
  });
  return(ee.FeatureCollection(emissReceptor));
};

exports.getPMavg = function(PMtsInv,inputYear,metYear) {
  var PMtsInvFS = PMtsInv.filter(ee.Filter.calendarRange(sMonth,eMonth,'month'));
  
  var PMavg_GFED = PMtsInvFS.aggregate_mean('GFEDv4s');
  var PMavg_FINN = PMtsInvFS.aggregate_mean('FINNv1p5');
  var PMavg_GFAS = PMtsInvFS.aggregate_mean('GFASv1p2');
  var PMavg_QFED = PMtsInvFS.aggregate_mean('QFEDv2p5r1');
  var PMavg_FEER = PMtsInvFS.aggregate_mean('FEERv1p0_G1p2');

  var PMtsInvAvgAll = ee.Feature(null, {GFEDv4s: PMavg_GFED, FINNv1p5: PMavg_FINN,
    GFASv1p2: PMavg_GFAS, QFEDv2p5r1: PMavg_QFED, FEERv1p0_G1p2: PMavg_FEER,
    xName: inputYear + ' + ' + metYear + ' met'
  });

  return PMtsInvAvgAll;
};

// =============
// Display Maps
// =============
// Sensitivity, hydrophilic only, Jul-Oct average (μg m-3/g m-2 s-1)
// Adjoint hydrophilic and hydrophobic sensitivities have similar spatial variability
exports.getSensMap = function(metYear,receptor) {
  var inSens = getSensitivity(receptor,adjointFolder);
  var filterYr = ee.Filter.calendarRange(metYear,metYear,'year');
  var filterMon = ee.Filter.calendarRange(sMonth,eMonth,'month');
  
  var sensFilter = inSens.filter(filterYr).filter(filterMon);
  
  var sensAvg = sensFilter.map(function(sensMon) {
      var nDays = ee.Number(sensMon.get('ndays'));
      return sensMon.multiply(gcArea).divide(nDays).multiply(1e-3)
        .divide(sf_timeSteps).multiply(sf_timeDay)
        .reproject({crs: crsLatLon, crsTransform: sens_gridRes});
    });
  
  return ee.ImageCollection(sensAvg).mean().rename(['hydrophilic','hydrophobic']).select('hydrophilic')
    .reproject({crs: crsLatLon, crsTransform: sens_gridRes});
};

exports.sensColRamp = ['#FFFFFF','#C7E6F8','#8DBEE2','#5990BB','#64A96C','#A9CB65',
  '#F4D46A','#E58143','#D14D36','#B1322E','#872723'];

// PM2.5 exposure, Jul-Oct average (μg m-3)
exports.getPMmap = function(inEmiInvName,inputYear,metYear,receptor) {
  var inEmiInv = getInEmiInv(inEmiInvName);
  
  var adjRes = adjResList[inEmiInvName];
  var gridScale = getGridScale(inEmiInv);
  
  var adjointFolder_ds = projFolder + 'GC_adjoint_sensitivities_' + adjRes + '/';
  var inSens = getSensitivity(receptor,adjointFolder_ds);
  
  var emissReceptor = ee.List.sequence(sMonth,eMonth,1).map(function(iMonth) {
    var emissReceptorMon = getEmissReceptorMon(inEmiInvName,iMonth,inputYear,metYear,inSens);
      
    return emissReceptorMon.rename('smoke_PM2p5')
      .set('system:time_start',ee.Date.fromYMD(inputYear,iMonth,1).millis());
  });

  return(ee.ImageCollection(emissReceptor).mean()
    .reproject({crs: gridScale, scale: gridScale.nominalScale()}));
};

exports.PMColRamp = ['#FFFFFF','#FBC127','#F67D15','#D44842',
  '#9F2963','#65146E','#280B54','#000000'];

// OC + BC Emissions, Jul-Oct average (μg m-2 s-1)
exports.getEmissMap = function(inEmiInvName,inputYear,metYear,receptor) {
  var inSens = getSensitivity(receptor,adjointFolder);
  var inEmiInv = getInEmiInv(inEmiInvName);

  var gridScale = getGridScale(inEmiInv);
  
  var emiss = ee.List.sequence(sMonth,eMonth,1).map(function(iMonth) {
    var emissMon = getEmissMon(inEmiInvName,iMonth,inputYear,metYear,inSens);
      
    return emissMon.rename('oc_bc_emiss')
      .set('system:time_start',ee.Date.fromYMD(inputYear,iMonth,1).millis());
  });

  return ee.ImageCollection(emiss).mean()
    .reproject({crs: gridScale, scale: gridScale.nominalScale()});
};

exports.emissColRamp = ['#FFFFFF','#FFFFB2','#FED976','#FEB24C','#FD8D3C',
  '#FC4E2A','#E31A1C','#B10026'];

// ===============
// Display Charts
// ===============
var colPal = {
  0: {color: '777777'},
  1: {color: '87CEEB'},
  2: {color: 'FF0000'},
  3: {color: 'FDB751'},
  4: {color: '800080'},
};

// Smoke PM2.5 (μg m-3) time series, monthly average
exports.getPMtsChart = function(PMtsInv) {
  return ui.Chart.feature.byFeature({
    features: PMtsInv,
    xProperty: 'system:time_start',
    yProperties: invNames
  }).setChartType('LineChart')
    .setSeriesNames(invDispNames)
    .setOptions({
      title: 'Smoke PM2.5 Exposure',
      titleTextStyle: {fontSize: '13.5'},
      hAxis: {'format':'MMM'},
      vAxis: {
        title: 'Smoke PM2.5 (μg/m³)',
        titleTextStyle: {fontSize: '12'}
      },
      lineWidth: 2,
      pointSize: 5,
      series: colPal,
      height: '230px'
    });
};

exports.getPMavgChart = function(PMtsAvg) {
  return ui.Chart.feature.byFeature({
    features: PMtsAvg,
    xProperty: 'xName',
    yProperties: invNames
  }).setChartType('ColumnChart')
    .setSeriesNames(invDispNames)
    .setOptions({
      title: 'Smoke PM2.5 Exposure',
      titleTextStyle: {fontSize: '13'},
      vAxis: {
        title: 'Jul-Oct Avg. Smoke PM2.5 (μg/m³)',
        titleTextStyle: {fontSize: '11.5'}
      },
      lineWidth: 2,
      pointSize: 5,
      series: colPal,
      height: '230px'
    });
};

// Contribution of PM2.5 exposure by Indonesian province
exports.getPMContrByProvChart = function(inEmiInvName,PMmap) {
  var inEmiInv = getInEmiInv(inEmiInvName);
  var gridScale = getGridScale(inEmiInv);
  
  var PMprov = PMmap.reduceRegions({
    collection: IDNprovS,
    reducer: ee.Reducer.sum().unweighted(),
    crs: gridScale,
    scale: gridScale.nominalScale()
  });

  var PMProvChart = ui.Chart.feature.byFeature(
    PMprov.sort('sum',false),'NAME','sum')
    .setChartType('PieChart')
    .setOptions({
      title: 'Smoke PM2.5 Contribution by Province',
      titleTextStyle: {fontSize: '13'},
      legend: 'NAME_1',
    });
  return PMProvChart;
};

// =============
// Display Text
// =============

// Jul-Oct total OC & BC emissions (Tg)
exports.getEmissTotal = function(inEmiInvName,inputYear,metYear,inSpecies) {
  var inEmiInv = getInEmiInv(inEmiInvName);
  var adjRes = adjResList[inEmiInvName];
  
  var gridScale = getGridScale(inEmiInv);
  var regionMask = getRegionMask(gridScale);
  
  var filterYr = ee.Filter.calendarRange(inputYear,inputYear,'year');
  
  var emissPartTotal = ee.List.sequence(sMonth,eMonth,1)
    .map(function(iMonth) {
      var filterMon = ee.Filter.calendarRange(iMonth,iMonth,'month');
      
      // Emissions (kg)
      var emissMon = ee.Image(inEmiInv.filter(filterYr).filter(filterMon).first());

      // OC, BC (kg)
      var oc_emiss = emissMon.select('OC');
      var bc_emiss = emissMon.select('BC');  
      
      // Convert OC, BC from kg to Tg
      var oc_bc_emiss = oc_emiss.addBands(bc_emiss).updateMask(regionMask)
        .select(inSpecies).multiply(1e-9)
        .reproject({crs: gridScale, scale: gridScale.nominalScale()});

      return imageToFeature(oc_bc_emiss,outputRegion,gridScale);
    });
   
  return ee.Number(ee.FeatureCollection(emissPartTotal)
    .aggregate_sum('sum')).format('%.2f');
};

// Assign default adjoint year based on rainfall
exports.closestMetYear = {
  1981: 2007,
  1982: 2006,
  1983: 2007,
  1984: 2005,
  1985: 2005,
  1986: 2007,
  1987: 2006,
  1988: 2008,
  1989: 2008,
  1990: 2009,
  1991: 2006,
  1992: 2009,
  1993: 2006,
  1994: 2006,
  1995: 2007,
  1996: 2008,
  1997: 2006,
  1998: 2008,
  1999: 2005,
  2000: 2007,
  2001: 2009,
  2002: 2006,
  2003: 2007,
  2004: 2006,
  2005: 2005,
  2006: 2006,
  2007: 2007,
  2008: 2008,
  2009: 2009,
  2010: 2008,
  2011: 2009,
  2012: 2007,
  2013: 2005,
  2014: 2009,
  2015: 2006,
  2016: 2008,
  2017: 2008,
  2018: 2009,
  2019: 2006,
  2020: 2008,
  2021: 2008,
  2022: 2008
};
