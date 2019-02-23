#open packages
library("raster");library("rgeos");library("maptools");library("mapproj");
library("maps");library("rgdal");library("spdep");library("sp");library("fields")
library("plyr");library("ncdf4");library("rhdf5")

inputDir <- "/Volumes/TLIU_DATA/FIRE_raw/"
outputDir_nc <- "/Volumes/TLIU_DATA/FIRE_nc_daily/"
outputDir_tif <- "/Volumes/TLIU_DATA/FIRE_tif_daily/"

originDate <- "1985-01-01"
varUnits <- "kg/m2/s"

latlong <- crs(raster())
fillval <- NULL
nTmpHrs <- 1

setwd(inputDir)
spNames <- read.csv("species_names.csv")

YMDtoHrsSince <- function(year,month,day) {
  date <- as.Date(paste0(year,"-",sprintf("%2d",month),"-",sprintf("%2d",day)))
  diffhrs <- difftime(date,as.Date(originDate),units="hour")
  return(diffhrs)
}

blankDates <- function(sMonth,eMonth,inYears,NAcols=F) {
  sYear <- inYears[1]
  eYear <- inYears[length(inYears)]
  
  if (inYears[length(inYears)] %% 4 == 0) {
    nDays <- c(31,29,31,30,31,30,31,31,30,31,30,31)
  } else {nDays <- c(31,28,31,30,31,30,31,31,30,31,30,31)}
  
  sDate <- paste0(sYear,"-",sprintf("%02d",sMonth),"-01")
  eDate <- paste0(eYear,"-",sprintf("%02d",eMonth),"-",sprintf("%02d",nDays[eMonth]))
  datesAll <- seq(as.Date(sDate),as.Date(eDate),"day")
  
  YEARS <- as.numeric(format(datesAll,"%Y"))
  MONTHS <- as.numeric(format(datesAll,"%m"))
  DAYS <- as.numeric(format(datesAll,"%d"))
  JDAYS <- as.numeric(format(datesAll,"%j"))
  
  datesTable <- data.frame(cbind(YEARS,MONTHS,DAYS,JDAYS))
  colnames(datesTable) <- c("Year","Month","Day","Julian")
  
  if (is.character(NAcols) == T | is.numeric(NAcols) == T ) {
    datesTable <- cbind(datesTable,matrix(NA,dim(datesTable)[1],length(NAcols)))
    colnames(datesTable) <- c(colnames(datesTable)[1:4],NAcols)
  }
  
  return(datesTable)
}

quiet <- function(x) { 
  sink(tempfile()) 
  on.exit(sink()) 
  invisible(force(x)) 
}

exit <- function() {
  .Internal(.invokeRestart(list(NULL, NULL), NULL))
}
