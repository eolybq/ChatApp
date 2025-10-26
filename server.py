import eventlet  # Import eventlet
eventlet.monkey_patch()  # Patch standardní knihovny pro asynchronní operace

from flask import Flask, redirect, url_for, render_template, request, session, flash, jsonify
import requests
import json
from flask_cors import CORS
from blueprints import login_bp, home_bp, logout_bp
from datetime import timedelta
import datetime
from flask_socketio import SocketIO, join_room, leave_room, emit, rooms
from database.postgres import insert_data, create_table, check_user, insert_room, rooms_table, send_rooms, message_create_table, insert_message, get_room_id, get_messages, find_user_by_id, get_user_color, delete_room, delete_messages_for_room, delete_message_db, get_last_messageid_for_roomid_and_userid, get_user_id, input_new_name_by_mail, change_name, delete_user, delete_all_users_messages
from flask_oauthlib.client import OAuth
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)
app.secret_key = os.get_env("FLASK_KEY")
app.config['SECRET_KEY'] = os.get_env("SESSION_KEY")
app.permanent_session_lifetime = timedelta(minutes=1000)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
#oauth = OAuth(app)

apikey = os.get_env("APIKEY")

@app.route("/")
@app.route("/home")
def home():
    with app.app_context():
        rooms_table()
        create_table()
        message_create_table()

    if "user" in session:
        return render_template("home.html")
    else:
        return redirect(url_for('login_bp.login'))

# USER AUTH
app.register_blueprint(login_bp, url_prefix='/')
app.register_blueprint(logout_bp, url_prefix='/')

# HOME PAGE
app.register_blueprint(home_bp, url_prefix='/')

# SERVER SOCKET

connections = {}
rooms_users = {}

@app.route("/check_user_session", methods=["GET"])
def check_user_session():
    if "user" in session:
        return jsonify({"user": True})
    else:
        return jsonify({"user": False})

@app.route("/from_google", methods=["GET", "POST"])
def from_google():
    if "user" in session:
        if request.method == "GET":
            if session["user"] == "":
                return jsonify({"google": True})
            else:
                return jsonify({"google": False})
        else:
            return jsonify("Error")
    else:
        return jsonify({"error": "User not logged in"})

@app.route("/from_google2", methods=["POST"])
def from_google2():
    if "user" in session:
        if request.method == "POST":
            if request.headers.get("Content-Type") == "application/json":
                data = request.get_json()
                if data:
                    session["user"] = data.get("user")
                    session['user_id'] = get_user_id(session['user'])
                    input_new_name_by_mail(session["user"], session["email"])
                    return jsonify({"success": "ok", 'user': session["user"]})
                else:
                    return jsonify({"error": "Error"})
            else:
                return jsonify({"error": "Error"})
        else:
            return jsonify({"error": "Error"})
    else:
        return jsonify({"error": "User not logged in"})

@socketio.on('connect')
def handle_connect():
    with app.app_context():
        connections[request.sid] = {'user': session.get('user'), 'room': None}

@app.route("/myUser", methods=["GET"])
def myUser():
    if "user" in session:
        return jsonify({"user": session["user"], "email": session["email"]})
    else:
        return jsonify({"error": "User not logged in"})

@socketio.on('disconnect')
def handle_disconnect():
    with app.app_context():
        connections[request.sid] = None

        user = session.get("user")
        sid = request.sid

        # Iterate over all rooms
        for room, users in rooms_users.items():
            # Remove the disconnected user from all rooms
            if user in users:
                users.remove(user)
                # Emit an event to update the client-side user list for this room
                socketio.emit("update_users_list", {'room': room, 'users': users, 'user': session['user']}, room=room)
        print(rooms_users)

@socketio.on("create_room")
def handle_create_room(data):
    with app.app_context():
        room = data["room"]

        rooms_users[room] = []
        print(rooms_users)

        emit('message', {'from': 'create_room', "room": room, 'user': session['user'], 'message': f'User {session["user"]} created room {room}'}, room="manipulatingRoom")

def add_user_to_room(user, room):
    if room != 'manipulatingRoom':
        rooms_users[room].append(user)
    print(rooms_users)

def remove_user_from_room(user, room):
    rooms_users[room].remove(user)

@app.route("/save_room", methods=["GET", "POST"])
def save_room():
    if request.method == "POST":
        data = request.get_json()
        room = data["room"]
        insert_room(room) # Uložení nové místnosti do db
        return "test"

@socketio.on('join_room')
def handle_join_room(data):
    with app.app_context():
        if 'user' in session:  
            user = session["user"]
            sid = request.sid
            joined_rooms = rooms()
            for i in joined_rooms:
                if i != sid and i != "manipulatingRoom":
                    handle_leave_room({'room': i})
                    remove_user_from_room(user, i)

            room = data['room']
            join_room(room)
            add_user_to_room(user, room)

            for room, users in rooms_users.items():
                socketio.emit("update_users_list", {'room': room, 'users': users, 'user': session['user']}, room=room)
            print(rooms_users)

@socketio.on("leave_room2")
def leave_room2():
    with app.app_context():
        sid = request.sid
        joined_rooms = rooms()
        user = session["user"]
        for room in joined_rooms:
            if room != sid and room != "manipulatingRoom":
                leave_room(room)
                remove_user_from_room(user, room)
                for room, users in rooms_users.items():
                    socketio.emit("update_users_list", {'room': room, 'users': users, 'user': session['user']}, room=room)

@socketio.on('leave_room')
def handle_leave_room(data):
    with app.app_context():
        room = data['room']
        leave_room(room)
        user = session["user"]
        for room, users in rooms_users.items():
            socketio.emit("update_users_list", {'room': room, 'users': users, 'user': session['user']}, room=room)
        print(rooms_users)

@socketio.on('message')
def handle_message(data):
    with app.app_context():
        message = data['text']
        user_rooms = rooms()  # Získání seznamu místností uživatele
        sid = request.sid

        for i in user_rooms:
            if i != sid and i != "manipulatingRoom":
                user_room = i

        session["room_id"] = get_room_id(user_room)
        insert_message(session["room_id"], session["user_id"], message)

        now = datetime.datetime.now()
        format_now = now.strftime('%Y-%m-%d %H:%M:%S')
        room_id = get_room_id(user_room)
        message_id = get_last_messageid_for_roomid_and_userid(room_id, session["user_id"])

        emit('message', {'from': 'message', "message_id": message_id, 'user': session['user'], 'text': message, 'date': format_now}, room=user_room)

@app.route('/receive_rooms', methods=["POST", "GET"])
def receive_rooms():
    with app.app_context():
        rooms = send_rooms()
        if rooms:
            for room in rooms:
                if room not in rooms_users:
                    rooms_users[room] = []
        return jsonify({'rooms': rooms})

@app.route("/send_messages_from_db", methods=["POST", "GET"])
def send_messages_from_db():
    with app.app_context():
        if request.method == "POST":
            data = request.get_json()
            room = data["room"]
            room_id = get_room_id(room)
            messages = get_messages(room_id)
            message_list = []
            if messages:
                for message in messages:
                    dict = {}
                    dict["id"] = message[0]
                    dict["text"] = message[3]
                    dict["time"] = message[4].strftime('%Y-%m-%d %H:%M:%S')
                    dict["user"] = find_user_by_id(message[2])
                    message_list.append(dict)
            return jsonify({'messages': message_list})

@app.route("/color", methods=["GET"])
def color():
    with app.app_context():
        color = get_user_color()
        colors = [row[4] for row in color]
        users = [row[1] for row in color]
        colors_splitted = []

        for color in colors:
            color_split = [int(one_color_num) for one_color_num in color.strip("''()").split(",")]
            colors_splitted.append(color_split)

        return jsonify({'colors': colors_splitted, 'users': users})

@socketio.on("delete_message")
def delete_message(data):
    with app.app_context():
        message_id = data["message_id"]
        delete_message_db(message_id)
        emit('message', {'from': 'delete_message'}, room="manipulatingRoom")

@socketio.on("delete_room")
def delete_room_server(data):
    with app.app_context():
        user_room = data['room']
        delete_messages_for_room(get_room_id(user_room))
        delete_room(get_room_id(user_room))
        emit('message', {'from': 'delete_room', "room": user_room}, room="manipulatingRoom")

lmt = 6
ckey = os.get_env("CKEY")

@app.route("/gif", methods=["POST", "GET"])
def get_gif():
    try:
        if request.headers.get("Content-Type") == "application/json":
            data = request.get_json()
            if data:
                search_term = data.get("search")
                r = requests.get(
    "https://tenor.googleapis.com/v2/search?q=%s&key=%s&client_key=%s&limit=%s" % (search_term, apikey, ckey, lmt))

                if r.status_code == 200:
                    search_suggestion_list = json.loads(r.content)["results"]
                    return jsonify(search_suggestion_list)
                else:
                    return jsonify("No results found")
            else:
                return jsonify("No data")
        else: 
            return jsonify("No gifs")
    except Exception as e:
        print(e)
        return jsonify("ERROR")
    

@app.route("/featured", methods=["GET"])
def get_featured_gifs():
    try:
        if request.method == "GET":
            r = requests.get("https://tenor.googleapis.com/v2/featured?key=%s&client_key=%s&limit=%s" % (apikey, ckey, lmt))
            if r.status_code == 200:
                featured_gifs = json.loads(r.content)["results"]
                return jsonify(featured_gifs)
            else:
                return jsonify("No results found")
        else:
            return jsonify("InvalidRequest")
    except Exception as e:
        return jsonify(f"Error {e}")

@socketio.on("rename_user")
def rename_user(data):
    with app.app_context():
        new_name = data["new_name"]
        change_name(new_name, session["user_id"])
        emit('message', {'from': 'rename_user'}, room="manipulatingRoom")

@socketio.on("delete_user")
def deleteUser():
    with app.app_context():
        user_id = session["user_id"]
        for room in rooms():
            leave_room(room)
        delete_all_users_messages(user_id)
        delete_user(user_id)
        emit('message', {'from': 'delete_user'}, room="manipulatingRoom")

if __name__ == '__main__':
    app.debug = True
    socketio.run(app, allow_unsafe_werkzeug=True)
