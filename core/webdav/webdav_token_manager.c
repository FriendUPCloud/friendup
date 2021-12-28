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
 * file contain function body related to webdavtokenmanager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "webdav_token_manager.h"
#include <system/user/user.h>
#include <mutex/mutex_manager.h>

/**
 * Create new WebdavTokenManager
 *
 * @param sb pointer to SystemBase
 * @return new WebdavTokenManager structure when success, otherwise NULL
 */
WebdavTokenManager *WebdavTokenManagerNew( void *sb __attribute__((unused)))
{
	WebdavTokenManager *tm = FCalloc( 1, sizeof( WebdavTokenManager ) );
	if( tm != NULL )
	{
		pthread_mutex_init( &(tm->wtm_Mutex), NULL );
	}
	return tm;
}

/**
 * Delete WebdavTokenManager
 *
 * @param tm pointer to WebdavTokenManager which will be deleted
 */
void WebdavTokenManagerDelete( WebdavTokenManager *tm )
{
	if( tm != NULL )
	{
		FRIEND_MUTEX_LOCK( &(tm->wtm_Mutex) );
		WebdavTokenDeleteAll( tm->wtm_Tokens );
		FRIEND_MUTEX_UNLOCK( &(tm->wtm_Mutex) );
		
		pthread_mutex_destroy( &(tm->wtm_Mutex) );
		FFree( tm );
	}
}

/**
 * Add WebdavToken to WebdavTokenManager
 *
 * @param tm pointer to WebdavTokenManager
 * @param tok pointer to token which will be added to list
 * @return 0 when success, otherwise error number
 */
int WebdavTokenManagerAddToken( WebdavTokenManager *tm, WebdavToken *tok )
{
	if( tm != NULL )
	{
		FRIEND_MUTEX_LOCK( &(tm->wtm_Mutex) );
		tok->node.mln_Succ = (MinNode *)tm->wtm_Tokens;
		tm->wtm_Tokens = tok;
		FRIEND_MUTEX_UNLOCK( &(tm->wtm_Mutex) );
	}
	return 0;
}

/**
 * Add WebdavToken to WebdavTokenManager
 *
 * @param tm pointer to WebdavTokenManager
 * @return pointer to new  when success, otherwise error number
 */
WebdavToken *WebdavTokenManagerGenerateToken( WebdavTokenManager *tm )
{
	WebdavToken *tok = NULL;
	if( tm != NULL )
	{
		tok = WebdavTokenNew();
		if( tok != NULL )
		{
			char hash[ 256 ];
			int dstSize;
			
			strcpy( tok->wt_Realm, "friendup@friendup.cloud" );
			
			int size = snprintf( hash, sizeof(hash), "%lu%s%d", (unsigned long)time(NULL), tok->wt_Realm, ( rand() % 999 ) + ( rand() % 999 ) + ( rand() % 999 ) );
			
			//char *enchash = MarkAndBase64EncodeString( hash );
			char *enchash = Base64Encode( (const unsigned char *)hash, size, &dstSize );
			if( enchash != NULL )
			{
				memcpy( tok->wt_Nonce, enchash, WEBDAV_TOKEN_LENGTH );
				//int i;
				//for( i=0 ; i < WEBDAV_TOKEN_LENGTH ; i++ )
				//{
				//	printf(" %c ", enchash[ i ] );
				//}
				
				FFree( enchash );
			}
			DEBUG("Hash %s\n", hash );
			
			snprintf( hash, sizeof(hash), "%d%s%lu", ( rand() % 999 ) + ( rand() % 999 ) + ( rand() % 999 ) , "_@34Dd4rfgbt33232", (unsigned long)time(NULL) );
			
			//enchash = MarkAndBase64EncodeString( hash );
			enchash = Base64Encode( (const unsigned char *)hash, size, &dstSize );
			if( enchash != NULL )
			{
				memcpy( tok->wt_Opaque, enchash, WEBDAV_TOKEN_LENGTH );
				FFree( enchash );
			}
			DEBUG("Hash1 %s\n", hash );
			
			// Add token to list
			
			FRIEND_MUTEX_LOCK( &(tm->wtm_Mutex) );
			tok->node.mln_Succ = (MinNode *)tm->wtm_Tokens;
			tm->wtm_Tokens = tok;
			FRIEND_MUTEX_UNLOCK( &(tm->wtm_Mutex) );
		}
	}
	return tok;
}

/**
 * Get WebdavToken from WebdavTokenManager by nonce
 *
 * @param tm pointer to WebdavTokenManager
 * @param nonce name of nonce used to find WebdavToken
 * @return new WebdavToken structure when success, otherwise NULL
 */
WebdavToken *WebdavTokenManagerGetTokenNonce( WebdavTokenManager *tm, char *nonce )
{
	DEBUG("[WebdavTokenManagerGetTokenNonce] %s\n", nonce );
	if( nonce == NULL )
	{
		return NULL;
	}
	FRIEND_MUTEX_LOCK( &(tm->wtm_Mutex) );
	WebdavToken *tok = tm->wtm_Tokens;
	while( tok != NULL )
	{
		DEBUG("WebdavTokenManagerGetTokenNonce: nonce %s pointer %p\n", nonce, tok->wt_Nonce );
		if( memcmp( tok->wt_Nonce, nonce, WEBDAV_TOKEN_LENGTH ) == 0 )
		{
			FRIEND_MUTEX_UNLOCK( &(tm->wtm_Mutex) );
			return tok;
		}
		tok = (WebdavToken *) tok->node.mln_Succ;
	}
	FRIEND_MUTEX_UNLOCK( &(tm->wtm_Mutex) );
	return NULL;
}

/**
 * Delete old WebdavTokens from WebdavTokenManager
 *
 * @param wtm pointer to WebdavTokenManager
 */
void WebdavTokenManagerDeleteOld( WebdavTokenManager *wtm )
{
	FRIEND_MUTEX_LOCK( &(wtm->wtm_Mutex) );
	time_t curTime = time( NULL );
	
	#define MINS360 6*4600
	
	WebdavToken *tok = wtm->wtm_Tokens;
	WebdavToken *nroot = NULL, *ltok = NULL;
	while( tok != NULL )
	{
		WebdavToken *acttok = tok;
		
		tok = (WebdavToken *) tok->node.mln_Succ;
		
		// remove entry
		if( ( curTime - acttok->wt_CreationTime ) > MINS360 )
		{
			WebdavTokenDelete( acttok );
		}
		else	// do not remove entry, create new list
		{
			if( ltok == NULL )
			{
				ltok = acttok;
				nroot = ltok;
			}
			else
			{
				ltok->node.mln_Succ = (MinNode *)acttok;
				ltok = acttok;
			}
		}
	}
	wtm->wtm_Tokens = nroot;
	FRIEND_MUTEX_UNLOCK( &(wtm->wtm_Mutex) );
}
