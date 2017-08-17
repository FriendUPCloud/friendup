#!/bin/sh

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

# Get directory from Config file
. "$FRIEND_FOLDER/Config"
FRIEND_BUILD="$FRIEND_PATH"
if [ -z "$FRIEND_BUILD" ]; then
    echo "Config file not found, aborting."
    exit 1
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

# Checks if Friend is installed with a setup.ini file
if [ ! -f "$FRIEND_BUILD/cfg/setup.ini" ]
then
    dialog --backtitle "Friend Chat Installer" --msgbox "\
Installation information not found.\n\
Please run the Friend Core install.sh script first.\n\n\
Aborting Friend Chat installation." 10 70
    clear
	exit 1
fi

# Checks if Friend Chat is enabled
enabled=$(sed -nr "/^\[FriendChat\]/ { :l /^enable[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
if [ "$enabled" != "1" ]; then
    dialog --backtitle "Friend Chat Installer" --msgbox "\
Friend Chat is not enabled.\n\n\
Aborting Friend Chat installation." 11 70
    exit 0
fi

# Checks if TLS keys are defined
SELFSIGNED="false"
if [ ! -f "$FRIEND_BUILD/cfg/crt/key.pem" ]
then
    dialog --backtitle "Friend Chat Installer" --msgbox "\
Please create TLS keys and certificates\n\
and relaunch the install.sh script\n\
to include them in Friend Core.\n\n\
Aborting Friend Chat installation." 11 70
    clear
    exit 1
else
    # Checks if the TLS keys are self-signed
    temp=$(openssl verify -CAfile "$FRIEND_BUILD/cfg/crt/certificate.pem" -CApath "$FRIEND_BUILD/cfg/crt/certificate.pem" "$FRIEND_BUILD/cfg/crt/certificate.pem")
    if [ "$temp" = "$FRIEND_BUILD/cfg/crt/certificate.pem: OK" ]; then
        SELFSIGNED="true";
    fi
fi

# Gather data from the setup.ini file
dbhost=$(sed -nr "/^\[FriendCore\]/ { :l /^dbhost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
dbuser=$(sed -nr "/^\[FriendCore\]/ { :l /^dbuser[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
dbpass=$(sed -nr "/^\[FriendCore\]/ { :l /^dbpass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
dbport=$(sed -nr "/^\[FriendCore\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
friendCoreDomain=$(sed -nr "/^\[FriendCore\]/ { :l /^domain[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
turnAddress=$(sed -nr "/^\[TurnStun\]/ { :l /^turn[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
stunAddress=$(sed -nr "/^\[TurnStun\]/ { :l /^stun[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
turnUser=$(sed -nr "/^\[TurnStun\]/ { :l /^user[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
turnPass=$(sed -nr "/^\[TurnStun\]/ { :l /^pass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
helloDbName=$(sed -nr "/^\[FriendChat\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
helloDbHost=$(sed -nr "/^\[FriendChat\]/ { :l /^dbhost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
helloDbPort=$(sed -nr "/^\[FriendChat\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
helloDbUser=$(sed -nr "/^\[FriendChat\]/ { :l /^dbuser[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
helloDbPass=$(sed -nr "/^\[FriendChat\]/ { :l /^dbpass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
presenceDbName=$(sed -nr "/^\[Presence\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
presenceDbHost=$(sed -nr "/^\[Presence\]/ { :l /^dbhost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
presenceDbPort=$(sed -nr "/^\[Presence\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
presenceDbUser=$(sed -nr "/^\[Presence\]/ { :l /^dbuser[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
presenceDbPass=$(sed -nr "/^\[Presence\]/ { :l /^dbpass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")

# Installs node.js
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
This script will now end. Open a new shell and restart\n\
install.sh with the -s option (you will not be asked for\n\
information again)..."  15 70
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

# Eventually asks for database root password
mysqlRootPass=$1
if [ "$mysqlRootPass" = "" ]
then
    while true; do
        mysqlRootPass=$(dialog --backtitle "Friend Chat Installer" --passwordbox "Please enter mysql root password:" 8 50 --output-fd 1)
        if [ $? = "1" ]
        then
            clear
            exit 1
        fi
        # Checks mysql root password
        export MYSQL_PWD=$mysqlRootPass
        mysql -u root -e ";"
        if [ $? == "0" ]; then
            break;
        fi
	dialog --backtitle "Friend Chat Installer" --msgbox "Illegal mysql password, please try again." 8 65
    done
fi
clear

# INSTALLATION OF THE PRESENCE SERVER
# -----------------------------------

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
git clone $GIT/friendchat.git .

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

echo "Friend Chat installed successfully."
exit 0