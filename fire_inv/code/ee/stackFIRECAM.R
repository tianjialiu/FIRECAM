# =============================================
# Stack and aggregate monthly emissions files
# for Earth Engine
# =============================================
# last updated: Sep 30, 2019
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

aggRas <- function(x,aggFactor=5) {
  agg_x <- aggregate(stack(x),aggFactor,sum,na.rm=T)
}

inputFolder <- outputDirMonthly_gee_tif
outputFolder <- file.path(outputDirMonthly_gee_tif,"FIRECAM")

for (iYear in 2003:2018) {
  for (iMonth in 1:12) {
    setwd(inputFolder)
    inDate <- paste0(iYear,"_",sprintf("%02d",iMonth))
    
    gfedStack <- aggRas(paste0("GFEDv4s/GFEDv4s_",inDate,".tif"),2)
    finnStack <- aggRas(paste0("FINNv1p5/FINNv1p5_",inDate,".tif"))
    gfasStack <- aggRas(paste0("GFASv1p2/GFASv1p2_",inDate,".tif"))
    qfedStack <- aggRas(paste0("QFEDv2p5r1/QFEDv2p5r1_",inDate,".tif"))
    feerStack <- aggRas(paste0("FEERv1p0_G1p2/FEERv1p0_G1p2_",inDate,".tif"))
    
    firecamStack <- stack(gfedStack,finnStack,gfasStack,qfedStack,feerStack)
    
    dir.create(outputFolder,showWarnings=F,recursive=T)
    setwd(outputFolder)
    writeRaster(firecamStack,paste0("FIRECAM_",inDate,".tif"),format="GTiff",overwrite=T)
    removeTmpFiles(h=0)
  }
}
