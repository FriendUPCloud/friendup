class TestClass:

    def __init__(self, sessionid, reqid):
        self.sessionid = sessionid
        self.reqid = reqid
        print('list_sessons.py created ')

    def generateRequest(self, additionalData ):
        print('device_list.py: generateRequest: ' + additionalData )
        return '{"type":"msg","data":{"type":"request","requestid":"'+ self.reqid +'","path":"system.library/user/sessionlist","data":{"sessionid":"'+ self.sessionid +'"},"sessionid":"'+ self.sessionid +'"}}'

    def checkTest(self, response ):
        print('list_sessons.py: checkTest running')
        return True

    def getReqid(self):
        print('list_sessons.py: getReqid: ' + str(self.reqid) )
        return self.reqid
