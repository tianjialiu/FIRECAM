/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var modisBA = ee.ImageCollection("MODIS/006/MCD64A1"),
    gfedPoly = ee.FeatureCollection("projects/GlobalFires/GFEDv4poly");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ---------------------------------------------------
// Export MODIS burned area (MCD64A1) fragment
// statistics, gridded at 0.25deg x 0.25deg

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 15, 2019 
// ---------------------------------------------------

// Return feature collection of selected basis region
var Shp = gfedPoly.filterMetadata('lc','greater_than',0);

// Set start and end year
var sYear = 2003; var eYear = 2017;

// Define spatial scale: 500 m
var modisScale = ee.Image(modisBA.first()).select('BurnDate');

// Return burned area as burn dates
var getBA = function(image) {
  return image.select('BurnDate').unmask(0);
};

// Loop through all years and months
for (var inYear = sYear; inYear <= eYear; inYear++) {
  
  for (var inMonth = 1; inMonth <= 12; inMonth++) {
    
    // Create a filter based on the year and month
    var filterYr = ee.Filter.calendarRange(inYear,inYear,'year');
    var filterMon = ee.Filter.calendarRange(inMonth,inMonth,'month');
    
    // Return month as a string with a leading zero
    var inMonthStr = ee.Number(inMonth).format('%02d').getInfo();
    
    // MCD64A1 burned area, 500 m
    var firesBA = ee.Image(modisBA.filter(filterYr).filter(filterMon)
      .map(getBA).first());

    // Return MCD64A1 burned area with unique labels for
    // continguous patches
    // (maxSize of connectedComponents is 256 pixels)
    var connImg = firesBA.updateMask(firesBA)
      .connectedComponents(ee.Kernel.circle(1),256)
      .select('labels').unmask(0);
    
    // Account for large burn patches bigger than 256 pixels
    var largeConn = firesBA.gt(0).multiply(connImg.eq(0));
    
    // All burn patches
    var connAll = connImg.add(largeConn).multiply(firesBA.gt(0));
    
    // Output layers:
    // connCount = distinct burn patches
    // burnDay = distinct burn dates
    
    // Return statistics of all output layers as the total count
    // within each 0.25deg x 0.25deg grid cell
    var stats = connAll.selfMask().rename('connCount')
      .addBands(firesBA.selfMask().rename('burnDay'))
      .reduceRegions({
        collection: Shp,
        reducer: ee.Reducer.countDistinct(),
        crs: modisScale.projection(),
        scale: modisScale.projection().nominalScale()
      });
    
    // Export statistics to Google Drive as a csv file
    Export.table.toDrive({
      collection: stats,
      description: 'MCD64A1_ConnCount_' + inYear + '_' + inMonthStr,
      folder: 'MCD64A1_ConnCount_500m',
      selectors: ['id','lc','connCount','burnDay']
    });
  }
}