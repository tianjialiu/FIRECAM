/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var modisBA = ee.ImageCollection("MODIS/006/MCD64A1"),
    terraFRP = ee.ImageCollection("MODIS/006/MOD14A1"),
    aquaFRP = ee.ImageCollection("MODIS/006/MYD14A1"),
    basisRegions = ee.FeatureCollection("projects/GlobalFires/basisRegions_0p5deg");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ------------------------------------------------
// Export MODIS fire mask, at 1 km, to EE Assets
// using MODIS active fire (MxD14A1) and
// burned area (MCD64A1) datasets

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 13, 2019 
// ------------------------------------------------

// Set start and end year
var sYear = 2003; var eYear = 2017;

// Create a filter based on time range specified
var filterYr = ee.Filter.calendarRange(sYear,eYear,'year');

// Define spatial scale: 500 m and 1 km
var baScale = ee.Image(modisBA.first()).select('BurnDate');
var frpScale = ee.Image(terraFRP.first()).select('MaxFRP');

// Return a region mask at 1-km spatial scale
var ShpMask = ee.Image.constant(1).clip(basisRegions).reproject({
  crs: frpScale.projection(),
  scale: frpScale.projection().nominalScale()
});

// Upscale MCD64A1 from 500 m to 1 km using a fixed kernel
// to create a binary fire mask from MCD64A1 at 500 m
// (A simple reproject does not yield the desired effect.)
var BAmask = ee.Image(modisBA.filter(filterYr)
  .max()).select('BurnDate').gt(0).unmask(0).focal_max(1,'square','pixels',1,
  ee.Kernel.fixed(2,2,ee.List([ee.List([1,1]),ee.List([1,1])]),-1,-1))
  .reproject({crs: baScale.projection(), scale: baScale.projection().nominalScale()});
var BAmask = BAmask.reproject({crs: frpScale.projection(), scale: frpScale.projection().nominalScale()});

// Binary fire mask from MOD14A1 at 1 km
// using all fire pixels with nominal or high confidence
var TerraMask = ee.Image(terraFRP.filter(filterYr)
  .max()).select('FireMask').gt(7).unmask(0)
  .reproject({crs: frpScale.projection(), scale: frpScale.projection().nominalScale()});

// Binary fire mask from MYD14A1 at 1 km 
// using all fire pixels with nominal or high confidence
var AquaMask = ee.Image(aquaFRP.filter(filterYr)
  .max()).select('FireMask').gt(7).unmask(0)
  .reproject({crs: frpScale.projection(), scale: frpScale.projection().nominalScale()});

// Combine the fire masks from MxD14A1 and MCD64A1, 1 km
var fireMask = BAmask.add(TerraMask).add(AquaMask).gt(0)
  .updateMask(ShpMask).rename('FireMask');

// Export the fire mask to EE Assets
// at nominal 1-km spatial resolution in sinusoidal projection
Export.image.toAsset({
  image: fireMask.selfMask(),
  assetId: 'fireMask_1km',
  description: 'fireMask_1km',
  crs: 'SR-ORG:6974',
  crsTransform: [926.625433055833,0,-20015109.354,0,-926.625433055833,10007554.677003],
  region: basisRegions.geometry().bounds(),
  maxPixels: 1e12
});
