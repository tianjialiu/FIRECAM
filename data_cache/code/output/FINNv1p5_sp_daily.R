# =================================================
# FINNv1.5: TXT to NetCDF, GeoTiff
# by species [kg m-2 s-1], monthly
# monthly files, daily timesteps, 0.1deg (default)
# (any spatial resolution possible >1km)
# =================================================
# last updated: Feb 22, 2019
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2003:2016
xMonths <- 1:12
varNameL <- c("CO","BC","OC","NOx","SO2")
outputType <- "tif"

FINNv1p5_pro <- function(varName, xYears, xMonths, outputType="tif",
                        xres = 0.1, yres = 0.1) {
  
  invName <- "FINNv1p5"
  timestamp(prefix=paste("Started...","##------ "))
  message("TASKS: ",invName," || ",varName," (",xYears[1]," to ",xYears[length(xYears)],")")
  message(paste0("/",month.abb[xMonths],"/"))
  
  # directories to input files, output NetCDFs, GeoTiffs
  inputFolder <- file.path(inputDir,invName,"monthly_txt")
  if (outputType == "tif") {outputFolder <- file.path(outputDir_tif,invName)}
  if (outputType == "nc") {outputFolder <- file.path(outputDir_nc,invName)}
  
  # species names
  orig_varName <- as.character(spNames[which(spNames$Name==varName),invName])
  varNameLong <- as.character(spNames$Name_Long[which(spNames$Name==varName)])
  
  # area in m2
  area_m2 <- raster::area(raster(res=c(xres,yres)))*1000*1000
  
  datesYr <- blankDates(1,12,xYears)
  
  setwd(inputFolder)
  # scale factors for FINNv1.5 to convert to kg
  # http://bai.acom.ucar.edu/Data/fire/data/README_FINNv1_GEOSCHEM.pdf
  EFs <- data.frame(read.csv("../ancill/FINNv1p5_scale_factors.csv"))
  varFactor <- EFs$scale_factor[which(EFs$species==orig_varName)]
  
  # Setting dimensions
  cellCoord <- coordinates(area_m2)
  cellLon <- as.numeric(cellCoord[,1])
  cellLat <- as.numeric(cellCoord[,2])
  
  LonVec <- unique(cellLon)
  LatVec <- sort(unique(cellLat))
  nLon <- length(LonVec)
  nLat <- length(LatVec)
  
  for (iYear in seq_along(xYears)) {
    for (iMonth in xMonths) {
      
      monthDays <- datesYr$Julian[which(datesYr$Year==xYears[iYear] & datesYr$Month==iMonth)]
      nDays <- length(monthDays)
      
      # -----------
      # read FINN
      # -----------
      setwd(inputFolder)
      monthStr <- sprintf("%02d",iMonth)
      invYr <- read.table(dir(".",paste0(invName,"_",xYears[iYear],"_",monthStr)),sep=",",header=T)
      invMon <- invYr[invYr$DAY %in% monthDays,]
      
      if (outputType == "nc") {inv_sp <- array(0,dim=c(nLon,nLat,nDays))}
      if (outputType == "tif") {inv_sp <- list()}
      for (iDay in seq_along(monthDays)) {
        invDay <- invMon[which(invMon$DAY == monthDays[iDay]),]
        inv_spdf <- SpatialPointsDataFrame(data.frame(cbind(invDay$LONGI,invDay$LATI)),
                                           data.frame(invDay[,-c(1:5)]),proj4string=latlong)
        # input species [kg/ m2/ s]
        invDay_ras <-  rasterize(inv_spdf,area_m2,orig_varName,sum) / area_m2 *
          varFactor / (24*60*60)
        invDay_ras[is.na(invDay_ras)] <- 0
        
        if (outputType == "tif") {inv_sp[[iDay]] <- invDay_ras}
        if (outputType == "nc") {
          inv_sp[,,iDay] <- matrix(as.vector(invDay_ras),
                                   nrow=nLon,ncol=nLat)[,order(unique(cellLat))]
        }
      }
      
      # --------
      # Output
      # --------
      subFolder <- file.path(outputFolder,xYears[iYear])
      dir.create(subFolder,showWarnings=F,recursive=T)
      
      setwd(subFolder)
      outname <- paste0(invName,"_",xYears[iYear],"_",monthStr,"_",varName)
      
      # -----------------
      # Save Geotiff
      # -----------------
      if (outputType == "tif") {
        writeRaster(stack(inv_sp),paste0(outname,".tif"),format="GTiff",overwrite=T)
      }
      
      removeTmpFiles(h=0)
      
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
        
        # time
        datesYrMon <- blankDates(iMonth,iMonth,xYears[iYear])
        timeVec <- YMDtoHrsSince(datesYrMon$Year,datesYrMon$Month,datesYrMon$Day)
        timeDim <- ncdim_def("time",paste("hours since",originDate,"00:00:00"),
                             as.double(timeVec),longname="time")
        
        # input species
        ncvar <- ncvar_def(varName,varUnits,list(lonDim,latDim,timeDim),fillval,
                           varNameLong,compression=3)
        
        # add variables to NetCDF
        ncout <- nc_create(ncfname,ncvar,force_v4=T)
        ncvar_put(ncout,ncvar,inv_sp)
        ncatt_put(ncout,"lon","axis","lon")
        ncatt_put(ncout,"lat","axis","lat")
        ncatt_put(ncout,"time","axis","time")
        
        nc_close(ncout)
      }
    }
  }
  timestamp(prefix=paste("Finished! ","##------ "))
}

cat("\014")
for (varName in varNameL) {
  FINNv1p5_pro(varName, xYears, xMonths, outputType)
}

exit()

