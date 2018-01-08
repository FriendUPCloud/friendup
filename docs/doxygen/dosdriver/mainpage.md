# Welcome to DOSDrivers

## 1. What are DOSDrivers
Just ... drives, like any other drive. Yet although they seem and look the same
what they... drive maybe totally different. You can have a Dropbox drive, a SQL-
driven drive, everything is possible, and they will all provide to the user
the same experience of icons and folders.
Any filesystem need to include data storage. Friend has improved the concept and
allows, with the use of specific libraries of code, the implementation of any kind
of "drive" on a Friend Workspace, drive being either hosted on a mySQL data base
(such as the System and Home drives of your Workspace), or directly linked to
external NAS systems such as Dropbox or Google Drive.
Once mounted on the Workspace, a new icon will appear as an access point to the
drive... Then, depending on the DOSDriver itself, operations like upload, download,
listing directories etc. can be performed.

## 2. Program in the language you prefer
DOSDrivers then be written in PHP or C. Friend will look at the language indicator
contained in the DOSDriver.ini file and will adapt accordingly. Please note that
for the moment, this documentation will focus on the PHP versions.

## 3. How does the system work?

### 3.1. The READ method explained.

Loading a file in the Friend Workspace, runs the "read" DOS command using
HTTP (or web sockets, if you're using that....)

Method:POST /system.library/file/read

Form data:

    sessionid: e4ba0ba824942e78fb0e8d0863bd0187fc8f8106

    path: Storage:Documents/Testing_For_Author.html

mode: r


__This is handled by Friend Core,__

Which finds the Storage drive, which type it is and which handler it is using.
In our case, Storage: is a SQLDrive which uses the phpfs handler.
The SQLDrive gets the "path" and "mode" vars passed after they have been
sanitized for exploiting data.


__phpfs, runs the command FileOpen() with the mode from the "Form data".__
In this case it is "r", which means to read in text mode. "read" understands these
modes:


 "r" - text mode

 "rb" - binary mode

 "rs" - binary stream mode

Note: phpfs is a set of C functions handling PHP calls for the file system.

__FileOpen() further executes the php based files module__

Which opens up the correct PHP based dos driver door code.
The dormant command "read" is executed with php-cli, and the result is
piped back to Friend Core.
After having executed FileOpen(), the file is read into a buffer and closed with
FileClose(), which allows outputting the data to the browser..


### 3.2. What happens when the handler executes a php-cli call on the files module.


__The files module is passed three important vars:__

type, path and mode.

By having the type and path variables, it can find the right class and load
a MySQL entry that has more data on the file system. This is the data that
has been stored using the Disk Catalog tool.

__Once the right door class has been found, for example__

    DOSDrivers/SQLDrive/door.php
the class is instantiated with the data from the MySQL database table;
Filesystem, and the dormant function is called as appropriate:

   if( $result = $door->dosAction( $args ) )

__Commands coming in from FriendCore always makes use of the dosAction() method in the class.__

__The return data from executing a dos action must always start with either__

   ok\<!--separate-->

  or

   fail\<!--separate-->

After this, the output after the separator is in an appropriate JSON format.
All other commands, like WRITE and DELETE all use this same scheme, using
dosAction() in the door.php class to carry out its directive..




