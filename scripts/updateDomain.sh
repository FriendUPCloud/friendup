#!/bin/sh

#
# Friend Core, Friend Chat and Friend Network installation script
#
# This script will install the necessary components to make the Friend servers
# run on your machine.
# It will save all the recorded information so that you do not have to type
# them the next time you run the script.
#

DOMAIN=$1
NEEDLE=$2
if [ -z "$DOMAIN" ]; then
	echo "You must pass a FQDN"
	exit 1
else
	echo "updateing to domain: $DOMAIN"
fi

if [ -z "$NEEDLE" ]; then
	NEEDLE="{YourDomain}"
else
	echo "Replacing user specified pattern: $NEEDLE"
fi

FRIEND="/home/$USER/friendup"
if [ -d "$FRIEND" ]; then
	echo "$FRIEND"
else
	echo "Could not find friend: $FRIEND"
	exit 1
fi

FBUILD="$FRIEND/build"

# PATHS
APACHE="/etc/apache2/sites-available/000-default.conf"
CFG="$FBUILD/cfg/cfg.ini"
PRESENCE="$FBUILD/services/Presence/config.js"
HELLO="$FBUILD/services/FriendChat/config.js"
HELLO_CLIENT="$FBUILD/resources/webclient/apps/FriendChat/local.config.js"

# CHECk
check_file_exists(){
	if [ -f "$1" ]; then
		echo "found: $1"
	else
		echo "Could not find: $1"
		exit 1
	fi
}

check_file_exists "$APACHE"
check_file_exists "$CFG"
check_file_exists "$PRESENCE"
check_file_exists "$HELLO"
check_file_exists "$HELLO_CLIENT"

# set domain

sudo sed -i "s/$NEEDLE/$DOMAIN/g" $APACHE
sed -i "s/$NEEDLE/$DOMAIN/g" $CFG
sed -i "s/$NEEDLE/$DOMAIN/g" $PRESENCE
sed -i "s/$NEEDLE/$DOMAIN/g" $HELLO
sed -i "s/$NEEDLE/$DOMAIN/g" $HELLO_CLIENT

#restart apache
sudo /etc/init.d/apache2 restart
#Run certbot:
sudo certbot --apache
#restart apache:
sudo /etc/init.d/apache2 restart

#Create symlink to certs
cd $FBUILD/cfg/crt
sudo chmod +x /etc/letsencrypt/archive/$DOMAIN
sudo chmod +x /etc/letsencrypt/live/$DOMAIN
sudo ln -s /etc/letsencrypt/live/$DOMAIN/fullchain.pem certificate.pem
sudo ln -s /etc/letsencrypt/live/$DOMAIN/privkey.pem key.pem
sudo chmod +r  /etc/letsencrypt/archive/$DOMAIN/privkey1.pem

# insert the thing into apache conf
TCONF="$FRIEND/scripts/tobbans_special_sauce.txt"
ASSLCONF="/etc/apache2/sites-available/000-default-le-ssl.conf"
sudo sed -i "/DocumentRoot \/var\/www\/html/ r $TCONF" $ASSLCONF

# restart
sudo /etc/init.d/apache2 restart
sudo systemctl restart friendcore
sudo systemctl restart friendchat-server
sudo systemctl restart presence-server
#sudo systemctl stop friendchat-server && sudo systemctl stop presence-server
#sudo systemctl start friendchat-server  && sudo systemctl start presence-server