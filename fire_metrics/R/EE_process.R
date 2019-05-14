# -------------------------------------------
# Combine EE table chunks into one table

# Author: Tianjia Liu
# Last Updated: May 14, 2019
# -------------------------------------------
source('~/Google Drive/GlobalFires/R/globalParams.R')

prefix <- "VNP14IMGML_FRP"
prefix_sat <- "VNP14IMGML_FRP"
prefix_scale <- "375m"
xYears <- 2012:2017

inputFolder <- paste0(homeDir,"gee_basis/",prefix,"_Basis_",prefix_scale)
outputFolder <- paste0(homeDir,"gee/",prefix,"_",prefix_scale)
inTable <- paste0(prefix_sat,"_",prefix_scale,"_",xYears[1],
                  "_",xYears[length(xYears)],".csv")

for (iYear in seq_along(xYears)) {
  for (iMonth in 1:12) {
    setwd(inputFolder)
    fileSubName <- paste0(prefix_sat,"_",xYears[iYear],"_",sprintf("%02d",iMonth))
    
    basisMon <- list()
    for (iBasis in 1:nBasis) {
      monthBasis <- read.table(paste0(fileSubName,"_Basis_",
                                         sprintf("%02d",iBasis),".csv"),sep=",",header=T)
      basisMon[[iBasis]] <- monthBasis
    }
    basisTab <- do.call(rbind,basisMon)
    
    setwd(outputFolder)
    write.table(basisTab[order(basisTab$id),],
                paste0(fileSubName,".csv"),sep=",",row.names=F)
  }
  timestamp(prefix=paste("Year:",xYears[iYear],"##------"))
}
