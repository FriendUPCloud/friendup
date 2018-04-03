#-*- coding:utf-8 -*-
import sys
import socket
import random
import os
import sys
import time
import thread

remoteAddress = None
remotePort = 0
mode = 0

request_counter = 0
total_request = 0
error_request = 0
error_create_socket = 0

method = []
uri = []
querystring = []
headers = []
cookie = []
content_lenght = []
body = []
body_lenght = 100

def help():
	print "usage httphunter.py --host host --port|-p port"
	print "\n\t--host\t\t\tThe host where the server is running"
	print "\t-p, --port\t\tThe port that the server is running on"
	sys.exit(0)

def inc_counter():
	global request_counter
	request_counter+=1	

def parseCommandLine():
	remoteAddress = None
	remotePort = None
	for i in range(len(sys.argv)):
		if(sys.argv[i] == '--host'):
			remoteAddress = str(sys.argv[i+1])
			i=i+1
		if(sys.argv[i] == '--port' or sys.argv[i] == '-p'):
			remotePort = int(sys.argv[i+1])
		if(sys.argv[i] == '-h'):
			"""TODO: add the help message"""
			help()

	return remoteAddress,remotePort


def buildnormal(size):
	out_str = ''
	for i in range(0, size):
		a = random.randint(65, 90)
		out_str += chr(a)
		a = random.randint(97, 122)
		out_str += chr(a)
	return(out_str)
	
	
def builderror(size):
	out_str = ''
	for i in range(0, size):
		a = random.randint(0, 1)
		out_str += chr(a)
		a = random.randint(2, 47)
		out_str += chr(a)
	return(out_str)
	
	
def bulidlist():
	global method
	global uri
	global querystring
	global headers
	global cookie
	global content_lenght
	global body
	
	#method	
	method.append('HEAD')
	method.append('GET')
	method.append('POST')
	method.append('OPTONS')
	method.append('XXXX')
	method.append('head')
	
	#URI
	uri.append('')
	uri.append('/' + buildnormal(random.randint(10,100)))
	uri.append('/' + buildnormal(random.randint(1000,3000)))
	uri.append('/' + builderror(random.randint(10,100)))
	uri.append('/' + builderror(random.randint(1000,3000)))
	uri.append(buildnormal(random.randint(10,100)))
	uri.append(buildnormal(random.randint(1000,3000)))
	uri.append(builderror(random.randint(10,100)))
	uri.append(builderror(random.randint(1000,3000)))
	
	#querystring
	querystring.append('')
	
	querystring.append('?' + buildnormal(random.randint(10,100)) + '=' + buildnormal(random.randint(10,100)))
	querystring.append('?' + buildnormal(random.randint(1000,3000)) + '=' + buildnormal(random.randint(1000,3000)))
	querystring.append('?' + builderror(random.randint(10,100)) + '=' + builderror(random.randint(10,100)))
	querystring.append('?' + builderror(random.randint(1000,3000)) + '=' + builderror(random.randint(1000,3000)))
	
	querystring.append('?' + buildnormal(random.randint(10,100)) + '=' + buildnormal(random.randint(10,100)) + '=' + buildnormal(random.randint(10,100)))
	querystring.append('?' + buildnormal(random.randint(1000,3000)) + '=' + buildnormal(random.randint(1000,3000)) + '=' + buildnormal(random.randint(1000,3000)))
	querystring.append('?' + builderror(random.randint(10,100)) + '=' + builderror(random.randint(10,100)) + '=' + builderror(random.randint(10,100)))
	querystring.append('?' + builderror(random.randint(1000,3000)) + '=' + builderror(random.randint(1000,3000)) + '=' + builderror(random.randint(1000,3000)))
	
	querystring.append(buildnormal(random.randint(10,100)))
	querystring.append(buildnormal(random.randint(1000,3000)))
	querystring.append(builderror(random.randint(10,100)))
	querystring.append(builderror(random.randint(1000,3000)))
	
	querystring.append(buildnormal(random.randint(10,100)) + '=')
	querystring.append(buildnormal(random.randint(1000,3000)) + '=')
	querystring.append(builderror(random.randint(10,100)) + '=')
	querystring.append(builderror(random.randint(1000,3000)) + '=')
	
	querystring.append('=' + buildnormal(random.randint(10,100)))
	querystring.append('=' + buildnormal(random.randint(1000,3000)))
	querystring.append('=' + builderror(random.randint(10,100)))
	querystring.append('=' + builderror(random.randint(1000,3000)))
	
	querystring.append('=' + buildnormal(random.randint(10,100)) + '=')
	querystring.append('=' + buildnormal(random.randint(1000,3000)) + '=')
	querystring.append('=' + builderror(random.randint(10,100)) + '=')
	querystring.append('=' + builderror(random.randint(1000,3000)) + '=')
	
	
	#headers
	headers.append('')
	headers.append('Content-Type: application/x-www-form-urlencoded\r\n')
	headers.append('Content-Type: application/x-www-form-urlencoded\r\n\r\n')
	headers.append('Content-Type: application/x-www-form-urlencoded')
	
	headers.append('User-Agent: ' + buildnormal(random.randint(10,100)) + '\r\n')
	headers.append('User-Agent: ' + buildnormal(random.randint(1000,3000)) + '\r\n')
	headers.append('User-Agent: ' + builderror(random.randint(10,100)) + '\r\n')
	headers.append('User-Agent: ' + builderror(random.randint(1000,3000)) + '\r\n')
	
	headers.append('User-Agent: ' + buildnormal(random.randint(10,100)) + '\r\n\r\n')
	
	headers.append('User-Agent: ' + buildnormal(random.randint(10,100)))
	headers.append('User-Agent: ' + buildnormal(random.randint(1000,3000)))
	headers.append('User-Agent: ' + builderror(random.randint(10,100)))
	headers.append('User-Agent: ' + builderror(random.randint(1000,3000)))
	
	headers.append('Referer: ' + buildnormal(random.randint(10,100)) + '\r\n')
	headers.append('Referer: ' + buildnormal(random.randint(1000,3000)) + '\r\n')
	headers.append('Referer: ' + builderror(random.randint(10,100)) + '\r\n')
	headers.append('Referer: ' + builderror(random.randint(1000,3000)) + '\r\n')
	
	headers.append('Referer: ' + buildnormal(random.randint(10,100)) + '\r\n\r\n')
	
	headers.append('Referer: ' + buildnormal(random.randint(10,100)))
	headers.append('Referer: ' + buildnormal(random.randint(1000,3000)))
	headers.append('Referer: ' + builderror(random.randint(10,100)))
	headers.append('Referer: ' + builderror(random.randint(1000,3000)))
	
	#cookie
	cookie.append('')
	
	cookie.append('Cookie: ' + buildnormal(random.randint(10,100)) + '=' + buildnormal(random.randint(10,100)) + '\r\n')
	cookie.append('Cookie: ' + buildnormal(random.randint(1000,3000)) + '=' + buildnormal(random.randint(1000,3000)) + '\r\n')
	cookie.append('Cookie: ' + builderror(random.randint(10,100)) + '=' + builderror(random.randint(10,100)) + '\r\n')
	cookie.append('Cookie: ' + builderror(random.randint(1000,3000)) + '=' + builderror(random.randint(1000,3000)) + '\r\n')
	
	cookie.append('Cookie: ' + buildnormal(random.randint(10,100)) + '=' + buildnormal(random.randint(10,100)) + '\r\n\r\n')
	
	cookie.append('Cookie: ' + buildnormal(random.randint(10,100)) + '\r\n')
	cookie.append('Cookie: ' + buildnormal(random.randint(1000,3000)) + '\r\n')
	cookie.append('Cookie: ' + builderror(random.randint(10,100)) + '\r\n')
	cookie.append('Cookie: ' + builderror(random.randint(1000,3000)) + '\r\n')
	
	cookie.append('Cookie: ' + '=' + buildnormal(random.randint(10,100)) + '\r\n')
	cookie.append('Cookie: ' + '=' + buildnormal(random.randint(1000,3000)) + '\r\n')
	cookie.append('Cookie: ' + '=' + builderror(random.randint(10,100)) + '\r\n')
	cookie.append('Cookie: ' + '=' + builderror(random.randint(1000,3000)) + '\r\n')
	
	cookie.append('Cookie: ' + buildnormal(random.randint(10,100)) + '=' + '\r\n')
	cookie.append('Cookie: ' + buildnormal(random.randint(1000,3000)) + '=' + '\r\n')
	cookie.append('Cookie: ' + builderror(random.randint(10,100)) + '=' + '\r\n')
	cookie.append('Cookie: ' + builderror(random.randint(1000,3000)) + '=' + '\r\n')
	
	cookie.append('Cookie: ' + buildnormal(random.randint(10,100)) + '=' + buildnormal(random.randint(10,100)))
	cookie.append('Cookie: ' + buildnormal(random.randint(1000,3000)) + '=' + buildnormal(random.randint(1000,3000)))
	cookie.append('Cookie: ' + builderror(random.randint(10,100)) + '=' + builderror(random.randint(10,100)))
	cookie.append('Cookie: ' + builderror(random.randint(1000,3000)) + '=' + builderror(random.randint(1000,3000)))
	
	cookie.append('Cookie: ' + buildnormal(random.randint(10,100)))
	cookie.append('Cookie: ' + buildnormal(random.randint(1000,3000)))
	cookie.append('Cookie: ' + builderror(random.randint(10,100)))
	cookie.append('Cookie: ' + builderror(random.randint(1000,3000)))
	
	cookie.append('Cookie: ' + '=' + buildnormal(random.randint(10,100)))
	cookie.append('Cookie: ' + '=' + buildnormal(random.randint(1000,3000)))
	cookie.append('Cookie: ' + '=' + builderror(random.randint(10,100)))
	cookie.append('Cookie: ' + '=' + builderror(random.randint(1000,3000)))
	
	cookie.append('Cookie: ' + buildnormal(random.randint(10,100)) + '=')
	cookie.append('Cookie: ' + buildnormal(random.randint(1000,3000)) + '=')
	cookie.append('Cookie: ' + builderror(random.randint(10,100)) + '=')
	cookie.append('Cookie: ' + builderror(random.randint(1000,3000)) + '=')
	
	#content_lenght
	content_lenght.append('')
	
	content_lenght.append('Content-Lenght: ' + str(body_lenght) + '\r\n')
	
	content_lenght.append('Content-Lenght: ' + str(body_lenght) + '\r\n\r\n')
	content_lenght.append('Content-Lenght: ' + str(body_lenght) + '\r\n\r\n\r\n')
	
	content_lenght.append('Content-Lenght: ' + buildnormal(random.randint(10,100)) + '\r\n')
	content_lenght.append('Content-Lenght: ' + buildnormal(random.randint(1000,3000)) + '\r\n')
	content_lenght.append('Content-Lenght: ' + builderror(random.randint(10,100)) + '\r\n')
	content_lenght.append('Content-Lenght: ' + builderror(random.randint(1000,3000)) + '\r\n')
	
	content_lenght.append('Content-Lenght: ' + str(body_lenght))
	content_lenght.append('Content-Lenght: ' + buildnormal(random.randint(10,100)))
	content_lenght.append('Content-Lenght: ' + buildnormal(random.randint(1000,3000)))
	content_lenght.append('Content-Lenght: ' + builderror(random.randint(10,100)))
	content_lenght.append('Content-Lenght: ' + builderror(random.randint(1000,3000)))
	
	#body
	body.append('')
	body.append(buildnormal(10) + '=' + buildnormal(body_lenght-11))
	body.append(builderror(10) + '=' + builderror(body_lenght-11))
	
	body.append(buildnormal(random.randint(10,100)) + '=' + buildnormal(random.randint(10,100)))
	body.append(buildnormal(random.randint(1000,3000)) + '=' + buildnormal(random.randint(1000,3000)))
	body.append(builderror(random.randint(10,100)) + '=' + builderror(random.randint(10,100)))
	body.append(builderror(random.randint(1000,3000)) + '=' + builderror(random.randint(1000,3000)))
	
	body.append(buildnormal(random.randint(10,100)))
	body.append(buildnormal(random.randint(1000,3000)))
	body.append(builderror(random.randint(10,100)))
	body.append(builderror(random.randint(1000,3000)))
	
	body.append(buildnormal(random.randint(10,100)) + '=')
	body.append(buildnormal(random.randint(1000,3000)) + '=')
	body.append(builderror(random.randint(10,100)) + '=')
	body.append(builderror(random.randint(1000,3000)) + '=')
	
	body.append('=' + buildnormal(random.randint(10,100)))
	body.append('=' + buildnormal(random.randint(1000,3000)))
	body.append('=' + builderror(random.randint(10,100)))
	body.append('=' + builderror(random.randint(1000,3000)))
	
	
def fuzz(file, p_method, p_url):
	global method
	global uri
	global querystring
	global headers
	global cookie
	global content_lenght
	global body
	global error_create_socket
	global error_request
	out_str = ''
	
	for k in range(len(querystring)):
		for kk in range(len(headers)):
			for kkk in range(len(cookie)):
				for kkkk in range(len(content_lenght)):
					try:
						fuzzSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
						fuzzSocket.connect((remoteAddress, remotePort))
					except socket.error:
						error_create_socket = error_create_socket + 1
						#print 'create socket error\n'
						#sys.exit(1)
						continue
					
					for kkkkk in range(len(body)):
						out_str = method[p_method] + ' ' + uri[p_url] + querystring[k] + ' ' + 'HTTP/1.1\r\n' + headers[kk] + cookie[kkk] + content_lenght[kkkk] + '\r\n\r\n' + body[kkkkk]
						try:
							for i in range(1):
								fuzzSocket.send(out_str)
								inc_counter()
						except socket.error:
							#Handle error
							error_request = error_request + 1
							#print 'send socket error\n'
							#print 'STIMULUS <', out_str, '>'
							#sys.exit(1)
							continue
					fuzzSocket.close()
						
# monitors http threads and counts requests
def MonitorThread():
	previous=request_counter
	while 1:
		if (previous+100<request_counter) & (previous<>request_counter):
			rate = float(request_counter) / float(total_request)
			rate_num = rate*100
			print "\r%f%%\t%d Requests Sent. Error request: %d Error create socket: %d" % (rate_num,request_counter, error_request, error_create_socket),
			time.sleep(0.002)
			previous=request_counter
		if (request_counter == total_request):
			print "\n[--- DAN Fuzzing Finished ---]"
			break

			
remoteAddress, remotePort = parseCommandLine()
bulidlist()
total_request = len(method)*len(uri)*len(querystring)*len(headers)*len(cookie)*len(content_lenght)*len(body)
print "[--- DAN Fuzzing Started ---]"
print 'Total Requests : %d' % total_request
for k in range(len(method)):
	for kk in range(len(uri)):
			thread.start_new_thread(fuzz, (str(k)+'_'+str(kk)+'.txt', k, kk))
thread.start_new_thread(MonitorThread, ())
time.sleep(1000000)
