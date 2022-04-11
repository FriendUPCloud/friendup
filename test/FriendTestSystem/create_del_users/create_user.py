class TestClass:

    def __init__(self, sessionid, reqid):
        self.sessionid = sessionid
        self.reqid = reqid
        print('create_user.py created ')

    def generateRequest(self, additionalData ):
        print('device_list.py: generateRequest: ' + additionalData )
        return '{"type":"msg","data":{"type":"request","requestid":"'+ self.reqid +'","path":"system.library/user/create","data":{"sessionid":"'+ self.sessionid +'","username":"test","password":"test","fullname":"test","email":"test@test.pl","level":"User"},"sessionid":"'+ self.sessionid +'"}}'

    def checkTest(self, response ):
        print('create_user.py: checkTest running : ' + response )
        #resp = response.replace('\\\"','')
        #if resp.find('Name:Home,Type:SQLDrive') == -1 :
        #    return False
        return True

    def getReqid(self):
        print('create_user.py: getReqid: ' + str(self.reqid) )
        return self.reqid
