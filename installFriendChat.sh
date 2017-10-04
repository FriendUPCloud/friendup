#!/bin/bash

#
# Friend Chat installation script
# Only works if build/cfg/setup.ini is defined
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
    temp=$(dialog --backtitle "Friend Chat Installer" --inputbox "\
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

# Path to setup.ini file
CFG_PATH="$FRIEND_BUILD/cfg/cfg.ini"

# Checks if TLS keys are already defined
TLS="0"
TLSCOPY="0"
TLSDELETE="0"
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
    echo "Aborting Friend Chat installation."
    echo
fi

# Root or not?
mkdir "$FRIEND_BUILD/tryout" > /dev/null 2>&1
if [ $? -eq "0" ]; then
    SUDO=""
    rm -rf "$FRIEND_BUILD/tryout"
else
    SUDO="sudo"
fi

# Friend Chat installation directories
FRIENDCHATSERVERS_FOLDER="$FRIEND_BUILD/services"
FRIENDCHATAPP_FOLDER="$FRIEND_FOLDER/interfaces/web_client/apps/FriendChat"

GIT="https://github.com/FriendSoftwareLabs"

friendChat="1"

# Installs node.js
clear
echo "Checking for node.js and npm"
nv=$(node -v)
npm=$(npm -v)
if [ -z $nv ]; then
    dialog --backtitle "Friend Chat Installer" --yesno "\
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
Open a new shell and restart .\installFriendChat.sh..."  15 70
		exit 1
    else
        clear
        echo "Aborting Friend Chat installation."
        exit 1
    fi
fi

if [ "$nv" \< "v4.5.0" ]; then
    dialog --backtitle "Friend Chat Installer" --yesno "\
Warning! node version found: $nv.\n\
Recommended version: v4.5.0 and above.\n\n\
Choose YES to switch to version 4.5.0,\n\
or NO to abort this script..." 11 60
    if [ $? -eq "0" ]; then
        echo "Calling 'n' to change the version of node."
        n stable
    else
        clear
        echo "Aborting Friend Chat installation."
        exit 1
    fi
fi

if [ -z "$npm" ]; then
    dialog --backtitle "Friend Chat Installer" --msgbox "\
Node was found, but not npm. \n\
Please install npm and restart the script." 10 70
    clear
    echo "Aborting Friend Chat installation."
	exit 1
fi
echo "node.js and npm found."
sleep 2

# Checks if TLS keys are defined
TLSWARNING = "0"
SELFSIGNED="false"
if [ ! -f "$FRIEND_BUILD/cfg/crt/key.pem" ]
then
    temp=$(dialog --backtitle "Friend Chat installer" --yesno "\
Friend Chat needs TLS keys to function, and Friend Core must be\n\
in TLS mode. You need to create or link TLS keys...\n\n\
Create a new key and certificate or use links to existing ones?\n\n\
Choose YES and this script will create new self signed keys\n\
for you in the\n\
$FRIEND_BUILD/cfg/crt folder.\n\n\
Choose NO and this script will ask for the path of\n\
existing keys, and create symlinks to them." 15 75 --output-fd 1)
    if [ $? -eq "0" ]; then
        # Delete existing keys
        if [ -f "$FRIEND_BUILD/cfg/crt/key.pem" ]; then
            rm "$FRIEND_BUILD/cfg/crt/key.pem"
        fi
        if [ -f "$FRIEND_BUILD/cfg/crt/certificate.pem" ]; then
            rm "$FRIEND_BUILD/cfg/crt/certificate.pem"
        fi
        # Calls openssl to create the keys
        echo "Calling openssl to create the keys."
        $SUDO openssl req -newkey rsa:2048 -nodes -sha512 -x509 -days 3650 -nodes -out "$FRIEND_BUILD/cfg/crt/certificate.pem" -keyout "$FRIEND_BUILD/cfg/crt/key.pem"
        TLS="1"
        TLSCOPY="0"
        TLSDELETE="0"
        TLSSTRING="TLS:  YES, keys from Friend directory.\n"
    else
        temp=$(dialog --backtitle "Friend Installer (internal)" --inputbox "\
Friend Core TLS.\n\n\
Please enter the path to the private key .pem file." 10 65 "path/to/key.pem" --output-fd 1)
        if [ $? -eq "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            keyPath="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer (internal)" --inputbox "\
Friend Core TLS.\n\n\
Please enter the path to the certificate.pem file." 10 65 "path/to/certificate.pem" --output-fd 1)
        if [ $? -eq "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            certificatePath="$temp"
        fi
        # Creates symlinks to TLS keys
        $SUDO ln -s "$keyPath" "$FRIEND_BUILD/cfg/crt/key.pem"
        $SUDO ln -s "$certificatePath" "$FRIEND_BUILD/cfg/crt/certificate.pem"
        TLSWARNING="1"
        TLS="1"
    fi
fi

# Checks if the TLS keys are self-signed
temp=$(openssl verify -CAfile "$FRIEND_BUILD/cfg/crt/certificate.pem" -CApath "$FRIEND_BUILD/cfg/crt/certificate.pem" "$FRIEND_BUILD/cfg/crt/certificate.pem")
if [ "$temp" = "$FRIEND_BUILD/cfg/crt/certificate.pem: OK" ]; then
    SELFSIGNED="true";
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
    friendNetwork=$(sed -nr "/^\[FriendNetwork\]/ { :l /^enabled[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
    friendChat=$(sed -nr "/^\[FriendChat\]/ { :l /^enabled[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")

fi

# Set proper values for Friend Chat
if [ "$turnServer" = "" ]; then
    turnServer="your_turn_server.com"
fi
if [ "$stunServer" = "" ]; then
    stunServer="your_stun_server.com"
fi
if [ "$turnUser" = "" ]; then
    turnUser="your_turn_username"
fi
if [ "$turnPass" = "" ]; then
    turnPass="your_turn_password"
fi
if [ "$presenceDbHost" = "" ]; then
    presenceDbHost="$dbhost"
fi
if [ "$presenceDbPort" = "" ]; then
    presenceDbPort="$dbport"
fi
if [ "$presenceDbUser" = "" ]; then
    presenceDbUser="$dbuser"
fi
if [ "$presenceDbPass" = "" ]; then
    presenceDbPass="$dbpass"
fi
if [ "$helloDbHost" = "" ]; then
    helloDbHost="$dbhost"
fi
if [ "$helloDbPort" = "" ]; then
    helloDbPort="$dbport"
fi
if [ "$helloDbUser" = "" ]; then
    helloDbUser="$dbuser"
fi
if [ "$helloDbPass" = "" ]; then
    helloDbPass="$dbpass"
fi
if [ "$presenceDbName" = "" ]; then
    presenceDbName="presence"
fi
if [ "$helloDbName" = "" ]; then
    helloDbName="friendchat"
fi

LOOP="0"
while true; do
    ASK="0"
    if [ "$turnServer" = "your_turn_server.com" ]; then
        ASK="1"
    fi
    if [ "$LOOP" = "1" ]; then
        ASK="1"
    fi
    if [ "$ASK" = "1" ]; then
        temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Friend Chat needs a TURN and STUN server to work.\n\n\
Please enter the turn server address:" 12 65 "$turnServer" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnServer="$temp"
        fi
        temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Please enter the turn server username:" 10 45 "$turnUser" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnUser="$temp"
        fi
    temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Please enter the turn server password:" 10 45 "$turnPass" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnPass="$temp"
        fi
        temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
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

    dialog --defaultno --backtitle "Friend Chat installer" --yesno "\
Using the following values for Friend Chat:\n\n\
TURN server address: $turnServer\n\
TURN server username: $turnUser\n\
TURN server password: $turnPass\n\
STUN server address: $stunServer\n\
Presence server database name: $presenceDbName\n\
Presence server database username: $presenceDbUser\n\
Presence server database password: $presenceDbPass\n\
Friend Chat server database name: $helloDbName\n\
Friend Chat server database username: $helloDbUser\n\
Friend Chat server database password: $helloDbPass\n\n\
Please check the values and confirm..." 19 75
    if [ $? = "0" ]; then
        break;
    fi
    LOOP="1"

    temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Presence server database.\n\n\
Please enter the name of the Presence database." 11 55 "$presenceDbName" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        presenceDbName="$temp"
    fi
    temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Presence server database.\n\n\
Please enter a mysql user name for Presence,\n\
it can be an existing user name or a new one,\n\
but must be different from 'root'." 13 65 "$presenceDbUser" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        presenceDbUser="$temp"
    fi
    temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Presence server database.\n\n\
Please enter the password\n\
for mysql user $presenceDbUser:" 11 60 "$presenceDbPass" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        presenceDbPass="$temp"
    fi
    temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Friend Chat server database.\n\n\
Please enter the name of the Friend Chat database." 12 60 "$helloDbName" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        helloDbName="$temp"
    fi
    temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Friend Chat server database.\n\n\
Please enter a mysql user name for the Friend Chat,\n\
server database. It can be an existing user name or,\n\
a new one but must be different from 'root'." 13 65 "$helloDbUser" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        helloDbUser="$temp"
    fi
    temp=$(dialog --backtitle "Friend Chat installer" --inputbox "\
Friend Chat server database.\n\n\
Please enter the password\n\
for mysql user $helloDbUser:" 10 50 "$helloDbPass" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        helloDbPass="$temp"
    fi
done

# Asks for mysql root password
while true; do
    mysqlRootPass=$(dialog --backtitle "Friend Chat installer" --passwordbox "Please enter mysql root password:" 8 50 --output-fd 1)
    if [ $? = "1" ]
    then
        clear
        echo "Aborting installation."
        exit 1
    fi
    # Checks mysql root password
    export MYSQL_PWD=$mysqlRootPass
    mysql -u root -e ";"
    if [ $? -eq "0" ]; then
        break;
    fi
    mysqlRootPass=$(dialog --backtitle "Friend Chat installer" --msgbox "Incorrect password. Please try again." 8 50 --output-fd 1)
done
export MYSQL_PWD=""
clear

# INSTALLATION OF THE PRESENCE SERVER
# -----------------------------------
npm install bcrypt

# Stores the GIT password for 1 minute to avoid entering it 3 times
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=60'

# Clone 'presence' from GIT in temp directory
tempPath="/home/$USER/frienduptemp"
presencePath="$FRIENDCHATSERVERS_FOLDER/Presence"
if [ -d "$tempPath" ]; then
    rm -rf "$tempPath"
fi
echo "Cloning Presence server from GIT"
mkdir "$tempPath"
cd "$tempPath"
git clone $GIT/presence.git .
# Copies all the files in friendup build directory, and removes temp
if [ ! -d "$presencePath" ]; then
    $SUDO mkdir "$presencePath"
fi
$SUDO rsync -ravl . "$presencePath"
rm -rf $tempPath
cd "$FRIEND_FOLDER"

# Copies example.config.js file to config.js
$SUDO cp "$presencePath"/example.config.js "$presencePath"/config.js

# Pokes the new values in the presence/config.js file
$SUDO sed -i -- "s@presence_database_host@$presenceDbHost@g" "$presencePath"/config.js
$SUDO sed -i -- "s@3306@$presenceDbPort@g" "$presencePath"/config.js
$SUDO sed -i -- "s@presence_database_user@$presenceDbUser@g" "$presencePath"/config.js
$SUDO sed -i -- "s@presence_database_password@$presenceDbPass@g" "$presencePath"/config.js
$SUDO sed -i -- "s@presence_database_name@$presenceDbName@g" "$presencePath"/config.js
$SUDO sed -i -- "s@presence_domain@$friendCoreDomain@g" "$presencePath"/config.js
$SUDO sed -i -- "s@path_to_key.pem@$FRIEND_BUILD/cfg/crt/key.pem@g" "$presencePath"/config.js
$SUDO sed -i -- "s@path_to_cert.pem@$FRIEND_BUILD/cfg/crt/certificate.pem@g" "$presencePath"/config.js
$SUDO sed -i -- "s@friendcore_domain@$friendCoreDomain@g" "$presencePath"/config.js
$SUDO sed -i -- "s@stun_url.com@$stunAddress@g" "$presencePath"/config.js
$SUDO sed -i -- "s@turn_url.com@$turnAddress@g" "$presencePath"/config.js
$SUDO sed -i -- "s@turn_username@$turnUser@g" "$presencePath"/config.js
$SUDO sed -i -- "s@turn_password@$turnPass@g" "$presencePath"/config.js
$SUDO sed -i -- "s@Do not edit this file!@This file can be edited@g" "$presencePath"/config.js

# Temporary store the password in system variable to avoid warnings
export MYSQL_PWD=$mysqlRootPass

# Connection strings
mysqlAdminConnect="--host=$dbhost --port=$dbport --user=root"
mysqlconnect="--host=$dbhost --port=$dbport --user=$presenceDbUser"
mysqlconnectdb=$mysqlconnect" --database=$presenceDbName"

# Checks if user is already present or not, and creates it eventually
userExists=$(mysql $mysqlAdminConnect \
	--execute="SELECT mu.User FROM mysql.user AS mu WHERE mu.User='$presenceDbUser'")
if [ "$userExists" = "" ]; then
	echo "Setting up user: $presenceDbUser"
	# Creates user
	mysql $mysqlAdminConnect \
		--execute="CREATE USER $presenceDbUser@$dbhost IDENTIFIED BY '$presenceDbPass';"
else
	echo "User $presenceDbUser already exists, skipping"
fi

# Checks if database is already created
dbpresent=$(mysql $mysqlAdminConnect \
	--execute="SHOW DATABASES LIKE '$presenceDbName'")
if [ `echo "$dbpresent" | grep -c "$presenceDbName"` -gt 0 ]; then
	echo "Database $presenceDbName was found, skipping"
	# Grants access to db in case user did not exist
	mysql $mysqlAdminConnect \
		--execute="GRANT ALL PRIVILEGES ON $presenceDbName.* TO $presenceDbUser@$dbhost;"
	# Cleans memory
	mysql $mysqlAdminConnect \
		--execute="FLUSH PRIVILEGES;"
else
	# Creates database
	echo "Creating database: $presenceDbName"
	mysql $mysqlAdminConnect \
		--execute="CREATE DATABASE $presenceDbName"
	# Grants access to db
	mysql $mysqlAdminConnect \
		--execute="GRANT ALL PRIVILEGES ON $presenceDbName.* TO $presenceDbUser@$dbhost;"
	# Cleans memory
	mysql $mysqlAdminConnect \
		--execute="FLUSH PRIVILEGES;"
	# Switch to user
	export MYSQL_PWD=$presenceDbPass
	# Creates tables
	echo "Creating tables"
	mysql $mysqlconnectdb \
		--execute="SOURCE $presencePath/db/tables.sql"
fi
sleep 1

# Switch to user if not already done
export MYSQL_PWD=$presenceDbPass

echo "Running update procedures"
mysql $mysqlconnectdb \
	--execute="SOURCE $presencePath/db/procedures.sql"

# Deletes dangerous variable
export MYSQL_PWD=''

# Initialize node module
cd "$presencePath"
npm install
cd "$FRIEND_FOLDER"

# Installation of the Friend Chat Server
# --------------------------------------

# Clone friendchat repository into a temp folder
helloPath="$FRIENDCHATSERVERS_FOLDER/FriendChat"
echo "Cloning Friend Chat server from GIT"
if [ -d "$tempPath" ]; then
    rm -rf "$tempPath"
fi
mkdir "$tempPath"
cd "$tempPath"
git clone -b dev $GIT/friendchat.git .

# Copies all the files in friend build directory
if [ ! -d "$helloPath" ]; then
    $SUDO mkdir "$helloPath"
fi
cd "$tempPath/server"
$SUDO rsync -ravl . "$helloPath"
cd "$FRIEND_FOLDER"

# Copies example.config.js file to config.js
$SUDO cp "$helloPath"/example.config.js "$helloPath"/config.js

# Pokes the new values in the presence/config.js file
$SUDO sed -i -- "s@dev : false@dev : $SELFSIGNED@g" "$helloPath"/config.js
$SUDO sed -i -- "s@hello_database_host@$dbhost@g" "$helloPath"/config.js
$SUDO sed -i -- "s@3306@$dbport@g" "$helloPath"/config.js
$SUDO sed -i -- "s@hello_database_user@$helloDbUser@g" "$helloPath"/config.js
$SUDO sed -i -- "s@hello_database_password@$helloDbPass@g" "$helloPath"/config.js
$SUDO sed -i -- "s@hello_database_name@$helloDbName@g" "$helloPath"/config.js
$SUDO sed -i -- "s@path_to_key.pem@$FRIEND_BUILD/cfg/crt/key.pem@g" "$helloPath"/config.js
$SUDO sed -i -- "s@path_to_cert.pem@$FRIEND_BUILD/cfg/crt/certificate.pem@g" "$helloPath"/config.js
$SUDO sed -i -- "s@friendcore_host@$friendCoreDomain@g" "$helloPath"/config.js
$SUDO sed -i -- "s@presence_domain@$friendCoreDomain@g" "$helloPath"/config.js
$SUDO sed -i -- "s@stun_url.com@$stunAddress@g" "$helloPath"/config.js
$SUDO sed -i -- "s@turn_url.com@$turnAddress@g" "$helloPath"/config.js
$SUDO sed -i -- "s@turn_username@$turnUser@g" "$helloPath"/config.js
$SUDO sed -i -- "s@turn_password@$turnPass@g" "$helloPath"/config.js
$SUDO sed -i -- "s@Do not edit this file@This file can be edited@g" "$helloPath"/config.js

# Temporary store the password in system variable to avoid warnings
export MYSQL_PWD=$mysqlRootPass

# Set database connexion variables
mysqlconnect="--host=$dbhost --port=$dbport --user=$helloDbUser"
mysqlconnectdb=$mysqlconnect" --database=$helloDbName"

# Checks if user is already present or not, and creates it eventually
userExists=$(mysql $mysqlAdminConnect \
	--execute="SELECT mu.User FROM mysql.user AS mu WHERE mu.User='$helloDbUser'")
if [ "$userExists" = "" ]; then
	echo "Setting up user: $helloDbUser"
	# Creates user
	mysql $mysqlAdminConnect \
		--execute="CREATE USER $helloDbUser@$dbhost IDENTIFIED BY '$helloDbPass';"
else
	echo "User $helloDbUser already exists, skipping"
fi

# Checks for database existence and creates it if not present
dbpresent=$(mysql $mysqlAdminConnect \
	--execute="SHOW DATABASES LIKE '$helloDbName'")
if [ `echo "$dbpresent" | grep -c "$helloDbName"` -gt 0 ]; then
	echo "Database $helloDbName was found, skipping"
	# Grants access to db in case user did not exist
	mysql $mysqlAdminConnect \
		--execute="GRANT ALL PRIVILEGES ON $helloDbName.* TO $helloDbUser@$dbhost;"
	# Cleans memory
	mysql $mysqlAdminConnect \
		--execute="FLUSH PRIVILEGES;"
else
	# Creates database
	echo "Creating database: $helloDbName"
	mysql $mysqlAdminConnect \
		--execute="CREATE DATABASE $helloDbName"
	# Grants access to db
	mysql $mysqlAdminConnect \
		--execute="GRANT ALL PRIVILEGES ON $helloDbName.* TO $helloDbUser@$dbhost;"
	# Cleans memory
	mysql $mysqlAdminConnect \
		--execute="FLUSH PRIVILEGES;"
	# Switch to user
	export MYSQL_PWD=$helloDbPass
	# Creates tables
	echo "Creating tables"
	mysql $mysqlconnectdb \
		--execute="SOURCE $helloPath/scripts/sql/tables.sql"
fi
sleep 1

# Switch to user if not switched before
export MYSQL_PWD=$helloDbPass

echo "Running update procedures"
mysql $mysqlconnectdb \
	--execute="SOURCE $helloPath/scripts/sql/procedures.sql"

# Removes dangerous variable
export MYSQL_PWD=''

# Initialize node module
cd "$helloPath"
npm install
cd "$FRIEND_FOLDER"

# Installation of the Friend Chat application
# -------------------------------------------

# Copies all the files into friendup build directory
helloPath="$FRIEND_BUILD/resources/webclient/apps/FriendChat"
if [ ! -d "$helloPath" ]; then
    $SUDO mkdir "$helloPath"
fi
cd "$tempPath/client"
$SUDO rsync -ravl . "$helloPath"

# Delete temp directory
rm -rf "$tempPath"
cd "$FRIEND_FOLDER"

# Copies example.local.config.js file to local.config.js
$SUDO cp "$helloPath/example.local.config.js" "$helloPath/local.config.js"

# Pokes the new values in the local.config.js file
$SUDO sed -i -- "s@friendcore_host@$friendCoreDomain@g" "$helloPath/local.config.js"

# Copy servers autostart
if [ ! -d "$FRIEND_BUILD/autostart" ]; then
    $SUDO mkdir "$FRIEND_BUILD/autostart"
fi
$SUDO cp "$FRIEND_FOLDER/installers/startpresence.sh" "$FRIEND_BUILD/autostart/startpresence.sh"
$SUDO cp "$FRIEND_FOLDER/installers/startfriendchat.sh" "$FRIEND_BUILD/autostart/startfriendchat.sh"
$SUDO chmod +x "$FRIEND_BUILD/autostart/startpresence.sh"
$SUDO chmod +x "$FRIEND_BUILD/autostart/startfriendchat.sh"

# Set TLS flags in cfg.ini
$SUDO sed -i -- "s@SSLEnable = 0@SSLEnable = 1@g" "$CFG_PATH"

# Set friendChat flags in cfg.ini without touching to the other data
flag="0"
cp /dev/null temp.ini
while read -r line
do
    name="$line"
    if [[ "$name" == *"FriendChat"* ]]; then
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

# End messages
clear
echo "Friend Chat installed successfully."
echo "It will be automatically started when you launch FriendCore."
echo
echo "Warning! Since FriendCore is running in TLS mode,"
echo "you must connect to your Friend machine with the following URL:"
echo "https://$friendCoreDomain:6502"
echo
exit 0
