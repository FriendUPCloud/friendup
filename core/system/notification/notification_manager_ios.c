/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Notification Manager IOS
 *
 * file contain definitions related to NotificationManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 20/09/2018
 */

#include "notification_manager.h"
#include <system/systembase.h>
#include <mobile_app/mobile_app.h>
#include <mobile_app/notifications_sink.h>
#include <network/http_client.h>
#include <util/element_list.h>

//
//
//

#define APN_TOKEN_BINARY_SIZE 32
#define APN_TOKEN_LENGTH 64

//
//
//

int hex2int(char ch)
{
	if (ch >= '0' && ch <= '9')
	{
		return ch - '0';
	}
	if (ch >= 'A' && ch <= 'F')
	{
		return ch - 'A' + 10;
	}
	if (ch >= 'a' && ch <= 'f')
	{
		return ch - 'a' + 10;
	}
	return -1;
}


/*
char *TokenToBinary( const char *token )
{
	char inputCharVector[ 512 ];
	int len = strlen( token );
    int i, j;
	
	memset( inputCharVector, 0, sizeof(inputCharVector) );
	
	if( len > 32 )
	{
		Log( FLOG_ERROR, "Token len > 32: %s\n", token );
		len = 32;
	}
	
	//Convert the string to the hex vector string

	//converting str character into Hex and adding into strH
	for( i=0 ; i<len ;i++ )
	{ 
		char val = 0;
		val = hex2int( token[ i ] );
		inputCharVector[i] = val;
	}
    
	char *buffer = (char *)FMalloc( 64 );	//	34
	if( buffer != NULL )
	{
		int location = 0;
		memset( buffer, 0, 34 );
    
		unsigned value;
		unsigned data[4];

		for( i = 0; i < len; i += 8)
		{
			memset(data, 0, 4);
			data[0] = (inputCharVector[i] << 4) | (inputCharVector[i + 1]);
			data[1] = (inputCharVector[i + 2] << 4) | (inputCharVector[i + 3]);
			data[2] = (inputCharVector[i + 4] << 4) | (inputCharVector[i + 5]);
			data[3] = (inputCharVector[i + 6] << 4) | (inputCharVector[i + 7]);
        
			value = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
        
			value = htonl(value);

			memcpy( &buffer[ location ], &value, sizeof(unsigned) );
		
			location += sizeof(unsigned);
		}
		//buffer[ 32 ] = '0';
		//buffer[ 33 ] = 0;
		buffer[ i+1 ] = '0';
		buffer[ i+2 ] = 0;
	}
	return buffer;
}
*/

char *TokenToBinary( const char *token, int *bsize )
{
	int len = strlen( token );
	char *inputCharVector = FCalloc( (len*2)+64, sizeof(char) );
    int i, j;
	
	//Convert the string to the hex vector string

	//converting str character into Hex and adding into strH
	for( i=0 ; i<len ;i++ )
	{ 
		char val = 0;
		val = hex2int( token[ i ] );
		inputCharVector[i] = val;
	}
    
	char *buffer = (char *)FMalloc( len+64 );	//	34
	if( buffer != NULL )
	{
		int location = 0;
		memset( buffer, 0, 34 );
    
		unsigned value;
		unsigned data[4];

		for( i = 0; i < len; i += 8)
		{
			memset(data, 0, 4);
			data[0] = (inputCharVector[i] << 4) | (inputCharVector[i + 1]);
			data[1] = (inputCharVector[i + 2] << 4) | (inputCharVector[i + 3]);
			data[2] = (inputCharVector[i + 4] << 4) | (inputCharVector[i + 5]);
			data[3] = (inputCharVector[i + 6] << 4) | (inputCharVector[i + 7]);
        
			value = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
        
			value = htonl(value);

			memcpy( &buffer[ location ], &value, sizeof(unsigned) );
		
			location += sizeof(unsigned);
		}
		//buffer[ 32 ] = '0';
		//buffer[ 33 ] = 0;
		buffer[ i+1 ] = '0';
		buffer[ i+2 ] = 0;
		
		*bsize = i/2;
	}
	FFree( inputCharVector );
	return buffer;
}

//#define IOS_MAX_MSG_SIZE sizeof (uint8_t) + sizeof (uint32_t) + sizeof (uint32_t) + sizeof (uint16_t) + DEVICE_BINARY_SIZE + sizeof (uint16_t) + MAXPAYLOAD_SIZE
//#define IOS_MAX_MSG_SIZE (DEVICE_BINARY_SIZE+MAXPAYLOAD_SIZE+2048)

// Source: https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/LegacyFormat.html
FBOOL SendPayload( NotificationManager *nm, SSL *sslPtr, char *deviceTokenBinary, char *payloadBuff, size_t payloadLength, int toklen )
{
	DEBUG("Send payload\n");
	FBOOL rtn = FALSE;
	if( sslPtr && deviceTokenBinary && payloadBuff && payloadLength )
	{
		uint8_t command = 1; /* command number */
		char *binaryMessageBuff;
		DEBUG("Alloc memory: %d\n", MAXPAYLOAD_SIZE );
		if( ( binaryMessageBuff = FMalloc( MAXPAYLOAD_SIZE ) ) != NULL )
		{
			// message format is, |COMMAND|ID|EXPIRY|TOKENLEN|TOKEN|PAYLOADLEN|PAYLOAD|
			char *binaryMessagePt = binaryMessageBuff;
			uint32_t whicheverOrderIWantToGetBackInAErrorResponse_ID = 1234;
			uint32_t networkOrderExpiryEpochUTC = htonl( nm->nm_APNSNotificationTimeout );
			uint16_t networkOrderTokenLength = htons( toklen );// htons(DEVICE_BINARY_SIZE);
			uint16_t networkOrderPayloadLength = htons(payloadLength);
        
			// command
			*binaryMessagePt++ = command;
        
			// provider preference ordered ID 
			memcpy(binaryMessagePt, &whicheverOrderIWantToGetBackInAErrorResponse_ID, sizeof (uint32_t));
			binaryMessagePt += sizeof (uint32_t);
        
			// expiry date network order 
			memcpy(binaryMessagePt, &networkOrderExpiryEpochUTC, sizeof (uint32_t));
			binaryMessagePt += sizeof (uint32_t);
        
			// token length network order
			memcpy(binaryMessagePt, &networkOrderTokenLength, sizeof (uint16_t));
			binaryMessagePt += sizeof (uint16_t);
        
			// device token
			//memcpy(binaryMessagePt, deviceTokenBinary, DEVICE_BINARY_SIZE);
			//binaryMessagePt += DEVICE_BINARY_SIZE;
			memcpy(binaryMessagePt, deviceTokenBinary, toklen);
			binaryMessagePt += toklen;
        
			// payload length network order 
			memcpy(binaryMessagePt, &networkOrderPayloadLength, sizeof (uint16_t));
			binaryMessagePt += sizeof (uint16_t);
        
			// payload 
			memcpy(binaryMessagePt, payloadBuff, payloadLength);
			binaryMessagePt += payloadLength;
        
			int result = SSL_write(sslPtr, binaryMessageBuff, (binaryMessagePt - binaryMessageBuff));
			if( result > 0 )
			{
				DEBUG("Msg sent\n");
				rtn = true;
				//cout<< "SSL_write():" << result<< endl;
			}
			else
			{
				int errorCode = SSL_get_error(sslPtr, result);
				DEBUG( "Failed to write in SSL, error code: %d\n", errorCode );
			}
			FFree( binaryMessageBuff );
		}
    }
    return rtn;
}

/**
 * Send notification to APNS server
 * 
 * @param nm pointer to NotificationManager
 * @param title title
 * @param content content of message
 * @param sound sound name
 * @param badge badge
 * @param app application name
 * @param extras user data
 * @param tokens device tokens separated by coma
 * @return 0 when success, otherwise error number
 */

int NotificationManagerNotificationSendIOS( NotificationManager *nm, const char *title, const char *content, const char *sound, int badge, const char *app, const char *extras, char *tokens )
{
	char *startToken = tokens;
	char *curToken = tokens+1;
	SSL_CTX *ctx;
	SSL *ssl;
	int sockfd;
	struct hostent *he;
	struct sockaddr_in sa;
	
	if( tokens == NULL || strlen( tokens ) < 6 )
	{
		return 21;
	}
	
	DEBUG("Send notifications IOS, cert path >%s< - content %s title: %s\n", nm->nm_APNSCert, content, title );
	
	int pushContentLen = 0;
	int extrasSize = 0; 
	char *encmsg = NULL;
	if( extras != NULL && strlen( extras ) > 0 )
	{
		extrasSize = strlen( extras ); 
		encmsg = Base64Encode( (const unsigned char *)extras, extrasSize, &extrasSize );
	}
	
	nm->nm_APNSNotificationTimeout = time(NULL) + 86400; // default expiration date set to 1 day
    
	SSLeay_add_ssl_algorithms();
	//SSL_load_error_strings();
	
	//ctx = SSL_CTX_new( TLS_client_method() );
	ctx = SSL_CTX_new(TLSv1_2_method());
	//ctx = SSL_CTX_new(TLSv1_method());
	if( !ctx )
	{
		FERROR("SSL_CTX_new()...failed\n");
		return 1;
	}
    
	if( SSL_CTX_load_verify_locations( ctx, NULL, ".") <= 0 )
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 2;
	}
    
	if( SSL_CTX_use_certificate_file(ctx, nm->nm_APNSCert, SSL_FILETYPE_PEM) <= 0)
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 3;
	}
    
	if( SSL_CTX_use_PrivateKey_file(ctx, nm->nm_APNSCert, SSL_FILETYPE_PEM ) <= 0)
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 4;
	}
    
	if( SSL_CTX_check_private_key( ctx ) <= 0 )
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		return 5;
	}
	
	if( nm->nm_APNSSandBox )
	{
		he = gethostbyname( APNS_SANDBOX_HOST );
	}
	else
	{
		he = gethostbyname( APNS_HOST );
	}
    
	if( !he )
	{
		SSL_CTX_free( ctx );
		return 7;
	}
	
	in_port_t sinPort;
	if( nm->nm_APNSSandBox )
	{
		sinPort = htons(APNS_SANDBOX_PORT);
	}
	else
	{
		sinPort = htons(APNS_PORT);
	}
	
	int successNumber = 0;
	int failedNumber = 0;		
			
	char *pushContent = FMalloc( MAXPAYLOAD_SIZE );
	if( pushContent != NULL )
	{
		while( TRUE )
		{
			// go through all tokens separated by , (coma)
			// and send message to them
			if( *curToken == 0 || *curToken == ',' )
			{
				FBOOL quit = FALSE;
				if( *curToken != 0 )
				{
					*curToken = 0;
				}
				else
				{
					quit = TRUE;
				}
			
				DEBUG("Send message to : >%s<\n", startToken );
				
				sockfd = socket( AF_INET, SOCK_STREAM, 0 );
				if( sockfd > -1 )
				{
					sa.sin_family = AF_INET;
					memcpy( &sa.sin_addr.s_addr, he->h_addr_list[0], he->h_length );
					//sa.sin_addr.s_addr = inet_addr( inet_ntoa(*((struct in_addr *) he->h_addr_list[0])));
	
					sa.sin_port = sinPort;

					if( connect(sockfd, (struct sockaddr *) &sa, sizeof(sa)) != -1 )
					{
						DEBUG("Connected to APNS server\n");
    
						ssl = SSL_new( ctx );
						if( ssl != NULL )
						{
							SSL_set_fd( ssl, sockfd );
							if( SSL_connect( ssl ) != -1 )
							{
								int tokLen = 0;
								if( encmsg != NULL )
								{
									//pushContentLen = snprintf( pushContent, MAXPAYLOAD_SIZE-1, "{\"aps\":{\"alert\":\"%s\",\"body\":\"%s\",\"badge\":%d,\"sound\":\"%s\",\"category\":\"FriendUP\"},\"application\":\"%s\",\"extras\":\"%s\" }", title, content, badge, sound, app, encmsg );
									pushContentLen = snprintf( pushContent, MAXPAYLOAD_SIZE-1, "{\"aps\":{\"alert\":\"%s\",\"body\":\"%s\",\"badge\":%d,\"sound\":\"%s\",\"category\":\"FriendUP\",\"mutable-content\":1},\"application\":\"%s\",\"extras\":\"%s\" }", title, content, badge, sound, app, encmsg );
								}
								else
								{
									//pushContentLen = snprintf( pushContent, MAXPAYLOAD_SIZE-1, "{\"aps\":{\"alert\":\"%s\",\"body\":\"%s\",\"badge\":%d,\"sound\":\"%s\",\"category\":\"FriendUP\"},\"application\":\"%s\",\"extras\":\"%s\" }", title, content, badge, sound, app, extras );
									pushContentLen = snprintf( pushContent, MAXPAYLOAD_SIZE-1, "{\"aps\":{\"alert\":\"%s\",\"body\":\"%s\",\"badge\":%d,\"sound\":\"%s\",\"category\":\"FriendUP\",\"mutable-content\":1},\"application\":\"%s\",\"extras\":\"%s\" }", title, content, badge, sound, app, extras );
								}
								
								if( *startToken == ',' )
								{
									startToken++;
								}
			
								char *tok = TokenToBinary( startToken, &tokLen );
								DEBUG("Send payload, token pointer %p token '%s' payload: %s\n", tok, startToken, pushContent );
								if( tok != NULL )
								{
									if( !SendPayload( nm, ssl, tok, pushContent, pushContentLen, tokLen ) )
									{
										failedNumber++;
									}
									else
									{
										successNumber++;
									}
									FFree( tok );
								}
							} // SSL_connect
							SSL_shutdown( ssl );
							SSL_free( ssl );
						} // SSLNew
					} // connect
					close( sockfd );
				}	// sockfd == -1

				startToken = curToken+1;
			
				if( quit == TRUE )
				{
					break;
				}
				curToken++;
			}
			else
			{
				curToken++;
			}
		} // while, sending message
		FFree( pushContent );
	}
	
	DEBUG("Notifications sent: %d fail: %d\n", successNumber, failedNumber );
	
	SSL_CTX_free( ctx );
	
	if( encmsg != NULL )
	{
		FFree( encmsg );
	}
	
	return 0;
}

//
//
//

void NotificationIOSSendingThread( FThread *data )
{
	data->t_Launched = TRUE;
	NotificationManager *nm = (NotificationManager *)data->t_Data;
	SSL_CTX *ctx;
	SSL *ssl;
	int sockfd;
	struct hostent *he;
	struct sockaddr_in sa;
	in_port_t sinPort;
	
	SSLeay_add_ssl_algorithms();
	//SSL_load_error_strings();
	
	//ctx = SSL_CTX_new( TLS_client_method() );
	ctx = SSL_CTX_new(TLSv1_2_method());
	//ctx = SSL_CTX_new(TLSv1_method());
	if( !ctx )
	{
		FERROR("NotificationIOSSendingThread: SSL_CTX_new()...failed\n");
		return;
	}
    
	if( SSL_CTX_load_verify_locations( ctx, NULL, ".") <= 0 )
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		FERROR("NotificationIOSSendingThread: verify location fail\n");
		return;
	}
    
    if( nm->nm_APNSCert == NULL )
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		FERROR("NotificationIOSSendingThread: certyficate empty\n");
		return;
	}
	
	if( SSL_CTX_use_certificate_file(ctx, nm->nm_APNSCert, SSL_FILETYPE_PEM) <= 0)
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		FERROR("NotificationIOSSendingThread: use certyficate fail\n");
		return;
	}
    
	if( SSL_CTX_use_PrivateKey_file(ctx, nm->nm_APNSCert, SSL_FILETYPE_PEM ) <= 0)
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		FERROR("NotificationIOSSendingThread: use private key fail\n");
		return;
	}
    
	if( SSL_CTX_check_private_key( ctx ) <= 0 )
	{
		SSL_CTX_free( ctx );
		ERR_print_errors_fp( stderr );
		FERROR("NotificationIOSSendingThread: check private key\n");
		return;
	}
	
	/*
	if( nm->nm_APNSSandBox )
	{
		he = gethostbyname( APNS_SANDBOX_HOST );
	}
	else
	{
		he = gethostbyname( APNS_HOST );
	}
    
	if( !he )
	{
		SSL_CTX_free( ctx );
		FERROR("NotificationIOSSendingThread: get host fail\n");
		return;
	}
	
	if( nm->nm_APNSSandBox )
	{
		sinPort = htons(APNS_SANDBOX_PORT);
	}
	else
	{
		sinPort = htons(APNS_PORT);
	}
	*/
	
	DEBUG("NotificationIOSSendingThread: starting main loop\n");
	while( data->t_Quit != TRUE )
	{
		if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
		{
			DEBUG("NotificationIOSSendingThread: Before condition\n");
			pthread_cond_wait( &(nm->nm_IOSSendCond), &(nm->nm_IOSSendMutex) );
			FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
			
			DEBUG("NotificationIOSSendingThread: Got cond call\n");
			
			if( data->t_Quit == TRUE )
			{
				
				break;
			}

			FQEntry *e = NULL;
		
			while( TRUE )
			{
				if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
				{
					nm->nm_IOSSendInUse++;
					FQueue *q = &(nm->nm_IOSSendMessages);
					if( ( e = FQPop( q ) ) != NULL )
					{
						FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
						// send message
						
						DEBUG("SENDING IOS\n");
						
						if( nm->nm_APNSSandBox )
						{
							he = gethostbyname( APNS_SANDBOX_HOST );
						}
						else
						{
							he = gethostbyname( APNS_HOST );
						}
    
						if( !he )
						{
							SSL_CTX_free( ctx );
							FERROR("NotificationIOSSendingThread: get host fail\n");
						}
	
						if( nm->nm_APNSSandBox )
						{
							sinPort = htons(APNS_SANDBOX_PORT);
						}
						else
						{
							sinPort = htons(APNS_PORT);
						}
				
						sockfd = socket( AF_INET, SOCK_STREAM, 0 );
						DEBUG("socket: %d\n", sockfd );
						if( sockfd > -1 )
						{
							sa.sin_family = AF_INET;
							memcpy( &sa.sin_addr.s_addr, he->h_addr_list[0], he->h_length );
							//sa.sin_addr.s_addr = inet_addr( inet_ntoa(*((struct in_addr *) he->h_addr_list[0])));
	
							sa.sin_port = sinPort;

							if( connect(sockfd, (struct sockaddr *) &sa, sizeof(sa)) != -1 )
							{
								DEBUG("Connected to APNS server\n");
    
								ssl = SSL_new( ctx );
								if( ssl != NULL )
								{
									SSL_set_fd( ssl, sockfd );
									if( SSL_connect( ssl ) != -1 )
									{
										//DEBUG("Send message to APNS: %s\n", e->fq_Data );
										int result = SSL_write( ssl, e->fq_Data, e->fq_Size );
										if( result > 0 )
										{
											DEBUG("Msg sent\n");
										}
										else
										{
											int errorCode = SSL_get_error( ssl, result );
											DEBUG( "Failed to write in SSL, error code: %d\n", errorCode );
										}
										// send message
									} // SSL_connect
									SSL_shutdown( ssl );
									SSL_free( ssl );
								} // SSLNew
							} // connect
							else
							{
								FERROR("Connection to APNS fail!\n");
							}
							close( sockfd );
						}	// sockfd == -1
						else
						{
							DEBUG("Cannot create socket\n");
						}
						// release data
				
						if( e != NULL )
						{
							FFree( e->fq_Data );
							FFree( e );
						}
					} // if( ( e = FQPop( q ) ) != NULL )
					else
					{
						DEBUG("All messages sent\n");
						FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
						break;
					}
					
					if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
					{
						nm->nm_IOSSendInUse--;
						FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
					}
				} // if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
			}	// while != TRUE
		}
	}
	
	SSL_CTX_free( ctx );
	
	data->t_Launched = FALSE;
}

/**
 * Send notification to APNS server (in queue)
 * 
 * @param nm pointer to NotificationManager
 * @param title title
 * @param content content of message
 * @param sound sound name
 * @param badge badge
 * @param app application name
 * @param extras user data
 * @param tokens device tokens separated by coma
 * @return 0 when success, otherwise error number
 */

int NotificationManagerNotificationSendIOSQueue( NotificationManager *nm, const char *title, const char *content, const char *sound, int badge, const char *app, const char *extras, char *tokens )
{
	if( tokens == NULL || strlen( tokens ) < 6 )
	{
		return 21;
	}
	
	DEBUG("Send notifications IOS, cert path >%s< - content %s title: %s\n", nm->nm_APNSCert, content, title );
	
	int pushContentLen = 0;
	int extrasSize = 0; 
	char *encmsg = NULL;
	if( extras != NULL && strlen( extras ) > 0 )
	{
		extrasSize = strlen( extras ); 
		encmsg = Base64Encode( (const unsigned char *)extras, extrasSize, &extrasSize );
	}
    
	int successNumber = 0;
	int failedNumber = 0;
	
	char *pushContent = FCalloc( MAXPAYLOAD_SIZE, sizeof(char) );
	if( pushContent != NULL )
	{
		StringListEl *curToken = SLEParseString( tokens );
		while( curToken != NULL )
		{
			char *tok = NULL;
			int toksize;
			
			nm->nm_APNSNotificationTimeout = time(NULL) + 86400; // default expiration date set to 1 day
			
			DEBUG("Send message to IOS: >%s<\n", curToken->s_Data );
			
			if( encmsg != NULL )
			{
				pushContentLen = snprintf( pushContent, MAXPAYLOAD_SIZE-1, "{\"aps\":{\"alert\":\"%s\",\"body\":\"%s\",\"badge\":%d,\"sound\":\"%s\",\"category\":\"FriendUP\",\"mutable-content\":1},\"application\":\"%s\",\"extras\":\"%s\" }", title, content, badge, sound, app, encmsg );
			}
			else
			{
				pushContentLen = snprintf( pushContent, MAXPAYLOAD_SIZE-1, "{\"aps\":{\"alert\":\"%s\",\"body\":\"%s\",\"badge\":%d,\"sound\":\"%s\",\"category\":\"FriendUP\",\"mutable-content\":1},\"application\":\"%s\",\"extras\":\"%s\" }", title, content, badge, sound, app, extras );
			}

			tok = TokenToBinary( curToken->s_Data, &toksize );
			DEBUG("Send payload, token pointer %p token '%s' payload: %s tokensize: %d\n", tok, curToken->s_Data, pushContent, toksize );
			if( tok != NULL )
			{
				DEBUG("Send payload\n");
				FBOOL rtn = FALSE;
				if( pushContentLen > 0 )
				{
					uint8_t command = 1; /* command number */
					char *binaryMessageBuff;
					if( ( binaryMessageBuff = FCalloc( MAXPAYLOAD_SIZE, sizeof(char) ) ) != NULL )
					{
						// message format is, |COMMAND|ID|EXPIRY|TOKENLEN|TOKEN|PAYLOADLEN|PAYLOAD|
						char *binaryMessagePt = binaryMessageBuff;
						uint32_t whicheverOrderIWantToGetBackInAErrorResponse_ID = 1234;
						uint32_t networkOrderExpiryEpochUTC = htonl( nm->nm_APNSNotificationTimeout );
						//uint16_t networkOrderTokenLength = htons(DEVICE_BINARY_SIZE);
						uint16_t networkOrderTokenLength = htons(toksize);
						uint16_t networkOrderPayloadLength = htons( pushContentLen );
        
						// command
						*binaryMessagePt++ = command;
        
						// provider preference ordered ID 
						memcpy(binaryMessagePt, &whicheverOrderIWantToGetBackInAErrorResponse_ID, sizeof (uint32_t));
						binaryMessagePt += sizeof (uint32_t);
        
						// expiry date network order 
						memcpy(binaryMessagePt, &networkOrderExpiryEpochUTC, sizeof (uint32_t));
						binaryMessagePt += sizeof (uint32_t);
        
						// token length network order
						memcpy(binaryMessagePt, &networkOrderTokenLength, sizeof (uint16_t));
						binaryMessagePt += sizeof (uint16_t);
        
						// device token
						//memcpy(binaryMessagePt, tok, DEVICE_BINARY_SIZE);
						//binaryMessagePt += DEVICE_BINARY_SIZE;
						memcpy(binaryMessagePt, tok, toksize);
						binaryMessagePt += toksize;
        
						// payload length network order 
						memcpy(binaryMessagePt, &networkOrderPayloadLength, sizeof (uint16_t));
						binaryMessagePt += sizeof (uint16_t);
        
						// payload 
						memcpy(binaryMessagePt, pushContent, pushContentLen);
						binaryMessagePt += pushContentLen;
						
						FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
						if( en != NULL )
						{
							en->fq_Data = (void *)binaryMessageBuff;
							en->fq_Size = (binaryMessagePt - binaryMessageBuff);
			
							if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
							{
								FQPushFIFO( &(nm->nm_IOSSendMessages), en );
								FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
							}
						}
						successNumber++;
						//FFree( binaryMessageBuff ); // do not release when message is going to queue
					}
				} //if( pushContent, pushContentLen )
				FFree( tok );
			}
			
			StringListEl *remToken = curToken;
			curToken = (StringListEl *)curToken->node.mln_Succ;
			if( remToken->s_Data != NULL )
			{
				FFree( remToken->s_Data );
			}
			FFree( remToken );
		}	// while going through tokens
		FFree( pushContent );
		
		if( FRIEND_MUTEX_LOCK( &(nm->nm_IOSSendMutex) ) == 0 )
		{
			pthread_cond_signal( &(nm->nm_IOSSendCond) );
			FRIEND_MUTEX_UNLOCK( &(nm->nm_IOSSendMutex) );
		}
	}
	
	DEBUG("Notifications sent: %d fail: %d\n", successNumber, failedNumber );
	
	if( encmsg != NULL )
	{
		FFree( encmsg );
	}
	
	return 0;
}
