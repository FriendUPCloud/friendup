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


Certificates 
============

If you are testing on "localhost" or a local device, and you want to use SSL,
then you need certs. Create your self-signed certificates:

```
   openssl req -new -x509 -days 365 -nodes -out self.pem -keyout self.pem

```

