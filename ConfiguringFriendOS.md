How to configure Friend OS
==========================

Once you have built and/or installed Friend OS on your server, you need to
configure it properly. Each Friend OS server can be used for many different 
purposes - from running a community to simply serving an app.

Here is a list of configuration options, and what they mean.

Sections
========

The Friend OS configuration file is located in your build/cfg/cfg.ini file. 
If you do not have such a file, copy the build/cfg/cfg.ini.example and modify it.
The config file is sectioned, so here is a description of configuration options along 
with what they mean. If you wonder about config file formatting rules, please
take a look here for the *ini* format.

 * [INI file format](https://en.wikipedia.org/wiki/INI_file)
 
We have commented the sections with semicolon ; - do not add these to your own
configuration file.

Entries which start with ! are required.

```
[DatabaseUser]
--------------

login = database-username
password = "database-password"    ; ! Use in double quotes
host = database-hostname          ; ! Host of MySQL database, like: localhost
dbname = database-name            ; ! Name of MySQL database
port = 3306                       ; ! Port through which your database runs

[FriendCore]
------------

fchost = friendos.com             ; ! The hostname of your server
fcport = 6502                     ; ! The native port of your server
fcupload = storage/               ; ! The location of your file storage folder
fconlocalhost = 1                 ; ! If you're running on localhost (1 or 0)
workers = 128                     ; How many worker threads for your server
preventWizard = 1                 ; Prevent install wizard (1 or 0)
friendTheme = "your-theme"        ; Theme override

[Core]
------

port = 6502                       ; ! The native port of your server (again)
SSLEnable = 1                     ; If you want to enable SSL (1 or 0)
ProxyEnable=1                     ; If you are exposing through proxy (1 or 0)
                                  ;     Proxy is normal when using Apache as a
                                  ;     the front line on your setup
[LoginModules]
--------------

use = php.authmod                 ; ! Which login module engine to use
modules = your-module             ; Set which login module to use

[Security]
----------

blocktimeout = 30                 ; How long is a user blocked for logging in
blockattempts = 10                ; How many login attempts before being blocked
InvitesEnabled = true             ; If the invite system is enabled

[FriendNetwork]
---------------

enabled = 0                       ; Whether to enable Friend Network

[ServiceKeys]
-------------

AdminModuleServerToken = "hash"   ; ServerToken hash to use for admin modules

[FriendChat]
------------

enabled = 0                       ; Whether to enable Friend Chat

[Registration]
--------------

reg_user = "your-reg-user"        ; Username of the user to handle registrations
reg_password = "your-reg-pass"    ; Password of the user...
reg_version = "v2"                ; Version of registration script
reg_sitename = "Friend OS"        ; Named site for registration porposes
reg_workgroup = "Lounge"          ; Which workgroup to add new users into
reg_template = "Standard"         ; Which user template for new users
reg_disk_size = "1GB"             ; How much private storage
reg_verification_expiry = "+20 minutes"     ; How long till registration expires
cron_user_verification_notice = "10 MINUTE" ; How long till verification notice
cron_user_login_notice        = "5 MINUTE"  ; How long till login notice
cron_user_activity_notice     = "10 MINUTE" ; How long till lack activity notice
cron_user_feedback_notice     = "15 MINUTE" ; How long till ask feedback
cron_team_cancellation_period = "7"         ; Grace time for team cancellation
```

