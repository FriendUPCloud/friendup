#!/bin/sh
USER=`whoami`
PWD=`pwd`
FRIEND_RUN_DIRECTORY=$PWD/build
TMP=/tmp/guacd.service

echo "Writing systemd script to temporary file $TMP"

echo '[Unit]' > $TMP
echo 'Description=Guacd' >> $TMP
echo 'After=network.target' >> $TMP

echo '[Service]' >> $TMP
echo 'Type=simple' >> $TMP
echo "User=$USER" >> $TMP
echo "WorkingDirectory=$FRIEND_RUN_DIRECTORY" >> $TMP
echo "ExecStart=/usr/local/sbin/guacd -f" >> $TMP
echo 'Restart=always' >> $TMP
echo 'RestartSec=3' >> $TMP

echo '[Install]' >> $TMP
echo 'WantedBy=multi-user.target' >> $TMP

echo "sudo needed to copy temporary file $TMP to /etc/systemd/system"
sudo cp $TMP /etc/systemd/system/

echo ''
echo "Use standard systemd commands to control guacd:"
echo "systemctl start guacd"
echo "systemctl stop guacd"
echo "systemctl restart guacd"
