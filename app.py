# Import required Modules
from geopy.geocoders import Nominatim
from deafrica_tools.plotting import display_map, rgb
from deafrica_tools.datahandling import load_ard
from deafrica_tools.bandindices import calculate_indices
import xarray as xr
import pandas as pd
from matplotlib.colors import ListedColormap
import geopandas as gpd
import matplotlib.colors as mcolors
import numpy as np
import base64
from datacube.utils.cog import write_cog
from matplotlib.patches import Patch
import matplotlib.pyplot as plt
from flask import Flask, render_template, request, jsonify
from sklearn.ensemble import RandomForestRegressor
import plotly.graph_objs as go
import datacube
import io
import odc.algo
import plotly.io as pio
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend

# Read the shapefile using GeoPandas

dc = datacube.Datacube(app="04_Plotting")
# 15.85828652, 80.78694696
# 15.75418332, 81.02203692


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
    # Reverse geocode the coordinates
    location = geolocator.reverse((latitude, longitude))
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


def mang_ml_analysis(ds, times, lat_range, lon_range):
    ndvi = (ds.nir_1 - ds.red) / (ds.nir_1 + ds.red)
    mvi = ds.nir_1 - ds.green / ds.swir - ds.green
    ndvi_threshold = 0.4

    # Create forest mask based on NDVI
    mangrove_mask_ndvi = np.where(ndvi > ndvi_threshold, 1, 0)

    mvi_threshold = 3.5

    # Create forest mask based on MVI within the threshold range
    mangrove_mask_mvi = np.where(mvi > mvi_threshold, 1, 0)

    regular_mask = np.where(ndvi <= 0.6, True, False)

    closed_mask = np.where(ndvi > 0.6, True, False)

    mangrove = np.logical_and(mangrove_mask_ndvi, mangrove_mask_mvi)
    regular = np.logical_and(mangrove, regular_mask)
    closed = np.logical_and(mangrove, closed_mask)
    # Calculate the area of each pixel
    pixel_area = abs(ds.geobox.affine[0] * ds.geobox.affine[4])
    print('pixel_area', pixel_area)

    data = [['day', 'month', 'year', 'mangrove', 'regular', 'closed', 'total']]

    for i in range(mangrove.shape[0]):
        data_time = str(ndvi.time[i].values).split("T")[0]
        print(data_time)
        new_data_time = data_time.split("-")

        # Calculate the total mangrove cover area
        mangrove_cover_area = np.sum(mangrove[i]) * pixel_area
        regular_cover_area = np.sum(regular[i])*pixel_area
        closed_cover_area = np.sum(closed[i])*pixel_area

        original_array = np.where(ndvi > -10, 1, 0)
        original = np.sum(original_array[i]) * pixel_area
        print()
        data.append([new_data_time[2], new_data_time[1], new_data_time[0], mangrove_cover_area /
                    1000000, regular_cover_area/1000000, closed_cover_area/1000000, original/1000000])

    d = open('test.txt', 'w')
    d.writelines([",".join(map(str, i))+"\n" for i in data])
    d.close()
    df = pd.DataFrame(data[1:], columns=data[0])
    
    df["year-month"] = df["year"].astype('str') + \
        "-" + df["month"].astype('str')

    grouped_df = df.groupby(['year', 'month'])

    # Step 3: Calculate the mean of 'forest_field' for each group
    mean_forest_field = grouped_df['mangrove'].mean()

    # Step 4: Optional - Reset the index of the resulting DataFrame
    mean_forest_field = mean_forest_field.reset_index()
    print(mean_forest_field)

    df = mean_forest_field

    X = df[["year", "month"]]
    y = df["mangrove"]

    rf_regressor = RandomForestRegressor(n_estimators=100, random_state=101)
    rf_regressor.fit(X, y)
    y_pred = rf_regressor.predict(X)
    print(df, y_pred)

    df["year-month"] = df["year"].astype('str') + \
        "-" + df["month"].astype('str')
    X["year-month"] = X["year"].astype('str') + "-" + X["month"].astype('str')

    print("year-month done")

    plot_data = [
        go.Scatter(
            x=df['year-month'][df["year-month"].isin(times)],
            y=df['mangrove'],
            name="Mangrove Actual"
        ),
        go.Scatter(
            x=df['year-month'][df["year-month"].isin(times)],
            y=y_pred,
            name="Mangrove Predicted"
        )
    ]

    print("Plot plotted")

    area_name = get_area_name(np.mean(lat_range), np.mean(lon_range))
    plot_layout = go.Layout(
        title='Mangrove Cover'
    )
    fig = go.Figure(data=plot_data, layout=plot_layout)

    fig.update_layout(
        xaxis_title="Year-Month",
        yaxis_title="Mangrove Area (sq.km.)"
    )
    # print(df["year-month"].to_list())
    data = {
        "labels": df["year-month"].to_list(),
        "actual_values": df['mangrove'].tolist(),
        "predicted_values": y_pred.tolist()
    }
    # Convert plot to JSON
    plot_json = pio.to_json(fig)
    print(plot_json)
    print(area_name)
    print(data)

    return {"plot": plot_json, "area_name": area_name, "points": data}


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
        if (td == "" or fd == ""):
            query = {
                # "product": ["s2a_sen2cor_granule", "s2b_sen2cor_granule", "ls_8_c2_l2"],
                "product": "s2a_sen2cor_granule",
                "measurements": ["red", "green", "blue", "nir_1", "swir"],
                "x": lon_range,
                "y": lat_range,
                "output_crs": 'EPSG:6933',
                "resolution": (-30, 30)
            }
        else:
            query = {
                # "product": ["s2a_sen2cor_granule", "s2b_sen2cor_granule", "ls_8_c2_l2"],
                "product": "s2a_sen2cor_granule",
                "measurements": ["red", "green", "blue", "nir_1", "swir"],
                "x": lon_range,
                "y": lat_range,
                "time": (fd, td),
                "output_crs": 'EPSG:6933',
                "resolution": (-30, 30)
            }
        col = ""
        mi = -1
        ma = 1
        data = []
        try:
            ds = dc.load(**query)
            dataset = ds
            dataset = odc.algo.to_f32(dataset)
            if (ind == 'NDVI'):
                band_diff = dataset.nir_1 - dataset.red
                band_sum = dataset.nir_1 + dataset.red
                index = band_diff/band_sum
                cmap_colors = ['white', 'green']

                # Create a ListedColormap
                cmap = mcolors.ListedColormap(cmap_colors)

                col = cmap
            elif (ind == 'NDWI'):
                band_diff = dataset.green - dataset.nir_1
                band_sum = dataset.green + dataset.nir_1
                index = band_diff / band_sum
                cmap_colors = ['white', 'blue']

                # Create a ListedColormap
                cmap = mcolors.ListedColormap(cmap_colors)
                col = cmap
            else:
                mi = 1
                ma = 20
                col = "cividis"
                band_diff = dataset.nir_1 - dataset.green
                band_sum = dataset.swir - dataset.green
                index = band_diff / band_sum
                data = mangrove_analysis(dataset, index)
                # mang_ml_analysis(dataset, lat_range, lon_range)
        except Exception as e:
            print(e)
            return jsonify({'error': "No Data Found"})

        # Calculate NDVI and store it as a measurement in the original dataset
        labels = list(map(lambda x: x.split('T')[0], [
                      i for i in np.datetime_as_string(index.time.values).tolist()]))

        # Print the resulting mean_ndvi
        area_name = get_area_name(np.mean(lat_range), np.mean(lon_range))
        print(ind)
        if (ind != "Mangrove Analysis" and "ML" not in ind):
            masked_ds = index.copy()
            masked_ds = masked_ds.where(~np.isinf(masked_ds), drop=False)
            masked_ds_mean = masked_ds.mean(dim=['x', 'y'], skipna=True)
            data = list(map(lambda x: round(x, 4),
                        masked_ds_mean.values.tolist()))
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
        elif (ind == "Mangrove Analysis"):
            times = labels
            ds = dc.load(**query)
            # Create a figure with subplots
            fig, (ax_change, ax_subset1, ax_subset2) = plt.subplots(
                1, 3, figsize=(18, 6))
            gmw = dc.load(product='gmw_latest',
                          like=ds.geobox,
                          time='2015')
            ds_filtered = calculate_indices(
                ds, index='NDVI', satellite_mission='s2')
            # generate median annual summaries of NDVI
            ds_summaries = ds_filtered.NDVI.groupby(
                "time.year").median().compute()

            # Mask dataset to set pixels outside the GMW layer to `NaN`
            ds_summaries_masked = ds_summaries.where(gmw.mangrove.squeeze())

            all_mangroves = xr.where(ds_summaries_masked > 0.4, 1, np.nan)

            regular_mangroves = all_mangroves.where(ds_summaries_masked <= 0.7)
            closed_mangroves = all_mangroves.where(ds_summaries_masked > 0.7)

            mangroves = xr.concat(
                [regular_mangroves, closed_mangroves, all_mangroves],
                dim=pd.Index(["regular", "closed", "total"],
                             name="mangrove_type"),
            )

            total_mangroves = (mangroves.loc["total"] == 1).astype(int)

            # Calculate the change in mangrove extent
            old = total_mangroves.isel(year=0)
            new = total_mangroves.isel(year=-1)
            change = new - old

            # reclassify into growth, loss and stable
            growth = xr.where(change == 1, 1, np.nan)
            loss = xr.where(change == -1, -1, np.nan)
            stable = old.where(~change)
            stable = xr.where(stable == 1, 1, np.nan)

            # fig, ax = plt.subplots(1, 3, figsize=(18, 6))

            ds_summaries.isel(year=0).plot.imshow(
                ax=ax_change, cmap="Greys", vmin=-1, vmax=1, add_colorbar=False, add_labels=False
            )
            stable.plot(
                ax=ax_change, cmap=ListedColormap(["palegoldenrod"]), add_colorbar=False, add_labels=False
            )
            growth.squeeze().plot.imshow(
                ax=ax_change, cmap=ListedColormap(["lime"]), add_colorbar=False, add_labels=False
            )
            loss.plot.imshow(
                ax=ax_change, cmap=ListedColormap(["fuchsia"]), add_colorbar=False, add_labels=False
            )
            ax_change.legend(
                [
                    Patch(facecolor='lime'),
                    Patch(facecolor='fuchsia'),
                    Patch(facecolor="palegoldenrod"),
                ],
                ["New mangroves", "Loss of mangroves", "Stable mangroves"],
                loc="lower right",
            )
            plt.title('Change in mangrove extent between {} and {}'.format(
                ds_summaries.year.values[0], ds_summaries.year.values[-1]))

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
        else:
            try:
                ds1 = dc.load(product="s2a_sen2cor_granule",
                              measurements=["red", "green",
                                            "blue", "nir_1", "swir"],
                              x=lon_range,
                              y=lat_range,
                              output_crs='EPSG:6933',
                              resolution=(-30, 30))
            except Exception as e:
                return jsonify({'error': "No Data Found"})
            a = mang_ml_analysis(ds1, [i[:7] for i in labels], lat_range, lon_range)
            return jsonify(a)

    # Calculate the components that make up the NDVI calculation


app.run(host='0.0.0.0', port=5000, debug=True)
