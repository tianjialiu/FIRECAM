# -----------------------------------
# Global parameters for FIRECAM

# Author: Tianjia Liu
# Last Updated: May 14, 2019
# -----------------------------------

# ----- Open Packages -----
library("raster");library("rgeos");library("maptools");library("mapproj");
library("maps");library("rgdal");library("spdep");library("sp");library("fields")
library("plyr");library("rhdf5");library("RColorBrewer"); library("mapplots")
library("ncdf.tools"); library("ncdf4"); library("plyr"); library("dplyr")
library("rcartocolor")

# ----- Set home directory and subfolder paths -----
homeDir <- "/Users/TLiu/Google Drive/GlobalFires/"
setwd(homeDir)

outTabHome <- file.path(homeDir,"outputTables/")
geeHome <- file.path(homeDir,"gee/")
geeBasisHome <- file.path(homeDir,"gee_basis/")
plotHome <- file.path(homeDir,"plots/")
rasMapsHome <- file.path(homeDir,"RasterMaps/")
rasHome <- file.path(homeDir,"rasters/")

# ----- Parameters -----
sYear <- 2003; eYear <- 2017
xYears <- sYear:eYear
nYear <- length(xYears)

basis <- raster(file.path(rasHome,"basisRegions.tif"))

nLandPix <- 254969
nTotalPix <- length(basis)
nBasis <- 14
