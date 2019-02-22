# =====================================
# Area per grid cell, m2 (generic)
# for any specific spatial resolution
# =====================================
# last updated: Feb 22, 2019
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xres <- 0.1
yres <- xres
outputType <- "tif"

area_pro <- function(xres, yres, outputType="tif") {
  
  timestamp(prefix=paste("Started...","##------ "))
  message("TASKS: Area - ",xres," deg x ",yres," deg")
  
  # directories to output NetCDFs, GeoTiffs
  if (outputType == "tif") {outputFolder <- file.path(outputDir_tif,"ancill")}
  if (outputType == "nc") {outputFolder <- file.path(outputDir_nc,"ancill")}
  
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
  
  if (outputType == "nc") {
    area_m2 <- matrix(as.vector(area_m2),nrow=nLon,ncol=nLat)[,order(unique(cellLat))]
  }
  
  # --------
  # Output
  # --------
  dir.create(outputFolder,showWarnings=F,recursive=T)
  setwd(outputFolder)
  
  outname <- paste0("area_",xres,"deg_x_",yres,"deg")
  
  # -----------------
  # Save Geotiff
  # -----------------
  if (outputType == "tif") {
    writeRaster(area_m2,paste0(outname,".tif"),format="GTiff",overwrite=T)
  }
  
  # -----------------
  # Save NetCDF
  # -----------------
  if (outputType == "nc") {
    # initialize NetCDF
    ncfname <- paste0(outname,".nc")
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
  }
  timestamp(prefix=paste("Finished! ","##------ "))
}

cat("\014")
area_pro(xres, yres, outputType)

exit()
