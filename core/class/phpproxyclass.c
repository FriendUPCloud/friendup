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
 *  Core PHP class handling
 *
 *  @author PS (Pawel Stefanski)
 *  @author JMN (John Michael Nilsen)
 *  @date pushed 06/02/2015
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <core/types.h>
#include <class/rootclass.h>
#include "phpproxyclass.h"

#ifndef DOXYGEN
extern FILE *popen( const char *command, const char *modes);
extern int pclose(FILE *stream);
#endif

struct Data
{
	FULONG 	test;
	char 		*params;
	char 		*result;
};

#ifndef DOXPUBLIC  // Internal documentation only
/**
 * Transfers data zones from all messaged to object data params
 *
 * One function sets all
 *
 * @param c pointer to class
 * @param o pointer to object
 * @param msg pointer to message structure
 *
 */
void setForAll( Class *c __attribute__((unused)), Object *o, struct Msg *msg )
{
	struct opSet *set = (struct opSet *)msg;//->data;
	struct TagItem *lt = (set->ops_AttrList);
	struct Data *data = (struct Data *)o->o_UserData;

	DEBUG("PHPPROXY: SET FOR ALL\n");

	while( lt->ti_Tag != TAG_END )
	{
		switch( lt->ti_Tag )
		{
			case FA_PHPProxy_Parameters:
			{
				int size = strlen( (char *)lt->ti_Data );

				if( data->params != NULL )
				{
					free( data->params );
					data->params = NULL;
				}

				if( size > 0 && ( data->params = calloc( size +1, sizeof(char) ) ) != NULL )
				{
					memcpy( data->params, (void *)lt->ti_Data, size );
				}
	
			}
			break;
		}
		
		lt++;
	}
}
#endif          // DOXPUBLIC

/**
 * Handling of the FM_NEW message for PHP Proxy class instances
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return pointer to the new object
 * @return NULL if error
 *
 */
FULONG phpproxyNew( Class *c, Object *o __attribute__((unused)), struct Msg *msg )
{
	Object *newObject = NULL;

	DEBUG("PHPPROXY START\n");

	newObject = ObjectSuperNew( c, msg );

	newObject->o_UserData = calloc( sizeof( struct Data ), 1 );

	DEBUG("PHPPROXY OBJECT CREATED\n");

	setForAll( c, newObject, msg );

	DEBUG("PHPPROXY return new object at ptr %p\n", newObject );

	return (FULONG)newObject;
}

/**
 * Handling of the FM_DISPOSE message for PHP Proxy class
 *
 * Release all associated memory assiciated with this instance of the class
 * then calls the super class with the same message structure
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return 0
 *
 */
FULONG phpproxyDispose( Class *c, Object *o, struct Msg *msg )
{
	FULONG res = 0;
	struct Data *data = (struct Data *)o->o_UserData;

	DEBUG("PHPPROXY start\n");

	if( o->o_UserData != NULL)
	{
		if( data->params != NULL ){	free( data->params ); data->params = NULL; }

		if( data->result != NULL ){ free( data->result ); data->result = NULL; }

		free( o->o_UserData );
		o->o_UserData = NULL;
	}

	DoSuperMethod( c, o, msg );

	free( o );

	DEBUG("PHPPROXY END\n");

	return res;
}

/**
 * Handling of the FM_SET message for PHP Proxy class
 *
 * Transfers the message structure data zones into the instance
 * Calls the super class for execution
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return 0
 *
 */
FULONG phpproxySet( Class *c, Object *o, struct Msg *msg )
{
	FULONG res = 0;

	DEBUG("PHPPROXY set\n");

	struct opSet *set = (struct opSet *)msg;
	struct TagItem *lt = (set->ops_AttrList);

	DEBUG("PHPPROXY set before SETFORALL cptr %p optr %p\n msgptr %p\n", c, o, msg );

	setForAll( c, o, msg );

	DoSuperMethod( c, o, msg );

	return res;
}

/**
 * Handling of the FM_GET message for PHP Proxy class
 *
 * Sub-messages suported:
 * FA_PHPProxy_Parameters: proxy parameters
 * FA_PHPProxy_Results: results of the last proxy action
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return 0
 *
 */
FULONG phpproxyGet( Class *c __attribute__((unused)), Object *o, struct Msg *msg )
{
	FULONG res = 0;
	DEBUG("PHPPROXY get\n");

	struct opGet *get = (struct opGet *)msg;
	struct Data *data = (struct Data *)o->o_UserData;

	switch( get->opg_AttrID )
	{
		case FA_PHPProxy_Parameters:
			*(get->opg_Storage)	=	(FULONG*)data->params;
			DEBUG("PHPPROXY FUIA_PHPProxy_Parameters get root value %s\n", (char *)data->params );
		break;
		case FA_PHPProxy_Results:
			*(get->opg_Storage)	=	(FULONG *)data->result;
			DEBUG("PHPPROXY FUIA_PHPProxy_Results get value %s\n", (char *)data->result );
		break;
	}

	return res;
}

#define BUFFER_SIZE	512
/**
 * Handling of the FM_PHPProxy_Process message for PHP Proxy class instances
 *
 * Creates a pipe with popen
 * Stores the appended results in o_UserData of the instance
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return length of the data in o_UserData
 * @return 0 in case of error
 *
 */
FULONG phpproxyProcess( Class *c __attribute__((unused)), Object *o, struct Msg *msg )
{
	FULONG res = 0;
	char command[ BUFFER_SIZE ];
	char *temp = NULL;
	DEBUG("PHPPROXY phpproxyProcess\n");
	struct FUIPProcess *proc = (struct FUIPProcess *)(msg->data);
	struct Data *data = (struct Data *)o->o_UserData;

	sprintf( command, "php -r \"%s\";", data->params );

    FILE* pipe = popen( command, "r");
    if( !pipe )
    {
    	return 0;
    }

    if( data->result != NULL ){ FFree( data->result ); data->result = NULL; }

    char buffer[ BUFFER_SIZE ];
    
    while( !feof( pipe ) ) 
    {
    	if( fgets( buffer, BUFFER_SIZE, pipe ) != NULL )
    	{
    		if( data->result == NULL )
    		{
    			if( ( data->result = FCalloc( BUFFER_SIZE+1, sizeof(char) ) ) != NULL ){
    				memcpy( data->result, buffer, BUFFER_SIZE );
    				res += BUFFER_SIZE;
    			}else{
    				
    				if( ( temp = FCalloc( res, sizeof(char) ) ) != NULL )
    				{
    					memcpy( temp, data->result, res );
    					if( data->result != NULL ){ FFree( data->result ); data->result = NULL; }
    					if( ( data->result = FCalloc( res+BUFFER_SIZE+1, sizeof(char) ) ) != NULL ){
    						memcpy( data->result, temp, res );
    						memcpy( &(data->result[ res ]), buffer, BUFFER_SIZE );
    						res += BUFFER_SIZE;
    					}

    					FFree( temp );
    					temp = NULL;
    				}
    			}
    		}
    		res += (FULONG)buffer;
    	}
    }
    pclose( pipe );

	return res;
}

/**
 * Handles messages sent to an instance of the PHP Proxy class
 *
 * @param c pointer to parent class
 * @param o pointer to object
 * @param msg pointer to message structure
 * @return return value provided by message handlers
 */
FULONG phpproxyDispatcher( struct Class *c, Object *o, struct Msg *m )
{
	FULONG retVal = (FULONG)NULL;
	// we dont call super methods beacouse this method is done on root
	DEBUG("PHPPROXY dispatcher MID %ld \n", m->MethodID );

	switch( m->MethodID )
	{
		case FM_NEW:
			return phpproxyNew( c, o, m );
			
		case FM_DISPOSE: 
			return phpproxyDispose( c, o, m );

		case FM_SET:
			return phpproxySet( c, o, m );

		case FM_GET:
			return phpproxyGet( c, o, m );

		case FM_PHPProxy_Process:
			return phpproxyProcess( c, o, m );

		default:
			retVal = DoSuperMethod( c, o, m );
			break;
	}

	return retVal;
}




