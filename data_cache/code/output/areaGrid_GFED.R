# =========================================
# GFEDv4s: HDF5 to NetCDF
# area per grid cell, m2
# =========================================
# last updated: Feb 22, 2019
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
outputType <- "tif"

GFEDv4s_area_nc <- function(outputType="tif") {
  
  invName <- "GFEDv4s"
  timestamp(prefix=paste("Started...","##------ "))
  message("TASKS: Area - ",invName)
  
  # directories to input files, output NetCDFs, GeoTiffs
  inputFolder <- file.path(inputDir,invName)
  if (outputType == "tif") {outputFolder <- file.path(outputDir_tif,"ancill")}
  if (outputType == "nc") {outputFolder <- file.path(outputDir_nc,"ancill")}
  
  setwd(inputFolder)
  # convert HDF5 to raster
  readGFED <- function(x,y) {
    H5close()
    h5file <- h5read(x,y)
    h5ras <- raster(t(h5file))
    extent(h5ras) <- c(-180,180,-90,90)
    projection(h5ras) <- latlong
    return(h5ras)
  }
  
  # area in m2
  area_m2 <- readGFED(dir(".",pattern="GFED")[1],"ancill/grid_cell_area") 
  
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
  
  outname <- paste0("area_",invName)
  
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
    ncfname <- paste0(outName,".nc")
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
}

cat("\014")
GFEDv4s_area_nc(outputType)

exit()
