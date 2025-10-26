import psycopg2
from psycopg2 import pool
from flask import request, session
import os

# Create a connection pool

# Získání hodnoty environment variable
DATABASE_URL = os.getenv('POSTGRES_URL')

# Vytvoření connection pool
db_pool = pool.SimpleConnectionPool(10, 100, 
                                    database="chatapp",
                                    user="postgres", password="admin", 
                                    host="localhost", 
                                    port="5432")




def create_table():
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            cur.execute('''CREATE TABLE IF NOT EXISTS users (
                            ID SERIAL PRIMARY KEY,
                            NAME text,
                            MAIL text,
                            PASSWORD text,
                            COLOR text
                        )''')
            conn.commit()
            print("Table created successfully")
            db_pool.putconn(conn)


def insert_data(name, email, password, user_color):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT * FROM users WHERE MAIL = %s'''
            cur.execute(query, (email,))
            result = cur.fetchone()
            if result:
                print("Email already exists in the database.")
                db_pool.putconn(conn)
                return False
            else:
                query = '''INSERT INTO users (NAME, MAIL, PASSWORD, COLOR) VALUES (%s, %s, %s,%s)'''
                cur.execute(query, (name, email, password, user_color))
                conn.commit()
                print("Data inserted successfully.")
                db_pool.putconn(conn)
                return True
            
def get_user_color():
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT * FROM users'''
            cur.execute(query,)
            result = cur.fetchall()
            if result:
                db_pool.putconn(conn)
                return result
            else:
                db_pool.putconn(conn)
                return False

def get_user_id(name):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT ID FROM users WHERE NAME = %s'''
            cur.execute(query, (name,))
            result = cur.fetchone()
            if result:
                db_pool.putconn(conn)
                return result
            else:
                db_pool.putconn(conn)
                return False

def get_room_id(room):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT ID FROM rooms WHERE ROOM = %s'''
            cur.execute(query, (room,))
            result = cur.fetchone()
            if result:
                db_pool.putconn(conn)
                # print (result)
                return result
            else:
                db_pool.putconn(conn)
                return False


def check_user(email, password):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:


            query = '''SELECT * FROM users WHERE MAIL = %s AND PASSWORD = %s'''
            cur.execute(query, (email, password))
            result = cur.fetchone()
            if result:
                db_pool.putconn(conn)
                return True
            else:
                db_pool.putconn(conn)
                return 

def find_user_by_id(user_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT NAME FROM users WHERE ID = %s'''
            cur.execute(query, (user_id,))
            result = cur.fetchone()
            if result:
                db_pool.putconn(conn)
                return result[0]
            else:
                db_pool.putconn(conn)
                return False


def rooms_table():
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            cur.execute('''CREATE TABLE IF NOT EXISTS rooms (
                            ID SERIAL PRIMARY KEY,
                            ROOM text

                        
                        )''')
            conn.commit()
            print("Table rooms created successfully")
            db_pool.putconn(conn)

def insert_room(room):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''INSERT INTO rooms (ROOM) VALUES (%s)'''
            cur.execute(query, (room,))
            conn.commit()
            print("Data inserted to rooms successfully.")
            db_pool.putconn(conn)
            return True

def send_rooms():
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT ROOM FROM rooms'''  # pouze nazvy rooms
            cur.execute(query)
            result = cur.fetchall()
            rooms = [row[0] for row in result]  # pouze rooms
            db_pool.putconn(conn)
            return rooms
        
def message_create_table():
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            cur.execute('''CREATE TABLE IF NOT EXISTS messages (
                            ID SERIAL PRIMARY KEY,
                            ROOM_ID INT REFERENCES rooms(ID) ON DELETE CASCADE,
                            USER_ID INT REFERENCES users(ID) ON DELETE CASCADE,
                            MESSAGE_TEXT TEXT,
                            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )''')
                        
            conn.commit()
            print("Table rooms created successfully")
            db_pool.putconn(conn)

def insert_message(room_id, user_id, message_text):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''INSERT INTO messages (ROOM_ID, USER_ID, MESSAGE_TEXT) VALUES (%s, %s, %s)'''
            cur.execute(query, (room_id, user_id, message_text))
            conn.commit()
            print("Data inserted to rooms successfully.")
            db_pool.putconn(conn)
            return True
        
def get_messages(room_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT * FROM messages WHERE ROOM_ID = %s'''
            cur.execute(query, (room_id))
            result = cur.fetchall()
            if result:
                db_pool.putconn(conn)
                return result
            else:
                db_pool.putconn(conn)
                return False
            

def user_name(email):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT NAME FROM users WHERE MAIL = %s'''
            cur.execute(query, (email,))
            result = cur.fetchone()
            if result:
                db_pool.putconn(conn)
                return result[0]
            else:
                db_pool.putconn(conn)
                return False
            

def delete_room(room_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''DELETE FROM rooms WHERE ID = %s'''
            cur.execute(query, (room_id,))
            conn.commit()
            db_pool.putconn(conn)


def delete_messages_for_room(room_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''DELETE FROM messages WHERE ROOM_ID = %s'''
            cur.execute(query, (room_id,))
            conn.commit()
            db_pool.putconn(conn)
            

def get_last_messageid_for_roomid_and_userid(room_id, user_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT ID FROM messages WHERE ROOM_ID = %s AND USER_ID = %s ORDER BY ID DESC LIMIT 1'''
            cur.execute(query, (room_id, user_id))
            result = cur.fetchone()
            if result:
                db_pool.putconn(conn)
                return result
            else:
                db_pool.putconn(conn)
                return "No messages"



def delete_message_db(id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''DELETE FROM messages WHERE ID = %s'''
            cur.execute(query, (id,))
            conn.commit()
            db_pool.putconn(conn)


def check_user_by_email(email):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''SELECT * FROM users WHERE MAIL = %s'''
            cur.execute(query, (email,))
            result = cur.fetchone()
            if result:
                db_pool.putconn(conn)
                return True
            else:
                db_pool.putconn(conn)
                return False
            
def input_new_name_by_mail(name, email):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''UPDATE users SET NAME = %s WHERE MAIL = %s'''
            cur.execute(query, (name, email))
            conn.commit()
            db_pool.putconn(conn)

def change_name(new_name, user_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''UPDATE users SET NAME = %s WHERE ID = %s'''
            cur.execute(query, (new_name, user_id))
            conn.commit()
            db_pool.putconn(conn)


def delete_all_users_messages(user_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''DELETE FROM messages WHERE USER_ID = %s'''
            cur.execute(query, (user_id,))
            conn.commit()
            db_pool.putconn(conn)

def delete_user(user_id):
    with db_pool.getconn() as conn:
        with conn.cursor() as cur:
            query = '''DELETE FROM users WHERE ID = %s'''
            cur.execute(query, (user_id,))
            conn.commit()
            db_pool.putconn(conn)