# =========================================
# Converts daily tif files (kg/m2/s)
# to monthly sum (kg)
# =========================================
# last updated: Apr 13, 2023
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2003:2022
xMonths <- 1:12
invNameL <- c("FINNv1p5","GFASv1p2","QFEDv2p5r1","FEERv1p0_G1p2")
varNameL <- c("CO","CO2","CH4","OC","BC","PM25")

day2month_pro <- function(varName, xYears, xMonths, invName) {
  
  timestamp(prefix=paste("Started...","##------ "))
  message("TASKS: ",invName," || ",varName," (",xYears[1]," to ",xYears[length(xYears)],")")
  message(paste0("/",month.abb[xMonths],"/"))
  
  inputFolder <- outputDir_tif
  outputFolder <- file.path(outputDirMonthly_tif,invName)
  
  for (iYear in seq_along(xYears)) {
    for (iMonth in xMonths) {
      setwd(file.path(inputFolder,paste0(invName,"/",xYears[iYear],"/")))
      
      monthStr <- sprintf("%02d",iMonth)
      fileName <- paste0(invName,"_",xYears[iYear],"_",monthStr,"_",varName,".tif")
      
      # ---------------------------
      # Monthly Sum, kg/ grid cell
      # ---------------------------
      st <- stack(fileName) # kg/m2/s
      stSum <- sum(st,na.rm=T) # kg/m2/s
      areaRas <- raster::area(stSum)*1e6 # m2
      stSum <- stSum*areaRas*3600*24 # kg
      
      # --------
      # Output
      # --------
      subFolder <- file.path(outputFolder,xYears[iYear])
      dir.create(subFolder,showWarnings=F,recursive=T)
      setwd(subFolder)
      
      # -----------------
      # Save Geotiff
      # -----------------
      writeRaster(stSum,fileName,format="GTiff",overwrite=T)
      removeTmpFiles(h=1)
    }
  }
}


cat("\014")
for (invName in invNameL) {
  for (varName in varNameL) {
    day2month_pro(varName, xYears, xMonths, invName)
  }
}

