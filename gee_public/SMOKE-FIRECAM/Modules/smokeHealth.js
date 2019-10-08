/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gpw2005 = ee.Image("users/smokepolicytool/IDN_adm/GPW2005");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ==========================
// Calculate Health Impacts
// ==========================

// Population, 2005, Gridded Population of the World (GPW) & UN-adjusted
var population = {
  'earlyneonatal': {'Indonesia': 9.263730e4, 'Malaysia': 8.895073e3, 'Singapore': 7.186277e2},
  'lateneonatal': {'Indonesia': 2.752874e5, 'Malaysia': 2.665513e4, 'Singapore': 2.153700e3}, 
  'postneonatal':  {'Indonesia': 4.347065e6, 'Malaysia': 4.303966e5, 'Singapore': 3.439537e4},
  '1-4': {'Indonesia': 1.792731e7, 'Malaysia': 1.973355e6, 'Singapore': 1.613114e5},
  'adult': {'Indonesia': 115498024.0, 'Malaysia': 12979736.0, 'Singapore': 2394994.0}
};

// Mortality Rate, 2005, from Global Burden of Disease project
var mortality_rate = {
  'earlyneonatal': {'Indonesia': 2449.447916, 'Malaysia': 307.822903, 'Singapore': 138.625514},
  'lateneonatal': {'Indonesia': 855.656908, 'Malaysia': 81.248922, 'Singapore': 78.940460},
  'postneonatal': {'Indonesia': 515.194821, 'Malaysia': 47.331711, 'Singapore': 21.578431},
  '1-4': {'Indonesia': 37.127353, 'Malaysia': 5.014201, 'Singapore': 3.114068},
  'adult': {'Indonesia': 1011.9828048701391, 'Malaysia': 815.8937975144682, 'Singapore': 655.2733557232674}
};

// Concentration response function transitions from linear to exponential at 50 μg/m3
var breakPt = 50;

// Adult (age 25+) attributable mortality calculated from annual smoke PM2.5
var getAttributableMortalityAdult = function(receptor, exposure) {
  
  var age = 'adult';
  var concentrationResponse = function(dExposure) {
    var FullLin25CI = function(x) {return 0.0097 * x};
    var FullLin = function(x) {return 0.0103 * x};
    var FullLin975CI = function(x) {return 0.0111 * x};
    
    var LinTo50 = function(x) {
      if (x > breakPt) {return FullLin(breakPt)} else {return FullLin(x)}
    };

    var Lin50HalfLin = function(x) {
      if (x <= breakPt) {return FullLin(x)} else {return (FullLin(x) + FullLin(breakPt)) * 0.5;}
    };

    var FullLog = function(x) {return 1 - (1 / Math.exp(0.00575 * 1.8 * x))};
    var FullLog225CI = function(x) {return 1 - (1 / Math.exp(((0.0059 * 1.8) - (1.96 * 0.004)) * x))};
    var FullLog2 = function(x) {return 1 - (1 / Math.exp(0.0059 * 1.8 * x))};
    var FullLog2975CI = function(x) {return 1 - (1 / Math.exp(((0.0059 * 1.8) + (1.96 * 0.004)) * x))};
   
    var Lin50Log = function(x) {
      if (x <= breakPt) {return FullLin(x)} else {
        return FullLin(breakPt) + FullLog(x) - FullLog(breakPt)}};

      if (dExposure <= breakPt) {
        var Lin50Log225CI = FullLin25CI(dExposure);
        var Lin50Log2 = FullLin(dExposure);
        var Lin50Log2975CI = FullLin975CI(dExposure);
      } else {
        var Lin50Log225CI = FullLin25CI(breakPt) + FullLog225CI(dExposure) - FullLog225CI(breakPt);
        var Lin50Log2 = FullLin(breakPt) + FullLog2(dExposure) - FullLog2(breakPt);
        var Lin50Log2975CI = FullLin975CI(breakPt) + FullLog2975CI(dExposure) - FullLog2975CI(breakPt);
      }
    return [Lin50Log225CI, Lin50Log2, Lin50Log2975CI];
  };
    
    var CRall = concentrationResponse(exposure);
    var CR_25 = CRall[0]; var CR = CRall[1]; var CR_97 = CRall[2];
    var total_deaths_25 = mortality_rate[age][receptor] * population[age][receptor] * CR_25 / 1e5; 
    var total_deaths = mortality_rate[age][receptor] * population[age][receptor] * CR / 1e5;
    var total_deaths_97 = mortality_rate[age][receptor] * population[age][receptor] * CR_97 / 1e5; 

    return [total_deaths_25, total_deaths, total_deaths_97];
};

// Children (age 0-4) attributable mortality calculated from smoke PM2.5
var getAttributableMortalityChild = function(receptor, exposure, age) {
    
  var concentrationResponse = function(dExposure) {
    var FullLin25CI = function(x) {return 0.003 * x};
    var FullLin = function(x) {return 0.012 * x};
    var FullLin975CI = function(x) {return 0.03 * x};
    
    var FullLog = function(x) {return 1 - (1/Math.exp(0.012 * x))};
    var FullLog25CI = function(x) {return 1 - (1/Math.exp(0.003 * x))};
    var FullLog975CI = function(x) {return 1 - (1/Math.exp(0.03 * x))};

    if (dExposure <= breakPt) {
      var Lin50Log25CI = FullLin25CI(dExposure);
      var Lin50Log = FullLin(dExposure);
      var Lin50Log975CI = FullLin975CI(dExposure);
    } else {
      var Lin50Log25CI = FullLin25CI(breakPt) + FullLog25CI(dExposure) - FullLog25CI(breakPt);
      var Lin50Log = FullLin(breakPt) + FullLog(dExposure) - FullLog(breakPt);
      var Lin50Log975CI = FullLin975CI(breakPt) + FullLog975CI(dExposure) - FullLog975CI(breakPt);
    }
    return [Lin50Log25CI, Lin50Log, Lin50Log975CI];
  };
    
    var CRall = concentrationResponse(exposure);
    var CR_25 = CRall[0]; var CR = CRall[1]; var CR_97 = CRall[2];
    var total_deaths_25 = mortality_rate[age][receptor] * population[age][receptor] * CR_25 / 1e5; 
    var total_deaths = mortality_rate[age][receptor] * population[age][receptor] * CR / 1e5;
    var total_deaths_97 = mortality_rate[age][receptor] * population[age][receptor] * CR_97 / 1e5; 

    return [total_deaths_25, total_deaths, total_deaths_97];
};

// =============
// Display Maps
// =============
var crsLatLon = 'EPSG:4326';
var ds_gridRes = [0.008333333333333333,0,95,0,-0.008333333333333333,6];

exports.populationDensity = gpw2005.select('b1').rename('popDensity')
  .reproject({crs: 'EPSG:4326', crsTransform: ds_gridRes});
exports.baselineMortality = gpw2005.select('b13').rename('baselineMortality')
  .reproject({crs: 'EPSG:4326', crsTransform: ds_gridRes});

exports.mortalityColRamp = ['#FFFFFF','#EDF8E9','#C7E9C0','#A1D99B',
  '#74C476','#41AB5D','#238B45','#005A32'];
exports.popColRamp = ['#FFFFFF','#F2F0F7','#DADAEB','#BCBDDC',
  '#9E9AC8','#807DBA','#6A51A3','#4A1486'];

// =============
// Display Text
// =============
// Calculate attributable mortality by age group
// from mean monthly PM2.5 exposure for the scenario year
var calcAllMortality = function(PMts, receptor, scenario) {
  var PMtsVal = ee.Number(PMts.aggregate_mean('Smoke_PM2p5')).getInfo();
  
  var earlyNeonatal_mortality = getAttributableMortalityChild(receptor, PMtsVal, 'earlyneonatal');
  var lateNeonatal_mortality = getAttributableMortalityChild(receptor, PMtsVal, 'lateneonatal');
  var postNeonatal_mortality = getAttributableMortalityChild(receptor, PMtsVal, 'postneonatal');
  var age14_mortality = getAttributableMortalityChild(receptor, PMtsVal, '1-4');
  var adult_mortality = getAttributableMortalityAdult(receptor, PMtsVal, 'adult');
  
  var mortality = [earlyNeonatal_mortality, lateNeonatal_mortality, postNeonatal_mortality,
    age14_mortality, adult_mortality];

  var formatCI = function(CImean,CIlow,CIhigh) {
    var formatNum2Str = function(inNum) {
      return ee.Number(inNum).round().format('%.0f').getInfo();
    };
    return formatNum2Str(CImean) + ' (' + formatNum2Str(CIlow) + '-' + formatNum2Str(CIhigh) + ')';
  };

  var getSum_age0_1 = function(idx) {
    return mortality[0][idx] + mortality[1][idx] + mortality[2][idx];
  };
  
  var getSum_age0_4 = function(idx) {
    return mortality[0][idx] + mortality[1][idx] + mortality[2][idx] + mortality[3][idx];
  };
  
  var age0_1 = formatCI(getSum_age0_1(1),getSum_age0_1(0),getSum_age0_1(2));
  var age0_4 = formatCI(getSum_age0_4(1),getSum_age0_4(0),getSum_age0_4(2));
  var age1_4 = formatCI(mortality[3][1],mortality[3][0],mortality[3][2]);
  var age25 = formatCI(mortality[4][1],mortality[4][0],mortality[4][2]);

  return ee.Feature(null, {'Scenario': scenario, 'Age 0-1': age0_1, 'Age 1-4': age1_4,
    'Age 0-4': age0_4, 'Age 25+': age25});
};

exports.getMortalityChart = function(PMts, receptor, plotPanel) {
  var mortalityCI = calcAllMortality(PMts, receptor, 'Current');
  
  plotPanel.add(ui.Label('Attributable Mortality (Excess Deaths)',
    {margin: '-10px 0px 8px 25px', padding: '0px 0px 2px 0px', stretch: 'horizontal', fontSize: '15px', fontWeight: 'bold'}));
  plotPanel.add(ui.Label('Adults All-Cause: ' + mortalityCI.get('Age 25+').getInfo(),
    {margin: '-10px 0px -5px 25px', padding: '10px 0px 8px 0px', stretch: 'horizontal'}));
  plotPanel.add(ui.Label('Children Acute Lower Respiratory Infection (ALRI): ' + mortalityCI.get('Age 0-4').getInfo(),
    {margin: '0px 0px 8px 25px', padding: '0px 0px 8px 0px', stretch: 'horizontal'}));
};
