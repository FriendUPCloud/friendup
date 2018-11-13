#!/bin/sh

#
# Friend Core kill script
# This script will kill Friend Core and it's associated
# servers.
#

KILLED="0"

rm -rf .friend_lock*

# Kill phoenix script
kill -9 $(ps aux | grep -e phoenix_FriendCore.sh | awk '{ print $2 }') 
if [ $? -eq "0" ]; then
    echo "Phoenix script killed."
fi
kill -9 $(ps aux | grep -e phoenix_FriendCoreGDB.sh | awk '{ print $2 }') 
if [ $? -eq "0" ]; then
    echo "PhoenixGDB script killed."
fi

# Kills Friend Core
pkill -9 FriendCore
if [ $? -eq "0" ]; then
    echo "Friend Core killed."
    KILLED="1"
fi
pkill -9 gdb
if [ $? -eq "0" ]; then
    echo "gdb killed."
    KILLED="1"
fi

# Kills node processes only if they are for Friend
NODETASKS=$(pgrep node)
for i in $(echo $NODETASKS | sed "s/,/ /g")
do
    TASKPATH=$(pwdx $i)
    if test "${TASKPATH#*services/FriendNetwork}" != "$TASKPATH"
    then
        echo "Friend Network server killed."
        kill -9 $i
        KILLED="1"
    fi
    if test "${TASKPATH#*services/FriendChat}" != "$TASKPATH"
    then
        kill -9 $i
        echo "Friend Chat server killed."
        KILLED="1"
    fi
    if test "${TASKPATH#*services/Presence}" != "$TASKPATH"
    then
        kill -9 $i
        echo "Presence server killed."
        KILLED="1"
    fi
done
if [ "$KILLED" -eq "0" ]; then
    echo "Nothing to kill."
fi
