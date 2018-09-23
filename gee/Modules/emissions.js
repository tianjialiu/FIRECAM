/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var metric1 = ee.Image("users/tl2581/RelFireConfidence/RFCM1_BA_AFA_discrepancy"),
    metric2 = ee.Image("projects/GlobalFires/RelFireConfidence/RFCM2_cloud_haze_burden"),
    metric3 = ee.Image("projects/GlobalFires/RelFireConfidence/RFCM3_fireBAComponentSize"),
    metric4 = ee.Image("projects/GlobalFires/RelFireConfidence/RFCM4_topo_variance"),
    metric5 = ee.Image("projects/GlobalFires/RelFireConfidence/RFCM5_additionalFRP_VIIRS"),
    gfedv4s = ee.ImageCollection("projects/GlobalFires/GFEDv4s_sp"),
    finnv1p5 = ee.ImageCollection("projects/GlobalFires/FINNv1p5_sp"),
    gfasv1p2 = ee.ImageCollection("projects/GlobalFires/GFASv1p2_sp"),
    qfedv2p5 = ee.ImageCollection("projects/GlobalFires/QFEDv2p5r1_sp"),
    feerv1p0_g1p2 = ee.ImageCollection("projects/GlobalFires/FEERv1p0_G1p2_sp"),
    gfedv4_ancill = ee.Image("projects/GlobalFires/GFEDv4ancill"),
    basisRegions = ee.FeatureCollection("projects/GlobalFires/basisRegions_0p5deg");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ----------------------------------
// Relative Fire Confidence Metrics
// ----------------------------------
// Metric 1: BA-AFA discrepancy
exports.RFCM1 = metric1;
// Metric 2: FRP-weighted cloud/haze burden on satellite observing conditions
exports.RFCM2 = metric2;
// Metric 3: burn size and fragmentation
exports.RFCM3 = metric3;
// Metric 4: topography variance
exports.RFCM4 = metric4;
// Metric 5: additional small fires from VIIRS
exports.RFCM5 = metric5;

// ----------------------------------
// Global Fire Emissions Inventories
// ----------------------------------
var sYear = 2003; var eYear = 2016;

var invNames = ['GFEDv4s','FINNv1p5','GFASv1p2','QFEDv2p5r1','FEERv1p0_G1p2'];
var bandNames = ['CO','CO2','CH4','OC','BC','PM2/5'];
var bandLabel = ee.List(['CO','CO2','CH4','OC','BC','PM2.5']);

var gfedBandNames = ['DM','CO','CO2','CH4','OC','BC','PM2/5'];
var gfasBandNames = ['APT','FRP','CO','CO2','CH4','OC','BC','PM2/5'];
var finnBandNames = ['BA','CO','CO2','CH4','OC','BC','PM2/5'];

var aggProj = gfedv4s.first()
  .reproject({crs: 'EPSG:4326', crsTransform: [0.5,0,-180,0,-0.5,90]})
  .projection();
  
exports.basisRegions = basisRegions;

var getBand = function(imageList, iMonth, renameBands, species) {
  var image = ee.Image(imageList.get(iMonth));

  return ee.Image(image.select('.*_0-5deg').divide(1e9)
    .rename(renameBands).select(species)
    .reproject({crs: aggProj, scale: aggProj.nominalScale()})
    .copyProperties(image,['system:time_start']));
};

exports.getEmiByMonth = function(species, sYear, eYear) {
  
  var nMonth = (eYear-sYear+1)*12-1;
  var filterAllYrs = ee.Filter.calendarRange(sYear,eYear,'year');
  
  var gfedList = gfedv4s.filter(filterAllYrs).toList(500,0);
  var finnList = finnv1p5.filter(filterAllYrs).toList(500,0);
  var gfasList = gfasv1p2.filter(filterAllYrs).toList(500,0);
  var qfedList = qfedv2p5.filter(filterAllYrs).toList(500,0);
  var feerList = feerv1p0_g1p2.filter(filterAllYrs).toList(500,0);
  
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
  
exports.getEmiByYr = function(emiByMonth, sYear, eYear) {

  var emiByYr = ee.List.sequence(sYear,eYear,1).map(function(iYear) {
    var filterYr = ee.Filter.calendarRange(iYear,iYear,'year');

    var emiAll = ee.Image(emiByMonth.filter(filterYr).sum())
      .reproject({crs: aggProj, scale: aggProj.nominalScale()})
      .set('system:time_start',ee.Date.fromYMD(iYear,1,1).millis());
    
      return emiAll;
  });

  return ee.ImageCollection(emiByYr);
};

exports.getRegionShp = function(basisID) {
  return basisRegions.filterMetadata('basis','equals',basisID);
};

var colPal = {
        0: {color: '777777'},
        1: {color: '87CEEB'},
        2: {color: 'FF0000'},
        3: {color: 'FDB751'},
        4: {color: '800080'},
      };

exports.plotEmiTS = function(plotPanel, imageCol, regionShp,
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
      title: timePeriod + ' Regional Fire Emissions',
      vAxis: {title: ['Emissions (Tg ' + speciesLabel + ')']},
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
  sYear, eYear, sMonth, eMonth, nLines) {
  
  return emiTS.setOptions({
      title: timePeriod + ' Regional Fire Emissions',
      vAxis: {title: ['Emissions (Tg ' + speciesLabel + ')']},
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

exports.plotEmiBar = function(plotPanel, imageCol, regionShp,
  speciesLabel, timePeriod) {
  
  var ts_chart = ui.Chart.image.series({
    imageCollection: imageCol
      .select(invNames,['b1','b2','b3','b4','b5'])
      .set('xName','Avg., 2003-2016'),
    region: regionShp,
    reducer: ee.Reducer.sum().unweighted(),
    scale: aggProj.nominalScale(),
    xProperty: 'xName',
  }).setChartType('ColumnChart')
  .setSeriesNames(['GFEDv4s','FINNv1.5','GFASv1.2','QFEDv2.5r1','FEERv1.0-G1.2'])
    .setOptions({
      title: 'Average ' + timePeriod + ' Regional Fire Emissions (2003-2016)',
      vAxis: {title: ['Emissions (Tg ' + speciesLabel + ')']},
      hAxis: {gridlines: {count: 0}},
      height: '230px',
      series: colPal
    });
    
  return ts_chart;
};
