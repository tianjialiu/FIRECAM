# =================================================
# FINNv1.5: TXT to NetCDF
# by species [kg m-2 s-1], monthly
# monthly files, daily timesteps, 0.1deg (default)
# (any spatial resolution possible)
# =================================================
# last updated: Feb 16, 2019
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2003:2016
xMonths <- 1:12
varNameL <- c("CO","BC","OC","NOx","SO2")

FINNv1p5_nc <- function(varName, xYears, xMonths, xres = 0.1, yres = 0.1) {
  
  invName <- "FINNv1p5"
  timestamp(prefix=paste("Started...","##------ "))
  message("TASKS: ",invName," || ",varName," (",xYears[1]," to ",xYears[length(xYears)],")")
  message(paste0("/",month.abb[xMonths],"/"))
  
  # directories to input files, output NetCDFs
  inputFolder <- file.path(inputDir,invName,"processed_txt")
  outputFolder <- file.path(outputDir,invName)
  
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
      
      inv_sp <- array(0,dim=c(nLon,nLat,nDays))
      for (iDay in seq_along(monthDays)) {
        invDay <- invMon[which(invMon$DAY == monthDays[iDay]),]
        inv_spdf <- SpatialPointsDataFrame(data.frame(cbind(invDay$LONGI,invDay$LATI)),
                                           data.frame(invDay[,-c(1:5)]),proj4string=latlong)
        # input species [kg/ m2/ s]
        invDay_vec <-  rasterize(inv_spdf,area_m2,orig_varName,sum) / area_m2 *
          varFactor / (24*60*60)
        invDay_vec[is.na(invDay_vec)] <- 0
        inv_sp[,,iDay] <- matrix(as.vector(invDay_vec),nrow=nLon,ncol=nLat)[,order(unique(cellLat))]
      }
      
      # -----------------
      # Construct NetCDF
      # -----------------
      subFolder <- file.path(outputFolder,xYears[iYear])
      dir.create(subFolder,showWarnings=F)
      
      setwd(subFolder)
      
      # initialize NetCDF
      ncfname <- paste0(invName,"_",xYears[iYear],"_",monthStr,"_",varName,".nc")
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
  timestamp(prefix=paste("Finished! ","##------ "))
}

cat("\014")
for (varName in varNameL) {
  FINNv1p5_nc(varName, xYears, xMonths)
}

exit()

