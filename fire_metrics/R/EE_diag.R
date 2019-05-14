# -------------------------------------------
# Check progress of GEE downloads

# Author: Tianjia Liu
# Last Updated: May 14, 2019
# -------------------------------------------
source('~/Google Drive/GlobalFires/R/globalParams.R')

# ----- Parameters -----
# Set folder names to check
prefixD <- "VNP14IMGML_FRP"
prefix <- "VNP14IMGML_FRP"

homeDir <- "/Users/TLiu/Google Drive/GlobalFires/gee_basis/"
inputFolder <- paste0(homeDir,prefixD,"_Basis_375m/")

xYears <- 2012:2017
inBasis <- 1:nBasis
print_nFiles <- T # T = summary, F = verbose

nFiles <- nYear*12*nBasis
nFilesDownloaded <- length(dir(".",prefix))

nYear <- length(xYears)

setwd(inputFolder)

# ----- Remove Duplicates -----
dupFiles <- dir(".",paste0(prefix,".*\\("))
if (length(dupFiles) > 0) {
  file.remove(dupFiles)
  print("Duplicate files removed.")
}

# ----- Print Progress -----
if (nFiles == nFilesDownloaded) {
  print("All Done.")
} else {
  if (print_nFiles == T) {
    for (iBasis in inBasis) {
      fileNames <- dir(".",paste0(prefix,".*Basis_",sprintf("%02d",iBasis)))
      print(paste(paste0("Basis_",sprintf("%02d",iBasis)),":",
                  paste0(length(fileNames),"/",nYear*12),
                  paste0("(",round(length(fileNames)/(nYear*12)*100),"%)")))
    }
  } else {for (iBasis in inBasis) {
    fileNames <- dir(".",paste0(prefix,".*Basis_",sprintf("%02d",iBasis)))
    fileNames <- substr(fileNames,nchar(prefix)+2,nchar(prefix)+8)
    datesMonYr <- paste0(sort(rep(xYears,12)),"_",rep(sprintf("%02d",1:12),length(xYears)))
    missingFiles <- datesMonYr[!datesMonYr%in%fileNames]
    if (length(missingFiles) > 0) {
      print(paste0("============== iBasis:",iBasis," ================"))
      print(missingFiles)
    }
  }}
  print(paste("=== Completed:",
              paste0(nFilesDownloaded,"/",nFiles),
              paste0("(",round(nFilesDownloaded/nFiles*100,1),
                     "%) ===")))
}