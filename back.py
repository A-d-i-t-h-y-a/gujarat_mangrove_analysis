from flask import Flask, render_template, request, send_file
import datacube
import io
import odc.algo
import matplotlib.pyplot as plt
from datacube.utils.cog import write_cog

from deafrica_tools.plotting import display_map, rgb
dc = datacube.Datacube(app="04_Plotting")
# 15.85828652, 80.78694696
# 15.75418332, 81.02203692

app = Flask(__name__)

@app.route("/")
def hello_world():
    return render_template("main.html")

@app.route('/my_flask_route', methods=['POST'])
def my_flask_function():
    lmin = request.form['lmin']
    lmax = request.form['lmax']
    lnmin = request.form['lnmin']
    lnmax = request.form['lnmax']

    lat_range = (lmin, lmax)
    lon_range = (lnmin, lnmax)
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
        dataset = ds
        dataset =  odc.algo.to_f32(dataset)

    # Calculate the components that make up the NDVI calculation
        band_diff = dataset.B08_10m - dataset.B04_10m
        band_sum = dataset.B08_10m + dataset.B04_10m

        # Calculate NDVI and store it as a measurement in the original dataset
        ndvi = band_diff / band_sum
        plt.figure(figsize=(8, 8))
        ndvi.plot(col='time', vmin=0, vmax=1, col_wrap=3)
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png')
        img_buffer.seek(0)
        
        # Serve the image file in the Flask app
        return send_file(img_buffer, mimetype='image/png')
    except Exception as e:
        return "No Data Found !"

app.run(debug=True)
