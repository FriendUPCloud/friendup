<?php

/*©lgpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

/* 

Workflow module
---------------

Module  to handle workflows and business  processes for FriendUP.  Simple, tight 
engine that  can transition  workgroups and users through  processes designed in
third party flowchart software.

*/

// Most important thing!
include( 'php/friend.php' );
include( 'modules/workflow/classes/workflowengine.php' );

// Get user level
if( $level = $SqlDatabase->FetchObject( '
	SELECT g.Name FROM FUserGroup g, FUserToGroup ug
	WHERE
		g.Type = \'Level\' AND
		ug.UserID=\'' . $User->ID . '\' AND
		ug.UserGroupID = g.ID
' ) )
{
	$level = $level->Name;
}
else $level = false;

if( !isset( $args->command ) )
{
	die( 'fail<!--separate-->{"response":-1,"message":"Undefined command"}' );
}

// Handle the module calls
$User->UserLevel = $level;
$workflowEngine = new WorkflowEngine( $SqlDatabase, $User );
die( $workflowEngine->executeCommand( $args->command, isset( $args->args ) ? $args->args : new stdClass() ) );

?>
