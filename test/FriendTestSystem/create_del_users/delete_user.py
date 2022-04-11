class TestClass:

    def __init__(self, sessionid, reqid):
        self.sessionid = sessionid
        self.reqid = reqid
        print('delete_user.py created ')

    def generateRequest(self, additionalData ):
        print('device_list.py: generateRequest: ' + additionalData )
        return '{"type":"msg","data":{"type":"request","requestid":"'+ self.reqid +'","path":"system.library/user/delete","data":{"sessionid":"'+ self.sessionid +'","id":"test"},"sessionid":"'+ self.sessionid +'"}}'

    def checkTest(self, response ):
        print('delete_user.py: checkTest running : ' + response )
        #resp = response.replace('\\\"','')
        #if resp.find('Name:Home,Type:SQLDrive') == -1 :
        #    return False
        return True

    def getReqid(self):
        print('delete_user.py: getReqid: ' + str(self.reqid) )
        return self.reqid
