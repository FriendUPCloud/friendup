'Friend OS v1.3.0, "Helium"
==========================

---
**Release notes**

This is a work in progress - before the release there may be fluctuations, also 
in this ReadMe. Full notes coming with the final release of 1.3.0.

---

The Friend OS leverages the computing power of the Internet to offer many of the features and functionalities of Chrome OS, Windows, Linux, Android, macOS or iOS, without the need to choose a specific hardware platform or proprietary software package. If you have a device that is connected to the Internet, you can use the Friend OS.

The FriendOS liberates you from Big Tech:  It gives you control to create, collaborate, store and share information, data and content across all your devices in a secure private environment and access it anywhere on any device.

![Friend OS Helium](https://friendos.com/upload/images-master/lappy2.jpg)

Across devices
--------------

With its responsive desktop environment and client-side, javascript based technologies, Friend OS offers a new reality where you work and play online, independently from your local web enabled hardware. By supporting all screen formats, from mobile phones to laptops and VR, Friend OS is a single target through which you can reach the entire user market.

To install Friend OS on your device, chose "Install Friend OS" from your browser on mobile/tablet or desktop.

Distributed and powerful
------------------------

Friend OS aims to make the powerful emerging web technologies easy to work with. This is why we reach out to you, to help us enrich this platform with DOS drivers, modules, libraries and apps so that we can cover all of the interesting technologies out there that people use and love.
In the Future, Friend OS will be to the cloud users what Linux is for machines.

Installation instructions
=========================

1. Clone this repository into a folder
2. Install the following dependencies – below, to install for Ubuntu:

```
sudo apt-get install bash libssh2-1-dev libssh-dev libssl-dev libaio-dev mysql-server php7-cli php7-gd php7-imap php7-mysql php7-curl libmysqlclient-dev build-essential libmatheval-dev libmagic-dev libgd-dev libuv1 rsync valgrind-dbg libxml2-dev php7-readline cmake ssh make libsmbclient-dev libwebsockets-dev
```

3. Build FriendCore

```
echo "USE_SSH_THREADS_LIB=0" >> Config
echo "OPENSSL_INTERNAL=1" >> Config
make clean setup
make compile
make install
```

4. Create database / access

In your Friend folder:

```
sudo mysql
create user frienduser@localhost identified by "somepassword";
create database frienddb;
use frienddb;
source db/FriendCoreDatabase.sql;
grant all privileges on frienddb.* to frienduser@localhost;
flush privileges;
exit
```

5. Configure config file, located in build/cfg/cfg.ini (<a href="https://github.com/FriendUPCloud/friendup/blob/master/ConfiguringFriendOS.md">Configuring Friend OS</a>) 
6. Run FriendCore

```
cd build/
./FriendCore
```

You're done.

If you're using push notifications, you need to install composer and php Web Push:

```
sudo apt-get install composer
cd build/php
composer require minishlink/web-push
```

This will allow you to run web push, and enable in the cfg.ini:

```
[Security]
push_system = "php-web-push"
```

Configuring your server
-----------------------

* <a href="ConfiguringFriendOS.md">Please see configuration file information here</a>.

Default login
-------------

Once the installation script is finished and your local FriendCore is up and running use these credentials to log in: 
```
    User: fadmin
    Password: securefassword
```
The first thing you may want to do, is add a new user : run the 'System' application with "Run command" from the System menu on the Workspace.

Using site.ini
--------------

Once you have set everything up, you may want to customize your site. Create a file called site.ini in your build/ folder, and populate this ini file with a config like the following:

```
[Customization]
SiteName = "My Friend OS Site"
SiteShortName = "MySite"
Description = "The cool place to hang out for my organisation!"
BackgroundColor = "#000088"
```

The site.ini file can be modified to use your own favicon and other adaptations to give it your own identity or brand.


Optional packages
=================

Optional features and modules
-----------------------------

From of Friend OS 1.3.x you can use the install_optional.sh script to install 
special features for Friend OS that are not enabled by default, or uses 3rd
party projects in order to work. Current modules are:

 * SSHy for SSH functionality in Prompts (terminal application)
 * Web push (Minishlink) to enable web push notifications (in Convos)


Friend Network
-------------

Friend Network is included in this project, but must be installed separately. It can only be installed on an already installed Friend Core.

To install Friend Network, enter the following command in a shell:
```
cd myfriend
./installFriendNetwork.sh
```

In order to function, Friend Network needs a node server running on the machine. Friend Network installer will automatically install the latest version of node, npm and n.

You will also need to provide links to a TURN server, a STUN server and the credentials to enter the TURN server.
The installer provides access to a public stun and turn server at:
```
  turn Server: ice.friendup.cloud
    turn User: TINA
turn Password: TURNER
```

```
stun Server: ice.friendup.cloud
```


Friend Network server will be automatically launched when you run Friend Core after a successful installation.

In order to **kill Friend Core and all the associated servers**, we suggest you use the **'killfriend.sh' script**.


Friend Chat
-----------

You can also install [Friend Chat](https://github.com/FriendSoftwareLabs/friendchat), our integrated text and video communication tool.

FriendChat can only be installed on an already installed Friend Core.

To install FriendChat, enter the following command in a shell:
```
cd myfriend
./installFriendChat.sh
```

The installer will check for node.js, npm and n and install them if necessary.

Friend Chat needs Friend Core to run with TLS protection : if you have not defined TLS keys during the installation of Friend Core,
the Friend Chat installer will give you the opportunity to create them. Once this is done, Friend Core will run in TLS mode,
and you will have to connect to your Friend machine with 'https' instead of 'http'.

As for Friend Network, you will need to provide links to a TURN server, a STUN server and the credentials to enter the TURN server.

Friend Chat needs two servers to function, the 'Presence' server, and the 'Friend Chat' server. Both servers will automatically be launched by Friend Core.

In order to **kill Friend Core and all the associated servers**, we suggest you use the **'killfriend.sh' script.**

Please note that the 'Presence' server, necessary for IRC connections, does not work with user 'fadmin'": you have to create a real user and define
both its name and user name and use its session for it to connect.

Ports
-----

- 6502 -> used by main Friend Workspace. Needs to be forwarded by the router to permit remote access.
- 6500 ->
- 3306 -> used by MSQL database
- 3478 -> (UDP, TCP) Stun servers
- 5349 -> (TLS) Stun servers

Documentation
-------------

You can find the developer documentation in the docs folder. An administration guide will be added soon.

Licensing
=========

Friend OS is a large system consisting of several layers. It has a kernel core that is managing the Friend resources. This one is licensed under the MIT license. Then it has modules, DOS drivers and runtime linked libraries. These are licensed under the LGPLv3 license. Finally, we have the GUI for Friend - the Friend Workspace. This is licensed under the AGPLv3 license.

Tested - a lot
==============

We extensively test our platform and use https://www.browserstack.com/ for cross browser testing.

