/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gfedPoly = ee.FeatureCollection("projects/GlobalFires/GFEDv4poly"),
    mod09ga = ee.ImageCollection("MODIS/006/MOD09GA"),
    myd09ga = ee.ImageCollection("MODIS/006/MYD09GA"),
    fireMask = ee.Image("projects/GlobalFires/fireMask_1km");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// -------------------------------------------------
// Export MODIS MOD09GA and MYD09GA cloud bits
// from the state_1km quality band as
// fractional cloud/haze cover
// gridded at 0.25deg x 0.25deg

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 13, 2019 
// -------------------------------------------------

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

// Define spatial scale: 1 km
var modisScale = ee.Image(mod09ga.first()).select('state_1km');

// Return a region mask at 1-km spatial scale
var ShpMask = ee.Image.constant(1).clip(Shp).reproject({
  crs: modisScale.projection(),
  scale: modisScale.projection().nominalScale()
});

// Extract QA bits ('MODIS QA Bands' example code from EE team)
var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    return image.select([0], [newName])
      .bitwiseAnd(pattern)
      .rightShift(start);
};

// Return QA bits as binary values of cloud/haze
var getCloudHaze = function(image) {
  // Select the QA band
  var QA = image.select('state_1km');

  // Get the cloud_state bits and find cloudy areas.
  var cloud = getQABits(QA, 0, 1, 'cloud_state')
    .expression("b(0) == 1 || b(0) == 2");
  
  var cloudShadow = getQABits(QA, 2, 2, 'cloud_shadow').eq(1);
  var land = getQABits(QA, 3, 5, 'land_water').eq(1);
  var aerosol = getQABits(QA, 6, 7, 'aerosol').eq(3);
  
  var cloudHazeImg = cloud.add(cloudShadow).add(aerosol)
    .updateMask(land).updateMask(fireMask).gt(0);
  return cloudHazeImg;
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
      .map(getCloudHaze);
      
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
      description: sat + '_CloudBits_' + inYear + '_' + inMonthStr + '_Basis_' + iBasisStr,
      folder: 'MxD09GA_CloudBits_Basis_1km',
      selectors: ['id','lc','mean']
    });
  }
}
