#!/bin/sh
USER=`whoami`
PWD=`pwd`
FRIEND_RUN_DIRECTORY=$PWD/build
TMP=/tmp/friendcore.service

echo "Writing systemd script to temporary file $TMP"

echo '[Unit]' > $TMP
echo 'Description=Friend Core' >> $TMP
echo 'After=network.target' >> $TMP

echo '[Service]' >> $TMP
echo 'Type=simple' >> $TMP
echo "User=$USER" >> $TMP
echo "WorkingDirectory=$FRIEND_RUN_DIRECTORY" >> $TMP
echo "ExecStart=$FRIEND_RUN_DIRECTORY/FriendCore" >> $TMP
echo 'Restart=always' >> $TMP
echo 'RestartSec=3' >> $TMP
echo 'StandardOutput=null' >> $TMP

echo '[Install]' >> $TMP
echo 'WantedBy=multi-user.target' >> $TMP

echo "Copying temporary file $TMP to /etc/systemd/system"
sudo cp $TMP /etc/systemd/system/

echo ''
echo "Use standard systemd commands to control Friend Core:"
echo "systemctl start friendcore"
echo "systemctl stop friendcore"
echo "systemctl restart friendcore"
