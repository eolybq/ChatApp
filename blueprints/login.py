from flask import Flask, redirect, Blueprint, url_for, render_template, request, flash, session, jsonify
from flask_oauthlib.client import OAuth
from database.postgres import insert_data, create_table, check_user, get_user_id, user_name, check_user_by_email  # Accessing the insert_data function, 
from .home import home_bp
import hashlib
import random
import os

login_bp = Blueprint('login_bp', __name__)

# oauth = OAuth()

# google = oauth.remote_app(
#     'google',
#     consumer_key=os.getenv("consumer_key"),
#     consumer_secret=os.getenv("consumer_secret"),
#     request_token_params={
#         'scope': 'email',
#     },
#     base_url='https://www.googleapis.com/oauth2/v1/',
#     request_token_url=None,
#     access_token_method='POST',
#     access_token_url='https://accounts.google.com/o/oauth2/token',
#     authorize_url='https://accounts.google.com/o/oauth2/auth',
# )

def generate_random_rgb_color():
    r = random.randint(0, 255)
    g = random.randint(0, 255)
    b = random.randint(0, 255)
    return (r, g, b)

# -----------------------GOOGLE LOGIN --------------------------------
# @login_bp.route('/login/google')
# def login_google():
#     if "user" not in session:
#         return google.authorize(callback=url_for('login_bp.authorized', _external=True))
#     else:
#         return redirect(url_for('home_bp.Home'))


# @login_bp.route('/google/callback')
# def authorized():
    
#     resp = google.authorized_response()
#     if resp is None or resp.get('access_token') is None:
#         return 'Access denied: reason=%s error=%s' % (
#             request.args['error_reason'],
#             request.args['error_description']
#         )
#     session['google_token'] = (resp['access_token'], '')
#     user_info = google.get('userinfo')
#     session["email"] = user_info.data['email']
#     session['user_id'] = ""

#     # Check if the user with this email already exists in the database
#     if not check_user_by_email(session['email']):
        
#         session["user"] = ""

#         # Generate random password for Google authenticated users
#         generated_password = hashlib.sha256(str(random.random()).encode()).hexdigest()[:10]

#         user_color = generate_random_rgb_color()

#         # Insert Google authenticated user into the database
#         insert_data(session["user"], session["email"], generated_password, user_color)
#     else:
#         session["user"] = user_name(session["email"])
#         session['user_id'] = get_user_id(session['user'])


#     return redirect(url_for('home_bp.Home'))


# @google.tokengetter
# def get_google_oauth_token():
#     return session.get('google_token')

# -----------------------NORMAL LOGIN --------------------------------

@login_bp.route('/login', methods=['POST', 'GET'])
def login():
    if "user" in session:
        return redirect(url_for('home_bp.Home'))
    else:
        from_google = False
        if request.method == "POST":
            if request.headers.get("Content-Type") == "application/json":
                data = request.get_json()
                if data:
                    session["action"] = data.get("action")
                    session["password"] = data.get("password")

                    session["email"] = data.get("email")

                    print(type(session["password"]))
                    print(url_for('home_bp.Home'))

                    if session["action"]:
                        if session["action"] == "signup":
                            user_color = generate_random_rgb_color()
                            session["name"] = data.get("name")

                            result = insert_data(session["name"], session["email"], session["password"], user_color)
                            if result == True:
                        

                                session["user"] = session["name"]
                                session["user_id"] = get_user_id(session["name"])
                                return jsonify({"success": "ok", 'redirectRoute': url_for('home_bp.Home')})
                            else:
                                return jsonify({"success": "notok"})
                        
                        elif session["action"] == "signin":
                            session["name"] = user_name(session["email"])
                            result = check_user(session["email"], session["password"])
                            if result == True:
                                session["user"] = session["name"]
                                session["user_id"] = get_user_id(session["name"])
                                return jsonify({"success": "ok", 'redirectRoute': url_for('home_bp.Home')})
                            else:
                                return jsonify({"success": "notok"})
                        return render_template("login.html")
                
        elif request.method == "GET":
                return render_template("login.html")
        return render_template("login.html")