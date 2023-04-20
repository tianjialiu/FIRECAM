# =========================================
# GFEDv4s: HDF5 to GeoTiff
# by species [kg m-2 s-1]
# monthly files, monthly timesteps, 0.25deg
# =========================================
# last updated: Apr 13, 2023
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/My Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2003:2022
xMonths <- 1:12
varNameL <- c("CO","CO2","CH4","OC","BC","PM25")

GFEDv4s_pro_month <- function(varName, xYears, xMonths) {
  
  invName <- "GFEDv4s"
  message("TASKS: ",invName," || ",varName," (",xYears[1]," to ",xYears[length(xYears)],")")
  message(paste0("/",month.abb[xMonths],"/"))
  timestamp(prefix=paste("Started...","##------ "))
  
  # directories to input files, output NetCDFs, GeoTiffs
  inputFolder <- file.path(inputDir,invName)
  outputFolder <- file.path(outputDirMonthly_tif,invName)
  
  # species names
  orig_varName <- as.character(spNames[which(spNames$Name==varName),invName])
  varNameLong <- as.character(spNames$Name_Long[which(spNames$Name==varName)])
  
  setwd(inputFolder)
  # convert HDF5 to raster
  readGFED <- function(x,y,beta) {
    H5close()
    if (beta == F) {
      h5file <- h5read(paste0(x,".hdf5"),y)
    } else {h5file <- h5read(paste0(x,"_beta.hdf5"),y)}
    h5ras <- raster(t(h5file))
    extent(h5ras) <- c(-180,180,-90,90)
    projection(h5ras) <- latlong
    return(h5ras)
  }
  
  # area in m2
  if (xYears[1] <= 2016) {beta <- F} else {beta <- T}
  area_m2 <- readGFED(paste0("GFED4.1s_",xYears[1]),"ancill/grid_cell_area",beta)
  
  # emissions factors for GFEDv4s [g species/ kg DM]
  EFs <- data.frame(read.table("ancill/GFED4_Emission_Factors.txt"))
  colnames(EFs) <- c("species","SAVA","BORF","TEMF","DEFO","PEAT","AGRI")
  EFs_sp <- EFs[which(EFs$species==orig_varName),]
  
  datesYr <- blankDates(1,12,xYears)
  
  for (iYear in seq_along(xYears)) {
    if (xYears[iYear] <= 2016) {beta <- F} else {beta <- T}
    
    for (iMonth in xMonths) {
      
      # -----------
      # read GFED
      # -----------
      setwd(inputFolder)
      prefix <- paste0("GFED4.1s_",xYears[iYear])
      monthStr <- sprintf("%02d",iMonth)
      
      # DM [kg DM / m^2 / month]
      emiDM <- readGFED(prefix,paste0("emissions/",monthStr,"/DM"),beta)
      
      # partition by land cover [unitless, fractional, 0-1]
      emiDM_SAVA <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_SAVA"),beta)
      emiDM_BORF <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_BORF"),beta)
      emiDM_TEMF <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_TEMF"),beta)
      emiDM_DEFO <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_DEFO"),beta)
      emiDM_PEAT <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_PEAT"),beta)
      emiDM_AGRI <- readGFED(prefix,paste0("emissions/",monthStr,"/partitioning/DM_AGRI"),beta)
      
      # input species [g species / m2 / month]
      emi_sp <- emiDM * (emiDM_SAVA*EFs_sp$SAVA + emiDM_BORF*EFs_sp$BORF + emiDM_TEMF*EFs_sp$TEMF  + 
                           emiDM_DEFO*EFs_sp$DEFO + emiDM_PEAT*EFs_sp$PEAT + emiDM_AGRI*EFs_sp$AGRI)
      
       # input species [kg]
      inv_sp <-  emi_sp * area_m2 / 1000

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
      writeRaster(inv_sp,paste0(outname,".tif"),format="GTiff",overwrite=T)
      
      removeTmpFiles(h=1)
    
    }
  }
  timestamp(prefix=paste("Finished! ","##------ "))
}

cat("\014")
for (varName in varNameL) {
  GFEDv4s_pro_month(varName, xYears, xMonths)
}

exit()

