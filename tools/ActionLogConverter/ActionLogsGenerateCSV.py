# coding: utf-8
#!/usr/bin/env python

from __future__ import print_function
import sys
import getopt

flag=False
dateFlag=True
userIDFlag=False
dateSplitFound=False
quoted_string=[]
sepchar=';'
outputName='output.csv'
inputName=''

#for line in sys.stdin:

lines = []

def main():

# get parameters
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hio:v", ["help", "input=","output="])
    except getopt.GetoptError, err: 
        print('Error: ' + err )
        sys.exit(2)

    outputName='output.csv'

    for o, a in opts:
        if o in ("-i", "--input"):
            print('--------->' + a + ' - ' + o )
            inputName = a
        elif o in ("-o", "--output"):
            print('--------->' + a + ' - ' + o )
            outputName = a
        elif o in ("-h", "--help"):
            print("Options:")
            print("-h, help: display this information")
            print("-i, input: source file(log)")
            print("-o, output: destination file(csv)")
            sys.exit(2)

# open file to write
    rfile = open(outputName, 'w') 

# read log file
    with open(inputName) as f:
        lines = f.readlines()

	print("File readed " +  str( len( lines ) ) + " of text" )

    #lines = sys.stdin.readlines()
# parsee all lines
    for i in range(len(lines)):
        line = lines[ i ]
        num = 0
        #print("-> " + line )
        if line.find('launch') < 1:
            continue
    
        #fpos = line.find('UserSessionID')
        #if fpos > 0:
        #    fpos = fpos + 15
        #    print( "usersessionid " + str(fpos) + line[ fpos:fpos+32 ] + " END", end='' )
        #print( "-----> " + line + " <----")
        flag = False
        dateFlag=True
        dateSplitFound=False
        userIDFlag=False
        #for char in line.strip():
        quoted_string = []

        for z in range(len(line)):
            char = line[ z ]
            if dateFlag == True:

# get date string
               if char == ':' and dateSplitFound == False:
                   quoted_string.append(sepchar)
                   dateSplitFound=True
               elif char != ',':
                   quoted_string.append(char)
               if char == ',':
                   quoted_string.append(';')
                   dateFlag = False
                   print( "".join( quoted_string ), end='' )
                   rfile.write( "".join( quoted_string ) )
                   quoted_string = []
                   userIDFlag=True
                   continue

# get userID string
            if userIDFlag == True:
               if char == ':':
                   quoted_string.append(sepchar)
               elif char != ',':
                   quoted_string.append(char)
               if char == ',':
                   quoted_string.append(';')
                   print( "".join( quoted_string ), end='' )
                   rfile.write( "".join( quoted_string ) )
                   quoted_string = []
                   userIDFlag=False
               continue

# get parameters from url
            if (char == '=' or char == '&'):
               if flag:
                  flag=False
                  if quoted_string:
                      if num != 0:
                         print( sepchar, end='')
                         rfile.write(sepchar)
                      print( "".join( quoted_string ), end='' )
                      rfile.write( "".join( quoted_string ) )
                      quoted_string=[]
                  num = num + 1
                  #print("-> " + str( num ) )
               else:
                   flag=True
                   continue 
            if flag and dateSplitFound == True:
               quoted_string.append(char)
        print('\n')
        rfile.write('\n')
    rfile.close()

if __name__ == "__main__":
    main()
