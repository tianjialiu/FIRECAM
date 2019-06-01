# =========================================
# GFEDv4s: HDF5 to NetCDF, GeoTiff
# by species [kg m-2 s-1]
# monthly files, daily timesteps, 0.25deg
# =========================================
# last updated: June 1, 2019
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

GFEDv4s_pro <- function(varName, xYears, xMonths, outputType="tif") {
  
  invName <- "GFEDv4s"
  timestamp(prefix=paste("Started...","##------ "))
  message("TASKS: ",invName," || ",varName," (",xYears[1]," to ",xYears[length(xYears)],")")
  message(paste0("/",month.abb[xMonths],"/"))
  
  # directories to input files, output NetCDFs, GeoTiffs
  inputFolder <- file.path(inputDir,invName)
  if (outputType == "tif") {outputFolder <- file.path(outputDir_tif,invName)}
  if (outputType == "nc") {outputFolder <- file.path(outputDir_nc,invName)}
  
  # species names
  orig_varName <- as.character(spNames[which(spNames$Name==varName),invName])
  varNameLong <- as.character(spNames$Name_Long[which(spNames$Name==varName)])
  
  setwd(inputFolder)
  # convert HDF5 to raster
  readGFED <- function(x,y) {
    H5close()
    h5file <- h5read(paste0(x,".hdf5"),y)
    h5ras <- raster(t(h5file))
    extent(h5ras) <- c(-180,180,-90,90)
    projection(h5ras) <- latlong
    return(h5ras)
  }
  
  # area in m2
  area_m2 <- readGFED(paste0("GFED4.1s_",xYears[1]),"ancill/grid_cell_area") 
  
  # emissions factors for GFEDv4s [g species/ kg DM]
  EFs <- data.frame(read.table("ancill/GFED4_Emission_Factors.txt"))
  colnames(EFs) <- c("species","SAVA","BORF","TEMF","DEFO","PEAT","AGRI")
  EFs_sp <- EFs[which(EFs$species==orig_varName),]
  
  datesYr <- blankDates(1,12,xYears)
  
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
      # read GFED
      # -----------
      setwd(inputFolder)
      prefix <- paste0("GFED4.1s_",xYears[iYear])
      monthStr <- sprintf("%02d",iMonth)
      
      # DM [kg DM / m^2 / month]
      emiDM <- readGFED(prefix,paste0("emissions/",monthStr,"/DM"))
      
      # partition by land cover [unitless, fractional, 0-1]
      emiDM_SAVA <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_SAVA"))
      emiDM_BORF <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_BORF"))
      emiDM_TEMF <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_TEMF"))
      emiDM_DEFO <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_DEFO"))
      emiDM_PEAT <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_PEAT"))
      emiDM_AGRI <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_AGRI"))
      
      # input species [g species / m2 / month]
      emi_sp <- emiDM * (emiDM_SAVA*EFs_sp$SAVA + emiDM_BORF*EFs_sp$BORF + emiDM_TEMF*EFs_sp$TEMF  + 
                           emiDM_DEFO*EFs_sp$DEFO + emiDM_PEAT*EFs_sp$PEAT + emiDM_AGRI*EFs_sp$AGRI)
      
      if (outputType == "nc") {inv_sp <- array(0,dim=c(nLon,nLat,nDays))}
      if (outputType == "tif") {inv_sp <- list()}
      for (iDay in seq_along(monthDays)) {
        # daily fraction
        emi_frac <- readGFED(prefix,paste0("emissions/",monthStr,"/daily_fraction/day_",iDay))
        
        # input species [kg/ m2/ s]
        invDay_ras <-  emi_sp * emi_frac / (24*60*60) / 1000
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
      
      removeTmpFiles(h=nTmpHrs)
    }
  }
  timestamp(prefix=paste("Finished! ","##------ "))
}

cat("\014")
for (varName in varNameL) {
  GFEDv4s_pro(varName, xYears, xMonths, outputType)
}

exit()

