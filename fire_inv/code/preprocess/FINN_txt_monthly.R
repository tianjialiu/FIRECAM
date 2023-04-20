# =========================================
# FINNv1.5: separate yearly to monthly TXT
# for quicker file loading and name
# standarization
# =========================================
# last updated: Apr 13, 2023
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2003:2020

# Set input and output folders to read and write FINN txt files
invName <- "FINNv1p5"
inputFolder <- file.path(inputDir,invName)
outputFolder <- file.path(inputFolder,"monthly_txt")

for (iYear in seq_along(xYears)) {
  
  # Read annual FINN txt files
  setwd(inputFolder)
  if (xYears[iYear] >= 2016) {
      finnYr <- read.table(dir(".",paste0("GLOBAL_FINNv15_",xYears[iYear])),sep=",",header=T)
  } else {
      finnYr <- read.table(dir(".",paste0("GLOBALv15_",xYears[iYear])),sep=",",header=T)
  }
  
  for (iMonth in 1:12) {
    inDates <- blankDates(iMonth,iMonth,xYears[iYear])
    inDays <- inDates$Julian
    
    finnMon <- finnYr[finnYr$DAY %in% inDays,]
    
    # Write monthly FINN txt files
    dir.create(outputFolder,showWarnings=F,recursive=T)
    
    setwd(outputFolder)
    write.table(finnMon,paste0("FINNv1p5_",xYears[iYear],"_",sprintf("%02d",iMonth),".txt"),sep=",")
  }
  
  timestamp(prefix=paste("Year:",xYears[iYear],"##------ "))
}


