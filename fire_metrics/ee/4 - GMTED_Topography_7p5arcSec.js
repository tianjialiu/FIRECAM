/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gfedPoly = ee.FeatureCollection("projects/GlobalFires/GFEDv4poly"),
    srtm = ee.Image("USGS/GMTED2010"),
    mod44w = ee.ImageCollection("MODIS/006/MOD44W");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ---------------------------------------------------
// Export GMTED2010 topography variance
// statistics, gridded at 0.25deg x 0.25deg

// Author: Tianjia Liu (tianjialiu@g.harvard.edu)
// Last Updated: May 13, 2019 
// ---------------------------------------------------

var proj = srtm.projection();

// Loop through all basis regions
for (var iBasis = 1; iBasis <= 14; iBasis++) {
  
  var iBasisStr = ee.Number(iBasis).format('%02d').getInfo();

  var Shp = gfedPoly.filterMetadata('lc','equals',iBasis);
  
  var ShpMask = ee.Image.constant(1).clip(Shp).reproject({
    crs: proj, scale: proj.nominalScale()
  });
  
  // MOD44W Land/Water Mask
  var landMask = ee.Image(mod44w.first().select('water_mask')).eq(0).selfMask()
    .reproject({crs:proj, scale:proj.nominalScale()});

  // Calculate the topography variance using a square kernel with
  // a radius of 2 pixels [m^2]
  var srtmReg = srtm.updateMask(ShpMask);
  
  var srtm_sd = srtmReg.reduceNeighborhood(ee.Reducer.stdDev(),ee.Kernel.square(2))
    .reproject({crs:proj, scale:proj.nominalScale()});
  
  var srtm_var = srtm_sd.pow(2).updateMask(landMask)
    .reproject({crs:proj, scale:proj.nominalScale()});
  
  // Return statistics of all output layers as the mean
  // within each 0.25deg x 0.25deg grid cell
  var stats = srtm_var.reduceRegions({
    collection: Shp,
    reducer: ee.Reducer.mean(),
    crs: proj,
    scale: proj.nominalScale()
  });
  
  // Export statistics to Google Drive as a csv file
  Export.table.toDrive({
    collection: stats,
    description: 'GMTED2010_SRTM_m2_Basis_' + iBasisStr,
    folder: 'SRTM_Basis_7p5arcSec',
    selectors: ['id','lc','mean']
  });
}