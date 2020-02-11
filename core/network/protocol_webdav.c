/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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
#include <ctype.h>
#include <util/sha256.h>
#include <system/fsys/door_notification.h>

/**
 * Print node to console
 *
 * @param root pointer to root xmlNode
 */
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

/**
 * Convert Friend json to WebDav
 *
 * @param url url provided by client, used to check path
 * @param sbs pointer to BufString, Friend output (json)
 * @param dbs pointer BufferString where xml(webdav) will be stored
 * @param directory pointer to boolean value, if url will point to directory TRUE will be set, otherwise FALSE
 * @param info when TRUE will be provided default response will be set, otherwise response with filename
 * 
 * @return 0 when success, otherwise error number
 */
int ConvertToWebdav( char *url, BufString *dbs, BufString *sbs, FBOOL *directory, FBOOL info )
{
	int i = 0;
	
	FriendFile *ffroot = NULL;
	
	DEBUG("[ConvertToWebdav] Convert to WEBDAV '%s'\n", &(sbs->bs_Buffer[17]));
	
	if( strcmp( "[]",  &(sbs->bs_Buffer[17])) == 0 )
	{
		return 0;
	}
	
	// [17] -> skip <!--ok --->
	if( ( ffroot = GetStructureFromJSON( FriendFileDesc, &(sbs->bs_Buffer[17]) ) ) != NULL )
	{
		FriendFile *lf = ffroot;
		
		while( lf != NULL )
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
			
			DEBUG("[HandleWebDav] url %s       filename %s\n",  url, lf->ff_Filename );

			BufStringAdd( dbs, buf );

			BufStringAdd( dbs, "           \
<bigbox>\n \
<BoxType>Box type A</BoxType>\n \
</bigbox>\n \
<author>\n \
<Name>Hadrian</Name>\n \
</author>\n" );
			
			snprintf( buf, sizeof(buf), "<D:creationdate>%04d-%02d-%02dT%02d:%02d:%02d-00:00\n</D:creationdate>\n", lf->ff_ModifyTime.tm_year+1900, lf->ff_ModifyTime.tm_mon, lf->ff_ModifyTime.tm_mday, lf->ff_ModifyTime.tm_hour, lf->ff_ModifyTime.tm_min, lf->ff_ModifyTime.tm_sec );
			
			BufStringAdd( dbs, buf );

			if( lf->ff_Filename != NULL )
			{
				if( lf->ff_Filename[ 0 ] != 0 )
				{
					sprintf( buf, "<D:displayname>%s</D:displayname>\n", lf->ff_Filename );
					BufStringAdd( dbs, buf );
				}
			}
			else
			{
				BufStringAdd( dbs, "<D:displayname></D:displayname>\n" );
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
			
			sprintf( buf, "<D:getcontentlength>%ld</D:getcontentlength>\n", lf->ff_Size );
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
	return 0;
}

/**
 * Convert Friend json to WebDav (used by PROP call)
 *
 * @param url url provided by client, used to check path
 * @param sbs pointer to BufString, Friend output (json)
 * @param dbs pointer BufferString where xml(webdav) will be stored
 * @param directory pointer to boolean value, if url will point to directory TRUE will be set, otherwise FALSE
 * @param info when TRUE will be provided default response will be set, otherwise response with filename
 * 
 * @return 0 when success, otherwise error number
 */
int ConvertToWebdavPROP( char *url, BufString *dbs, BufString *sbs, FBOOL *directory, FBOOL info )
{
	
	FriendFile *ffroot = NULL;
	
	DEBUG("[ConvertToWebdav] Convert to WEBDAV '%s'\n", &(sbs->bs_Buffer[17]));
	
	if( strcmp( "[]",  &(sbs->bs_Buffer[17])) == 0 )
	{
		return 0;
	}
	
	// [17] -> skip <!--ok --->
	if( ( ffroot = GetStructureFromJSON( FriendFileDesc, &(sbs->bs_Buffer[17]) ) ) != NULL )
	{
		FriendFile *lf = ffroot;
		char *buf = FMalloc( 2048 );
		
		while( lf != NULL )
		{
			int size = 0;

			if( info == TRUE )
			{
				size = snprintf( buf, 2048, "<D:response xmlns:lp1=\"DAV:\" xmlns:lp2=\"http://apache.org/dav/props/\">\n \
				<D:href>http://localhost:6502%s</D:href>\n \
				<D:propstat>\n<D:prop>\n", url );
			}
			else
			{
				if( url[ strlen( url )-1 ] == '/' )
				{
					size = snprintf( buf, 2048, "<D:response xmlns:lp1=\"DAV:\" xmlns:lp2=\"http://apache.org/dav/props/\">\n \
					<D:href>http://localhost:6502%s%s</D:href>\n<D:propstat>\n<D:prop>\n", url, lf->ff_Filename );
				}else{
					size = snprintf( buf, 2048, "<D:response xmlns:lp1=\"DAV:\" xmlns:lp2=\"http://apache.org/dav/props/\">\n \
					<D:href>http://localhost:6502%s/%s</D:href>\n<D:propstat>\n<D:prop>\n", url, lf->ff_Filename );
				}
			}

			//DEBUG("[HandleWebDav] url %s       filename %s\n",  url, lf->ff_Filename );
			BufStringAddSize( dbs, buf, size );
	/*		

<lp1:resourcetype><D:collection/></lp1:resourcetype>\
<lp1:creationdate>2017-10-12T19:33:47Z</lp1:creationdate>\
<lp1:getlastmodified>Thu, 12 Oct 2017 19:33:41 GMT</lp1:getlastmodified>\
<lp1:getetag>\"1000-55b5e9e1e873b\"</lp1:getetag>\
*/
			if( lf->ff_Type != NULL && lf->ff_Type[ 0 ] == 'D' )
			{
				BufStringAdd( dbs, "\t<lp1:resourcetype><D:collection/></lp1:resourcetype>\n");
				*directory = TRUE;
			}
			else
			{
				int size = snprintf( buf, 2048, "<lp1:resourcetype/><lp1:getcontentlength>%lu</lp1:getcontentlength><lp2:executable>F</lp2:executable>", lf->ff_Size );
				BufStringAddSize( dbs, buf, size );
				*directory = FALSE;
			}
	
			//BufStringAdd( dbs, "\t<lp1:creationdate>2017-10-12T19:33:47Z</lp1:creationdate>\n");
			if( lf->ff_ModifyTime.tm_mon == 0 )
			{
				lf->ff_ModifyTime.tm_mon = 1;
			}
			if( lf->ff_ModifyTime.tm_mday == 0 )
			{
				lf->ff_ModifyTime.tm_mday = 1;
			}
			
			time_t t = time(NULL);
			struct tm tm = *localtime( &t );
			
			snprintf( buf, 2048, "<lp1:creationdate>%04d-%02d-%02dT%02d:%02d:%02dZ\n</lp1:creationdate>\n", tm.tm_year+1900, tm.tm_mon, tm.tm_mday, tm.tm_hour, tm.tm_min, tm.tm_sec );
			
			//snprintf( buf, 2048, "<lp1:creationdate>%04d-%02d-%02dT%02d:%02d:%02dZ\n</lp1:creationdate>\n", lf->ff_ModifyTime.tm_year+1900, lf->ff_ModifyTime.tm_mon, lf->ff_ModifyTime.tm_mday, lf->ff_ModifyTime.tm_hour, lf->ff_ModifyTime.tm_min, lf->ff_ModifyTime.tm_sec );
			BufStringAdd( dbs, buf );
	
			//BufStringAdd( dbs, "\t<lp1:getlastmodified>Thu, 12 Oct 2017 19:33:41 GMT</lp1:getlastmodified>\n");
	//snprintf( buf, sizeof(buf), "<lp1:getlastmodified>%04d-%02d-%02dT%02d:%02d:%02d-00:00\n</lp1:getlastmodified>\n", lf->ff_ModifyTime.tm_year+1900, lf->ff_ModifyTime.tm_mon, lf->ff_ModifyTime.tm_mday, lf->ff_ModifyTime.tm_hour, lf->ff_ModifyTime.tm_min, lf->ff_ModifyTime.tm_sec );
			
	//BufStringAdd( dbs, buf );
			
			//<lp1:getlastmodified>Sun, 24 Aug 2017 14:12:27 CET</lp1:getlastmodified>
			FBOOL dateError = FALSE;
			
			// we do not manager dates in files correcly, I will set modification date to "now"
			strftime( buf,80,"<lp1:getlastmodified>Mon, %d %b %Y %H:%M:%S GMT</lp1:getlastmodified>\n", &tm );
			//strftime( buf,80,"<lp1:getlastmodified>Mon, %d %b %Y %H:%M:%S GMT</lp1:getlastmodified>\n", &(lf->ff_ModifyTime) );
			for (unsigned int i = 0 ; i < strlen( buf ) ; i++ )
			{
				if( buf[ i ] == '?' )
				{
					dateError = TRUE;
					break;
				}
			}
			
			DEBUG("[ProtocolWebdav] getlastmodify date, err: %d\n", dateError );
			
			if( dateError == TRUE )
			{
				BufStringAdd( dbs, "\t<lp1:getlastmodified>Thu, 12 Oct 2017 19:33:41 GMT</lp1:getlastmodified>\n");
			}
			else
			{
				// Friend do not handle information about timezone and function cannot find name of the day, thats why they are hardcoded here
				
				BufStringAdd( dbs, buf );
			}

			BufStringAdd( dbs, "<lp1:getetag>\"1000-55b5e9e1e873b\"</lp1:getetag>" );
		
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
</D:supportedlock>\n<D:lockdiscovery/>\n" );
			
			if( lf->ff_Type != NULL && lf->ff_Type[ 0 ] == 'D' )
			{
				BufStringAdd( dbs, "<D:getcontenttype>httpd/unix-directory</D:getcontenttype>\n");
				*directory = TRUE;
			}
			else
			{
				*directory = FALSE;
			}
			
			BufStringAdd( dbs, "</D:prop>\n \
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
		FFree( buf );
	}
	else
	{
		FERROR("Cannot convert from JSON\n");
	}
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

/**
 * Return Webdav error
 *
 * @param url url provided by client
 * @param err error number
 * 
 * @return response in BufString
 */
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

/**
 * Check if error is returned
 *
 * @param val pointer to string which will be parsed to check error
 * 
 * @return 0 when erro was not found, otherwise error number
 */
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
#define AUTH_DIGEST
//#define AUTH_BASIC

/**
 * Handle Webdav call
 *
 * @param lsb pointer to SystemBase
 * @param req pointer to Http request
 * @param data pointer to data readed by sockets
 * @param len size of provided data
 * 
 * @return new Http structure is returned
 */
Http *HandleWebDav( void *lsb, Http *req, char *data, int len )
{
	SystemBase *sb = (SystemBase *)lsb;
	Http *resp = NULL;
	char *path = NULL;
	char *fpath = NULL;
	char *auth = NULL;
	char *module = NULL;
	char *lauth = NULL;
	BufString *strResp = NULL;

	DEBUG("[HandleWebDav] WEBDAV OPERATION-----------------------------------------------------------------------------------\n");

#ifndef DISABLE_WEBDAV

	if( strncmp( req->rawRequestPath, WEBDAV_SHARE_PATH, WEBDAV_SHARE_PATH_LEN ) != 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_400_BAD_REQUEST,  tags );
		FERROR("WEBDAV URL is not proper\n");
		
		HttpAddTextContent( resp, "URL is not proper" );

		return resp;
	}
	
	if( strcmp( req->method, "OPTIONS" ) == 0 )
	{
		struct TagItem ltags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{	HTTP_HEADER_ACCEPT_RANGES, (FULONG)StringDuplicate( "none") },
//			{	HTTP_HEADER_ALLOW, (FULONG)StringDuplicate( "GET, POST, OPTIONS, PUT, PROPFIND" ) },
			{	HTTP_HEADER_ALLOW, (FULONG)StringDuplicate( "GET, POST, OPTIONS, HEAD, MKCOL, PUT, PROPFIND, PROPPATCH, DELETE, MOVE, COPY, GETLIB, LOCK, UNLOCK" ) },
			//{	HTTP_HEADER_ALLOW, (FULONG)StringDuplicate( "GET, POST, OPTIONS, HEAD, MKCOL, PUT, PROPFIND, PROPPATCH, DELETE, MOVE, COPY, GETLIB" ) },
			{	HTTP_HEADER_CACHE_CONTROL, (FULONG)StringDuplicate( "private") },
			{	HTTP_HEADER_DAV, (FULONG)StringDuplicate( "1, 2") },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_200_OK,  ltags );
		HttpAddTextContent( resp, "Options delivered" );
		return resp;
	}

	User *usr = sb->sl_UM->um_Users;
	File *rootDev = NULL;
	char *devname = NULL;
	char *filePath = NULL;
	char *userName = NULL;
	char *userPassword = NULL;
	char *decodedUser = NULL;
	
	int pathSize = strlen( req->rawRequestPath );

	path = UrlDecodeToMem( req->rawRequestPath );
	
	fpath = FCalloc( pathSize+10, sizeof(char) );
	memcpy( fpath, req->rawRequestPath, pathSize );
	
	devname = FCalloc( pathSize+10, sizeof(char) );
	filePath = FCalloc( pathSize+10, sizeof(char) );
	
	int i;
	int pos = 0;
	int dpos = 0;
	
	DEBUG("PATH %s\n", path );
	
	// get devicename and path from URL
	
	for( i = WEBDAV_SHARE_PATH_LEN ; i < pathSize ; i++ )
	{
		if( pos == 0 )
		{
			devname[ dpos ] = path[ i ];
		}
		else
		{
			filePath[ dpos ] = path[ i ];
		}
		
		if( path[ i ] == '/' )
		{
			if( pos == 0 )
			{
				devname[ dpos ] = 0;
				pos = 1;
				dpos = -1;
			}
		}
		else if( i==(pathSize-1 ) )
		{
			filePath[ dpos+1 ] = 0;//':';
			FERROR("dpos %d devname '%s' filePath '%s'\n", dpos, devname, filePath );
		}
		
		dpos++;
	}
	auth = HttpGetHeaderFromTable( req, HTTP_HEADER_AUTHORIZATION );
	if( auth == NULL )
	{
		auth = HttpGetHeaderFromTable( req, HTTP_HEADER_WWW_AUTHENTICATE );
		DEBUG("WWW HEADER USED\n");
	}
	else
	{
		DEBUG("HEADER_AUTH USED\n");
	}
	lauth = StringDuplicateEOL( auth );

#ifdef AUTH_BASIC
	
	if( auth == NULL )
	{
		struct TagItem tagsauth[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicate( "Basic realm=\"FriendUp\"" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		FERROR("WEBDAV Call is not proper\n");
		
		HttpAddTextContent( resp, "ok<!--separate-->{ \"response\":\"device name or sessionid is empty\"}" );
		
		goto end;
	}

	int decodedUserLen;
	char tmpBuf[ 512 ];
	char *ptr = &(auth[ 6 ]);
	int k=0;
	for( ; k < 512 ; k++ )
	{
		if( *ptr == '\r' || *ptr == '\n' )
		{
			tmpBuf[ k ] = 0;
			break;
		}
		tmpBuf[ k ] = *ptr;
		ptr++;
	}
	decodedUser = Base64Decode( (const unsigned char *)tmpBuf, k, &decodedUserLen );

	userName = decodedUser;
	for( i=0 ; i < (int)strlen( decodedUser ) ; i++ )
	{
		if( decodedUser[ i ] == ':' )
		{
			FCSHA256_CTX ctx;
			unsigned char hash[ 32 ];
			char hashTarget[ 128 ];
			int l;
			int k=0;
			
			decodedUser[ i ] = 0;
			userPassword = &(decodedUser[ i+1 ] );
			//strcpy( tmpBuf, &(decodedUser[ i+1 ] ) );
			
			DEBUG("Password before hashed '%s'\n", tmpBuf );
			
			Sha256Init( &ctx );
			Sha256Update( &ctx, (unsigned char *) userPassword, (unsigned int)strlen( userPassword ) ); //&(usr->u_Password[4]), strlen( usr->u_Password )-4 );
			memset( tmpBuf, 0, sizeof( tmpBuf ) );
			Sha256Final( &ctx, hash );

			for( l = 0 ; l < 64 ; l += 2, k++ )
			{
				sprintf( &(hashTarget[ l ]), "%02x", (char )hash[ k ] & 0xff );
			}
			
			strcpy( tmpBuf, "HASHED" );
			strncat( tmpBuf, hashTarget, 64 );

			userPassword = tmpBuf;

			break;
		}
	}

#else // (AUTH_DIGEST)

	if( auth == NULL )
	{
		char *Host = HttpGetHeader( req, "Host", 0 );
		char data[ 256 ];
		
		WebdavToken *tok = WebdavTokenManagerGenerateToken( sb->sl_WDavTokM );
		int size = snprintf( data, sizeof(data), "Digest realm=\"%s\", nonce=\"%s\", opaque=\"%s\", algorithm=\"MD5\", qop=\"auth,auth-int\"", tok->wt_Realm, tok->wt_Nonce, tok->wt_Opaque );
		
		DEBUG("Generated nonce: %32.s\n", tok->wt_Nonce );
		
		struct TagItem tagsauth[] = {
			{	HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicateN( data, size ) },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		//resp = HttpNewSimple( HTTP_403_FORBIDDEN,  tagsauth );
		FERROR("WEBDAV Digest auth, missing authentication\n" );
		
		HttpAddTextContent( resp, "<!DOCTYPE HTML PUBLIC \"-//IETF//DTD HTML 2.0//EN\">\
<html><head>\
<title>401 Unauthorized</title>\
</head><body>\
<h1>Unauthorized</h1>\
<p>This server could not verify that you are authorized to access the document requested.  Either you supplied the wrong credentials (e.g., bad password), or your browser doesn't understand how to supply the credentials required.</p><hr><address>Apache/2.4.25 (Debian) Server at 215.148.12.6 Port 80</address></body></html>" );
		
		HttpWrite( resp, req->h_Socket );
		int rs;
		char buf[ 10000 ];
		int t=0;
		
		struct timeval timeout;
	fd_set fds;

	FD_ZERO( &fds );
	FD_SET( req->h_Socket->fd, &fds );
	
	timeout.tv_sec = 5;//sock->s_Timeouts;
	timeout.tv_usec = 5000;//sock->s_Timeoutu;
	
	SocketSetBlocking( req->h_Socket, TRUE );
	
	int err = select( req->h_Socket->fd+1, &fds, NULL, NULL, &timeout );
	if( err <= 0 )
	{
		DEBUG("Timeout or there is no data in socket\n");
		SocketSetBlocking( req->h_Socket, FALSE );
	}
	else
	{
		SocketSetBlocking( req->h_Socket, FALSE );
		while( TRUE )
		{
			rs = SocketRead( req->h_Socket, buf, 10000, 0 );
			if( rs > 0 )
			{
				printf("------------------------%s\n", buf );
			}
			printf("rs %d\n", rs );
			
			t++;
			if( t > 256 ) break;
		}
	}
		
		
		if( Host != NULL )
		{
			FFree( Host );
		}

		goto end;
	}
	
	char *amethod = NULL;
	char *arealm = NULL;
	char *anonce = NULL, *acnonce = NULL;
	char *auri = NULL;
	char *aresponse = NULL;
	char *aalgo = NULL;
	char *aqop = NULL;
	char *anc = NULL;
	int authlen = strlen( lauth );
	
	DEBUG("DEBUG auth %s authlen %d\n", lauth, authlen );
	
	int p=0;
	FBOOL firstEntryFound = FALSE;
	char *dptr = lauth;
	while( *dptr != 0 )
	{
		*dptr = toupper( *dptr );
		if( *dptr == '=' )
		{
			break;
		}
		dptr++;
	}
	
	for( ; p < authlen ; p++ )
	{
		if( lauth[ p ] == ',' || lauth[ p ] == ' ' || firstEntryFound == FALSE )// && (lauth[ p-1 ] == ',' || firstEntryFound == FALSE ) )
		{
			lauth[ p ] = 0;
			
			char *data = &(lauth[ p+1 ]);
			dptr = data;
			while( *dptr != 0 )
			{
				*dptr = toupper( *dptr );
				if( *dptr == '=' )
				{
					break;
				}
				dptr++;
			}

			if( strncmp( data, "USERNAME", 8 ) == 0 )
			{
				data += 2 + 8;		//  skip   =" and username
				userName = data;
				p += 10;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "REALM", 5 ) == 0 )
			{
				data += 2 + 5;		//  skip   =" and realm
				arealm = data;
				p += 7;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "NONCE", 5 ) == 0 )
			{
				data += 2 + 5;		//  skip   =" and nonce
				anonce = data;
				p += 7;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "URI", 3 ) == 0 )
			{
				data += 2 + 3;		//  skip   =" and uri
				auri = data;
				p += 5;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "RESPONSE", 8 ) == 0 )
			{
				data += 2 + 8;		//  skip   =" and response
				aresponse = data;
				p += 10;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "ALGORITHM", 9 ) == 0 )
			{
				data += 1 + 9;		//  skip   = and algorithm
				if( *data == '\"' )
				{
					data++;
				}
				aalgo = data;
				p += 10;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "CNONCE", 6 ) == 0 )
			{
				data += 2 + 6;		//  skip   =" and cnonce
				acnonce = data;
				p += 8;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "QOP", 3 ) == 0 )
			{
				data += 1 + 3;		//  skip   =" and qop
				if( *data == '\"' )
				{
					data++;
				}
				aqop = data;
				p += 4;
				firstEntryFound = TRUE;
			}
			else if( strncmp( data, "NC", 2 ) == 0 )
			{
				data += 1 + 2;		//  skip   =" and username
				anc = data;
				p += 3;
				firstEntryFound = TRUE;
			}
		}
		else if( lauth[ p ] == '\"' )
		{
			lauth[ p ] = 0;
		}
		else if( lauth[ p ] == '\n' || lauth[ p ] == '\r' )
		{
			lauth[ p ] = 0;
			break;
		}
	}
	
	printf(" uname '%s'\narealm '%s'\nanonce '%s'\nauri '%s'\naresponse '%s'\nalgo '%s'\nacnonce '%s'\naqop '%s'\nanc '%s'\n",userName,arealm,anonce,auri,aresponse,aalgo,acnonce,aqop,anc );
	
	int z=0;
	for( z = 0 ; z < HTTP_HEADER_END ; z++ )
	{
		if( req->h_RespHeaders[ z ] != NULL )
		{
			DEBUG("Found entry: %s\n", HEADERS[ z ] );
		}
	}
	
	HASHHEX HA1;
	HASHHEX HA2 = "";
	HASHHEX Response;
	Response[ 32 ] = 0;
	
	WebdavToken *tok = WebdavTokenManagerGetTokenNonce( sb->sl_WDavTokM, anonce );
	if( tok == NULL )
	{
		char data[ 256 ];
		
		WebdavToken *tok = WebdavTokenManagerGenerateToken( sb->sl_WDavTokM );
		int size = snprintf( data, sizeof(data), "Digest realm=\"%s\", nonce=\"%s\", opaque=\"%s\", algorithm=\"MD5\", qop=\"auth,auth-int\"", tok->wt_Realm, tok->wt_Nonce, tok->wt_Opaque );
		
		struct TagItem tagsauth[] = {
			{	HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicateN( data, size ) },
			{TAG_DONE, TAG_DONE}
		};

		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		FERROR("WEBDAV Token not found!\n" );

		HttpAddTextContent( resp, "ok<!--separate-->{ \"response\":\"token not found\"}" );
		
		goto end;
	}
	
	
#endif
	
	// we must split path, to have access to device name, user name
	AuthMod *ulib = sb->AuthModuleGet( sb );

	LIST_FOR_EACH( sb->sl_UM->um_Users, usr, User * )
	{
		if( strcmp( userName, usr->u_Name ) == 0 )
		{
			break;
		}
	}
	
	// user not logged in, we must add it to session
	// and mount shared device
	
	SQLLibrary *sqll = sb->LibrarySQLGet( sb );
	if( sqll != NULL )
	{
		if( usr == NULL )
		{
			DEBUG("User '%s' not found. FC will try to get it from DB\n", userName );
			// SQL is used to mount  device!

			usr = UMUserGetByNameDB( sb->sl_UM, userName );
		
			if( usr != NULL )
			{
				LIST_ADD_HEAD( sb->sl_UM->um_Users, usr );
				
				UserSession *ses = USMGetSessionByDeviceIDandUser( sb->sl_USM, "webdav", usr->u_ID );
				
				if( ses == NULL )
				{
					ses = UserSessionNew( "webdav", "webdav" );
					if( ses != NULL )
					{
						ses->us_UserID = usr->u_ID;
						ses->us_LoggedTime = time( NULL );
					
						UserAddSession( usr, ses );
						USMSessionSaveDB( sb->sl_USM, ses );
					
						ses->node.mln_Succ = (MinNode *) sb->sl_USM->usm_Sessions;
						sb->sl_USM->usm_Sessions = ses;
					}
				}
				char *err = NULL;
				sb->UserDeviceMount( sb, sqll, usr, 0, TRUE, &err, TRUE );
				if( err != NULL )
				{
					FERROR("UserDeviceMount returned: %s\n", err );
					FFree( err );
				}
			}
			else
			{
				struct TagItem tagsauth[] = {
					{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
					{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
					{TAG_DONE, TAG_DONE}
				};

				resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
				
				sb->AuthModuleDrop( sb, ulib );
				sb->LibrarySQLDrop( sb, sqll );
			
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", sb->sl_Dictionary->d_Msg[DICT_BAD_ERROR_OR_PASSWORD] , DICT_BAD_ERROR_OR_PASSWORD );
				HttpAddTextContent( resp, dictmsgbuf );

				FFree( path );
				FFree( fpath );
				if( decodedUser != NULL ){ FFree( decodedUser ); }
			
				return resp;
			}
			sb->AuthModuleDrop( sb, ulib );
		}
		else
		{
			char *err = NULL;
			sb->UserDeviceMount( sb, sqll, usr, 0, TRUE, &err, TRUE );
			if( err != NULL )
			{
				FERROR("UserDeviceMount returned: %s\n", err );
				FFree( err );
			}
		}
		sb->LibrarySQLDrop( sb, sqll );
	}
	
	if( usr == NULL )
	{
		struct TagItem tagsauth[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		FERROR("WEBDAV User not found\n");
		
		char dictmsgbuf[ 256 ];
		char dictmsgbuf1[ 196 ];
		snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), sb->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "devname, sessionid" );
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
		HttpAddTextContent( resp, dictmsgbuf );

		goto end;
	}
	
	if( decodedUser != NULL )
	{
		FFree( decodedUser );
		decodedUser = NULL;
	}
	
	// we should use flag or u_WebDAVDevs
	rootDev = GetRootDeviceByName( usr, devname );
	/*
	LIST_FOR_EACH( usr->u_MountedDevs, rootDev, File * )
	{
		if(  strcmp(rootDev->f_Name, devname ) == 0 )
		{
			INFO("Device for sharing found: %s\n", devname );
			break;
		}
	}
	*/
	
	if( rootDev == NULL )
	{
		FERROR("Device %s is not mounted\n", devname );
		struct TagItem tagsauth[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		resp = HttpNewSimple( HTTP_404_NOT_FOUND,  tagsauth );
		FERROR("WEBDAV User not found\n");

		goto end;
	}
	
	if( rootDev->f_KeysID == 0 )
	{
		FERROR("Key is not assigned to device: %s %lu\n", devname, rootDev->f_KeysID );
		struct TagItem tagsauth[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		FERROR("WEBDAV User not found\n");
		goto end;
	}
	else
	{
		if( tok->wt_Key == NULL )
		{
			tok->wt_Key = FKeyManagerGetByID( sb->sl_KeyM, rootDev->f_KeysID );
		}
	}
	
	if( tok->wt_Key == NULL )
	{
		FERROR("Key doesnt exist in DB: %lu\n", rootDev->f_KeysID );
		struct TagItem tagsauth[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
		FERROR("WEBDAV User not found\n");
		goto end;
	}
	
	#ifdef AUTH_BASIC
	
	{
		time_t tm = 0;
		time_t tm_now = time( NULL );
		FBOOL access = UMGetLoginPossibilityLastLogins( sb->sl_UM, usr->u_Name, sb->sl_ActiveAuthModule->am_BlockAccountAttempts, &tm );
		if( access == FALSE && ( (tm_now - tm ) < sb->sl_ActiveAuthModule->am_BlockAccountTimeout) )
		{
			UMStoreLoginAttempt( sb->sl_UM, usr->u_Name, "Login fail", "Last login attempts fail (WEBDAV)" );
			
			struct TagItem tagsauth[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
				{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicate( "Basic realm=\"FriendUp\"" ) },
				{TAG_DONE, TAG_DONE}
			};
			
			DEBUG("Checking access %d time %lu blockedtime %lu\n", access, (tm_now - tm ), sb->sl_ActiveAuthModule->am_BlockAccountTimeout );
		
			resp = HttpNewSimple( HTTP_403_FORBIDDEN,  tagsauth );
			FERROR("WEBDAV Your account '%s' is blocked!\n", usr->u_Name );
		
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), sb->sl_Dictionary->d_Msg[DICT_ACCOUNT_BLOCKED], (tm_now + sb->sl_ActiveAuthModule->am_BlockAccountTimeout) );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_ACCOUNT_BLOCKED );
			HttpAddTextContent( resp, dictmsgbuf );
			//HttpAddTextContent( resp, "ok<!--separate-->{\"response\":\"your account is blocked!\"}" );
		
			goto end;
		}
		else
		{
			FULONG blockTime = 0;
			if( ( sb->sl_ActiveAuthModule->CheckPassword( sb->sl_ActiveAuthModule, NULL, usr, userPassword, &blockTime ) ) == FALSE )
			{
				struct TagItem tagsauth[] = {
					{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
					{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
					{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicate( "Basic realm=\"FriendUp\"" ) },
					{TAG_DONE, TAG_DONE}
				};
		
				//#define HTTP_401_UNAUTHORIZED 
				resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );
				FERROR("WEBDAV Wrong user or password '%s'!\n", usr->u_Name );
		
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", sb->sl_Dictionary->d_Msg[DICT_BAD_ERROR_OR_PASSWORD] , DICT_BAD_ERROR_OR_PASSWORD );
				HttpAddTextContent( resp, dictmsgbuf );
				//HttpAddTextContent( resp, "ok<!--separate-->{\"response\":\"user or password is wrong\"}" );
		
				goto end;
			}
			
			UMStoreLoginAttempt( sb->sl_UM, usr->u_Name, "Login success(WEBDAV)", NULL );
		}
	}
#else		// AUTH DIGEST
	{
		DigestCalcHA1( aalgo, userName, arealm, tok->wt_Key->k_Data, anonce, acnonce, HA1);
		DigestCalcResponse( HA1, anonce, anc, acnonce, aqop, req->method, auri, HA2, Response);

		INFO("COmpare client %s - generated by server %s\n", aresponse, Response );
		if( strcmp( aresponse, Response ) != 0 )
		{
			FERROR("Passwords doesnt match: %s\n", anonce );
			char data[ 256 ];
		
			WebdavToken *tok = WebdavTokenManagerGenerateToken( sb->sl_WDavTokM );
			int size = snprintf( data, sizeof(data), "Digest realm=\"%s\", nonce=\"%s\", opaque=\"%s\", algorithm=\"MD5\", qop=\"auth,auth-int\"", tok->wt_Realm, tok->wt_Nonce, tok->wt_Opaque );
		
			DEBUG("Generated nonce: %32.s\n", tok->wt_Nonce );
		
			struct TagItem tagsauth[] = {
				{	HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
				{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{	HTTP_HEADER_WWW_AUTHENTICATE, (FULONG)StringDuplicateN( data, size ) },
				{TAG_DONE, TAG_DONE}
			};

			resp = HttpNewSimple( HTTP_401_UNAUTHORIZED,  tagsauth );

			HttpAddTextContent( resp, "Bad user or wrong password" );
		
			goto end;
		}
		
		// authentication passed, timestamp will be updated
		tok->wt_CreateTime = time( NULL );
	}
#endif
	
	strResp = BufStringNew();

	INFO("Webdav devicename %s path %s method: %s\n", devname, filePath, req->method );
	
	//
	// GET
	//
	
	if( strcmp( req->method, "GET" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		FBOOL have = TRUE;

		if( req->h_RequestSource == HTTP_SOURCE_FC && sb->sl_Sentinel != NULL && usr == sb->sl_Sentinel->s_User )
		{
			have = FALSE;
		}
		else
		{
			have = FSManagerCheckAccess( sb->sl_FSM, path, rootDev->f_ID, usr, "-R----" );
		}
		
		if( have == TRUE )
		{
			FHandler *actFS = (FHandler *)rootDev->f_FSys;
			rootDev->f_SessionIDPTR = usr->u_MainSessionID;
			
			File *fp = (File *)actFS->FileOpen( rootDev, filePath, "rb" );
			if( fp != NULL )
			{
#define FS_READ_BUFFER 400960
				
				ListString *ls = ListStringNew();
				//BufString *bs = BufStringNewSize( 20024 );
				char *dataBuffer = FMalloc( FS_READ_BUFFER );
				FLONG dataread = 0;

				if( req->h_RespHeaders[ HTTP_HEADER_RANGE ] == NULL )
				{
					while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
					{
						ListStringAdd( ls, dataBuffer, dataread );
					}
				}
				else	// RANGE != NULL
				{
					FLONG total = 0;
					while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
					{
						FLONG futbytes = (total+dataread);
						FLONG offset = 0;
						FLONG storeBytes = dataread;
						
						if( futbytes >= req->h_RangeMin && total <= req->h_RangeMax )
						{
							DEBUG("RANGE %ld -> %ld , fubytes %ld total %ld\n", req->h_RangeMin, req->h_RangeMax, futbytes, total );
							if( futbytes >= req->h_RangeMin )
							{
								int mindif = futbytes - req->h_RangeMin;
								offset = dataread - (futbytes - req->h_RangeMin);
								
								//if( storeBytes > dataread )
								//{
								if( offset < 0 )
								{
									offset = 0;
									//storeBytes = mindif;
									storeBytes = dataread;
									DEBUG("Store maximum buffer size\n");
								}
								else
								{
									/*
									if( offset < 0 )
									{
										offset = 0;
									}
									*/
									storeBytes = (futbytes - req->h_RangeMin);
									DEBUG("Store part of buffer, offset %ld store bytes %ld\n", offset, storeBytes );
								}
								
								if( futbytes > req->h_RangeMax )
								{
									storeBytes -= (futbytes-req->h_RangeMax);
									DEBUG("More bytes readed then max\n");
								}
							}
							
							DEBUG("Store bytes %ld > offset %ld\n", storeBytes, offset );
							//BufStringAddSize( bs, dataBuffer + offset, storeBytes );
							ListStringAdd( ls, dataBuffer + offset, storeBytes );
						}
						else
						{
							DEBUG("Skipped %ld min %ld max %ld total %ld\n", dataread, req->h_RangeMin, req->h_RangeMax, total  );
						}
						total += dataread;
					}
				}
			
				//resp->content = bs->bs_Buffer;
				//resp->sizeOfContent = bs->bs_Size;
				//bs->bs_Buffer = NULL;
			
				//BufStringDelete( bs );
				ListStringJoin( ls );
				resp->content = ls->ls_Data;
				resp->sizeOfContent = ls->ls_Size;
				ls->ls_Data = NULL;
				
				ListStringDelete( ls );
				
				/*
				// streaming will not work now, because (I think) content length must be set first
				HttpWrite( resp, req->h_Socket );
				
				fp->f_Stream = req->h_Stream;
				fp->f_Socket = req->h_Socket;
				fp->f_WSocket = req->h_WSocket;
				
				char dataBuffer[ FS_READ_BUFFER ];
				int dataread = 0;
				
				while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
				{
					DEBUG("Readed %d\n", dataread );
					//BufStringAddSize( bs, dataBuffer, dataread );
				}
				
				resp->content = NULL;
				resp->sizeOfContent = 0;
				resp->h_WriteType = FREE_ONLY;
				*/
			
				FFree( dataBuffer );
				actFS->FileClose( rootDev, fp );
			}
			else
			{
				FERROR("Cannot open file: %s\n", filePath );
			}
		}
	}
	
	//
	// HEAD
	//
	
	else if( strcmp( req->method, "HEAD" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		FBOOL have = TRUE;
		if( req->h_RequestSource == HTTP_SOURCE_FC && sb->sl_Sentinel != NULL && usr == sb->sl_Sentinel->s_User )
		{
			have = FALSE;
		}
		else
		{
			have = FSManagerCheckAccess( sb->sl_FSM, path, rootDev->f_ID, usr, "-R----" );
		}
		
		if( have == TRUE )
		{
			FHandler *actFS = (FHandler *)rootDev->f_FSys;
			rootDev->f_SessionIDPTR = usr->u_MainSessionID;
			File *fp = (File *)actFS->FileOpen( rootDev, filePath, "rb" );
			if( fp != NULL )
			{
				actFS->FileClose( rootDev, fp );
			}
			else
			{
				FERROR("Cannot open file: %s\n", filePath );
			}
		}
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "PUT" ) == 0 )
	{
		//DEBUG("\n\n\n-----------------------------------------------------------PUT---------------------------------------------\n\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		FBOOL have = TRUE;
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		if( req->h_RequestSource == HTTP_SOURCE_FC && sb->sl_Sentinel != NULL && usr == sb->sl_Sentinel->s_User )
		{
			have = FALSE;
		}
		else
		{
			have = FSManagerCheckAccess( sb->sl_FSM, path, rootDev->f_ID, usr, "--W---" );
		}
		
		DEBUG("PUT access : %d\n", have );
		
		if( have == TRUE )
		{
			FHandler *actFS = (FHandler *)rootDev->f_FSys;
			
			rootDev->f_SessionIDPTR = usr->u_MainSessionID;
			File *fp = (File *)actFS->FileOpen( rootDev, filePath, "wb" );
			if( fp != NULL )
			{
				int saveSize = req->sizeOfContent;
				
				if( saveSize == 0 )
				{
					saveSize = req->h_ContentLength;
				}
				
				DEBUG("Save size %d\n", saveSize );
				int writelen = 0;
				
				if( req->content != NULL )
				{
					writelen = actFS->FileWrite( fp, req->content, saveSize );
				}
				else
				{
					FERROR("Request content is equal to NULL!\n");
				}
				INFO("File written %s size %d\n", filePath, writelen );
			
				actFS->FileClose( rootDev, fp );
			
				DoorNotificationCommunicateChanges( sb, NULL, rootDev, filePath );
			}
			else
			{
				FERROR("Cannot open file: %s\n", filePath );
			}
		}
		else
		{
			FERROR("User dont have access to store data\n");
		}
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "MOVE" ) == 0 )
	{
		/*
		  140408888018688: [ProtocolHttp] HTTP Callback called
140408888018688: INCOMING Request length: 299 data:                                                                                                                                                                                                                      MOVE /webdav/devices/Home/testsite/Nowy%20folder HTTP/1.1
Connection: Keep-Alive
User-Agent: Microsoft-WebDAV-MiniRedir/10.0.15063
Destination: http://192.168.153.138:6502/webdav/devices/Home/testsite/wwwwwwwwwwwwwwww
Overwrite: F
translate: f
Content-Length: 0
Host: 192.168.153.138:6502

		 */
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *dst = HttpGetHeaderFromTable( req, HTTP_HEADER_DESTINATION );
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		char *dstName = StringDuplicateEOL( dst + WEBDAV_SHARE_PATH_LEN );
		
		if( dstName != NULL )
		{
			char *wdavpath = strstr( dstName, "/webdav/devices/" );
			if( wdavpath != NULL )
			{
				wdavpath += 16;
			}
			
			char *dstpath = wdavpath;
			int len = strlen( wdavpath );
			int i;
			for( i=1 ; i < len ; i++ )
			{
				if( wdavpath[ i ] == '/' )
				{
					dstpath = wdavpath + (i+1);
				}
			}
			DEBUG("RENAME, srcname %s dstname %s\n", filePath, dstpath );
			
			rootDev->f_SessionIDPTR = usr->u_MainSessionID;
			int err = actFS->Rename( rootDev, filePath, dstpath );
			
			DEBUG("RENAME, err %d\n", err );
			DoorNotificationCommunicateChanges( sb, NULL, rootDev, filePath );
			
			FFree( dstName );
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

		FBOOL have = TRUE;
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		if( req->h_RequestSource == HTTP_SOURCE_FC && sb->sl_Sentinel != NULL && usr == sb->sl_Sentinel->s_User )
		{
			have = FALSE;
		}
		else
		{
			have = FSManagerCheckAccess( sb->sl_FSM, path, rootDev->f_ID, usr, "--W---" );
		}
		
		if( have == TRUE )
		{
			FHandler *actFS = (FHandler *)rootDev->f_FSys;
			rootDev->f_SessionIDPTR = usr->u_MainSessionID;
			actFS->MakeDir( rootDev, filePath );
		}
		
		DoorNotificationCommunicateChanges( sb, NULL, rootDev, filePath );
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

		FBOOL have = TRUE;
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		if( req->h_RequestSource == HTTP_SOURCE_FC && sb->sl_Sentinel != NULL && usr == sb->sl_Sentinel->s_User )
		{
			have = FALSE;
		}
		else
		{
			have = FSManagerCheckAccess( sb->sl_FSM, path, rootDev->f_ID, usr, "----D-" );
		}
		
		if( have == TRUE )
		{
			DEBUG("DELETE WEBDAV FUNCTION: '%s'\n\n", filePath );
			actFS->Delete( rootDev, filePath );
			
			//int deleteFiles = 0;
			//int res = FileOrDirectoryDeleteRec( NULL, rootDev, filePath, 0, &deleteFiles );
			
			DoorNotificationCommunicateChanges( sb, NULL, rootDev, filePath );
		}
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

		char *dstPath = HttpGetHeaderFromTable( req, HTTP_HEADER_DESTINATION );
		if( dstPath != NULL )
		{
#define COPY_BUFFEER_SIZE 502400
			
			char *buffer = FMalloc( COPY_BUFFEER_SIZE );
			if( buffer != NULL )
			{
				int read;
				FHandler *actFS = (FHandler *)rootDev->f_FSys;
				
				rootDev->f_SessionIDPTR = usr->u_MainSessionID;
			
				File *rfp = (File *)actFS->FileOpen( rootDev, filePath, "rb" );
				if( rfp != NULL )
				{
					int writelen = 0;
					
					File *wfp = (File *)actFS->FileOpen( rootDev, dstPath, "wb" );
					if( wfp != NULL )
					{
						while( ( read = actFS->FileRead( rfp, buffer, COPY_BUFFEER_SIZE ) ) > 0 )
						{
							writelen += actFS->FileWrite( wfp, buffer, read );
						}
						actFS->FileClose( rootDev, wfp );
						
						DoorNotificationCommunicateChanges( sb, NULL, rootDev, dstPath );
					}

					INFO("File written %s size %d\n", filePath, writelen );
					actFS->FileClose( rootDev, rfp );
				}
			}
		}
	}
	
	//
	//
	//
	
	else if( strcmp( req->method, "PROPFIND" ) == 0 )
	{
		DEBUG("PROPFIND found\n");
		//resp = HttpNewSimple( HTTP_200_OK,  ltags );
		//HttpAddTextContent( resp, path );
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		FBOOL directory = FALSE;
		FHandler *actFS = (FHandler *)rootDev->f_FSys;
		BufString *dirresp;
		int depth = 1;
		
		char *depthstr = HttpGetHeaderFromTable( req, HTTP_HEADER_DEPTH );
		if( depthstr != NULL && depthstr[0] == '0' )
		{
			depth = 0;
		}
		//printf("==============================Depth: '%s'\n", depthstr );
		// <?xml version="1.0" encoding="utf-8" ?><D:lockinfo xmlns:D="DAV:"><D:lockscope><D:exclusive/></D:lockscope><D:locktype><D:write/></D:locktype><D:owner><D:href>stefkos</D:href></D:owner></D:lockinfo>
		
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
		
		DEBUG("RECEIVED INFO %s\n", dirresp->bs_Buffer );
		if( dirresp->bs_Buffer != NULL )
		{
			char *code = strstr( dirresp->bs_Buffer, "\"code\":" );
			if( code != NULL )
			{
				code += 8;	// + "code":"
				if( code[ 0 ] == '2' && code[ 1 ] == '1' )
				{
					resp = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );

					HttpAddTextContent( resp, dirresp->bs_Buffer );
					
					BufStringDelete( dirresp );
					
					DEBUG("WD->req content '%s'\n", req->content );
					FERROR("WEBDAV: File not found %s\n", resp->content );
			
					goto end;
				}
			}
			
			if( dirresp->bs_Buffer[0] == 'f' && dirresp->bs_Buffer[1] == 'a' && dirresp->bs_Buffer[2] == 'i' && dirresp->bs_Buffer[3] == 'l' )
			{
				resp = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );

				HttpAddTextContent( resp, dirresp->bs_Buffer );
				
				BufStringDelete( dirresp );
					
				DEBUG("WD->req content '%s'\n", req->content );
				FERROR("WEBDAV: File not found %s\n", resp->content );
			
				goto end;
			}
		}
		
		int lerror;
		
		if( ( lerror =  isError(  &( dirresp->bs_Buffer[ 5 ] )  ) ) == 0 )
		{
			DEBUG("[HandleWebDav] GetINFO Converting from JSON  %s\n", dirresp->bs_Buffer );
			BufStringAdd( strResp, "<?xml version=\"1.0\" ?> \n <D:multistatus xmlns:D=\"DAV:\">\n" );

			if( ConvertToWebdavPROP( fpath, strResp, dirresp, &directory, TRUE  ) == 0 )
			{
				if( directory == TRUE && depth != 0 )
				{
					BufString *locdirresp;
					
					//stefkos
					rootDev->f_SessionIDPTR = usr->u_MainSessionID;
					if( filePath == NULL )
					{
						locdirresp = actFS->Dir( rootDev, "" );
					}
					else
					{
						locdirresp = actFS->Dir( rootDev, filePath );
					}
					
					//fail<!--separate-->Could not find file
					if( strncmp( locdirresp->bs_Buffer, "fail<!--separate-->", 19 ) == 0 )
					{
						resp = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
					}
					else
					{
						resp = HttpNewSimple( HTTP_207_MULTI_STATUS,  tags );
						
						if( ConvertToWebdavPROP( fpath, strResp, locdirresp, &directory, FALSE ) == 0 )
						{
							BufStringDelete( locdirresp );
						}
					}
					
					BufStringAdd( strResp, "</D:multistatus>\r\n" );

					HttpSetContent( resp, strResp->bs_Buffer, strResp->bs_Size );
					
					//FERROR("-DIRECTORY----------------------------------------------------------------------------------\n%s\n", strResp->bs_Buffer );
					strResp->bs_Buffer = NULL;
					
					BufStringDelete( dirresp );
				}
				else // file
				{ 
					resp = HttpNewSimple( HTTP_207_MULTI_STATUS,  tags );
					
					BufStringAdd( strResp, "</D:multistatus>\r\n" );

					HttpSetContent( resp, strResp->bs_Buffer, strResp->bs_Size );
					
					//FERROR("--FILE----------------------------------------------------------------------------\n%s\n", strResp->bs_Buffer );
					strResp->bs_Buffer = NULL;
				
					BufStringDelete( dirresp );
				}
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
											HttpAddTextContent( resp, "<?xml version=\"1.0\" encoding=\"utf-8\"?><D:multistatus xmlns:D=\"DAV:\"><D:response xmlns:lp1=\"DAV:\" xmlns:lp2=\"http://apache.org/dav/props/\"><D:href>/webdav/</D:href><D:propstat><D:prop><lp1:resourcetype><D:collection/></lp1:resourcetype>\
<lp1:creationdate>2017-10-12T19:33:47Z</lp1:creationdate>\
<lp1:getlastmodified>Thu, 12 Oct 2017 19:33:41 GMT</lp1:getlastmodified>\
<lp1:getetag>\"1000-55b5e9e1e873b\"</lp1:getetag>\
<D:supportedlock>\
<D:lockentry>\
<D:lockscope><D:exclusive/></D:lockscope>\
<D:locktype><D:write/></D:locktype>\
</D:lockentry>\
<D:lockentry>\
<D:lockscope><D:shared/></D:lockscope>\
<D:locktype><D:write/></D:locktype>\
</D:lockentry>\
</D:supportedlock>\
<D:lockdiscovery/>\
<D:getcontenttype>httpd/unix-directory</D:getcontenttype>\
</D:prop>\
<D:status>HTTP/1.1 200 OK</D:status>\
</D:propstat>\
</D:response>\
</D:multistatus>" );
*/
		goto end;
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
			//{	HTTP_HEADER_ALLOW, (FULONG)StringDuplicate( "GET, POST, OPTIONS, HEAD, MKCOL, PUT, PROPFIND, PROPPATCH, DELETE, MOVE, COPY, GETLIB" ) },
			{	HTTP_HEADER_CACHE_CONTROL, (FULONG)StringDuplicate( "private") },
			{	HTTP_HEADER_DAV, (FULONG)StringDuplicate( "1, 2") },
			{TAG_DONE, TAG_DONE}
		};
		
		resp = HttpNewSimple( HTTP_200_OK,  ltags );
		HttpAddTextContent( resp, " " );
		//BufStringDelete( strResp );
		
		goto end;
	}
	
	//
	// LOCK 
	//
	
	else if( strcmp( req->method, "LOCK" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		/*
		 <d:lockinfo xmlns:d="DAV:">
  <d:lockscope><d:exclusive/></d:lockscope>
  <d:locktype><d:write/></d:locktype>
  <d:owner>
    <d:href>http://www.contoso.com/~user/contact.htm</d:href>
  </d:owner>
</d:lockinfo>
		 */
				//example response
		/*
		<?xml version="1.0" encoding="utf-8" ?>
<d:prop xmlns:d="DAV:">
  <d:lockdiscovery>
    <d:activelock>
      <d:locktype><d:write/></d:locktype>
      <d:lockscope><d:exclusive/></d:lockscope>
      <d:depth>Infinity</d:depth>
      <d:owner>
        <d:href>http://www.contoso.com/~user/contact.htm</d:href>
      </d:owner>
      <d:timeout>Second-345600</d:timeout>
      <d:locktoken>
        <d:href>opaquelocktoken:e71d4fae-5dec-22df-fea5-00a0c93bd5eb1</d:href>
      </d:locktoken>
    </d:activelock>
  </d:lockdiscovery>
</d:prop>
		*/
		
		//<?xml version="1.0" encoding="utf-8" ?><D:lockinfo xmlns:D="DAV:"><D:lockscope><D:exclusive/></D:lockscope><D:locktype><D:write/></D:locktype><D:owner><D:href>stefkos</D:href></D:owner></D:lockinfo>
		
		char *scope = NULL;
		char *type = NULL;
		char *owner = NULL;
		
		xmlDocPtr doc;
	
		if( ( doc = xmlReadMemory( data, len, "request.xml", NULL, 0 ) )  != NULL )
		{
			xmlNode *root = xmlDocGetRootElement( doc );
			if( root != NULL )
			{
				xmlNode *n = NULL;
		
				for( n = root ; n ; n = n->next )
				{
					xmlNode *lockdisc = NULL;
				
					if( n->type == XML_ELEMENT_NODE )
					{
						DEBUG("[HandleWebDav] node type: Element, name %s\n", n->name );
					
						for( lockdisc = n->children ; lockdisc ; lockdisc = lockdisc->next )
						{
							const char *lockdiskname = (const char *)lockdisc->name;
							DEBUG("[HandleWebDav] lockdisc type: Element, name %s\n", lockdiskname );
							
							if( strcmp( lockdiskname, "lockscope" ) == 0 )
							{
								if( lockdisc->type == XML_ELEMENT_NODE )
								{
									xmlNode *scopedisc = NULL;
									for( scopedisc = lockdisc->children ; scopedisc ; scopedisc = scopedisc->next )
									{
										scope = (char *)scopedisc->name;
									}
								}
							}
							else if( strcmp( lockdiskname, "locktype" ) == 0 )
							{
								if( lockdisc->type == XML_ELEMENT_NODE )
								{
									xmlNode *typedisc = NULL;
									for( typedisc = lockdisc->children ; typedisc ; typedisc = typedisc->next )
									{
										type = (char *)typedisc->name;
									}
								}
							}
							else if( strcmp( lockdiskname, "owner" ) == 0 )
							{
								if( lockdisc->type == XML_ELEMENT_NODE )
								{
									xmlNode *ownerdisc = NULL;
									for( ownerdisc = lockdisc->children ; ownerdisc ; ownerdisc = ownerdisc->next )
									{
										owner = (char *)ownerdisc->name;
									}
								}
							}
						}
					}
					else
					{
					}
				}
			}
			xmlFreeDoc( doc );
		}
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		int respsize = 512 + strlen(fpath);
		char *respContent = FCalloc( respsize, sizeof(char) );
		if( respContent != NULL )
		{
			DEBUG("Webdav lock!\n");
			
			if( owner != NULL && type != NULL && scope != NULL )
			{
				int respSize = snprintf( respContent, respsize, "<?xml version=\"1.0\"?> \
<d:prop xmlns:d=\"DAV:\"> \
<d:lockdiscovery> \
<d:activelock> \
<d:locktype><d:write/></d:locktype> \
<d:lockscope><d:exclusive/></d:lockscope> \
<d:depth>Infinity</d:depth> \
<d:owner> \
<d:href>%s</d:href> \
</d:owner> \
<d:timeout>Second-345600</d:timeout> \
<d:locktoken>  \
<d:href>opaquelocktoken:e71d4fae-5dec-22df-fea5-00a0c93bd5eb1</d:href> \
</d:locktoken> \
</d:activelock> \
</d:lockdiscovery> \
</d:prop>", fpath );
				HttpSetContent( resp, respContent, respSize );
				
				DEBUG("LOCK! %s\n", respContent );
			}
			else
			{
			
			}
		}
	}
	
	//
	// UNLOCK 
	//
	
	else if( strcmp( req->method, "UNLOCK" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		resp = HttpNewSimple( HTTP_204_NO_CONTENT,  tags );
		
		char *locktoken = HttpGetHeader( req, "lock-token", 0 );
		
		DEBUG("UNLOCK %s\n", locktoken );
		/*
		UNLOCK /public/myfile.doc HTTP/1.1
Host: www.contoso.com
Lock-Token: <opaquelocktoken:a31d4fce-5dec-17df-2da5-00c0c63bd4eb1>
Content-Type: text/xml

<?xml version="1.0" ?>
<D:transactioninfo xmlns:D="DAV:">
   <D:transactionstatus><D:commit/></D:transactionstatus>
</D:transactioninfo>

Response

HTTP/1.1 204 No Content

		 */
	}
	
	//
	// PROPPATCH
	//
	
	else if( strcmp( req->method, "PROPPATCH" ) == 0 )
	{
	/*
	<?xml version="1.0" encoding="utf-8" ?><D:propertyupdate xmlns:D="DAV:" xmlns:Z="urn:schemas-microsoft-com:"><D:set><D:prop><Z:Win32CreationTime>Mon, 16 Oct 2017 08:55:48 GMT</Z:Win32CreationTime><Z:Win32LastAccessTime>Mon, 16 Oct 2017 08:55:48 GMT</Z:Win32LastAccessTime><Z:Win32LastModifiedTime>Mon, 16 Oct 2017 08:55:48 GMT</Z:Win32LastModifiedTime><Z:Win32FileAttributes>00000020</Z:Win32FileAttributes></D:prop></D:set></D:propertyupdate>

	 */
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/xml" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		DEBUG("PROPPATCH\n");
		
		BufString *bstr = BufStringNew();
		BufStringAdd( bstr, "<?xml version=\"1.0\"?>" ); 
		
		xmlDocPtr doc;
	
		if( ( doc = xmlReadMemory( data, len, "request.xml", NULL, 0 ) )  != NULL )
		{
			xmlNode *root = xmlDocGetRootElement( doc );
			if( root != NULL )
			{
				xmlNode *n = NULL;
		
				for( n = root ; n ; n = n->next )
				{
					xmlNode *setdisc = NULL;
				
					if( n->type == XML_ELEMENT_NODE )
					{
						char *unaspace = NULL;
						DEBUG("[HandleWebDav] node type: Element, name %s\n", n->name );
						
						xmlNs *names = n->nsDef;
						while( names != NULL )
						{
							if( names->href[0] == 'D' && names->href[1] == 'A' && names->href[2] == 'V' )
							{
								
							}
							else
							{
								unaspace = (char *)names->href;
							}
							
							names = names->next;
						}
						
						{
							char ltmp[ 512 ];
							int lsize = snprintf( ltmp, sizeof(ltmp), "<a:multistatus xmlns:b=\"%s\" xmlns:a=\"DAV:\"><a:response>", unaspace );
							BufStringAddSize( bstr, ltmp, lsize ); 
							
							lsize = snprintf( ltmp, sizeof(ltmp), "<a:href>%s</a:href>", fpath );
							BufStringAddSize( bstr, ltmp, lsize ); 
						}
						
						BufStringAdd( bstr, "<a:propstat><a:status>HTTP/1.1 200 OK</a:status><a:prop>" );

						for( setdisc = n->children ; setdisc ; setdisc = setdisc->next )
						{
							DEBUG("[HandleWebDav] setdisc type: Element, name %s\n", setdisc->name );
							
							if( strcmp( (const char *)setdisc->name, "set" ) == 0 )
							{
								if( setdisc->type == XML_ELEMENT_NODE )
								{
									xmlNode *propdisc = NULL;
									for( propdisc = setdisc->children ; propdisc ; propdisc = propdisc->next )
									{
										DEBUG("SET: %s\n", propdisc->name );
										//scope = propdisc->name;
										
										if( propdisc->type == XML_ELEMENT_NODE )
										{
											xmlNode *singlepropdisc = NULL;
											for( singlepropdisc = propdisc->children ; singlepropdisc ; singlepropdisc = singlepropdisc->next )
											{
												char prop[ 256 ];
												DEBUG("SINGLE PROP: %s\n", singlepropdisc->name );
												
												int propsize = snprintf( prop, sizeof(prop), "<b:%s/>", singlepropdisc->name );
												BufStringAddSize( bstr, prop, propsize );
											}
										}
									}
								}
							}
						}
						
						BufStringAdd( bstr, "</a:prop></a:propstat></a:response></a:multistatus>" );
					}
					else
					{
					}
				}
			}
			xmlFreeDoc( doc );
		}
	
		resp = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( bstr != NULL && bstr->bs_Buffer != NULL )
		{
			HttpSetContent( resp, bstr->bs_Buffer, bstr->bs_Size );
			bstr->bs_Buffer = NULL;
			BufStringDelete( bstr );
		}
	}

end:
	
	//xmlMemoryDump();
	
	if( strResp != NULL )
	{
		BufStringDelete( strResp );
	}
	
	if( decodedUser != NULL )
	{
		FFree( decodedUser ); 
	}
	if( path != NULL )
	{
		FFree( path );
	}
	if( fpath != NULL )
	{
		FFree( fpath );
	}
	if( devname != NULL )
	{
		FFree( devname );
	}
	if( filePath != NULL )
	{
		FFree( filePath );
	}
	if( lauth != NULL )
	{
		FFree( lauth );
	}

#else
	resp = HttpNewSimple( HTTP_400_BAD_REQUEST,  tags );
		FERROR("WEBDAV Call is not proper\n");
		
		HttpAddTextContent( resp, "Hacker!" );
#endif
	
	
	DEBUG("WDAV code: %d response %.*s\n", resp->errorCode , (int)resp->sizeOfContent, resp->content );
	
	return resp;
}

