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

// Pass to friend core
friendHeader( 'Content-Type: text/css' );

$theme = new stdClass();
$replacements = [];
$genCompiledTheme = false;

// Parse a string / file and make compact, logical css
function ParseCssFile( $path )
{
	global $genCompiledTheme, $args;
	
	// Root
	$string = AddParsedCSS( $path . 'theme.css' );
	
	if( !$string ) return false;
	
	// Appended styles with culminating variables and rules
	if( preg_match_all( '/\@append[^u]*?url[^(]*?\(([^)]*?)\)[^;]*?\;[\s]+/', $string, $matches ) )
	{
		foreach( $matches[0] as $k=>$v )
		{
			$string = str_replace( $matches[0][$k] , '', $string );
			$matches[1][$k] = preg_replace( '/system\:/i', '../webclient/', $matches[1][$k] );
			$string .= AddParsedCSS( $path . '../' . $matches[1][$k] );
		}
	}
	
	// Remove block comments
	$string = preg_replace( '/\\/\*[\w\W]*?\*\//', '', $string );
	// Remove single line comments
	$string = preg_replace( '/\\/\\/[^\n]+/', '', $string );
	// Remove whitespace
	$string = preg_replace( '/[\n|\r|\t]+/i', '', $string );
	
	$string = str_replace( '../', '/webclient/', $string );
	
	// Let's store a compiled version in cache
	$genComp = false;
	if( !file_exists( $path . 'theme_compiled.css' ) )
		$genComp = true;
	else
	{
		$stat = stat( $path . 'theme_compiled.css' );
		if( $stat[9] < $genCompiledTheme )
			$genComp = true;
	}
	
	// Generate theme cache!
	if( $genComp && $string )
	{
		unlink( $path . 'theme_compiled.css' );
		if( $f = fopen( $path . 'theme_compiled.css', 'w+' ) )
		{
			fwrite( $f, $string );
			fclose( $f );
		}
	}
	
	// Output
	die( $string );
}

// Add css to be parsed
function AddParsedCSS( $path )
{
	global $theme, $replacements, $genCompiledTheme;
	
	if( !file_exists( $path ) ) return;
	
	$stat = stat( $path );
	
	// Get latest file update
	if( $stat[9] > $genCompiledTheme )
		$genCompiledTheme = $stat[9];
	
	$string = file_get_contents( $path );
	
	// Check condition blocks
	if( preg_match_all( '/(\@if.*?[\n|\r]+)/i', $string, $conds ) )
	{
		die( 'Unimplemented feature condition blocks.' );
		/*
		var vari = mDat[1].match( /\@if\ ([^\r\n]+)/i );
		if( vari[1] )
		{
			var v = vari[1].substr( 1, vari[1].length - 1 );
			// True?
			if( window[v] )
			{
				string = string.split( mDat[1] ).join( "@media (min-width: 0)" );
			}
			// Remove block!
			else
			{
				string = string.split( mDat[1] ).join( "@media (min-width: 999999999)" );
			}
		}*/
	}
	
	// Parse this css complete file, with these toplevel declarations
	if( preg_match_all( '/\@declaration[^{]*?\{([^}]*?)\}/i', $string, $matches ) )
	{
		foreach( $matches[0] as $k=>$v )
		{
			$string = str_replace( $matches[0][$k], '', $string );
			
			$rules = explode( "\n", $matches[1][$k] );
			
			if( !count( $rules ) ) continue;
			
			foreach( $rules as $a=>$vl )
			{
				$rule = &$rules[$a];
				
				if( !trim( $rule ) ) continue;
				if( substr( trim( $rule ), 0, 2 ) == '/*' ) continue;
				
				if( preg_match_all( '/(\$[^:]*?)\:[\s]+([^;]*?)\;/i', $rule, $rmatches ) )
				{
					$ki = trim( $rmatches[1][0] );
					$va = trim( $rmatches[2][0] );
					if( !isset( $theme->vars ) ) $theme->vars = new stdClass();
					if( !isset( $theme->vars->{$ki} ) )
					{
						$replacements[] = array( $ki, $va );
						$theme->vars->{$ki} = $va;
					}
				}
			}
		}
	}
	
	// Code blocks
	if( preg_match_all( '/\@block\ (\$[^{]*?)\{([^}]*?)\}/i', $string, $blocks ) )
	{
		die( 'Unimplemented feature code blocks.' );
		/*foreach( $blocks as $k=>$v )
		{
			die( print_r( $blocks, 1 ) );
			//replacements.push ( [ Trim ( matches[1] ), Trim ( matches[2] ) ] );
		//string = string.split ( matches[0] ).join ( '' );
		}*/
	}
	
	// Declaration of "with" rules
	if( preg_match_all( '/(.*?)\ with (\.[^\n|{| ]*?)([\n|{| ])/i', $string, $rwiths ) )
	{
		if( !isset( $theme->rwith ) ) $theme->rwith = [];
		foreach( $rwiths[0] as $k=>$v )
		{
			if( !isset( $theme->rwith[$rwiths[2][$k]] ) )
				$theme->rwith[$rwiths[2][$k]] = [];
			
			$theme->rwith[$rwiths[2][$k]][] = $rwiths[1][$k];
			$string = str_replace( 'with ' . $rwiths[2][$k] . $rwiths[3][$k], '', $string );
		}
	}
	
	if( count( $replacements ) )
	{
		foreach( $replacements as $replacement )
		{
			// Remove variable lines with the value delete
			if( $replacement[1] == 'delete' )
			{
				// Add slashes
				$rp = $replacement[1];
				$op = '';
				for( $u = 0; u < strlen( $rp ); $u++ )
				{
					$c = substr( $rp, $u, 1 );
					if ( preg_match( '/[^a-zA-Z0-9]/', $c ) )
						$op .= '\'';
					$op .= $c;
				}
				$string = preg_replace( '/.*?\:.*?' . $op . '\;[\n|\r]+/i', '', $string );
			} 
			else $string = str_replace( $replacement[0] . ';', $replacement[1] . ';', $string );
		}
	}
	
	// Execute block replacements
	if( isset( $theme->rwith ) )
	{
		foreach( $theme->rwith as $k=>$elements )
		{
			if( preg_match( '/(\\' . $k . ')([\n|{])/i', $string, $m ) )
			{
				$string = str_replace( $m[0], $m[1] . ', ' . implode( ', ', $elements ) . "\n", $string );
			}
		}
	}

	return $string;
}


?>
