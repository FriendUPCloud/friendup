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
 *  User Manager
 *
 * file contain all functitons related to remote user management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/07/2016
 */

#include "user_manager_remote.h"
#include "user.h"

#include <system/systembase.h>
#include <util/sha256.h>

/**
 * Add remote user
 *
 * @param um pointer to UserManager
 * @param name user name as string
 * @param sessid sessionid
 * @param hostname hostname string
 * @return 0 when success, otherwise error number
 */
int UMAddGlobalRemoteUser( UserManager *um, const char *name, const char *sessid, const char *hostname )
{
	DEBUG("[UMAddGlobalRemoteUser] start\n");
	
	RemoteUser *actUsr = um->um_RemoteUsers;
	while( actUsr != NULL )
	{
		if( strcmp( name, actUsr->ru_Name ) == 0 && strcmp( hostname, actUsr->ru_Host ) == 0 )
		{
			break;
		}
		
		actUsr = (RemoteUser *)actUsr->node.mln_Succ;
	}
	
	if( actUsr == NULL )
	{
		actUsr = RemoteUserNew( (char *) name, (char *)hostname );
		if( actUsr != NULL )
		{
			actUsr->node.mln_Succ = (MinNode *) um->um_RemoteUsers;
			um->um_RemoteUsers = actUsr;
			
			actUsr->ru_SessionID = StringDuplicate( sessid );
		}
	}
	
	if( actUsr != NULL )
	{
		actUsr->ru_ConNumber++;
		
		SystemBase *sb = (SystemBase *)um->um_SB;
		CommService *service = sb->fcm->fcm_CommService;
		
		Socket *newsock;
		
		newsock = SocketConnectHost( service->s_SB, service->s_secured, actUsr->ru_Host, service->s_port, TRUE );
		if( newsock != NULL )
		{
			FConnection *con = CommServiceAddConnection( service, newsock, NULL, actUsr->ru_Host, NULL, SERVER_CONNECTION_OUTGOING, 0 );
			if( con != NULL )
			{
				actUsr->ru_Connection = con;
			}
			
			// now we must send authid and later notification about changes
		}
		else
		{
			FERROR("Cannot open socket to setup FC-FC connection\n");
		}
	}
	
	DEBUG("[UMAddGlobalRemoteUser] end\n");
	
	return 0;
}

/**
 * Remove remote user
 *
 * @param name user name as string
 * @param hostname hostname string
 * @return 0 when success, otherwise error number
 */
int UMRemoveGlobalRemoteUser( UserManager *um, const char *name, const char *hostname )
{
	DEBUG("[UMRemoveGlobalRemoteUser] start\n");
	SystemBase *sb = (SystemBase *)um->um_SB;
	CommService *service = sb->fcm->fcm_CommService;
	
	RemoteUser *actUsr = um->um_RemoteUsers;
	RemoteUser *prevUsr = actUsr;
	while( actUsr != NULL )
	{
		if( strcmp( name, actUsr->ru_Name ) == 0 && strcmp( hostname, actUsr->ru_Host ) == 0 )
		{
			break;
		}
		
		prevUsr = actUsr;
		actUsr = (RemoteUser *)actUsr->node.mln_Succ;
	}
	
	if( actUsr != NULL )
	{
		actUsr->ru_ConNumber--;
		
		// we have less or equal connections to 0
		// user can be removed from list
		
		if( actUsr->ru_ConNumber <= 0 )
		{
			if( actUsr == um->um_RemoteUsers )
			{
				um->um_RemoteUsers = (RemoteUser *) um->um_RemoteUsers->node.mln_Succ;
			}
			else
			{
				prevUsr->node.mln_Succ = actUsr->node.mln_Succ;
			}
			
			//CommServiceDelConnection( service, actUsr->ru_Connection, actUsr->ru_Connection->cfcc_Socket );
			RemoteUserDelete( actUsr );
		}
	}
	
	DEBUG("[UMRemoveGlobalRemoteUser] end\n");
	
	return 0;
}

/**
 * Add remote drive (and user if needed)
 *
 * @param um pointer to UserManager
 * @param uname user name as string
 * @param authid authenticationid
 * @param hostname hostname string
 * @param localDevName local device name
 * @param remoteDevName remote device name
 * @return 0 when success, otherwise error number
 */
int UMAddGlobalRemoteDrive( UserManager *um, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG remoteid )
{
	DEBUG("[UMAddGlobalRemoteDrive] start\n");
	FBOOL registerUser = FALSE;
	FBOOL registerDrive = FALSE;
	FConnection *con = NULL;
	SystemBase *sb = (SystemBase *)um->um_SB;
	CommService *service = sb->fcm->fcm_CommService;
	
	RemoteUser *actUsr = um->um_RemoteUsers;
	RemoteDrive *remDri = NULL;
	
	// try to find user first
	
	while( actUsr != NULL )
	{
		if( strcmp( uname, actUsr->ru_Name ) == 0 && strcmp( hostname, actUsr->ru_Host ) == 0 )
		{
			DEBUG("[UMAddGlobalRemoteDrive] User found %s - host %s\n", uname, hostname );
			con = actUsr->ru_Connection;
			break;
		}
		
		actUsr = (RemoteUser *)actUsr->node.mln_Succ;
	}
	
	// if user do not exist then connection must be created
	
	if( actUsr == NULL )
	{
		registerUser = TRUE;
		registerDrive = TRUE;
		
		actUsr = RemoteUserNew( (char *)uname, (char *) hostname );
		if( actUsr != NULL )
		{
			actUsr->ru_AuthID = StringDuplicate( authid );
			
			Socket *newsock;
			
			newsock = SocketConnectHost( service->s_SB, service->s_secured, actUsr->ru_Host, service->s_port, TRUE );
			if( newsock != NULL )
			{
				con = CommServiceAddConnection( service, newsock, NULL, actUsr->ru_Host, NULL, SERVER_CONNECTION_OUTGOING, 0 );
				if( con != NULL )
				{
					actUsr->ru_Connection = con;
					
					CommServiceRegisterEvent( con, newsock );
				}
				else
				{
					FERROR("Cannot setup CommService connection with server: %s\n", actUsr->ru_Host );
					if( actUsr->ru_AuthID != NULL )
					{
						FFree( actUsr->ru_AuthID );
						actUsr->ru_AuthID = NULL;
					}
					RemoteUserDelete( actUsr );
					
					newsock->s_Interface->SocketDelete( newsock );
					
					return -1;
				}
			}
			else
			{
				FERROR("Cannot setup socket connection with server: %s\n", actUsr->ru_Host );
				if( actUsr->ru_AuthID != NULL )
				{
					FFree( actUsr->ru_AuthID );
					actUsr->ru_AuthID = NULL;
				}
				RemoteUserDelete( actUsr );
				
				return -1;
			}
			// user is only added to list when connection worked
			actUsr->node.mln_Succ = (MinNode *) um->um_RemoteUsers;
			um->um_RemoteUsers = actUsr;
		}
		else
		{
			FERROR("Cannot allocate memory for RemoteUser!\n");
			return -2;
		}
	}
	
	if( actUsr != NULL )
	{
		// we are increasing connection number
		
		actUsr->ru_ConNumber++;
		
		// try to find remote drive
		
		remDri = actUsr->ru_RemoteDrives;
		while( remDri != NULL )
		{
			if( remDri->rd_LocalName != NULL && strcmp( localDevName, remDri->rd_LocalName ) == 0 &&
				remDri->rd_RemoteName != NULL && strcmp( remoteDevName, remDri->rd_RemoteName ) == 0 )
			{
				break;
			}
		}
		
		// if drive doesnt exist, we must create one
		
		if( remDri == NULL )
		{
			registerDrive = TRUE;
			
			remDri = RemoteDriveNew( localDevName, remoteDevName );
			if( remDri != NULL )
			{
				remDri->node.mln_Succ = (MinNode *)actUsr->ru_RemoteDrives;
				actUsr->ru_RemoteDrives = remDri;
			}
		}
	}
	
	DEBUG("[UMAddGlobalRemoteDrive] Before register drive %d\n", registerDrive );
	
	if( registerUser == TRUE || registerDrive == TRUE )
	{
		int iuname = 0;//sprintf( luname, "username=%s", uname );
		int iauthid = 0;//sprintf( lauthid, "authid=%s", authid );
		int ilocuname = 0;//sprintf( llocuname, "locusername=%s", locuname );
		int ilocalDevName = 0;//sprintf( llocalDevName, "locdevname=%s", localDevName );
		int iremoteDevName = 0;//sprintf( lremoteDevName, "remotedevname=%s", remoteDevName );
		int idevid = 0;
		
		char *luname = createParameter( "username", (char *)uname, &iuname );//FCalloc( strlen(uname)+10, sizeof(char));
		char *lauthid = createParameter( "authid", (char *)authid, &iauthid );//= FCalloc( strlen(authid)+8, sizeof(char));
		char *llocuname = createParameter( "locusername", (char *)locuname, &ilocuname );//= FCalloc( strlen(locuname)+13, sizeof(char));
		char *llocalDevName = createParameter( "locdevname", localDevName, &ilocalDevName );//FCalloc( strlen(localDevName)+12, sizeof(char));
		char *lremoteDevName  = createParameter( "remotedevname", remoteDevName, &iremoteDevName );//FCalloc( strlen(remoteDevName)+20, sizeof(char));
		char *deviceID = createParameterFULONG("deviceid", remoteid, &idevid );
		
		MsgItem tags[] = {
			{ ID_FCRE,  (FULONG)0, (FULONG)MSG_GROUP_START },
			{ ID_FCID,  (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)sb->fcm->fcm_ID },
			{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
			{ ID_RDRI, (FULONG)0 , MSG_INTEGER_VALUE },
			{ ID_PARM, (FULONG)0, MSG_GROUP_START },
			{ ID_PRMT, (FULONG) iuname, (FULONG)luname },
			{ ID_PRMT, (FULONG) iauthid, (FULONG)lauthid },
			{ ID_PRMT, (FULONG) ilocuname, (FULONG)llocuname },
			{ ID_PRMT, (FULONG) ilocalDevName, (FULONG)llocalDevName },
			{ ID_PRMT, (FULONG) iremoteDevName, (FULONG)lremoteDevName },
			{ ID_PRMT, (FULONG) idevid, (FULONG)deviceID },
			{ MSG_GROUP_END, 0,  0 },
			{ TAG_DONE, TAG_DONE, TAG_DONE }
		};
		
		DataForm *df = DataFormNew( tags );
		
		DEBUG("[UMAddGlobalRemoteDrive] Register device\n");
		
		BufString *result = SendMessageAndWait( con, df );
		
		if( result != NULL )
		{
			DEBUG("[UMAddGlobalRemoteDrive] Response received Registering device\n");
			if( result->bs_Size > 0 )
			{
				DataForm *resultDF = (DataForm *)result->bs_Buffer;
				if( resultDF->df_ID == ID_FCRE )
				{
					char *ptr = result->bs_Buffer + (9*sizeof(FULONG))+FRIEND_CORE_MANAGER_ID_SIZE;
					
					resultDF = (DataForm *)ptr;
					if( resultDF->df_ID == ID_CMMD && resultDF->df_Size == 0 && resultDF->df_Data == MSG_INTEGER_VALUE )
					{
						INFO("FC connection set\n");
					}
					else
					{
						FERROR("Cannot  setup connection with other FC\n");
					}
				}
			}
			BufStringDelete( result );
		}
		DataFormDelete( df );
		
		FFree( deviceID );
		FFree( llocalDevName );
		FFree( lremoteDevName );
		
		FFree( llocuname );
		FFree( luname );
		FFree( lauthid );
	}
	
	DEBUG("[UMAddGlobalRemoteDrive] end\n");
	
	return 0;
}

/**
 * Remove and delete remote drive (and user if there will be need)
 *
 * @param um pointer to UserManager
 * @param uname user name as string
 * @param hostname hostname string
 * @param localDevName local device name
 * @param remoteDevName remote device name
 * @return 0 when success, otherwise error number
 */
int UMRemoveGlobalRemoteDrive( UserManager *um, const char *uname, const char *hostname, char *localDevName, char *remoteDevName )
{
	DEBUG("[UMRemoveGlobalRemoteDrive] start\n");
	FBOOL registerUser = FALSE;
	FBOOL registerDrive = FALSE;
	FConnection *con = NULL;
	SystemBase *sb = (SystemBase *)um->um_SB;
	
	RemoteUser *actUsr = um->um_RemoteUsers;
	RemoteDrive *remDri = NULL;
	
	// try to find user first
	
	while( actUsr != NULL )
	{
		// outgoing connection we are verifying by checking address and name
		if( strcmp( uname, actUsr->ru_Name ) == 0 && strcmp( hostname, actUsr->ru_Host ) == 0 )
		{
			DEBUG("[UMRemoveGlobalRemoteDrive] User found %s - host %s\n", uname, hostname );
			con = actUsr->ru_Connection;
			break;
		}
		
		actUsr = (RemoteUser *)actUsr->node.mln_Succ;
	}
	
	// now we must find and remove drive
	// if there will be no drives, we will remove user
	if( actUsr != NULL )
	{
		RemoteDrive *prevDrive = actUsr->ru_RemoteDrives;
		remDri = actUsr->ru_RemoteDrives;
		
		while( remDri != NULL )
		{
			if( strcmp( localDevName, remDri->rd_LocalName ) == 0 && strcmp( remoteDevName, remDri->rd_RemoteName ) == 0 )
			{
				break;
			}
			prevDrive = remDri;
			remDri = (RemoteDrive *)remDri->node.mln_Succ;
		}
		
		// if this is first entry, we remove it from list
		if( remDri == actUsr->ru_RemoteDrives )
		{
			actUsr->ru_RemoteDrives = (RemoteDrive *) actUsr->ru_RemoteDrives->node.mln_Succ;
			
			// last entry was removed
			if( actUsr->ru_RemoteDrives == NULL )
			{
				if( sb->fcm != NULL )
				{
					CommService *service = sb->fcm->fcm_CommService;
					// we can try to delete connection if its not used
					int err = CommServiceDelConnection( service, actUsr->ru_Connection, NULL );
				}
				RemoteDriveDelete( remDri );
			}
		}
		else
		{
			prevDrive->node.mln_Succ = (MinNode *)remDri->node.mln_Succ;
		}
		
		actUsr->ru_ConNumber--;
	}
	
	return 0;
}

/**
 * Add remote drive to user
 *
 * @param um pointer to UserManager
 * @param uname user name as string
 * @param authid authenticationid
 * @param hostname hostname string
 * @param localDevName local device name
 * @param remoteDevName remote device name
 * @return 0 when success, otherwise error number
 */
int UMAddRemoteDriveToUser( UserManager *um, FConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG remoteid )
{
	User *locusr = um->um_Users;
	RemoteDrive *locremdri = NULL;
	SystemBase *sb = (SystemBase *)um->um_SB;
	
	while( locusr != NULL )
	{
		if( strcmp( locuname, locusr->u_Name ) == 0 )
		{
			DEBUG("[UMAddRemoteDriveToUser] User found: %s\n", locuname );
			break;
		}
		locusr = (User *)locusr->node.mln_Succ;
	}
	
	if( locusr == NULL )
	{
		FERROR("Cannot find user\n");
		return -1;
	}
	
	// we are trying to find remote user with same/existing connection
	RemoteUser *remusr = locusr->u_RemoteUsers;
	while( remusr != NULL )
	{
		if( strcmp( uname, remusr->ru_RemoteDrives->rd_LocalName ) == 0 && con == remusr->ru_Connection )
		{
			DEBUG("[UMAddRemoteDriveToUser] User found: %s\n", uname );
			break;
		}
		remusr = (RemoteUser *)remusr->node.mln_Succ;
	}
	
	// user do not exist, we must create new one and attach it
	if( remusr == NULL )
	{
		remusr = RemoteUserNew( (char *)uname, (char *)hostname );
		if( remusr != NULL )
		{
			remusr->ru_AuthID = StringDuplicate( authid );
			remusr->ru_Connection = con;
			
			remusr->node.mln_Succ = (MinNode *)locusr->u_RemoteUsers;
			locusr->u_RemoteUsers = remusr;
			DEBUG("[UMAddRemoteDriveToUser] New remote user added %s\n", uname );
		}
	}
	
	if( remusr != NULL )
	{
		locremdri = remusr->ru_RemoteDrives;
		while( locremdri != NULL )
		{
			if( strcmp( locremdri->rd_LocalName, localDevName ) == 0 && strcmp( locremdri->rd_RemoteName, remoteDevName ) == 0 )
			{
				DEBUG("[UMAddRemoteDriveToUser] Remote drive found %s\n", localDevName );
				break;
			}
			locremdri = (RemoteDrive *)locremdri->node.mln_Succ;
		}
	}
	
	if( locremdri == NULL )
	{
		locremdri = RemoteDriveNew( localDevName, remoteDevName );
		if( locremdri != NULL )
		{
			locremdri->rd_RemoteID = remoteid;
			
			SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
			if( sqllib != NULL )
			{
				char tmp[ 1024 ];
				
				sqllib->SNPrintF( sqllib, tmp, sizeof(tmp), "select ID from `Filesystem` where UserID=%lu and Name='%s'", locusr->u_ID, localDevName );
				char **row;
				void *result = sqllib->Query( sqllib, tmp );
				if( result != NULL )
				{
					while( ( row = sqllib->FetchRow( sqllib, result ) ) )
					{
						if( row[ 0 ] != NULL )
						{
							char *next;
							locremdri->rd_DriveID = strtoul( row[ 0 ], &next, 0 );
							
							DEBUG("[UMAddRemoteDriveToUser] ID found %lu\n", locremdri->rd_DriveID );
						}
					}
					sqllib->FreeResult( sqllib, result );
				}
				sb->LibrarySQLDrop( sb, sqllib );
			}
			
			locremdri->node.mln_Succ = (MinNode *)remusr->ru_RemoteDrives;
			remusr->ru_RemoteDrives = locremdri;
			DEBUG("[UMAddRemoteDriveToUser] New remote drive added: %s\n", remoteDevName );
		}
	}
	
	return 0;
}

/**
 * Remove and delete remote drive from User
 *
 * @param um pointer to UserManager
 * @param locuname user name as string
 * @param hostname hostname string
 * @param localDevName local device name UNUSED
 * @param remoteDevName remote device name UNUSED
 * @return 0 when success, otherwise error number
 */
int UMRemoveRemoteDriveFromUser( UserManager *um, FConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName __attribute__((unused)), char *remoteDevName __attribute__((unused)) )
{
	User *locusr = um->um_Users;
	RemoteDrive *locremdri = NULL;
	SystemBase *sb = (SystemBase *)um->um_SB;
	
	while( locusr != NULL )
	{
		if( strcmp( locuname, locusr->u_Name ) == 0 )
		{
			DEBUG("[UMRemoveRemoteDriveFromUser] User found: %s\n", locuname );
			break;
		}
		locusr = (User *)locusr->node.mln_Succ;
	}
	
	if( locusr == NULL )
	{
		FERROR("User not found: %s\n", uname );
		return -1;
	}
	
	// trying to find remote user with same/existing connection
	RemoteUser *remusr = locusr->u_RemoteUsers;
	while( remusr != NULL )
	{
		if( strcmp( uname, remusr->ru_RemoteDrives->rd_LocalName ) == 0 && con == remusr->ru_Connection )
		{
			DEBUG("[UMRemoveRemoteDriveFromUser] User found: %s\n", uname );
			break;
		}
		remusr = (RemoteUser *)remusr->node.mln_Succ;
	}
	
	// user do not exist, we must create new one and attach it
	if( remusr == NULL )
	{
		remusr = RemoteUserNew( (char *)uname, (char *)hostname );
		if( remusr != NULL )
		{
			remusr->ru_AuthID = StringDuplicate( authid );
			remusr->ru_Connection = con;
			
			remusr->node.mln_Succ = (MinNode *)locusr->u_RemoteUsers;
			locusr->u_RemoteUsers = remusr;
			DEBUG("[UMRemoveRemoteDriveFromUser] New remote user added %s\n", uname );
		}
	}
	return 0;
}
