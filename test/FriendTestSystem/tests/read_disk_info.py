class TestClass:

    def __init__(self, sessionid, reqid):
        self.sessionid = sessionid
        self.reqid = reqid

    def generateRequest(self, additionalData ):
        print('read_disk_info.py: generateRequest: ' + additionalData )
        return '{"type":"msg","data":{"type":"request","requestid":"' +self.reqid+ '","path":"system.library/file/read","data":{"sessionid":"'+ self.sessionid +'","path":"Home%3Adisk.info","mode":"r"},"sessionid":"'+ self.sessionid +'"}}'

    def checkTest(self, response ):
        print('read_disk_info.py: checkTest')
        return True

    def getReqid(self):
        print('read_disk_info.py: getReqid ' + str(self.reqid) )
        return self.reqid
