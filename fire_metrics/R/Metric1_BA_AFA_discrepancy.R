# -----------------------------------------
# Metric 1: BA-AFA discrepancy (phi_area),
# expressed as a normalized difference

# Author: Tianjia Liu
# Last Updated: May 13, 2019
# -----------------------------------------
source('~/Google Drive/GlobalFires/R/globalParams.R')

# ----- Parameters -----
tableName <- "MxD14A1_FRP_1km_2003_2017.csv"
rasterName <- "Metric1_BA_AFA_discrepancy"

writeTable <- F
write2Raster <- F
plotMap <- T

# ----- Write Table -----
# Aggregate MxD14A1_FRP_1km tables across time range as sum
if (writeTable == T) {
  mxd14a1_agg <- matrix(0,nLandPix,10)
  
  # Folder where MxD14A1_FRP_1km tables from EE are stored
  setwd(file.path(geeHome,"MxD14A1_FRP_1km/"))
  
  # Loop over all tables, per year and per month
  for (iYear in seq_along(xYears)) {
    # File names of tables of given year
    fileNames <- dir(".",paste0("MxD14A1_FRP_",xYears[iYear]))
    
    for (iMonth in 1:12) {
      # Read monthly MxD14A1
      mxd14a1 <- read.csv(fileNames[iMonth])
      
      # Aggregate all columns except date and basis id
      mxd14a1_agg[,-c(1:2)] <- mxd14a1_agg[,-c(1:2)] + as.matrix(mxd14a1[,-c(1:2)])
    }
  }
  
  # Clean up aggregated MxD14A1_FRP_1km table
  mxd14a1_agg[,1:2] <- as.matrix(mxd14a1[,1:2])
  colnames(mxd14a1_agg) <- colnames(mxd14a1)
  
  # Write table
  setwd(outTabHome)
  write.table(mxd14a1_agg,tableName,sep=",",row.names=F)
}

# ----- Write Raster -----
if (write2Raster == T) {
  # Read aggregated table
  setwd(outTabHome)
  inTable <- read.csv(tableName)
  
  # Use ids of grid cells as index to save metric as a vector
  ids <- inTable$id
  metricVec <- rep(NA,nBasis)
  metricVec[ids] <- (inTable$BAnoAF-inTable$AFnoBA)/(inTable$BAnoAF+inTable$AFnoBA)
  
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
  
  colPal <- paste0(colorRampPalette(rev(brewer.pal(7,"RdBu")))(101),"FF")
  
  ggplot <- ggplot_raster(inName=rasterName,
                          titleName="Relative Fire\nConfidence Metric 1",
                          legendName="BA-AFA Discrepancy",
                          unitsName="italic('normalized difference')",
                          units.adj=c(-2.7,0), break.pts=seq(-1,1,0.5))
  
  setwd(plotHome)
  ggsave(file=paste0(rasterName,".png"), ggplot,
         width=7.5, height=4, dpi=500, limitsize=F)
}