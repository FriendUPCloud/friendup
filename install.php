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

$quit = "Goodbye. Installation aborted.\n";
$mysqldatabase = "";
$mysqlport = "";
$mysqlserver = "";
$mysqluser = "";
$mysqlpass = "";
$fcport = "";
$fcssl = false;

// Set up the mysql database name

mysql:

$result = readline( "Please enter a MySQL database name: " );

echo( "You entered \"$result\", is this correct?" );

$yn = strtolower( trim( readline( " (Yes/No/Quit)\n" ) ) );

if( $yn == 'quit' || $yn == 'q' || $yn == '' ) die( $quit );

if( $yn == 'no' || $yn == 'n' )
	goto mysql;

$mysqldatabase = $result;

// Setup the mysql hostname or IP

mysqlhost:

$result = readline( "Please enter your mysql database hostname or IP: " );

echo( "You entered \"$result\", is this correct?" );

$yn = strtolower( trim( readline( " (Yes/No/Quit)\n" ) ) );

if( $yn == 'quit' || $yn == 'q' || $yn == '' ) die( $quit );

if( $yn == 'no' || $yn == 'n' )
	goto mysqlhost;

$mysqlserver = strtolower( trim( $result ) );

// Setup the mysql port number

mysqlport:

$result = readline( "Please enter your mysql port number (default is 3306): " );

echo( "You entered \"$result\", is this correct?" );

$yn = strtolower( trim( readline( " (Yes/No/Quit)\n" ) ) );

if( $yn == 'quit' || $yn == 'q' || $yn == '' ) die( $quit );

if( $yn == 'no' || $yn == 'n' )
	goto mysqlport;

$mysqlport = trim( $result );

// Setup username for mysql

mysqlusername:

$result = readline( "Please enter mysql username: " );

echo( "You entered \"$result\", is this correct?" );

$yn = strtolower( trim( readline( " (Yes/No/Quit)\n" ) ) );

if( $yn == 'quit' || $yn == 'q' || $yn == '' ) die( $quit );

if( $yn == 'no' || $yn == 'n' )
	goto mysqlusername;

$mysqluser = trim( $result );

mysqlpassword:

$result = readline( "Please enter mysql password: " );

echo( "You entered \"$result\", is this correct?" );

$yn = strtolower( trim( readline( " (Yes/No/Quit)\n" ) ) );

if( $yn == 'quit' || $yn == 'q' || $yn == '' ) die( $quit );

if( $yn == 'no' || $yn == 'n' )
	goto mysqlpassword;

$mysqlpass = trim( $result );

// Setup friend core port

fcport:

echo( "Please enter the port number for the Friend Core server. If\n" );

$result = readline( "you are not root, it must be higher than 1024 (1025+): " );

echo( "You entered \"$result\", is this correct?" );

$yn = strtolower( trim( readline( " (Yes/No/Quit)\n" ) ) );

if( $yn == 'quit' || $yn == 'q' || $yn == '' ) die( $quit );

if( $yn == 'no' || $yn == 'n' )
	goto fcport;

$fcport = trim( $result );

// Setup friend core ssl

$yn = readline( "Will you run the server using SSL (HTTPS) (Yes/No/Quit)? " );

if( $yn == 'quit' || $yn == 'q' || $yn == '' ) die( $quit );

$yn = strtolower( trim( $yn ) );

$fcssl = $yn == 'y' || $yn == 'yes' ? true : false;

// Now start installing

echo( "---\n\nWe are now ready to install...\n" );

$conn = @mysql_connect( $mysqlserver . ':' . $mysqlport, $mysqluser, $mysqlpass )
	or die( "Failed to connect to mysql server. Please use another username or password.\n" );

$result = mysql_query( 'CREATE DATABASE `' . $mysqldatabase . '`' );

if( substr( mysql_error(), 0, 5 ) == 'Can\'t' )
{
	die( "The database could not be created.\n" );
}

mysql_query( 'USE ' . $mysqldatabase );

if( !( $db = file_get_contents( 'docs/FriendCoreDatabase.sql' ) ) )
	die( "Could not locate friend core database template.\n" );

// Remove comments
$db = preg_replace( '/\-\-[^\n]*?\n/i', '', $db );
$db = preg_replace( '/\/\*[^*]*?\*\/[\;]{0,1}/i', '', $db );

// Install db
if( $rows = explode( ";", $db ) )
{
	foreach( $rows as $row )
	{
		$row = trim( $row );
		if( !$row ) continue;
		if( substr( $row, 0, 3 ) == 'SET' ) continue;
		
		
		mysql_query( $row );
	}	
}

// Set config
$conf = file_get_contents( 'docs/ConfigTemplate.ini' );

$setup = array(
	'{user}'   => $mysqluser,
	'{pass}'   => $mysqlpass,
	'{host}'   => $mysqlserver,
	'{db}'     => $mysqldatabase,
	'{dbport}' => $mysqlport,
	'{fchost}' => $mysqlserver,
	'{fcport}' => $fcport,
	'{fcssl}'  => $fcssl ? '1' : '0'
);

foreach( $setup as $k=>$v )
	$conf = str_replace( $k, $v, $conf );

// Some folders
if( !file_exists( 'build' ) )
	mkdir( 'build' );
if( !file_exists( 'build/cfg' ) )
	mkdir( 'build/cfg' );
if( !file_exists( 'build/cfg/crt' ) )
	mkdir( 'build/cfg/crt' );

// Write config
if( $f = fopen( 'build/cfg/cfg.ini', 'w+' ) )
{
	fwrite( $f, $conf );
	fclose( $f );
}

mysql_close( $conn );

echo( "Now go and start FriendCore. You are all set.\n" );
echo( "Your username is: friendadmin\n" );
echo( "Your password is: FriendlyBetaAdministrator\n" );
echo( "You will find your login prompt at http(s):\/\/yourhost:port/webclient/index.html\n" );

?>
