
Modules are the counterpart to Libraries. They work on an identical system
of messages and are independent parts of code that can be written in any
available language supported by the platform (C, PHP, Python etc.).
Modules are executed by Friend Core when called, and do not remain
persistent in memory on the server.

Modules are more task oriented than Libraries. Libraries are used to
access general functionality like access and data manipulation. Modules
are used extensively throughout applications and indeed the Friend Workspace.
In your applications, you can split logic between server code and client
code, where server code is handled by your modules, and client code is
handled by Javascript in the Workspace. FriendUP makes an intensive use
of the modules via internal messaging transmitted between the Workspace
in the browser and the Friend Core in the cloud. All of the functions
that gets used by the system are available to the developer.


#### Developing your own modules

You can create your own modules for your own needs in any language you
want, as long as you implement the entry functions and the messaging
system. We currently use modules written in C, PHP and Python.


