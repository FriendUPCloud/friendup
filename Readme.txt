Message from Friend Software Labs:
==================================

Please note that we have had not had time to update our open source version for too long time. We have been working hard behind the scenes and are planning to publish it together with our release candidate 2 in hte next couple of weeks.

Until then we urge people considering a commercial installation to get in touch with us via https://friendup.cloud.

=============================================================


Readme for version beta 3b
--------------------------

Welcome to the Friend Unifying Platform for the open source
community. This version includes all the components that are
released under the AGPLv3 license. Please find the license
in a separate document in this directory.

For more information about the project, please visit:

 * https://friendos.com/

And visit this link for our GitHub project page:

 * https://github.com/FriendSoftwareLabs

Introduction
------------

FriendUP is a new meta operating system and web OS for posix
hosts. It allows a user to have an operating system experience
on any device that has a HTML5 web browser available. For 
developers and administrators, it allows for a uniform way of
working with low level components as well as servers.

At the moment, FriendUP is in beta. For this reason, there will
be lacks and bugs. Please visit our website to report such bugs.
In the near future, we will make available an issue tracker in
every release of FriendUP.

Online demo / beta
------------------

We are maintaining an online beta versjon for those who want
to access a permanent system. Each beta tester gets access to
file storage and several apps not available in the open source
version. Please visit the following url to sign up:

 * https://friendos.com/beta/index.html
 
You will receive instructions by mail.

Raspberry PI
------------

We hope you will try to deploy FriendUP on a Raspberry PI. The
open source community version is specificly targeting this
platform for tinkerers and developers alike. If you have any 
ideas on how to use FriendUP on a RPI, please contact us on:

 * developers@friendos.com
 
Upgrading
---------

If you have already downloaded an earlier version of FriendUP 
through git, just run:

 * git pull

...to fetch the latest files. If you downloaded the .zip archive,
just extract the current beta over the old files. After this, just
run:

 * make clean && make setup && make compile && make install
 
This will compile the latest version of Friend Core and install 
the newest version of Friend Workspace.
 
Installing
----------

To install FriendUP, please read and execute the instructions
found in "docs/Compiling.txt". After you have installed all the
required software, run the installer:

 php5 install.php
 
Fill in sane answers to the questions, and you should be all set.
Do not try to set up your config file manually, as this is 
unnecessary and only for more experienced FriendUP developers.
Additionally, make sure your password is encased in quotes when
using non alpha numeric characters because of a limitation in
the ini config parser.

Make sure to find the url to your login screen in your web
browser at:

 http://yourhost:port/webclient/index.html

Caveats
-------

If there were small changes done to the database structure that
we didn't catch, you can compare your current database structure
with the one found in:

 * docs/FriendCoreDatabase.sql

Upgrade Password
----------------

If upgrading from a previous version of FriendUP, please update
your current password with this one in your database:

{S6}e4bf51f71c136d46e222b15b350f7f7d170841edbb13ce9dc73a1c241b393aac

It reads: friendpassword

You can update your password later on with the Users application.
