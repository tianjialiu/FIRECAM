/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gfedPoly = ee.FeatureCollection("projects/GlobalFires/GFEDv4poly"),
    mod09ga = ee.ImageCollection("MODIS/006/MOD09GA"),
    myd09ga = ee.ImageCollection("MODIS/006/MYD09GA"),
    fireMask = ee.Image("projects/GlobalFires/fireMask_500m");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ------------------------------------------------
// Export MODIS MOD09GA and MYD09GA 
// fractional cloud/haze cover, calculated
// from surface reflectance of Red/SWIR bands,
// following Xiang et al. (2013),
// gridded at 0.25deg x 0.25deg

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 13, 2019 
// ------------------------------------------------

// Set input dataset (MYD09GA - Aqua, MOD09GA - Terra):
var inSatCol = myd09ga;
var sat = 'MYD09GA';

// Set basis region using its id (1-14)
var iBasis = 1;

// Return the basis id as a string with a leading zero
var iBasisStr = ee.Number(iBasis).format('%02d').getInfo();

// Return feature collection of selected basis region
var Shp = gfedPoly.filterMetadata('lc','equals',iBasis);

// Set start and end year
var sYear = 2003; var eYear = 2017;

// Define spatial scale: 500 m
var modisScale = ee.Image(mod09ga.first()).select('sur_refl_b07');

// Return a region mask at 500-m spatial scale
var ShpMask = ee.Image.constant(1).clip(Shp).reproject({
  crs: modisScale.projection(),
  scale: modisScale.projection().nominalScale()
});

// Return binary values of cloud/haze, as calulated
// from surface reflectance
var getCloud = function(image) {
  var imageRegion = image.updateMask(ShpMask);
  var simpleCloud1 = imageRegion.normalizedDifference(['sur_refl_b07','sur_refl_b01']).lt(0);
  var simpleCloud2 = imageRegion.select('sur_refl_b01').multiply(0.0001).gt(0.3);
 
  var cloudMask = simpleCloud1.add(simpleCloud2).updateMask(fireMask).gt(0);
  return cloudMask;
};

// Loop through all years and months
for (var inYear = sYear; inYear <= eYear; inYear++) {
  
  for (var inMonth = 1; inMonth <= 12; inMonth++) {
    
    // Create a filter based on the year and month
    var filterYr = ee.Filter.calendarRange(inYear,inYear,'year');
    var filterMon = ee.Filter.calendarRange(inMonth,inMonth,'month');
    
    // Return month as a string with a leading zero
    var inMonthStr = ee.Number(inMonth).format('%02d').getInfo();
    
    // Calculate the fractional cloud/haze cover in a given month
    var cloud = inSatCol.filter(filterYr).filter(filterMon)
      .map(getCloud);
    
    var cloudFrac = ee.Image(cloud.mean());
    
    // Return statistics of all output layers as the mean
    // within each 0.25deg x 0.25deg grid cell
    var stats = cloudFrac
      .reduceRegions({
        collection: Shp,
        reducer: ee.Reducer.mean(),
        crs: modisScale.projection(),
        scale: modisScale.projection().nominalScale()
      });
    
    // Export statistics to Google Drive as a csv file
    Export.table.toDrive({
      collection: stats,
      description: sat + '_Cloud_' + inYear + '_' + inMonthStr + '_Basis_' + iBasisStr,
      folder: 'MxD09GA_Cloud_Basis_500m',
      selectors: ['id','lc','mean']
    });
  }
}
