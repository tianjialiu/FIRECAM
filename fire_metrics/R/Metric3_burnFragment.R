# ----------------------------------------------------
# Metric 3: Burn Fragmentation & Size (phi_fragment),
# expressed as km^2/fragment

# Author: Tianjia Liu
# Last Updated: July 18, 2019
# ----------------------------------------------------
source('~/Google Drive/GlobalFires/R/globalParams.R')

# ----- Parameters -----
tableName <- "MCD64A1_ConnCount_500m_2003_2017.csv"
rasterName <- "Metric3_burnFragment"

writeTable <- F
write2Raster <- F
plotMap <- T

# ----- Write Table -----
if (writeTable == T) {
  fragmentBA <- matrix(0,nLandPix,2)
  
  # Loop over all months
  for (iMonth in 1:(nYear*12)) {
    # Monthly MCD64A1 burned area
    setwd(file.path(geeHome,"MCD64A1_BA_500m/"))
    mcd64a1 <- read.csv(dir(".","MCD64A1")[iMonth])
    
    # Monthly MCD64A1 burn fragments
    setwd(file.path(geeHome,"MCD64A1_ConnCount_500m/"))
    connCount <- read.csv(dir(".","MCD64A1")[iMonth])
    connCount <- connCount[order(connCount$id),]
    connCount$connCount <- connCount$connCount-1
    
    # Account for residual burned area
    connCount$connCount[which(mcd64a1$BA>0 & connCount$connCount == 0)] <- 1 
    fragmentBA <- fragmentBA + cbind(mcd64a1$BA,connCount$connCount)
  }
  
  # Average size of burned area per burn fragment
  avgSize <- fragmentBA[,1]/fragmentBA[,2]
  avgSize[which(fragmentBA[,1]==0)] <- NA
  
  # Clean up aggregated table
  fragmentBA <- cbind(mcd64a1$id,mcd64a1$lc,avgSize)[order(mcd64a1$id),]
  colnames(fragmentBA) <- c("id","lc","burnSize")
  
  # Write table
  setwd(outTabHome)
  write.table(fragmentBA,tableName,sep=",",row.names=F)
}

# ----- Write Raster -----
if (write2Raster == T) {
  # Read aggregated cloud/haze table
  setwd(outTabHome)
  inTable <- read.csv(tableName)
  
  # Use ids of grid cells as index to save metric as a vector
  ids <- inTable$id
  metricVec <- rep(NA,nTotalPix)
  metricVec[ids] <- inTable$burnSize
  
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
  
  colPal <- paste0(colorRampPalette(c("#FFFFFF",brewer.pal(7,"OrRd")))(101),"FF")
  
  ggplot <- ggplot_raster(inName=rasterName,
                          titleName="Relative Fire\nConfidence Metric 3",
                          legendName="Burn Size/Fragmentation",
                          unitsName="italic('km')^'2'*italic('/ fragment')",
                          units.adj=c(-2.7,1.1), break.pts=seq(0,2,0.4), arrowVals=c(F,T))
  
  setwd(plotHome)
  ggsave(file=paste0(rasterName,".png"), ggplot,
         width=7.5, height=4, dpi=500, limitsize=F)
}