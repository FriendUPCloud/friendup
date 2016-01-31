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

#ifndef __CLASS_CLASS_H__
#define __CLASS_CLASS_H__

#include <core/types.h>
#include <util/tagitem.h>
#include <core/event.h>
#include <util/hooks.h>
#include <core/library.h>


#ifndef __typedef_ClassID
#   define __typedef_ClassID
    typedef const char *ClassID;
#endif

typedef struct Msg
{
	ULONG MethodID;
	void *data;
} Msg;


// ClassID

#define FC_RootClass     "Rootclass"
#define FC_MainClass     "Mainclass"


#define FM_Dummy        0x0100
#define FM_NEW          (FM_Dummy + 1)
#define FM_DISPOSE      (FM_Dummy + 2)
#define FM_SET          (FM_Dummy + 3)      // Call set function
#define FM_GET          (FM_Dummy + 4)
#define FM_ADDTAIL      (FM_Dummy + 5)
#define FM_REMOVE       (FM_Dummy + 6)
#define FM_NOTIFY       (FM_Dummy + 7)
#define FM_UPDATE       (FM_Dummy + 8)
#define FM_ADDMEMBER    (FM_Dummy + 9)
#define FM_REMMEMBER    (FM_Dummy + 10)
#define FM_SETNN        (FM_Dummy + 11)     // call set function but without notification


//
//
//


// Class structure

typedef struct Class
{
	struct Hook	cl_Dispatcher;
	ULONG		cl_Reserved;
	struct		Class *cl_Super;         // root class 
	ClassID		cl_ID;
	ULONG		cl_InstOffset;      // 
	ULONG		cl_InstSize;        // 
	IPTR		cl_UserData;      // user data specific
	ULONG		cl_SubclassCount; // number of subclasses
	ULONG		cl_ObjectCount;   // object count, 0 if we want to delete it
	ULONG		cl_Flags;         //
	ULONG		cl_ObjectSize;    // cl_InstOffset + cl_InstSize + sizeof(struct _Object) 
	APTR		cl_MemoryPool;
} Class;

// cl_Flags 

#define CLF_INLIST (1L<<0)

// This structure is situated before the pointer. It may grow in future,
//   but o_Class will always stay at the end, so that you can subtract
//   the size of a pointer from the object-pointer to get a pointer to the
//   pointer to the class of the object. 

typedef struct _Object
{
    Event *o_Event;
    struct MinNode  o_Node;  // PRIVATE 
    struct Class * o_Class;     // we must have pointer to class
    ULONG   o_CurrMethodID;     // current Method called for object
    void *o_UserData;            // pointer to user data
}Object;

//
//  some may be unusuable or should be changed
//

#define _OBJ(obj) ((struct _Object *)(obj))

#define BASEOBJECT(obj) ((Object *)(_OBJ(obj) + 1))

#define _OBJECT(obj) (_OBJ(obj) - 1)

#define OCLASS(obj) ((_OBJECT(obj))->o_Class)

#define INST_DATA(class, obj) ((APTR)(((UBYTE *)(obj)) + (class)->cl_InstOffset))

#define SIZEOF_INSTANCE(class) ((class)->cl_InstOffset + (class)->cl_InstSize \
                               + sizeof(struct _Object))


//
//  set structure
//

struct opSet
{
    ULONG       MethodID;       // id of method
    struct TagItem  *ops_AttrList;      // list of arguments
};

//
// object function
//

Object *ObjectNewF( Class *c, Object *o, struct Msg *msg );

//
// delete object
//

void ObjectDelete( Object *o );

//
// new object macro
//

#define ObjectNew( c, ... ) \
    ({ ULONG tags[] = { __VA_ARGS__ };   \
    struct opSet set;   \
    set.MethodID = FM_NEW;  \
    set.ops_AttrList = (struct TagItem *)tags;    \
    ObjectNewF( c, NULL, (struct Msg *)&set );   \
} )

//
// New object marco for higher class
//
//

#define ObjectSuperNew( CLASS, MSG ) \
    ({  Object *nObj, *sObj;   \
        nObj = (Object *)calloc( sizeof( Object ), 1 );   \
        \
        nObj->o_Class = CLASS;   \
        CLASS->cl_ObjectCount++;    \
        \
        DEBUG("NewSuperObject objects %ld\n", CLASS->cl_ObjectCount );  \
        \
        sObj = (Object *)ObjectNewF( CLASS->cl_Super, nObj, (struct Msg *)msg ); \
        \
        DEBUG("NewSuperObject\n"); \
        \
        nObj->o_Node.mln_Pred = (struct MinNode *)sObj;  \
        sObj->o_Node.mln_Succ = (struct MinNode *)nObj;  \
        DEBUG("NewSuperObject ADDED\n"); \
        nObj;\
    })

//
// set params and functions
//

#ifndef FSet
#define set( OBJ, FUIA, VAL ) \
        ({ ULONG tags[] = { FUIA, VAL, TAG_END, TAG_END };  \
        struct Msg message; \
        message.MethodID = OM_SET;   \
        message.data = (struct TagItem *)tags; \
        Class *lc = OBJ->o_Class;  \
        lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)OBJ, (APTR) &message ); \
         })
#endif

// set without notification

#ifndef FSetnn
#define setnn( OBJ, FUIA, VAL ) \
        ({ ULONG tags[] = { FUIA, VAL, TAG_END, TAG_END };  \
        struct Msg message; \
        message.MethodID = OM_SETNN;   \
        message.data = (struct TagItem *)tags; \
        Class *lc = OBJ->o_Class;  \
        lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)OBJ, (APTR) &message ); \
         })
#endif

//
// get attribute to object
//

struct opGet
{
    ULONG       MethodID;
    Tag             opg_AttrID;
    IPTR        *opg_Storage;
};

#ifndef FGet
#define FGet( OBJ, FUIA, VAL ) \
    { \
    Class *lc = OBJ->o_Class;  \
    struct opGet message; \
    message.MethodID = OM_GET;  \
    message.opg_AttrID = FUIA; \
    message.opg_Storage = VAL;  \
    lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)OBJ, (APTR) &message ); \
    }
#endif

//
//
//

ULONG DoSuperMethod( Class *c, Object *o, struct Msg *msg );

//
// call super method
//

#define DoSuperMethodA( CLASS, OBJ, MSG ) \
    {   \
    if( CLASS->cl_Super ){ \
        Object *lo = OBJ->o_Node.mln_Pred; \
        Class *lc = lo->o_Class;  \
        lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)lo, (APTR) MSG ); \
    }

#ifndef DoMethod
#define DoMethod( OBJ, MID, ... ) \
    { \
    ULONG tags[] = { __VA_ARGS__ }; \
    Class *lc = OBJ->o_Class; \
    struct Msg message; \
    message.MethodID = MID;  \
    message.data = (struct TagItem *)tags; \
    lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)OBJ, (APTR) &message ); \
    }
#endif



struct opAddTail
{
    ULONG       MethodID;
    struct      List *opat_List;
};

//
// update structure parameters
//

struct opUpdate
{
    ULONG       MethodID;
    struct TagItem  *opu_AttrList;
    ULONG       opu_Flags;    // see below 
};

// opu_Flags 

#define OPUF_INTERIM (1L<<0)

struct opMember
{
    ULONG       MethodID;
    Object      *opam_Object;
};

#define FNotify_Everytime   0xfa000000

#define opAddMember opMember

// maybe we can put classes inside .so object and add them dinamicly

struct ClassLibrary
{
    struct Library  cl_Lib;
    ULONG   	    cl_Pad;
    Class    	    *cl_Class;
};

//
// create and delete class
//

Class *ClassCreate( ClassID cid, Class *rc, struct Hook *disp );

ULONG ClassDelete( struct Class *c );


#endif // __CLASS_CLASS_H__

