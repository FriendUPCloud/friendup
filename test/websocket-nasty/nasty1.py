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

PROCESS_COUNT = 50

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
    pass

def on_error(ws, error):
    pass

def on_close(ws):
    print("socket closed (PID %d)" % os.getpid())
    sys.exit(1)

def on_open(ws):
    def run(*args):
        while True:
            time.sleep(0.001)
            s = 'x' * 1024
            z = {}
            z['abc'] = s
            ws.send(json.dumps(z))
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
