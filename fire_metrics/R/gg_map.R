# -------------------------------------------
# Functions to plot rasters using ggplot

# Author: Tianjia Liu
# Last Updated: May 14, 2019
# -------------------------------------------

# ----- Open Packages -----
library("ggplot2"); library("ggmap"); library("maps"); library("mapdata")
library("stringr"); library("dplyr"); library("gridExtra"); library("grid")
library("reshape2"); library("tidyr"); library("forcats")

source('~/Google Drive/GlobalFires/R/globalParams.R')

world <- map_data("world")
world <- world[world$region!="Antarctica",]

ras2df <- function(inName,break.pts) {
  inRas <- raster(paste0(inName,".tif"))
  latLon <- coordinates(inRas)
  df <- data.frame(cbind(latLon,as.vector(inRas))) %>% na.omit()
  names(df) <- c("long","lat","value")
  df$value[df$value < break.pts[1]] <- break.pts[1]
  df$value[df$value > rev(break.pts)[1]] <- rev(break.pts)[1]
  df$long[which(df$long<(-170) & df$lat>(55))] <- df$long[which(df$long<(-170) & df$lat>(55))] + 360
  return(df)
}

ggplot_raster <- function(inName, titleName=F, legendName=F, subplotName=F, unitsName=F,
                          units.adj=c(0,0), break.pts, arrowVals=c(F,F), backgroundCol="black") {
  df <- ras2df(inName,break.pts)
  
  themeParams <- theme(
    axis.title = element_blank(),
    axis.text = element_blank(),
    legend.title = element_blank(),
    legend.justification = c(0,1), 
    legend.position = "none"
  )
  
  # Map title and axis labels
  map.label <- data.frame(x=-145, y=-30, label=titleName)
  x.ticks <- data.frame(x=c(-100,0,100)-4, y=rep(90,3), label=c("100°W","  0°","100°E"))
  y.ticks <- data.frame(x=190, y=c(-50,0,50)+3.5, label=c("50°S","  0°","50°N"))
  subplot.text <- data.frame(x=-185, y=90, label=subplotName)
  
  # Legend params
  lwidth <- 130; lheight <- 8
  lmid.x <- 37.5; lmin.x <- lmid.x-lwidth/2; lmax.x <- lmid.x+lwidth/2
  lmid.y <- -52; lmin.y <- lmid.y-lheight/2; lmax.y <- lmid.y+lheight/2
  lstretch.x <- 1.5; lstretch.y <- lheight/2; larrow.stretch <- 12.5
  lwidth_tot <- lwidth + larrow.stretch*2 + lstretch.x*2 + 3; lheight_tot <- 15
  scale_bar.ticks <- seq(lmin.x,lmax.x,length.out=101)
  scale_bar.width <- scale_bar.ticks[2]-scale_bar.ticks[1]
  
  # Legend scale bar
  legend.label <- data.frame(x=lmid.x, y=lmax.y+5, label=legendName)
  legend.background <- data.frame(x=lmid.x, y=lmin.y)
  scale_bar <- data.frame(x=scale_bar.ticks, y=(lmin.y+lstretch.y))
  units.label <- data.frame(x=lmax.x+8+units.adj[1], y=lmin.y-1.5+units.adj[2], label=unitsName)
  
  if (arrowVals[1] == T & arrowVals[2] == F) {
    legend.background <- data.frame(x=lmid.x-larrow.stretch/2, y=lmin.y)
    lwidth_tot <- lwidth_tot - larrow.stretch
  }
  if (arrowVals[1] == F & arrowVals[2] == T) {
    legend.background <- data.frame(x=lmid.x+larrow.stretch/2, y=lmin.y)
    lwidth_tot <- lwidth_tot - larrow.stretch
  }
  if (arrowVals[1] == F & arrowVals[2] == F) {
    lwidth_tot <- lwidth_tot - larrow.stretch*2
  }
  
  # Legend arrows
  min_arrow.long <- c(lmin.x-lstretch.x,lmin.x-lstretch.x-larrow.stretch,lmin.x-lstretch.x)
  min_arrow.lat <- seq(lmin.y,lmax.y,lstretch.y)
  max_arrow.long <- c(lmax.x+lstretch.x,lmax.x+lstretch.x+larrow.stretch,lmax.x+lstretch.x)
  max_arrow.lat <-seq(lmin.y,lmax.y,lstretch.y)
  
  min_arrow <- data.frame(long=min_arrow.long, lat=min_arrow.lat, group=rep(1,3))
  max_arrow <- data.frame(long=max_arrow.long, lat=max_arrow.lat, group=rep(1,3))
  
  # Legend ticks
  ltick.width <- 0.3
  lticks.x <- seq(lmin.x-scale_bar.width/2+ltick.width/2,lmax.x+scale_bar.width/2-ltick.width/2,length.out=length(break.pts))
  legend.text <- data.frame(x=lticks.x,y=rep(lmin.y-lstretch.y*1.1,length(break.pts)),label=break.pts)
  legend.ticks <- data.frame(x=rep(lticks.x,2),
                             y=c(rep(lmin.y,length(break.pts)),rep(lmin.y-1.5,length(break.pts))),
                             group=rep(1:length(break.pts),2))
  
  # Plot Map
  gg <- ggplot() + geom_polygon(data=world, aes(x=long, y=lat, group=group), fill=backgroundCol) +
    geom_raster(data=df, aes(x=long, y=lat, fill=value)) +
    scale_fill_gradientn(colors=colPal, breaks=break.pts, na.value=colPal[1]) +
    geom_label(data=legend.label, aes(x=x, y=y, label=label), fontface="bold", size=3.6, label.size=NA, fill="white") +
    geom_text(data=x.ticks, aes(x=x, y=y, label=label), angle=90, size=2.75) +
    geom_text(data=y.ticks, aes(x=x, y=y, label=label), size=2.75) +
    theme_minimal() + themeParams + ylim(-65,90) + xlim(-192,192)
  
  gg <- gg + geom_tile(data=legend.background, aes(x=x, y=y, fill=z), fill="white", width=lwidth_tot, height=lheight_tot) + 
    geom_tile(data=scale_bar, aes(x=x, y=y, fill=z), fill=colPal, width=lstretch.x, height=lheight) + 
    geom_line(data=legend.ticks, aes(x=x, y=y, group=group), size=ltick.width) +
    geom_text(data=legend.text, aes(x=x, y=y, label=label), size=3.2)
    
  if (is.character(titleName)) {
    gg <- gg + geom_label(data=map.label, aes(x=x, y=y, label=label),
                          fontface="italic", size=3.7, lineheight=0.9,
                          label.padding = unit(0.3,"lines"))
  }
  if (is.character(subplotName)) {
    gg <- gg + geom_text(data=subplot.text, aes(x=x, y=y, label=label), size=5.5, fontface="bold")
  }
  if (is.character(unitsName)) {
    gg <- gg + geom_label(data=units.label, aes(x=x, y=y, label=label),
                          size=2.8, fontface="italic", lineheight=0.9,
                          label.padding = unit(0.2,"lines"), label.size=NA,
                          fill="white", hjust=0, vjust=1, parse=T)
  }
  if (arrowVals[1] == T) {
    gg <- gg + geom_polygon(data=min_arrow, aes(x=long, y=lat, group=group), fill=colPal[1])
  }
  if (arrowVals[2] == T) {
    gg <- gg + geom_polygon(data=max_arrow, aes(x=long, y=lat, group=group), fill=rev(colPal)[1])
  }
  
  return(gg)
}
