# Downloading & Processing Files

For me, the most time-consuming steps in working with global fire emissions inventories is finding, download, and processing the data. Below, I summarize the essentials of downloading and processing the data. This directory includes code and ancillary files to download and process raw files for the following inventories:
1. Global Fire Emissions Database ([GFEDv4s](https://www.globalfiredata.org/); van der Werf et al., 2017)
2. Fire Inventory from NCAR ([FINNv1.5](http://bai.acom.ucar.edu/Data/fire); Wiedinmyer et al., 2011)
3. Global Fire Assimilation System ([GFASv1.2](http://gmes-atmosphere.eu/about/project_structure/input_data/d_fire/); Kaiser et al., 2012)
4. Quick Fire Emissions Dataset ([QFEDv2.5r1](https://gmao.gsfc.nasa.gov/research/science_snapshots/global_fire_emissions.php); Darmenov and da Silva, 2013)
5. Fire Energetics and Emissions Research ([FEERv1.0-G1.2](https://feer.gsfc.nasa.gov/data/emissions/); Ichoku and Ellison, 2014)

| Fire Inventory | File Type | Total File Size | Spatial Resolution |
| :--- | :--- | :--- | :--- |
| GFEDv4s | HDF5 | ~72MB/yr | 0.25° x 0.25°|
| FINNv1.5 | TXT | ~3.4GB/yr | 1 km x 1 km |
| GFASv1.2 | NetCDF | >200GB/yr | 0.1° x 0.1° |
| QFEDv2.5r1 | NetCDF | ~6.8GB/yr | 0.1° x 0.1° |
| FEERv1.0-G1.2 | NetCDF | ~1GB/yr | 0.1° x 0.1° |

*Note*: The total file size estimate is based on all species included with the inventory.

## Downloading
### 1. GFEDv4s
Annual HDF5 (with monthly timesteps and daily fraction) can be downloaded [here](https://www.geo.vu.nl/~gwerf/GFED/GFED4/). [Ancillary files](https://www.geo.vu.nl/~gwerf/GFED/GFED4/ancill), in particular, the TXT file containing the emissions factors to convert from Dry Matter (DM), are also needed. You can download the entire directory using the `wget` command:
```
wget -m -nH --cut-dirs=2 https://www.geo.vu.nl/~gwerf/GFED/GFED4/
```

### 2. FINNv1.5
Annual TXT (with daily timesteps) can be downloaded [here](http://bai.acom.ucar.edu/Data/fire). After filling out some information, you can download the compressed tar.gz files containing the TXT files. Select the GEOS-Chem formatted files.

To standarize and break-up the annual TXT files into more manageable monthly TXT files, use the `FINN_txt_monthly.R` script under `code/preprocess/`. (Note that this pre-processing step is required to use the R code to process the FINN data.) The `FINNv1p5_scale_factors.csv` under `ancill/` converts FINN emissions to units of kg.

### 3. GFASv1.2
Monthly NetCDF files (with daily timesteps) can be downloaded from the ECWMF server. However, this process is very intensive and requires a lot of storage space, since each file (per species, per month) is not compressed at 347-384 MB. Several species can be downloaded together and saved to the same file, but I prefer to download each species as a separate file. Do not download all parameters to the same file, as ECMWF has a 30GB limit per request.

You must first [register for a ECWMF account](https://apps.ecmwf.int/registration/). Then, install the ECMWF key and Python library following the instructions [here](https://confluence.ecmwf.int//display/WEBAPI/Access+ECMWF+Public+Datasets#AccessECMWFPublicDatasets-key).

I modified the example Python script from ECMWF to automate download requests to the ECMWF server (`GFAS_ECMWF.py`), which can be found in `code/downloads/`.

### 4. QFEDv2.5r1
Daily NetCDF files can be downloaded at the NASA NCCS ftp server. You can download the entire directory using the `wget` command:
```
wget -m -nH --cut-dirs=5 ftp://iesa:@ftp.nccs.nasa.gov/aerosol/emissions/QFED/v2.5r1/0.1/QFED/
```

### 5. FEERv1.0-G1.2
Monthly NetCDF files (with daily timesteps) can be downloaded [here](https://feer.gsfc.nasa.gov/data/emissions/).

## Processing
R code under `code/output/`, along with the `globalParams.R` script, transforms the raw downloaded files into monthly NetCDF or GeoTiff files with daily timesteps for a given species (in units of kg/m<sup>2</sup>/s) and given time period. The `species_names.csv` table in `ancill/` lists all possible species you can download for each inventory and is a required input that standarizes the species names and provides long names for the output NetCDF files. The full directory structure, with an input directory (Fire_raw) and output directories (Fire_nc_daily, Fire_tif_daily), should look like the following:

```
Fire_raw/
    GFEDv4s/
        ancill/
            GFED4_Emission_Factors.txt
    FINNv1p5/
        monthly_txt/
        ancill/
            FINNv1p5_scale_factors.csv
    GFASv1p2/
        2003/
        2004/
        ...
    QFEDv2p5r1/
        Y2003/
        Y2004/
        ...
    FEERv1_G1p2/
    species_names.csv
    
Fire_nc_daily/
    GFEDv4s/
    FINNv1p5/
    GFASv1p2/
    QFEDv2p5r1/
    FEERv1_G1p2/
    
Fire_tif_daily/
    GFEDv4s/
    FINNv1p5/
    GFASv1p2/
    QFEDv2p5r1/
    FEERv1_G1p2/
```

First, install the necessary R dependencies, which are listed in the `globalParams.R` script. Then, modify the `globalParams.R` script with your input and output directory paths. Make sure to also modify the `source('~/Google Drive/scripts/R/fire_inv/globalParams.R')` line with the correct path of the  `globalParams.R` script in the in the inventory-specific R scripts in `code/output_nc`. Finally, modify the input parameters (`xYears`, `xMonths`, and `varNameL`) to specify the time range and species list you want to output and source the inventory-specific R script!

### Important Notes
* GeoTiff outputs are in raster stacks, where each layer represents one timestep. GeoTiffs preserve the gridded format and are faster and more convenient to read and write in R. On default, the R routine removes temporary raster files saved to memory > 1 hour old to prevent storage issues: `removeTmpFiles(h=1)`
* NetCDF files are compressed to 2-3MB/file for GFED and 6-7MB/file for FINN, GFAS, QFED, and FEER using the [ncdf4](https://cran.r-project.org/web/packages/ncdf4/ncdf4.pdf) package. As the default, the R routine uses a compression factor of 3 (low = 1, high = 9). Note that this dramatically reduces the native file size of GFASv1.2 files downloaded from ECMWF.
* To convert the emissions into units of per m<sup>2</sup>, I used the `raster::area` function. The `areaGrid.R` script outputs a NetCDF file with area in m<sup>2</sup> per grid cell. For GFEDv4s, the `areaGrid_GFED.R` script returns the original area included with all GFEDv4s HDF files as a NetCDF file. The GFEDv4s-calculated area has very minor differences with the `raster::area` function output.
* Because the native FINN format is 1-km point locations (lat, long), FINN can essentially be gridded into any spatial resolution >1 km. The default is 0.1° x 0.1°, but you can specify another spatial resolution in the `FINNv1p5_sp_daily.R` script.
* The inventory-specific R scripts may cause R to freeze, as this may be an intensive process. Check the output files periodically to see if R is still generating new files. If not, force R to close, and re-run the script starting from the end point.

## Publications
1. van der Werf, G.R., J.T. Randerson, L. Giglio, T.T. van Leeuwen, Y. Chen, B.M. Rogers, M. Mu, M.J.E. van Marle, D.C. Morton, G.J. Collatz, R.J. Yokelson, and P.S. Kasibhatla (2017). Global fire emissions estimates during 1997-2016. *Earth Syst. Sci. Data* 9, 697–720. https://doi.org/10.5194/essd-9-697-2017

2. Wiedinmyer, C., S.K. Akagi, R.J. Yokelson, L.K. Emmons, J.J. Orlando, and A.J. Soja (2011). Model Development The Fire INventory from NCAR (FINN): a high resolution global model to estimate the emissions from open burning. *Geosci. Model Dev.* 4, 625–641. https://doi.org/10.5194/gmd-4-625-2011

3. Kaiser, J.W., A. Heil, M.O. Andreae, A. Benedetti, N. Chubarova,  L. Jones, J.J. Morcrette, M. Razinger, M.G. Schultz, M. Suttie, and G.R. van der Werf (2012). Biomass burning emissions estimated with a global fire assimilation system based on observed fire radiative power. *Biogeosciences* 9, 527–554. https://doi.org/10.5194/bg-9-527-2012

4. Darmenov, A.S. and A. da Silva (2013). The Quick Fire Emissions Dataset (QFED) - Documentation of versions 2.1, 2.2, and 2.4, NASA Technical Report Series on Global Modeling and Data Assimilation, Volume 32. http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.406.7724

5. Ichoku, C. and L. Ellison (2014). Global top-down smoke-aerosol emissions estimation using satellite fire radiative power measurements. *Atmos. Chem. Phys.* 14, 6643–6667. https://doi.org/10.5194/acp-14-6643-2014
