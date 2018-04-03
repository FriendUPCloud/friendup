#!/bin/bash

# THIS SCRIPT IS OBSOLETE!!! THIS SCRIPT IS OBSOLETE!!!
# THIS SCRIPT IS OBSOLETE!!! THIS SCRIPT IS OBSOLETE!!!

# Do not use this script in normal deployments.
# Use install_systemd.sh instead.

# THIS SCRIPT IS OBSOLETE!!! THIS SCRIPT IS OBSOLETE!!!
# THIS SCRIPT IS OBSOLETE!!! THIS SCRIPT IS OBSOLETE!!!
exit 0

#This is a startup script that should be used in production environments
#It check first if MySQL is available (because FriendCore will fail permanently
#without working MySQL and will not recover on its own)

#------------------------------------------------------
#add this to /etc/rc.local (for Debian/Ubuntu) - adjust user name and path
#  su - Friend -c "/usr/bin/screen -S friendcore -md /home/Friend/friendup/wrapper.sh"
#------------------------------------------------------

# Quirk 1 - if this script does not execute properly - hardcode tha path instead of using $DIR

# Quirk 2 - if something goes wrong - try using #!/bin/sh

# Quirk 3 - FriendCore will execute all scripts in build/autostart
#           They use /bin/sh. Node.js installer modifies only .bashrc
#           The path to 'node' binary must be added to ~/.profile for /bin/sh to take effect!

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" #returns directory where this very script is located

while true; do #main reboot loop

nc -z localhost 3306 -w4
MYSQL_AVAILABLE=$? #return code from netcat

echo MySQL status $MYSQL_AVAILABLE

if [ $MYSQL_AVAILABLE -eq 0 ]
then
        echo "Starting FriendCore"
        cd $DIR/build
        ./FriendCore
fi
echo -------------------------------
sleep 5

done
