#!/usr/bin/python
import websocket
import thread
import time

def on_message(ws, message):
    print message

def on_error(ws, error):
    print error

def on_close(ws):
    print "### closed ###"

def on_open(ws):
    def run(*args):
        i = 0;
        while True:
            time.sleep(1)
            s = "Hello %d " % i
            ws.send(s)
            print s
            i += 1
        time.sleep(1)
        ws.close()
        print "thread terminating..."
    thread.start_new_thread(run, ())


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://localhost:6500/",
                                on_message = on_message,
                                on_error = on_error,
                                on_close = on_close,
                                subprotocols=["FriendApp-v1"])
    ws.on_open = on_open

    ws.run_forever()
