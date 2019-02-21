# =====================================
# Area per grid cell, m2 (generic)
# for any specific spatial resolution
# =====================================
# last updated: Feb 20, 2019
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xres <- 0.25
yres <- xres

area_nc <- function(xres, yres) {
  
  timestamp(prefix=paste("Started...","##------ "))
  message("TASKS: Area - ",xres," deg x ",yres," deg")
  
  # directories to output NetCDFs
  outputFolder <- file.path(outputDir,"ancill")
  
  # area in m2
  area_m2 <- raster::area(raster(res=c(xres,yres)))*1000*1000
  
  # Setting dimensions
  cellCoord <- coordinates(area_m2)
  cellLon <- as.numeric(cellCoord[,1])
  cellLat <- as.numeric(cellCoord[,2])
  
  LonVec <- unique(cellLon)
  LatVec <- sort(unique(cellLat))
  nLon <- length(LonVec)
  nLat <- length(LatVec)
  
  area_m2 <- matrix(as.vector(area_m2),nrow=nLon,ncol=nLat)[,order(unique(cellLat))]
  
  # -----------------
  # Construct NetCDF
  # -----------------
  dir.create(outputFolder,showWarnings=F)
  setwd(outputFolder)
  
  # initialize NetCDF
  ncfname <- paste0("area_",xres,"deg_x_",yres,"deg.nc")
  ifelse(file.exists(ncfname),file.remove(ncfname),F)
  
  # long, lat
  lonDim <- ncdim_def("lon","degrees",as.double(LonVec),longname="longitude") 
  latDim <- ncdim_def("lat","degrees",as.double(LatVec),longname="latitude") 
  
  # input species
  ncvar <- ncvar_def("area","m2",list(lonDim,latDim),fillval,
                     "area per grid cell",compression=3)
  
  # add variables to NetCDF
  ncout <- nc_create(ncfname,ncvar,force_v4=T)
  ncvar_put(ncout,ncvar,area_m2)
  ncatt_put(ncout,"lon","axis","lon")
  ncatt_put(ncout,"lat","axis","lat")
  
  nc_close(ncout)
  
  timestamp(prefix=paste("Finished! ","##------ "))
}

cat("\014")
area_nc(xres, yres)

exit()
