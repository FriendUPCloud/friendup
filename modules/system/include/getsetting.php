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

// Dependency
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
// End dependency

// TODO: Move this check to Friend Core when a user logs in! IMPORTANT!
// Check storage folder
// Sanitized username - make thumbnail cache
$uname = str_replace( array( '..', '/', ' ' ), '_', $User->Name );
$wname = $Config->FCUpload . $uname . '/';
if( !file_exists( $wname ) )
	mkdir( $wname );
if( !file_exists( $wname . 'thumbnails' ) )
	mkdir( $wname . 'thumbnails' );
// End FUGLY procedure that should be in Friend Core!

$settings = new stdClass();
$settings->Date = date( 'Y-m-d H:i:s' );


if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	$userid = ( $level == 'Admin' && isset( $args->args->userid ) ? $args->args->userid : $User->ID );
}
else
{
	require_once( 'php/include/permissions.php' );
	
	$userid = ( !isset( $args->args->userid ) ? $User->ID : 0 );
	
	// Only check permissions if userid is defined ...
	if( isset( $args->args->userid ) )
	{
		if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_LOOKNFEEL_GLOBAL', 'PERM_LOOKNFEEL_WORKGROUP' ], 'user', ( isset( $args->args->userid ) ? $args->args->userid : $User->ID ) ) )
		{
			if( is_object( $perm ) )
			{
				// Permission denied.
		
				if( $perm->response == -1 )
				{
					//
			
					//die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
				}
		
				// Permission granted. GLOBAL or WORKGROUP specific ...
		
				if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->args->userid ) )
				{
			
					// If user has GLOBAL or WORKGROUP access to this user
			
					if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->args->userid.',' ) )
					{
						$userid = intval( $args->args->userid );
					}
			
				}
		
			}
		}
	}
}



if( isset( $args->args->settings ) )
{
	$failed = true;
	foreach ( $args->args->settings as $set )
	{
		$s = new dbIO( 'FSetting' );
		$s->Type = 'system';
		$s->Key = $set;
		$s->UserID = $userid;
		if( $s->Load() )
		{
			$json = false;
			if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
			{
				$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
			}
			if( $json && $d = json_decode( $json ) )
			{
				$settings->$set = $d;
			}
			else if( $d = json_decode( $s->Data ) )
			{
				$settings->$set = $d;
			}
			else $settings->$set = $s->Data;
			$failed = false;
		}
	}
	if( !$failed ) 
		die( 'ok<!--separate-->' . json_encode( $settings ) );
	else
		die('fail<!--separate-->{"response":"settings not found"}');
}
else if ( isset( $args->args->setting ) )
{
	$set = $args->args->setting;
	$s = new dbIO( 'FSetting' );
	$s->Type = 'system';
	$s->Key = $args->args->setting;
	$s->UserID = $userid;
	if( !isset( $args->args->fullname ) && $s->Load() )
	{
		if( !isset( $args->args->mode ) || $args->args->mode != 'reset' )
		{
			$json = false;
			if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
			{
				$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
			}
			if( $json && $d = json_decode( $json ) )
			{
				$settings->$set = $d;
			}
			else if( $d = json_decode( $s->Data ) )
			{
				$settings->$set = $d;
			}
			else $settings->$set = $s->Data;
			die( 'ok<!--separate-->' . json_encode( $settings ) );
		}
	}
	// Generate default avatar -------------------------------------------------
	if( $s->Key == 'avatar' )
	{
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
			$hex = $args->args->color;
		else $hex = trim( $palette[ rand( 0, count( $palette ) - 1 ) ] );
		
		$img = imagecreatetruecolor( 256, 256 );
		imagealphablending( $img, false );
		imagesavealpha( $img, true );
		imageantialias( $img, true );
		imagesetinterpolation( $img, IMG_BICUBIC );
		
		// Make transparentgim
		$transparent = imagecolorallocatealpha( $img, 255, 255, 255, 127 );
		imagefilledrectangle( $img, 0, 0, 256, 256, $transparent );
		
		// Draw color circle (3x the size)
		$factor = 3 * 256;
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
		imagecopyresampled( $img, $nimg, 0, 0, 0, 0, 256, 256, $factor, $factor );
		
		// Font path
		$font = 'resources/themes/friendup12/fonts/Assistant-ExtraBold.ttf';
		
		// Draw letters
		$color = imagecolorallocate( $img, 255, 255, 255 );
		$initials = explode( ' ', ( isset( $args->args->fullname ) ? trim( $args->args->fullname ) : $User->FullName ) );
		$initials = strtoupper( count( $initials ) > 1 ? $initials[0]{0} . $initials[1]{0} : substr( $initials[0], 0, 2 ) );
		$dims = getsetting_calculateTextBox( $initials, $font, 88, 0 );
		imagettftext( $img, 88, 0, 128 - ( $dims[ 'width' ] >> 1 ) - $dims[ 'left' ], 128 + ( $dims[ 'height' ] >> 1 ) + ( $dims[ 'height' ] - $dims[ 'top' ] ), $color, $font, $initials );
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
				$u->Save();
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
		
		$settings->avatar = $s->Data;
		die( 'ok<!--separate-->' . json_encode( $settings ) );
	}
	// Done generating avatar --------------------------------------------------
	
	// Fallback
	die( 'fail<!--separate-->{"response":"setting not found"}' );
}

die( 'fail<!--separate-->{"response":"fatal error in getsetting - no setting(s) parameter given"}' );

?>
