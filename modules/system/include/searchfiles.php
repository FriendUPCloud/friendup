<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

if( !isset( $args->args->keywords ) ) die( 'fail<!--separate-->{"message":"Missing keywords.","response":-1}' );

$limit = 100;
$start = 0;

function addPath( $file )
{
	global $SqlDatabase;
	$filesystem = new dbIO( 'Filesystem' );
	if( $filesystem->load( $file->FilesystemID ) )
	{
		$path = $filesystem->Name . ':';
		$folderPath = '';
		if( $file->FolderID > 0 )
		{
			$fld = new dbIO( 'FSFolder' );
			if( $fld->Load( $file->FolderID ) )
			{
				$folderPath .= $fld->Name . '/' . $folderPath;
				while( $fld->FolderID > 0 )
				{
					if( $fld->Load( $fld->FolderID ) )
					{
						$folderPath .= $fld->Name . '/' . $folderPath;
						continue;
					}
					else
					{
						break;
					}
				}
			}
		}
		return $path . $folderPath . $file->Filename;
	}
	return '';
}

// Find files from filesystems
if( isset( $args->args->path ) )
{
}
// From all files
else
{
	if( $rows = $SqlDatabase->fetchObjects( '
		SELECT k.* FROM 
			FSFile k WHERE ID IN (
				SELECT 
					f.ID 
				FROM FSFile f, Filesystem fs 
				WHERE 
					fs.UserID=\'' . $User->ID . '\' AND f.FolderID >= 0 AND f.Filename LIKE "%' . $args->args->keywords . '%" AND fs.ID = f.FilesystemID
					AND f.UserID=\'' . $User->ID . '\' AND fs.Type = "SQLDrive"
			) OR ID IN (
				SELECT f2.ID
				FROM
					FSFile f2, Filesystem fs2, FUserToGroup ug
				WHERE
					fs2.GroupID = ug.UserGroupID AND ug.UserID=\'' . $User->ID . '\' AND 
					f2.FolderID >= 0 AND f2.Filename LIKE "%' . $args->args->keywords . '%" AND fs2.ID = f2.FilesystemID
					AND f2.UserID=\'' . $User->ID . '\' AND fs2.Type = "SQLWorkgroupDrive"
			)
			ORDER BY k.DateModified DESC LIMIT ' . strval( $start ) . ', ' . $limit . '
	' ) )
	{
		$outs = [];
		foreach( $rows as $row )
		{
			$out = new stdClass();
			// Skip hidden files
			if( substr( $row->Filename, 0, 1 ) == '.' ) continue;
			$out->Filename = $row->Filename;
			$out->DateModified = $row->DateModified;
			$out->Path = addPath( $row );
			$outs[] = $out;
		}
		die( 'ok<!--separate-->' . json_encode( $outs ) );
	}
}

die( 'fail<!--separate-->{"message":"Your search yielded no results.","response":-1}' );

?>
