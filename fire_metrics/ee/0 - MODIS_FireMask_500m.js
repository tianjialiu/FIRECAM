/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var modisBA = ee.ImageCollection("MODIS/006/MCD64A1"),
    terraFRP = ee.ImageCollection("MODIS/006/MOD14A1"),
    aquaFRP = ee.ImageCollection("MODIS/006/MYD14A1"),
    basisRegions = ee.FeatureCollection("projects/GlobalFires/basisRegions_0p5deg");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ------------------------------------------------
// Export MODIS fire mask, at 500 m, to EE Assets
// using MODIS active fire (MxD14A1) and
// burned area (MCD64A1) datasets

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 13, 2019 
// ------------------------------------------------

// Set start and end year
var sYear = 2003; var eYear = 2017;

// Create a filter based on time range specified
var filterYr = ee.Filter.calendarRange(sYear,eYear,'year');

// Define spatial scale: 500 m
var baScale = ee.Image(modisBA.first()).select('BurnDate');

// Return a region mask at 500-m spatial scale
var ShpMask = ee.Image.constant(1).clip(basisRegions).reproject({
  crs: baScale.projection(),
  scale: baScale.projection().nominalScale()
});

// Binary fire mask from MCD64A1 at 500 m
var BAmask = ee.Image(modisBA.filter(filterYr)
  .max()).select('BurnDate').gt(0).unmask(0)
  .reproject({crs: baScale.projection(), scale: baScale.projection().nominalScale()});

// Binary fire mask from MOD14A1 at 500 m
// after downscaling from 1 km to 500 m
// using all fire pixels with nominal or high confidence
var TerraMask = ee.Image(terraFRP.filter(filterYr)
  .max()).select('FireMask').gt(7).unmask(0)
  .reproject({crs: baScale.projection(), scale: baScale.projection().nominalScale()});

// Binary fire mask from MYD14A1 at 500 m
// after downscaling from 1 km to 500 m
// using all fire pixels with nominal or high confidence
var AquaMask = ee.Image(aquaFRP.filter(filterYr)
  .max()).select('FireMask').gt(7).unmask(0)
  .reproject({crs: baScale.projection(), scale: baScale.projection().nominalScale()});

// Combine the fire masks from MxD14A1 and MCD64A1, 500 m
var fireMask = BAmask.add(TerraMask).add(AquaMask).gt(0)
  .updateMask(ShpMask).rename('FireMask');

// Export the fire mask to EE Assets
// at nominal 500-m spatial resolution in sinusoidal projection
Export.image.toAsset({
  image: fireMask.selfMask(),
  assetId: 'fireMask_500m',
  description: 'fireMask_500m',
  crs: 'SR-ORG:6974',
  crsTransform: [463.312716528,0,-20015109.354,0,-463.312716527,10007554.677],
  region: basisRegions.geometry().bounds(),
  maxPixels: 1e12
});
