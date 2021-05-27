from abc import abstractmethod

class TestClass:
    def __init__(self, sessionid, reqid):
        self.sessionid = sessionid
        self.reqid = reqid

    @abstractmethod
    def generateRequest(self, additionalData ):
        print('generateRequest: test_class.py: ' + additionalData )
        return '{}'

    @abstractmethod
    def checkTest(self, response ):
        print('checkTest: test_class.py: ')
        return True

    @abstractmethod
    def getReqid(self):
        print('getReqid: test_class.py: ')
        return self.reqid

