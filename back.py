from flask import Flask, render_template, request, jsonify
import datacube
import io
import odc.algo
import matplotlib.pyplot as plt
from datacube.utils.cog import write_cog
import base64

from deafrica_tools.plotting import display_map, rgb
dc = datacube.Datacube(app="04_Plotting")
# 15.85828652, 80.78694696
# 15.75418332, 81.02203692

app = Flask(__name__)

@app.route("/")
def hello_world():
    return render_template("main.html")

@app.route('/my_flask_route', methods=['GET', 'POST'])
def my_flask_function():
    if request.method == "POST":
        lmin = request.json['lat_min']
        lmax = request.json['lat_max']
        lnmin = request.json['lng_min']
        lnmax = request.json['lng_max']

        lat_range = (lmin, lmax)
        lon_range = (lnmin, lnmax)
        print(lat_range, lon_range)
        time_range = ('2022-01-15', '2023-02-15')
        # display_map(x=lon_range, y=lat_range)
        try:
            ds = dc.load(product="s2a_sen2cor_granule",
                            measurements=["B04_10m","B03_10m","B02_10m", "B08_10m", "SCL_20m"],
                        x=lon_range,
                        y=lat_range,
                        time=time_range,
                        output_crs='EPSG:6933',
                        resolution=(-30, 30))
        except Exception as e:
            return "Error"
        dataset = ds
        dataset =  odc.algo.to_f32(dataset)
        band_diff = dataset.B08_10m - dataset.B04_10m
        band_sum = dataset.B08_10m + dataset.B04_10m

        # Calculate NDVI and store it as a measurement in the original dataset
        ndvi = band_diff / band_sum
        plt.figure(figsize=(8, 8))
        ndvi.plot(col='time', vmin=0, vmax=1, col_wrap=3)
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png')
        img_buffer.seek(0)
        plt.savefig('./static/my_plot.png')
        # Serve the image file in the Flask app
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()

    # Return the base64 encoded PNG image as JSON
        return jsonify({'image': img_base64})
    # Calculate the components that make up the NDVI calculation

app.run(debug=True)
