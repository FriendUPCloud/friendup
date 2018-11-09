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
 *  Core classes    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 6 Feb 2015
 *  @date pushed 06/02/2015
 */
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

/**
 * Message handling structure
 */
typedef struct Msg
{
	FULONG MethodID;                         ///< message ID
	void *data;                             ///< pointer to data zone to transmit along with the message
} Msg;


#define FC_RootClass     "Rootclass"        ///< name of the root class
#define FC_MainClass     "Mainclass"        ///< name of the main class

#define FM_Dummy        0x0100              ///< base of message numbering
#define FM_NEW          (FM_Dummy + 1)      ///< creates a new object
#define FM_DISPOSE      (FM_Dummy + 2)      ///< destroys an object
#define FM_SET          (FM_Dummy + 3)      ///< set function
#define FM_GET          (FM_Dummy + 4)      ///< query for information
#define FM_ADDTAIL      (FM_Dummy + 5)      ///< @todo FL>PS not used, what does it do?
#define FM_REMOVE       (FM_Dummy + 6)      ///< @todo FL>PS not used, what does it do?
#define FM_NOTIFY       (FM_Dummy + 7)      ///< sends a notification
#define FM_UPDATE       (FM_Dummy + 8)      ///< @todo FL>PS not used, what does it do?
#define FM_ADDMEMBER    (FM_Dummy + 9)      ///< @todo FL>PS not used, what does it do?
#define FM_REMMEMBER    (FM_Dummy + 10)     ///< @todo FL>PS not used, what does it do?
#define FM_SETNN        (FM_Dummy + 11)     ///< call set function but without notification


/**
 * Class struture definition
 */
typedef struct Class
{
	struct Hook	cl_Dispatcher;      ///< dispatcher
	FULONG		cl_Reserved;        ///< reserved for future use
	struct		Class *cl_Super;    ///< pointer to super class
	ClassID		cl_ID;              ///< class identifier
	FULONG		cl_InstOffset;      ///< offset to data
	FULONG		cl_InstSize;        ///< size of the data zone
	IPTR		cl_UserData;        ///< user data specific
	FULONG		cl_SubclassCount;   ///< number of subclasses
	FULONG		cl_ObjectCount;     ///< object count, 0 if we want to delete it
	FULONG		cl_Flags;           ///< internal flags
	FULONG		cl_ObjectSize;      ///< cl_InstOffset + cl_InstSize + sizeof(struct _Object)
	APTR		cl_MemoryPool;      ///< pointer to memory pool
} Class;

// cl_Flags 

#define CLF_INLIST (1L<<0)

/**
 * Object instances handling structure
 *
 * This structure is situated before the pointer. It may grow in future,
 * but o_Class will always stay at the end, so that you can subtract
 * the size of a pointer from the object-pointer to get a pointer to the
 * pointer to the class of the object.
 */
typedef struct _Object
{
    Event *o_Event;
    struct MinNode  o_Node;  // PRIVATE 
    struct Class * o_Class;     // we must have pointer to class
    FULONG   o_CurrMethodID;     // current Method called for object
    void *o_UserData;            // pointer to user data
}Object;

//
//  some may be unusuable or should be changed
//

#define _OBJ(obj) ((struct _Object *)(obj))             ///< macro for casting to Object structure

#define BASEOBJECT(obj) ((Object *)(_OBJ(obj) + 1))     ///< macro for casting to previous object

#define _OBJECT(obj) (_OBJ(obj) - 1)                    ///< macro for casting to previous object

#define OCLASS(obj) ((_OBJECT(obj))->o_Class)           ///< macro to get the class of an object

#define INST_DATA(class, obj) ((APTR)(((FUBYTE *)(obj)) + (class)->cl_InstOffset))   ///< macro to get the data zone of an object

#define SIZEOF_INSTANCE(class) ((class)->cl_InstOffset + (class)->cl_InstSize+ sizeof(struct _Object))   ///< macro to get the size of an object


/**
 * Set method structure
 */
struct opSet
{
    FULONG       MethodID;               ///< id of method
    struct TagItem  *ops_AttrList;      ///< list of arguments
};

//
// object function
//

Object *ObjectNewF( Class *c, Object *o, struct Msg *msg );

//
// delete object
//

void ObjectDelete( Object *o );

/**
 * New object macro
 */

#define ObjectNew( c, ... ) \
    ({ FULONG tags[] = { __VA_ARGS__ };   \
    struct opSet set;   \
    set.MethodID = FM_NEW;  \
    set.ops_AttrList = (struct TagItem *)tags;    \
    ObjectNewF( c, NULL, (struct Msg *)&set );   \
} )

/**
 * New object macro for higher class
 */

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

/**
 * Set params and functions macro
 */
#ifndef FSet
#define set( OBJ, FUIA, VAL ) \
        ({ FULONG tags[] = { FUIA, VAL, TAG_END, TAG_END };  \
        struct Msg message; \
        message.MethodID = OM_SET;   \
        message.data = (struct TagItem *)tags; \
        Class *lc = OBJ->o_Class;  \
        lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)OBJ, (APTR) &message ); \
         })
#endif

/**
 * Set without notification macro
 */
#ifndef FSetnn
#define setnn( OBJ, FUIA, VAL ) \
        ({ FULONG tags[] = { FUIA, VAL, TAG_END, TAG_END };  \
        struct Msg message; \
        message.MethodID = OM_SETNN;   \
        message.data = (struct TagItem *)tags; \
        Class *lc = OBJ->o_Class;  \
        lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)OBJ, (APTR) &message ); \
         })
#endif

/**
 * Get attribute to object macro
 */
struct opGet
{
    FULONG       MethodID;
    Tag             opg_AttrID;
    IPTR        *opg_Storage;
};

/**
 * Get data macro
 */
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

FULONG DoSuperMethod( Class *c, Object *o, struct Msg *msg );

/**
 * Call super method macro
 */
#define DoSuperMethodA( CLASS, OBJ, MSG ) \
    {   \
    if( CLASS->cl_Super ){ \
        Object *lo = OBJ->o_Node.mln_Pred; \
        Class *lc = lo->o_Class;  \
        lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)lo, (APTR) MSG ); \
    }

/**
 * Call a method macrto
 */
#ifndef DoMethod
#define DoMethod( OBJ, MID, ... ) \
    { \
    FULONG tags[] = { __VA_ARGS__ }; \
    Class *lc = OBJ->o_Class; \
    struct Msg message; \
    message.MethodID = MID;  \
    message.data = (struct TagItem *)tags; \
    lc->cl_Dispatcher.h_Function( (APTR)lc, (APTR)OBJ, (APTR) &message ); \
    }
#endif


/**
 * @todo FL>PS what is this one?
 */
struct opAddTail
{
    FULONG       MethodID;
    struct      List *opat_List;
};

/**
 * Update structure parameters
 */
struct opUpdate
{
    FULONG       MethodID;
    struct TagItem  *opu_AttrList;
    FULONG       opu_Flags;    // see below 
};

// opu_Flags 

#define OPUF_INTERIM (1L<<0)        ///< FL>PS What is this?

/**
 * @todo FL>PS What is it?
 */
struct opMember
{
    FULONG       MethodID;
    Object      *opam_Object;
};

#define FNotify_Everytime   0xfa000000      ///< Indicates constant notification

#define opAddMember opMember

/**
 * Maybe we can put classes inside .so object and add them dinamicly
 * @todo FL>PS please explain
 */

struct ClassLibrary
{
    struct Library  cl_Lib;
    FULONG   	    cl_Pad;
    Class    	    *cl_Class;
};

//
// create and delete class
//

Class *ClassCreate( ClassID cid, Class *rc, struct Hook *disp );

FULONG ClassDelete( struct Class *c );


#endif // __CLASS_CLASS_H__

