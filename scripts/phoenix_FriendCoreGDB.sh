#!/bin/bash

timestamp()
{
        date
}

if pgrep "FriendCore" > /dev/null
then
        echo "FriendCore on GDB is running"
else
	echo "Starting FriendCore server(GDB)"
        while true;
	do
		./GDBTrace.sh >> /dev/null 2>&1
	        echo "FriendCore halted: " $( timestamp ) " - exitcode: $?. Respawning in 1 sec" >> restart.log
	        sleep 1
        done
fi

