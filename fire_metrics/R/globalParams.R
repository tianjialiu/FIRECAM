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
shapeHome <- file.path(homeDir,"shapefiles/")
plotHome <- file.path(homeDir,"plots/")
rasMapsHome <- file.path(homeDir,"RasterMaps/")
rasHome <- file.path(homeDir,"rasters/")
qgisHome <- file.path(homeDir,"qgis/")

# ----- Parameters -----
sYear <- 2003; eYear <- 2017
xYears <- sYear:eYear
nYear <- length(xYears)

nLandPix <- 254969
nBasis <- 14

basis <- raster(file.path(shapeHome,"basisRegions.tif"))
LCtypes <- c("AGRI","BORF","DEFO","PEAT","SAVA","TEMF")
