#!/bin/bash
# This script enables debugging the node process, IF UNSURE; DO NOT USE

timestamp() {
	date
}

if pgrep "presence.js" > /dev/null
then
	echo "Presence server is running"
else
	echo "Starting FriendNetwork server"
	until node fnet.js; do
		echo "fnet server halted: " $( timestamp ) " - exitcode: $?. Respawning in 1 sec" >> restart.log
		sleep 1
	done >> error.log 2>&1
fi
