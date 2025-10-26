from flask import Flask, redirect, Blueprint, url_for, render_template, request, flash, session
from blueprints import login_bp

logout_bp = Blueprint('logout_bp', __name__)


@logout_bp.route('/logout', methods=['POST', 'GET'])
def logout():
    if "user" in session:
        user = session["user"]
        print(f"You have been logged out, {user}", "info")
        session.pop("user", None)
        return "aoj"