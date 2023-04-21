#!/usr/bin/env python
# ========================================================
# Download daily GFASv1.2 files in monthly chunks
# from the CDS API for given parameters and time periods
# ========================================================
# last updated: Apr 13, 2023
# Tianjia Liu

import os
import cdsapi
c = cdsapi.Client()

paramNames = ["CO","CO2","CH4","OC","BC","PM2p5"]
xYears = range(2003,2023)
xMonths = range(1,13)

home_dir = '/Volumes/TLIU_DATA/FIRE_raw/GFASv1p2/'

# https://confluence.ecmwf.int/display/CKB/CAMS+global+biomass+burning+emissions+based+on+fire+radiative+power+%28GFAS%29%3A+data+documentation
paramList = {
    "ABT": "altitude_of_plume_bottom", # Altitude of plume bottom [m]
    "APT" : "altitude_of_plume_top", # Altitude of plume top [m]
    "MAMI" : "mean_altitude_of_maximum_injection", # Mean altitude of maximum injection [m]
    "INJH": "injection_height", # Injection height (from IS4FIRES) [m]
    "CO2" : "wildfire_flux_of_carbon_dioxide", # Carbon Dioxide [kg m-2 s-1]
    "CO" : "wildfire_flux_of_carbon_monoxide", # Carbon Monoxide [kg m-2 s-1]
    "CH4" : "wildfire_flux_of_methane", # Methane [kg m-2 s-1]
    "NHMC" : "wildfire_flux_of_non_methane_hydrocarbons", # Non-Methane Hydrocarbons [kg m-2 s-1]
    "H2" : "wildfire_flux_of_hydrogen", # Hydrogen [kg m-2 s-1]
    "NOx" : "wildfire_flux_of_nitrogen_oxides", # Nitrogen Oxides [kg m-2 s-1]
    "N2O" : "wildfire_flux_of_nitrous_oxide", # Nitrous Oxide [kg m-2 s-1]
    "PM2p5" : "wildfire_flux_of_particulate_matter_d_2_5_µm", # Particulate Matter PM2.5 [kg m-2 s-1]
    "TPM" : "wildfire_flux_of_total_particulate_matter", # Total Particulate Matter [kg m-2 s-1]
    "TC" : "wildfire_flux_of_total_carbon_in_aerosols", # Total Carbon in Aerosols [kg m-2 s-1]
    "OC" : "wildfire_flux_of_organic_carbon", # Organic Carbon [kg m-2 s-1]
    "BC" : "wildfire_flux_of_black_carbon", # Black Carbon [kg m-2 s-1]
    "C" : "wildfire_overall_flux_of_burnt_carbon", # Burnt Carbon [kg m-2 s-1]
    "CR" : "wildfire_combustion_rate", # Combustion Rate [kg m-2 s-1]
    "SO2" : "wildfire_flux_of_sulphur_dioxide", # Sulfur Dioxide [kg m-2 s-1]
    "CH3OH" : "wildfire_flux_of_methanol", # Methanol [kg m-2 s-1]
    "C2H5OH" : "wildfire_flux_of_ethanol", # Ethanol [kg m-2 s-1]
    "C3H8" : "wildfire_flux_of_propane", # Propane [kg m-2 s-1]
    "C2H4" : "wildfire_flux_of_ethene", # Ethene [kg m-2 s-1]
    "C3H6" : "wildfire_flux_of_propene", # Propene [kg m-2 s-1]
    "C5H8" : "wildfire_flux_of_isoprene", # Isoprene [kg m-2 s-1]
    "Terpenes" : "wildfire_flux_of_terpenes", # Terpenes (C5H8)n [kg m-2 s-1]
    "Toulene" : "wildfire_flux_of_toluene_lump", # Toluene lump (C7H8+ C6H6 + C8H10) [kg m-2 s-1]
    "HiAlkenes" : "wildfire_flux_of_higher_alkenes", # Higher Alkenes (CnH2n, C>=4) [kg m-2 s-1]
    "HiAlkanes" : "wildfire_flux_of_higher_alkanes", # Higher Alkanes (CnH2n+2, C>=4) [kg m-2 s-1]
    "CH2O" : "wildfire_flux_of_formaldehyde", # Formaldehyde [kg m-2 s-1]
    "C2H4O" : "wildfire_flux_of_acetaldehyde", # Acetaldehyde [kg m-2 s-1]
    "C3H6O" : "wildfire_flux_of_acetone", # Acetone [kg m-2 s-1]
    "NH3" : "wildfire_flux_of_ammonia", # Ammonia [kg m-2 s-1]
    "C2H6S" : "wildfire_flux_of_dimethyl_sulfide", # Dimethyl Sulfide (DMS) [kg m-2 s-1]
    "C2H6" : "wildfire_flux_of_ethane", # Ethane [kg m-2 s-1]
    "C7H8" : "wildfire_flux_of_toluene", # Toluene [kg m-2 s-1]
    "C6H6" : "wildfire_flux_of_benzene", # Benzene [kg m-2 s-1]
    "C8H10" : "wildfire_flux_of_xylene", # Xylene [kg m-2 s-1]
    "C4H8" : "wildfire_flux_of_butenes", # Butene [kg m-2 s-1]
    "C5H10" : "wildfire_flux_of_pentenes", # Pentene [kg m-2 s-1]
    "C6H12" : "wildfire_flux_of_hexene", # Hexene [kg m-2 s-1]
    "C8H16" : "wildfire_flux_of_octene", # Octene [kg m-2 s-1]
    "C4H10" : "wildfire_flux_of_butanes", # Butane [kg m-2 s-1]
    "C5H12" : "wildfire_flux_of_pentanes", # Pentane [kg m-2 s-1]
    "C6H14" : "wildfire_flux_of_hexanes", # Hexane[kg m-2 s-1]
    "C7H16" : "wildfire_flux_of_heptane", # Heptane [kg m-2 s-1]
    "OFF" : "wildfire_fraction_of_area_observed", # Fraction of area observed [dimensionless]
    "FRP" : "wildfire_radiative_power", # Fire Radiative Power [W m-2]
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
            paramKey = list(paramList.values())[list(paramList.keys()).index(paramName)]
            
            outputName = "GFASv1.2_" + str(inYear) + "_" + "%02d" % (inMonth,) + "_" + paramName + ".nc"
            dateRange = str(inYear) + "-" + "%02d" % (inMonth,) + "-01/" + str(inYear) + "-" + "%02d" % (inMonth,) + "-" + nDays
            
            c.retrieve(
                'cams-global-fire-emissions-gfas',
                {
                'format': 'netcdf',
                'date': dateRange,
                'variable': paramKey,
                },
                outputName)
