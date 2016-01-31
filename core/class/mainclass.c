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


struct Data
{
	ULONG test;
};

//
//
//

ULONG mainNew( Class *c, Object *o, struct Msg *msg )
{
	struct opSet *set = (struct opSet *)msg;//->data;
	struct TagItem *lt = (set->ops_AttrList);
	//o->o_UserData = calloc( sizeof( struct Data ), 1 );
	Object *newObject = NULL;

	DEBUG("MAINNEW START\n");

	newObject = ObjectSuperNew( c, msg );

	DEBUG("MAINNEW with setID %ld ATTRLISTPOINTER %p pointer %p\n", set->MethodID, set->ops_AttrList, set );

	while( lt->ti_Tag != TAG_END )
	{
		//printf("MAINNEW inside loop %x %lu\n", lt->ti_Tag, lt->ti_Data );
		lt++;
	}

	DEBUG("MAINNEW return new object at ptr %p\n", newObject );

	return (ULONG)newObject;
}

//
//
//

ULONG mainDispose( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;

	DEBUG("MAINDISPOSE start\n");

	if( o->o_UserData != NULL)
	{
		free( o->o_UserData );
		o->o_UserData = NULL;
	}

	DoSuperMethod( c, o, msg );

	free( o );

	DEBUG("MAINDISPOSE END\n");

	return res;
}

//
//
//

ULONG mainSet( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;

	DEBUG("MAINNEW set\n");

	struct opSet *set = (struct opSet *)msg;
	struct TagItem *lt = (set->ops_AttrList);

	while( lt->ti_Tag != TAG_END )
	{
		//printf("MAINNEW set loop %x %lu\n", lt->ti_Tag, lt->ti_Data );
		lt++;
	}

	DoSuperMethod( c, o, msg );

	return res;
}


// DoMethod 

ULONG mainDispatcher( struct Class *c, Object *o, struct Msg *m )
{
	ULONG retVal = (ULONG)NULL;
	// we dont call super methods beacouse this method is done on root
	DEBUG("MAINNEW dispatcher MID %ld \n", m->MethodID );
	//o->curr_MethodID = m->MethodID;

	switch( m->MethodID )
	{
	case FM_NEW:		return mainNew( c, o, m );
		break;

	case FM_DISPOSE:	return mainDispose( c, o, m );
		break;

	case FM_SET:		return mainSet( c, o, m );
		break;

	//case OM_GET:
	//	break;

	case FM_ADDTAIL:
		break;

	case FM_REMOVE:
		break;

	case FM_NOTIFY:
		break;
	
	case FM_UPDATE:
		break;

	case FM_ADDMEMBER:
		break;

	case FM_REMMEMBER:
		break;

	default:
		retVal = DoSuperMethod( c, o, m );
		break;
	}

	return retVal;
}




