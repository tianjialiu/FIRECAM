# ===============================================
# QFEDv2.5: bundle daily NetCDFs, or to GeoTiff
# by species [kg m-2 s-1]
# monthly files, daily timesteps, 0.1deg
# ===============================================
# last updated: Apr 13, 2023
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2003:2022
xMonths <- 1:12
varNameL <- c("CO","CO2","CH4","OC","BC","PM25")
outputType <- "nc"

QFEDv2p5_pro <- function(varName, xYears, xMonths, outputType="tif") {
  
  invName <- "QFEDv2p5r1"
  message("TASKS: ",invName," || ",varName," (",xYears[1]," to ",xYears[length(xYears)],")")
  message(paste0("/",month.abb[xMonths],"/"))
  timestamp(prefix=paste("Started...","##------ "))
  
  # directories to input files, output NetCDFs, GeoTiffs
  inputFolder <- file.path(inputDir,invName)
  if (outputType == "tif") {outputFolder <- file.path(outputDir_tif,invName)}
  if (outputType == "nc") {outputFolder <- file.path(outputDir_nc,invName)}
  
  # species names
  orig_varName <- as.character(spNames[which(spNames$Name==varName),invName])
  varNameLong <- as.character(spNames$Name_Long[which(spNames$Name==varName)])
  
  # area in m2
  area_m2 <- raster::area(raster(res=c(0.1,0.1)))*1000*1000
  
  datesYr <- blankDates(1,12,xYears)
  
  readQFED <- function(x) {
    ncin <- nc_open(x)
    ncvar <- ncvar_get(ncin,"biomass")
    lat <- ncvar_get(ncin,"lat")
    lon <- ncvar_get(ncin,"lon")
    
    ncdfras <- raster(t(ncvar[order(lon),rev(order(lat))]))
    extent(ncdfras) <- c(-180,180,-90,90)
    projection(ncdfras) <- latlong
    nc_close(ncin)
    return(ncdfras)
  }
  
  setwd(inputFolder)
  
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
      # read QFED
      # -----------
      monthStr <- sprintf("%02d",iMonth)
      setwd(file.path(inputFolder,paste0("Y",xYears[iYear]),paste0("M",monthStr)))
      
      if (outputType == "nc") {inv_sp <- array(0,dim=c(nLon,nLat,nDays))}
      if (outputType == "tif") {inv_sp <- list()}
      for (iDay in seq_along(monthDays)) {
        invDayName <- paste0("qfed2.emis_",orig_varName,".006.",xYears[iYear]*1e4+iMonth*1e2+iDay,".nc4")
        
        # input species [kg/ m2/ s]
        invDay_ras <-  readQFED(invDayName)
        
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
        writeRaster(brick(inv_sp),paste0(outname,".tif"),format="GTiff",overwrite=T)
      }
      
      removeTmpFiles(h=1)
      
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
        ncatt_put(ncout,"time","calendar","standard")
        
        nc_close(ncout)
      }
    }
  }
  timestamp(prefix=paste("Finished! ","##------ "))
}

cat("\014")
for (varName in varNameL) {
  QFEDv2p5_pro(varName, xYears, xMonths, outputType)
}

exit()
