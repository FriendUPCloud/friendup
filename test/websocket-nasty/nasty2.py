#!/usr/bin/env python3
try:
    import websocket
except Exception:
    print('websocket import missing, try: pip3 install websocket')
    sys.exit(1)
import time
import json
import os
import sys
import threading

PROCESS_COUNT = 30
MSG_INTERVAL = 0.01

if len(sys.argv) != 2:
    print('Usage: ./nasty2.py sessionid\nLog into Friend, get the session from FUserSession database table and use it here')
    sys.exit(2)

SESSION_ID = sys.argv[1]

#customize the messages (and ws.send with SESSION_ID if needed))
MSG_LOGIN = '{"type":"con","data":{"sessionId":"%s"}}' #argument is session ID
MSG_TEST = '{"type":"msg","data":{"type":"request","requestid":"fconn-req-abjbymu8-7jd6et3a-9llhh2ce","path":"system.library/device/list","data":{"sessionid":"%s"},"sessionid":"%s"}}'

print(""" __          ________ ____   _____  ____   _____ _  ________ _______ 
 \ \        / /  ____|  _ \ / ____|/ __ \ / ____| |/ /  ____|__   __|
  \ \  /\  / /| |__  | |_) | (___ | |  | | |    | ' /| |__     | |   
   \ \/  \/ / |  __| |  _ < \___ \| |  | | |    |  < |  __|    | |   
    \  /\  /  | |____| |_) |____) | |__| | |____| . \| |____   | |   
  _  \/  \/   |______|____/|_____/ \____/ \_____|_|\_\______|  |_|   
 | \ | |   /\    / ____|__   __\ \   / /                             
 |  \| |  /  \  | (___    | |   \ \_/ /                              
 | . ` | / /\ \  \___ \   | |    \   /                               
 | |\  |/ ____ \ ____) |  | |     | |                                
 |_| \_/_/    \_\_____/   |_|     |_|""")

def on_message(ws, message):
    print("ON_MESSAGE " + message )
    pass

def on_error(ws, error):
    print("PID %d error %s" % (os.getpid(), error))
    pass

def on_close(ws):
    print("socket closed (PID %d)" % os.getpid())
    sys.exit(1)

def on_open(ws):
    def run(*args):
        print("Connection opened, sending login")
        ws.send(MSG_LOGIN % SESSION_ID)
        print("Login sent")
        while True:
            time.sleep(MSG_INTERVAL)
            ws.send(MSG_TEST % (SESSION_ID, SESSION_ID))
        time.sleep(0.1)
        ws.close()
        print("thread terminating...")
    t = threading.Thread(target=run)
    t.start()

def child():
    ws = websocket.WebSocketApp("ws://localhost:6500/",
                                on_message = on_message,
                                on_error = on_error,
                                on_close = on_close,
                                subprotocols=["FC-protocol"])
    ws.on_open = on_open
    ws.run_forever()

print('Starting %d processes' % PROCESS_COUNT)
pids = {}
for i in range(0, PROCESS_COUNT):
    newpid = os.fork()
    if newpid == 0:
        child()
    else:
        pids[newpid] = 1

while True:
    os.wait()
    PROCESS_COUNT -= 1
    if PROCESS_COUNT == 0:
        print('All processes died, exiting')
        exit(0)
