*************************************************************************

You have to set up the database. Create a MySQL database and user.
Import /opt/friendup/db/FriendCoreDatabase.sql

After setting up the database, copy /opt/friendup/cfg/cfg.ini.example
to cfg.ini and fill in database credentials.

*************************************************************************

Start FriendUp using standard systemd commands:

    sudo systemctl start friendup
    sudo systemctl stop friendup
    sudo systemctl enable friendup

