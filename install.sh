#!/bin/sh

#
# Friend Core, Friend Chat and Friend Network installation script
#
# This script will install the necessary components to make the Friend servers
# run on your machine.
# It will save all the recorded information so that you do not have to type
# them the next time you run the script.
#

sudo apt-get install dialog
sudo pacman -Sy dialog

declare -i INSTALL_SCRIPT_NUMBER=0

dialog --backtitle "Friend Installer" --yesno "           Welcome to Friend\n\n\
This script will install Friend Core on your machine.\n\n
Do you want to proceed with installation?" 10 45
if [ $? -eq "1" ]; then
    clear
    exit 1
fi
clear

# Default Friend paths
ASKCONFIG = $1
FRIEND_FOLDER=$(pwd)
QUIT="Installation aborted. Please restart script to complete it."

#echo ""
#echo "=====Checking linux distribution..."
#echo "========================================================="

# check system
if cat /etc/*-release | grep ^ID | grep ubuntu; then
    echo "Ubuntu distro found"
    if cat /etc/*-release | grep ^VERSION_ID | grep 14; then
            echo "version 14"
    		INSTALL_SCRIPT_NUMBER=1
	elif cat /etc/*-release | grep ^VERSION_ID | grep 15; then
            echo "version 15"
            INSTALL_SCRIPT_NUMBER=1
	elif cat /etc/*-release | grep ^VERSION_ID | grep 16; then
            echo "version 16"
            INSTALL_SCRIPT_NUMBER=2
	elif cat /etc/*-release | grep ^VERSION_ID | grep 17; then
            echo "version 17"
            INSTALL_SCRIPT_NUMBER=2
	elif cat /etc/*-release | grep ^VERSION_ID | grep 18; then
            echo "version 18"
            INSTALL_SCRIPT_NUMBER=2
	else
            echo "version other"
            INSTALL_SCRIPT_NUMBER=0
    fi
elif cat /etc/*-release | grep ^ID | grep debian; then
	echo "Debian distro found"
	if cat /etc/*-release | grep ^VERSION_ID | grep 8; then
		echo "version 8"
		INSTALL_SCRIPT_NUMBER=1
	elif cat /etc/*-release | grep ^VERSION_ID | grep 9; then
		echo "version 9"
		INSTALL_SCRIPT_NUMBER=2
	else
		echo "version other"
		INSTALL_SCRIPT_NUMBER=0
	fi
elif cat /etc/*-release | grep ^ID | grep mint; then
    echo "Mint distro found"
    if cat /etc/*-release | grep ^VERSION_ID | grep 16; then
            echo "version 16"
            INSTALL_SCRIPT_NUMBER=1
    elif cat /etc/*-release | grep ^VERSION_ID | grep 17; then
            echo "version 17"
            INSTALL_SCRIPT_NUMBER=1
	elif cat /etc/*-release | grep ^VERSION_ID | grep 18; then
            echo "version 18"
            INSTALL_SCRIPT_NUMBER=2
	else
            echo "version other"
            INSTALL_SCRIPT_NUMBER=0
    fi
elif cat /etc/*-release | grep ^ID | grep arch; then
	echo "archlinux distro found"
	INSTALL_SCRIPT_NUMBER=3
else
    INSTALL_SCRIPT_NUMBER=-1
fi

echo ""
echo "=====Installing dependencies..."
echo "========================================================="
sudo apt-get update
if [ "$INSTALL_SCRIPT_NUMBER" -eq "1" ];then
    sudo apt-get install libssh2-1-dev libssh-dev libssl-dev libaio-dev \
    	mysql-server \
        php5-cli php5-gd php5-imap php5-mysql php5-curl \
        libmysqlclient-dev build-essential libmatheval-dev libmagic-dev \
        libgd-dev libwebsockets-dev rsync valgrind-dbg libxml2-dev php5-readline \
        cmake ssh phpmyadmin curl build-essential python
    if [ $? -eq "1" ]; then
        echo ""
        echo "Dependencies installation failed."
        echo "Please refer to 'Readme.md' for more information on how to solve this problem."
        exit 1
    fi
elif [ "$INSTALL_SCRIPT_NUMBER" -eq "2" ];then
    sudo apt-get install libssh2-1-dev libssh-dev libssl-dev libaio-dev \
        mysql-server \
        php php-cli php-gd php-imap php-mysql php-curl php-readline \
	libmysqlclient-dev build-essential libmatheval-dev libmagic-dev \
        libgd-dev rsync valgrind-dbg libxml2-dev \
	cmake ssh phpmyadmin \
	libwebsockets-dev libssh-dev curl build-essential python
    if [ $? -eq "1" ]; then
        echo ""
        echo "Dependencies installation failed."
        echo "Please refer to 'Readme.md' for more information on how to solve this problem."
        exit 1
    fi
elif [ "$INSTALL_SCRIPT_NUMBER" -eq "3" ];then
    sudo pacman -Sy flex guile2.0 \
	libssh2 libssh libaio \
        mariadb \
        php php-gd php-imap \
	mariadb-clients file \
        gd rsync valgrind libxml2 \
	cmake openssh phpmyadmin make \
	libwebsockets
	wget https://aur.archlinux.org/cgit/aur.git/snapshot/libmatheval.tar.gz
	tar xvfz libmatheval.tar.gz
	rm libmatheval.tar.gz -f
	cd libmatheval
	patch -p0 -i ../patches/archlinux-libmatheval-PKGBUILD.patch
	makepkg 2>&1 | tee makepkg.log
	sudo pacman -U libmatheval*pkg*
	cd ..
	dialog --backtitle "Friend installer" --msgbox "If you just installed mariadb, please do\n\nsudo mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql" 10 40
	sudo systemctl start mariadb
	dialog --backtitle "Friend installer" --msgbox "Please uncomment lines\n\nextension=gd.so\nextension=imap.so\nextension=pdo_mysql.so\nextension=mysqli.so\nextension=curl.so\nextension=readline.so\nextension=gettext.so\n\nand add\n\n$PWD/build/\n\nto open_basedir directive\n\ninto /etc/php/php.ini" 23 40
else
    dialog --backtitle "Friend Installer" --msgbox "Supported linux version not found!\n\n\
Write to us: developer@friendos.com" 8 40
    clear
    exit 1
fi

# Calls configuration script if -s is not used
CONFIG="0"
if [ ! -f "$FRIEND_FOLDER/Config" ]; then
	CONFIG="1"
fi
if [ -z $ASKCONFIG ]; then
	CONFIG="1"
fi
if [ $CONFIG -eq "1" ]; then
	sh ./installers/config.sh
	if [ $? -eq "1" ]; then
    	clear
    	echo "Aborting installation."
    	exit 1
	fi
fi

# Get directory from Config file
. "$FRIEND_FOLDER/Config"
FRIEND_BUILD="$FRIEND_PATH"
if [ -z "$FRIEND_BUILD" ]; then
    dialog --backtitle "Friend Installer" --msgbox "\
Cannot read compilation Config file\n\n\
Please run this script again and answer\n\
all the questions." 10 55
    clear
    echo "$QUIT"
    exit 1
fi

# Checks a setup.ini file has been generated
if [ ! -f "$FRIEND_BUILD/cfg/setup.ini" ]
then
    dialog --backtitle "Friend Installer" --msgbox "\
Cannot find setup.ini file\n\n\
Please run this script again and answer\n\
all the questions." 10 55
    clear
    echo "$QUIT"
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

# Get values from setup.ini file
dbhost=$(sed -nr "/^\[FriendCore\]/ { :l /^dbhost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
dbname=$(sed -nr "/^\[FriendCore\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
dbuser=$(sed -nr "/^\[FriendCore\]/ { :l /^dbuser[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
dbpass=$(sed -nr "/^\[FriendCore\]/ { :l /^dbpass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
dbport=$(sed -nr "/^\[FriendCore\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
friendCoreDomain=$(sed -nr "/^\[FriendCore\]/ { :l /^domain[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
TLS=$(sed -nr "/^\[FriendCore\]/ { :l /^TLS[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
friendNetwork=$(sed -nr "/^\[FriendNetwork\]/ { :l /^enable[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")
friendChat=$(sed -nr "/^\[FriendChat\]/ { :l /^enable[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$FRIEND_BUILD/cfg/setup.ini")

clear

# Asks for mysql db root password
while true; do
    mysqlRootPass=$(dialog --backtitle "Friend Installer" --passwordbox "Please enter mysql root password:" 8 50 --output-fd 1)
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
	dialog --backtitle "Friend Installer" --msgbox "Illegal mysql password, please try again." 8 65
done
export MYSQL_PWD=""
clear

# Defines mysql access
mysqlAdminConnect="--host=$dbhost --port=$dbport --user=root"
mysqlconnect="--host=$dbhost --port=$dbport --user=$dbuser"
mysqlconnectdb="$mysqlconnect --database=$dbname"

# Temporary store the password in system variable to avoid warnings
export MYSQL_PWD=$mysqlRootPass

echo ""
echo "Setting up Friend Core database."

# Checks if user is already present or not, and creates it eventually
userExists=$(mysql $mysqlAdminConnect \
	--execute="SELECT mu.User FROM mysql.user AS mu WHERE mu.User='$dbuser'")
if [ "$userExists" = "" ]; then
	echo "Setting up user: $dbuser"
	# Creates user
	mysql $mysqlAdminConnect \
		--execute="CREATE USER $dbuser@$dbhost IDENTIFIED BY '$dbpass';"
else
	echo "User $dbuser already exists, skipping"
fi

# Checks for database existence and creates it if not present
dbpresent=$(mysql $mysqlAdminConnect \
	--execute="SHOW DATABASES LIKE '$dbname'")
if [ `echo "$dbpresent" | grep -c "$dbname"` -gt 0 ]; then
	echo "Database $dbname was found, skipping"
    # Grants access to db if user was not created before
	mysql $mysqlAdminConnect \
		--execute="GRANT ALL PRIVILEGES ON $dbname.* TO $dbuser@$dbhost;"
	# Cleans memory
	mysql $mysqlAdminConnect \
		--execute="FLUSH PRIVILEGES;"
else
	# Creates database
	echo "Creating database: $dbname"
	mysql $mysqlAdminConnect \
		--execute="CREATE DATABASE $dbname"
	# Grants access to db
	mysql $mysqlAdminConnect \
		--execute="GRANT ALL PRIVILEGES ON $dbname.* TO $dbuser@$dbhost;"
	# Cleans memory
	mysql $mysqlAdminConnect \
		--execute="FLUSH PRIVILEGES;"
	# Switch to user
	export MYSQL_PWD=$dbpass
	# Creates tables
	echo "Creating tables"
	mysql $mysqlconnectdb \
		--execute="SOURCE db/FriendCoreDatabase.sql"
fi

# Clears dangerous variable
export MYSQL_PWD=""

# Creates or updates the build/cfg/cfg.ini file
echo "[DatabaseUser]" | $SUDO tee "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "login = $dbuser" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "password = $dbpass" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "host = $dbhost" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "dbname = $dbname" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "port = $dbport" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo " " | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "[FriendCore]" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "fchost = $friendCoreDomain" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "port = 6502" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "fcupload = storage/" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo " " | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "[Core]" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "port = 6502" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "SSLEnable = $TLS" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo " " | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "[FriendNetwork]" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "enabled = $friendNetwork" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo " " | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "[FriendChat]" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "enabled = $friendChat" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log

# Builds Friend Core
echo ""
echo "Building Friend Core."
echo "This can take up to several minutes depending on your machine."
echo "Compilation log can be found in $FRIEND_FOLDER/compilation.log"
if [ -f "$FRIEND_BUILD/FriendCore" ]; then
    $SUDO rm "$FRIEND_BUILD/FriendCore"
fi
$SUDO make setup > "$FRIEND_FOLDER/compilation.log" 2>&1
$SUDO make clean setup release install >> "$FRIEND_FOLDER/compilation.log" 2>&1

# Checks if FriendCore is present
if [ ! -f "$FRIEND_BUILD/FriendCore" ]; then
    echo ""
    echo "A problem occurred during Friend Core compilation."
    echo "Please refer to compilation.log for more information."
    echo "Help can be found on Friend developer community forums at"
    echo "https://developers.friendup.cloud"
    echo "Installation unsuccessful."
    echo ""
    exit 1
else
    echo ""
    echo "Friend Core compilation successful."
    echo ""
    sleep 1
fi

# Launches Friend Network installer
if [ "$friendNetwork" -eq "1" ]; then
    sh installers/friendnetwork.sh
    if [ $? -eq "1" ]; then
        clear
        echo "Friend Core installation aborted, please restart the script."
        exit 1
    fi
fi

# Launches Friend Chat installer
if [ "$friendChat" -eq "1" ]; then
    sh installers/friendchat.sh "$mysqlRootPass"
    if [ $? -eq "1" ]; then
        clear
        echo "Friend Core installation aborted, please restart the script."
        exit 1
    fi
fi

# Installation complete, launch?
temp="http://$friendCoreDomain:6502"
if [ "$TLS" -eq "1" ]; then
    temp="https://$friendCoreDomain:6502"
fi
dialog --backtitle "Friend Installer" --yesno "          Installation complete.\n\n\
Once Friend Core is launched, you can access your local machine at:\n\
$temp\n\n\
Would you like to launch Friend Core?" 12 45
if [ $? = "0" ]
then
	clear
	cd "$FRIEND_BUILD"
    echo ""
	echo "Launching Friend Core in the background..."
	nohup ./FriendCore >> /dev/null &
	cd "$FRIEND_FOLDER"
	echo "Friend Network and Friend Chat servers will be automatically launched."
	echo "Use killfriendcore.sh to kill Friend Core and all the running servers."
else
	clear
    echo ""
	echo "You can start Friend Core from this folder:"
	echo "$FRIEND_BUILD"
	echo "by typing './FriendCore'"
	echo "Friend Network and Friend Chat servers will be automatically launched."
	echo "Friend Network and Friend Chat servers will be killed upon exit."
fi
echo ""
echo "Two global environment variables have been created,"
echo "FRIEND_HOME: pointing to $FRIEND_FOLDER,"
echo "FRIEND_PATH: pointing to $FRIEND_BUILD,"
echo "They will be defined the next time you boot your computer."
echo ""
exit 0