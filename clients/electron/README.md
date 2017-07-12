FriendUP Electron Client
========================

The electron client creates a self contained executable for OSX / Linux / Windows that loads FriendUP in it's own window.

Getting started:
----------------

npm install

npm start

Building:
------------

npm install electron-packager -g

electron-packager . FriendUP --all

Known issues
---------------

Application won't close - something to do with FriendUP's window.onbeforeunload function.
