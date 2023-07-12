# Import required Modules
from flask import Flask, render_template, request, jsonify
import datacube
import io
import odc.algo
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from datacube.utils.cog import write_cog
import base64
import numpy as np
import geopandas as gpd

# Read the shapefile using GeoPandas

from deafrica_tools.plotting import display_map, rgb
dc = datacube.Datacube(app="04_Plotting")
# 15.85828652, 80.78694696
# 15.75418332, 81.02203692

from geopy.geocoders import Nominatim

def mangrove_analysis(dataset, mvi):
    ndvi = (dataset.nir_1 - dataset.red) / (dataset.nir_1 + dataset.red)
    ndvi_threshold = 0.4
    mangrove_mask_ndvi = np.where(ndvi > ndvi_threshold, 1, 0)
    mvi_threshold = 4
    mangrove_mask_mvi = np.where(mvi > mvi_threshold, 1, 0)

    mangrove = np.logical_and(mangrove_mask_ndvi, mangrove_mask_mvi)
    pixel_area = abs(dataset.geobox.affine[0] * dataset.geobox.affine[4])
    print(pixel_area)

    data = []

    for i in range(mangrove.shape[0]):
        mangrove_cover_area = np.sum(mangrove[i]) * pixel_area
        data.append(mangrove_cover_area/1000000)
    return data

# Used to get city name or the closest matching location based on the latitude and longitude provided .
def get_area_name(latitude, longitude):
    geolocator = Nominatim(user_agent='my-app')  # Initialize the geocoder
    location = geolocator.reverse((latitude, longitude))  # Reverse geocode the coordinates
    if location is not None:
        address_components = location.raw['address']
        city_name = address_components.get('city', '')
        if not city_name:
            city_name = address_components.get('town', '')
        if not city_name:
            city_name = address_components.get('village', '')
        return city_name
    else:
        return "City name not found"

# Flask App Initialization
app = Flask(__name__)

# Root Route
@app.route("/")
def home():
    return render_template("main.html")

# Route for making Data Requests
@app.route('/my_flask_route', methods=['GET', 'POST'])
def my_flask_function():
    if request.method == "POST":
        lmin = request.json['lat_min']
        lmax = request.json['lat_max']
        lnmin = request.json['lng_min']
        lnmax = request.json['lng_max']
        td = request.json['todate']
        fd = request.json['fromdate']
        ind = request.json['index']

        lat_range = (lmin, lmax)
        lon_range = (lnmin, lnmax)
        print(lat_range, lon_range)
        if(td=="" or fd==""):
            query = {
                # "product": ["s2a_sen2cor_granule", "s2b_sen2cor_granule", "ls_8_c2_l2"],
                "product": "s2a_sen2cor_granule",
                "measurements":["red","green","blue", "nir_1", "swir"],
                "x":lon_range,
                "y":lat_range,
                "output_crs":'EPSG:6933',
                "resolution":(-30, 30)
            }
        else:
            query = {
                # "product": ["s2a_sen2cor_granule", "s2b_sen2cor_granule", "ls_8_c2_l2"],
                "product": "s2a_sen2cor_granule",
                "measurements":["red","green","blue", "nir_1", "swir"],
                "x":lon_range,
                "y":lat_range,
                "time": (fd, td),
                "output_crs":'EPSG:6933',
                "resolution":(-30, 30)
            }
        col = ""
        mi = 0
        ma = 1
        data = []
        try:
            ds = dc.load(**query)
            dataset = ds
            dataset =  odc.algo.to_f32(dataset)
            if(ind == 'NDVI'):
                band_diff = dataset.nir_1 - dataset.red;
                band_sum = dataset.nir_1 + dataset.red;
                index = band_diff/band_sum;
                col = "Greens"
            elif(ind == 'NDWI'):
                band_diff = dataset.green - dataset.nir_1
                band_sum = dataset.green + dataset.nir_1
                index = band_diff / band_sum
                col = "Blues"
            else:
                mi = 1
                ma = 20
                col = "cividis"
                band_diff = dataset.nir_1 - dataset.green
                band_sum = dataset.swir - dataset.green
                index = band_diff / band_sum
                data = mangrove_analysis(dataset, index)
        except Exception as e:
            print(e)
            return jsonify({'error': "No Data Found"})

        # Calculate NDVI and store it as a measurement in the original dataset
        labels = list(map(lambda x: x.split('T')[0], [i for i in np.datetime_as_string(index.time.values).tolist()]))

        # Print the resulting mean_ndvi
        area_name = get_area_name(np.mean(lat_range), np.mean(lon_range))
        if(ind!="Mangrove Analysis"):
            masked_ds = index.copy()
            masked_ds = masked_ds.where(~np.isinf(masked_ds), drop=False)
            masked_ds_mean = masked_ds.mean(dim=['x', 'y'], skipna=True)
            data = list(map(lambda x:round(x, 4), masked_ds_mean.values.tolist()))
            plt.figure(figsize=(8, 8))
            subset = index.isel(time=[0, -1])
            subset.plot(col='time', vmin=mi, vmax=ma, col_wrap=2, cmap=col)
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png')
            img_buffer.seek(0)
            # plt.savefig('./static/my_plot.png')
            # Serve the image file in the Flask app
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            return jsonify({'image': img_base64, 'labels': labels, 'data': data, 'area': area_name})
        elif(ind=="Mangrove Analysis"):
            times = labels
            
            plt.figure(figsize=(8, 8))
                    # Load the data for the first time period
            query['time'] = times[0]
            ds1 = dc.load(**query)


            # Compute the MVI for the first time period
            mangrove1 = ((ds1.nir_1 - ds1.green) / (ds1.swir - ds1.green+0.5))*(1.5)
            # Set threshold for mangrove detection
            mangrove_thresh = 0.5

            # Create a mangrove mask
            mangrove_mask1 = np.where(mangrove1 > mangrove_thresh, 1, 0)

            # Load the data for the second time period
            query['time'] = times[1]
            ds2 = dc.load(**query)

            # Compute the MVI for the second time period
            mangrove2 = ((ds2.nir_1 - ds2.green) / (ds2.swir - ds2.green+0.5))*(1.5)
            # Create a mangrove mask
            mangrove_mask2 = np.where(mangrove2 > mangrove_thresh, 1, 0)

            # Compute the change in mangrove extent
            mangrove_change = mangrove_mask2 - mangrove_mask1

            # Create a colormap
            cmap = plt.get_cmap('PiYG')

            # Create a figure with subplots
            fig, (ax_change, ax_subset1, ax_subset2) = plt.subplots(1, 3, figsize=(18, 6))

            # Plot the change in mangrove extent on the first subplot
            im_change = ax_change.imshow(mangrove_change[-1], cmap=cmap, vmin=-1, vmax=1)
            ax_change.set_title(f'Change in Mangrove Extent from {times[0]} to {times[-1]}')
            ax_change.set_xlabel('Easting')
            ax_change.set_ylabel('Northing')
            cbar_change = fig.colorbar(im_change, ax=ax_change)
            cbar_change.ax.set_ylabel('Change in Mangrove Extent')
            ax_change.legend(
                [
                    Patch(facecolor='lime'),
                    Patch(facecolor='fuchsia'),
                    Patch(facecolor="palegoldenrod"),
                ],
                ["New mangroves", "Loss of mangroves", "Stable Mangroves"],
                loc="lower right"
            )

            # Plot the subset images on the second and third subplots
            subset1 = index.isel(time=0)
            subset1.plot(ax=ax_subset1, vmin=mi, vmax=ma, cmap=col)
            ax_subset1.set_title(f'{times[0]}')

            subset2 = index.isel(time=-1)
            subset2.plot(ax=ax_subset2, vmin=mi, vmax=ma, cmap=col)
            ax_subset2.set_title(f'{times[-1]}')

            # Adjust spacing between subplots
            fig.tight_layout()

            # Save the plot to an image buffer
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png')
            img_buffer.seek(0)

            # Convert the image buffer to base64 for display or further processing
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            return jsonify({'image': img_base64, 'labels': labels, 'data': data, 'area': area_name})
    # Calculate the components that make up the NDVI calculation

app.run(host='0.0.0.0', port=5000, debug=True)
