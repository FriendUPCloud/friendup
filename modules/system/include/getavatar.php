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

global $SqlDatabase, $User, $Config;

error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED );
ini_set( 'display_errors', '1' );

// Dependency ------------------------------------------------------------------

// Calculate the text box of the image (initials etc)
function getsetting_calculateTextBox( $text, $fontFile, $fontSize, $fontAngle )
{
	$rect = imagettfbbox( $fontSize, $fontAngle, $fontFile, $text );
	$minX = min( array( $rect[ 0 ], $rect[ 2 ], $rect[ 4 ], $rect[ 6 ] ) );
	$maxX = max( array( $rect[ 0 ], $rect[ 2 ], $rect[ 4 ], $rect[ 6 ] ) );
	$minY = min( array( $rect[ 1 ], $rect[ 3 ], $rect[ 5 ], $rect[ 7 ] ) );
	$maxY = max( array( $rect[ 1 ], $rect[ 3 ], $rect[ 5 ], $rect[ 7 ] ) );
	return array(
		"left"   => abs( $minX ) - 1,
		"top"    => abs( $minY ) - 1,
		"width"  => $maxX - $minX,
		"height" => $maxY - $minY,
		"box"    => $rect
	);
}
// Return "broken file"
function _file_broken( $display )
{
	$cnt = file_get_contents( 'resources/iconthemes/friendup15/File_Broken.svg' );
	FriendHeader( 'Content-Length: ' . strlen( $cnt ) );
	FriendHeader( 'Content-Type: image/svg+xml' );	
	switch( $display )
	{
		case 'base64':
			
				die( 'data:image/' . pathinfo( 'resources/iconthemes/friendup15/File_Broken.svg', PATHINFO_EXTENSION ) . ';base64,' . base64_encode( $cnt ) );
				
			break;
			
		default:
			
				readfile( 'resources/iconthemes/friendup15/File_Broken.svg' );
			
			break;
	}
}

// Output the file
function _file_output( $filepath, $display )
{
	if( $filepath )
	{
		ob_clean();
		
		FriendHeader( 'Content-Type: image/png' );
		
		FriendHeader( 'Expires: ' . gmdate( 'D, d M Y H:i:s \G\M\T', time() + 86400 ) );
		
		// Generate some useful time vars based on file date
		$last_modified_time = filemtime( $filepath ); 
		$etag = md5_file( $filepath );
		
		// Always send headers
		FriendHeader( 'Last-Modified: ' . gmdate( 'D, d M Y H:i:s', $last_modified_time ) . ' GMT' ); 
		FriendHeader( 'Etag: ' . $etag ); 
		
		// TODO: Fix this so it works in FriendCore ... only works in apache, nginx, etc ...
		
		// Exit if not modified
		if ( ( @strtotime( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) == $last_modified_time ) ||  ( @trim( $_SERVER['HTTP_IF_NONE_MATCH'] ) == $etag ) )
		{
			FriendHeader( 'HTTP/1.1 304 Not Modified' ); 
			die();
		}

		switch( $display )
		{
			case 'base64':
				
					die( 'data:image/' . pathinfo( $filepath, PATHINFO_EXTENSION ) . ';base64,' . base64_encode( file_get_contents( $filepath ) ) );
				
				break;
				
			default:
				
					die( readfile( $filepath ) );
				
				break;
		}
	}
}

// End dependency --------------------------------------------------------------

// figure out whos avatar to load ( target user ). The absense of a user id input
// will be considered a request for that users own avatar

$Logger->log( 'getavatar input: ' . json_encode( $args ));

$targetId = false;
$targetUId = false;
// look for userid
if( isset( $args->args->userid ) && !isset( $args->userid ) )
{
	$args->userid = $args->args->userid;
}

if ( isset( $args->userid ))
{
	$targetId = $args->userid;
}
else
{
	$targetId = $User->ID;
}

// look for unique user id
if ( isset( $args->args->fuserid ) && !isset( $args->fuserid ))
{
	$args->fuserid;
}

if ( isset( $args->fuserid ))
{
	$targetUId = $args->fuserid;
}

/*
// Get AuthID
if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}
// Try to fetch  user who is logged in
if( !isset( $args->authid ) )
{
	$userid = ( $level == 'Admin' && isset( $args->userid ) ? $args->userid : $User->ID );
}
else
{
	// TODO: See if we need permissions to view avatar, default is just show it ...
	
	/*require_once( 'php/include/permissions.php' );
	
	$userid = ( !isset( $args->userid ) ? $User->ID : 0 );
	
	// Only check permissions if userid is defined ...
	if( isset( $args->userid ) )
	{
		if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ], 'user', ( isset( $args->userid ) ? $args->userid : $User->ID ) ) )
		{
			if( is_object( $perm ) )
			{
				// Permission denied.
		
				if( $perm->response == -1 )
				{
					//
					
					//die( 'fail<!--separate-->'.json_encode($perm) );
				}
				
				// Permission granted. GLOBAL or WORKGROUP specific ...
				
				if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->userid ) )
				{
			
					// If user has GLOBAL or WORKGROUP access to this user
			
					if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->userid.',' ) )
					{
						$userid = intval( $args->userid );
					/*}
			
				}
		
			}
		}
	}
}
*/

// Default thumbnail size
$width = 256;
$height = 256;
$mode = 'resize';
$hash = false;
$display = 'default';

// Image was set
if( isset( $args->image ) )
{
	$hash = $args->image;
}
// Width was requested
if( isset( $args->width ) )
{
	$width = $args->width;
}
// Height was requested
if( isset( $args->height ) )
{
	$height = $args->height;
}
// Mode was requested
if( isset( $args->mode ) )
{
	$mode = $args->mode;
}
// Display was requested
if( isset( $args->display ) )
{
	$display = $args->display;
}


// fetch target user
// the in workgroup check is preserved, but currently not a limitation
$targetUser = false;
$inWorkGroup = false;
$self = false;
/*
if( isset( $args->userid ) ) $targetUser = $args->userid;
else if( isset( $args->args ) && isset( $args->args->userid ) ) 
	$targetUser = $args->args->userid;
*/

$tuWhere = 'tu.ID = \'' . $targetId . '\'';
if ( $targetUId )
	$tuWhere = 'tu.UniqueID = \'' . $targetUId . '\'';
	
$Logger->log( 'getavatar where: ' . $tuWhere );

$targetUser = $SqlDatabase->fetchObject('
	SELECT tu.* FROM
		FUser tu
	WHERE ' . $tuWhere . '
');

$Logger->log( 'getavatar targetUser: ' . json_encode( $targetUser ));

if ( null != $targetUser )
{
	if ( $targetUser->ID == $User->ID )
	{
		// user is asking for his own avatar
		$self = true;
	}
	else
	{
		// in workgroup check
		$relation = $SqlDatabase->fetchObject('
			SELECT tug.* FROM
				FUserToGroup tug,
				FUserToGroup sug
			WHERE
				sug.UserID = \'' . $User->ID . '\' AND
				tug.UserGroupID = sug.UserGroupID AND
				tug.UserID = \'' . $targetUser->ID . '\'
		');
		
		if ( null != $relation )
		{
			$inWorkGroup = true;
		}
	}
}
else
{
	// invalid request, do invalid request things
	_file_broken( $display );
}

/* duplicated above, remove this later i guess
if( $targetUser )
{
	if( $row = $SqlDatabase->fetchObject( '
		SELECT tug.* FROM 
			FUserToGroup tug,
			FUserToGroup sug
		WHERE
			sug.UserID = \'' . $User->ID . '\' AND
			tug.UserGroupID = sug.UserGroupID AND
			tug.UserID = \'' . intval( $targetUser, 10 ) . '\'
	' ) )
	{
		$userid = $row->UserID;
	}
}
*/

// Sanitized username
$wname = $Config->FCUpload;
if( substr( $wname, -1, 1 ) != '/' ) $wname .= '/';
if( !file_exists( $wname . 'thumbnails' ) )
{
	mkdir( $wname . 'thumbnails' );
}

$userid = $targetUser->ID;

$Logger->log( 'getavatar load/create: ' . json_encode([
	'userid' => $userid,
	'height' => $height,
	'width'  => $width,
	'hash'   => $hash,
]));

if( $userid > 0 && $wname )
{
	
	$folderpath = ( $wname . 'thumbnails/avatar_' . $userid . '/' );
	$Logger->log( 'getavatar looking for file: ' . $folderpath . ( $hash . '_' . $mode . '_' . $width . 'x' . $height ) . '.png' );
	
	// Check if it exists!
	if ( !$hash && $targetUser->Image )
	{
		$hash = $targetUser->Image;
	}
	
	if( $hash && file_exists( $folderpath . ( $hash . '_' . $mode . '_' . $width . 'x' . $height ) . '.png' ) )
	{
		$Logger->log( 'getavatar found file at: ' . $folderpath . ( $hash . '_' . $mode . '_' . $width . 'x' . $height ) . '.png' );
		_file_output( $folderpath . ( $hash . '_' . $mode . '_' . $width . 'x' . $height ) . '.png', $display );
		die();
	}
	// Try to generate it
	else
	{
		$Logger->log( 'getavatar did not find a file, will generate' );
		$avatar = '';
		
		$s = new dbIO( 'FSetting' );
		$s->Type = 'system';
		$s->Key = 'avatar';
		$s->UserID = $userid;
		
		// We do not have full name and we can load and ( we have no mode or the mode isn't reset )
		if( !isset( $args->args->fullname ) && $s->Load() && ( !isset( $args->args->mode ) || $args->args->mode != 'reset' ) )
		{
			$Logger->log( 'getavatar - find hash or generate from data' );
			$json = false;
			if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
			{
				$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
			}
			if( $json && $d = json_decode( $json ) )
			{
				$avatar = $d;
			}
			else if( $d = json_decode( $s->Data ) )
			{
				$avatar = $d;
			}
			else $avatar = $s->Data;
			
			
			$hash = md5( $avatar );
			
			/*
			if( $s->ID > 0 && $avatar && $s->UserID > 0 )
			{
				$u = new dbIO( 'FUser' );
				$u->ID = $s->UserID;
				if( $u->Load() )
				{
					$hash = $u->Image;
				}
				if( !$hash )
				{
					$hash = md5( $avatar );
				}
			}
			*/
			
			// Fix filename
			$fname = ( $hash . '_' . $mode . '_' . $width . 'x' . $height ) . '.png';
			$filepath = ( $wname . 'thumbnails/avatar_' . $userid . '/' . $fname );
			$Logger->log( 'getavatar from data, setting filepath: ' . $filepath );
		}
		// Generate default avatar -------------------------------------------------
		else if( isset( $args->args->fullname ) || $userid == $User->ID )
		{
			$Logger->log( 'getavatar generate txt' );
			if( !isset( $Config->DefaultPalette ) )
			{
				$palette = array( 
					'#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6', 
					'#34495E', '#E67E22', '#E74C3C', '#95A5A6' 
				);			
			}
			else
			{
				$palette = explode( ',', $Config->DefaultPalette );
			}
			if( $args->args->color )
			{
				$hex = $args->args->color;
			}
			else $hex = trim( $palette[ rand( 0, count( $palette ) - 1 ) ] );
	
			$gw = 512;
			$gh = 512;
			$img = imagecreatetruecolor( $gw, $gh );
			imagealphablending( $img, false );
			imagesavealpha( $img, true );
			imageantialias( $img, true );
			imagesetinterpolation( $img, IMG_BICUBIC );
	
			// Make transparentgim
			$transparent = imagecolorallocatealpha( $img, 255, 255, 255, 127 );
			imagefilledrectangle( $img, 0, 0, $gw, $gh, $transparent );
	
			// Draw color circle (3x the size)
			$factor = 0;
			if ( $gw > $gh )
				$factor = 3 * $gh;
			else
				$factor = 3 * $gw;
			
			$nimg = imagecreatetruecolor( $factor, $factor );
			imageantialias( $nimg, true );
			imagealphablending( $nimg, false );
			imagesavealpha( $nimg, true );
			imagefilledrectangle( $nimg, 0, 0, $factor, $factor, $transparent );
	
			// Get color
			$r = hexdec( substr( $hex, 1, 2 ) );
			$g = hexdec( substr( $hex, 3, 2 ) );
			$b = hexdec( substr( $hex, 5, 2 ) );
			$color = imagecolorallocate( $img, $r, $g, $b );
			imagefilledellipse( $nimg, $factor >> 1, $factor >> 1, $factor, $factor, $color );
	
			// Copy resized version
			imagecopyresampled( $img, $nimg, 0, 0, 0, 0, $gw, $gh, $factor, $factor );
	
			// Font path
			$font = 'resources/themes/friendup12/fonts/Assistant-ExtraBold.ttf';
	
			// Draw letters
			$color = imagecolorallocate( $img, 255, 255, 255 );
			$initials = isset( $args->args->fullname ) ? trim( $args->args->fullname ) : $User->FullName;
			$initials = mb_convert_encoding( $initials, 'ISO-8859-1', 'UTF-8' );
			$initials = explode( ' ', $initials );
			$initials = strtoupper( count( $initials ) > 1 ? $initials[0]{0} . $initials[1]{0} : substr( $initials[0], 0, 2 ) );
			
			$dims = getsetting_calculateTextBox( $initials, $font, ( $factor / 6 ) * ( 24 / 35 ), 0 );
			imagettftext( $img, ( $factor / 6 ) * ( 24 / 35 ), 0, ( $factor / 6 ) - ( $dims[ 'width' ] >> 1 ) - $dims[ 'left' ], ( $factor / 6 ) + ( $dims[ 'height' ] >> 1 ) + ( $dims[ 'height' ] - $dims[ 'top' ] ), $color, $font, $initials );
			ob_start();
			imagepng( $img );
			$png = ob_get_clean();
			$s->Data = 'data:image/png;base64,' . base64_encode( $png );
			if( !isset( $args->args->read ) || !$args->args->read )
			{
				$s->Save();
			}
	
			// Save image blob as filename hash on user
			if( $s->ID > 0 && $s->Key == 'avatar' && $s->Data && $s->UserID > 0 )
			{
				$u = new dbIO( 'FUser' );
				$u->ID = $s->UserID;
				if( $u->Load() )
				{
					$u->Image = md5( $s->Data );
					
					if( !isset( $args->args->read ) || !$args->args->read )
					{
						$u->Save();
					}
			
					$hash = $u->Image;
				}
			}
			
			// Save avatar color for later use
			$c = new dbIO( 'FSetting' );
			$c->UserID = $s->UserID;
			$c->Key = 'avatar_color';
			$c->Type = 'system';
			if( !isset( $args->args->read ) || !$args->args->read )
			{
				$c->Load();
				$c->Data = $hex;
				$c->Save();
			}
	
			$avatar = $s->Data;
			
			// Fix filename
			$fname = ( $hash . '_' . $mode . '_' . $width . 'x' . $height ) . '.png';
			$filepath = ( $wname . 'thumbnails/avatar_' . $userid . '/' . $fname );
			$Logger->log( 'getavatar generate txt done: ', $filepath );
		}
		
		// Check again ...
		$Logger->log( 'check again: ' . $hash . ' - ' . $filepath );
		if( $hash && file_exists( $filepath ) )
		{
			$Logger->log( 'getavatar found it this time lol ' . json_encode([
				'hash'     => $hash,
				'filepath' => $filepath,
			]) );
			_file_output( $filepath, $display );	
		}
		
		if( $avatar && $hash && $fname && $filepath )
		{
			// create image from blob ...
			$Logger->log( 'getavatar found lots of stuff, create from blob: ' .json_encode([
				'userid'   => $userid,
				'avatar'   => !!$avatar,
				'hash'     => $hash,
				'fname'    => $fname,
				'filepath' => $filepath,
			]) );
			
			if( $data = explode( ',', $avatar ) )
			{
				$source = false;
				
				// Make sure folder is there and cleanup if there is a miss match
				
				$folderpath = ( $wname . 'thumbnails/avatar_' . $userid );
				
				if( !file_exists( $folderpath ) )
				{
					mkdir( $folderpath );
				}
				if( !file_exists( $folderpath ) )
				{
					_file_broken( $display );
				}
				
				// Clean up ...
				
				if( $dir = opendir ( $folderpath ) )
				{
					if( substr( $folderpath, -1 ) != '/' )
					{
						$folderpath = $folderpath . '/';
					}
					
					$depth = 0;
					while ( $file = readdir ( $dir ) )
					{
						if ( $file{0} == '.' && strlen( $file ) <= 2 ) continue;
						
						// File with correct hash not found, clean it up ...
						if( $file && !strstr( $file, $hash . '_' ) )
						{
							unlink( $folderpath . $file );
						}
						
						$depth++;
						if( $depth >= 10000 ) return false;
					}
					closedir ( $dir );
				}
				
				if( $binary = base64_decode( end( $data ) ) )
				{
					
					$source = imagecreatefromstring( $binary );
						
					list( $iw, $ih, $type ) = getimagesizefromstring( $binary );
					$x = $y = 0;
				}
				
				if( !$source )
				{
					$Logger->log( 'getavatar blobl no source, return broken' );
					_file_broken( $display );
				}
				
				
				
				imageantialias( $source, true );
				
				// Place thumbnail to the center
				// First try width
				$rw = $width;
				$rh = $ih / $iw * $width;
				// Don't fit height?
				if( $rh > $height )
				{
					$rh = $height;
					$rw = $iw / $ih * $height;
				}
				
				// Output
				if( $mode == 'resize' )
				{
					$width = $rw;
					$height = $rh;
				}
				$dest = imagecreatetruecolor( $width, $height );	
				
				imageantialias( $dest, true );
				imagealphablending( $dest, false );
				imagesavealpha( $dest, true );
				imagesetinterpolation( $dest, IMG_BICUBIC );
				$transparent = imagecolorallocatealpha( $dest, 255, 255, 255, 127 );
				imagefilledrectangle( $dest, 0, 0, $width, $height, $transparent );
				
				if( $mode == 'crop' )
				{
					// Center
					$y = $height - $rh;
					$x = $width / 2 - ( $rw / 2 );		
				}
				else
				{
					$x = $y = 0;
				}
				
				// Resize
				$Logger->log( 'getavatar generate txt - resize: ' . json_encode([
					'mode' => $mode,
					'height' => $height,
					'width' => $width,
					'x' => $x,
					'y' => $y,
					'rw' => $rw,
					'rh' => $rh,
					'iw' => $iw,
					'ih' => $ih,
				]) );
				imagecopyresampled( $dest, $source, $x, $y, 0, 0, $rw, $rh, $iw, $ih );
				
				// Save
				imagepng( $dest, $filepath, 9 );
				
				// Remove from memory
				imagedestroy( $source );
				
				unset( $binary );
				unset( $avatar );
				unset( $data );
				
				// Check if it exists!
				if( file_exists( $filepath ) )
				{
					_file_output( $filepath, $display );
					die();
				}
				
			}
			
		}
		
	}
}

// TODO: Support more icons
$Logger->log( 'getavatar TODO broken' );
_file_broken( $display );

?>
