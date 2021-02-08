from websocket_server import WebsocketServer
import signal, os
import json
from threading import Thread

def handler(signum, frame):
    print("Got signal!")
    server.send_message_to_all("message from signal\n")

PING_INDEX = 0

def ping_handler(signum, frame):
    print("Got SIGUSR2!")
    global PING_INDEX
    PING_INDEX += 1
    j = {}
    j['t'] = 'ping'
    j['i'] = PING_INDEX
    server.send_message_to_all(json.dumps(j))

signal.signal(signal.SIGUSR1, handler)
signal.signal(signal.SIGUSR2, ping_handler)

# Called for every client connecting (after handshake)
def new_client(client, server):
	print("New client connected and was given id %d" % client['id'])
	server.send_message_to_all("Hey all, a new client has joined us")


# Called for every client disconnecting
def client_left(client, server):
	print("Client(%d) disconnected" % client['id'])


# Called when a client sends a message
def message_received(client, server, message):
	if len(message) > 200:
		message = message[:200]+'..'
	print("Client(%d) said: %s" % (client['id'], message))

def input_thread():
    print("Starting input thread")
    while True:
        message = input()
        print("Sending " + message)
        server.send_message_to_all(message)

thread = Thread(target = input_thread)
thread.start()

PORT=9001
server = WebsocketServer(PORT)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()
