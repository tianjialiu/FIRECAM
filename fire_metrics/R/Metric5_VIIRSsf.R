# ----------------------------------------------------
# Metric 5: VIIRS additional boost (phi_VIIRS_sf),
# expressed as a fraction

# Author: Tianjia Liu
# Last Updated: May 14, 2019
# ----------------------------------------------------
source('~/Google Drive/GlobalFires/R/globalParams.R')

# ----- Parameters -----
tableName <- "VNP14IMGML_FRP_375m_2012_2017.csv"
rasterName <- "Metric5_VIIRS_sf"

writeTable <- F
write2Raster <- F
plotMap <- T

# ----- Write Table -----
# Aggregate VNP14IMGML_FRP_375m tables across time range as sum
xYears <- 2012:2017
if (writeTable == T) {
  viirs_agg <- matrix(0,nLandPix,10)
  
  # Folder where VNP14IMGML_FRP_375m tables from EE are stored
  setwd(file.path(geeHome,"VNP14IMGML_FRP_375m/"))
  
  # Loop over all tables, per year and per year
  for (iYear in seq_along(xYears)) {
    # File names of tables of given year
    fileNames <- dir(".",paste0("VNP14IMGML_FRP_",xYears[iYear]))
    
    for (iMonth in 1:12) {
      # Read monthly viirs
      viirs <- read.csv(fileNames[iMonth])
      
      # Aggregate all columns except date and basis id
      viirs_agg[,-c(1:2)] <- viirs_agg[,-c(1:2)] + as.matrix(viirs[,-c(1:2)])
    }
  }
  
  # Clean up aggregated VNP14IMGML_FRP_375m table
  viirs_agg[,1:2] <- as.matrix(viirs[,1:2])
  colnames(viirs_agg) <- colnames(viirs)
  
  # Write table
  setwd(outTabHome)
  write.table(viirs_agg,tableName,sep=",",row.names=F)
}

if (write2Raster == T) {
  # Read aggregated cloud/haze table
  setwd(outTabHome)
  inTable <- read.csv(tableName)
  
  # Use ids of grid cells as index to save metric as a vector
  ids <- inTable$id
  metricVec <- rep(NA,nBasis)
  metricVec[ids] <- inTable$FRPnoMODIS/inTable$FRP
  
  # Convert vector to raster and mask values that are 0
  metricRas <- setValues(basis,metricVec)
  metricRas[metricRas==0] <- NA
  
  # Save raster
  setwd(rasMapsHome)
  writeRaster(metricRas,paste0(rasterName,".tif"),format="GTiff",overwrite=T)
}

# ----- Plot Map -----
if (plotMap == T) {
  source('~/Google Drive/GlobalFires/R/gg_map.R')
  setwd(rasMapsHome)
  
  colPal <- paste0(colorRampPalette(carto_pal(7,"Sunset"))(101),"FF")
  
  ggplot <- ggplot_raster(inName=rasterName,
                          titleName="Relative Fire\nConfidence Metric 5",
                          legendName="VIIRS FRP Outside MODIS Burn Extent",
                          unitsName="italic('fractional')", units.adj=c(-2.7,0),
                          break.pts=seq(0,1,0.2))
  
  setwd(plotHome)
  ggsave(file=paste0(rasterName,".png"), ggplot,
         width=7.5, height=4, dpi=500, limitsize=F)
}
