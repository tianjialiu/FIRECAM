/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var ADMShpDetailed = ee.FeatureCollection("USDOS/LSIB/2013"),
    ADMShpSimplified = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// *****************************************************************
// =================================================================
// ---------------- FIRECAM Custom Region Exports --------------- ||
// =================================================================
// *****************************************************************
/*
// Documentation: https://github.com/tianjialiu/FIRECAM
// Author: Tianjia Liu
// Last updated: September 18, 2018

// Purpose: explore regional differences in fire emissions from five
// global fire emissions inventories (GFED, FINN, GFAS, QFED, FEER)
// for six species (CO, CO2, CH4, OC, BC, PM2.5); export monthly
// and annual timeseries for a custom region

// 1. Enter input parameters below
// 2. Click 'Run' to initialize export tasks
// Note: tasks may take a long time if polygons are very detailed
*/
// --------------
// Input Params |
// --------------
// Region shapefile or 'feature'; the example here uses the
// Simplified Large Scale Internation Boundary Polygons (LSIB)
// in the GEE data catalog; the 'filterMetadata' function
// can be used to select a country_na ('name') or world region ('wld_rgn')
var regionShp = ADMShpSimplified.filterMetadata('country_na','equals','Indonesia'); 
var regionName = 'Indonesia'; // Name of region
var species = 'CO2'; // Species

// Inspect names of administrative boundaries shapefile
// Map.addLayer(ADMShpSimplified); 

// ---------------
// Global Params |
// ---------------
var projFolder = 'projects/GlobalFires/';
var sYear = 2003; var eYear = 2016;

var invNames = ['GFEDv4s','FINNv1p5','GFASv1p2','QFEDv2p5r1','FEERv1p0_G1p2'];
var bandNames = ['CO','CO2','CH4','OC','BC','PM2p5'];
var bandLabel = ee.List(['CO','CO2','CH4','OC','BC','PM2.5']);

var gfedBandNames = ['DM','CO','CO2','CH4','OC','BC','PM2/5'];
var gfasBandNames = ['APT','FRP','CO','CO2','CH4','OC','BC','PM2/5'];
var finnBandNames = ['BA','CO','CO2','CH4','OC','BC','PM2/5'];

var regionShp = ee.Feature(regionShp.union().first()); // can append .simplify(1e3) to simplify polygon
Map.addLayer(regionShp);

// ------------------------------------
// - - - - - - FIRECAM.js - - - - - - |
// ------------------------------------
// ----------------------------------
// Global Fire Emissions Inventories
// ----------------------------------
var gfedv4s = ee.ImageCollection(projFolder + 'GFEDv4s_sp');
var finnv1p5 = ee.ImageCollection(projFolder + 'FINNv1p5_sp');
var gfasv1p2 = ee.ImageCollection(projFolder + 'GFASv1p2_sp');
var qfedv2p5 = ee.ImageCollection(projFolder + 'QFEDv2p5r1_sp');
var feerv1p0_g1p2 = ee.ImageCollection(projFolder + 'FEERv1p0_G1p2_sp');

var aggProj = gfedv4s.first()
  .reproject({crs: 'EPSG:4326', crsTransform: [0.5,0,-180,0,-0.5,90]})
  .projection();

var getBand = function(imageList, iMonth, renameBands, species) {
  var image = ee.Image(imageList.get(iMonth));

  return ee.Image(image.select('.*_0-5deg').divide(1e9)
    .rename(renameBands).select(species)
    .reproject({crs: aggProj, scale: aggProj.nominalScale()})
    .copyProperties(image,['system:time_start']));
};

var getEmiByMonth = function(species) {
  
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

var getEmiTS = function(imageCol, timeFormat) {
  
  var emiTS = imageCol.toList(500,0)
    .map(function(image) {
      var sumEmi = ee.Image(image).reduceRegions({
        collection: regionShp,
        reducer: ee.Reducer.sum().unweighted(),
        crs: aggProj,
        crsTransform: [0.5,0,-180,0,-0.5,90]
      }).toList(1,0).get(0);
      
      var date = ee.Date(ee.Image(image).get('system:time_start')).format(timeFormat);
      sumEmi = ee.Feature(sumEmi).set('Time',date);
      
      return sumEmi;
  });
  
  return ee.FeatureCollection(emiTS);
};

var speciesIdx = bandNames.indexOf(species);
var speciesLabel = bandLabel.get(speciesIdx).getInfo();

var emiByMonth = getEmiByMonth(species);
var emiByYr = getEmiByYr(emiByMonth);

Export.table.toDrive({
  collection: getEmiTS(emiByYr, 'Y'),
  description: speciesLabel + '_Tg_Annual_' + regionName,
  selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
});
 
Export.table.toDrive({
  collection: getEmiTS(emiByMonth, 'Y-MM'),
  description: speciesLabel + '_Tg_Monthly_' + regionName,
  selectors: ['Time','GFEDv4s', 'FINNv1p5', 'GFASv1p2', 'QFEDv2p5r1', 'FEERv1p0_G1p2']
});

