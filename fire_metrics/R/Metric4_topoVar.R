# ----------------------------------------------------
# Metric 4: Topography Variance (phi_topography),
# expressed as m^2

# Author: Tianjia Liu
# Last Updated: July 18, 2019
# ----------------------------------------------------
source('~/Google Drive/GlobalFires/R/globalParams.R')

# ----- Parameters -----
tableName <- "GMTED2010_SRTM_m2.csv"
rasterName <- "Metric4_topoVar"

writeBasis <- F
writeRaster <- F
plotMap <- T

# ----- Write Table -----
if (writeBasis == T) {
  inputFolder <- file.path(homeDir,"gee_basis/SRTM_Basis_7p5arcSec")
  setwd(inputFolder)
  
  # Combine all basis tables into one table
  basisAll <- list()
  for (iBasis in 1:nBasis) {
    fileBasis <- read.csv(paste0("GMTED2010_SRTM_m2_Basis_",
                                   sprintf("%02d",iBasis),".csv"))
    basisAll[[iBasis]] <- fileBasis
  }
  
  basisTab <- do.call(rbind,basisAll)
  
  setwd(outTabHome)
  write.table(basisTab[order(basisTab$id),],tableName,sep=",",row.names=F)
}

# ----- Write Raster -----
if (writeRaster == T) {
  # Read aggregated cloud/haze table
  setwd(outTabHome)
  inTable <- read.csv(tableName)
  
  # Use ids of grid cells as index to save metric as a vector
  ids <- inTable$id
  metricVec <- rep(NA,nTotalPix)
  metricVec[ids] <- inTable$mean
  
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
  
  colPal <- paste0(colorRampPalette(brewer.pal(7,"Greys"))(101),"FF")
  
  ggplot <- ggplot_raster(inName=rasterName,
                          titleName="Relative Fire\nConfidence Metric 4",
                          legendName="Topography Variance",
                          unitsName="italic('m')^'2'", units.adj=c(2,1.2),
                          break.pts=seq(0,1000,200), arrowVals=c(F,T),
                          backgroundCol="white")
  
  setwd(plotHome)
  ggsave(file=paste0(rasterName,".png"), ggplot,
         width=7.5, height=4, dpi=500, limitsize=F)
}
