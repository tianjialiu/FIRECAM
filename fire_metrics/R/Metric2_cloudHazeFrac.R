# -----------------------------------------------
# Metric 2: Cloud/Haze Burden (phi_cloud_haze),
# expressed as a fraction and
# weighted by MODIS FRP

# Author: Tianjia Liu
# Last Updated: July 18, 2019
# -----------------------------------------------
source('~/Google Drive/GlobalFires/R/globalParams.R')

# --- Steps ---
# 1. Run Cloud/Haze from SR
# 2. Run Cloud/Haze from QA Bits
# 3. Run Cloud/Haze merging

# ----- Parameters -----
# Bit - QA bits, SR - surface reflectance
cloudMode <- "SR" 
writeTable <- T
write2Raster <- T
mergeIdx <- F # when steps 1-2 are completed
plotMap <- F

# Set output names
if (cloudMode == "SR") {
  prefix <- "Cloud"; res <- "500m"
  rasterSubName <- "Metric2_cloudHazeFrac_SR.tif"
}
if (cloudMode == "Bit") {
  prefix <- "CloudBits"; res <- "1km"
  rasterSubName <- "Metric2_cloudHazeFrac_Bits.tif"
}
tableName <- paste0("MxD09GA_",prefix,"_2003_2017.csv")
rasterName <- "Metric2_cloudHazeFrac"

# ----- Write Table -----
if (writeTable == T) {
  # Read monthly Terra and Aqua FRP and allocate values into arrays
  frpAqua <- array(0, dim=c(nLandPix,12,nYear))
  frpTerra <- array(0, dim=c(nLandPix,12,nYear))
  
  setwd(file.path(geeHome,"MxD14A1_FRP_1km/"))
  for (iYear in seq_along(xYears)) {
    fileNames <- dir(".",paste0("MxD14A1_FRP_",xYears[iYear]))
    
    for (iMonth in 1:12) {
      mxd14a1 <- read.csv(fileNames[iMonth])
      frpAqua[,iMonth,iYear] <- mxd14a1$FRP_Aqua
      frpTerra[,iMonth,iYear] <- mxd14a1$FRP_Terra
    }
  }
  
  # Summarize FRP by month, satellite
  frpMonTerra <- apply(frpTerra,c(1,2),sum); frpMonAqua <- apply(frpAqua,c(1,2),sum)
  frpTotalTerra <- apply(frpTerra,1,sum); frpTotalAqua <- apply(frpAqua,1,sum)
  frpTotal <- frpTotalTerra + frpTotalAqua
  
  # Weight cloud/haze fraction by FRP
  cloudTableTerra <- matrix(0, nLandPix, nYear)
  cloudTableAqua <- matrix(0, nLandPix, nYear)
  for (iYear in seq_along(xYears)) {
    setwd(file.path(geeHome,"MxD09GA_",prefix,"_",res,"/"))
    cloudTableTerraYr <- rep(0, nLandPix)
    cloudTableAquaYr <- rep(0, nLandPix)
    
    # Monthly cloud/haze fraction, apply aggregated monthly FRP as weights
    for (iMonth in 1:12) {
      fileNames <- dir(".",paste0("MOD09GA_",prefix,"_",xYears[iYear]))
      cloud <- read.csv(fileNames[iMonth])
      cloud$mean[is.na(cloud$mean)] <- 0
      cloudTableTerraYr <- cloudTableTerraYr + cloud$mean*frpMonTerra[,iMonth]/
        rowSums(frpMonTerra)
      
      fileNames <- dir(".",paste0("MYD09GA_",prefix,"_",xYears[iYear]))
      cloud <- read.csv(fileNames[iMonth])
      cloud$mean[is.na(cloud$mean)] <- 0
      cloudTableAquaYr <- cloudTableAquaYr + cloud$mean*frpMonAqua[,iMonth]/
        rowSums(frpMonAqua)
    }
    
    cloudTableTerra[,iYear] <- cloudTableTerraYr
    cloudTableAqua[,iYear] <- cloudTableAquaYr
  }
  
  # Cloud/haze fraction separated by satellite, Terra and Aqua
  cloudTableTerra <- rowMeans(cloudTableTerra,na.rm=T)
  cloudTableAqua <- rowMeans(cloudTableAqua,na.rm=T)
  
  # Combine Terra/Aqua cloud/haze fraction, weighting by FRP
  cloudTable <- rowSums(cbind(cloudTableTerra*frpTotalTerra/frpTotal,
                                   cloudTableAqua*frpTotalAqua/frpTotal),na.rm=T)
  cloudTable[frpTotal==0] <- NA
  
  # Clean up cloud/haze fraction table
  cloudTable <- cbind(cloud$id,cloud$lc,cloudTableTerra,
                      cloudTableAqua,cloudTable)[order(cloud$id),]
  colnames(cloudTable) <- c("id","lc","cloudTerra","cloudAqua","cloudModis")
  
  # Save raster
  setwd(outTabHome)
  write.table(cloudTable,tableName,sep=",",row.names=F)
}

# ----- Write Raster -----
if (write2Raster == T) {
  # Read aggregated cloud/haze table
  setwd(outTabHome)
  inTable <- read.csv(tableName)
  
  # Use ids of grid cells as index to save metric as a vector
  ids <- inTable$id
  metricVec <- rep(NA,nTotalPix)
  metricVec[ids] <- inTable$cloudModis
  
  # Convert vector to raster and mask values that are 0
  metricRas <- setValues(basis,metricVec)
  metricRas[metricRas==0] <- NA
  
  # Save raster
  setwd(rasMapsHome)
  writeRaster(metricRas,rasterSubName,format="GTiff",overwrite=T)
}

# ----- Merge Cloud/Haze from QA Bits and SR -----
if (mergeIdx == T) {
  cloudFracMethod1 <- raster("Metric2_cloudHazeFrac_SR.tif")
  cloudFracMethod2 <- raster("Metric2_cloudHazeFrac_Bits.tif")
  
  # Use method 2 where method 2 < method 1
  cloudFracDiff <- cloudFracMethod1 - cloudFracMethod2
  cloudFrac <- cloudFracMethod1
  cloudFrac[cloudFracDiff > 0] <- cloudFracMethod2[cloudFracDiff > 0]
  writeRaster(cloudFrac,paste0(rasterName,".tif"),format="GTiff",overwrite=T)
  
  setwd(outTabHome)
  cloudFracTab <- read.csv("MxD09GA_Cloud_2003_2017.csv")
  cloudFracTab$cloudModisCor <- as.vector(cloudFrac)[cloudFracTab$id]
  write.table(cloudFracTab,"MxD09GA_Cloud_Corrected_2003_2017.csv",sep=",",row.names=F)
}

# ----- Plot Map -----
if (plotMap == T) {
  source('~/Google Drive/GlobalFires/R/gg_map.R')
  setwd(rasMapsHome)
  
  colPal <- paste0(colorRampPalette(c("#FFFFFF",brewer.pal(7,"Blues")))(101),"FF")
  
  ggplot <- ggplot_raster(inName=rasterName,
                          titleName="Relative Fire\nConfidence Metric 2",
                          legendName="Cloud/Haze Surface Obscuration",
                          unitsName="italic('fractional,\nFRP-weighted')",
                          units.adj=c(-2.3,-1.5),break.pts=seq(0,1,0.2))
  
  setwd(plotHome)
  ggsave(file=paste0(rasterName,".png"), ggplot,
         width=7.5, height=4, dpi=500, limitsize=F)
}
