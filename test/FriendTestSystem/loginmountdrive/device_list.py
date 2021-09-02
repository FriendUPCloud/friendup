class TestClass:

    def __init__(self, sessionid, reqid):
        self.sessionid = sessionid
        self.reqid = reqid
        print('device_list.py created ')

    def generateRequest(self, additionalData ):
        print('device_list.py: generateRequest: ' + additionalData )
        return '{"type":"msg","data":{"type":"request","requestid":"'+ self.reqid +'","path":"system.library/device/list","data":{"sessionid":"'+ self.sessionid +'"},"sessionid":"'+ self.sessionid +'"}}'

    def checkTest(self, response ):
        print('device_list.py: checkTest running : ' + response )
        resp = response.replace('\\\"','')
        if resp.find('Name:Home,Type:SQLDrive') == -1 :
            return False
        return True

    def getReqid(self):
        print('device_list.py: getReqid: ' + str(self.reqid) )
        return self.reqid
