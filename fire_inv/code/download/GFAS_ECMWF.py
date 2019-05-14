#!/usr/bin/env python
# ===========================================
# Download monthly GFASv1.2 files from ECMWF
# for given parameters and time periods
# ===========================================
# last updated: Feb 20, 2019
# Tianjia Liu

import os
 
from ecmwfapi import ECMWFDataServer
server = ECMWFDataServer()

paramNames = ["CO","BC","OC","NOx","SO2"]
xYears = range(2003,2004)
xMonths = range(1,13)

home_dir = '/Volumes/TLIU_DATA/FIRE_raw/GFASv1p2/'

# https://confluence.ecmwf.int/pages/viewpage.action?pageId=88247734
paramList = {
    "MAMI" : "119.210", # Mean altitude of maximum injection [m]
    "APT" : "120.210", # Altitude of plume top [m]
    "CO2" : "80.210", # Carbon Dioxide [kg m-2 s-1]
    "CO" : "81.210", # Carbon Monoxide [kg m-2 s-1]
    "CH4" : "82.210", # Methane [kg m-2 s-1]
    "NHMC" : "83.210", # Non-Methane Hydrocarbons [kg m-2 s-1]
    "H2" : "84.210", # Hydrogen [kg m-2 s-1]
    "NOx" : "85.210", # Nitrogen Oxides [kg m-2 s-1]
    "N2O" : "86.210", # Nitrous Oxide [kg m-2 s-1]
    "PM2p5" : "87.210", # Particulate Matter PM2.5 [kg m-2 s-1]
    "TPM" : "88.210", # Total Particulate Matter [kg m-2 s-1]
    "TC" : "89.210", # Total Carbon in Aerosols [kg m-2 s-1]
    "OC" : "90.210", # Organic Carbon [kg m-2 s-1]
    "BC" : "91.210", # Black Carbon [kg m-2 s-1]
    "C" : "92.210", # Burnt Carbon [kg m-2 s-1]
    "CR" : "100.210", # Combustion Rate [kg m-2 s-1]
    "SO2" : "102.210", # Sulfur Dioxide [kg m-2 s-1]
    "CH3OH" : "103.210", # Methanol [kg m-2 s-1]
    "C2H5OH" : "104.210", # Ethanol [kg m-2 s-1]
    "C3H8" : "105.210", # Propane [kg m-2 s-1]
    "C2H4" : "106.210", # Ethene [kg m-2 s-1]
    "C3H6" : "107.210", # Propene [kg m-2 s-1]
    "C5H8" : "108.210", # Isoprene [kg m-2 s-1]
    "Terpenes" : "109.210", # Terpenes (C5H8)n [kg m-2 s-1]
    "Toulene" : "110.210", # Toluene lump (C7H8+ C6H6 + C8H10) [kg m-2 s-1]
    "HiAlkenes" : "111.210", # Higher Alkenes (CnH2n, C>=4) [kg m-2 s-1]
    "HiAlkanes" : "112.210", # Higher Alkanes (CnH2n+2, C>=4) [kg m-2 s-1]
    "CH2O" : "113.210", # Formaldehyde [kg m-2 s-1]
    "C2H4O" : "114.210", # Acetaldehyde [kg m-2 s-1]
    "C3H6O" : "115.210", # Acetone [kg m-2 s-1]
    "NH3" : "116.210", # Ammonia [kg m-2 s-1]
    "C2H6S" : "117.210", # Dimethyl Sulfide (DMS) [kg m-2 s-1]
    "C2H6" : "118.210", # Ethane [kg m-2 s-1]
    "C7H8" : "231.210", # Toluene [kg m-2 s-1]
    "C6H6" : "232.210", # Benzene [kg m-2 s-1]
    "C8H10" : "233.210", # Xylene [kg m-2 s-1]
    "C4H8" : "234.210", # Butene [kg m-2 s-1]
    "C5H10" : "235.210", # Pentene [kg m-2 s-1]
    "C6H12" : "236.210", # Hexene [kg m-2 s-1]
    "C8H16" : "237.210", # Octene [kg m-2 s-1]
    "C4H10" : "238.210", # Butane [kg m-2 s-1]
    "C5H12" : "239.210", # Pentane [kg m-2 s-1]
    "C6H14" : "240.210", # Hexane[kg m-2 s-1]
    "C7H16" : "241.210", # Heptane [kg m-2 s-1]
    "VA" : "79.210", # Viewing angle of observation [degrees]
    "OFF" : "97.210", # Fraction of area observed [dimensionless]
    "NoFRP" : "98.210", # Positive FRP pixels per grid cell
    "FRP" : "99.210", # Fire Radiative Power [W m-2]
    "MaxFRP" : "101.210" # Maximum Fire Radiative Power [W]
}

def calc_nDays(year, month):
    "This function prints the number of days in a given month"
    
    nDaysL = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] #leap year
    nDaysNL = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] #non-leap year

    if year % 4 == 0:
        return nDaysL[month-1]
    else:
        return nDaysNL[month-1]
    
for inYear in xYears:
    folder_path = home_dir + str(inYear)
    
    if not os.path.exists(folder_path):
        os.mkdir(folder_path)
    
    os.chdir(folder_path)
    
    for inMonth in xMonths:
        for iParam in range(0,len(paramNames)):
            
            nDays = str(calc_nDays(inYear, inMonth))
            
            paramName = paramNames[iParam]
            paramKey = paramList.values()[paramList.keys().index(paramName)]
            
            outputName = "GFASv1.2_" + str(inYear) + "_" + "%02d" % (inMonth,) + "_" + paramName + ".nc"
            dateRange = str(inYear) + "-" + "%02d" % (inMonth,) + "-01/to/" + str(inYear) + "-" + "%02d" % (inMonth,) + "-" + nDays
            
            server.retrieve({
                "class": "mc",
                "dataset": "cams_gfas",
                "date": dateRange,
                "expver": "0001",
                "levtype": "sfc",
                "param": paramKey,
                "step": "0-24",
                "stream": "gfas",
                "target": outputName,
                "format": "netcdf",
                "time": "00",
                "type": "ga",
            })
