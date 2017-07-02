#!/bin/bash
#  install.sh
#  Admin Fetches friendup from git, runs this script, which
#  installs dependencies, and autobuilds the Friend Core dir structure

#

sudo apt-get install dialog

declare -i INSTALL_SCRIPT_NUMBER=0

dialog --backtitle "Friend installer" --yesno "           Welcome to Friend\n\n\
This script will install FriendCore on your machine.\n\n
Do you want to proceed with installation?" 10 45
if [ $? -eq "1" ]; then
    clear
    exit 1
fi

#echo ""
#echo "=====Configuration..."
#echo "========================================================="
#echo

INSTALL_ON_EXISTING_DB="N"
USE_DEFAULT_DB_STRUCTURE="Y"

while true; do

    dbhost='localhost'
    dbport=3306
    dbname='friendup'
    dbuser='friendup'
    dbpass='friendup1'

    dialog --backtitle "Friend installer" --yesno "Do you want to install Friend on an existing database?" 8 45
    if [ $? = "0" ]
    then
        INSTALL_ON_EXISTING_DB="Y"
    else
        INSTALL_ON_EXISTING_DB="N"
    fi

    #read mysql db root password
    mysqlRootPass=$(dialog --backtitle "Friend installer" --inputbox "Enter mysql root password:" 8 45 --output-fd 1)
    if [ $? = "1" ]
    then
        clear
        exit 1
    fi

    dialog --defaultno --backtitle "Friend installer" --yesno "Default mysql settings:\n\n\
    host: $dbhost\n\
    port: $dbport\n\
    database: $dbname\n\
    user: $dbuser\n\
    password: $dbpass\n\n\
Do you want to use the default settings?" 15 50

    if [ $? = "1" ]
    then
        dbhost=$(dialog --backtitle "Friend installer" --inputbox "Please enter the mysql host name:" 8 45 --output-fd 1)
        if [ $? = "1" ]; then
            clear
            exit 1
        fi
        dbport=$(dialog --backtitle "Friend installer" --inputbox "Please enter the mysql database port:" 8 45 --output-fd 1)
        if [ $? = "1" ]; then
            clear
            exit 1
        fi
        dbname=$(dialog --backtitle "Friend installer" --inputbox "Please enter the mysql database name:" 8 45 --output-fd 1)
        if [ $? = "1" ]; then
            clear
            exit 1
        fi
        dbuser=$(dialog --backtitle "Friend installer" --inputbox "Please enter the user name:" 8 45 --output-fd 1)
        if [ $? = "1" ]; then
            clear
            exit 1
        fi
        dbpass=$(dialog --backtitle "Friend installer" --inputbox "Please enter the user password:" 8 45 --output-fd 1)
        if [ $? = "1" ]; then
            clear
            exit 1
        fi
    fi

    dialog --defaultno --backtitle "Friend installer" --yesno "Using the following values for connecting to mysql:\n\n\
    root password: $mysqlRootPass\n\
    host name: $dbhost\n\
    database port: $dbport\n\
    database name: $dbname\n\
    user name: $dbuser\n\
    user password: $dbpass\n\n\
Please check the values and confirm..." 15 60
    if [ $? = "0" ]; then
        break;
    fi
done

clear

#echo ""
#echo "=====Checking linux distribution..."
#echo "========================================================="

# check system
if cat /etc/*-release | grep ^ID | grep ubuntu; then
    echo "ubuntu distro found"
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
	echo "debian distro found"
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
    echo "mint distro found"
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
else
    INSTALL_SCRIPT_NUMBER=-1
fi

echo ""
echo "=====Installing dependencies..."
echo "========================================================="

if [ "$INSTALL_SCRIPT_NUMBER" -eq "1" ];then
    sudo apt-get install libssh2-1-dev libssh-dev libssl-dev libaio-dev \
        php5-cli php5-curl php5-mysql php5-gd php5-imap mysql-server \
        libmysqlclient-dev build-essential libmatheval-dev libmagic-dev \
        libgd-dev libwebsockets-dev rsync valgrind-dbg libxml2-dev php5-readline \
        cmake ssh phpmyadmin make
elif [ "$INSTALL_SCRIPT_NUMBER" -eq "2" ];then
    sudo apt-get install libssh2-1-dev libssh-dev libssl-dev libaio-dev \
        mysql-server \
        php-curl libmysqlclient-dev build-essential libmatheval-dev libmagic-dev \
        libgd-dev rsync valgrind-dbg libxml2-dev cmake make libwebsockets-dev libssh-dev
else
    dialog --backtitle "Friend installer" --msgbox "Supported linux version not found!\n\n\
Write to us: developer@friendos.com" 8 40
    clear
    exit 1
fi

# set up mysql database + user + access
# echo "removing old database, if it exists: $mysql"
# sudo rm $mysql

# echo "initializing database $mysql"

#  localhost/phpmyadmin
#  username: root
#  password: ubpaul

# need to first setup a user account for the MySQL "root" user, using an unencrypted password.

# echo "Enter mysql username, followed by [ENTER]"
#read mysqlusername

mysqlconnect="--host=$dbhost --port=$dbport --user=root --password=$mysqlRootPass"
mysqlconnectdb=$mysqlconnect" --database=$dbname"

echo "Skipping database if it exists"
dbexists=`mysqlshow $mysqlconnect $dbname | grep Tables`
if [ -z "$dbexists" ]; then
#	no db
#	echo "no db named $dbname, creating"
#	mysql $mysqlconnect \
#	--execute="DROP DATABASE $dbname"

	echo "create database"
	mysql $mysqlconnect \
		--execute="CREATE DATABASE $dbname;"

        echo "create db user $dbuser"
	
	if [ "$dbuser" = "root" ];then
		echo "using root user for DB connection"
	else
		mysql $mysqlconnect \
			--execute="DROP USER '$dbuser'@'localhost';"
		mysql $mysqlconnect \
			--execute="CREATE USER '$dbuser'@'localhost' IDENTIFIED BY '$dbpass';"
	fi

	mysql $mysqlconnect \
		--execute="GRANT ALL ON $dbname.* TO '$dbuser'@'localhost'; FLUSH PRIVILEGES;"

	echo "create tables"
	mysql $mysqlconnectdb \
		--execute="SOURCE db/FriendCoreDatabase.sql"
#  TBD: point instead to a clean, pristine database template, with one or two users
#	already setup, such as admin, and simple user (non-admin group)
#	maybe try:   user: guest, password: guest
#
# /*-- INSERT INTO `FUser` (`Name`,`Password`) VALUES ("guest","guest" ); */
#INSERT INTO `FUser` (`ID`,`Name`,`Password`) VALUES (1,"guest",CONCAT("{S6}",SHA2(CONCAT("HASHED",SHA2("guest",256)),256)));

else
	echo "found db $dbname, skipping"
fi

echo ""
echo "=====Compilation process in progress..."
echo "========================================================="

cd friendup

make setup
# sets up all the directories properly

make clean setup compile install

# make clean - clean all objects and binaries
# make setup - create required directories and files
# make compile - compile source in debug mode
# make install - install all generated components to build directory

# this creates a build/ folder in the friendup root directory

# next, need to add cfg.ini file to build/cfg/ folder
# generate default file from example in docs/cfg.ini.example

echo ""
echo "=====Generating cfg.ini file..."
echo "========================================================="

# cd build/cfg
echo "[DatabaseUser]" > build/cfg/cfg.ini
echo "login = $dbuser" >> build/cfg/cfg.ini
echo "password = $dbpass" >> build/cfg/cfg.ini
echo "host = $dbhost" >> build/cfg/cfg.ini
echo "dbname = $dbname" >> build/cfg/cfg.ini
echo "port = $dbport" >> build/cfg/cfg.ini
echo " " >> build/cfg/cfg.ini
#   was 3389
echo "[FriendCore]" >> build/cfg/cfg.ini
echo "fchost = localhost" >> build/cfg/cfg.ini
echo "port = 6502" >> build/cfg/cfg.ini
echo "fcupload = storage/" >> build/cfg/cfg.ini
echo " " >> build/cfg/cfg.ini

echo "[Core]" >> build/cfg/cfg.ini
echo "port = 6502" >> build/cfg/cfg.ini
echo "SSLEnable = 0" >> build/cfg/cfg.ini


#echo ""
#echo "=====Installation complete"
#echo "========================================================="

dialog --backtitle "Friend installer" --yesno "          Installation complete.\n\n\
Once FriendCore is launched, you can access your local machine at:\n\
http://localhost:6502\n\n\
Would you like to launch FriendCore?" 12 45

if [ $? = "0" ]
then
	clear
	cd build/
	echo "launching FriendCore in background"
	nohup ./FriendCore >> /dev/null &	
else
	clear
	echo "You can start FriendCore from the build folder."
fi

echo "FriendUP installation comleted :)"