#!/usr/bin/python
import websocket
import thread
import time

def on_message(ws, message):
    print 'Received:', message
    json_request = '{ "t" : "notify", "username" : "fadmin", "channel_id" : "1", "notification_type": 1, "title" : "amazing title", "message" : "amazing text" }'
    ws.send(json_request)
    ws.close()
    print json_request


def on_error(ws, error):
    print error

def on_close(ws):
    print "### closed ###"

def on_open(ws):
    time.sleep(1)
    s = '{ "t" : "auth", "key" : "cc7e9deb1d4e90ebb4e2d05d2385915377f3654c45aaf0444f00216"}'
    ws.send(s)
    print s


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://localhost:6500/",
                                on_message = on_message,
                                on_error = on_error,
                                on_close = on_close,
                                subprotocols=["FriendNotifications-v1"])
    ws.on_open = on_open

    ws.run_forever()
