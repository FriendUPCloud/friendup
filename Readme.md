Friend Unifying Platform version 1.0.0
==================================

We are happy to announce the release of FriendUP version 1.0.0.

FriendUP version 1.0.0 is the first complete open source release of the platform. It introduces a saturated vision for the next paradigm in computing. FriendUP comes with a powerful kernel-like web server that supports multiple protocols and data sources, next to resource- and user session management. This offers javascript developers a fresh backendless environment in which to accelerate their development of exciting new applications and games. 

![FriendUP Workspace](https://friendup.cloud/wp-content/uploads/2017/06/desktop-1.png "FriendUP Workspace")

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

Just clone this repository, run the install.sh script and follow the on screen instructions. This script should run on most modern linux distributions. Post to the Developer Community if you run into any problems here.
```
git clone https://github.com/FriendSoftwareLabs/friendup
friendup/install.sh
```
We recommend setting up a dedicated user for your FriendUP installation. You will need the MySQL root password to allow the install script to create the database and user.

Running the serving kernel manually
-----------------------------------

Friend Core does not install into /usr/bin or another global path yet. It is contained in the directory where you cloned or unpacked it. When you want to run Friend Core yourself, you enter into its build directory. Like this:
```
cd myfriend/build/
./FriendCore
```
If you want to run it without debug output in your console, you can use nohup:
```
nohup ./FriendCore >> /dev/null &
```

Default login
-------------

Once the installation script is finished and your local FriendCore is up and running use these credentials to log in: *fadmin*/*securefassword*.

FriendNetwork
-------------

In order to function, FriendNetwork needs a node server running on the machine.

Please follow these instructions:

- If it is not already installed on your machine, install node and npm with the following commands:

'sudo apt-get update'

'sudo apt-get install nodejs npm'

FriendNetwork will work with every version of node above 4.0.4

Once node and npm are installed, we suggest you also install 'n' to control the version of node you are using:

'sudo npm install -g n'

- Load the file friendup/services/FriendNetwork/example.config.js in a text editor
- Enter the name of your domain on the line named 'host' (localhost will work)
- Save the file as config.js
- If you have not yet installed Friend with install.sh, it is time to do it
- If you have already launched this script, go back to the friendup directory and type:
'make install'
- Go to the directory friendup/build/services/FriendNetwork
- Type:
'npm install'
- To launch the FriendNetwork server, type:
'node fnet.js'

The FriendNetwork commands (including the Shell commands) will only work if the FriendNetwork server is running.
The next versions of FriendCore will automatically launch the FriendNetwork server.

Documentation
-------------

You can find the developer documentation in the docs folder. An administration guide will be added soon.

Chat room
---------

You will find many of our developers and users on our IRC channel / chat room. Please choose a unique nick and join using the link below.

https://friendup.cloud/community/irc-channel/

Licensing
=========

FriendUP is a large system consisting of several layers. It has a kernel core that is managing the Friend resources. This one is licensed under the MIT license. Then it has modules, DOS drivers and runtime linked libraries. These are licensed under the LGPLv3 license. Finally, we have the GUI for Friend - the Friend Workspace. This is licensed under the AGPLv3 license.

Developer Community
===================

We invite everybody to join our developer community at https://developers.friendup.cloud/.

Demo server
-----------

For those that just want to test our Workspace, you can try our demo after registering at https://friendup.cloud/try-the-friendup-demo/.
