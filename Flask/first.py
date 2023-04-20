from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = 'mysql://root:@localhost/logdb'

@app.route("/")
def hello_world():
    return render_template('index.html')

@app.route("/about")
def about():
    name = "About"
    return render_template('about.html', name = name)

@app.route("/bootstrap")
def bootstrap():
    return render_template('bootstrap.html')

app.run(debug = True)