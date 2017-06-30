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

/** @file
 * 
 *  SSH server body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include "ssh_server.h"

/* This is a sample implementation of a libssh based SSH server */
/*
Copyright 2003-2009 Aris Adamantiadis
This file is part of the SSH Library
You are free to copy this file, modify it in any way, consider it being public
domain. This does not apply to the rest of the library though, but it is
allowed to cut-and-paste working code from this file to any license of
program.
The goal is to show the API in action. It's not a reference on how terminal
clients must be made or how a client should react.
*/

//#include "config.h"

#include <libssh/libssh.h>
#include <libssh/server.h>
#include <system/auth/authmodule.h>
#include <system/systembase.h>

#ifdef HAVE_ARGP_H
#include <argp.h>
#endif
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <libssh/callbacks.h>
#include <signal.h>
#include <core/friend_core.h>
#include <util/sha256.h>
#include <sys/resource.h>

#define ENABLE_SSH 1

extern struct SystemBase *SLIB;

/**
 * Create new SSHServer
 *
 * @param lsb pointer to SystemBase
 * @return SSHServer structure or NULL when error appear
 */

SSHServer *SSHServerNew( void *lsb )
{
	SSHServer *ts = NULL;

	if( ( ts = FCalloc( 1, sizeof( SSHServer ) ) ) != NULL )
	{
	/*
		ssh_threads_set_callbacks( ssh_threads_get_pthread() );
		ssh_init();
		
		ts->sshs_SB = lsb;
		
		DEBUG("Starting SSH thread\n");
	
		ts->sshs_Thread = ThreadNew( SSHThread, ts, TRUE );
		*/
	}
	return ts;
}

/**
 * Delete SSHServer
 *
 * @param ts pointer to SSHServer structure
 */

void SSHServerDelete( SSHServer *ts )
{
	if( ts != NULL )
	{
		ts->sshs_Quit = TRUE;
		/*
		if( ts->sshs_Thread )
		{
			ThreadDelete( ts->sshs_Thread );
		}
		ssh_finalize();
		*/
		
		FFree( ts );
	}
}

#ifdef ENABLE_SSH	
#ifdef WITH_PCAP
const char *pcap_file="debug.server.pcap";
ssh_pcap_file pcap;

void set_pcap(ssh_session session);
void set_pcap(ssh_session session){
	if(!pcap_file)
		return;
	pcap=ssh_pcap_file_new();
	if(ssh_pcap_file_open(pcap,pcap_file) == SSH_ERROR){
		printf("Error opening pcap file\n");
		ssh_pcap_file_free(pcap);
		pcap=NULL;
		return;
	}
	ssh_set_pcap_file(session,pcap);
}

void cleanup_pcap(void);
void cleanup_pcap(){
	ssh_pcap_file_free(pcap);
	pcap=NULL;
}
#endif
#endif

/**
 * SSH authentication checking function
 *
 * @param session ssh_session
 * @param uname user name
 * @param password user password
 * @param userdata pointer to user session data
 * @return SSH_AUTH_SUCCESS when succedd, otherwise error number
 */

static int auth_password( ssh_session session, const char *uname, const char *password, void *userdata )
{
	SSHSession *s = (SSHSession *)userdata;
	SystemBase *sb = (SystemBase *)s->sshs_SB;
	
	DEBUG("Authenticating user %s pwd %s\n", uname, password );
	
	AuthMod *ulib = sb->AuthModuleGet( sb );
	
	DEBUG("Gettings message login/pass\n");
	
	if( uname != NULL && password != NULL )
	{
		DEBUG("uname %s password %s ulib %p\n", uname, password, ulib );
		s->sshs_Usr = UMUserGetByNameDB( sb->sl_UM, uname );
		
		DEBUG("User %p\n", s->sshs_Usr );
		if( s->sshs_Usr != NULL )
			//&& strcmp( password, s->sshs_Usr->u_Password ) == 0  )
		{
			if( s->sshs_Usr->u_Password[ 0 ] == '{' &&
				s->sshs_Usr->u_Password[ 1 ] == 'S' &&
				s->sshs_Usr->u_Password[ 2 ] == '6' &&
				s->sshs_Usr->u_Password[ 3 ] == '}' )
			{
				FCSHA256_CTX ctx;
				unsigned char hash[ 32 ];
				char hashTarget[ 64 ];
				char newPassword[ 128 ];
				
				strcpy( newPassword, "HASHED" );
		
				DEBUG("Checkpassword, password is in SHA256 format for user %s\n", s->sshs_Usr->u_Name );
		
				Sha256Init( &ctx );
				Sha256Update( &ctx, (unsigned char *) password, (unsigned int)strlen( password ) ); //&(usr->u_Password[4]), strlen( usr->u_Password )-4 );
				Sha256Final( &ctx, hash );
		
				int i;
				int j=0;
		
				for( i=0 ; i < 64 ; i+= 2 )
				{
					sprintf( &(hashTarget[ i ]), "%02x", (char )hash[ j ] & 0xff );
					j++;
				}
				DEBUG("Checking provided password '%s' versus active password '%s'\n", hashTarget, s->sshs_Usr->u_Password );
				
				strcat( newPassword, hashTarget );
				
				DEBUG("new password '%s' \n", newPassword );
				
				Sha256Init( &ctx );
				Sha256Update( &ctx, (unsigned char *) newPassword, (unsigned int)strlen( newPassword ) );
				Sha256Final( &ctx, hash );
				
				j=0;
				for( i=0 ; i < 64 ; i+= 2 )
				{
					sprintf( &(hashTarget[ i ]), "%02x", (char )hash[ j ] & 0xff );
					j++;
				}
		
				DEBUG("Checking provided password '%s' versus active password '%s'\n", hashTarget, s->sshs_Usr->u_Password );
		
				if( strncmp( &(hashTarget[0]), &(s->sshs_Usr->u_Password[4]), 64 ) == 0 )
				{
					s->sshs_Authenticated = 1;
					DEBUG("Authenticated\n");
					
					sb->AuthModuleDrop( sb, ulib );
					return SSH_AUTH_SUCCESS;
				}
			}
		}
		DEBUG("Not authenticated\n");
	}

	if( s->sshs_Tries >= 3 )
	{
		DEBUG("Too many authentication tries\n");
		ssh_disconnect(session);
		s->sshs_Error = 1;
		sb->AuthModuleDrop( sb, ulib );
		return SSH_AUTH_DENIED;
	}
	s->sshs_Tries++;
	sb->AuthModuleDrop( sb, ulib );
//#endif	
	return SSH_AUTH_DENIED;
}

//
// Checking another way of authorisation
//

static int auth_gssapi_mic( ssh_session session, const char *user, const char *principal, void *userdata )
{
#ifdef ENABLE_SSH	
	SSHSession *s = (SSHSession *)userdata;
	/*
	ssh_gssapi_creds creds = ssh_gssapi_get_creds(session);
	
	
	printf("Authenticating user %s with gssapi principal %s\n",user, principal );
	if (creds != NULL)
	{
		printf("Received some gssapi credentials\n");
	}else{
		printf("Not received any forwardable creds\n");
	}
	*/
	DEBUG("authenticated\n");
	s->sshs_Authenticated = 1;
#endif
	
	return SSH_AUTH_SUCCESS;
}

//
// Terminal requests
//

static int pty_request( ssh_session session, ssh_channel channel, const char *term,
        int x,int y, int px, int py, void *userdata )
{
	SSHSession *s = (SSHSession *)userdata;
	
    (void) session;
    (void) channel;
    (void) term;
    (void) x;
    (void) y;
    (void) px;
    (void) py;
    DEBUG("Allocated terminal\n");
    return 0;
}

//
// Shell requests
//

static int shell_request( ssh_session session, ssh_channel channel, void *userdata )
{
	SSHSession *s = (SSHSession *)userdata;
	(void)session;
	(void)channel;
    
	DEBUG("Allocated shell\n");
	return 0;
}

//
// Data arrived on channel, callback
//

int mchannel_data_callback(ssh_session session, ssh_channel channel, void *data, uint32_t len, int is_stderr, void *userdata )
{
	SSHSession *s = (SSHSession *)userdata;

	DEBUG("Data arrived %d\n", len );
	return 0;
}

//
// exec requests
//

int mchannel_exec_request_callback(ssh_session session, ssh_channel channel, const char *command, void *userdata )
{
	printf("Command arrived\n");
	return 0;
}

struct ssh_channel_callbacks_struct channel_cb = {
	//.channel_pty_request_function = pty_request,		// if we want to have terminal
	.channel_shell_request_function = shell_request,
	.channel_data_function = mchannel_data_callback,
	.channel_exec_request_function = mchannel_exec_request_callback,
};

//
// New session
//

static ssh_channel new_session_channel( ssh_session session, void *userdata )
{
	SSHSession *s = (SSHSession *)userdata;
	(void) session;
	
	if( s->sshs_Chan != NULL)
	{
		FERROR("New session channel\n");
		return NULL;
	}
	printf("Allocated session channel\n");
	s->sshs_Chan = ssh_channel_new( session );
	ssh_callbacks_init( &channel_cb );
	ssh_set_channel_callbacks( s->sshs_Chan, &channel_cb );
	
	return s->sshs_Chan;
}

/**
 * handle all Friend SSH commands
 *
 * @param sess pointer to SSHSession
 * @param buf received data
 * @param size of received data
 * @return 0 when success, otherwise error number
 */

int handleSSHCommands( SSHSession *sess, const char *buf, const int len )
{	
	char outbuf[ 2048 ];
	
	if( strncmp( buf, "help", 4 ) == 0 )
	{
		strcpy( outbuf, 	"Main commands:\n" \
			" logout - logout user from current session\n" \
			" cd - change current directory\n" \
			" shutdown - shutdown FriendCore\n" \
			);
		
		ssh_channel_write( sess->sshs_Chan, outbuf, strlen( buf ) );
	
	}else if( strncmp( buf, "logout", 6 ) == 0 )
	{
		sess->sshs_Quit = TRUE;
	}else if( strncmp( buf, "cd", 2 ) == 0 )
	{
			
	}else if( strncmp( buf, "shutdown", 8 ) == 0 )
	{
		if( UMUserIsAdmin( SLIB->sl_UM, NULL, sess->sshs_Usr )  == TRUE )
		{
			ssh_channel_write( sess->sshs_Chan, "Server will shutdown shortly\n", 29 );
			FriendCoreManagerShutdown( SLIB->fcm );
		}
		else
		{
			ssh_channel_write( sess->sshs_Chan, "You are not authorized to shutdown server\n", 45 );
		}
		
	}else{	// command not found
		ssh_channel_write( sess->sshs_Chan, "Command not found\n", 18 );
		
		//ssh_channel_write( chan, buf, i );
		//if( write( 1, buf, i ) < 0 )
		//{
		//	FERROR("error writing to buffer\n");
		//	break;
		//}
	}
	
	return 0;
}

//
//
//

static int cleanup( void )
{
	int status;
	int pid;
	
	pid_t wait3( int *statusp, int options, struct rusage *rusage );
	
	while( ( pid = wait3( &status, WNOHANG, NULL ) ) > 0 )
	{
		DEBUG("Process reaped\n",  pid );
	}
	signal(SIGCHLD, (void (*)())cleanup );
	
	return 0;
}

static void wrapup(void)
{
	DEBUG("wrapup\n");
	//exit(0);
}

/**
 * Main SSHServer thread function
 *
 * @param ptr pointer to FThread structure
 * @return 0 when success, otherwise error number
 */

int SSHThread( FThread *ptr )
{
	ssh_session session = NULL;
	ssh_bind sshbind = NULL;
	
	ssh_event mainloop;
	struct ssh_server_callbacks_struct cb = {
		.userdata = NULL,
		.auth_password_function = auth_password,
		.auth_gssapi_mic_function = auth_gssapi_mic,
		.channel_open_request_session_function = new_session_channel
	};
	
	char buf[2048];
	int i;
	int r;
	
	DEBUG("Starting SSH Process\n");
	
	SSHServer *ts = (SSHServer *)ptr->t_Data;
	if( !ts )
	{
		FERROR("TS = NULL\n");
		return 0;
	}

	ts->sshs_FriendHome = getenv( "FRIEND_HOME" );
		
	int len = strlen( ts->sshs_FriendHome );
	ts->sshs_RSAKeyHome = FCalloc( len+64, sizeof(char) );
	ts->sshs_DSAKeyHome = FCalloc( len+64, sizeof(char) );
	

	//strcpy( ts->sshs_RSAKeyHome, ts->sshs_FriendHome );
	//strcpy( ts->sshs_DSAKeyHome, ts->sshs_FriendHome );
	//strcat( ts->sshs_RSAKeyHome, "keys/ssh_host_rsa_key" );
	//strcat( ts->sshs_DSAKeyHome, "keys/ssh_host_dsa_key" );
	
	strcpy( ts->sshs_RSAKeyHome, "/etc/ssh/ssh_host_rsa_key" );
	strcpy( ts->sshs_DSAKeyHome, "/etc/ssh/ssh_host_dsa_key" );
	//DEBUG("SSH sshs_RSAKeyHome set to %s\n", ts->sshs_RSAKeyHome );
		
	sshbind = ssh_bind_new();
		
	FBOOL welcomeMessage = FALSE;
	
	ssh_bind_options_set( sshbind, SSH_BIND_OPTIONS_DSAKEY, ts->sshs_DSAKeyHome );
	ssh_bind_options_set( sshbind, SSH_BIND_OPTIONS_RSAKEY, ts->sshs_RSAKeyHome );
	//ssh_bind_options_set(sshbind, SSH_BIND_OPTIONS_HOSTKEY, arg);
	
	//DEBUG("IMPORT RSA KEY %s\n", ts->sshs_RSAKeyHome );
	
	ssh_bind_options_set( sshbind, SSH_BIND_OPTIONS_BINDPORT_STR, SSH_SERVER_PORT );	
	//verbose
	ssh_bind_options_set( sshbind, SSH_BIND_OPTIONS_LOG_VERBOSITY_STR, "2" );
	ssh_bind_options_set( sshbind, SSH_BIND_OPTIONS_BINDADDR, "127.0.0.1" );
		
	if( ts->sshs_RSAKeyHome ) free( ts->sshs_RSAKeyHome );
	if( ts->sshs_DSAKeyHome ) free( ts->sshs_DSAKeyHome );
	
	DEBUG("Before SSH loop\n");
	
	// TODO: ts->sshs_Quit sometimes can not be read!
	while( ts != NULL && !ts->sshs_Quit )
	{
		DEBUG("Server options set\n");
	
	#ifdef WITH_PCAP
		set_pcap(session);
	#endif
		
		DEBUG("Server before bind\n");
		if( ssh_bind_listen( sshbind )<0 )
		{
			FERROR("Error listening to socket: %s\n",ssh_get_error(sshbind) );
			break;
		}
		
		DEBUG("Server before accept\n");

		signal( SIGCHLD, (void (*)())cleanup);
		signal(SIGINT, (void (*)())wrapup);
		session=ssh_new();
		r = ssh_bind_accept( sshbind , session );
		if( r==SSH_ERROR )
		{
			FERROR("error accepting a connection : %s\n",ssh_get_error(sshbind));
			break;
		}
		
		ssh_callbacks_init( &cb );
		SSHSession *sess = FCalloc( 1, sizeof( SSHSession ) );
		if( sess != NULL )
		{
			sess->sshs_Session = session;
			sess->sshs_SB = ts->sshs_SB;
			cb.userdata = sess;
		}
		
		DEBUG("User data set\n");
		ssh_set_server_callbacks( session, &cb );
    
		if ( ssh_handle_key_exchange( session ) ) 
		{
			FERROR("ssh_handle_key_exchange: %s\n", ssh_get_error(session));
			continue;
			//goto disconnect;
		}
	
		DEBUG("Connection accepted\n");
	
		ssh_set_auth_methods( session,SSH_AUTH_METHOD_PASSWORD | SSH_AUTH_METHOD_GSSAPI_MIC );
		
		DEBUG("loop\n");
		
		//
		// New session/connection put it into thread
		//
		
		switch( fork() ) 
		{
			case 0:
				// Remove the SIGCHLD handler inherited from parent 
				//signal(SIGCHLD, SIG_DFL);
			
				mainloop = ssh_event_new();
				ssh_event_add_session( mainloop, session );
			
				while( !(sess->sshs_Authenticated && sess->sshs_Chan != NULL) )
				{
					if( sess->sshs_Error )
					{
						FERROR("SSHSession error %d\n", sess->sshs_Error );
						break;
					}
			
					r = ssh_event_dopoll( mainloop, -1 );
					if( r == SSH_ERROR )
					{
						FERROR("Error : %s\n",ssh_get_error( session ) );
						ssh_disconnect( session );
						return 1;
					}
				
					strcpy( buf,	"------------------------------------------------------\n\r" \
									"--- Welcome in FC server, use help to work with me ---\n\r" \
									"------------------------------------------------------\n\r" );
				
					ssh_channel_write( sess->sshs_Chan, buf, strlen( buf ) );
				
					if( sess->sshs_Path == NULL )
					{
						sess->sshs_Path = calloc( 1024, sizeof(char) );
						sess->sshs_DispText = calloc( 1024+48, sizeof(char) );
					}
					strcpy( sess->sshs_Path, "/" );
		
					if( sess->sshs_Usr )
					{
						sprintf( sess->sshs_DispText, "%s:%s ", sess->sshs_Usr->u_Name, sess->sshs_Path );
					}else{
						sprintf( sess->sshs_DispText, ":%s ", sess->sshs_Path );
					}
				
					int i = 0;
				
					do
					{
						ssh_channel_write( sess->sshs_Chan, sess->sshs_DispText, strlen( sess->sshs_DispText ) );
					
						i = ssh_channel_read( sess->sshs_Chan, buf, 2048, 0 );
						if( i > 0 )
						{
							DEBUG("READING FROM CHANNEL %d - size %d  %d  %c -n  %d\n", i, strlen( buf ), buf[0], buf[0], '\n' );
							//ssh_channel_write( sess->sshs_Chan, buf, 1 );
						
							handleSSHCommands( sess, buf, i );
						}
					
						if( sess->sshs_Quit == TRUE || ts->sshs_Quit == TRUE )
						{
							DEBUG("Session quit\n");
							break;
						}
					}
					while( i>0 );
				
					if( sess->sshs_Quit )
					{
						DEBUG("Quit\n");
						break;
					}
				}
				DEBUG("Closing ssh connection\n");
			
				ssh_event_free( mainloop );
				ssh_disconnect( session );
				ssh_free( session );
			
				if( sess->sshs_DispText )
				{
					FFree( sess->sshs_DispText );
				}
			
				if( sess->sshs_Path )
				{
					FFree( sess->sshs_Path );
				}
			
				DEBUG("Connection released\n");

				FFree( sess );
			
				//abort();
			
				DEBUG("AUTH\n");
				break;
			case -1:
				FERROR("Cannot create fork!\n");
				break;
		}
		

	#ifdef WITH_PCAP
		cleanup_pcap();
	#endif
		
	}	// main loop
	disconnect:
	
	ssh_bind_free( sshbind );
	
	DEBUG("DISCONNECTED\n");
	
	ptr->t_Launched = FALSE;
    return 0;
}

