# FIRECAM
[FIRECAM](https://globalfires.earthengine.app/view/firecam): Fire Inventories - Regional Evaluation, Comparison, and Metrics

FIRECAM is an online app for end-users to diagnose and explore regional differences in fire emissions from five global fire emissions inventories:
1. Global Fire Emissions Database ([GFEDv4s](https://www.globalfiredata.org/); van der Werf et al., 2017)
2. Fire Inventory from NCAR ([FINNv1.5](http://bai.acom.ucar.edu/Data/fire); Wiedinmyer et al., 2011)
3. Global Fire Assimilation System ([GFASv1.2](http://gmes-atmosphere.eu/about/project_structure/input_data/d_fire/); Kaiser et al., 2012)
4. Quick Fire Emissions Dataset ([QFEDv2.5r1](https://gmao.gsfc.nasa.gov/research/science_snapshots/global_fire_emissions.php); Darmenov and da Silva, 2013)
5. Fire Energetics and Emissions Research ([FEERv1.0-G1.2](https://feer.gsfc.nasa.gov/data/emissions/); Ichoku and Ellison, 2014)

Please see our [website](https://sites.google.com/view/firecam/home) for more information.

FIRECAM can be accessed through (1) Earth Engine Apps and (2) the Google Earth Engine (GEE) Javascript playground. While EE Apps facilitates access to FIRECAM for any user (GEE account not required), accessing the FIRECAM repository in the GEE playground allows rapid exports of timeseries and additional data analysis. The latter is also a fallback option if EE Apps is running too slowly.

### Ancillary Apps
* [GFEDv4s Explorer](https://globalfires.earthengine.app/view/gfedv4s): Explore GFEDv4s emissions (1997-2016, 2017-2020 beta estimates) for burned area and all available chemical species, partitioned by land use/land cover
    - *Note*: Burned area from small fires is approximate based on the small fire fraction for emissions
* [GFEDv4s Animated Burned Area](https://globalfires.earthengine.app/view/gfedv4s-monthly-ba-animated): Visualize the seasonality of GFEDv4s burned area. 
    - *Note*: GFEDv4s BA is averaged into monthly means. Please wait until all the images load (check the layer list in the upper-right hand corner of the map) before clicking 'Play.'
* [GFEDv4s Explorer, with Andreae (2019) EFs](https://globalfires.earthengine.app/view/gfedv4s-andreae-2019-efs): How much does the [Andreae (2019, ACP)](https://www.atmos-chem-phys.net/19/8523/2019/acp-19-8523-2019.html) emissions factors updates impact GFEDv4s emissions?
* [FIRMS Explorer](https://globalfires.earthengine.app/view/firms): Plot daily timeseries of near-real-time active fire counts from FIRMS/MODIS by region

## FIRECAM App
(*Earth Engine Apps, no Google Earth Engine account required*)
<br><br>
![banner image](https://github.com/tianjialiu/FIRECAM/blob/main/docs/imgs/FIRECAM.png)

### Step 1: Time Range
*Select a time range.* Use the start year and end year sliders to select a time range for the annual and monthly regional emissions time series charts.

### Step 2: Select Bounds Type and Region/Pixel of Interest
*Select a bounds type.* Choose 1) "Global," 2) "Basis Region," 3) "Country/Sub-Region," 4) "Pixel," 5) "Custom," or 6) "Draw."
1. **Global**: all grid cells within GFEDv4s bounds (*Note*: monthly time series plot only shown for individual years)
2. **Basis Region**: 14 broad geographic regions from GFEDv4s (van der Werf et al., 2017).
3. **Country/Sub-Region**: countries and sub-regions from simplified Large Scale International Boundary (LSIB) Polygons; those with negligible fire emissions were excluded
4. **Pixel**: individual grid cells, 0.5° x 0.5° spatial resolution; the centroid of the selected grid cell is displayed on the map
5. **Custom**: user-defined polygon using an array of longitude, latitude coordinates; the tool re-defines the polygon to match the 0.5° x 0.5° grid of the basis regions
5. **Draw**: user-defined polygon, drawn interactively on the base map; the tool re-defines the polygon to match the 0.5° x 0.5° grid of the basis regions
<br><br>
![banner image](https://github.com/tianjialiu/FIRECAM/blob/main/docs/imgs/basisRegions.png)

### Step 3: Species
*Select a species.* The six available species are CO<sub>2</sub>, CO, CH<sub>4</sub>, organic carbon (OC), black carbon (BC), and fine particulate matter (PM<sub>2.5</sub>)

### Regional Emissions
After clicking the submit button, please wait a few seconds for the default map layers and three charts to display. Note that for large regions, such as BOAS, and long time ranges, calculations for the monthly and annual time series can take up to a few minutes. The three charts (annual average from 2003-2016 and two time series charts, yearly and monthly emissions by inventory), can be viewed in a new tab and exported as tables or images. Map layers consist of emissions at 0.5° x 0.5° spatial resolution for a given species for each of the five global fire emissions inventories and fire relative fire confidence metrics (described below) at 0.25° x 0.25° spatial resolution. The distribution of peatlands (0.25° x 0.25°), based on GFEDv4s emissions from 2003-2016, and MODIS land use/land cover map (500 m, MCD12Q1 C6), based on FINNv1.0 aggregated vegetation classes, are also available as map layers. (*Tip*: Zoom in or zoom out in the web browser to adjust the displayed text.)

### Relative Fire Confidence Metrics
| # | Metric | Range | Units | Description |
| :---: | :--- | :--- | :--- | :--- |
| 1 | BA-AFA Discrepancy | -1 to 1 | unitless | discrepancy between burned area (BA; MCD64A1) and active fire area (AFA; MxD14A1), calculated as a normalized index using the area of BA outside AFA and AFA outside BA |
| 2 | Cloud-Haze Obscuration | 0 to 1 | unitless | degree to which clouds and/or haze obscure the land surface from satellite observations of fires during fire-prone months |
| 3 | Burn Size/ Fragmentation | ≥ 0 | km<sup>2</sup> / fragment | average size of burned area per burn scar fragment (large, contiguous versus small, fragmented fire landscapes) |
| 4 | Topography Variance | ≥ 0 | m<sup>2</sup> | roughness in terrain, expressed as the variance in elevation across neighboring pixels (flat versus mountainous) |
| 5 | VIIRS FRP Outside MODIS Burn Extent | 0 to 1 | unitless | additional small fires from VIIRS (375 m), a sensor with higher spatial resolution than MODIS (500 m, 1 km) |

------

(*Google Earth Engine account required*)
### Step 1: Sign up for a free Google Earth Engine account
Google Earth Engine ([GEE](https://earthengine.google.com/)) is a powerful cloud-computing platform for geospatial analysis and capable of computations with petabyte-scale datasets. To sign up, simply fill out a [form](https://signup.earthengine.google.com/) and wait for an email. GEE works best with the [Google Chrome web browser](https://www.google.com/chrome/).

### Step 2: The FIRECAM online tool repository
Copy and paste the following link in a tab in Google Chrome to enter the [GEE Javascript playground](https://code.earthengine.google.com/) and add the FIRECAM repository to your account under the read-only permissions folder in one step:
```
https://code.earthengine.google.com/?accept_repo=users/tl2581/FIRECAM
```
The repository should then appear in the top-left panel under 'Reader' as 'users/tl2581/FIRECAM'. The GEE Javascript playground is a code editor with a map and console to display or print results.

### Step 3: Diving into the GUI
Click the 'Apps/UI_FIRECAM.js' script in the 'users/tl2581/FIRECAM' repository. The script should appear in the code editor. Click 'Run' in the top-right corner of the code editor to activate the user interface. The repository also contains a script to export monthly and annual timeseries data ('Exports/UI_FIRECAM_Exports.js').

## Updates
* July 2021: updated FIRECAM, SMOKE-FIRECAM, and GFEDv4s apps with 2020 emissions
* February 2021: re-uploaded FINNv1.5 for 2018 and 2019 based on the most recent version of the annual text files; note that 2019 emissions were higher in the near-real-time files used before
* November 2020: added url support for saving the app state, cumulative sum plot, and pan map option in FIRMS app
* August 2020: added FIRMS ancillary app
* July 2020: added daily timeseries for GFEDv4s app
* April 2020: updated FIRECAM and SMOKE-FIRECAM apps with 2019 emissions
* January 2020: updated ancillary GFEDv4s apps with preliminary 2019 emissions
* October 2019: fixed FIRECAM emissions layers with 0.5° x 0.5° reprojection, updated FINNv1.5 emissions for 2016 with revised files from NCAR, added 2017-2018 emissions for all inventories; updated FIRECAM exports to allow user-defined polygons; added SMOKE-FIRECAM Tool
* September 2019: added "Draw" option to FIRECAM and GFEDv4s apps; added GFEDv4s monthly averaged burned area animation and GFEDv4s with Andreae (2019) EFs ancillary apps
* February 2019: added data download/processing code under the "fire_inv" subfolder; added "Country/Sub-Region" and "Pixel" options to FIRECAM app; created ancillary app for GFEDv4s (GFEDv4s Explorer)
* March 2019: added "Country/Sub-Region" and "Pixel" options to FIRECAM exports
* May 2019: added R/EE code for calculating the relative fire confidence metrics under the "fire_metrics" subfolder; added "Global" and "Custom" options to FIRECAM, GFEDv4s apps

## Publications
1. Liu, T., L.J. Mickley, R.S. DeFries, M.E. Marlier, M.F. Khan, M.T. Latif, and A. Karambelas (2020). Diagnosing spatial uncertainties and relative biases in global fire emissions inventories: Indonesia as regional case study. *Remote Sens. Environ.* 237, 111557. https://doi.org/10.1016/j.rse.2019.111557

2. van der Werf, G.R., J.T. Randerson, L. Giglio, T.T. van Leeuwen, Y. Chen, B.M. Rogers, M. Mu, M.J.E. van Marle, D.C. Morton, G.J. Collatz, R.J. Yokelson, and P.S. Kasibhatla (2017). Global fire emissions estimates during 1997-2016. *Earth Syst. Sci. Data* 9, 697–720. https://doi.org/10.5194/essd-9-697-2017

3. Wiedinmyer, C., S.K. Akagi, R.J. Yokelson, L.K. Emmons, J.J. Orlando, and A.J. Soja (2011). The Fire INventory from NCAR (FINN): a high resolution global model to estimate the emissions from open burning. *Geosci. Model Dev.* 4, 625–641. https://doi.org/10.5194/gmd-4-625-2011

4. Kaiser, J.W., A. Heil, M.O. Andreae, A. Benedetti, N. Chubarova,  L. Jones, J.J. Morcrette, M. Razinger, M.G. Schultz, M. Suttie, and G.R. van der Werf (2012). Biomass burning emissions estimated with a global fire assimilation system based on observed fire radiative power. *Biogeosciences* 9, 527–554. https://doi.org/10.5194/bg-9-527-2012

5. Darmenov, A.S. and A. da Silva (2013). The Quick Fire Emissions Dataset (QFED) - Documentation of versions 2.1, 2.2, and 2.4, NASA Technical Report Series on Global Modeling and Data Assimilation, Volume 32. http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.406.7724

6. Ichoku, C. and L. Ellison (2014). Global top-down smoke-aerosol emissions estimation using satellite fire radiative power measurements. *Atmos. Chem. Phys.* 14, 6643–6667. https://doi.org/10.5194/acp-14-6643-2014
