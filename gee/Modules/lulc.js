/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var mcd12q1 = ee.ImageCollection("MODIS/006/MCD12Q1"),
    peat = ee.Image("projects/GlobalFires/GFEDv4s_peatCfrac");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ------------------------------
// MODIS MCD12Q1 aggregated LULC
// based on FINNv1.0 delineation
// ------------------------------
/*
1: Evergreen Needleleaf Forests (BOR)
2: Evergreen Broadleaf Forests (TROP)
3: Deciduous Needleleaf Forests (BOR)
4: Deciduous Broadleaf Forests (TEMP)
5: Mixed Forests (TEMP)
6: Closed Shrublands (WS)
7: Open Shrublands (WS)
8: Woody Savannas (WS)
9: Savannas (SG)
10: Grasslands (SG)
11: Permanent Wetlands (SG)
12: Croplands (CROP)
13: Urban and Built-up Lands
14: Cropland/Natural Vegetation Mosaics (SG)
15: Permanent Snow and Ice
16: Barren (SG)
17: Water Bodies
*/

exports.getLULCmap = function(mapYr) {
  var mcd12q1Yr = ee.Image(ee.ImageCollection('MODIS/006/MCD12Q1')
    .filter(ee.Filter.calendarRange(mapYr,mapYr,'year')).first())
    .select('LC_Type1');

  var BOR = mcd12q1Yr.eq(1).add(mcd12q1Yr.eq(3)).gt(0);
  var TROP = mcd12q1Yr.eq(2).multiply(2);
  var TEMP = mcd12q1Yr.eq(4).add(mcd12q1Yr.eq(5)).gt(0).multiply(3);
  var WS = mcd12q1Yr.eq(6).add(mcd12q1Yr.eq(7)).add(mcd12q1Yr.eq(8))
  .gt(0).multiply(4);
  var SG = mcd12q1Yr.eq(9).add(mcd12q1Yr.eq(10)).add(mcd12q1Yr.eq(11))
  .add(mcd12q1Yr.eq(14)).add(mcd12q1Yr.eq(16)).gt(0).multiply(5);
  var CROP = mcd12q1Yr.eq(12).multiply(6);
  var URBAN = mcd12q1Yr.eq(13).multiply(7);
  
  return BOR.add(TROP).add(TEMP).add(WS).add(SG)
    .add(CROP).add(URBAN).selfMask();
};

// -----------------------------------
// Peatland distribution from GFEDv4s
// -----------------------------------
exports.peat = peat;
