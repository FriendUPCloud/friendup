#!/bin/sh

#
# Friend configuration setup bash
#
# This bash will ask for all the necessary information to setup a Friend
# server, Friend Network and Friend Chat on your machine.
# It does not install anything.
# It creates a setup.ini file in the FRIEND_BUILD/build/cfg directory.
# Values entered are stored in this file and are recovered the next time
# you launch this bash.
#
# The main Friend install.sh bash calls this file before setting up the server
# but you can call it whenever you want and then later call install.sh,
# installers/friendnetwork.sh or installers/friendchat.sh.
#

# Default Friend paths (to be modified)
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

# Installs Dialog
sudo apt-get install dialog

# Path to setup.ini file
INI_PATH="$FRIEND_BUILD/cfg/setup.ini"
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
if [ -f "$FRIEND_BUILD/cfg/crt/key.pem" ]; then
    if [ -f "$FRIEND_BUILD/cfg/crt/certificate.pem" ]; then
        TLS="1"
    fi
fi

# Checks if a setup.ini file already exists
if [ -f "$INI_PATH" ]
then
    echo "Getting value from existing setup.ini file"
    dbhost=$(sed -nr "/^\[FriendCore\]/ { :l /^dbhost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    dbname=$(sed -nr "/^\[FriendCore\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    dbuser=$(sed -nr "/^\[FriendCore\]/ { :l /^dbuser[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    dbpass=$(sed -nr "/^\[FriendCore\]/ { :l /^dbpass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    dbport=$(sed -nr "/^\[FriendCore\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    friendCoreDomain=$(sed -nr "/^\[FriendCore\]/ { :l /^domain[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    friendChat=$(sed -nr "/^\[FriendCore\]/ { :l /^friendChat[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    friendNetwork=$(sed -nr "/^\[FriendCore\]/ { :l /^friendNetwork[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    presenceDbName=$(sed -nr "/^\[Presence\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    presenceDbHost=$(sed -nr "/^\[Presence\]/ { :l /^dbhost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    presenceDbPort=$(sed -nr "/^\[Presence\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    presenceDbUser=$(sed -nr "/^\[Presence\]/ { :l /^dbuser[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    presenceDbPass=$(sed -nr "/^\[Presence\]/ { :l /^dbpass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    helloDbName=$(sed -nr "/^\[FriendChat\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    helloDbHost=$(sed -nr "/^\[FriendChat\]/ { :l /^dbhost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    helloDbPort=$(sed -nr "/^\[FriendChat\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    helloDbUser=$(sed -nr "/^\[FriendChat\]/ { :l /^dbuser[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    helloDbPass=$(sed -nr "/^\[FriendChat\]/ { :l /^dbpass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    turnServer=$(sed -nr "/^\[TurnStun\]/ { :l /^turn[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    stunServer=$(sed -nr "/^\[TurnStun\]/ { :l /^stun[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    turnUser=$(sed -nr "/^\[TurnStun\]/ { :l /^user[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
    turnPass=$(sed -nr "/^\[TurnStun\]/ { :l /^pass[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$INI_PATH")
else
    if [ -f "CFG_PATH" ]; then

        # New version of installer not used, get information from cfg/cfg.ini
        dbhost=$(sed -nr "/^\[DatabaseUser\]/ { :l /^host[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
        dbname=$(sed -nr "/^\[DatabaseUser\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
        dbuser=$(sed -nr "/^\[DatabaseUser\]/ { :l /^login[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
        dbpass=$(sed -nr "/^\[DatabaseUser\]/ { :l /^password[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
        dbport=$(sed -nr "/^\[DatabaseUser\]/ { :l /^port[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
        friendCoreDomain=$(sed -nr "/^\[FriendCore\]/ { :l /^fchost[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")
        friendNetwork=$(sed -nr "/^\[FriendNetwork\]/ { :l /^enabled[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" "$CFG_PATH")

        # Removes eventual ';' left by previous versions of Friend Core installers
        dbhost=${dbhost//;}
        dbname=${dbname//;}
        dbuser=${dbuser//;}
        dbpass=${dbpass//;}
        dbport=${dbport//;}
        friendCoreDomain=${friendCoreDomain//;}
        friendNetwork=${friendNetwork//;}

        # Set other variables default
        helloDbHost="$dbhost"
        helloDbPort="$dbport"
        helloDbUser="$dbuser"
        helloDbPass="$dbpass"
        presenceDbHost="$dbhost"
        presenceDbPort="$dbport"
        presenceDbUser="$dbuser"
        presenceDbPass="$dbpass"
    fi
fi

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
if [ "$friendNetwork" = "" ]; then
    friendNetwork="0"
fi
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
if [ "$friendChat" = "" ]; then
    friendChat="0"
fi

# Asks for Friend Core credentials
while true; do
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
            temp="TLS: YES, keeping current TLS configuration.\n"
        fi
    else
        temp=$(dialog --backtitle "Friend Installer" --yesno "\
Do you want Friend Core to use TLS encryption?\n\n\
Note: TLS is mandatory if you want to install\n\
Friend Chat on your machine." 10 65 --output-fd 1)
        if [ $? -eq "0" ]; then
            ASK="1"
        else
            temp="TLS: NO.\n"
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
            temp="TLS:  YES, keys from Friend directory.\n"
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
            # Checks files
            TLS="0"
            TLSCOPY="0"
            TLSDELETE="0"
            temp="TLS: NO\n    TLS keys not found\n"
            if [ -f "$keyPath" ]; then
                if [ -f "$certificatePath" ]; then
                    TLS="1"
                    TLSCOPY="1"
                    TLSDELETE="1"
                    temp="TLS: YES\n\
        TLS private key path: $keyPath\n\
        TLS certificate path: $certificatePath\n"
                fi
            fi
        fi
    fi

    dialog --defaultno --backtitle "Friend Installer" --yesno "\
Using the following values for Friend Core:\n\n\
    mysql host: $dbhost\n\
    mysql port: $dbport\n\
    database name: $dbname\n\
    database user name: $dbuser\n\
    database user password: $dbpass\n\
    domain: $friendCoreDomain\n\
    $temp\n\
Please check the values and confirm..." 18 78
    if [ $? = "0" ]; then
        break;
    fi
done

# Set proper values for Friend Chat
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

# Asks for Friend Network credentials
dialog --backtitle "Friend Installer" --yesno "\
Do you want to install Friend Network?\n\n\
You will need to provide a turn server\n\
address and its credentials and a stun server address.\n\n\
If you do not have them now,\n\
select NO to continue Friend Core installation\n\
and restart the script once you have them..." 15 70
if [ $? -eq "0" ]; then
    friendNetwork="1"
fi

if [ "$friendNetwork" -eq "1" ]
then
    while true; do
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the turn server address:" 10 45 "$turnServer" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnServer="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the turn server username:" 10 45 "$turnUser" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnUser="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the turn server password:" 10 45 "$turnPass" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnPass="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the stun server address:" 10 45 "$stunServer" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            stunServer="$temp"
        fi
        dialog --defaultno --backtitle "Friend Installer" --yesno "\
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
fi

# Asks for Friend Chat information
dialog --backtitle "Friend Installer" --yesno "\
Do you want to install Friend Chat?\n\n\
You will need to provide a turn server\n\
address and its credentials and a stun server address.\n\n\
To work, Friend Chat also needs two servers,\n\
a 'Presence' server, and a 'Friend Chat' server,\n\
each of them with their own database.\n\n\
You also need to have created TLS keys.\n\n\
If you do not have all of that now,\n\
select NO to continue Friend Core installation\n\
and restart the script once you have all the information..." 18 70
if [ $? -eq "0" ]; then
    friendChat="1"
fi
if [ "$friendChat" -eq "1" ]; then
    if [ "$TLS" -eq "0" ]; then
        clear
        echo "You have not defined the TLS key files."
        echo "Aborting installation."
        echo ""
        exit 1
    fi
    while true; do
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the turn server address:" 10 45 "$turnServer" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnServer="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the turn server username:" 10 45 "$turnUser" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnUser="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the turn server password:" 10 45 "$turnPass" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            turnPass="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
Please enter the stun server address:" 10 45 "$stunServer" --output-fd 1)
        if [ $? = "1" ]; then
            clear
            echo "$QUIT"
            exit 1
        fi
        if [ "$temp" != "" ]; then
            stunServer="$temp"
        fi
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
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
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
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
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
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
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
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
        temp=$(dialog --backtitle "Friend Installer" --inputbox "\
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
        dialog --defaultno --backtitle "Friend Installer" --yesno "\
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
    done
fi

# Delete existing TLS keys?
if [ "$TLSDELETE" -eq "1" ]; then
    if [ -f "$FRIEND_BUILD/cfg/crt/key.pem" ]; then
        $SUDO rm "$FRIEND_BUILD/cfg/crt/key.pem"
    fi
    if [ -f "$FRIEND_BUILD/cfg/crt/certificate.pem" ]; then
        $SUDO rm "$FRIEND_BUILD/cfg/crt/certificate.pem"
    fi
fi

# Creates symlinks to TLS keys
if [ "$TLSCOPY" -eq "1" ]; then
    $SUDO ln -s "$keyPath" "$FRIEND_BUILD/cfg/crt/key.pem"
    $SUDO ln -s "$certificatePath" "$FRIEND_BUILD/cfg/crt/certificate.pem"
fi

# Saves setup.ini configuration file
echo "; Friend installation configuration file" | $SUDO tee "$INI_PATH" > installation.log
echo "; Please respect spaces if you edit this manually" | $SUDO tee -a "$INI_PATH" >> installation.log
echo " " | $SUDO tee -a "$INI_PATH" >> installation.log
echo "[FriendCore]" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbuser = $dbuser" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbhost = $dbhost" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbport = $dbport" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbname = $dbname" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbpass = $dbpass" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "domain = $friendCoreDomain" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "TLS = $TLS" | $SUDO tee -a "$INI_PATH" >> installation.log
echo " " | $SUDO tee -a "$INI_PATH" >> installation.log
echo "[TurnStun]" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "turn = $turnServer" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "stun = $stunServer" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "user = $turnUser" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "pass = $turnPass" | $SUDO tee -a "$INI_PATH" >> installation.log
echo " " | $SUDO tee -a "$INI_PATH" >> installation.log
echo "[FriendNetwork]" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "enable = $friendNetwork" | $SUDO tee -a "$INI_PATH" >> installation.log
echo " " | $SUDO tee -a "$INI_PATH" >> installation.log
echo "[FriendChat]" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "enable = $friendChat" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbname = $helloDbName" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbhost = $helloDbHost" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbport = $helloDbPort" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbuser = $helloDbUser" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbpass = $helloDbPass" | $SUDO tee -a "$INI_PATH" >> installation.log
echo " " | $SUDO tee -a "$INI_PATH" >> installation.log
echo "[Presence]" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbname = $presenceDbName" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbhost = $presenceDbHost" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbport = $presenceDbPort" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbuser = $presenceDbUser" | $SUDO tee -a "$INI_PATH" >> installation.log
echo "dbpass = $presenceDbPass" | $SUDO tee -a "$INI_PATH" >> installation.log
echo " " | $SUDO tee -a "$INI_PATH" >> installation.log

# Writes Config file for Friend Core compilation
echo "# Friend Core compilation path" | tee "$FRIEND_FOLDER/Config" >> installation.log
echo "# If empty compilation will default to" | tee -a "$FRIEND_FOLDER/Config" >> installation.log
echo "# $FRIEND_FOLDER/build" | tee -a "$FRIEND_FOLDER/Config" >> installation.log
echo "FRIEND_PATH=$FRIEND_BUILD" | tee -a "$FRIEND_FOLDER/Config" >> installation.log

# Defines global variables FRIEND_HOME and FRIEND_PATH in etc/profile.d/friend.sh
echo "# Friend Core global environment variables" | $SUDO tee "/etc/profile.d/friend.sh" >> installation.log
echo "export FRIEND_HOME=$FRIEND_FOLDER" | $SUDO tee -a "/etc/profile.d/friend.sh" >> installation.log
echo "export FRIEND_PATH=$FRIEND_BUILD" | $SUDO tee -a "/etc/profile.d/friend.sh" >> installation.log

# Clean exit
exit 0
