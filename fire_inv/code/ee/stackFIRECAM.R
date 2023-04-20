# =============================================
# Stack and aggregate monthly emissions files
# for Earth Engine
# =============================================
# last updated: Apr 13, 2023
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2003:2022

inputFolder <- outputDirMonthly_gee_tif
outputFolder <- file.path(outputDirMonthly_gee_tif,"FIRECAM")

aggRas <- function(x,aggFactor) {
  agg_x <- aggregate(stack(x),aggFactor,sum,na.rm=T)
}

for (iYear in xYears) {
  for (iMonth in 1:12) {
    setwd(inputFolder)
    inDate <- paste0(iYear,"_",sprintf("%02d",iMonth))
    
    gfedStack <- aggRas(paste0("GFEDv4s/GFEDv4s_",inDate,".tif"),2)
    finnStack <- aggRas(paste0("FINNv1p5/FINNv1p5_",inDate,".tif"),5)
    gfasStack <- aggRas(paste0("GFASv1p2/GFASv1p2_",inDate,".tif"),5)
    qfedStack <- aggRas(paste0("QFEDv2p5r1/QFEDv2p5r1_",inDate,".tif"),5)
    feerStack <- aggRas(paste0("FEERv1p0_G1p2/FEERv1p0_G1p2_",inDate,".tif"),5)
    
    firecamStack <- brick(gfedStack,finnStack,gfasStack,qfedStack,feerStack)
    
    dir.create(outputFolder,showWarnings=F,recursive=T)
    setwd(outputFolder)
    writeRaster(firecamStack,paste0("FIRECAM_",inDate,".tif"),format="GTiff",overwrite=T)
    removeTmpFiles(h=1)
  }
}
