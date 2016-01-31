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
#include <util/log/log.h>
#include <core/event.h>

//
//
//

ULONG DoMethodS( Class *c, Object *o, struct Msg *m );

//
// Special class data
//

struct Data
{
	ULONG value;
};

//
//
//

//
// one set function for all:)
//

void rootSetForAll( Class *c, Object *o, struct Msg *msg )
{
	DEBUG("ROOTNEW: SET FOR ALL\n");

	struct opSet *set = (struct opSet *)msg;
	DEBUG("ROOTNEW: SET FOR ALL 1\n");
	struct TagItem *lt = (set->ops_AttrList);
	DEBUG("ROOTNEW: SET FOR ALL 2\n");
	struct Data *data = (struct Data *)o->o_UserData;

	DEBUG("ROOTNEW: SET FOR ALL 3\n");

	while( lt->ti_Tag != TAG_END )
	{
		switch( lt->ti_Tag )
		{
			case FA_SetValue:
				data->value = (ULONG)lt->ti_Data;
				DEBUG("ROOTNEW FUIA_SetValue set root value %lu\n", lt->ti_Data );
			break;
		}
		
		lt++;
	}
}

//
// New method
//

ULONG rootNew( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;
	DEBUG("ROOTNEW START\n");

	struct opSet *set = (struct opSet *)msg;//->data;
	struct TagItem *lt = (set->ops_AttrList);
	Object *newObject = NULL;

	DEBUG("ROOTNEW \n");

	if( ( newObject = calloc( sizeof( Object ), 1 ) ) != NULL )
	{
		newObject->o_UserData = calloc( sizeof( struct Data ), 1 );
		newObject->o_Class = c;
		c->cl_ObjectCount++;
		DEBUG("ROOTNEW object created %ld\n", c->cl_ObjectCount );
	}else{
		return (ULONG)NULL;
	}

	struct Data *data = (struct Data *)newObject->o_UserData;

	rootSetForAll( c, newObject, msg );

	DEBUG("ROOTNEW return new object at ptr %p\n", newObject );

	return (ULONG)newObject;
}

//
// Dispose method
//

ULONG rootDispose( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;

	DEBUG("ROOTDISPOSE start\n");

	// remove notifications first

	Event *event = o->o_Event;

	while( event != NULL )
	{
		Event *delEvent = event;
		event = (Event *)event->node.mln_Succ;

		free( delEvent );
	}

	// remove data

	if( o->o_UserData != NULL)
	{
		free( o->o_UserData );
		o->o_UserData = NULL;
	}
	free( o );

	DEBUG("ROOTDISPOSE\n");

	return res;
}

//
// set method
//

ULONG rootSet( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;
	DEBUG("ROOTSET\n");

	struct opSet *set = (struct opSet *)msg;
	struct TagItem *lt = (set->ops_AttrList);
	struct Data *data = (struct Data *)o->o_UserData;

	rootSetForAll( c, o, msg );

	return res;
}

//
// get method
//

ULONG rootGet( Class *c, Object *o, struct Msg *msg )
{
	ULONG res = 0;
	DEBUG("ROOTGET\n");

	struct opGet *get = (struct opGet *)msg;
	struct Data *data = (struct Data *)o->o_UserData;

	switch( get->opg_AttrID )
	{
		case FA_SetValue:
			*(get->opg_Storage)	=	(ULONG *)data->value;
			DEBUG("ROOTGET FUIA_GetValue get root value %lu\n", data->value );
		break;
	}

	return res;
}


//
// notify
//

ULONG rootNotify( Class *c, Object *o, struct Msg *msg )
{
	struct opSet *set = (struct opSet *)msg;//->data;
	ULONG *lt = (ULONG *)(set->ops_AttrList);
	Event *event = (Event *)msg;
	Event *lastEvent = o->o_Event;
	struct Data *data = (struct Data *)o->o_UserData;

	DEBUG("NOTIFY: SET FOR ALL\n");

	if( ( event = calloc( sizeof( Event ), 1 ) ) != NULL )
	{
		event->e_Src = o;                // pointer to source object
 		event->e_AttributeCheck = lt[ 0 ];       // check argument set
    	event->e_Value = lt[ 1 ];                // if value is set do something

		event->e_Dst = (void *)lt[ 2 ];
		event->e_DstMethodID = lt[ 3 ];
		event->e_Data = (void *)lt[ 4 ];
		DEBUG("NOTIFY SET OBJECT %ld  method %x data %ld\n", lt[ 2 ], (unsigned int)lt[ 3 ], lt[ 4 ] );

		if( lastEvent != NULL )
		{
			while( lastEvent->node.mln_Succ != NULL )
			{
				lastEvent = (Event *)lastEvent->node.mln_Succ;
			}

			lastEvent->node.mln_Succ = (struct MinNode *)event;
			event->node.mln_Pred = (struct MinNode *)lastEvent;
		}else{
			o->o_Event = event;
		}

		
	}else{
		return 1;
	}

	return 0;
}

//
// TEST
//

ULONG rootTest( Class *c, Object *o, struct Msg *msg )
{
	ULONG *data = (ULONG *)(msg->data);

	DEBUG("ROOTTEST with parameter pointer %ld\n", *data );

	return 0;
}

//
// DoMethod 
//

ULONG rootDispatcher( struct Class *c, Object *o, struct Msg *m )
{
	// we dont call super methods beacouse this method is done on root
	DEBUG("ROOTCLASS dispatcher MID %ld \n", m->MethodID );
	//o->curr_MethodID = m->MethodID;

	switch( m->MethodID )
	{
	case FM_NEW:		return rootNew( c, o, m );
		break;

	case FM_DISPOSE:	return rootDispose( c, o, m );
		break;

	case FM_SET:
		{
			Event *event = o->o_Event;
			struct opSet *set = (struct opSet *)m;

			DEBUG("Event call: OM_SET called %p\n", event );

			while( event != NULL )
			{
				struct TagItem *lt = (set->ops_AttrList);

				DEBUG("Event call: check %p\n", lt );

				while( lt->ti_Tag != TAG_END )
				{
					if( lt->ti_Tag == event->e_AttributeCheck )
					{
						if( lt->ti_Data == FNotify_Everytime )
						{
							DEBUG("Event call: Every Time call\n");
							DoMethod( event->e_Dst, event->e_DstMethodID, event->e_Data );
						}else if( event->e_Value == (LONG)lt->ti_Data )
						{
							DEBUG("Event call: for value %ld\n", event->e_Value );
							DoMethod( event->e_Dst, event->e_DstMethodID, event->e_Data );
						}
					}
					lt++;
				}

				event = (Event *)event->node.mln_Succ;
			}
		}
	case FM_SETNN:		return rootSet( c, o, m );
		break;

	case FM_GET:		return rootGet( c, o, m );
		break;

	case FM_NOTIFY:		return rootNotify( c, o, m );
		break;

	case FM_Root_Test: return rootTest( c, o, m );
		break;
	}

	return 0;
}




