cp -r /home/francois/friendup/interfaces/web_desktop/apps/Friend/* /var/www/html/friend
cd /var/www/html
chown -R :francois friend
wmctrl -a localhost/friend

