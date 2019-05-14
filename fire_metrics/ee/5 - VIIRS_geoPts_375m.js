/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gfedPoly = ee.FeatureCollection("projects/GlobalFires/GFEDv4poly"),
    modisBA = ee.ImageCollection("MODIS/006/MCD64A1"),
    terraFRP = ee.ImageCollection("MODIS/006/MOD14A1"),
    aquaFRP = ee.ImageCollection("MODIS/006/MYD14A1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// --------------------------------------------------
// Export VIIRS (VNP14IMGML) active fire geolocation
// and gridded MODIS fire datasets (MxD14A1)
// statistics, gridded at 0.25deg x 0.25deg

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 13, 2019 
// -------------------------------------------------

// Set basis region using its id (1-14)
var iBasis = 1;

// Return the basis id as a string with a leading zero
var iBasisStr = ee.Number(iBasis).format('%02d').getInfo();

// Return feature collection of selected basis region
var Shp = gfedPoly.filterMetadata('lc','equals',iBasis);

// Set start and end year
var sYear = 2012; var eYear = 2017;

// Define spatial scale: 500 m and 1 km
var modisScale = ee.Image(modisBA.first()).select('BurnDate');
var modisScale1km = ee.Image(terraFRP.first()).select('MaxFRP');

// Define VIIRS spatial scale [m]
var viirs_spScale = 375;

// Return maximum FRP, unmasking unburned areas as 0
var getFRP = function(image) {
  return image.select('MaxFRP').unmask(0);
};

// Return burned area as binary values
var getBA = function(image) {
  return image.select('BurnDate').gt(0).unmask(0);
};

// Simplify output features by only saving the centroid
var getCentroid = function(feature) {return feature.centroid();};

// Loop through all years, months and basis regions
for (var inYear = sYear; inYear <= eYear; inYear++) {
  
  for (var inMonth = 1; inMonth <= 12; inMonth++) {
    
    // Return month as a string with a leading zero
    var inMonthStr = ee.Number(inMonth).format('%02d').getInfo();
    
    // Create a filter based on the year and month
    var filterYr = ee.Filter.calendarRange(inYear,inYear,'year');
    var filterMon = ee.Filter.calendarRange(inMonth,inMonth,'month');
    
    // MODIS MCD64A1 burned area, reprojected to 375 m
    var burnAll = ee.Image(modisBA.filter(filterYr).filter(filterMon)
      .map(getBA).first())
      .reproject({crs: modisScale.projection(), scale: viirs_spScale});
    
    // MODIS MOD14A1 FRP, reprojected to 375 m
    var firesTerra = ee.Image(terraFRP.filter(filterYr).filter(filterMon)
      .map(getFRP).sum()).rename('FRP_Terra')
      .reproject({crs: modisScale.projection(), scale: viirs_spScale});
    
    // MODIS MYD14A1 FRP, reprojected to 375 m
    var firesAqua = ee.Image(aquaFRP.filter(filterYr).filter(filterMon)
      .map(getFRP).sum()).rename('FRP_Aqua')
      .reproject({crs: modisScale.projection(), scale: viirs_spScale});
    
    // Read monthly VNP14IMGML feature collections
    var viirsPts = ee.FeatureCollection('projects/GlobalFires/VNP14IMGML/VNP14IMGML_' +
      inYear + '_' + inMonthStr);
    
    // Reduce the spatial footprint of active fire geolocations to FRP
    var viirsAll = viirsPts.reduceToImage(['FRP'], 'mean')
      .select([0]).unmask(0)
      .reproject({crs: modisScale.projection(), scale: viirs_spScale});
    
    // All MODIS fire observations
    var modisAll = firesTerra.add(firesAqua).add(burnAll).gt(0);
    
    // Output area layers [km^2]:
    // AF = all VIIRS active fires
    // AFnoAqua = VIIRS active fires outside MODIS Aqua active fires
    // AFnoBA = VIIRS active fires outside MODIS burned area
    // AFnoMODIS = VIIRS active fires outside MODIS fire observations
    var AF = viirsAll.rename('AF');
    var AFnoAqua = viirsAll.multiply(firesAqua.eq(0)).rename('AFnoAqua');
    var AFnoBA = viirsAll.multiply(burnAll.eq(0)).rename('AFnoBA');
    var AFnoMODIS = viirsAll.multiply(modisAll.eq(0)).rename('AFnoMODIS');
    
    // Calculate the area of each pixel [km^2]
    var areaBands = AF.gt(0).addBands(AFnoAqua.gt(0))
      .addBands(AFnoBA.gt(0)).addBands(AFnoMODIS.gt(0))
      .multiply(ee.Image.pixelArea()).multiply(1/1000/1000);
    
    // Output FRP layers [MW]:
    // FRP = VIIRS FRP
    // FRPnoAqua = VIIRS FRP outside MODIS Aqua FRP
    // FRPnoBA = VIIRS FRP outside MODIS burned area
    // FRPnoMODIS = VIIRS FRP outside MODIS fire observations
    var frpBands = AF.rename('FRP')
      .addBands(AFnoAqua.rename('FRPnoAqua'))
      .addBands(AFnoBA.rename('FRPnoBA'))
      .addBands(AFnoMODIS.rename('FRPnoMODIS'));
    
    // Return statistics of all output layers as the sum
    // within each 0.25deg x 0.25deg grid cell
    var stats = frpBands.addBands(areaBands)
      .reduceRegions({
          collection: Shp,
          reducer: ee.Reducer.sum(),
          crs: modisScale.projection(),
          scale: viirs_spScale
      });

    // Export statistics to Google Drive as a csv file
    Export.table.toDrive({
      collection: stats,
      description: 'VNP14IMGML_FRP_' + inYear + '_' + inMonthStr + '_Basis_' + iBasisStr,
      folder: 'VNP14IMGML_FRP_Basis_375m',
      selectors: ['id','lc','FRP','FRPnoAqua','FRPnoBA','FRPnoMODIS',
        'AF','AFnoAqua','AFnoBA','AFnoMODIS']
    });
  }
}