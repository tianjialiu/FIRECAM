/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gfedPoly = ee.FeatureCollection("projects/GlobalFires/GFEDv4poly"),
    terraFRP = ee.ImageCollection("MODIS/006/MOD14A1"),
    aquaFRP = ee.ImageCollection("MODIS/006/MYD14A1"),
    modisBA = ee.ImageCollection("MODIS/006/MCD64A1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ---------------------------------------------------
// Export MODIS FRP (MxD14A1) and burned area
// (MCD64A1) statistics, gridded at 0.25deg x 0.25deg

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 13, 2019 
// ---------------------------------------------------

// Set basis region using its id (1-14)
var iBasis = 1;

// Return the basis id as a string with a leading zero
var iBasisStr = ee.Number(iBasis).format('%02d').getInfo();

// Return feature collection of selected basis region
var Shp = gfedPoly.filterMetadata('lc','equals',iBasis);

// Set start and end year
var sYear = 2003; var eYear = 2017;

// Define spatial scale: 500 m and 1 km
var frpScale = ee.Image(terraFRP.first()).select('MaxFRP');
var baScale = ee.Image(modisBA.first()).select('BurnDate');

// Return maximum FRP, unmasking unburned areas as 0
var getFRP = function(image) {
  return image.select('MaxFRP').unmask(0);
};

// Return burned area as binary values
var getBA = function(image) {
  return image.select('BurnDate').gt(0).unmask(0);
};

// Loop through all years and months
for (var inYear = sYear; inYear <= eYear; inYear++) {

  for (var inMonth = 1; inMonth <= 12; inMonth++) {
    
    // Create a filter based on the year and month
    var filterYr = ee.Filter.calendarRange(inYear,inYear,'year');
    var filterMon = ee.Filter.calendarRange(inMonth,inMonth,'month');
    
    // Return month as a string with a leading zero
    var inMonthStr = ee.Number(inMonth).format('%02d').getInfo();
    
    // Output FRP layers [MW]:
    // FRP_Terra = Terra FRP
    // FRP_Aqua = Aqua FRP
    // FRP_Total = Total Terra + Aqua FRP
    
    // MOD14A1 monthly FRP sum, 1 km
    var firesTerra = ee.Image(terraFRP
      .filter(filterYr).filter(filterMon)
      .map(getFRP).sum()).rename('FRP_Terra');
    
    // MYD14A1 monthly FRP sum, 1 km
    var firesAqua = ee.Image(aquaFRP
      .filter(filterYr).filter(filterMon)
      .map(getFRP).sum()).rename('FRP_Aqua');
    
    // Total MOD14A1 + MYD14A1 FRP sum, 1 km
    var firesAll = firesTerra.add(firesAqua).rename('FRP_Total');
    
    // Combine MOD14A1, MYD14A1, Total FRP as separate bands
    // in an image and apply the scaling factor of 0.1
    // to convert FRP to MW
    var frpBands = firesTerra.addBands(firesAqua)
      .addBands(firesAll).multiply(0.1);
    
    // MCD64A1 burned area, upscaled to 1 km
    var firesBA = ee.Image(modisBA
      .filter(filterYr).filter(filterMon)
      .map(getBA).max()).focal_max(1,'square','pixels',1,
      ee.Kernel.fixed(2,2,ee.List([ee.List([1,1]),ee.List([1,1])]),-1,-1))
      .reproject({crs: baScale.projection(), scale: baScale.projection().nominalScale()});
      
    var firesBA_1km = firesBA
      .reproject({crs: frpScale.projection(), scale: frpScale.projection().nominalScale()});
      
    // Output area layers [km^2]:
    // AF = all active fires
    // BA = all burned area
    // AFandBA = overlap of active fires and burned area
    // AFnoBA = active fires but no burned area
    // BAnoAF = burned area but no active fires
    var AF = firesAll.gt(0).rename('AF');
    var BA = firesBA_1km.gt(0).rename('BA');
    var AFandBA = AF.multiply(BA).rename('AFandBA');
    var AFnoBA = AF.multiply(BA.eq(0)).rename('AFnoBA');
    var BAnoAF = AF.eq(0).multiply(BA).rename('BAnoAF');
    
    // Calculate the area of each pixel [km^2]
    var areaBands = AF.addBands(BA).addBands(AFandBA)
      .addBands(AFnoBA).addBands(BAnoAF)
      .multiply(ee.Image.pixelArea()).multiply(1/1000/1000)
      .reproject({crs: frpScale.projection(), scale: frpScale.projection().nominalScale()});
    
    // Return statistics of all output layers as the sum
    // within each 0.25deg x 0.25deg grid cell
    var stats = frpBands.addBands(areaBands)
      .reduceRegions({
          collection: Shp,
          reducer: ee.Reducer.sum(),
          crs: frpScale.projection(),
          scale: frpScale.projection().nominalScale()
      });
    
    // Export statistics to Google Drive as a csv file
    Export.table.toDrive({
      collection: stats,
      description: 'MxD14A1_FRP_' + inYear + '_' + inMonthStr + '_Basis_' + iBasisStr,
      folder: 'MxD14A1_FRP_Basis_1km',
      selectors: ['id','lc','FRP_Terra','FRP_Aqua','FRP_Total',
        'AF','BA','AFandBA','AFnoBA','BAnoAF']
    });
  }
}
