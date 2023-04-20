# =========================================
# FINNv1.5: combine daily to monthly TXT
# for quicker file loading and name
# standarization, NRT files
# =========================================
# last updated: Apr 13, 2023
# Tianjia Liu

rm(list=ls())
source('~/Google Drive/scripts/R/fire_inv/globalParams.R')

# -------------
# Input Params
# -------------
xYears <- 2021:2022
xMonths <- 1:12

# Set input and output folders to read and write FINN txt files
invName <- "FINNv1p5"
inputFolder <- file.path(inputDir,invName,"nrt")
outputFolder <- file.path(inputDir,invName,"monthly_txt")

for (iYear in seq_along(xYears)) {
  
  for (iMonth in xMonths) {
    
    inDates <- blankDates(iMonth,iMonth,xYears[iYear])
    inDays <- inDates$Julian
    
    finnMon <- list()
    for (iDay in seq_along(inDays)) {
      
      # Read daily FINN txt files
      setwd(inputFolder)
      finnDay <- read.table(dir(".",paste0("GLOB_GEOSchem_",xYears[iYear],sprintf("%03d",inDays[iDay]))),
                            sep=",",header=T,row.names=NULL)
      
      if (dim(finnDay)[1] > 0) {
        # no row numbers in daily txt files so R can't read the files properly
        finn_colnames <- colnames(finnDay)[-1]
        finnDay <- finnDay[,-(dim(finnDay)[2])]
        colnames(finnDay) <- finn_colnames
        
        # coerce to numeric
        finnDay[,1] <- as.numeric(finnDay[,1])
        
        # values written in scientific format should have been written as xxe+xx instead of xxd+xx
        for (iCol in 4:33) {
          finnDay[,iCol] <- as.numeric(str_replace_all(finnDay[,iCol],"D","E"))
        }
        
        finnMon[[iDay]] <- finnDay
      }
    }
    
    finnMon <- do.call(rbind,finnMon)
    
    # Write monthly FINN txt files
    dir.create(outputFolder,showWarnings=F,recursive=T)
    
    setwd(outputFolder)
    write.table(finnMon,paste0("FINNv1p5_",xYears[iYear],"_",sprintf("%02d",iMonth),".txt"),sep=",")
  }
  
  timestamp(prefix=paste("Year:",xYears[iYear],"##------ "))
}


