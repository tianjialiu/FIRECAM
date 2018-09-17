# FIRECAM
[FIRECAM](https://globalfires.earthengine.app/view/firecam): Fire Inventories - Regional Evaluation, Comparison, and Metrics

FIRECAM is an explorer for regional differences in fire emissions from five global fire emissions inventories:
1. Global Fire Emissions Database (GFEDv4s; van der Werf et al., 2017)
2. Fire Inventory from NCAR (FINNv1.5; Wiedinmyer et al. 2011)
3. Global Fire Assimilation System (GFASv1.2; Kaiser et al. 2012)
4. Quick Fire Emissions Dataset (QFEDv2.5r1; Darmenov and da Silva, 2013)
5. Fire Energetics and Emissions Research (FEERv1.0-G1.2; Ichoku and Ellison, 2014)

## Public Apps
(*Earth Engine Apps, no Google Earth Engine account required*)
<br><br>
![banner image](https://github.com/tianjialiu/FIRECAM/blob/master/docs/imgs/FIRECAM.jpeg)

### Step 1: Region
*Select a region.* Choose one of 14 "basis" regions, based on GFEDv4 (see table).

### GFEDv4 Basis Regions
| ID | Region Code | Region Name |
| :---: | :--- | :--- |
| 1 | BONA | Boreal North America |
| 2 | TENA | Temperate North America |
| 3 | CEAM | Central America |
| 4 | NHSA | Northern Hemisphere South America |
| 5 | SHSA | Southern Hemisphere South America |
| 6 | EURO | Europe |
| 7 | MIDE | Middle East |
| 8 | NHAF | Northern Hemisphere Africa |
| 9 | SHAF | Southern Hemisphere Africa |
| 10 | BOAS | Boreal Asia |
| 11 | CEAS | Central Asia |
| 12 | SEAS | Southeast Asia |
| 13 | EQAS | Equatorial Asia |
| 14 | AUST | Australia and New Zealand |

### Step 2: Species
*Select a species.* The six available species are CO<sub>2</sub>, CO, CH<sub>4</sub>, organic carbon (OC), black carbon (BC), and fine particulate matter (PM<sub>2.5</sub>)

### Regional Emissions
After clicking the submit button, please wait a few seconds for the default map layers and two time series plots to display. Map layers consist of emissions at 0.5 deg x 0.5 deg spatial resolution for a given species for each of the five global fire emissions inventories and fire relative fire confidence metrics at 0.25 deg x 0.25 deg spatial resolution. The two time series plots, yearly and monthly emissions by inventory, can be viewed in a new tab and exported as tables or images.
<br><br>

## Google Earth Engine Code Editor GUI
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
Click the 'UI_FIRECAM.js' script in the 'users/tl2581/FIRECAM' repository. The script should appear in the code editor. Click 'Run' in the top-right corner of the code editor to activate the UI.

## Publications
1. Liu, T., L.J. Mickley, R.S. DeFries, M.E. Marlier, M.F. Khan, M.T. Latif, and A. Karambelas (in prep). Diagnosing spatial uncertainties and relative biases in global fire emissions inventories: Indonesia as regional case study
2. van der Werf, G.R., J.T. Randerson, L. Giglio, T.T. van Leeuwen, Y. Chen, B.M. Rogers, M. Mu, M.J.E. van Marle, D.C. Morton, G.J. Collatz, R.J. Yokelson, and P.S. Kasibhatla (2017). Global fire emissions estimates during 1997-2016. *Earth Syst. Sci. Data* 9, 697–720. https://doi.org/10.5194/essd-9-697-2017
3. Wiedinmyer, C., S.K. Akagi, R.J. Yokelson, L.K. Emmons, J.J. Orlando, and A.J. Soja (2011). Model Development The Fire INventory from NCAR (FINN): a high resolution global model to estimate the emissions from open burning. *Geosci. Model Dev.* 4, 625–641. https://doi.org/10.5194/gmd-4-625-2011
4. Kaiser, J.W., A. Heil, M.O. Andreae, A. Benedetti, N. Chubarova,  L. Jones, J.J. Morcrette, M. Razinger, M.G. Schultz, M. Suttie, and G.R. van der Werf (2012). Biomass burning emissions estimated with a global fire assimilation system based on observed fire radiative power. *Biogeosciences* 9, 527–554. https://doi.org/10.5194/bg-9-527-2012
5. Darmenov, A.S. and A. da Silva (2013). The Quick Fire Emissions Dataset (QFED) - Documentation of versions 2.1, 2.2, and 2.4, NASA Technical Report Series on Global Modeling and Data Assimilation, Volume 32. http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.406.7724
6. Ichoku, C. and L. Ellison (2014). Global top-down smoke-aerosol emissions estimation using satellite fire radiative power measurements. *Atmos. Chem. Phys.* 14, 6643–6667. https://doi.org/10.5194/acp-14-6643-2014
