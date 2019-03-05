Friend Unifying Platform version 1.2-RC2
========================================

**NB:** This branch is not yet stable, and is currently under development. Our current stable branch for users is FriendUP v1.2-RC1. This current branch changes daily. Developers should commit to *the master branch* after proper testing. Check this out for more information on [commit guidelines](https://github.com/FriendUPCloud/friendup/wiki/4.-Developer-Commit-Guidelines). Bleeding edge *users* should check out the *dev* branch (where daily activity is occuring). This one will be merged into the *friendup-1.2-rc2* branch as soon as it is deemed ready. Then this will be merged back into master in 04/2019. 

---

Friend is THE Internet Operating System for everyone, that runs on everything.

![FriendUP Workspace](https://cdn-images-1.medium.com/max/800/1*Ma4ZrbNC2aWsuU18NRc7LA.png "FriendUP Workspace")

Across devices
--------------

With its responsive desktop environment and client-side, javascript based technologies, FriendUP offers a new reality where you work and play online, independently from your local web enabled hardware. By supporting all screen formats, from mobile phones to laptops and VR, FriendUP is a single target through which you can reach the entire user market.
We have used considerable amount of time on making the FriendUP APIs simple and easy to understand. That is also why we are packaging the FriendUP Developers Manual with this release. In its third draft, it will soon cover the entire 1.0.x platform.

Distributed and powerful
------------------------

FriendUP aims to make the powerful emerging web technologies easy to work with. This is why we reach out to you, to help us enrich this platform with DOS drivers, modules, libraries and apps so that we can cover all of the interesting technologies out there that people use and love.
In the Future, FriendUP will be to the cloud users what Linux is for machines.

Getting started
===============

Prior to installation, check that 'bash', or a compatible shell is installed on your machine.

Just clone this repository, run the install.sh script and follow the on screen instructions. This script should run on most modern linux distributions. Post to the Developer Community if you run into any problems here.

The below script has been tested on Ubuntu 16. You might need to install MySQL or MariaDB first.

```
git clone https://github.com/FriendSoftwareLabs/friendup
apt install make cmake dialog
cd friendup/
./install.sh
```
We recommend setting up a dedicated user for your FriendUP installation. You will need the MySQL root password to allow the install script to create the database and user.

Note: the installer will not work if you launch it with anything else than bash. Example:
```
sh install.sh   << Will *not* work...
```

Dependencies
------------

The Friend installer relies on the following packages to work, and must be present on the machine before starting an installation :

- bash
- sudo
- gcc

If you encounter an error during the dependencies installation process, please refer to the end of this file for a complete list of the necessary dependencies, and install them manually. Then restart the installer.

Running the serving kernel manually
-----------------------------------

Friend Core can be installed in any directory you wish, including root directories. The installer creates two global variables, FRIEND_HOME pointing to the cloned friendup directory, and FRIEND_PATH pointing to the directory where Friend Core has been build. After running the installer script, you will need to reboot your machine for these variables to be defined.

When you want to run Friend Core yourself, you enter into its build directory. Like this:
```
cd myfriend/build/
./FriendCore
```
If you want to run it without debug output in your console, you can use nohup:
```
nohup ./FriendCore >> /dev/null &
```
If you want to kill Friend Core and it's dedicated servers (see later), use the killfriend.sh script located in both the build directory and the friendup directory.
```
./killfriend.sh
```

The installation script overwrites the content of the Friend Core configuration file (build/cfg/cfg.ini), and
will erase the extra data you have entered manually.

If you just want to recompile Friend Core, enter the following command in a shell:
```
cd myfriend
make clean setup release install
```

Default login
-------------

Once the installation script is finished and your local FriendCore is up and running use these credentials to log in: *fadmin*/*securefassword*. The first thing you may want to do, is add a new user : run the 'users' application that can be found in the 'System:Software/System' directory.

FriendNetwork
-------------

FriendNetwork can only be installed on an already installed Friend Core.

To install FriendNetwork, enter the following command in a shell:
```
cd myfriend
./installFriendNetwork.sh
```

In order to function, Friend Network needs a node server running on the machine. Friend Network installer will automatically install the latest version of node, npm and n.

You will also need to provide links to a TURN server, a STUN server and the credentials to enter the TURN server.

Friend Network server will be automatically launched when you run Friend Core after a successful installation.

In order to kill Friend Core and all the associated servers, we suggest you use the 'killfriend.sh' script.

Friend Chat
-----------

You can also install Friend Chat, our integrated text and video communication tool.

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

In order to kill Friend Core and all the associated servers, we suggest you use the 'killfriend.sh' script.

Please note that the 'Presence' server, necessary for IRC connections, does not work with user 'fadmin'": you have to create a real user and define
bothy its name and user name and use its session for it to connect.

Documentation
-------------

You can find the developer documentation in the docs folder. An administration guide will be added soon.

Chat room
---------

You will find many of our developers and users on our IRC channel / chat room. Please choose a unique nick and join using the link below.

https://friendup.cloud/community/irc-channel/

If you have chosen to install Friend Chat, the application will automatically open the friendup IRC channel upon starting.

Licensing
=========

FriendUP is a large system consisting of several layers. It has a kernel core that is managing the Friend resources. This one is licensed under the MIT license. Then it has modules, DOS drivers and runtime linked libraries. These are licensed under the LGPLv3 license. Finally, we have the GUI for Friend - the Friend Workspace. This is licensed under the AGPLv3 license.

Contributor agreement
=====================

New developers joining the project needs to sign our contributor agreement before they are allowed to commit changes to the project. The contributor agreement can be found here:

 * https://friendup.cloud/developer-platform/open-source/contributors/

The contributor agreement is our vechile for ensuring that this project can enjoy commercial support and gain essential project management, as well as an open book development cycle on Github.

Developer Community
===================

We invite everybody to join our developer community at https://developers.friendup.cloud/.

Demo server
-----------

For those that just want to test our Workspace, you can try our demo after registering at https://friendup.cloud/try-the-friendup-demo/.

List of dependencies
====================

This is the list of dependencies Friend Core needs to function.

- bash
- libssh2-1-dev
- libssh-dev
- libssl-dev
- libaio-dev
- mysql-server
- php5-cli
- php5-gd
- php5-imap
- php5-mysql
- php5-curl
- libmysqlclient-dev
- build-essential
- libmatheval-dev
- libmagic-dev
- libgd-dev
- libwebsockets-dev
- rsync
- valgrind-dbg
- libxml2-dev
- php5-readline
- cmake
- ssh
- make
