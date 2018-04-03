#
#

# Packages for all linux distros
#
sudo apt-get install libssh2-1-dev libssh-dev libssl-dev libaio-dev \
	mysql-server \
	libmysqlclient-dev build-essential libmatheval-dev libmagic-dev \
	libgd-dev rsync valgrind-dbg libxml2-dev cmake make libwebsockets-dev libssh-dev

echo "If you use very new linux distro you should edit the GetAllPackages.sh file and uncomment the last 3 lines."

# Packages for new linux distros
# sudo add-apt-repository ppa:ondrej/php
# sudo apt-get update
# sudo apt-get install php5.6 php5.6-readline php5.6-mysql php5.6-gd php5.6-imap  php5.6-cli php5.6-curl phpmyadmin php5.6-mbstring php5.6-gettext

