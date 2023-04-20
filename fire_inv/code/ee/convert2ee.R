# =========================================
# Converts monthly tif files (kg/grid cell)
# to monthly sum stacks for EE import
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
invNameL <- c("GFEDv4s","FINNv1p5","GFASv1p2","QFEDv2p5r1","FEERv1p0_G1p2")
varNameL <- c("CO","CO2","CH4","OC","BC","PM25")

convert2ee <- function(varNameL, xYears, xMonths, invName) {
  
  message("TASKS: ",invName," || (",xYears[1]," to ",xYears[length(xYears)],")")
  message(paste0("/",month.abb[xMonths],"/"))
  timestamp(prefix=paste("Started...","##------ "))
  
  inputFolder <- outputDirMonthly_tif
  outputFolder <- file.path(outputDirMonthly_gee_tif,invName)
  
  for (iYear in seq_along(xYears)) {
    for (iMonth in xMonths) {
      setwd(file.path(inputFolder,paste0(invName,"/",xYears[iYear],"/")))
      
      monthStr <- sprintf("%02d",iMonth)
      fileNamePrefix <- paste0(invName,"_",xYears[iYear],"_",monthStr)
      
      # ---------------------------
      # Monthly Sum, kg/ grid cell
      # ---------------------------
      invMon_sp <- list()
      for (iVar in seq_along(varNameL)) {
        fileName <- paste0(fileNamePrefix,"_",varNameL[iVar],".tif")
        invMon_sp[[iVar]] <- raster(fileName) # kg
      }
      invMon_spAll <- brick(invMon_sp)
      names(invMon_spAll) <- varNameL
      
      # --------
      # Output
      # --------
      dir.create(outputFolder,showWarnings=F,recursive=T)
      setwd(outputFolder)
      
      # -----------------
      # Save Geotiff
      # -----------------
      writeRaster(invMon_spAll,paste0(fileNamePrefix,".tif"),format="GTiff",overwrite=T)
      removeTmpFiles(h=1)
    }
  }
  timestamp(prefix=paste("Finished! ","##------ "))
}


cat("\014")
for (invName in invNameL) {
  convert2ee(varNameL, xYears, xMonths, invName)
}

