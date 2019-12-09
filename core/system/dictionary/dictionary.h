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
 * Definition of  dictionary
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#ifndef __DICTIONARY_DICTIONARY_H__
#define __DICTIONARY_DICTIONARY_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>

/*
 CREATE TABLE IF NOT EXISTS `FDictionary` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `CategoryID` bigint(20),
   `Message` text DEFAULT NULL,
   `Language` varchar(10) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 
 CREATE TABLE IF NOT EXISTS  `FCategory` (
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `Name` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 
 ALTER TABLE `FDictionary` ADD COLUMN `DictID` bigint(20) NOT NULL;

 */

typedef struct DictEntry
{
	struct MinNode 			node;
	FULONG 					de_ID;				// id of cathegory
	FULONG					de_DictID;			// id of message (enum)
	FULONG 					de_CategoryID;		// id of category of message
	char 					*de_Message;			// message
	char					*de_Lang;			// language
}DictEntry;

typedef struct Dictionary
{
	DictEntry						*d_DictList;			// list of entries in DB
	char							**d_Msg;		// global dictionary (as table)
	int								d_Entries;	// number of entries
}Dictionary;

//
// Dictionary category
//
	
enum {
	DICT_CATEGORY_GLOBAL = 0,
	DICT_CATEGORY_USER_STATUS
};

static FULONG DictionaryDesc[] = { SQLT_TABNAME, (FULONG)"FDictionary", SQLT_STRUCTSIZE, sizeof( struct DictEntry ),
	SQLT_IDINT, (FULONG)"ID", offsetof( DictEntry, de_ID ),
	SQLT_INT, (FULONG)"DictID", offsetof( DictEntry, de_CategoryID ),
	SQLT_INT, (FULONG)"CategoryID", offsetof( DictEntry, de_CategoryID ),
	SQLT_STR, (FULONG)"Message", offsetof( DictEntry, de_Message ),
	SQLT_STR, (FULONG)"Language", offsetof( DictEntry, de_Lang ),
	SQLT_NODE, (FULONG)"node", offsetof( struct DictEntry, node ),
	SQLT_END };
	
//
// Dictionary
//

enum {
	DICT_PID_IS_MISSING = 0,
	DICT_FUNCTION_NOT_FOUND,
	DICT_PATH_PARAMETER_IS_EMPTY,
	DICT_SESSIONID_AUTH_MISSING,
	DICT_ADMIN_RIGHT_REQUIRED,
	DICT_POST_MODE_PARAMETERS_REQUIRED,
	DICT_ACCOUNT_BLOCKED,
	DICT_AUTHMOD_NOT_SELECTED,
	DICT_USER_PASS_DEV_REQUIRED,
	DICT_AUTH_PUBLIC_KEY_NOT_SUPPORTED,
	DICT_USERSESSION_OR_USER_NOT_FOUND,
	DICT_USER_SESSION_NOT_FOUND,
	DICT_USER_DEV_REQUIRED,
	DICT_USER_NOT_FOUND,
	DICT_PARAMETERS_MISSING,
	DICT_CANNOT_CHANGE_PASS,
	DICT_SQL_LIBRARY_NOT_FOUND,
	DICT_CANNOT_ALLOCATE_MEMORY,
	DICT_FUNCTION_RETURNED,
	DICT_USER_ALREADY_EXIST,
	DICT_SERVICE_OR_SERVNAME_NOT_FOUND,
	DICT_FILE_OR_DIRECTORY_DO_NOT_EXIST,
	DICT_DEVICE_NOT_FOUND,
	DICT_CANNOT_OPEN_FILE,
	DICT_SENTINEL_USER_REQUIRED,
	DICT_FILESYSTEM_NOT_FOUND,
	DICT_FUNCTION_RETURNED_EMPTY_STRING,
	DICT_CANNOT_CREATE_TEMPORARY_FILE,
	DICT_FILE_NOT_EXIST_OR_EMPTY,
	DICT_CANNOT_SEND_NOTIFICATION,
	DICT_ENTRY_CANNOT_BE_REMOVED,
	DICT_CANNOT_UPDATE_DOOR_NOTIFICATION,
	DICT_CANNOT_CHANGE_ACCESS,
	DICT_CANNOT_SHARE_FILE,
	DICT_DESTINATION_DRIVE_NOT_FOUND,
	DICT_NO_ACCESS_TO,
	DICT_MODULE_RETURNED_EMPTY_STRING,
	DICT_MISSING_PART_OF_PATH,
	DICT_USER_OR_DEVICE_NOT_EXIST,
	DICT_DEVICE_CANNOT_BE_SHARED,
	DICT_INVALID_USER_SESSION,
	DICT_NO_DISKNAME_OR_DISK,
	DICT_POLL_DRIVE_NO_DATA,
	DICT_DRIVE_NOT_FOUND,
	DICT_NO_ENTRY_IN_DB,
	DICT_SASID_NOT_FOUND,
	DICT_NO_ACCESS_TO_VARIABLE,
	DICT_NO_USERSESSION_IN_SAS,
	DICT_CANNOT_SEND_MSG_ERR,
	DICT_CANNOT_REMOVE_USERS,
	DICT_CANNOT_ADD_USERS,
	DICT_CANNOT_CREATE_SAS,
	DICT_CANNOT_CONVERT_MESSAGE,
	DICT_SERVER_CONNECT_ERROR,
	DICT_CANNOT_PARSE_COMMAND_OR_NE_LIB,
	DICT_BAD_ERROR_OR_PASSWORD,
	DICT_CANNOT_FIND_DEVICE,
	DICT_CANNOT_UNLOCK_PORT,
	DICT_PRINTER_NOT_ADDED_ERR,
	DICT_CONNECTION_CREATED,
	DICT_CONNECTION_REUSED,
	DICT_FCCONNECTION_CANNOT_CREATE,
	DICT_CONNECTION_NOT_FOUND,
	DICT_CONNECTION_DELETED,
	DICT_CANNOT_DELETE_CONNECTION,
	DICT_CONNECTION_ALREADY_EXIST,
	DICT_NO_MEMORY_FOR_DOSTOKEN,
	DICT_CANNOT_ADD_DOSTOKEN,
	DICT_CANNOT_REMOVE_DOSTOKEN,
	DICT_USER_GROUP_ALREADY_EXIST,
	DICT_BAD_CHARS_USED,
	DICT_NO_PERMISSION,
	DICT_MAX
};
/*
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'PID parameter is missing', 'ENG', '0');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Function not found', 'ENG', '1');
-- systembase
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Path parameter is empty', 'ENG', '2');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'sessionid or authid parameter is missing', 'ENG', '3');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot execute function. Admin rights required', 'ENG', '4');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Parameters must be send by using POST method', 'ENG', '5');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Account blocked until: %lu', 'ENG', '6');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Authentication module not selected', 'ENG', '7');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Missing parameters: username,password,deviceid', 'ENG', '8');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Authentication by using publickeys is not supported', 'ENG', '9');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'User session or User not found', 'ENG', '10');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'User session not found', 'ENG', '11');
-- user manager web
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Missing parameters: username,deviceid', 'ENG', '12');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'User not found', 'ENG', '13');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Missing parameters: %s', 'ENG', '14');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot change password, error: %d', 'ENG', '15');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'SQL.library not found', 'ENG', '16');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot allocate memory', 'ENG', '17');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Function %s returned: %d', 'ENG', '18');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'User already exist', 'ENG', '19');
-- service manager.c
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Service not found or service name parameter is missing!', 'ENG', '20');
-- sambafs
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'File or directory do not exist', 'ENG', '21');
-- remote manager
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Device: %s not found', 'ENG', '22');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot open file: %s', 'ENG', '23');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Sentinel user access rights missing', 'ENG', '24');
-- fs manager web
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Filesystem not found', 'ENG', '25');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Function %s returned empty string', 'ENG', '26');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot create temporary file', 'ENG', '27');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'File do not exist or its empty', 'ENG', '28');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot send notification. Error %d', 'ENG', '29');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Entry with id: %lu cannot be removed', 'ENG', '30');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot update notification entry. Error: %d', 'ENG', '31');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot change access. Error %d', 'ENG', '32');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot share file', 'ENG', '33');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Destination drive not found', 'ENG', '34');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'No access to: %s', 'ENG', '35');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Module call returned empty string', 'ENG', '36');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Part %d of path is missing', 'ENG', '37');
-- device manager
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'User or device do not exist', 'ENG', '38');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Device cannot be shared. Error %d', 'ENG', '39');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Invalid user session', 'ENG', '40');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'No disk name specified or disk does not exist', 'ENG', '41');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot poll drive. No data in DB', 'ENG', '42');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Drive not found: %s', 'ENG', '43');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'No entry in DB: %s', 'ENG', '44');
-- application web
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'SASID not found', 'ENG', '45');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'No access to variable', 'ENG', '46');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'No user session in SAS', 'ENG', '47');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot send message. Error %d', 'ENG', '48');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot remove users', 'ENG', '49');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot add users', 'ENG', '50');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot create SAS', 'ENG', '51');
-- admin web
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot convert message', 'ENG', '52');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot setup connection: %s', 'ENG', '53');
-- websockets
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot parse command or not existing lib was called', 'ENG', '54');
-- protocol_webdav
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Bad user or password', 'ENG', '55');
-- usb device web
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot find device by ID: %lu', 'ENG', '56');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot unlock port. Error: %d', 'ENG', '57');
-- printer
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Printer not added. Error: %d', 'ENG', '58');
--adminweb
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Connection created', 'ENG', '59');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Connection reused', 'ENG', '60');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'FCConnection cannot be created', 'ENG', '61');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Connection not found', 'ENG', '62');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Connection deleted', 'ENG', '63');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot delete connection. Internal error: %d', 'ENG', '63');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Connection with that name already exist', 'ENG', '64');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot allocate memory for DOSToken', 'ENG', '65');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot add token to list', 'ENG', '66');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Cannot remove token from list', 'ENG', '67');

INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'User Group already exist', 'ENG', '68');

INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'Bad chars used', 'ENG', '69');

INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '0', 'No access, special rights required', 'ENG', '70');
*/

// User status

/*
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '1', 'Active', 'ENG', '0');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '1', 'Disabled', 'ENG', '1');
INSERT INTO `FDictionary` (`ID`, `CategoryID`, `Message`, `Language`, `DictID`) VALUES (NULL, '1', 'Blocked', 'ENG', '2');
*/

// Load dictionary from DB
	
Dictionary *DictionaryNew( SQLLibrary *mysqllib );

// release dictionary

void DictionaryDelete( Dictionary *d );

//

void DictEntryDelete( DictEntry *d );

//

void DictEntryDeleteAll( DictEntry* d);


#endif //__DICTIONARY_DICTIONARY_H__
