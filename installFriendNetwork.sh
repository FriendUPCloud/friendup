#!/bin/bash

#
# Friend Network installation script
# Only works if Friend Core has been installed before
# To define it, run install.sh and choose to install Friend Chat
#
# Once setup.ini has been created or modified, this script can be run
# at any time.
#

# Define directories
FRIEND_FOLDER=$(pwd)

# Asks for installation path
FRIEND_BUILD="$FRIEND_FOLDER/build"
while true; do
    temp=$(dialog --backtitle "Friend Network installer" --inputbox "\
Please enter the path where Friend Core is installed:" 10 55 "$FRIEND_BUILD" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        FRIEND_BUILD="$temp"
    fi
    # Checks the path
    if [ -d "$FRIEND_BUILD" ]; then
        break;
    else
        dialog --backtitle "Friend Installer" --msgbox "\
Cannot find Friend Core in this directory...\n\
"$FRIEND_BUILD"\n\n\
Please try again." 10 55
    fi
done

# Is Friend Network already installed?
destPath="$FRIEND_BUILD/services/FriendNetwork"
fnetPath="$FRIEND_FOLDER/services/FriendNetwork"
installed=""
if [ -f "$destPath/config.js" ]; then
    installed="yes"
    dialog --defaultno --backtitle "Friend Network Installer" --yesno "\
The installer has detected a previous installation.\n\n\
Installing Friend Network again will erase the extra information from\n\
the configuration files (the ones you entered manually)...\n\n\
A copy of the files will been made to:\n\
$destPath/config.bak\n\
and you will have to port the modifications manually.\n\n\
Do you want to continue anyway?" 16 79
    if [ $? -eq "1" ]; then
        clear
        exit 1
    fi
fi

# Installs node.js
clear
echo "Checking for node.js and npm"
nv=$(node -v)
npm=$(npm -v)
if [ -z $nv ]; then
    dialog --backtitle "Friend Network Installer" --yesno "\
Friend Chat needs Node.js to work and it was not found.\n\n\
Choose YES to install it automatically\n\
or NO to install it manually: the script will\n\
exit, you install node and restart the script.\n\
Please note that you also need to install 'npm' and 'n'." 15 65
    if [ $? -eq "0" ]; then
		curl -L https://git.io/n-install | bash
    dialog --backtitle "Friend Network Installer" --msgbox "\
After installation, node needs variables defined by .bashrc to run.\n\
Unfortunately there is no option to run this script from\n\
another script (please contact us if you find one that works)\n\
This script will now end.\n\n\
Open a new shell and restart .\installFriendNetwork.sh..."  15 70
		exit 1
    else
        clear
        echo "Aborting Friend Network installation."
        exit 1
    fi
fi

if [ "$nv" \< "v8.6.0" ]; then
    dialog --backtitle "Friend Network Installer" --yesno "\
Warning! node version found: $nv.\n\
Recommended version: v8.6.0 and above.\n\n\
Choose YES to switch to version 8.6.0,\n\
or NO to abort this script..." 11 60
    if [ $? -eq "0" ]; then
        echo "Calling 'n' to change the version of node."
        n 8.6.0
    else
        clear
        echo "Aborting Friend Network installation."
        exit 1
    fi
fi

if [ -z "$npm" ]; then
    dialog --backtitle "Friend Network Installer" --msgbox "\
Node was found, but not npm. \n\
Please install npm and restart the script." 10 70
    clear
    echo "Aborting Friend Network installation."
	exit 1
fi
echo "node.js and npm found."
sleep 2

# Path to setup.ini file
CFG_PATH="$FRIEND_BUILD/cfg/cfg.ini"

# Checks if TLS keys are already defined
TLS="0"
TLSSTRING="TLS: NO.\n"
if [ -f "$FRIEND_BUILD/cfg/crt/key.pem" ]; then
    if [ -f "$FRIEND_BUILD/cfg/crt/certificate.pem" ]; then
        TLS="1"
        TLSSTRING="TLS: YES, already defined.\n"
    fi
fi

# Checks if a cfg.ini file already exists
if [ -f "$CFG_PATH" ]; then
    # Get information from cfg/cfg.ini
    dbhost=$(sed -nr "/^\[DatabaseUser\]/ { :l /^host[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
    dbname=$(sed -nr "/^\[DatabaseUser\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
    dbuser=$(sed -nr "/^\[DatabaseUser\]/ { :l /^login[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
    dbpass=$(sed -nr "/^\[DatabaseUser\]/ { :l /^password[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
    dbport=$(sed -nr "/^\[DatabaseUser\]/ { :l /^port[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
    friendCoreDomain=$(sed -nr "/^\[FriendCore\]/ { :l /^fchost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
else
    clear
    echo "Cannot find Friend Core cfg.ini file."
    echo "Please restart Friend Core installer.7"
    echo "Aborting Friend Network installation."
    echo
fi

# Removes the quotes
if [[ $dbhost == *"\""* ]]; then
    dbhost=$(echo "$dbhost" | sed -e 's/^"//' -e 's/"$//')
fi
if [[ $dbname == *"\""* ]]; then
    dbname=$(echo "$dbname" | sed -e 's/^"//' -e 's/"$//')
fi
if [[ $dbuser == *"\""* ]]; then
    dbuser=$(echo "$dbuser" | sed -e 's/^"//' -e 's/"$//')
fi
if [[ $dbpass == *"\""* ]]; then
    dbpass=$(echo "$dbpass" | sed -e 's/^"//' -e 's/"$//')
fi
if [[ $friendCoreDomain == *"\""* ]]; then
    friendCoreDomain=$(echo "$friendCoreDomain" | sed -e 's/^"//' -e 's/"$//')
fi

# Set proper values for Friend Network
if [ "$turnServer" = "" ]; then
    turnServer="ice.friendup.cloud"
fi
if [ "$stunServer" = "" ]; then
    stunServer="ice.friendup.cloud"
fi
if [ "$turnUser" = "" ]; then
    turnUser="TINA"
fi
if [ "$turnPass" = "" ]; then
    turnPass="TURNER"
fi

# Root or not?
mkdir "$FRIEND_BUILD/tryout" > /dev/null 2>&1
if [ $? -eq "0" ]; then
    SUDO=""
    rm -rf "$FRIEND_BUILD/tryout"
else
    SUDO="sudo"
fi

# Asks for TURN server credential
LOOP="0"
while true; do
    ASK="0"
    if [ "$turnServer" = "ice.friendup.cloud" ]; then
        ASK="1"
    fi
    if [ "$ASK" = "1" ]; then
        temp=$(dialog --backtitle "Friend Network installer" --inputbox "\
Friend Network needs a TURN and STUN server to work.\n\n\
Please enter the turn server address:" 12 65 "$turnServer" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnServer="$temp"
        fi
        temp=$(dialog --backtitle "Friend Network installer" --inputbox "\
Please enter the turn server username:" 10 45 "$turnUser" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnUser="$temp"
        fi
    temp=$(dialog --backtitle "Friend Network installer" --inputbox "\
Please enter the turn server password:" 10 45 "$turnPass" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnPass="$temp"
        fi
        temp=$(dialog --backtitle "Friend Network installer" --inputbox "\
Please enter the stun server address:" 10 45 "$stunServer" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            stunServer="$temp"
        fi
    fi
    dialog --defaultno --backtitle "Friend Network installer" --yesno "\
Using the following values for Friend Network:\n\n\
TURN server address: $turnServer\n\
TURN server username: $turnUser\n\
TURN server password: $turnPass\n\
STUN server address: $stunServer\n\n\
Please check the values and confirm..." 15 60
    if [ $? = "0" ]; then
        break;
    fi
done


if [ "$nv" \< "v4.5.0" ]; then
    dialog --backtitle "Friend Network installer" --yesno "\
Warning! node version found: $nv.\n\
Recommended version: v4.5.0 and above.\n\n\
Choose YES to switch to version 4.5.0,\n\
or NO to abort this script..." 11 60
    if [ $? -eq "0" ]; then
        echo "Calling 'n' to change the version of node."
        n stable
    else
        clear
        echo "Aborting Friend Network installation."
        exit 1
    fi
fi

if [ -z "$npm" ]; then
    dialog --backtitle "Friend Network installer" --msgbox "\
Node was found, but not npm. \n\
Please install npm and restart the script." 10 70
    clear
    echo "Aborting Friend Network installation."
	exit 1
fi
echo "node.js and npm found."
sleep 2

# Installs files
$SUDO rsync -ravl \
	--exclude "$fnetPath/.git*" \
	--exclude "$fnetPath/example.update_to_fup.sh" \
	"$fnetPath/." "$destPath"

# Makes a backup of the config file
if [ "$installed" = "yes" ]; then
    $SUDO cp "$destPath/config.js" "$destPath/config.bak"
fi    
$SUDO cp "$fnetPath/example.config.js" "$destPath/config.js"

# Pokes the new values in the services/FriendNetwork/config.js file
$SUDO cp "$fnetPath/example.config.js" "$destPath/config.js"
$SUDO sed -i -- 's/turn:.*/turn: '$turnServer'",/' "$destPath"/config.js
$SUDO sed -i -- 's/stun:.*/stun: '$stunServer'",/' "$destPath"/config.js
$SUDO sed -i -- 's/host .*/host : "'$friendCoreDomain'",/' "$destPath"/config.js
$SUDO sed -i -- 's/username .*/username : "'$turnUser'",/' "$destPath"/config.js
$SUDO sed -i -- 's/credential .*/credential : "'$turnPass'",/' "$destPath"/config.js
if [ "$TLS" = "1" ]; then
    $SUDO sed -i -- "s@path_to_key.pem@$FRIEND_BUILD/cfg/crt/key.pem@g" "$destPath"/config.js
    $SUDO sed -i -- "s@path_to_cert.pem@$FRIEND_BUILD/cfg/crt/certificate.pem@g" "$destPath"/config.js
else
    $SUDO sed -i -- "s@path_to_key.pem@@g" "$destPath"/config.js
    $SUDO sed -i -- "s@path_to_cert.pem@@g" "$destPath"/config.js
fi
    
$SUDO sed -i -- "s@Do not edit this file!@This file can be edited@g" "$destPath"/config.js

# Runs npm
cd "$destPath"
npm install
cd "$FRIEND_FOLDER"

# Copy server autostart
if [ ! -d "$FRIEND_BUILD/autostart" ]; then
    $SUDO mkdir "$FRIEND_BUILD/autostart"
fi
$SUDO cp "$FRIEND_FOLDER/installers/startfriendnetwork.sh" "$FRIEND_BUILD/autostart/startfriendnetwork.sh"
$SUDO chmod +x "$FRIEND_BUILD/autostart/startfriendnetwork.sh"

# Set TLS flags in cfg.ini
$SUDO sed -i -- "s@SSLEnable = 0@SSLEnable = 1@g" "$CFG_PATH"

# Set friendNetwork flags in cfg.ini without touching to the other data
flag="0"
cp /dev/null temp.ini
while read -r line
do
    name="$line"
    if [[ "$name" == *"FriendNetwork"* ]]; then
        flag="2"
    fi
    if [ $flag -eq "1" ]; then
        echo "enabled = 1" >> temp.ini
        flag="0"
    else
        echo $name >> temp.ini
        if [ $flag -eq "2" ]; then
            flag="1"
        fi
    fi
done < "$CFG_PATH"
$SUDO cp temp.ini "$CFG_PATH"
rm temp.ini

# End message
clear
echo "Friend Network installed successfully."
echo "It will be automatically started when you launch Friend Core."
echo
exit 0
