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
		SELECT * FROM FSFile WHERE FolderID >= 0 AND Filename LIKE "%' . $args->args->keywords . '%"
		ORDER BY DateModified DESC LIMIT ' . strval( $start ) . ', ' . $limit . '
	' ) )
	{
		$outs = [];
		foreach( $rows as $row )
		{
			$out = new stdClass();
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
