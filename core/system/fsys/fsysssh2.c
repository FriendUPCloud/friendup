/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include "systembase.h"
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

#define SUFFIX "fsys"
#define PREFIX "ssh2"

int UnMount( struct FHandler *s, void *f );

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
	
	char										*sd_LoginUser;		// login user
	char										*sd_LoginPass;		// login password
	int 										sd_Port;				// port
	char										*sd_Host;			// host
}SpecialData;


const char *GetSuffix()
{
	return SUFFIX;
}

const char *GetPrefix()
{
	return PREFIX;
}

//
// additional stuff
//


char* StringDup( const char* str )
{
	if( str == NULL)
	{
		DEBUG("Cannot copy string!\n");
		return NULL;
	}
	
	int len = strlen( str );
	char *res = NULL;
	if( ( res = calloc( len+1, sizeof(char) ) ) != NULL )
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
	if( s )
		return;
	//s->Info = dlsym( s->handle, "Info" );
}

//
//
//

void deinit( struct FHandler *s )
{
	
}

//
// Mount device
//

void *Mount( struct FHandler *s, struct TagItem *ti )
{
	File *dev = NULL;
	char *path = NULL;
	char *name = NULL;
	char *host = NULL;
	char *ulogin = NULL;
	char *upass = NULL;
	int port = 22;
	User *usr = NULL;
	
	if( s == NULL )
	{
		return NULL;
	}
	
	DEBUG("Mounting ssh2 filesystem!\n");
	
	if( ( dev = calloc( sizeof( File ), 1 ) ) != NULL )
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
				case FSys_Mount_Host:
					host = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_Port:
					port = atol( (char *)lptr->ti_Data );
					break;
				case FSys_Mount_Name:
					name = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_User:
					usr = (User *)lptr->ti_Data;
					break;
				case FSys_Mount_LoginUser:
					ulogin = (char *)lptr->ti_Data;
					break;
				case FSys_Mount_LoginPass:
					upass = (char *)lptr->ti_Data;
					break;
			}
		
			lptr++;
		}
		
		//
		
		if( path == NULL )
		{
			DEBUG("[ERROR]: Path option not found!\n");
			free( dev );
			return NULL;
		}
		
		init( s );
		
		// we are trying to open folder/connection
		
		struct stat st;
		if( stat( path, &st ) == 0 && S_ISDIR( st.st_mode ) )
		{
			DEBUG("Mounting localfsys, Its directory FSYS: %s!\n", s->GetPrefix() );
			
			dev->f_Path = StringDup( path );
			DEBUG("localfs path is ok '%s'\n", dev->f_Path );
			dev->f_FSys = s;
			dev->f_Type = FType_Directory;
			dev->f_Size = 0;
			dev->f_Position = 0;
			dev->f_User = usr;
			dev->f_Name = StringDup( name );
			
			
			
			DEBUG("data filled\n");
		}
		
	}
	
	//
	// we will hold here special data SSH2
	//
	
	dev->f_SpecialData = calloc( sizeof(SpecialData), 1 );
	SpecialData *sdat = (SpecialData *) dev->f_SpecialData;
	if( sdat != NULL )
	{
		sdat->sd_Host = StringDup( host );
		sdat->sd_Port = port;
		sdat->sd_LoginUser = StringDup( ulogin );
		sdat->sd_LoginPass = StringDup( upass );
		
		sdat->rc = libssh2_init (0);
		
		if( sdat->rc != 0 )
		{
			ERROR ( "libssh2 initialization failed (%d)\n", sdat->rc );
			return NULL;
		}
 
		// Ultra basic "connect to port 22 on localhost".  Your code is
		//responsible for creating the socket establishing the connection
		/// 
		sdat->hostaddr = inet_addr( sdat->sd_Host );
		
		sdat->sock = socket( AF_INET, SOCK_STREAM, 0 );
 
		sdat->sin.sin_family = AF_INET;
		sdat->sin.sin_port = htons( sdat->sd_Port );
		sdat->sin.sin_addr.s_addr = sdat->hostaddr;
		
		if ( connect( sdat->sock, (struct sockaddr*)( &(sdat->sin) ), sizeof(struct sockaddr_in)) != 0) 
		{
			ERROR( "failed to connect!\n");
			goto shutdown;
		}
 
		// Create a session instance and start it up. This will trade welcome
		// banners, exchange keys, and setup crypto, compression, and MAC layers
		// 
		sdat->session = libssh2_session_init( );

		if (libssh2_session_handshake( sdat->session, sdat->sock) ) 
		{
			ERROR("Failure establishing SSH session\n");
			goto shutdown;
		}
 
		// At this point we havn't authenticated. The first thing to do is check
		// the hostkey's fingerprint against our known hosts Your app may have it
		// hard coded, may go to a file, may present it to the user, that's your
		// call
		// 
		sdat->fingerprint = libssh2_hostkey_hash( sdat->session, LIBSSH2_HOSTKEY_HASH_SHA1 );

		DEBUG("Fingerprint: ");
		int i;
		
		for(i = 0; i < 20; i++) 
		{
			DEBUG(  "%02X ", (unsigned char)sdat->fingerprint[i]);
		}
		DEBUG("\n");
 
		
		sdat->rc = libssh2_userauth_password( sdat->session, sdat->sd_LoginUser, sdat->sd_LoginPass );
/*
		if (!(sdat->channel = libssh2_channel_open_session(session))) 
		{
			ERROR( "Unable to open a session\n");
			goto shutdown;
		}*/
		sdat->sftp_session = libssh2_sftp_init( sdat->session );

 
		if (!sdat->sftp_session) 
		{
			DEBUG("Unable to init SFTP session\n");
			goto shutdown;
		}
 
		/* Since we have not set non-blocking, tell libssh2 we are blocking */ 
		libssh2_session_set_blocking( sdat->session, 1);
		
		return dev;
	}
	

	DEBUG("localfs mount ok\n");
	
shutdown:
	if( sdat != NULL )
	{
		UnMount( s, dev );
	}
	
	return NULL;
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
			
			libssh2_sftp_shutdown( sdat->sftp_session);
			
			libssh2_session_disconnect( sdat->session,  "Normal Shutdown, Thank you for playing");
			libssh2_session_free(sdat->session);

			close( sdat->sock);
			DEBUG("all done!\n");
			libssh2_exit();
			
			if( sdat->sd_Host ){ free( sdat->sd_Host ); }
			if( sdat->sd_LoginUser ){ free( sdat->sd_LoginUser ); }
			if( sdat->sd_LoginPass ){ free( sdat->sd_LoginPass ); }
			
			free( lf->f_SpecialData );
		}
		
		if( lf->f_Name ){ free( lf->f_Name ); }
		if( lf->f_Path ){ free( lf->f_Path ); }
		
		//free( f );
	}
	
	return 0;
}

//
//
//

void *FileOpen( struct File *s, const char *path, int mode )
{
	return NULL;
}

//
//
//

int FileClose( struct File *s, void *fp )
{
	return 0;
}

//
//
//

int FileRead( struct File *s, void *fp, char *b, int size )
{
	return 0;
}

//
//
//

int FileWrite( struct File *s, void *fp, char *b, int size )
{
	return 0;
}

//
//
//

int FileSeek( struct File *s, int pos )
{
	return 0;
}

//
//
//

int MakeDir( struct File *s, const char *path )
{
	return 0;
}

//
//
//

int Delete( struct File *s, const char *path )
{
	return 0;
}

//
//
//

int Rename( struct File *s, const char *path, const char *nname )
{
	return 0;
}

//
// Rename
//

int Copy( struct File *s, const char *dst, const char *src )
{
	DEBUG("Copy!\n");

	return 0;
}


//
//
//

BufString *Execute( struct File *s, const char *dst, const char *src )
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
// Fill buffer with data from stat
//

void FillStat( BufString *bs, struct stat *s, File *f, const char *path )
{
	char tmp[ 1024 ];
	int rootSize = strlen( f->f_Path );
	int pathSize = strlen( path );
	
	DEBUG("FILLSTAT path '%s' rootpath '%s'  %d\n", path, f->f_Path, path[ strlen( f->f_Path ) ] );
			
	BufStringAdd( bs, "{" );
	sprintf( tmp, "\"filename\":\"%s\",", GetFileName( path ) );
	BufStringAdd( bs, tmp );
	
	//DEBUG( "FILLSTAT filename set\n");
	
	if( rootSize != pathSize )
	{
		sprintf( tmp, "\"path\":\"%s:%s\",", f->f_Name, &path[ strlen( f->f_Path ) ] );
	}else{
		sprintf( tmp, "\"path\":\"%s:\",", f->f_Name );
	}
	
	//DEBUG( "FILLSTAT fullname set\n");
	
	BufStringAdd( bs, tmp );
	sprintf( tmp, "\"filesize\": %d,", (int)s->st_size );
	BufStringAdd( bs, tmp );
	
	//DEBUG( "FILLSTAT filesize set\n");
	
	if( S_ISDIR( s->st_mode ) )
	{
		BufStringAdd( bs, "\"type\":\"DIR\", }" );
	}else{
		BufStringAdd( bs, "\"type\":\"FILE\" }" );
	}
	
	//DEBUG( "FILLSTAT END\n");
}

//
// Get info about file/folder and return as "string"
//

BufString *Info( File *s, const char *path )
{
	DEBUG("Info!\n");
	
	BufString *bs = BufStringNew();
	int spath = strlen( path );
	int rspath = strlen( s->f_Path );
	
	DEBUG("Info!\n");
	
	// user is trying to get access to not his directory
	DEBUG("Check access for path '%s' in root path '%s'  name '%s'\n", path, s->f_Path, s->f_Name );
	
	if( strncmp( path, s->f_Path, rspath ) != 0 )
	{
		BufStringAdd( bs, "{ \"ErrorMessage\": \"No access to file\"}" );
	}else{
		struct stat ls;
		
		if( stat( path, &ls ) == 0 )
		{
			FillStat( bs, &ls, s, path );
		}else{
			BufStringAdd( bs, "{ \"ErrorMessage\": \"File or directory do not exist\"}" );
		}
	}
	DEBUG("Info END\n");
	
	return bs;
}

//
// return content of directory
//
	
BufString *Dir( File *s, const char *path )
{
	BufString *bs = BufStringNew();
	
	/*
	     // Request a dir listing via SFTP 
    sftp_handle = libssh2_sftp_opendir(sftp_session, sftppath);

 
    if (!sftp_handle) {
        fprintf(stderr, "Unable to open dir with SFTP\n");
        goto shutdown;
    }
    fprintf(stderr, "libssh2_sftp_opendir() is done, now receive listing!\n");

    do {
        char mem[512];
        char longentry[512];
        LIBSSH2_SFTP_ATTRIBUTES attrs;
 
        // loop until we fail 
        rc = libssh2_sftp_readdir_ex(sftp_handle, mem, sizeof(mem),

                                     longentry, sizeof(longentry), &attrs);
        if(rc > 0) {
            // rc is the length of the file name in the mem
            //   buffer 
 
            if (longentry[0] != '\0') {
                printf("%s\n", longentry);
            } else {
                if(attrs.flags & LIBSSH2_SFTP_ATTR_PERMISSIONS) {
                    // this should check what permissions it
                    //   is and print the output accordingly 
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
 
                printf("%s\n", mem);
            }
        }
        else
            break;
 
    } while (1);
 
    libssh2_sftp_closedir(sftp_handle);
	 */
	
	/*
	int rspath = strlen( s->f_Path );
	
	DEBUG("Dir!\n");
	
	// user is trying to get access to not his directory
	
	if( strncmp( path, s->f_Path, rspath ) != 0 )
	{
		BufStringAdd( bs, "{ \"ErrorMessage\": \"No access to file/directory\"}" );
	}else{
		char tempString[ 1024 ];
		DIR           *d;
		struct dirent *dir;
		d = opendir( path );
		
		if( d )
		{
			while ((dir = readdir(d)) != NULL)
			{
				sprintf( tempString, "%s%s", path, dir->d_name );
				
				struct stat ls;
		
				if( stat( tempString, &ls ) == 0 )
				{
					FillStat( bs, &ls, s, tempString );
				}
			}
			
			closedir( d );
		}
	}
	DEBUG("Dir END\n");
	*/
	
	return bs;
}

//
//
//

BufString *OpenDirectory( struct File *s, const char *path )
{
	BufString *bs = BufStringNew();
	
	return bs;
}

//
//
//

BufString *OpenParentrDirectory( struct File *s )
{
	BufString *bs = BufStringNew();
	
	return bs;
}

