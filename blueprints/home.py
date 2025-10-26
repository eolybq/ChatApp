from flask import Flask, redirect, Blueprint, url_for, render_template, request, flash, session

home_bp = Blueprint('home_bp', __name__)

@home_bp.route('/home', methods=['POST', 'GET'])
def Home():
    if "user" in session:
        return render_template("home.html")
    else:
        return redirect(url_for('login_bp.login'))
