/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
//#include "systembase.h"
#include <util/log/log.h>
#include <sys/stat.h>
#include <util/buffered_string.h>
#include <dirent.h> 
#include <arpa/inet.h>
#include <libssh2_sftp.h>

// ssh stuff

//#include "libssh2_config.h"
#include <libssh2.h>
 
#ifdef HAVE_WINSOCK2_H
#include <winsock2.h>
#endif
#ifdef HAVE_SYS_SOCKET_H
#include <sys/socket.h>
#endif
#ifdef HAVE_NETINET_IN_H
#include <netinet/in.h>
#endif
#ifdef HAVE_SYS_SELECT_H
#include <sys/select.h>
#endif
#ifdef HAVE_UNISTD_H
#include <unistd.h>
#endif
#ifdef HAVE_ARPA_INET_H
#include <arpa/inet.h>
#endif
 
#include <sys/time.h>
#include <sys/types.h>
#include <stdlib.h>
#include <fcntl.h>
#include <errno.h>
#include <stdio.h>
#include <ctype.h>
#include <system/systembase.h>

#define SUFFIX "fsys"
#define PREFIX "ssh2"

#define h_addr h_addr_list[0]

//int UnMount( struct FHandler *s, void *f, User *usr, char **error  );

#define __ENABLE_MUTEX

//
// Special SSH data
//

typedef struct SpecialData
{
	
    //const char *hostname = "127.0.0.1";
    //const char *commandline = "uptime";
   // const char *username;//    = "user";
   // const char *password ;//   = "password";
	unsigned long hostaddr;
	int sock;
	struct sockaddr_in sin;
	const char *fingerprint;
	LIBSSH2_SESSION *session;
	LIBSSH2_CHANNEL *channel;
	LIBSSH2_SFTP *sftp_session;
	LIBSSH2_SFTP_HANDLE *sftp_handle;
	int rc;
	int exitcode;
	char *exitsignal;//=(char *)"none";
	int bytecount;// = 0;
	size_t len;
	LIBSSH2_KNOWNHOSTS *nh;
	int type;
	
	char									*sd_LoginUser;		// login user
	char									*sd_LoginPass;		// login password
	int 									sd_Port;				// port
	char									*sd_Host;			// host
	SystemBase *sb;
	LIBSSH2_SFTP_HANDLE						*sd_FileHandle;
	char                                    sd_privkeyFileName[ 512 ];
	int										sd_LoginType;
}SpecialData;

typedef struct HandlerData
{
#ifdef __ENABLE_MUTEX
	pthread_mutex_t					hd_Mutex;
#endif
	int initialized;
}HandlerData;

const char *GetSuffix()
{
	return SUFFIX;
}

const char *GetPrefix()
{
	return PREFIX;
}

//
//
//

static inline void DisconnectLoop( SpecialData *sd, HandlerData *hd )
{
#ifdef __ENABLE_MUTEX
pthread_mutex_unlock( &hd->hd_Mutex );
#endif
while( TRUE )
{
	if( libssh2_session_free( sd->session ) != LIBSSH2_ERROR_EAGAIN )
	{
		break;
		
	}
	usleep( 1000 ); 
}
#ifdef __ENABLE_MUTEX
pthread_mutex_lock( &hd->hd_Mutex );
#endif
}

//
// additional stuff
//


static char* StringDup( const char* str )
{
	if( str == NULL)
	{
		//DEBUG("Cannot copy string!\n");
		return NULL;
	}
	
	int len = strlen( str );
	char *res = NULL;
	if( ( res = FCalloc( len+1, sizeof(char) ) ) != NULL )
	{
		strcpy( res, str );
	}
	
	return res;
}


//
//
//

void init( struct FHandler *s )
{
	int rc = libssh2_init( 0 );
	DEBUG("LIBSSH init %d\n", rc );
	s->fh_SpecialData = FCalloc( 1, sizeof( HandlerData ) );
	HandlerData *hd = (HandlerData *)s->fh_SpecialData;
	hd->initialized = 0;
#ifdef __ENABLE_MUTEX
	pthread_mutex_init( &hd->hd_Mutex, NULL );
#endif
	DEBUG("[SSH2FS] init\n");
}

//
//
//

void deinit( struct FHandler *s )
{
	HandlerData *hd = (HandlerData *)s->fh_SpecialData;
	libssh2_exit();
#ifdef __ENABLE_MUTEX
	pthread_mutex_destroy( &hd->hd_Mutex );
#endif
	FFree( hd );
	DEBUG("[SSH2FS] deinit\n");
}

//
//
//

static int ServerReconnect( SpecialData *sd, HandlerData *hd __attribute__((unused)) )
{
	if( sd->session != NULL )
	{
		if( sd->sftp_session != NULL )
		{
			libssh2_sftp_shutdown( sd->sftp_session );
			sd->sftp_session = NULL;
		}
	
		libssh2_session_disconnect( sd->session,  "Normal Shutdown, Thank you for playing" );
		
		DisconnectLoop( sd ,hd );
		sd->session = NULL;
	}
	
	if( sd->sock != 0 )
	{
		close( sd->sock );
		sd->sock = 0;
	}
	
	sd->sock = socket( AF_INET, SOCK_STREAM, 0 );
	if( sd->sock != 0 )
	{
		char *userauthlist = NULL;
		// Set a timeout
		struct timeval timeout;      
		timeout.tv_sec = 4; // 4 secs!
		timeout.tv_usec = 0;
		setsockopt( sd->sock, SOL_SOCKET, SO_RCVTIMEO, (char *)&timeout, sizeof( timeout) );
		setsockopt( sd->sock, SOL_SOCKET, SO_SNDTIMEO, (char *)&timeout, sizeof( timeout ) );
		
		if( connect( sd->sock, (struct sockaddr *)&(sd->sin), sizeof(sd->sin) ) != 0 ) 
		{
			shutdown( sd->sock, SHUT_RDWR );
			close( sd->sock );
			sd->sock = 0;
			FERROR( "Connect_client:: could not connect to host=[%s]\n", sd->sd_Host);
			return -1;
		}
		
		sd->session = libssh2_session_init();
		if( sd->session == NULL )
		{
			FERROR("Cannot initalize session!\n");
			return -3;
		}
		libssh2_session_set_timeout( sd->session, 5000 );
		
		if( libssh2_session_handshake( sd->session, sd->sock ) < 0 ) 
		{
			DEBUG("Failure establishing SSH session\n");
			DisconnectLoop( sd ,hd );
			sd->session = NULL;
			shutdown( sd->sock, SHUT_RDWR );
			close( sd->sock );
			sd->sock = 0;
			return -2;
		}
		
		libssh2_keepalive_config( sd->session, 1, 5 );
		
		sd->fingerprint = libssh2_hostkey_hash( sd->session, LIBSSH2_HOSTKEY_HASH_SHA1 );
		
		if( sd->fingerprint == NULL )
		{
			DEBUG("Failure establishing SSH session\n");
			DisconnectLoop( sd ,hd );
			sd->session = NULL;
			shutdown( sd->sock, SHUT_RDWR );
			close( sd->sock );
			sd->sock = 0;
			return -3;
		}

		DEBUG( "Now going into userauthlist.\n" );
		
		userauthlist = libssh2_userauth_list( sd->session, sd->sd_LoginUser, strlen(sd->sd_LoginUser) );
		
		int authpw = 0;
		if( strstr(userauthlist, "password") != NULL )
		{
			authpw |= 1;
		}
		if( strstr(userauthlist, "keyboard-interactive") != NULL )
		{
			authpw |= 2;
		}
		if( strstr(userauthlist, "publickey") != NULL )
		{
			authpw |= 4;
		}
		
		if( sd->sd_LoginType == 1 )
		{
			sd->rc = libssh2_userauth_password( sd->session, sd->sd_LoginUser, sd->sd_LoginPass );
			if( sd->rc != 0 )
			{
				FERROR("User not authenticated\n");
				DisconnectLoop( sd ,hd );
				sd->session = NULL;
				shutdown( sd->sock, SHUT_RDWR );
				close( sd->sock );
				sd->sock = 0;
				return -3;
			}
		}
		else if ( sd->sd_LoginType == 4 )
		{
			// Or by public key  
			//if( libssh2_userauth_publickey_frommem( sdat->session, sdat->sd_LoginUser, strlen(sdat->sd_LoginUser), NULL, 0, privkey, strlen(privkey), NULL ) )
			//{
			if (libssh2_userauth_publickey_fromfile( sd->session, sd->sd_LoginUser, NULL, sd->sd_privkeyFileName, sd->sd_LoginPass ) ) 
			{	
				FERROR("User not authenticated\n");
				DisconnectLoop( sd ,hd );
				sd->session = NULL;
				shutdown( sd->sock, SHUT_RDWR );
				close( sd->sock );
				sd->sock = 0;
				return -4;
			}
			else
			{
				DEBUG( "\tAuthentication by public key succeeded.\n");
			}
		}
		else
		{
			FERROR("User not authenticated\n");
			DisconnectLoop( sd ,hd );
			sd->session = NULL;
			shutdown( sd->sock, SHUT_RDWR );
			close( sd->sock );
			sd->sock = 0;
			return -5;
		}
		
		DEBUG("Auth %s %s ret %d\n", sd->sd_LoginUser, sd->sd_LoginPass, sd->rc );
		
		sd->sftp_session = libssh2_sftp_init( sd->session );
		
		if (!sd->sftp_session) 
		{
			int err = libssh2_session_last_errno( sd->session );
			
			FERROR("Unable to init SFTP session %d\n", err );
			
			DisconnectLoop( sd ,hd );
			sd->session = NULL;
			shutdown( sd->sock, SHUT_RDWR );
			close( sd->sock );
			sd->sock = 0;
			return -6;
		}
		
		// Since we have not set non-blocking, tell libssh2 we are blocking 
		libssh2_session_set_blocking( sd->session, 1);
	}
	return 0;
}

//
// Unmount device
//

int UnMount( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		File *lf = (File *)f;

		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			HandlerData *hd = (HandlerData *)s->fh_SpecialData;
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_lock( &hd->hd_Mutex );
#endif
			
			if( sdat->session != NULL )
			{
				if( sdat->sftp_session != NULL )
				{
					libssh2_sftp_shutdown( sdat->sftp_session );
					sdat->sftp_session = NULL;
				}
			
				libssh2_session_disconnect( sdat->session,  "Normal Shutdown, Thank you for playing" );
				DisconnectLoop( sdat ,hd );
				sdat->session = NULL;
			}

			if( sdat->sock != 0 )
			{
				close( sdat->sock );
			}
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_unlock( &hd->hd_Mutex );
#endif
			
			DEBUG("all done!\n");
			
			if( sdat->sd_Host ){ FFree( sdat->sd_Host ); }
			if( sdat->sd_LoginUser ){ FFree( sdat->sd_LoginUser ); }
			if( sdat->sd_LoginPass ){ FFree( sdat->sd_LoginPass ); }
			
			remove( sdat->sd_privkeyFileName );
			
			FFree( lf->f_SpecialData );
		}
	}
	
	return 0;
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti, User *usrs __attribute__((unused)), char **mountError __attribute__((unused)) )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	char *host = NULL;
	char *ulogin = NULL;
	char *upass = NULL;
	char *config = NULL;
	//char *privkey = NULL;
	int port = 22;
	User *usr = NULL;
	SystemBase *sb = NULL;
	
	if( s == NULL )
	{
		return NULL;
	}
	
	HandlerData *hd = (HandlerData *)s->fh_SpecialData;
	
	DEBUG("Mounting ssh2 filesystem!\n");
	
	if( ( dev = FCalloc( sizeof( File ), 1 ) ) != NULL )
	{
		struct TagItem *lptr = ti;
		
		//
		// checking passed arguments
		
		while( lptr->ti_Tag != TAG_DONE )
		{
			switch( lptr->ti_Tag )
			{
				case FSys_Mount_Path:
					path = (char *)lptr->ti_Data;
					DEBUG("Mount FS path set '%s'\n", path );
					break;
				case FSys_Mount_Server:
					host = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_Port:
					port = atol( (char *)lptr->ti_Data );
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_LoginUser:
					ulogin = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_LoginPass:
					upass = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_SysBase:
					sb = (SystemBase *)lptr->ti_Data;
					break;
				case FSys_Mount_Config:
					config = (char *)lptr->ti_Data;
					break;
			}
		
			lptr++;
		}
		
		//
		
		if( path == NULL || name == NULL )
		{
			DEBUG("[ERROR]: Path or name parameters not found!\n");
			FFree( dev );
			return NULL;
		}
		
		//init( s );
		
		// we are trying to open folder/connection
		DEBUG("Mounting localfsys, Its directory FSYS: %s!\n", s->GetPrefix() );
		
		dev->f_Path = StringDup( path );
		DEBUG("localfs path is ok '%s'\n", dev->f_Path );
		dev->f_FSys = s;
		dev->f_Type = FType_Directory;
		dev->f_Size = 0;
		dev->f_Position = 0;
		dev->f_User = usr;
		dev->f_Name = StringDup( name );
		DEBUG("data filled, name of the drive: %s\n", dev->f_Name );
	}
	
	//
	// we will hold here special data SSH2
	//
	
	dev->f_SpecialData = FCalloc( sizeof(SpecialData), 1 );
	SpecialData *sdat = (SpecialData *) dev->f_SpecialData;
	if( sdat != NULL )
	{
		FBOOL noUserLogin = TRUE;
		sdat->sd_Host = StringDup( host );
		sdat->sd_Port = port;
		sdat->sd_LoginUser = StringDup( ulogin );
		if( upass != NULL && strlen( upass ) > 0 )
		{
			sdat->sd_LoginPass = StringDup( upass );
		}
		sdat->sb = sb;
		
		// Ultra basic "connect to port 22 on localhost".  Your code is
		//responsible for creating the socket establishing the connection
		/// 
		sdat->hostaddr = inet_addr( sdat->sd_Host );
		
		sdat->sock = socket( AF_INET, SOCK_STREAM, 0 );
 
		sdat->sin.sin_family = AF_INET;
		sdat->sin.sin_port = htons( sdat->sd_Port );
		
		DEBUG("PORT %d HOST %s\n", sdat->sd_Port, sdat->sd_Host );
		
		struct hostent *phe;
		
#ifdef __ENABLE_MUTEX
		DEBUG("SFTP lock %p\n", &hd->hd_Mutex );
		pthread_mutex_lock( &hd->hd_Mutex );
#endif

		if ( (phe = (struct hostent *)gethostbyname(sdat->sd_Host) ) != NULL ) 
		{
			DEBUG("Gethostbyname used\n");
			memcpy(&sdat->sin.sin_addr, phe->h_addr, phe->h_length);
		}
		else if( ( phe = gethostbyname2( sdat->sd_Host, AF_INET6 ) ) != NULL )
		{
			DEBUG("Gethostbyname2 used\n");
			memcpy( &sdat->sin.sin_addr, phe->h_addr, phe->h_length);
		}
		else if ( (sdat->sin.sin_addr.s_addr = inet_addr(sdat->sd_Host)) == INADDR_NONE) 
		{
			FERROR( "Connect_client:: could not get host=[%s]\n", sdat->sd_Host);
			goto shutdown;
		}
		
		// Set a timeout
		struct timeval timeout;      
		timeout.tv_sec = 4; // 4 secs!
		timeout.tv_usec = 0;
		DEBUG("Socket timeout will be set\n");
		setsockopt( sdat->sock, SOL_SOCKET, SO_RCVTIMEO, (char *)&timeout, sizeof( timeout ) );
		setsockopt( sdat->sock, SOL_SOCKET, SO_SNDTIMEO, (char *)&timeout, sizeof( timeout ) );
		
		DEBUG("Before connect\n");
		if( connect( sdat->sock, (struct sockaddr *)&(sdat->sin), sizeof(sdat->sin) ) != 0 ) 
		{
			close( sdat->sock );
			FERROR( "Connect_client:: could not connect to host=[%s]\n", sdat->sd_Host);
			goto shutdown;
		}

		// Create a session instance and start it up. This will trade welcome
		// banners, exchange keys, and setup crypto, compression, and MAC layers
		// 
		
		DEBUG("SSH init\n");
		sdat->session = libssh2_session_init();
		
		if( sdat->session == NULL )
		{
			FERROR("Cannot create ssh2 session\n");
			goto shutdown;
		}
		DEBUG("SSH timeout set\n");
		libssh2_session_set_timeout( sdat->session, 5000 );
		
		DEBUG("SSH2 timeout, sessptr %p socknr %d\n", sdat->session, sdat->sock );
		
		if( libssh2_session_handshake( sdat->session, sdat->sock ) < 0 ) 
		{
			DEBUG("Failure establishing SSH session\n");
			goto shutdown;
		}
		
		libssh2_keepalive_config( sdat->session, 1, 5 );
 
		// At this point we havn't authenticated. The first thing to do is check
		// the hostkey's fingerprint against our known hosts Your app may have it
		// hard coded, may go to a file, may present it to the user, that's your
		// call
		// 
		
		sdat->fingerprint = libssh2_hostkey_hash( sdat->session, LIBSSH2_HOSTKEY_HASH_SHA1 );
		
		if( sdat->fingerprint == NULL )
		{
			DEBUG( "Failed to get fingerprint.\n" );
			goto shutdown;
		}
		
		/*
		DEBUG("Fingerprint: ");
		int i;
		for(i = 0; i < 20; i++) 
		{
			DEBUG(  "%02X ", (unsigned char)sdat->fingerprint[i]);
		}
		DEBUG("\n");
		*/
 
 		DEBUG( "Now going into userauthlist.\n" );
 
		char *userauthlist = NULL;
		
		userauthlist = libssh2_userauth_list( sdat->session, sdat->sd_LoginUser, strlen(sdat->sd_LoginUser) );
		DEBUG( "AUTHLIST %s\n", userauthlist );
		
		int authpw = 0;
		if( strstr( userauthlist, "password" ) != NULL )
		{
			authpw |= 1;
			DEBUG( "Now going into userauthlist.\n" );
		}
		if( strstr( userauthlist, "keyboard-interactive" ) != NULL )
		{
			authpw |= 2;
		}
		if( strstr( userauthlist, "publickey" ) != NULL )
		{
			authpw |= 4;
		}
		
		DEBUG("CONFIG: '%s'\n", config );

		if( config != NULL )
		{
			//int cfglen = strlen( config );
			
			char *lockey = strstr( config, "PrivateKey" );
			if( lockey != NULL )
			{
				lockey += 13; // add "PrivateKey":"
				char *endptr = lockey;
				char *lastchar = endptr;
				while( TRUE )
				{
					if( *endptr == 0 )
					{
						break;
					}
					
					if( *lastchar != '\\' && *endptr == '\"' )
					{
						int len = endptr - lockey;
						
						snprintf( sdat->sd_privkeyFileName, sizeof(sdat->sd_privkeyFileName), "/tmp/Friendup/%lu_tke_%d%d%d%d", (unsigned long)sdat, rand()%9999, rand()%9999, rand()%9999, rand()%9999 );
						
						DEBUG("PrivateKey : %s\n", sdat->sd_privkeyFileName );
						
						FILE *fp;
						if( ( fp = fopen( sdat->sd_privkeyFileName, "wb") ) != NULL )
						{
							int p;
							for( p=0 ; p < len ; p++ )
							{
								if( lockey[ p ] == '\\' )
								{
									if( lockey[ p+1 ] == '/' )
									{
										fputc( '/', fp );
										p++;
									}
									else if( lockey[ p+1 ] == 'n' )
									{
										fputc( '\n', fp );
										p++;
									}
									else
									{
										fputc( lockey[ p+1 ], fp );
										p++;
									}
								}
								else
								{
									fputc( lockey[ p ], fp );
								}
							}
							//fwrite( lockey, len, sizeof(char), fp);
							fclose(fp);
						}
						
						//if( ( privkey = FCalloc( len+10, sizeof(char) ) ) != NULL )
						//{
						//	memcpy( privkey, lockey, len*sizeof(char) );
						//}
						break;
					}
					
					lastchar = endptr;
					endptr++;
				}
			}
		}
		
		DEBUG("Authpw %d log '%s' pass '%s'\n", authpw, sdat->sd_LoginUser, sdat->sd_LoginPass );
		
		if( authpw & 1 && sdat->sd_LoginPass != NULL )
		{
			sdat->rc = libssh2_userauth_password( sdat->session, sdat->sd_LoginUser, sdat->sd_LoginPass );
			if( sdat->rc != 0 )
			{
				FERROR("User not authenticated\n");
				//goto shutdown;
			}
			else
			{
				sdat->sd_LoginType = 1;
				noUserLogin = FALSE;
			}
		}
		
		if( authpw & 4 )
		{
			if( noUserLogin == TRUE )	// there is no need to check authentication again
			{
				sdat->sd_LoginType = 4;
				DEBUG("Password login fail or PubKey authorisation will be used\n");
				// Or by public key  
				/*
				if( libssh2_userauth_publickey_frommem( sdat->session, sdat->sd_LoginUser, strlen(sdat->sd_LoginUser), NULL, 0, privkey, strlen(privkey), NULL ) )
				//{
					*/
				
				//printf("sdat->sd_LoginUser %s, publickey %s, sdat->sd_privkeyFileName '%s', sdat->sd_LoginPass %s\n", sdat->sd_LoginUser, NULL, sdat->sd_privkeyFileName, sdat->sd_LoginPass );
				
				//if( libssh2_userauth_publickey_fromfile( sdat->session, sdat->sd_LoginUser, NULL, "/tmp/Friendup/rsa_4096.pem", sdat->sd_LoginPass ) )
				
				if( libssh2_userauth_publickey_fromfile( sdat->session, sdat->sd_LoginUser, NULL, sdat->sd_privkeyFileName, sdat->sd_LoginPass ) )
				/*
				if (libssh2_userauth_publickey_fromfile( sdat->session, sdat->sd_LoginUser, "/home/stefkos/.ssh/id_rsa.pub", "/home/stefkos/.ssh/id_rsa", sdat->sd_LoginPass ) ) 
					*/
				{	
					FERROR( "\tAuthentication by public key failed!\n");
					goto shutdown;
				}
				else
				{
					DEBUG( "\tAuthentication by public key succeeded.\n");
				}
			}
		}
		else
		{
			if( sdat->rc != 0 )
			{
				FERROR( "No supported authentication methods found!\n");
				goto shutdown;
			}
		}
		
		DEBUG("Auth %s %s ret %d\n", sdat->sd_LoginUser, sdat->sd_LoginPass, sdat->rc );

		sdat->sftp_session = libssh2_sftp_init( sdat->session );

		if( !sdat->sftp_session ) 
		{
			int err = libssh2_session_last_errno( sdat->session );
			
			FERROR("Unable to init SFTP session %d\n", err );
			goto shutdown;
		}
		
		LIBSSH2_SFTP_HANDLE *handle = NULL;
		handle = libssh2_sftp_open( sdat->sftp_session, dev->f_Path, LIBSSH2_FXF_READ, 0 );
		if( handle == NULL )
		{
			int err = libssh2_session_last_errno( sdat->session );
			
			FERROR("Cannot open base directory : %s - error %d\n", dev->f_Path, err );
			goto shutdown;
		}
		libssh2_sftp_close( handle );
 
		// Since we have not set non-blocking, tell libssh2 we are blocking 
		libssh2_session_set_blocking( sdat->session, 1);

#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
		DEBUG("mount SFTP unlock %p\n", &hd->hd_Mutex );
#endif
		
		return dev;
	}
	
shutdown:

	if( dev->f_SpecialData )
	{
		SpecialData *sdat = (SpecialData *) dev->f_SpecialData;
	
		if( sdat->session != NULL )
		{
			libssh2_sftp_shutdown( sdat->sftp_session );
			sdat->sftp_session = NULL;
	
			libssh2_session_disconnect( sdat->session,  "Normal Shutdown, Thank you for playing");
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_unlock( &hd->hd_Mutex );
			DEBUG("mount SFTP unlock %p\n", &hd->hd_Mutex );
#endif
			while( TRUE )
			{ 
				if( libssh2_session_free( sdat->session ) != LIBSSH2_ERROR_EAGAIN )
				{
					break; 
				} usleep( 1000 );
			}
			
			sdat->session = NULL;
		}
		else
		{
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
		//pthread_mutex_destroy( &hd->hd_Mutex );
		DEBUG("mount SFTP unlock %p\n", &hd->hd_Mutex );
#endif
		}
		
		if( sdat->sock != 0 )
		{
			close( sdat->sock );
			sdat->sock = 0;
		}
		DEBUG("all done!\n");
		
		if( sdat->sd_Host ){ FFree( sdat->sd_Host ); }
		if( sdat->sd_LoginUser ){ FFree( sdat->sd_LoginUser ); }
		if( sdat->sd_LoginPass ){ FFree( sdat->sd_LoginPass ); }
	
		FFree( dev->f_SpecialData );
	}

	if( dev->f_Name ){ FFree( dev->f_Name ); }
	if( dev->f_Path ){ FFree( dev->f_Path ); }
	FFree( dev );
	
	return NULL;
}

//
// Release device
//

int Release( struct FHandler *s, void *f )
{
	if( f != NULL )
	{
		File *lf = (File *)f;
		
		if( lf->f_SpecialData )
		{
			SpecialData *sdat = (SpecialData *) lf->f_SpecialData;
			HandlerData *hd = (HandlerData *)s->fh_SpecialData;
			
#ifdef __ENABLE_MUTEX
			DEBUG("release locked %p\n", &hd->hd_Mutex );
			pthread_mutex_lock( &hd->hd_Mutex );
#endif
			if( sdat->session != NULL )
			{
				if( sdat->sftp_session != NULL )
				{
					//libssh2_sftp_shutdown( sdat->sftp_session );
					sdat->sftp_session = NULL;
				}
				//libssh2_session_disconnect( sdat->session,  "Normal Shutdown, Thank you for playing");
				if( sdat->session != NULL )
				{
					//while( TRUE ){ if( libssh2_session_free( sdat->session ) != LIBSSH2_ERROR_EAGAIN ){ break; } usleep( 1000 ); }
					//sdat->session = NULL;
				}
			}
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_unlock( &hd->hd_Mutex );
#endif

			DEBUG("all done!\n");
			//libssh2_exit();
			
			if( sdat->sock != 0 )
			{
				close( sdat->sock);
				DEBUG("socket closed\n");
			}
			
			if( sdat->sd_Host ){ FFree( sdat->sd_Host ); }
			if( sdat->sd_LoginUser ){ FFree( sdat->sd_LoginUser ); }
			if( sdat->sd_LoginPass ){ FFree( sdat->sd_LoginPass ); }
			
			remove( sdat->sd_privkeyFileName );
			
			FFree( lf->f_SpecialData );
		}
	}
	
	return 0;
}

//
//
//

void *FileOpen( struct File *s, const char *path, char *mode )
{
	// Make relative path
	int pathsize = strlen( path );
	char *commClean = FCalloc( pathsize+10, sizeof( char ) );
	int il = pathsize, imode = 0, in = 0;
	int ii = 0; for( ; ii < il; ii++ )
	{
		if( imode == 0 && path[ii] == ':' )
		{
			imode = 1; continue;
		}
		else if( imode == 1 )
		{
			commClean[in++] = path[ii];
		}
	}
	
	SpecialData *sdat = (SpecialData *)s->f_SpecialData;
	
	if( imode != 1 )
	{
		strcpy( commClean, path );
	}
	
	int spath = strlen( commClean );
	int rspath = strlen( s->f_Path );
	File *locfil = NULL;
	char *comm = FCalloc( rspath + spath + 5, sizeof( char ) );
	
	DEBUG(" comm---size %d\n", rspath + spath + 5 );
	
	// Remove the filename from commclean in a clean path
	char *cleanPath = NULL;
	il = strlen( commClean ); imode = 0, ii = il;
	for( ; il > 0; il-- )
	{
		if( imode == 0 && ( commClean[il] == '/' || commClean[il] == ':' ) )
		{
			imode = 1;
			cleanPath = FCalloc( il+10, sizeof( char ) );
			break;
		}
	}
	if( imode == 1 ) sprintf( cleanPath, "%.*s", il, commClean );
	
	// Create a string that has the real file path of the file
	if( comm != NULL )
	{
		if( s->f_Path[ rspath-1 ] == '/' )
		{
			sprintf( comm, "%s%s", s->f_Path, commClean );
		}
		else
		{
			sprintf( comm, "%s/%s", s->f_Path, commClean );
		}
		
		// Make the directories that do not exist
		int slashes = 0, i = 0; for( ; i < spath; i++ )
		{
			if( commClean[i] == '/' )
			{
				slashes++;
			}
		}
		
		FHandler *fh = (FHandler *)s->f_FSys;
		HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
		
#ifdef __ENABLE_MUTEX
		DEBUG("open1 locked %p\n", &hd->hd_Mutex );
		pthread_mutex_lock( &hd->hd_Mutex );
#endif
		int slash = 0;
		for( i = 0; i < spath; i++ )
		{
			if( path[i] == '/' )
			{
				int alsize = rspath + i + 1;
				DEBUG("Allocate %d\n", alsize );
				char *directory = FCalloc( alsize , sizeof( char ) );
				if( directory != NULL )
				{
					snprintf( directory, alsize, "%s%.*s", s->f_Path, i, cleanPath );
					
					libssh2_sftp_mkdir( sdat->sftp_session, directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
					
					
					FFree( directory );
				}
				slash++;
			}
		}
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
		DEBUG("open1 locked %p\n", &hd->hd_Mutex );
#endif
		
		FFree( commClean );
		if( cleanPath != NULL )
		{
			FFree( cleanPath );
		}
		commClean = NULL;
		cleanPath = NULL;
		
		DEBUG("FileOpen in progress\n");
		
		//
		// Only go on if we can find the file and open it 
		//
		
		//
		// read stream
		//
		LIBSSH2_SFTP_HANDLE *handle = NULL;
		
#ifdef __ENABLE_MUTEX
		DEBUG("open locked %p\n", &hd->hd_Mutex );
		pthread_mutex_lock( &hd->hd_Mutex );
#endif
		
		if( strcmp( mode, "rs" ) == 0 || strcmp( mode, "rb" ) == 0 || strcmp( mode, "r" ) == 0 )
		{
			handle = libssh2_sftp_open( sdat->sftp_session, comm, LIBSSH2_FXF_READ, 0 );
			if( handle == NULL )
			{
				ServerReconnect( sdat, hd );
				handle = libssh2_sftp_open( sdat->sftp_session, comm, LIBSSH2_FXF_READ, 0 );
			}
		}
		else
		{
			handle = libssh2_sftp_open( sdat->sftp_session, comm,
				LIBSSH2_FXF_WRITE|LIBSSH2_FXF_CREAT|LIBSSH2_FXF_TRUNC,
				LIBSSH2_SFTP_S_IRUSR|LIBSSH2_SFTP_S_IWUSR|
				LIBSSH2_SFTP_S_IRGRP|LIBSSH2_SFTP_S_IROTH );
			
			if( handle == NULL )
			{
				ServerReconnect( sdat, hd );
				handle = libssh2_sftp_open( sdat->sftp_session, comm,
											LIBSSH2_FXF_WRITE|LIBSSH2_FXF_CREAT|LIBSSH2_FXF_TRUNC,
								LIBSSH2_SFTP_S_IRUSR|LIBSSH2_SFTP_S_IWUSR|
								LIBSSH2_SFTP_S_IRGRP|LIBSSH2_SFTP_S_IROTH );
			}
		}
		
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
		DEBUG("open unlocked %p\n", &hd->hd_Mutex );
#endif
		
		if( handle != NULL )
		{
			// Ready the file structure
			if( ( locfil = FCalloc( sizeof( File ), 1 ) ) != NULL )
			{
				locfil->f_Path = StringDup( path );
				
				locfil->f_SpecialData = FCalloc( sizeof( SpecialData ), 1 );
				
				locfil->f_Stream = s->f_Stream;
				locfil->f_FSys  = s->f_FSys;
				locfil->f_RootDevice = s;
				
				SpecialData *sd = (SpecialData *)locfil->f_SpecialData;
				
				if( sd )
				{
					SpecialData *locsd = (SpecialData *)s->f_SpecialData;
					sd->sb = locsd->sb;
					sd->sd_FileHandle = handle;
				}
				DEBUG("FileOpened, memory allocated for ssh2fs\n");
				
				// Free temp string
				FFree( comm );
				
				return locfil;
			}
			FFree( comm );
			return NULL;
		}
		else
		{
			FERROR("Cannot open file: %s  mode %s\n", comm, mode );
		}
		FFree( comm );
	}
	
	// Free commClean
	if( commClean )
	{
		FFree( commClean );
	}
	if( cleanPath )
	{
		FFree( cleanPath );
	}
	FERROR("Cannot open file %s\n", path );
	
	return NULL;
}

//
//
//

int FileClose( struct File *s, void *fp )
{
	if( fp != NULL )
	{
		//SpecialData *sdat = (SpecialData *)s->f_SpecialData;
		FHandler *fh = (FHandler *)s->f_FSys;
		HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
		int close = 0;
		
		File *lfp = ( File *)fp;
		
		if( lfp->f_SpecialData )
		{
			SpecialData *sd = ( SpecialData *)lfp->f_SpecialData;
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_lock( &hd->hd_Mutex );
#endif
			libssh2_sftp_close( sd->sd_FileHandle );
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_unlock( &hd->hd_Mutex );
#endif
			
			FFree( lfp->f_SpecialData );
		}
		
		if( lfp->f_Path ) FFree( lfp->f_Path );
		if( lfp->f_Buffer ) FFree( lfp->f_Buffer );
		FFree( lfp );
		
		DEBUG( "FileClose: Closing file pointer.\n" );
		
		return close;
	}
	
	return - 1;
}

//
// Read data from file
//

int FileRead( struct File *f, char *buffer, int rsize )
{
	int result = -2;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	
	if( sd != NULL )
	{
		FHandler *fh = NULL;
		HandlerData *hd = NULL;
		
		fh = (FHandler *)f->f_FSys;
		if( fh != NULL )
		{
			hd = (HandlerData *)fh->fh_SpecialData;
		}
		
#ifdef __ENABLE_MUTEX
		if( hd != NULL )
		{
			pthread_mutex_lock( &hd->hd_Mutex );
		}
#endif
		result = libssh2_sftp_read( sd->sd_FileHandle, buffer, rsize );
		
		if( f->f_Stream == TRUE && result > 0 )
		{
			sd->sb->sl_SocketInterface.SocketWrite( f->f_Socket, buffer, (FLONG)result );
		}
		
#ifdef __ENABLE_MUTEX
		if( hd != NULL )
		{
			pthread_mutex_unlock( &hd->hd_Mutex );
		}
#endif
	}
	DEBUG("FileRead %d\n", result );
	if( result <= 0 )
	{
		return -1;
	}
	
	return result;
}

//
// write data to file
//

int FileWrite( struct File *f, char *buffer, int wsize )
{
	int result = 0;
	char *bufptr = buffer;
	
	SpecialData *sd = (SpecialData *)f->f_SpecialData;
	if( sd )
	{
		FHandler *fh = NULL;
		HandlerData *hd = NULL;
		fh = (FHandler *)f->f_FSys;
		if( fh != NULL )
		{
			hd = (HandlerData *)fh->fh_SpecialData;
		}
		
#ifdef __ENABLE_MUTEX
		if( hd != NULL )
		{
			pthread_mutex_lock( &hd->hd_Mutex );
		}
#endif
		do
		{
			int rc = libssh2_sftp_write( sd->sd_FileHandle, bufptr, wsize );
			if( rc < 0 )
			{
				break;
			}
			bufptr += rc;
			wsize -= rc;
			result += rc;
		}
		while( wsize );
		
#ifdef __ENABLE_MUTEX
		if( hd != NULL )
		{
			pthread_mutex_unlock( &hd->hd_Mutex );
		}
#endif
	}
	DEBUG("FileWrite %d\n", result );
	return result;
}

//
//
//

int FileSeek( struct File *s, int pos )
{
	int result = -1;
	
	SpecialData *sd = (SpecialData *)s->f_SpecialData;
	if( sd )
	{
		libssh2_sftp_seek( sd->sd_FileHandle, pos );
	}
	DEBUG("Seek %d\n", result );
	return pos;
}

//
// GetDiskInfo
//

int GetDiskInfo( struct File *s __attribute__((unused)), int64_t *used, int64_t *size )
{
	*used = 0;
	*size = 0;
	return 0;
}

//
//
//

int MakeDir( struct File *s, const char *path )
{
	INFO("MakeDir!\n");
	int error = 0;
	
	int rspath = strlen( s->f_Path );
	int spath = strlen( path )+1;
	char *newPath;
	
	if( ( newPath = FCalloc( rspath+10, sizeof(char) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for new path\n");
		return -2;
	}
	SpecialData *sdat = (SpecialData *)s->f_SpecialData;
	FHandler *fh = (FHandler *)s->f_FSys;
	HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
	
	strcpy( newPath, s->f_Path );
	if( s->f_Path[ rspath-1 ] != '/' )
	{
		strcat( newPath, "/" );
	}
	
#ifdef __ENABLE_MUTEX
	pthread_mutex_lock( &hd->hd_Mutex );
#endif
	// Create a string that has the real file path of the file
	if( path != NULL )
	{
		char *directory = FCalloc( rspath + spath, sizeof( char ) );
		if( directory != NULL )
		{
			// Make the directories that do not exist
			int slashes = 0, i = 0; for( ; i < spath; i++ )
			{
				if( path[i] == '/' )
				{
					slashes++;
				}
			}
			
			if( slashes > 0 )
			{
				int slash = 0;
				for( i = 0; i < spath; i++ )
				{
					if( path[i] == '/' )
					{
						sprintf( directory, "%s%.*s", newPath, i, path );
						
						FERROR("PATH CREATED %s   NPATH %s   PATH %s\n", directory,  newPath, path );
						
						error = libssh2_sftp_mkdir( sdat->sftp_session, directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
						if( error != 0 )
						{
							ServerReconnect( sdat, hd );
							error = libssh2_sftp_mkdir( sdat->sftp_session, directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );
						}
						
						// Create if not exist!
						if( error != 0 )
						{
							FERROR( "Cannot create directory: %s\n", directory );
						}
					}
					slash++;
				}
			}
			//
			// We created directories to sign '/'
			// Now we create directory for fullpath
			
			//struct stat filest;
			
			sprintf( directory, "%s%s", newPath, path );
			error = libssh2_sftp_mkdir( sdat->sftp_session, directory, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH );

			FFree( directory );
		}
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
#endif
		
		FFree( newPath );
		return error;
	}
#ifdef __ENABLE_MUTEX
	pthread_mutex_unlock( &hd->hd_Mutex );
#endif
	FFree( newPath );
	
	return -1;
}

//
// rm files/dirs
//

static FLONG RemoveDirectory( SpecialData *sdat, const char *path )
{
	LIBSSH2_SFTP_HANDLE *sftphandle;
	FLONG r = 0;
	
	// Request a dir listing via SFTP 
	sftphandle = libssh2_sftp_opendir( sdat->sftp_session, path );
	int pathlen = strlen( path );
	
	if ( sftphandle != NULL )	// this is directory
	{
		do
		{
			char mem[512];
			char longentry[512];
			LIBSSH2_SFTP_ATTRIBUTES attrs;
			int r2 = 0;
			
			//DEBUG("Loop dir\n");
		
			// loop until we fail *
			int rc = libssh2_sftp_readdir_ex( sftphandle, mem, sizeof(mem), longentry, sizeof(longentry), &attrs);
			if( rc > 0 )//&&  > 0 && strcmp( mem, ".." ) > 0 )
			{
				if( strcmp( mem, ".") == 0 ){ continue; }
			
				if( strcmp( mem, "..") == 0 ){ continue; }
				
				int isDir = 0;
				if( longentry[ 0 ] == 'd' )
				{
					isDir = 1;
				}
			
				int len = pathlen + strlen( path ) + strlen( mem ); 
				char *buf = FCalloc( len , sizeof(char) );
			
				if ( buf != NULL )
				{
					snprintf( buf, len, "%s/%s", path, mem );

					if ( isDir == 1 )
					{
						r2 = RemoveDirectory( sdat, buf );
						libssh2_sftp_rmdir( sdat->sftp_session, buf );
					}
					else
					{
						r2 = libssh2_sftp_unlink( sdat->sftp_session, buf );
					}
					FFree(buf);
				}
			
				if( r2 != 0 )
				{
					break;
				}
			}
			else
			{
				break;
			}
		
		} while (1);
	
		libssh2_sftp_closedir( sftphandle );
		
		libssh2_sftp_rmdir( sdat->sftp_session, path );
	}
	else
	{
		r = libssh2_sftp_unlink( sdat->sftp_session, path );
	}
	
	return r;
}

//
//
//

FLONG Delete( struct File *s, const char *path )
{
	DEBUG("Delete!\n");
	
	// remove disk name
	char *pathNoDiskName = (char *)path;
	
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	SpecialData *sdat = (SpecialData *)s->f_SpecialData;
	
	int i;
	for( i = 0 ; i < spath ; i++ )
	{
		if( path[ i ] == ':' )
		{
			pathNoDiskName = (char *)&(path[ i+1 ]);
			spath -= i+1;
			break;
		}
	}
	
	char *comm = NULL;
	
	DEBUG("Delete new path size %d\n", rspath + spath );
	
	if( ( comm = FCalloc( rspath + spath + 10, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		
		if( comm[ strlen( comm ) -1] != '/' )
		{
			strcat( comm, "/" );
		}
		strcat( comm, pathNoDiskName );
		
		if( comm[ strlen( comm ) -1] == '/' )
		{
			comm[ strlen( comm ) -1] = 0;
		}
		
		DEBUG("Delete file or directory '%s'\n", comm );
		
		FHandler *fh = (FHandler *)s->f_FSys;
		HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
		
#ifdef __ENABLE_MUTEX
		pthread_mutex_lock( &hd->hd_Mutex );
#endif
		FLONG ret = RemoveDirectory( sdat, comm );
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
#endif
		
		FFree( comm );
		return ret;
	}
	
	DEBUG("Delete END\n");
	
	return 0;
}

//
//
//

int Rename( struct File *s, const char *path, const char *nname )
{
	DEBUG("Rename!  from %s to %s\n", path, nname );

	// remove disk name
	char *pathNoDiskName = (char *)path;
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	int i;
	for( i = 0 ; i < spath ; i++ )
	{
		if( path[ i ] == ':' )
		{
			pathNoDiskName = (char *)&(path[ i+1 ]);
			spath -= i+1;
			break;
		}
	}
	
	// 1a. is the source a folder? If so, remove trailing /
	char *targetPath = NULL;
	
	if( pathNoDiskName[spath-1] == '/' )
	{
		targetPath = FCalloc( spath, sizeof( char ) );
		sprintf( targetPath, "%.*s", spath - 1, pathNoDiskName );
	}
	else
	{
		targetPath = FCalloc( spath + 1, sizeof( char ) ); 
		sprintf( targetPath, "%.*s", spath, pathNoDiskName );
	}
	
	// 1b. Do we have a sub folder in path?
	int hasSubFolder = 0;
	int off = 0;
	int c = 0; for( ; c < spath; c++ )
	{
		if( targetPath[c] == '/' )
		{
			hasSubFolder++;
			off = c + 1;
		}
	}
	SpecialData *sdat = (SpecialData *)s->f_SpecialData;
	FHandler *fh = (FHandler *)s->f_FSys;
	HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
	
	// 2. Full path of source
	char *source = FCalloc( rspath + spath + 1, sizeof( char ) );
	sprintf( source, "%s%s", s->f_Path, targetPath );
	
	// 3. Ok if we have sub folder or not, add it to our destination
	char *dest = NULL;
	if( hasSubFolder > 0 )
	{
		dest = FCalloc( rspath + off + strlen( nname ) + 1, sizeof( char ) );
		sprintf( dest, "%.*s", rspath, s->f_Path );
		sprintf( dest + rspath, "%.*s", off, targetPath );
		sprintf( dest + rspath + off, "%s", nname );
	}
	else 
	{
		dest = FCalloc( rspath + strlen( nname ) + 1, sizeof( char ) );
		sprintf( dest, "%s", s->f_Path );
		sprintf( dest + rspath, "%s", nname );
	}
	
#ifdef __ENABLE_MUTEX
	pthread_mutex_lock( &hd->hd_Mutex );
#endif
	// 4. Execute!
	DEBUG( "executing: rename %s %s\n", source, dest );
	int res = libssh2_sftp_rename( sdat->sftp_session, source, dest );// rename( source, dest );
	if( res != 0 )
	{
		ServerReconnect( sdat, hd );
		res = libssh2_sftp_rename( sdat->sftp_session, source, dest );
	}
#ifdef __ENABLE_MUTEX
	pthread_mutex_unlock( &hd->hd_Mutex );
#endif
	
	// 5. Free up
	FFree( source );
	FFree( dest );
	FFree( targetPath );
	
	return res;
}

//
// Rename
//

int Copy( struct File *s __attribute__((unused)), const char *dst __attribute__((unused)), const char *src __attribute__((unused)) )
{
	DEBUG("Copy!\n");

	return 0;
}


//
//
//

BufString *Execute( struct File *s __attribute__((unused)), const char *dst __attribute__((unused)), const char *src __attribute__((unused)) )
{
	BufString *bs = BufStringNew();
	
	return bs;
}

//
// Get filename from path
//

char *GetFileName( const char *path )
{
	char *p = (char *)path;
	int i = strlen( path );

	for(  ; i > 0 ; i-- )
	{
		if( path[ i ] == '/' )
		{
			p = (char *)&path[ i+1 ];
			return p;
		}
	}
	
	return p;
}

//
// Get information about last file changes (seconds from 1970)
//

FLONG GetChangeTimestamp( struct File *s, const char *path )
{
	DEBUG("GetChangeTimestamp!\n");
	FLONG rettime = 0;
	
	int spath = 0;
	if( path != NULL )
	{
		spath = strlen( path );
	}
	int rspath = strlen( s->f_Path );
	SpecialData *sdat = (SpecialData *)s->f_SpecialData;
	
	if( sdat == NULL || sdat->sftp_session == NULL )
	{
		return 0;
	}

	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	//int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	char *tempString = FCalloc( rspath +512, sizeof(char) );
	
	if( ( comm = FCalloc( rspath + spath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}

		if( path != NULL )
		{
			strcat( comm, path );
		}
		
		FHandler *fh = (FHandler *)s->f_FSys;
		HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
		
#ifdef __ENABLE_MUTEX
		DEBUG("info lock %p\n", &hd->hd_Mutex );
		pthread_mutex_lock( &hd->hd_Mutex );
#endif
		
		DEBUG("PATH created %s\n", comm );
		
		LIBSSH2_SFTP_HANDLE *handle = libssh2_sftp_open( sdat->sftp_session, comm, LIBSSH2_FXF_READ, 0 );
		if( handle == NULL )
		{
			ServerReconnect( sdat, hd );
			handle = libssh2_sftp_open( sdat->sftp_session, comm, LIBSSH2_FXF_READ, 0 );
		}
		
		if( handle != NULL )
		{
			LIBSSH2_SFTP_ATTRIBUTES attrs;
			
			int err = libssh2_sftp_fstat( handle, &attrs);
			if( err == 0 )
			{
				rettime = attrs.mtime;
			}
			
			libssh2_sftp_close_handle( handle );
		}
		
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
		DEBUG("intfo SFTP unlock %p\n", &hd->hd_Mutex );
#endif
		
		FFree( comm );
	}
	FFree( tempString );
	
	DEBUG("Info END\n");
	return rettime;
}

//
// Get info about file/folder and return as "string"
//

BufString *Info( File *s, const char *path )
{
	DEBUG("Info!\n");
	
	BufString *bs = BufStringNew();
	
	int spath = 0;
	if( path != NULL )
	{
		spath = strlen( path );
	}
	int rspath = strlen( s->f_Path );
	SpecialData *sdat = (SpecialData *)s->f_SpecialData;
	
	if( sdat == NULL || sdat->sftp_session == NULL )
	{
		BufStringAdd( bs, "fail<!--separate-->Could not open directory.");
		
		return bs;
	}
	
	BufStringAdd( bs, "ok<!--separate-->");
	
	DEBUG("Info!\n");
	
	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	//int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	char *tempString = FCalloc( rspath +512, sizeof(char) );
	
	if( ( comm = FCalloc( rspath + spath + 512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			strcat( comm, "/" );
		}
		//strcat( comm, &(path[ doub+2 ]) );
		if( path != NULL )
		{
			strcat( comm, path );
		}
		
		FHandler *fh = (FHandler *)s->f_FSys;
		HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
		
#ifdef __ENABLE_MUTEX
		DEBUG("info lock %p\n", &hd->hd_Mutex );
		pthread_mutex_lock( &hd->hd_Mutex );
#endif
		
		DEBUG("PATH created %s\n", comm );
		
		LIBSSH2_SFTP_HANDLE *handle = libssh2_sftp_open( sdat->sftp_session, comm, LIBSSH2_FXF_READ, 0 );
		if( handle == NULL )
		{
			ServerReconnect( sdat, hd );
			handle = libssh2_sftp_open( sdat->sftp_session, comm, LIBSSH2_FXF_READ, 0 );
		}
		
		DEBUG("info handle %p\n", handle );
		
		if( handle != NULL )
		{
			LIBSSH2_SFTP_ATTRIBUTES attrs;
			
			int err = libssh2_sftp_fstat( handle, &attrs);
			DEBUG("FStat success %d\n", err );
			if( err == 0 )
			{
				BufStringAdd( bs, "{ \"Filename\":\"");

				char *fname = (char *)path;
				int i;
				for( i=spath ; i >= 0 ; i-- )
				{
					if( path[ i ] == '/' )
					{
						fname = (char *)&path[ i+1 ];
					}
				}
				BufStringAdd( bs, fname );
				BufStringAdd( bs, "\",");
				
				int isDir = LIBSSH2_SFTP_S_ISDIR( attrs.permissions ) ? 1 : 0;
				
				DEBUG("FSSH2: is dir %d\n", isDir );
				
				BufStringAdd( bs, " \"Path\":\"");
				if( isDir == 1 )
				{
					//sprintf( tmp, "\"Path\":\"%s/\",", &path[ strlen( d->f_Path ) ] );
					int size = 0;
					if( path[ 0 ] == '/' )
					{
						size = sprintf( tempString, "%s", &path[ 1 ] );
					}
					else
					{
						size = sprintf( tempString, "%s", path );
					}
					BufStringAddSize( bs, tempString, size );
					BufStringAdd( bs, "/\",");
				}
				else
				{
					int size = 0;
					if( path[ 0 ] == '/' )
					{
						size = sprintf( tempString, "%s", &path[ 1 ] );
					}
					else
					{
						size = sprintf( tempString, "%s", path );
					}
					BufStringAddSize( bs, tempString, size );
					BufStringAdd( bs, tempString );
					BufStringAdd( bs, "\",");
				}
				
				DEBUG("ISDIR %d\n", isDir );
				
				char tmp[ 256 ];
				//BufStringAdd( bs, tmp );
				sprintf( tmp, "\"Filesize\": %llu,", attrs.filesize );
				BufStringAdd( bs, tmp );
				
				char *timeStr = FCalloc( 40, sizeof( char ) );
				strftime( timeStr, 36, "%Y-%m-%d %H:%M:%S", localtime( (const time_t *)&(attrs.mtime) ) );
				sprintf( tmp, "\"DateModified\": \"%s\",", timeStr );
				BufStringAdd( bs, tmp );
				strftime( timeStr, 36, "%Y-%m-%d %H:%M:%S", localtime( (const time_t *)&(attrs.atime) ) );
				sprintf( tmp, "\"DateAccessed\": \"%s\",", timeStr );
				BufStringAdd( bs, tmp );
				FFree( timeStr );
				
				if( isDir )
				{
					BufStringAdd( bs,  "\"MetaType\":\"Directory\",\"Type\":\"Directory\" }" );
				}
				else
				{
					BufStringAdd( bs, "\"MetaType\":\"File\",\"Type\":\"File\" }" );
				}
			}
			
			libssh2_sftp_close_handle( handle );
		}
		
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
		DEBUG("intfo SFTP unlock %p\n", &hd->hd_Mutex );
#endif
		
		FFree( comm );
	}
	FFree( tempString );
	
	DEBUG("Info END\n");

	return bs;
}

//
// Call a library
//

BufString *Call( File *s __attribute__((unused)), const char *path __attribute__((unused)), char *args __attribute__((unused)) )
{
	DEBUG("Info!\n");
	BufString *bs = BufStringNew();
	BufStringAdd( bs, "fail<!--separate-->");	
	DEBUG("Info END\n");
	return bs;
}

//
// return content of directory
//

BufString *Dir( File *s, const char *path )
{
	BufString *bs = BufStringNew();
	
	int rspath = strlen( s->f_Path );
	
	DEBUG("Dir!\n");
	
	// user is trying to get access to not his directory
	
	//int doub = strlen( s->f_Name );
	
	char *comm = NULL;
	char *tempString = FCalloc( rspath +512, sizeof(char) );
	
	if( ( comm = FCalloc( rspath +512, sizeof(char) ) ) != NULL )
	{
		strcpy( comm, s->f_Path );
		if( comm[ strlen( comm ) -1 ] != '/' && s->f_Path[ strlen(s->f_Path)-1 ] != '/' )
		{
			DEBUG("Added '/\n");
			strcat( comm, "/" );
		}
		
		if( path != NULL )
		{
			strcat( comm, path ); //&(path[ doub+1 ]) );
		}
		
		if( comm[ strlen( comm ) -1 ] != '/' )
		{
			DEBUG("end was not endeed /\n");
			strcat( comm, "/" );
		}
		
		LIBSSH2_SFTP_HANDLE *sftphandle;
		
		SpecialData *sd = (SpecialData *)s->f_SpecialData;
		FHandler *fh = (FHandler *)s->f_FSys;
		HandlerData *hd = (HandlerData *)fh->fh_SpecialData;
		SystemBase *sb = (SystemBase *)sd->sb;
		
#ifdef __ENABLE_MUTEX
		DEBUG("locking %p\n", &hd->hd_Mutex );
		pthread_mutex_lock( &hd->hd_Mutex );
#endif
		
		DEBUG("lock passed %p %p\n", sd, sd->sftp_session );
		
		if( sd != NULL && sd->sftp_session != NULL )
		{
			// Request a dir listing via SFTP 
			sftphandle = libssh2_sftp_opendir( sd->sftp_session, comm );
			if( sftphandle == NULL )
			{
				ServerReconnect( sd, hd );
				sftphandle = libssh2_sftp_opendir( sd->sftp_session, comm );
			}
			DEBUG("Dir opened\n");
			
			if ( sftphandle == NULL)
			{
				FERROR( "Unable to open dir with SFTP: %s\n", comm );
				BufStringAdd( bs, "fail<!--separate-->Could not open directory.");
				
#ifdef __ENABLE_MUTEX
				pthread_mutex_unlock( &hd->hd_Mutex );
#endif
				return bs;
			}
			else
			{
				
			}
			FERROR( "libssh2_sftp_opendir() is done, now receive listing!\n");
#ifdef __ENABLE_MUTEX
			pthread_mutex_unlock( &hd->hd_Mutex );
#endif
		}
		else
		{
			BufStringAdd( bs, "fail<!--separate-->Could not open directory.");
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_unlock( &hd->hd_Mutex );
#endif
			return bs;
		}
		int pos = 0;
		
		BufStringAdd( bs, "ok<!--separate-->");
		BufStringAdd( bs, "[" );
		
		DEBUG("------>comm %s\n", comm );
		
		do
		{
			char mem[512];
			char longentry[512];
			char *fname = NULL;
			LIBSSH2_SFTP_ATTRIBUTES attrs;
			
			DEBUG("dir\n");
			
#ifdef __ENABLE_MUTEX
			pthread_mutex_lock( &hd->hd_Mutex );
#endif
			// loop until we fail *
			int rc = libssh2_sftp_readdir_ex( sftphandle, mem, sizeof(mem), longentry, sizeof(longentry), &attrs);
#ifdef __ENABLE_MUTEX
			pthread_mutex_unlock( &hd->hd_Mutex );
#endif
			if( rc > 0 )//&&  > 0 && strcmp( mem, ".." ) > 0 )
			{
				DEBUG("FILE/DIR >%s<\n", mem );
				if( strcmp( mem, ".") == 0 )
				{
					continue;
				}
				
				if( strcmp( mem, "..") == 0 )
				{
					continue;
				}
				
				if( ( fname = sb->sl_StringInterface.EscapeStringToJSON( mem ) ) == NULL )
				{
					fname = mem;
				}
				
				if( fname != mem )
				{
					DEBUG("==============================================New file name: %s\n", fname );
				}
				
				if( pos == 0 )
				{
					BufStringAdd( bs, "{ \"Filename\":\"");
				}
				else
				{
					BufStringAdd( bs, ",{ \"Filename\":\"");
				}
				BufStringAdd( bs, fname );
				BufStringAdd( bs, "\",");
				
				int isDir = 0;

				BufStringAdd( bs, " \"Path\":\"");
				if( longentry[ 0 ] == 'd' )
				{
					isDir = 1;
					//sprintf( tmp, "\"Path\":\"%s/\",", &path[ strlen( d->f_Path ) ] );
					int size = 0;
					if( path[ 0 ] == '/' )
					{
						size = sprintf( tempString, "%s%s", &path[ 1 ], fname );
					}
					else
					{
						size = sprintf( tempString, "%s%s", path, fname );
					}
					BufStringAddSize( bs, tempString, size );
					BufStringAdd( bs, "/\",");
				}
				else
				{
					isDir = 0;
					int size = 0;
					if( path[ 0 ] == '/' )
					{
						size = sprintf( tempString, "%s%s", &path[ 1 ], fname );
					}
					else
					{
						size = sprintf( tempString, "%s%s", path, fname );
					}
					BufStringAddSize( bs, tempString, size );
					//BufStringAdd( bs, tempString );
					BufStringAdd( bs, "\",");
				}
				
				//DEBUG("ISDIR %d NAME %d LONG %s\n", isDir, mem, longentry );
				
				char tmp[ 256 ];
				sprintf( tmp, "\"Filesize\": %llu,", attrs.filesize );
				BufStringAdd( bs, tmp );
				
				char *timeStr = FCalloc( 40, sizeof( char ) );
				strftime( timeStr, 36, "%Y-%m-%d %H:%M:%S", localtime( (const time_t *)&(attrs.mtime) ) );
				sprintf( tmp, "\"DateModified\": \"%s\",", timeStr );
				BufStringAdd( bs, tmp );
				FFree( timeStr );
				
				if( isDir )
				{
					BufStringAdd( bs,  "\"MetaType\":\"Directory\",\"Type\":\"Directory\" }" );
				}
				else
				{
					BufStringAdd( bs, "\"MetaType\":\"File\",\"Type\":\"File\" }" );
				}
				 
				 if( longentry[0] != '\0' )
				 {
					 //printf("%s\n", longentry);
				 }
				 else
				 {
					 /*
					 if(attrs.flags & LIBSSH2_SFTP_ATTR_PERMISSIONS) {
						 // this should check what permissions it  is and print the* output accordingly 
						 printf("--fix----- ");
					 }
					 else {
						 printf("---------- ");
					 }
					 
					 if(attrs.flags & LIBSSH2_SFTP_ATTR_UIDGID) {
						 printf("%4ld %4ld ", attrs.uid, attrs.gid);
					 }
					 else {
						 printf("   -    - ");
					 }
					 
					 if(attrs.flags & LIBSSH2_SFTP_ATTR_SIZE) {
						 printf("%8" PRIu64 " ", attrs.filesize);
					 }
					 */
					 //printf("%s\n", mem);
				 }
				 pos++;
				 
				if( fname != mem )
				{
					FFree( fname );
					fname = NULL;
				}
			}
			else
			{
				break;
			}
			
		} while (1);
		
#ifdef __ENABLE_MUTEX
		pthread_mutex_lock( &hd->hd_Mutex );
#endif
		libssh2_sftp_closedir( sftphandle );
#ifdef __ENABLE_MUTEX
		pthread_mutex_unlock( &hd->hd_Mutex );
#endif
		
		BufStringAdd( bs, "]" );
		
		//DEBUG("------------>%s\n", bs->bs_Buffer );
		
		FFree( comm );
	}
	FFree( tempString );
	DEBUG("Dir END\n");
	
	return bs;
}

//
// Get metadata
//

char *InfoGet( struct File *f __attribute__((unused)), const char *path __attribute__((unused)), const char *key __attribute__((unused)) )
{

	
	return NULL;
}

//
// set metadata
//

int InfoSet( File *f __attribute__((unused)), const char *path __attribute__((unused)), const char *key __attribute__((unused)), const char *value __attribute__((unused)) )
{
	
	
	return 0;
}

