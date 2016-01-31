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

#include <class/class.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <util/log/log.h>

//
// create class
//

Class *ClassCreate( ClassID cid, Class *rc, struct Hook *disp )
{
	Class *c;

	DEBUG("Create class %s\n", cid );
	if( rc != NULL )
	{
		DEBUG("SUBCLASS %s\n", rc->cl_ID );
	}

	c = calloc( sizeof( Class ), 1 );

	if( c != NULL )
	{
		c->cl_ID = cid;

		if( rc != NULL )
		{
			c->cl_Super = rc;
		}

		if( disp != NULL )
		{
			memcpy( &(c->cl_Dispatcher), disp, sizeof( struct Hook ) );
			// we copy pointer to funtion and all parameters
		}else{
			goto class_error;
		}
		DEBUG("Create class %s END\n", cid );

		return c;
	}
class_error:
	if( c )
	{
		free( c );
	}
	DEBUG("Create class PROBLEM %s END\n", cid );

	return NULL;
}

//
// remove created class
//

ULONG ClassDelete( struct Class *c )
{
	ULONG res = 0;
	DEBUG("Remove class %s , instances %ld\n", c->cl_ID, c->cl_ObjectCount  );

	if( c->cl_ObjectCount > 0 )
	{
		printf("Cannot remove class, %ld already objects use it", c->cl_ObjectCount );
		return 1;
	}

	if( c->cl_SubclassCount > 0 )
	{
		printf("Cannot remove class, %ld already objects use it", c->cl_ObjectCount );
		return 2;
	}

	if( c != NULL )
	{
		free( c );
	}

	DEBUG("Remove class END\n" );

	return res;
}

//
//
//


//#define  DoMethodA( obj, ((struct TagItem **)tags) ); }

Object *ObjectNewF( Class *c, Object *o, struct Msg *msg )
{
	Object *retObject = NULL;
	DEBUG( "Create Object\n" );

	DEBUG("Create Object: Checking pointer to superclass %p  name '%s'  msg pointer %p disppointer %p\n", c, c->cl_ID, msg, c->cl_Dispatcher.h_Function );

	// we call method on object

	retObject = (Object *)c->cl_Dispatcher.h_Function( (APTR)c, (APTR)o, (APTR) msg );

	DEBUG( "Create Object END at ptr %p\n", retObject );

	return retObject;
}

//
//
//

void ObjectDelete( Object *o )
{
	DEBUG( "Delete Object of class '%s'\n", o->o_Class->cl_ID );

	if( o != NULL )
	{
		struct Msg message;
		message.MethodID = FM_DISPOSE;
		message.data = NULL;

		Class *c = o->o_Class;
		Class *lc = o->o_Class;

		// lets substract used objects
		while( lc != NULL )
		{
			lc->cl_ObjectCount--;
			lc = lc->cl_Super;
		}

		DEBUG("Remove current object\n");
		c->cl_Dispatcher.h_Function( (APTR)c, (APTR)o, (APTR)&message );
	}
}

//
//
//

ULONG DoSuperMethod( Class *c, Object *o, struct Msg *msg )
{
    if( c->cl_Super ){ 
        Object *lo = (Object *)o->o_Node.mln_Pred; 
        Class *lc = lo->o_Class;  
        return (ULONG)lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)lo, (APTR) msg ); 
    }else{
    	return (ULONG)NULL;
    }
}
