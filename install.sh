#!/bin/bash

#
# Friend Core, Friend Chat and Friend Network installation script
#
# This script will install the necessary components to make the Friend servers
# run on your machine.
# It will save all the recorded information so that you do not have to type
# them the next time you run the script.
#

# Make sure to change directory to where the script recide
BASEDIR=$(dirname "$0")
cd "$BASEDIR"
echo "entering $BASEDIR"

sudo apt-get install dialog
sudo pacman -Sy dialog

declare -i INSTALL_SCRIPT_NUMBER=0

# Default Friend paths
FRIEND_FOLDER=$(pwd)
QUIT="Installation aborted. Please restart script to complete it."

# Asks for installation path
FRIEND_BUILD="$FRIEND_FOLDER/build"
while true; do
    temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the path where Friend Core is\n\
to be installed:" 10 55 "$FRIEND_BUILD" --output-fd 1)
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
        mkdir "$FRIEND_BUILD" > /dev/null 2>&1
        if [ $? -eq "1" ]; then
            # Try again as root
            sudo mkdir "$FRIEND_BUILD"
            if [ $? -eq "1" ]; then
                dialog --backtitle "Friend Installer" --msgbox "\
Impossible to create the directory\n\
"$FRIEND_BUILD"\n\n\
Please try again." 10 55
            else
                break
            fi
        else
            break
        fi
    fi
done

# Root or not?
mkdir "$FRIEND_BUILD/tryout" > /dev/null
if [ $? -eq "0" ]; then
    SUDO=""
    rm -rf "$FRIEND_BUILD/tryout"
else
    SUDO="sudo"
fi

# Path to setup.ini file
CFG_PATH="$FRIEND_BUILD/cfg/cfg.ini"

# Creates build/cfg and crt directories
if [ ! -d "$FRIEND_BUILD" ]; then
    $SUDO mkdir "$FRIEND_BUILD"
fi
if [ ! -d "$FRIEND_BUILD/cfg" ]; then
    $SUDO mkdir "$FRIEND_BUILD/cfg"
fi
if [ ! -d "$FRIEND_BUILD/cfg/crt" ]; then
    $SUDO mkdir "$FRIEND_BUILD/cfg/crt"
fi

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
friendNetwork="0"
friendChat="0"
cfgFound=""
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
    cfgFound="yes"
fi
if [ "$friendChat" = "" ]; then
    friendChat="0"
fi
if [ "$friendNetwork" = "" ]; then
    friendNetwork="0"
fi

# Removes the quotes
dbhost=$(echo "$dbhost" | sed -e 's/^"//' -e 's/"$//')
dbname=$(echo "$dbname" | sed -e 's/^"//' -e 's/"$//')
dbuser=$(echo "$dbuser" | sed -e 's/^"//' -e 's/"$//')
dbpass=$(echo "$dbpass" | sed -e 's/^"//' -e 's/"$//')
friendCoreDomain=$(echo "$friendCoreDomain" | sed -e 's/^"//' -e 's/"$//')

# Fill-up default values if the are not defined
if [ "$dbhost" = "" ]; then
    dbhost="localhost"
fi
if [ "$dbname" = "" ]; then
    dbname="friendup"
fi
if [ "$dbuser" = "" ]; then
    dbuser="friendup"
fi
if [ "$dbpass" = "" ]; then
    dbpass="friendup1"
fi
if [ "$dbport" = "" ]; then
    dbport="3306"
fi
if [ "$friendCoreDomain" = "" ]; then
    friendCoreDomain="localhost"
fi

#echo ""
#echo "=====Checking linux distribution..."
#echo "========================================================="

# check system
if cat /etc/*-release | grep ^ID | grep ubuntu; then
    echo "Ubuntu distro found"
    EXTRALIBS="libssl1.0-dev"
    if cat /etc/*-release | grep ^VERSION_ID | grep 14; then
            echo "version 14"
    		INSTALL_SCRIPT_NUMBER=1
	elif cat /etc/*-release | grep ^VERSION_ID | grep 15; then
            echo "version 15"
            INSTALL_SCRIPT_NUMBER=1
	elif cat /etc/*-release | grep ^VERSION_ID | grep 16; then
            echo "version 16"
            INSTALL_SCRIPT_NUMBER=2
            EXTRALIBS="libssl-dev"
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
    EXTRALIBS="libssl1.0-dev"
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
    EXTRALIBS="libssl1.0-dev"
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
clear
echo "Installing dependencies."
sleep 2
sudo apt-get update
if [ "$INSTALL_SCRIPT_NUMBER" -eq "1" ];then
    sudo apt-get install libsqlite3-dev libsmbclient-dev libssh2-1-dev libssh-dev libaio-dev $EXTRALIBS \
    	mysql-server \
        php5-cli php5-gd php5-imap php5-mysql php5-curl \
        libmysqlclient-dev build-essential libmatheval-dev libmagic-dev \
        libgd-dev rsync valgrind-dbg libxml2-dev php5-readline \
        cmake ssh phpmyadmin curl build-essential python
    if [ $? -eq "1" ]; then
        echo ""
        echo "Dependencies installation failed."
        echo "Please refer to 'Readme.md' for more information on how to solve this problem."
        exit 1
    fi
elif [ "$INSTALL_SCRIPT_NUMBER" -eq "2" ];then
    sudo apt-get install libsqlite3-dev libsmbclient-dev libssh2-1-dev libssh-dev libaio-dev $EXTRALIBS \
        mysql-server \
        php php-cli php-gd php-imap php-mysql php-curl php-readline \
	    libmysqlclient-dev build-essential libmatheval-dev libmagic-dev \
        libgd-dev rsync valgrind-dbg libxml2-dev \
	    cmake ssh phpmyadmin \
	    libssh-dev curl build-essential python
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
sleep 2

# Warning message: cfg.ini will be rewritten
if [ "$cfgFound" = "yes" ]; then
    dialog --defaultno --backtitle "Friend Installer" --yesno "\
The installer has detected a previous installation.\n\n\
Installing Friend again will erase the extra information from\n\
the cfg.ini configuration file (the ones you entered manually)...\n\n\
A copy of the file will been made to:\n\
$FRIEND_BUILD/cfg/cfg.bak\n\
and you will have to port the modifications manually.\n\n\
If you only want to recompile FriendCore, enter this command in the shell
after exiting the installer:\n\n\
make clean setup release install\n\n\
Do you want to continue anyway?" 21 70
    if [ $? -eq "1" ]; then
        clear
        exit 1
    fi
fi

# Asks for Friend Core credentials
while true; do

    dialog --defaultno --backtitle "Friend Installer" --yesno "\
Friend Core will be installed with the following values:\n\n\
    mysql host: $dbhost\n\
    mysql port: $dbport\n\
    database name: $dbname\n\
    database user name: $dbuser\n\
    database user password: $dbpass\n\
    domain: $friendCoreDomain\n\
    $TLSSTRING\n\
Please confirm or choose 'No' to change the values..." 18 78
    if [ $? = "0" ]; then
        break;
    fi

    temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Friend Core needs a database to run.\n\n\
Please enter the mysql host name:" 11 45 "$dbhost" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ $temp != "" ]; then
        dbhost="$temp"
    fi
    temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Friend Core database.\n\n\
Please enter the mysql port:" 10 45 "$dbport" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        dbport="$temp"
    fi
    temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Friend Core database.\n\n\
Please enter the database name:" 10 45 "$dbname" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        dbname="$temp"
    fi
    temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Friend Core database.\n\n\
Please enter a mysql user name for Friend Core,\n\
it can be an existing user name or a new one,\n\
but must be different from 'root'." 13 65 "$dbuser" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        dbuser="$temp"
    fi
    temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Friend Core database.\n\n\
Please enter the password\n\
for mysql user $dbuser:" 10 45 "$dbpass" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        dbpass="$temp"
    fi
    temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the domain name on which Friend Core will run.\n\n\
Note that if you intend to install Friend Chat and are running\n\
on a virtual machine, this domain cannot be 'localhost'..." 12 70 "$friendCoreDomain" --output-fd 1)
    if [ $? = "1" ]; then
        clear
        echo "$QUIT"
        exit 1
    fi
    if [ "$temp" != "" ]; then
        friendCoreDomain="$temp"
    fi

# Asks for TLS keys and certificate
    ASK="0"
    if [ "$TLS" -eq "1" ]; then
        temp=$(dialog --defaultno --backtitle "Friend Installer" --yesno "\
Friend Core has been already configured with TLS keys.\n\n\
Do you want to update them?" 10 65 --output-fd 1)
        if [ $? -eq "0" ]; then
            ASK="1"
        else
            TLSSTRING="TLS: YES.\n"
        fi
    else
        temp=$(dialog --backtitle "Friend Installer" --yesno "\
Do you want Friend Core to use TLS encryption?\n\n\
Note: TLS is mandatory if you want to install\n\
Friend Chat on your machine." 10 65 --output-fd 1)
        if [ $? -eq "0" ]; then
            ASK="1"
        else
            TLSSTRING="TLS: NO.\n"
        fi
    fi
    if [ "$ASK" -eq "1" ]; then
        temp=$(dialog --backtitle "Friend Installer" --yesno "\
Create a new key and certificate or use existing ones?\n\n\
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
            temp=$(dialog --backtitle "Friend Installer" --inputbox "\
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
            temp=$(dialog --backtitle "Friend Installer" --inputbox "\
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
        fi
    fi
done

# Asks for mysql db root password
while true; do
    mysqlRootPass=$(dialog --backtitle "Friend Installer" --insecure --passwordbox "Please enter mysql root password:" 8 50 --output-fd 1)
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
    mysqlRootPass=$(dialog --backtitle "Friend Installer" --msgbox "Incorrect password. Please try again." 8 50 --output-fd 1)
done
export MYSQL_PWD=""
clear

# Make a copy of the configuration file
if [ "$cfgFound" = "yes" ]; then
    $SUDO cp "$FRIEND_BUILD/cfg/cfg.ini" "$FRIEND_BUILD/cfg/cfg.bak"
fi

# Creates or updates the build/cfg/cfg.ini file
echo ";" | $SUDO tee "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "; Friend Core configuration file" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "; ------------------------------" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "; Please respect both spaces and breaks between lines if you change this file manually" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo ";" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "[DatabaseUser]" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "login = \"$dbuser\"" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "password = \"$dbpass\"" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "host = \"$dbhost\"" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "dbname = \"$dbname\"" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "port = $dbport" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo " " | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "[FriendCore]" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
echo "fchost = \"$friendCoreDomain\"" | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log
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
echo " " | $SUDO tee -a "$FRIEND_BUILD/cfg/cfg.ini" >> installation.log

# Writes Config file for Friend Core compilation
echo "# Friend Core compilation path" | tee "$FRIEND_FOLDER/Config" >> installation.log
echo "# If empty compilation will default to" | tee -a "$FRIEND_FOLDER/Config" >> installation.log
echo "# $FRIEND_FOLDER/build" | tee -a "$FRIEND_FOLDER/Config" >> installation.log
echo "FRIEND_PATH=\"$FRIEND_BUILD\"" | tee -a "$FRIEND_FOLDER/Config" >> installation.log
echo $FRIEND_PATH

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

# Installation complete, launch?
temp="http://$friendCoreDomain:6502"
if [ "$TLS" -eq "1" ]; then
    temp="https://$friendCoreDomain:6502"
fi
dialog --backtitle "Friend Installer" --yesno "Installation complete.\n\n\
Once Friend Core is launched, you can access your local machine at:\n\
$temp\n\n\
To install Friend Chat run ./installFriendChat.sh,\n\
To install Friend Network, run ./installFriendNetwork.sh\n\n\
Would you like to launch Friend Core?" 15 75
if [ $? = "0" ]
then
	clear
	cd "$FRIEND_BUILD"
    echo ""
	echo "Launching Friend Core in the background..."
	nohup ./FriendCore >> /dev/null &
	cd "$FRIEND_FOLDER"
    echo
	echo "Use killfriend.sh to kill Friend Core and all the associated servers."
    echo
else
	clear
    echo ""
	echo "You can start Friend Core from this folder:"
    echo
	echo "$FRIEND_BUILD"
    echo
	echo "by typing './FriendCore'"
    echo
fi

exit 0
