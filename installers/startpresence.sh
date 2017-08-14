#!bin/bash

# Autostart script for Friend Chat's Presence server
# --------------------------------------------------

# Gets value from setup.ini
if [ -f "cfg/cfg.ini" ]
then
    friendChat=$(sed -nr "/^\[FriendChat\]/ { :l /^enabled[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "cfg/cfg.ini")
    if [ "$friendChat" == "1" ]
    then
        # Find the node.js task that is running the Presence server
        ALREADYRUNNING="0"
        NODETASKS=$(pgrep node)
        for i in $(echo $NODETASKS | sed "s/,/ /g")
        do
            TASKPATH=$(pwdx $i)
            if test "${TASKPATH#*services/Presence}" != "$TASKPATH"
            then
                ALREADYRUNNING="1"
            fi
        done
        # Starts Friend Network server if it is not already running
        if [ "$ALREADYRUNNING" -eq "0" ]; then
            echo "Starting Presence server."
            cd services/Presence
            node presence.js
            echo "Presence server ended."
        else
            echo "Presence server is already running."
        fi
    fi
fi

