#!/usr/bin/env python3
import asyncio
try:
    import websocket
except Exception:
    print('websocket import missing, try: pip3 install websocket')
    sys.exit(1)
import traceback
import time
import json
import requests
import hashlib
import os, datetime
import sys
import threading, _thread
import imp
import getopt
import argparse
import certifi, urllib3, ssl
import test_class
from test_class import TestClass

print("------------Friend Test started: " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M") )

PROCESS_COUNT = 1
TEST_COUNT = 1
MSG_INTERVAL = 1.00

#if len(sys.argv) < 4:
#    print('Usage: ./master.py host login password')
#    sys.exit(2)

HOST = "localhost"
PORT = "6502"
USER = "test1"
PASS = "1_test_1"
TEST_DIRECTORY = "tests"
SSL = False
WS_URL = ""

#PASS = hashlib.sha256(PASS.encode('utf-8')).hexdigest()

TEST_MSG_SEND = 0
TEST_MSG_SENT = 0
TEST_MSG_RETURNED = 0
TEST_MSG_RETURNED_OK = 0

SSL_OPTS={}

parser = argparse.ArgumentParser()
parser.add_argument("-l", help="login")
parser.add_argument("-p", help="password")
parser.add_argument("-ho", help="host - FriendCore host name")
parser.add_argument("-po", help="port - FriendCore port")
parser.add_argument("-t", help="test directory - which directory test should be launched")
parser.add_argument("-s", help="SSL - use secured connection (true/false)")
parser.add_argument("-pc", help="Process count - number of processes launched in same time by user")
parser.add_argument("-mi", help="Message interval - interval between test calls")

args = parser.parse_args()

if args.l is not None:
    USER = args.l
if args.p is not None:
    PASS = args.p
if args.ho is not None:
    HOST = args.ho
if args.po is not None:
    PORT = args.po
if args.t is not None:
    TEST_DIRECTORY = args.t
if args.s is not None:
    if args.s == "true":
        SSL = True
if args.pc is not None:
    PROCESS_COUNT = args.pc
if args.mi is not None:
    MSG_INTERVAL = float( args.mi )

PASS = "HASHED" + hashlib.sha256(PASS.encode('utf-8')).hexdigest()

print("--------Send request for sessionid-----")

PEM = "/home/stefkos/development/osfriend/friendup/build/cfg/crt/certificate.pem"

#
# login user

if SSL == True:
    URL = "https://" + HOST + ":" + PORT + "/system.library/login"
    WS_URL = "wss://" + HOST + ":6500/"
    SSL_OPTS = {"cert_reqs": ssl.CERT_NONE,"ca_certs": certifi.where(),"ssl_version": ssl.PROTOCOL_TLSv1_2}
    #SSL_OPTS = {"cert_reqs": ssl.CERT_NONE,"ca_certs": certifi.where(),"ssl_version": ssl.PROTOCOL_TLS_CLIENT}
else:
    URL = "http://" + HOST + ":" + PORT + "/system.library/login"
    WS_URL = "ws://" + HOST + ":6500/"

SSL_OPTS = {"cert_reqs": ssl.CERT_NONE}

# required params
PARAMS = {'username':USER, 'password':PASS, 'deviceid':'pythontest'}

#disable warning
urllib3.disable_warnings()

http = urllib3.PoolManager( cert_reqs='CERT_REQUIRED', ca_certs=certifi.where() )

#print("Using certs: " + requests.certs.where() )
# sending get request and saving the response as response object
try:
    r = requests.post(url = URL, data = PARAMS, verify=False)
 
# extracting data in json format

    data = r.json()
    SESSION_ID = data['sessionid']
except ConnectionRefusedError:
    print('Http request failed')
except:
    print('Http request failed\nsessionid was not returned')
    sys.exit(3)

print('SessionID : ' + SESSION_ID )

#
# global lists

LIST_OF_TESTS = []
LIST_OF_CLASSES = []

#
# Load class from directory/python file

def load_class( full_class_string ):
    """
    Dynamically load a class from a string
    
    >>> klass = load_class("module.submodule.ClassName")
    >>> klass2 = load_class("myfile.Class2")
    """

    #print("Load class " + full_class_string )
    class_data = full_class_string.split(".")
    
    module_str = class_data[0]
    class_str = class_data[-1]
    submodules_list = []

    if len(class_data) > 2:
        submodules_list = class_data[1:-1]

    f, filename, description = imp.find_module(module_str)
    module = imp.load_module(module_str, f, filename, description)
    
    # Find each submodule
    for smod in submodules_list:
        path = os.path.dirname(filename) if os.path.isfile(filename) else filename

        f, filename, description = imp.find_module(smod, [path])
        
        # Now we can load the module
        try:
            module = imp.load_module(" ".join(class_data[:-1]), f, filename, description)
        finally:
            if f:
                f.close()
    # Finally, we retrieve the Class
    return getattr(module, class_str)

# Parse all python files in tests directory and load classes
#

print("------------Load test classes----------")

#reqid = 0
for file in os.listdir( TEST_DIRECTORY ):
    if file.endswith(".py"):
        lpath = os.path.join( TEST_DIRECTORY+"/", file ) 
        lpath = lpath[:-3] + ".TestClass"

        #print( lpath )
        class_ = load_class( lpath )
        print('Added TestClass ' + str(class_) + ' path ' + lpath )
        LIST_OF_CLASSES.append( class_ )
# TEST purpose
#        reqid = reqid + 1
#        object_ = class_( SESSION_ID, str( reqid ) )
#        print('Added object to list ' + str( object_ ) )
#        LIST_OF_TESTS.append( object_ )
#
#for objEntry in LIST_OF_TESTS:
#    tempMsg = objEntry.generateRequest( "sss" )
#    print('Tmp message ' + tempMsg )

#customize the messages (and ws.send with SESSION_ID if needed))
MSG_LOGIN = '{"type":"con","data":{"sessionId":"%s"}}' 
#argument is session ID

def on_message(ws, message):
    global TEST_MSG_RETURNED, TEST_MSG_RETURNED_OK
    print('on message: ' + message )
    try:
        # check connection message
        msg = message.replace('\"','')
        #print('------- ' + msg )
        CONMSGFOUND = msg.find('{type:con,data:{type:pong,data:')
        if CONMSGFOUND > -1:
            TEST_MSG_RETURNED_OK += 1

        # get requestid to match it with incoming message
        POS = message.find( '"requestid"' )
        POS += 13
        POSEND = message[ POS: ].find('"')

        TEST_MSG_RETURNED += 1
        
        print('on message: checking empty value')

        if message[ POS:(POS+POSEND) ] != "":
            print('on message: position value is not empty')
            for objEntry in LIST_OF_TESTS:
                if str(reqid) == str(objEntry.getReqid() ):
                    result = objEntry.checkTest(message)
                    if result == True:
                        TEST_MSG_RETURNED_OK += 1
                    print('Received message: ' + message + ' reqid ' + str(reqid) + '\nTest finished with success: ' + str(result) )

        #msg = str( message )
        #msg = msg.replace('\\', '').replace('ok<!--separate-->','')
        #print('msg replaced : ' + msg )
        #data = json.loads(message)
        #print('Json parsed ' + str(data) )
        #if data != None:
        #    reqid = data["reqid"]
        #    print('Reqid found: ' + str( reqid ) )
        #    if reqid != None:
        #        for objEntry in LIST_OF_TESTS:
        #            if reqid == objEntry.getReqid():
        #                print('Received message: ' + message + ' reqid ' + reqid + ' result ' + objEntry.checkTest( message ) )
        #else:
        #    print('Data is null')
    except ValueError:
        print('ValueError problem')
    except BaseException as e:
        print('On WS message BaseException: ' + str(e) )
    except:
        print("Unexpected error")
    pass

def on_error(ws, error):
    print('On WS error: ' + str(error) )
    pass

def on_close(ws):
    print('On WS close')
    #sys.exit(1)

reqid = 0 # unique request id

# Websocket connection open callback

def on_open(ws):
    def run(*args):
        global TEST_COUNT, reqid
        global TEST_MSG_SENT, TEST_MSG_SEND       
 
        msg = MSG_LOGIN % (str(SESSION_ID) )
        try:
            TEST_MSG_SENT += 1
            print('Send login message')
            ws.send( msg )
            print('Sent login message')
            TEST_MSG_SEND += 1
        except:
            print('Cannot send Login message: ' + msg )
            traceback.print_exc()
            pass
        time.sleep(1.01)
        print('Before while')
        while True:
            if TEST_COUNT == 0:
                break
            TEST_COUNT -= 1
            time.sleep(MSG_INTERVAL)

            print('Going through classes')

            for classEntry in LIST_OF_CLASSES:
                reqid = reqid + 1
                object_ = classEntry( SESSION_ID, str( reqid ) )
                LIST_OF_TESTS.append( object_ )
                tempMsg = object_.generateRequest( str(object_) )
                print('Send message >' + tempMsg + '<' )
                try:
                    TEST_MSG_SENT += 1
                    ws.send(tempMsg)
                    TEST_MSG_SEND += 1
                except:
                    print('Cannot send message: ' + str(tempMsg) )
                    traceback.print_exc()
                    pass
                time.sleep(MSG_INTERVAL)
            #for objEntry in LIST_OF_TESTS:
            #    tempMsg = objEntry.generateRequest( '' )
            #    printf('Tmp message ' + tempMsg )
            #    ws.send(tempMsg)
            #ws.send(MSG_TEST % (SESSION_ID, SESSION_ID))
        #time.sleep(1.0)
        print("Before close...")
        ws.close()
        print("thread terminating...")
    t = threading.Thread(target=run)
    t.start()

websocket.enableTrace(True)

def child():
    global WS_URL
    print("Using url: " + WS_URL )
    ws = websocket.WebSocketApp( WS_URL,
                                on_message = on_message,
                                on_error = on_error,
                                on_close = on_close,
                                subprotocols=["FC-protocol"])
    ws.on_open = on_open
    ws.run_forever(sslopt=SSL_OPTS,ping_interval=70, ping_timeout=10)

#
# Start threads

startTime = time.process_time()

print("-------Starting %d processes" % PROCESS_COUNT)

pids = {}
for i in range(0, PROCESS_COUNT):
    try:
    #    newpid = os.fork()
    #    if newpid == 0:
    #     t = threading.Thread(target=child)
    #     t.start()
    #     _thread.start_new_thread( child, "Thread1", 0 )
         child()
    #    else:
    #        pids[newpid] = 1
    except:
        #pass
        print("Excetion in process creation")
        traceback.print_exc()
while True:
    print('before while')
    try:
        os.wait()
    except:
        print("os.wait: Unexpected error")
    print('in while')
    PROCESS_COUNT -= 1
    if PROCESS_COUNT == 0:
        elapsedTime = time.process_time() - startTime
        print('-------All processes ended, exiting')
        print('Elapsed time: ' + str(elapsedTime) )
        print('Messages sent: ' + str( TEST_MSG_SENT ) )
        print('Messages send: ' + str( TEST_MSG_SEND ) )
        print('Messages returned: ' + str( TEST_MSG_RETURNED ) )
        print('Messages returned with success: ' + str( TEST_MSG_RETURNED_OK ) )
        exit(0)

