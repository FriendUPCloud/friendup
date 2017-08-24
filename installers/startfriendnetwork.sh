#!/bin/sh

# Autostart script for Friend Network server
# ------------------------------------------

# Gets value from setup.ini
if [ -f "cfg/cfg.ini" ]
then
    friendNetwork=$(sed -nr "/^\[FriendNetwork\]/ { :l /^enabled[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "cfg/cfg.ini")
    if [ "$friendNetwork" == "1" ]
    then
        # Find the node.js task that is running the Friend Network server
        ALREADYRUNNING="0"
        NODETASKS=$(pgrep node)
        for i in $(echo $NODETASKS | sed "s/,/ /g")
        do
            TASKPATH=$(pwdx $i)
            if test "${TASKPATH#*services/FriendNetwork}" != "$TASKPATH"
            then
                ALREADYRUNNING="1"
            fi
        done
        # Starts Friend Network server if it is not already running
        if [ "$ALREADYRUNNING" -eq "0" ]; then
            echo "Starting Friend Network server"
            cd services/FriendNetwork
            node fnet.js
            echo "Friend Network server end."
        else
            echo "Friend Network server is already running."
        fi
    fi
fi

