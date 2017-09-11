/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/


#include "protocol_webdav.h"
#include <core/functions.h>
#include <util/buffered_string.h>
#include <system/json/json.h>
#include <system/json/json_converter.h>
#include <system/json/structures/friend.h>
#include <db/sqllib.h>
#include <system/auth/authmodule.h>
#include <system/fsys/device_handling.h>
#include <openssl/md5.h>
#include <util/md5.h>
#include <network/digcalc.h>

extern SystemBase *SLIB;

//
//
//

void PrintNode( xmlNode *root )
{
	xmlNode *n = NULL;
	
	for( n = root ; n ; n = n->next )
	{
		if( n->type == XML_ELEMENT_NODE )
		{
			DEBUG("[PrintNode] node type: Element, name %s\n", n->name );
		}
		
		PrintNode( n->children );
	}
}

#define WEBDAV_SHARE_PATH "/webdav/devices/"
#define WEBDAV_SHARE_PATH_LEN 16

//
// convert json
//

int ConvertToWebdav( char *url,  BufString *dbs, BufString *sbs, FBOOL *directory, FBOOL info )
{
	int i = 0;
	
	FriendFile *ffroot = NULL, *ff = NULL;
	
	DEBUG("[ConvertToWebdav] Convert to WEBDAV '%s'\n", &(sbs->bs_Buffer[17]));
	
	if( strcmp( "[]",  &(sbs->bs_Buffer[17])) == 0 )
	{
		char buf[ 2048 ];
		//sprintf( buf, "<D:response>\n\t\t<D:href>http://localhost:6502%s</D:href>\n<D:propstat>\n</D:prop></D:propstat></D:response>\n", url );
		//BufStringAdd( dbs, buf );
		return 0;
	}
	
	// [17] -> skip <!--ok --->
	if( ( ffroot = GetStructureFromJSON( FriendFileDesc, &(sbs->bs_Buffer[17]) ) ) != NULL )
	{
		//INFO("Data converted to C structure\n");
		FriendFile *lf = ffroot;
		
		//INFO("\n\nfirsobj %x next %x\n", ffroot, ffroot->node.mln_Succ );
		
		while( lf != NULL )
		//LIST_FOR_EACH( ffroot, lf )
		{
			char buf[ 2048 ];

			
			/* works change urls
			if( url[ strlen( url )-1 ] == '/' )
			{
				sprintf( buf, "<D:response>\n\t\t<D:href>http://localhost:6502%s%s</D:href>\n<D:propstat>\n<D:prop xmlns:R=\"http://localhost:6502%s%s\">\n", url, lf->ff_Filename, url, lf->ff_Filename );
			}else{
				sprintf( buf, "<D:response>\n\t\t<D:href>http://localhost:6502%s/%s</D:href>\n<D:propstat>\n<D:prop xmlns:R=\"http://localhost:6502%s/%s\">\n", url, lf->ff_Filename, url, lf->ff_Filename );
			}
			*/
			
			if( info == TRUE )
			{
				sprintf( buf, "<D:response>\n\t\t<D:href>http://localhost:6502%s</D:href>\n<D:propstat>\n<D:prop>\n", url );
			}
			else
			{
				if( url[ strlen( url )-1 ] == '/' )
				{
					sprintf( buf, "<D:response>\n\t\t<D:href>http://localhost:6502%s%s</D:href>\n<D:propstat>\n<D:prop>\n", url, lf->ff_Filename );
				}else{
					sprintf( buf, "<D:response>\n\t\t<D:href>http://localhost:6502%s/%s</D:href>\n<D:propstat>\n<D:prop>\n", url, lf->ff_Filename );
				}
			}
			
			/*
			if( url[ strlen( url )-1 ] == '/' )
			{
				sprintf( buf, "<D:response>\n\t\t<D:href>%s%s</D:href>\n", url, lf->ff_Filename );
			}else{
				sprintf( buf, "<D:response>\n\t\t<D:href>%s/%s</D:href>\n", url, lf->ff_Filename );
			}*/
			DEBUG("[HandleWebDav] url %s       filename %s\n",  url, lf->ff_Filename );
			//sprintf( buf, "<D:response>\n<D:href>%s</D:href>\n", url );
			BufStringAdd( dbs, buf );
			
			/*
			sprintf( buf, "<D:propstat>\n\t\t<D:prop xmlns:R=\"%s\">\n", url );
//			sprintf( buf, "<D:propstat>\n<D:prop xmlns:R=\"%s/%s\">\n", url, lf->ff_Filename );
			BufStringAdd( dbs, buf );
			*/
			BufStringAdd( dbs, "           \
<bigbox>\n \
<BoxType>Box type A</BoxType>\n \
</bigbox>\n \
<author>\n \
<Name>Hadrian</Name>\n \
</author>\n \
<D:creationdate>1997-12-01T17:42:21-08:00\n</D:creationdate>\n" );

			if( lf->ff_Filename[ 0 ] != 0 )
			{
				sprintf( buf, "<D:displayname>%s</D:displayname>\n", lf->ff_Filename );
				BufStringAdd( dbs, buf );
			}
                   
			if( lf->ff_Type != NULL && lf->ff_Type[ 0 ] == 'D' )
			{
				BufStringAdd( dbs, "\t<D:resourcetype><D:collection/></D:resourcetype>\n");
				*directory = TRUE;
			}
			else
			{
				*directory = FALSE;
			}
			
			sprintf( buf, "<D:getcontentlength>%lld</D:getcontentlength>\n", lf->ff_Size );
			BufStringAdd( dbs, buf );
			
			BufStringAdd( dbs, \
"<D:supportedlock>\n \
<D:lockentry>\n \
<D:lockscope><D:exclusive/></D:lockscope>\n \
<D:locktype><D:write/></D:locktype>\n \
</D:lockentry>\n \
<D:lockentry>\n \
<D:lockscope><D:shared/></D:lockscope>\n \
<D:locktype><D:write/></D:locktype>\n \
</D:lockentry>\n \
</D:supportedlock>\n \
</D:prop>\n \
<D:status>HTTP/1.1 200 OK</D:status>\n \
</D:propstat>\n </D:response> " );

			FriendFile *rfile = lf;
			lf = (FriendFile *)lf->node.mln_Succ;
			
			if( rfile != NULL )
			{
				if( rfile->ff_Filename ) FFree( rfile->ff_Filename );
				if( rfile->ff_MetaType ) FFree( rfile->ff_MetaType );
				if( rfile->ff_Path ) FFree( rfile->ff_Path );
				if( rfile->ff_Type ) FFree( rfile->ff_Type );
				FFree( rfile );
			}
		}
	}
	else
	{
		FERROR("Cannot convert from JSON\n");
	}
	
	//INFO("OUTPUT FROM WEBDAVCONV %s\n", dbs->bs_Buffer );
	
	return 0;
}

//
//
//

enum
{
	ERROR_DEFAULT = 1,
	ERROR_FILE_DO_NOT_EXIST
};

//
// return file error
// 

BufString *ReturnFileError( char *url, int err )
{
	BufString *bs = BufStringNew();
	int i = 0;
	char buf[ 1024 ];
	
	sprintf( buf, "<D:response>\n\t\t<D:href>http://localhost:6502%s</D:href>\n<D:propstat>\n<D:prop>\n</D:prop>\n \
<D:status>", url );

	BufStringAdd( bs, buf );
	
	switch( err )
	{
		case ERROR_FILE_DO_NOT_EXIST:
			BufStringAdd( bs,"HTTP/1.1 404 Not Found" );
			//BufStringAdd( bs, "HTTP/1.1 200 OK" );
		break;
		default:
			BufStringAdd( bs,"HTTP/1.1 404 Not Found" );
		break;
	}
	
	BufStringAdd( bs, "</D:status>\n</D:propstat>\n </D:response> " );

	return bs;
}

/*
 * WEBDAV get file
 * 
 * (network/http.c:67) HTTP_NEW SOCKET SET 0x7f1dfc0d61c0
  (network/protocol_http.c:93) HTTP Callback called
  (network/http.c:704) 
INCOMING!-----

GET /webdav/devices/jacek/stefkoshome/container/wallhaven-242057.png HTTP/1.1
User-Agent: WinSCP/5.7.6 neon/0.30.1
Connection: TE
TE: trailers
Host: friend:6502
Translate: f

|Has come in.....
  (network/http.c:776) NO MORE DATA
  (network/protocol_http.c:254) Want to parse path: /webdav/devices/jacek/stefkoshome/container/wallhaven-242057.png (64)
  (network/protocol_http.c:272) We got through. webdav
  (network/file.c:50) Cannot open file resources//webdav/devices/jacek/stefkoshome/container/wallhaven-242057.png (file does not exist?)..
  (network/protocol_http.c:402) [ProtocolHttp] Going ahead with webdav.
  (network/protocol_http.c:408) [ProtocolHttp] Executing php "php/catch_all.php" "/webdav/devices/jacek/stefkoshome/container/wallhaven-242057.png";
  (network/http.c:67) HTTP_NEW SOCKET SET 0x7f1dfc0d61c0
  (network/http.c:93) Added text/html
  (network/http.c:93) Added close
  (network/protocol_http.c:454) free requests

 */

// path
//  SHARE_PATH / USER / DEVNAME / PATH



int isError( char *val )
{
	unsigned int i;
	char *tval = val;
	
	INFO("CHECKERROR---------------------------------------%s\n", val );
	
	//{ "response": "File or directory do not exist"}
	
	for( i=0 ; i < strlen( val ) ; i++ )
	{
		if( strncmp( "Error", tval++, 5 ) == 0 )
		{
			FERROR("WEBDAV: response contain error word   +15: %s\n", tval+15 );
			
			if( strcmp( "File or directory do not exist", tval+15 ) == 0 )
			{
				return ERROR_FILE_DO_NOT_EXIST;
			}
			
			return ERROR_DEFAULT;
		}
	}
	return 0;
}

//#define DISABLE_WEBDAV
//#define AUTH_DIGEST
//#define AUTH_BASIC
//
//
//

Http *HandleWebDav( Http *req, char *data, int len )
{
	Http *resp = NULL;
	char *path = NULL;
	char *fpath = NULL;
	//FBOOL pathDir = FALSE;
	char *auth = NULL;
	char *module = NULL;
	
	LIBXML_TEST_VERSION
	/*
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
		{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{TAG_DONE, TAG_DONE}
	};
	*/
	
	DEBUG("[HandleWebDav] WEBDAV OPERATION-----------------------------------------------------------------------------------\n");

#ifndef DISABLE_WEBDAV
/*	
	HashmapElement *he = HttpGetPOSTParameter( req, "module" );
	if( he == NULL ) he = HashmapGet( req->query, "module" );
	if( he != NULL )
	{
		module = (char *)he->data;
	}*/

	if( strncmp( req->rawRequestPath, WEBDAV_SHARE_PATH, WEBDAV_SHARE_PATH_LEN ) != 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_400_BAD_REQUEST,  tags );
		FERROR("WEBDAV Call is not proper\n");
		
		HttpAddTextContent( resp, "ok<!--separate-->{ \"response\":\"device name or sessionid is empty\"}" );

		return resp;
	}


	User *usr = SLIB->sl_UM->um_Users;
	//User *foundUsr = NULL;
	File *rootDev = NULL;
	char *devname = NULL;
	char *filePath = NULL;
	char *userName = NULL;
	char *userPassword = NULL;
	char *decodedUser = NULL;
	
	int pathSize = strlen( req->rawRequestPath );
	/*
	if( req->rawRequestPath[ pathSize-1 ] == '/' )
	{
		pathDir = TRUE;
	}*/
	
	//path = FCalloc( pathSize+10, sizeof(char) );
	//memcpy( path, req->rawRequestPath, pathSize );
	path = UrlDecodeToMem( req->rawRequestPath );
	
	fpath = FCalloc( pathSize+10, sizeof(char) );
	memcpy( fpath, req->rawRequestPath, pathSize );
	
	int i;
	int pos = 0;
	
	// get devicename and path from URL
	
	for( i = WEBDAV_SHARE_PATH_LEN-1 ; i < pathSize ; i++ )
	{
		if( path[ i ] =='/' )
		{
			/*
			if( pos == 0 )	//USER
			{
				userName = &(path[ i+1 ]);
				FERROR("userName %s\n", userName );
			}
			else
			*/
			if( pos == 0 )
			{
				path[ i ] = 0;
				devname = &(path[ i+1 ]);
				FERROR("devname %s\n", devname );
			}
			/*
			else if( pos == 2 )
			{
					// skip container word
				path[ i ] = 0;
			}
			*/
			else					//
			{
				//PROPFIND /webdav/devices/jacek/stefkoshome/container/Programs/ HTTP/1.1
				path[ i ] = 0;
				filePath =&(path[ i+1 ]);
				INFO("FROM SERVER DEBPATH %s\n", filePath );
				break;
			}

			pos++;
		}
	}

	auth = HttpGetHeader( req, "authorization", 0 );

#ifdef AUTH_BASIC
	
	if( auth == NULL )
	{
		struct TagItem tagsauth[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicate( "Basic realm=\"FriendUp\"" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		//#define HTTP_401_UNAUTHORIZED 
		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		FERROR("WEBDAV Call is not proper\n");
		
		HttpAddTextContent( resp, "ok<!--separate-->{ \"response\":\"device name or sessionid is empty\"}" );
		
		if( path != NULL )FFree( path );
		if( fpath != NULL )FFree( fpath );
		return resp;
	}

	int decodedUserLen;
	decodedUser = Base64Decode( (const unsigned char *)&(auth[ 6 ]), strlen( &(auth[ 6 ]) ), &decodedUserLen );

	userName = decodedUser;
	for( i=0 ; i < (int)strlen( decodedUser ) ; i++ )
	{
		if( decodedUser[ i ] == ':' )
		{
			decodedUser[ i ] = 0;
			userPassword = &(decodedUser[ i+1 ] );
			break;
		}
	}

#else // (AUTH_DIGEST)
	/*
	 * WWW-Authenticate: Digest realm="Members only", 
	nonce="LHOKe1l2BAA=5c373ae0d933a0bb6321125a56a2fcdb6fd7c93b", algorithm=MD5, qop="auth"
	 */
	
	

	if( auth == NULL )
	{
		char *Host = HttpGetHeader( req, "Host", 0 );
		
		struct TagItem tagsauth[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicate( "Digest realm=\"jacek@192.168.153.129\", nonce=\"dcd98b7102dd2f0e8b11d0f600bfb0c093\", opaque=\"5ccc069c403ebaf9f0171e9517f40e41\", algorithm=\"MD5\", qop=\"auth,auth-int\"" ) },
			{TAG_DONE, TAG_DONE}
		};
		//qop="auth,auth-int",
        //         nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
        //         opaque="5ccc069c403ebaf9f0171e9517f40e41"
		
		//#define HTTP_401_UNAUTHORIZED 
		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		FERROR("WEBDAV Call is not proper\n");
		
		HttpAddTextContent( resp, "ok<!--separate-->{ \"response\":\"device name or sessionid is empty\"}" );

		if( path != NULL )FFree( path );
		if( fpath != NULL )FFree( fpath );
		return resp;
	}
	
	/*
	 * first reponse
	 * 
	 * Authorization: Digest username="jacek", realm="FriendUp", nonce="LHOKe1l2BAA=5c373ae0d933a0bb6321125a56a2fcdb6fd7c93b", uri="/webdav/devices/Home/", response="1d5633867a4c458db104f94323b83a7b", algorithm="MD5", cnonce="e80f1973decd27977249b0887ef564da", nc=00000001, qop="auth"

	 MD5(MD5(<password> + ":" + <nouce> + ":" + MD5(<method> + ";" + <uri>)
	 */
	
	char *amethod = NULL;
	char *arealm = NULL;
	char *anonce = NULL, *acnonce = NULL;
	char *auri = NULL;
	char *aresponse = NULL;
	char *aalgo = NULL;
	char *aqop = NULL;
	char *anc = NULL;
	char *lauth = auth;
	int authlen = strlen( auth );
	
	List *l = HttpGetHeaderList( req, "authorization" );
	
	do
	{
		
		char *data = (char *) l->data;
		
		if( strncmp( data, "Digest", 6 ) == 0 )  // Digest
		{
			//INFO("FROM SERVER name\n");
			while( TRUE )
			{
				if( strncmp( data, "username", 8 ) == 0 )
				{
					data += 2 + 8;		//  skip   =" and username
					userName = data;
				}
				
				if( *data == 0 ) break;
				data++;
			}
			
		}else if( strncmp( data, "realm", 5 ) == 0 )
		{
			data += 2 + 5;		//  skip   =" and username
			arealm = data;
			
		}else if( strncmp( data, "nonce", 5 ) == 0 )
		{
			data += 2 + 5;		//  skip   =" and username
			anonce = data;
		}else if( strncmp( data, "uri", 3 ) == 0 )
		{
			data += 2 + 3;		//  skip   =" and username
			auri = data;
		}else if( strncmp( data, "response", 8 ) == 0 )
		{
			data += 2 + 8;		//  skip   =" and username
			aresponse = data;
		}else if( strncmp( data, "algorithm", 9 ) == 0 )
		{
			data += 2 + 9;		//  skip   =" and username
			aalgo = data;
			//INFO("FROM SERVER algorithm %s\n", aalgo );
		}else if( strncmp( data, "cnonce", 6 ) == 0 )
		{
			data += 2 + 6;		//  skip   =" and username
			acnonce = data;

			//INFO("FROM SERVER cnonce %s\n", acnonce );
		}else if( strncmp( data, "qop", 3 ) == 0 )
		{
			data += 2 + 3;		//  skip   =" and username
			aqop = data;
			//INFO("FROM SERVER qop %s\n", aqop );
		}else if( strncmp( data, "nc", 2 ) == 0 )
		{
			data += 1 + 2;		//  skip   =" and username
			anc = data;
			//INFO("FROM SERVER anc %s\n", anc );
		}
		
	}while( ( l = l->next ) != NULL );
	
	//printf("FROM SERVER ------------------------------> username %s, realm %s, nonce %s, uri %s, response %s, algo %s conce %s quop %s nc %s\n", userName, arealm, anonce, auri, aresponse, aalgo, acnonce, aqop, anc );
	
// jacek 6db041ae192a4d193db9fdaf44db7a68
// placek 227ffb2a9cd6d36d63096f45afeb09a3
	
	//char tmp[ 512 ], tmp1[ 512 ], tmp2[ 512 ], tmp3[ 512 ];
	/*
//	MD5(MD5(<password> + ":" + <nouce> + ":" + MD5(<method> + ";" + <uri>)
	
	sprintf( tmp, "%s;%s", amethod, auri );
	StrToMD5Str( tmp1, 512, tmp, strlen( tmp ) );
	
	sprintf( tmp2, "%s:%s:%s", "placek", anonce, tmp1 );
	StrToMD5Str( tmp, 512, tmp2, strlen( tmp2 ) );
	
	//HA1 = MD5(username:realm:password)
	
	DEBUG("================================================================%s\n", tmp );
	
	sprintf( tmp2, "%s:%s:%s", userName, arealm, "placek" );
	StrToMD5Str( tmp, 512, tmp2, strlen( tmp2 ) );
	DEBUG("================================================================%s\n", tmp );
	*/
	/*
	 * ```php A1 = md5(username:realm:password) A2 = md5(request-method:uri) // request method = GET, POST, etc. Hash = md5(A1:nonce:nc:cnonce:qop:A2) if (Hash == response) //success! else //failure! ```
	 */
	
	//FERROR("================================================================\n");
	//sprintf( tmp, "%s:%s:%s", userName, arealm, "placek" );
	//FERROR("RESPONSE A1 : '%s'\n", tmp );
	//StrToMD5Str( tmp1, 512, tmp, strlen( tmp ) );
	
//	sprintf( tmp, "%s:%s", "POST", auri );
	//sprintf( tmp, "%s:%s", req->method, auri );
	//FERROR("RESPONSE A2 : '%s'\n", tmp );
	//StrToMD5Str( tmp2, 512, tmp, strlen( tmp ) );
	
	/*
	 * ------------------->H(A1) 92d1e89041a1b25d3dbe87f45da75d4c
------------>auth: H(A2): 0eca5691e513d4406e7d1607f28829a0
H1 92d1e89041a1b25d3dbe87f45da75d4c
: NONCE dcd98b7102dd2f0e8b11d0f600bfb0c093
: NCVAL 00000001
: sess->cnonce 718d2e9fb96cbd0932d70461f552425e
: qop_value auth
 :rdig_md5_ascii  0eca5691e513d4406e7d1607f28829a0
 ---->rdig �<
start 
b989d99b20a13a797be7611d2b574ba5-----end



 (network/protocol_webdav.c:578) ================================================================
  (network/protocol_webdav.c:580) RESPONSE A1 : 'jacek:jacek@192.168.153.129:placek'
  (network/protocol_webdav.c:585) RESPONSE A2 : 'OPTIONS:/webdav/devices/Home/'
  (network/protocol_webdav.c:592) RESPONSE EXTRA : '92d1e89041a1b25d3dbe87f45da75d4c:dcd98b7102dd2f0e8b11d0f600bfb0c093:0000001:67ceca72bf15e101f555ddacb1100746:auth:0eca5691e513d4406e7d1607f28829a0'
  (network/protocol_webdav.c:595) 

 HASHED DATA 5ac4f3b760c3a80c2e8341ad7f231e45

  (network/protocol_webdav.c:613) RESPONSE Response = 5ac4f3b760c3a80c2e8341ad7f231e45
  (network/protocol_webdav.c:615) ================================================================5ac4f3b760c3a80c2e8341ad7f231e45

	 */
	
	//00000001:4d060c48caa3dd86874c70d9b1340ab8:auth
	//printf("nc_value:  %s:%s:%s\n", nc_value, sess->cnonce, qop_value);
	//sprintf( tmp, "%s:%s:%s:%s:%s", tmp1, anc, acnonce, aqop, tmp2 );
	//sprintf( tmp, "%s:%s:%s:%s:%s:%s", tmp1, anonce, anc, acnonce, aqop, tmp2 );
	//FERROR("RESPONSE EXTRA : '%s'\n", tmp );
	//StrToMD5Str( tmp3, 512, tmp, strlen( tmp ) );
	
	//FERROR("\n\n HASHED DATA %s\n\n", tmp3 );
	
	/*
	char * pszNonce = "dcd98b7102dd2f0e8b11d0f600bfb0c093";
	char * pszCNonce = "0a4f113b";
	char * pszUser = "Mufasa";
	char * pszRealm = "testrealm@host.com";
	char * pszPass = "Circle Of Life";
	char * pszAlg = "md5";
	char szNonceCount[9] = "00000001";
	char * pszMethod = "GET";
	char * pszQop = "auth";
	char * pszURI = "/dir/index.html";
	*/
	HASHHEX HA1;
	HASHHEX HA2 = "";
	HASHHEX Response;

	DigestCalcHA1( aalgo, "jacek", arealm, "placek", anonce,acnonce, HA1);
	DigestCalcResponse( HA1, anonce, anc, acnonce, aqop,  req->method, auri, HA2, Response);
	
#endif
	

	// we must split path, to have access to device name, user name
	
	
	//printf("-------->%s PATH\n", req->rawRequestPath );
	//printf("USER %s DEVNAME %s PATH %s\n", user, devname, filePath );
	
	// trying to find logged user to check his devices
	
	AuthMod *ulib = SLIB->AuthModuleGet( SLIB );

	LIST_FOR_EACH( SLIB->sl_UM->um_Users, usr, User * )
	{
		if( strcmp( userName, usr->u_Name ) == 0 )
		{
			break;
		}
	}
	
	//SLIB->LibraryUserDrop( SLIB, ulib );
	
	// user not logged in, we must add it to session
	// and mount shared device
	
	if( usr == NULL )
	{
		FERROR("User '%s' not found\n", userName );
		// SQL is used to mount  device!
		SQLLibrary *sqll = SLIB->LibrarySQLGet( SLIB );
		
		usr = UMUserGetByNameDB( SLIB->sl_UM,userName );
		
		if( usr != NULL )
		{
			LIST_ADD_HEAD( SLIB->sl_UM->um_Users, usr );
			
			SLIB->UserDeviceMount( SLIB, sqll, usr, 0 );
		}
		else
		{
			SLIB->AuthModuleDrop( SLIB, ulib );
			SLIB->LibrarySQLDrop( SLIB, sqll );
			
			HttpAddTextContent( resp, "ok<!--separate-->{\"response\":\"cannot find or load user\"}" );

			FFree( path );
			FFree( fpath );
			if( decodedUser != NULL ){ free( decodedUser ); }
			
			return resp;
		}
		
		SLIB->AuthModuleDrop( SLIB, ulib );
		SLIB->LibrarySQLDrop( SLIB, sqll );
	}
	
	if( usr == NULL )
	{
		FERROR("Cannot find user\n");
		//if( decodedUser != NULL ){ free( decodedUser ); }
	}
	
	//printf("<<<<<<<<<<<<%s    vs %p  %s\n", usr->u_Name, userPassword, userPassword );
	
#ifdef AUTH_BASIC
	
	{
		if( ( ulib->CheckPassword( ulib, usr, userPassword ) ) == FALSE )
		{
			struct TagItem tagsauth[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
				{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicate( "Basic realm=\"FriendUp\"" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			//#define HTTP_401_UNAUTHORIZED 
			resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
			FERROR("WEBDAV Call is not proper\n");
		
			HttpAddTextContent( resp, "ok<!--separate-->{\"response\":\"user or password is wrong\"}" );
		
			if( decodedUser != NULL ){ free( decodedUser ); }
			FFree( path );
			FFree( fpath );
			return resp;
		}
	}
#else		// AUTH DIGEST
	{
		if( strcmp( aresponse, Response ) != 0 )
		{
			resp = HttpNewSimpleANOREQ(  HTTP_403_FORBIDDEN, HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ), TAG_DONE );
		
			if( decodedUser != NULL ){ free( decodedUser ); }
			FFree( path );
			FFree( fpath );
			return resp;
		}
	}
#endif
	
	if( decodedUser != NULL ){ free( decodedUser ); }
	
	// we should use flag or u_WebDAVDevs
	
	LIST_FOR_EACH( usr->u_MountedDevs, rootDev, File * )
	{
		if(  strcmp(rootDev->f_Name, devname ) == 0 )
		{
			INFO("Device for sharing found: %s\n", devname );
			break;
		}
	}
	
	if( rootDev == NULL )
	{
		FERROR("Device %s is not mounted\n", devname );
		return resp;
	}
	
	BufString *strResp = BufStringNew();
	
	//HttpAddTextContent( resp, "ok<!--separate-->{ \"response\": \"Device name or sessionID are empty\"}" );
	
	INFO("Webdav devicename %s path %s\n", devname, filePath );
	
	if( strcmp( req->method, "GET" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		File *fp = (File *)actFS->FileOpen( rootDev, filePath, "rb" );
		{
#define FS_READ_BUFFER 4096
			
			BufString *bs = BufStringNewSize( 20024 );
			char dataBuffer[ FS_READ_BUFFER ];
			int dataread = 0;
			
			while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
			{
				BufStringAddSize( bs, dataBuffer, dataread );
			}
			
			resp->content = bs->bs_Buffer;
			resp->sizeOfContent = bs->bs_Size;
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
			
			actFS->FileClose( rootDev, fp );
		}
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "PUT" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		INFO("\n\n\nCONTENTSIZE %lld\n\n", req->sizeOfContent );
		
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		File *fp = (File *)actFS->FileOpen( rootDev, filePath, "wb" );
		{
			int writelen = actFS->FileWrite( fp, req->content, req->sizeOfContent );
			INFO("File written %s size %d\n", filePath, writelen );
			
			actFS->FileClose( rootDev, fp );
		}
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "MKCOL" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		INFO("\n\n\nCONTENTSIZE %lld\n\n", req->sizeOfContent );
		
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		actFS->MakeDir( rootDev, filePath );
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "DELETE" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		INFO("\n\n\nCONTENTSIZE %lld\n\n", req->sizeOfContent );
		
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		actFS->Delete( rootDev, filePath );
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "COPY" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		INFO("\n\n\nCONTENTSIZE %lld\n\n", req->sizeOfContent );
		
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		actFS->Delete( rootDev, filePath );
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "OPTIONS" ) == 0 )
	{
		struct TagItem ltags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{	HTTP_HEADER_ACCEPT_RANGES, (FULONG)StringDuplicate( "none") },
//			{	HTTP_HEADER_ALLOW, (FULONG)StringDuplicate( "GET, POST, OPTIONS, PUT, PROPFIND" ) },
			{	HTTP_HEADER_ALLOW, (FULONG)StringDuplicate( "GET, POST, OPTIONS, HEAD, MKCOL, PUT, PROPFIND, PROPPATCH, DELETE, MOVE, COPY, GETLIB, LOCK, UNLOCK" ) },
			{	HTTP_HEADER_CACHE_CONTROL, (FULONG)StringDuplicate( "private") },
			{	HTTP_HEADER_DAV, (FULONG)StringDuplicate( "1, 2") },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_200_OK,  ltags );
		HttpAddTextContent( resp, " " );
		BufStringDelete( strResp );
		
		FFree( path );
		FFree( fpath );
		return resp;
	}
	/*
	HANDLE OPTIONS
	
	OPTIONS /webdav/devices/m0ns00n/Storage HTTP/1.1
Host: localhost:6502
Accept-Encoding: gzip, deflate
User-Agent: gvfs/1.20.3
Accept-Language: en-us, en;q=0.9
Connection: Keep-Alive

|Has come in.....
  (network/http.c:776) NO MORE DATA
  (network/protocol_http.c:178) Want to parse path: /webdav/devices/m0ns00n/Storage (31)
  (network/protocol_webdav.c:173) 

---------------------------

---------------------


--------------------
(null)
*/
	
	
	
		
		/*
		 *  (network/http.c:704) 
INCOMING!-----

PUT /webdav/devices/jacek/stefkoshome/container/cv.doc HTTP/1.1
User-Agent: WinSCP/5.7.6 neon/0.30.1
Connection: TE
TE: trailers
Host: friend:6502
Content-Length: 95744

��ࡱ�|Has come in.....
  (network/protocol_webdav.c:174) 

---------------------------

---------------------


--------------------
��ࡱ�
  (network/http.c:93) Added text/xml
  (network/http.c:93) Added close
  (network/protocol_webdav.c:315) Device for sharing found: stefkoshome
  (network/protocol_webdav.c:330) Webdav devicename stefkoshome path cv.doc
request.xml:1: parser error : Start tag expected, '<' not found
��ࡱ�
^
  (network/protocol_webdav.c:475) XMLERROR: Cannot parse XML request

		 */
	
	//
	// Parse WEBDAV XML request
	//
	
	else
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		//HTTP_200_OK
		//resp = HttpNewSimple( HTTP_207_MULTI_STATUS,  tags );
		
		xmlDocPtr doc;
	
		if( ( doc = xmlReadMemory( data, len, "request.xml", NULL, 0 ) )  != NULL )
		{
			xmlNode *root = xmlDocGetRootElement( doc );
			if( root != NULL )
			{
				xmlNode *n = NULL;
		
				for( n = root ; n ; n = n->next )
				{
					xmlNode *pfind = NULL;
				
					if( n->type == XML_ELEMENT_NODE )
					{
					FBOOL directory = FALSE;
						
						DEBUG("[HandleWebDav] node type: Element, name %s\n", n->name );
					
						for( pfind = n->children ; pfind ; pfind = pfind->next )
						{
							// <allprop/>
							DEBUG("[HandleWebDav] node type: Element, name %s\n", pfind->name );
						/*
							if( strcmp( (char *)pfind->name, "allprop" ) == 0  )
							//if( strcmp( (char *)pfind->name, "allprop" ) == 0 || strcmp( (char *)pfind->name, "prop" ) == 0 )
							{
								FHandler *actFS = (FHandler *)rootDev->f_FSys;
								
								DEBUG("WEBDAV is directory %d\n", pathDir );
								
								if( pathDir == TRUE )
								{
									BufString *dirresp = actFS->Dir( rootDev, filePath );
									BufStringAdd( strResp, "<?xml version=\"1.0\" ?> \n <D:multistatus xmlns:D=\"DAV:\">\n" );
							
									if( ConvertToWebdav( fpath, strResp, dirresp, &directory ) == 0 )
									{
										BufStringAdd( strResp, "</D:multistatus>\r\n" );
										//HttpAddTextContent( resp, strResp->bs_Buffer );
										HttpSetContent( resp, strResp->bs_Buffer, strResp->bs_Size );
										strResp->bs_Buffer = NULL;
								
										BufStringDelete( dirresp );
									}
								} // file
								
								else
								{
									BufString *dirresp = actFS->Info( rootDev, filePath );
									if( isError(  &( dirresp->bs_Buffer[ 5 ] )  ) == FALSE )
									//if( strcmp( &( dirresp->bs_Buffer[ 5 ] ), "Error" ) != 0 )	//correct response
									{
										BufStringAdd( strResp, "<?xml version=\"1.0\" ?> \n <D:multistatus xmlns:D=\"DAV:\">\n" );
										
										if( ConvertToWebdav( fpath, strResp, dirresp, &directory ) == 0 )
										{
											BufStringAdd( strResp, "</D:multistatus>\r\n" );
											//HttpAddTextContent( resp, strResp->bs_Buffer );
											HttpSetContent( resp, strResp->bs_Buffer, strResp->bs_Size );
											strResp->bs_Buffer = NULL;
								
											BufStringDelete( dirresp );
										}
									}
									else
									{
										HttpAddTextContent( resp, " " );
										
										BufStringDelete( dirresp );
									}
								}
							}
							else if( strcmp( (char *)pfind->name, "prop" ) == 0 )
								*/
							if( strcmp( (char *)pfind->name, "allprop" ) == 0 || strcmp( (char *)pfind->name, "prop" ) == 0 )
							{
								xmlNode *prop = NULL;
								if( pfind->type == XML_ELEMENT_NODE )
								{
									/*
									 * <?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:"><prop>
<getcontentlength xmlns="DAV:"/>
<getlastmodified xmlns="DAV:"/>
<executable xmlns="http://apache.org/dav/props/"/>
<resourcetype xmlns="DAV:"/>
<checked-in xmlns="DAV:"/>
<checked-out xmlns="DAV:"/>
</prop></propfind>

									 */
									FHandler *actFS = (FHandler *)rootDev->f_FSys;
									BufString *dirresp;
									
									if( filePath == NULL )
									{
										DEBUG("[HandleWebDav] GetINFO path empty\n");
										dirresp = actFS->Info( rootDev, "" );
									}
									else
									{
										DEBUG("[HandleWebDav] GetINFO path NOT empty\n");
										dirresp = actFS->Info( rootDev, filePath );
									}
									
									int lerror;
									
									if( ( lerror =  isError(  &( dirresp->bs_Buffer[ 5 ] )  ) ) == 0 )
									{
										resp = HttpNewSimple( HTTP_207_MULTI_STATUS,  tags );
										
										DEBUG("[HandleWebDav] GetINFO Converting from JSON  %s\n", dirresp->bs_Buffer );
										BufStringAdd( strResp, "<?xml version=\"1.0\" ?> \n <D:multistatus xmlns:D=\"DAV:\">\n" );
										
										//BufString *tempbs = BufStringNew();
										
										//if( ConvertToWebdav( fpath, tempbs, dirresp, &directory ) == 0 && directory == TRUE )
										if( ConvertToWebdav( fpath, strResp, dirresp, &directory, TRUE ) == 0 && directory == TRUE )
										{
											BufString *locdirresp;
											
											if( filePath == NULL )
											{
												locdirresp = actFS->Dir( rootDev, "" );
											}
											else
											{
												locdirresp = actFS->Dir( rootDev, filePath );
											}
											
											if( ConvertToWebdav( fpath, strResp, locdirresp, &directory, FALSE ) == 0 )
											{
											
												BufStringDelete( locdirresp );
											}
											
											BufStringAdd( strResp, "</D:multistatus>\r\n" );
											//HttpAddTextContent( resp, strResp->bs_Buffer );
											HttpSetContent( resp, strResp->bs_Buffer, strResp->bs_Size );
											
											FERROR("---------------------------------------------------------------------------------------------\n%s\n", strResp->bs_Buffer );
											strResp->bs_Buffer = NULL;
								
											BufStringDelete( dirresp );
										}
									}
									else
									{
										resp = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
										BufString *bs = ReturnFileError( fpath, lerror );
										
										if( bs != NULL )
										{
											HttpAddTextContent( resp, bs->bs_Buffer );
											
											BufStringDelete( bs );
										}
										
										FERROR("WEBDAV: Problem appear %s\n", resp->content );
										
										BufStringDelete( dirresp );
									}
									
									/*
									BufString *dbs = BufStringNew( );
									
									BufStringAdd( dbs, "<?xml version=\"1.0\" ?> \n <D:multistatus xmlns:D=\"DAV:\">\n" );
									
									for( prop = pfind->children ; prop ; prop = prop->next )
									{
										
									}
									
									BufStringAdd( dbs, "</D:multistatus>\r\n" );
									*/
								}
							}
							
							/*
							 * (network/protocol_webdav.c:72) 

---------------------------

---------------------


--------------------
<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:"><allprop/></propfind>

  (network/http.c:67) HTTP_NEW SOCKET SET 0x68771c0
  (network/http.c:93) Added text/xml
  (network/http.c:93) Added close
  (network/protocol_webdav.c:166) Device for sharing found: stefkoshome
  (network/protocol_webdav.c:180) Webdav devicename stefkoshome path container/
--16588-- REDIR: 0x68c51b0 (libc.so.6:__memmove_ssse3_back) redirected to 0x4c2d470 (memcpy@GLIBC_2.2.5)
 ----------->node type: Element, name propfind
	----------->node type: Element, name allprop
 (fsys/fsyslocal.c:974) Dir!
  (fsys/fsyslocal.c:1003) DIR -> directory '/home/stefkos/container/' for path 'container/' devname 'stefkoshome' double 11 devpath '/home/stefkos/'
  (fsys/fsyslocal.c:1055) Dir END
  (system/json/json_converter.c:232) [GetStructureFromJSON] Load
  (system/json/json_converter.c:262) [GetStructureFromJSON] Before parse  -> fail<!--separate-->Could not open directory. 
 ---->(null)<--------
 (system/json/json_converter.c:268) Cannot parse string to object
  (network/protocol_webdav.c:46) Cannot convert from JSON
  (network/protocol_webdav.c:304) Webdav response returned
  (network/protocol_http.c:454) free requests
  (network/http.c:1160) Free http
  (core/friend_core.c:455) HTTP callback called
  (network/http.c:1440) HTTP AND FREE
  (network/http.c:1447) WRITE AND FREE HTTP/1.1 207 Multi-Status

								
				*/
							
							
							/*
							 HTTP/1.1 207 Multi-Status
Content-Type: text/xml
Content-Length: xxxx
*/
							

							
						
						}
					}
					else
					{
					}
				}
				//PrintNode( root );
			}
			xmlFreeDoc( doc );
		}
		else
		{
			FERROR("XMLERROR: Cannot parse XML request\n");
		}
	}
	
	xmlCleanupParser();
	xmlMemoryDump();
	
	BufStringDelete( strResp );
	
	FFree( path );
	FFree( fpath );

#else
	resp = HttpNewSimple( HTTP_400_BAD_REQUEST,  tags );
		FERROR("WEBDAV Call is not proper\n");
		
		HttpAddTextContent( resp, "Hacker!" );
#endif
	
	return resp;
}

