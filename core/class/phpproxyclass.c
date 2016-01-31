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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>


#include <core/types.h>
#include <class/rootclass.h>
#include "phpproxyclass.h"

extern FILE *popen( const char *command, const char *modes);
extern int pclose(FILE *stream);

struct Data
{
	ULONG 	test;
	char 		*params;
	char 		*result;
};

//
// one set function for all:)
//

void setForAll( Class *c, Object *o, struct Msg *msg )
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
				//printf("PHPPROXY FUIA_PHPProxy_Parameters %x '%s'\n", (ULONG)lt->ti_Tag, (STRPTR)lt->ti_Data );
			}
			break;
		}
		
		lt++;
	}
}

//
// new method
//

ULONG phpproxyNew( Class *c, Object *o, struct Msg *msg )
{
	Object *newObject = NULL;

	DEBUG("PHPPROXY START\n");

	newObject = ObjectSuperNew( c, msg );

	newObject->o_UserData = calloc( sizeof( struct Data ), 1 );

	DEBUG("PHPPROXY OBJECT CREATED\n");

	setForAll( c, newObject, msg );

	DEBUG("PHPPROXY return new object at ptr %p\n", newObject );

	return (ULONG)newObject;
}

//
// dispose method
//

ULONG phpproxyDispose( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;
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

//
// set method
//

ULONG phpproxySet( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;

	DEBUG("PHPPROXY set\n");

	struct opSet *set = (struct opSet *)msg;
	struct TagItem *lt = (set->ops_AttrList);

	DEBUG("PHPPROXY set before SETFORALL cptr %p optr %p\n msgptr %p\n", c, o, msg );

	setForAll( c, o, msg );

	DoSuperMethod( c, o, msg );

	return res;
}

//
// get method
//

ULONG phpproxyGet( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;
	DEBUG("PHPPROXY get\n");

	struct opGet *get = (struct opGet *)msg;
	struct Data *data = (struct Data *)o->o_UserData;

	switch( get->opg_AttrID )
	{
		case FA_PHPProxy_Parameters:
			*(get->opg_Storage)	=	(ULONG*)data->params;
			DEBUG("PHPPROXY FUIA_PHPProxy_Parameters get root value %s\n", (char *)data->params );
		break;
		case FA_PHPProxy_Results:
			*(get->opg_Storage)	=	(ULONG *)data->result;
			DEBUG("PHPPROXY FUIA_PHPProxy_Results get value %s\n", (char *)data->result );
		break;
	}

	return res;
}

//
// run process
//

#define BUFFER_SIZE	512

ULONG phpproxyProcess( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;
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

    if( data->result != NULL ){ free( data->result ); data->result = NULL; }

    char buffer[ BUFFER_SIZE ];
    
    while( !feof( pipe ) ) 
    {
    	if( fgets( buffer, BUFFER_SIZE, pipe ) != NULL )
    	{
    		if( data->result == NULL )
    		{
    			if( ( data->result = calloc( BUFFER_SIZE+1, sizeof(char) ) ) != NULL ){
    				memcpy( data->result, buffer, BUFFER_SIZE );
    				res += BUFFER_SIZE;
    			}else{
    				
    				if( ( temp = calloc( res, sizeof(char) ) ) != NULL )
    				{
    					memcpy( temp, data->result, res );
    					if( data->result != NULL ){ free( data->result ); data->result = NULL; }
    					if( ( data->result = calloc( res+BUFFER_SIZE+1, sizeof(char) ) ) != NULL ){
    						memcpy( data->result, temp, res );
    						memcpy( &(data->result[ res ]), buffer, BUFFER_SIZE );
    						res += BUFFER_SIZE;
    					}

    					free( temp );
    					temp = NULL;
    				}
    			}
    		}
    		res += (ULONG)buffer;
    	}
    }
    pclose( pipe );

	return res;
}

//
// DoMethod 
//

ULONG phpproxyDispatcher( struct Class *c, Object *o, struct Msg *m )
{
	ULONG retVal = (ULONG)NULL;
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




