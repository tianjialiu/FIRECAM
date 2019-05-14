# FIRECAM: Relative Fire Confidence Metrics

This folder contains the EE and R code to construct the five relative fire confidence metrics available in the FIRECAM tool. In Earth Engine, the underlying data are first processed and summarized as csv tables. (This is a very time-intensive step!) Due to computational limits, the data are separated into chunks (14 basis regions) in Earth Engine. In R, the tables are combined, processed, transformed into the five metrics. Outputs are saved as GeoTiffs and plotted using ggplot.

## Input Datasets
| Dataset | Description | Resolution | EE ID |
| :--- | :--- | :--- | :--- |
| MCD64A1 | MODIS Burned Area | 500 m, monthly, from 2000 | MODIS/006/MCD64A1 |
| MOD14A1 | MODIS/Terra Active Fires | 1 km, daily, from 2000 | MODIS/006/MOD14A1 |
| MYD14A1 | MODIS/Aqua Active Fires | 1 km, daily, from 2002 | MODIS/006/MYD14A1 |
| MOD09GA | MODIS/Terra Surface Reflectance | 500 m, daily, from 2000 | MODIS/006/MOD09GA |
| MYD09GA | MODIS/Aqua Surface Reflectance | 500 m, daily, from 2002 | MODIS/006/MYD09GA |
| MCD12Q1 | MODIS Land Cover | 500 m, yearly, 2001-2016 | MODIS/006/MCD12Q1 |
| MCD14ML | MODIS Active Fires (geolocation) | 1 km, daily, from 2000  | projects/GlobalFires/MCD14ML* |
| VNP14IMGML | VIIRS Active Fires (geolocation) | 375 m, daily, from 2012 | projects/GlobalFires/VNP14IMGML* |
| GMTED | Terrain Elevation | 375 m, 2010 | USGS/GMTED2010 |

*Note*: MCD14ML and VNP14IMGML are currently not available in the EE data catalog, but can be downloaded from the University of Maryland ftp server (https://www.globalfiredata.org/data.html).

The file directory structure of the EE-R workflow is as follows:
```
gee/
    MCD64A1_BA_500m/
    MCD64A1_ConnCount_500m/
    MxD09GA_Cloud_500m/
    MxD09GA_CloudBits_1km/
    MxD14A1_FRP_1km/
    VNP14IMGML_FRP_375m/
    ...
gee_basis/
    MCD64A1_BA_Basis_500m/
    MxD14A1_FRP_Basis_1km/
    MxD09GA_Cloud_Basis_500m/
    MxD09GA_CloudBits_Basis_1km/
    VNP14IMGML_FRP_Basis_375m/
    ...
```

## Relative Fire Confidence Metrics
| # | Metric | Range | Units | Description |
| :---: | :--- | :--- | :--- | :--- |
| 1 | BA-AFA Discrepancy | -1 to 1 | unitless | discrepancy between burned area (BA; MCD64A1) and active fire area (AFA; MxD14A1), calculated as a normalized index using the area of BA outside AFA and AFA outside BA |
| 2 | Cloud-Haze Obscuration | 0 to 1 | unitless | degree to which clouds and/or haze obscure the land surface from satellite observations of fires during fire-prone months |
| 3 | Burn Size/ Fragmentation | ≥ 0 | km<sup>2</sup> / fragment | average size of burned area per burn scar fragment (large, continuguous versus small, fragmented fire landscapes) |
| 4 | Topography Variance | ≥ 0 | m<sup>2</sup> | roughness in terrain, expressed as the variance in elevation across neighboring pixels (flat versus mountainous) |
| 5 | VIIRS FRP Outside MODIS Burn Extent | 0 to 1 | unitless | additional small fires from VIIRS (375 m), a sensor with higher spatial resolution than MODIS (500 m, 1 km) |

## Publications
1. Liu, T., L.J. Mickley, R.S. DeFries, M.E. Marlier, M.F. Khan, M.T. Latif, and A. Karambelas (in review). Diagnosing spatial uncertainties and relative biases in global fire emissions inventories: Indonesia as regional case study. *EarthArXiv*: https://dx.doi.org/10.31223/osf.io/nh57j
