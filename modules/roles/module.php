<?php

error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED );
ini_set( 'display_errors', '1' );

require_once( 'php/friend.php' );
require_once( 'php/classes/dbio.php' );

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

// What is asked
if( isset( $args->command ) )
{
	switch( $args->command )
	{
		
		// Read --------------------------------------------------------------------------------------------------------
		
		case 'userroleget':
			
			$out = array();
			
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT 
					g.* 
				FROM 
					FUserGroup g 
				WHERE 
					g.Type = "Role" 
					' . ( isset( $args->args->id )       ? 'AND g.ID     = ' . $args->args->id            : '' ) . '
					' . ( isset( $args->args->userid )   ? 'AND g.UserID = ' . $args->args->userid        : '' ) . '
					' . ( isset( $args->args->name )     ? 'AND g.Name   = \'' . $args->args->name . '\'' : '' ) . '
				ORDER BY 
					g.Name 
			' ) )
			{
				foreach( $rows as $row )
				{
					$o = new stdClass();
					$o->ID = $row->ID;
					$o->UserID = $row->UserID;
					$o->ParentID = $row->ParentID;
					$o->Name = $row->Name;
					
					if( $perms = $SqlDatabase->FetchObjects( '
						SELECT 
							p.ID, p.Permission, p.Data 
						FROM 
							FUserRolePermission p 
						WHERE 
							p.RoleID = ' . $row->ID . ' 
						ORDER BY 
							p.ID 
					' ) )
					{
						$o->Permissions = $perms;
					}
					
					$out[] = $o;
				}
			}
			
			die( 'ok<!--separate-->' . json_encode( $out ) );
			
			break;
		
		case 'checkpermission':
			
			if( isset( $args->args->permission ) && $args->args->permission )
			{
				if( $rows = $SqlDatabase->FetchObjects( '
					SELECT 
						g.ID, g.UserID, g.ParentID, g.Name, p.Data 
					FROM 
						FUserRolePermission p, 
						FUserGroup g 
					WHERE 
							p.Permission = \'' . $args->args->permission . '\' 
						AND g.ID = p.RoleID 
						AND g.Type = "Role" 
					ORDER BY 
						g.Name 
				' ) )
				{
					$out = array();
					
					foreach( $rows as $row )
					{
						$o = new stdClass();
						$o->ID = $row->ID;
						$o->UserID = $row->UserID;
						$o->ParentID = $row->ParentID;
						$o->Name = $row->Name;
						$o->Data = $row->Data;
						
						if( isset( $args->args->data ) && $args->args->data && !strstr( $row->Data, $args->args->data ) )
						{
							continue;
						}
						
						$out[] = $o;
					}
					
					die( 'ok<!--separate-->' . json_encode( $out ) );
				}
				
				die( 'fail<!--separate-->{"response":-1,"message":"No roles matching that permission ..."}' );
			}
			
			die( 'fail<!--separate-->{"response":-1,"message":"Parameters missing ..."}' );
			
			break;
		
		// Write -------------------------------------------------------------------------------------------------------
			
		case 'userroleadd':
			
			if( $level == 'Admin' )
			{
				if( isset( $args->args->name ) && $args->args->name )
				{
					$r = new dbIO( 'FUserGroup' );
					$r->Type = 'Role';
					$r->Name = $args->args->name;
					if( !$r->Load() )
					{
						$r->UserID   = ( isset( $args->args->userid   ) && $args->args->userid   ? $args->args->userid   : 0 );
						$r->ParentID = ( isset( $args->args->parentid ) && $args->args->parentid ? $args->args->parentid : 0 );
						$r->Save();
						
						die( 'ok<!--separate-->{"response":1,"message":"' . $args->args->name . ' created!"}' );
					}
					
					die( 'fail<!--separate-->{"response":-1,"message":"' . $args->args->name . ' exists!"}' );
				}
				
				die( 'fail<!--separate-->{"response":-1,"message":"Parameters missing ..."}' );
			}
			
			die( 'fail<!--separate-->{"response":-1,"message":"You don\'t have Admin access"}' );
			
			break;
		
		case 'userroleupdate':
			
			if( $level == 'Admin' )
			{
				if( isset( $args->args->id ) && $args->args->id )
				{
					$r = new dbIO( 'FUserGroup' );
					$r->Type = 'Role';
					$r->ID = $args->args->id;
					if( $r->Load() )
					{
						$r->UserID   = ( isset( $args->args->userid   ) && $args->args->userid   ? $args->args->userid   : $r->UserID   );
						$r->ParentID = ( isset( $args->args->parentid ) && $args->args->parentid ? $args->args->parentid : $r->ParentID );
						
						if( isset( $args->args->name ) && $args->args->name )
						{
							$r->Name = $args->args->name;
							$r->Save();
						}
						
						if( isset( $args->args->permissions ) )
						{
							$empty = true;
							
							// Array with objects or a single Object
							
							if( $args->args->permissions && ( is_array( $args->args->permissions ) || is_object( $args->args->permissions ) ) )
							{
								$args->args->permissions = ( is_object( $args->args->permissions ) ? array( $args->args->permissions ) : $args->args->permissions );
								
								foreach( $args->args->permissions as $perms )
								{
									if( !isset( $perms->ID ) && !isset( $perms->Permission ) && !isset( $perms->Data ) )
									{
										die( 'fail<!--separate-->{"response":-1,"message":"Wrong parameters ..."}' );
									}
									
									// If we have id then we can modify permissions else remove it all and create new entries
									
									if( isset( $perms->ID ) && $perms->ID )
									{
										$empty = false;
									}
								}
								
								// Empty old permissions
								
								if( $empty )
								{
									$SqlDatabase->query( 'DELETE FROM FUserRolePermission WHERE RoleID=\'' . $r->ID . '\'' );
								}
								
								// Create new, update or delete permissions
								
								foreach( $args->args->permissions as $perms )
								{
									$loaded = false;
									
									$p = new dbIO( 'FUserRolePermission' );
									$p->RoleID = $r->ID;
									
									if( isset( $perms->ID ) && $perms->ID )
									{
										$p->ID = $perms->ID;
										if( $p->Load() )
										{
											$loaded = true;
										}
									}
									
									if( isset( $perms->Permission ) && $perms->Permission )
									{
										$p->Permission = $perms->Permission;
									}
									
									if( isset( $perms->Data ) && $perms->Data )
									{
										$p->Data = ( ( is_object( $perms->Data ) || is_array( $perms->Data ) ) ? json_encode( $perms->Data ) : $perms->Data );
									}
									
									// If permission is loaded on id and name and data is missing see it as a delete request
									
									if( $loaded && isset( $perms->ID ) && ( !isset( $perms->Permission ) && !isset( $perms->Data ) ) )
									{
										$p->Delete();
									}
									
									// Else save or update permission with new data
									
									else
									{
										$p->Save();
									}
								}
							}
							
							// Empty old permissions
							
							else if( !$args->args->permissions && ( $args->args->permissions != NULL || is_array( $args->args->permissions ) ) )
							{
								$SqlDatabase->query( 'DELETE FROM FUserRolePermission WHERE RoleID=\'' . $r->ID . '\'' );
							}
							
							die( 'ok<!--separate-->{"response":1,"message":"Permissions on Role updated"}' );
						}
						
						die( 'ok<!--separate-->{"response":1,"message":"Role updated"}' );
					}
					
					die( 'fail<!--separate-->{"response":-1,"message":"Role doesn\'t exists!"}' );
				}
				
				die( 'fail<!--separate-->{"response":-1,"message":"Parameters missing ..."}' );
			}
			
			die( 'fail<!--separate-->{"response":-1,"message":"You don\'t have Admin access"}' );
			
			break;
		
		// Delete ------------------------------------------------------------------------------------------------------
		
		case 'userroledelete':
			
			if( $level == 'Admin' )
			{
				if( ( isset( $args->args->id ) && $args->args->id ) || ( isset( $args->args->name ) && $args->args->name ) )
				{
					$r = new dbIO( 'FUserGroup' );
					$r->Type = 'Role';
					
					if( isset( $args->args->id ) )
					{
						$r->ID = $args->args->id;
					}
					if( isset( $args->args->name ) )
					{
						$r->Name = $args->args->name;
					}
					
					if( $r->Load() )
					{
						$SqlDatabase->query( 'DELETE FROM FUserRolePermission WHERE RoleID=\'' . $r->ID . '\'' );
						
						$r->Delete();
						
						die( 'ok<!--separate-->{"response":1,"message":"Role w/ permissions deleted"}' );
					}
					
					die( 'fail<!--separate-->{"response":-1,"message":"Role doesn\'t exists!"}' );
				}
				
				die( 'fail<!--separate-->{"response":-1,"message":"Parameters missing ..."}' );
			}
			
			die( 'fail<!--separate-->{"response":-1,"message":"You don\'t have Admin access"}' );
			
			break;
			
	}
}

// It fails
die( 'fail<!--separate-->{"response":-1,"message":"Wrong parameters ..."}' );

?>
