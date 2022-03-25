FriendCore test system
FriendTestSystem contain pack of scripts which allow to test Friend functionalities and performance. By now you can find files and directories there:
master.py - main python test file
test_class.py - abstract test module-class
tests [directory] - contain scripts based on abstract class which can be launched by master.py script
To create own test with list of requests create new directory and new file in it. Please use filename which will describe what your test will do. Below you can find example script:

class TestClass:

    def __init__(self, sessionid, reqid):
        self.sessionid = sessionid
        self.reqid = reqid
        print('device_list.py created ')

    def generateRequest(self, additionalData ):
        print('device_list.py: generateRequest: ' + additionalData )
        return '{"type":"msg","data":{"type":"request","requestid":"'+ self.reqid +'","path":"system.library/device/list","data":{"sessionid":"'+ self.sessionid +'"},"sessionid":"'+ self.sessionid +'"}}'

    def checkTest(self, response ):
        print('device_list.py: ')
        return True

    def getReqid(self):
        print('device_list.py: getReqid')
        return self.reqid

As you see test file must always contain TestClass with constructor, generateRequest, checkTest and getReqid methods which will be used to generate and test responses from Friend system.
New request must be returned by generateRequest as string. It must contain provided in constructor fields requestid and sessionid. To make fully working system please fill checkTest function which gets server response.
Main application is placed in master.py file. Before you will run it on your Friend please check:
user on Friend system. You need credentials to login into Friend. Login which can be passed to system through -l option, password through -p option.
internet address where FriendCore is working, it is passed to program through -ho option
port on which FriendCore is running (default 6502), you can change it by using option -po
if FriendCore is running via HTTPS. If yes use option -s with “true” parameter
You can also set parameters like:
process count which says number of iteration of tests which will be done during one run
message interval which is responsible for delay between each test
test directory which will load all prepared tests from pointed path. All this tests will be launched during test process

Below application parameters:


usage: master.py [-h] [-l L] [-p P] [-ho HO] [-po PO] [-t T] [-s S] [-pc PC]
                 [-mi MI]

optional arguments:
  -h, --help  show this help message and exit
  -l L        login
  -p P        password
  -ho HO      host - FriendCore host name
  -po PO      port - FriendCore port
  -t T        test directory - which directory test should be launched
  -s S        SSL - use secured connection (true/false)
  -pc PC      Process count - number of processes launched in same time by
              user
  -mi MI      Message interval - interval between test calls
  -hp HP      Check http POST parameters call
