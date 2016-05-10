<?php
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

function findInSearchPaths( $app )
{
	$ar = array(
		'../resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return $apath . $app;
		}
	}
	return false;
}

// Get the groups for authentication
$r = AuthenticateApplication( $args->args->application, $User->ID );
if( $r && substr( $r, 0, 4 ) == 'fail' )
	die( $r );

list( $retCode, $retData ) = explode( '<!--separate-->', $r );
$retObject = false;
if( $retData )
{
	$retObject = json_decode( $retData );
}

// Some settings
$sets = array( 'language' );
$opts = new stdClass();
foreach( $sets as $set )
{
	$s = new dbIO( 'FSetting' );
	$s->Type = 'system';
	$s->Key = $set;
	$s->UserID = $User->ID;
	if( $s->Load() )
	{
		$json = false;
		if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
		{
			$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
		}
		if( $json && $d = json_decode( $json ) )
		{
			$opts->$set = $d;
		}
		else if( $d = json_decode( $s->Data ) )
		{
			$opts->$set = $d;
		}
		else $opts->$set = $s->Data;
	}
}

// Do we already have an object? An app project!
if( $retObject && isset( $retObject->ProjectName ) )
{
	$conf = new stdClass();
	$conf->Name = $retObject->ProjectName;
	$conf->Author = $retObject->Author;
	$conf->Version = $retObject->Version;
	$conf->API = 'v1';
	$conf->Permissions = [];
	if( isset( $retObject->Permissions ) )
	{
		foreach( $retObject->Permissions as $k=>$v )
		{
			$conf->Permissions[] = $v->Permission . ' ' . $v->Name . ( $v->Options ? ( ' ' . $v->Options ) : '' );
		}
	}
	$conf->Libraries = $retObject->Libraries;
	
	$init = '';
	foreach( $retObject->Files as $k=>$v )
	{
		if( strtolower( substr( $v->Filename, -4, 4 ) ) == '.jsx' )
		{ 
			$init = $v->Path;
		}
	}
	if( $init )
	{
		$conf->Init = $init;
		die( 'ok<!--separate-->' . json_encode( $conf ) );
	}
	die( 'fail' );
}
// Installed application..
else if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FApplication WHERE UserID=\'' . $User->ID . '\' AND `Name` = "' . $args->args->application . '"
' ) )
{
	if( $ur = $SqlDatabase->FetchObject( '
		SELECT * FROM FUserApplication WHERE UserID=\'' . $User->ID . '\' AND ApplicationID=\'' . $row->ID . '\'
	' ) )
	{
		$fn = $retObject ? $retObject->ConfFilename : false;
		$conf = json_decode( $row->Config );
		$conf->Permissions = json_decode( $ur->Permissions );
		$conf->AuthID = $ur->AuthID;
		$conf->State = $ur->Data;
		$conf->ConfFilename = $fn;
		
		// Set user settings
		foreach( $opts as $ko=>$vo )
		{
			$conf->$ko = $vo;
		}
		
		if( $path = findInSearchPaths( $args->args->application ) )
			$conf->Path = str_replace( '../resources', '', $path ) . '/';
		else $conf->Path = str_replace( '../resources', '', $conf->Path );
		
		die( 'ok<!--separate-->' . json_encode( $conf ) . '<!--separate-->' . $ur->Data );
	}
	die( 'activate<!--separate-->' . $row->Config );
}
else if ( $path = findInSearchPaths( $args->args->application ) )
{
	die( 'notinstalled<!--separate-->{"path":"' . $path . '"}' );
}
die( 'fail<!--separate-->{"response": "not installed"}' );

?>
