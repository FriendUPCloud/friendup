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
#include <user/userlibrary.h>
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

extern struct SystemBase *SLIB;

//
// New SSH Server
//

SSHServer *SSHServerNew()
{
	SSHServer *ts = NULL;

	if( ( ts = calloc( 1, sizeof( SSHServer ) ) ) != NULL )
	{
#ifdef ENABLE_SSH	
		ssh_threads_set_callbacks( ssh_threads_get_pthread() );
		ssh_init();
	
		ts->sshs_Thread = ThreadNew( SSHThread, ts, TRUE );
#endif
	}
	return ts;
}

//
// Destructor
//

void SSHServerDelete( SSHServer *ts )
{
	if( ts != NULL )
	{
		ts->sshs_Quit = TRUE;
		
#ifdef ENABLE_SSH	
		if( ts->sshs_Thread )
		{
			ThreadDelete( ts->sshs_Thread );
		}
		ssh_finalize();
#endif		
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

//
// Checking password
//

static int auth_password( ssh_session session, const char *uname, const char *password, void *userdata )
{
#ifdef ENABLE_SSH	
	SSHSession *s = (SSHSession *)userdata;
    
	DEBUG("Authenticating user %s pwd %s\n", uname, password );
	
	struct UserLibrary *ulib = SLIB->LibraryUserGet( SLIB );
							
	DEBUG("Gettings message login/pass\n");
							
	if( uname != NULL && password != NULL )
	{
		s->sshs_Usr = ulib->UserGet( ulib, uname );
		if( strcmp( password, s->sshs_Usr->u_Password ) == 0  )
		{
			s->sshs_Authenticated = 1;
			DEBUG("Authenticated\n");
			return SSH_AUTH_SUCCESS;
		}
	}

	if( s->sshs_Tries >= 3 )
	{
		DEBUG("Too many authentication tries\n");
		ssh_disconnect(session);
		s->sshs_Error = 1;
		return SSH_AUTH_DENIED;
	}
	s->sshs_Tries++;
#endif	
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
		ERROR("New session channel\n");
		return NULL;
	}
	printf("Allocated session channel\n");
	s->sshs_Chan = ssh_channel_new( session );
	ssh_callbacks_init( &channel_cb );
	ssh_set_channel_callbacks( s->sshs_Chan, &channel_cb );
	
	return s->sshs_Chan;
}

//
// Handle commands
//

int handleSSHCommands( SSHSession *sess, const char *buf, const int len )
{	
	char outbuf[ 2048 ];
	
	if( strncmp( buf, "help", 4 ) == 0 )
	{
		strcpy( outbuf, 	"Main commands:\n" \
			" logout - logout user from current session\n" \
			" cd - change current directory\n" \
			);
		
		ssh_channel_write( sess->sshs_Chan, outbuf, strlen( buf ) );
	
	}else if( strncmp( buf, "logout", 6 ) == 0 )
	{
		sess->sshs_Quit = TRUE;
	}else if( strncmp( buf, "cd", 2 ) == 0 )
	{
			
	}else{	// command not found
		ssh_channel_write( sess->sshs_Chan, "Command not found\n", 18 );
		
		//ssh_channel_write( chan, buf, i );
		//if( write( 1, buf, i ) < 0 )
		//{
		//	ERROR("error writing to buffer\n");
		//	break;
		//}
	}
	
	return 0;
}

//
// SSH Thread
//

int SSHThread( void *data )
{
	// TODO: Hogne was here, disabling this problem child.. :)
	return 0;
#ifdef ENABLE_SSH	
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
	
	SSHServer *ts = (SSHServer *)data;
	if( !ts ) return 0;

	ts->sshs_FriendHome = getenv( "FRIEND_HOME" );
		
	int len = strlen( ts->sshs_FriendHome );
	ts->sshs_RSAKeyHome = calloc( len+64, sizeof(char) );
	ts->sshs_DSAKeyHome = calloc( len+64, sizeof(char) );
		
	strcpy( ts->sshs_RSAKeyHome, ts->sshs_FriendHome );
	strcpy( ts->sshs_DSAKeyHome, ts->sshs_FriendHome );
	strcat( ts->sshs_RSAKeyHome, "keys/ssh_host_rsa_key" );
	strcat( ts->sshs_DSAKeyHome, "keys/ssh_host_dsa_key" );
	
	//DEBUG("SSH sshs_RSAKeyHome set to %s\n", ts->sshs_RSAKeyHome );
		
	sshbind = ssh_bind_new();
		
	BOOL welcomeMessage = FALSE;
		
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
			ERROR("Error listening to socket: %s\n",ssh_get_error(sshbind) );
			break;
		}
		
		DEBUG("Server before accept\n");

		session=ssh_new();
		r = ssh_bind_accept( sshbind , session );
		if( r==SSH_ERROR )
		{
			ERROR("error accepting a connection : %s\n",ssh_get_error(sshbind));
			break;
		}
		
		ssh_callbacks_init( &cb );
		SSHSession *sess = calloc( 1, sizeof( SSHSession ) );
		sess->sshs_Session = session;
		cb.userdata = sess;
		
		DEBUG("User data set\n");
		ssh_set_server_callbacks( session, &cb );
    
		if ( ssh_handle_key_exchange( session ) ) 
		{
			ERROR("ssh_handle_key_exchange: %s\n", ssh_get_error(session));
			continue;
			//goto disconnect;
		}
	
		DEBUG("Connection accepted\n");
	
		ssh_set_auth_methods( session,SSH_AUTH_METHOD_PASSWORD | SSH_AUTH_METHOD_GSSAPI_MIC );
		
		//
		// New session/connection put it into thread
		//
		
		switch( fork() ) 
		{
			case 0:
				// Remove the SIGCHLD handler inherited from parent 
				signal(SIGCHLD, SIG_DFL);
			
				mainloop = ssh_event_new();
				ssh_event_add_session( mainloop, session );
			
				while( !(sess->sshs_Authenticated && sess->sshs_Chan != NULL) )
				{
					if( sess->sshs_Error )
					{
						ERROR("SSHSession error %d\n", sess->sshs_Error );
						break;
					}
			
					r = ssh_event_dopoll( mainloop, -1 );
					if( r == SSH_ERROR )
					{
						ERROR("Error : %s\n",ssh_get_error( session ) );
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
					
						if( sess->sshs_Quit )
						{
							break;
						}
					
					}
					while( i>0 );
				
					if( sess->sshs_Quit )
						break;
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
			
				abort();
			
				DEBUG("AUTH\n");
				break;
			case -1:
				ERROR("Cannot create fork!\n");
				break;
		}
		

	#ifdef WITH_PCAP
		cleanup_pcap();
	#endif
		
	}	// main loop
	disconnect:
	DEBUG("DISCONNECTED\n");
#endif // ENABLE_SSH	
    return 0;
}

