<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

/*
	Non installed services:
	
	Services which are not installed reside in the build/repository/ directory
	with a naming scheme:
		build/repository/ 
			package_name/
				install.sh
				uninstall.sh
				info.json
	The shell scripts installs or uninstalls the service.
	These shell scripts install the package.
	
	info.js:
		{
			"name": "The package",
			"description": "Cool service that allows xyz",
			"version": "1.0.0",
			"datestamp": "4378563489736",
			"date": "2018-04-01",
			"filesize": "453789469234"  // (bytes)
			"hash": "b24abd3a4b3d42a4c23a24",
			"hashType": "md5"
		}
	
	Installed services:
	
	Services which have been installed needs to conform to these commands,
	read from argv in the service.sh script file for each service.
	
		upgrade [returns: yes|no]
		uninstall [returns: yes|no]
		stop [returns: yes|no]
		start [returns: yes|no]
		getconfigoptions [returns: a JSON with all options]
		setconfigoptions optionA=value optionB=value optionC=value [returns: yes|no]
		getconfigoptionslist [returns: a JSON with all fields of options]
	
	By default, running the 'getservices' command returns a JSON list of 
	services with relevant information:
	
		{
		  "name": "serviceName",
		  "version": "1.0.0",
		  "private": true,
		  "dependencies": {
			"uuid": "^3.0.1",
			"ws": "^2.2.1"
		  },
		  "devDependencies": {
		  	"dep1": "^1.0.0",
		  	"dep2": "^1.4.2"
		  }
		}
*/

// Take a look and see if we have some services
if( $dir = opendir( 'services' ) )
{
	$services = [];
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' ) continue;
		if( !is_dir( 'services/' . $file ) )
			continue;
		$o = new stdClass();
		$o->Name = $file;
		$o->Configurable = file_exists( 'services/' . $file . '/service.sh' );
		$o->Info = file_exists( 'services/' . $file . '/package.json' ) ? 
			json_decode( file_get_contents( 'services/' . $file . '/package.json' ) ) : false;
		$services[] = $o;
	}
	closedir( $dir );
	if( count( $services ) )
		die( 'ok<!--separate-->' . json_encode( $services ) );
}

die( 'fail<!--separate-->{}' );

?>
