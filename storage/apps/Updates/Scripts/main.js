/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	this.listVersions();
};

Application.listVersions = function( w )
{

	var m = new Module( 'system' );
	
	// What happens when we've executed?
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
		
			var result = JSON.parse( d );
			console.log( d );
			console.log( result );
			console.log( typeof result.installed + " ### " + typeof result.all );
			
			updateVersionListing( result );

		}
	}
	
	// Execute the "get version list"
	m.execute( 'friendversion' );
}

/** ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### 
	Build our version listing
*/
function updateVersionListing( listings )
{
	var installedStr = '<h3>No versions installed</h3>';
	var allStr = '<h3>No version available</h3>';
	var installedVersion = '';
	var installedVersions = [];
	
	if( typeof listings.installed == 'object' )
	{
		
		installedStr = '<table>';
		installedStr +='<tr><th>Version</th><th>Information</th><th>Date installed</th></tr>';
		
		for( i = 0; i < listings.installed.length; i++ )
		{
			if( installedVersion == '') installedVersion = listings.installed[i].Version;
			
			installedVersions.push( listings.installed[i].Version );
			
			installedStr += '<tr><td>'+ listings.installed[i].Version +'</td><td>'+ listings.installed[i].Version +'</td><td>'+ listings.installed[i].DateUpdated +'</td></tr>'; 
		}
		installedStr += '</table>';
					
	}
	
	if( typeof listings.all == 'object' )
	{
		allStr = '<table>';
		allStr +='<tr><th>Version</th><th>Information</th><th></th></tr>';
		
		var aboveInstalled = true;
		for( i = 0; i < listings.all.length; i++ )
		{
			allStr += '<tr><td>'+ listings.all[i].number +'</td><td>'+ listings.all[i].info +'</td>';
			
			if( aboveInstalled && installedVersion != listings.all[i].number  )
			{
				allStr += '<td><button type="button" class="IconSmall  fa-angle-up" onclick="updateToVersion(\''+ listings.all[i].number +'\')"> Update to this version</button></td>';
			}
			else if( installedVersion == listings.all[i].number )
			{
				allStr += '<td><b>currently installed</b></td>';
				aboveInstalled = false;
				
				//if we have latest version installed, disable update button
				if( i  == 0 )
				{
					ge('FriendUpdateAll').setAttribute('style','display:none;');
					ge('FriendUpdateAll').setAttribute('onclick','void(0);');
					ge('UpdateTaskResult').innerHTML = ' # Latest version of Friend is already installed # ';
				}
			}
			else
			{
				allStr += '<td>'+ ( installedVersions.indexOf(listings.all[i].number) != -1 ? '<i>installed</i>' : '<i class="error">not installed</i>')  +'</td>'; 
			}
			
			allStr += '</tr>';
		}
		allStr += '</table>';
	}
	
	var f = new File( 'Progdir:Templates/list.html' );
	f.replacements = {
		'installed': installedStr,
		'all' : allStr
	};
	f.onLoad = function( data )
	{
		ge( 'FriendVersionList' ).innerHTML = data;
	}
	f.load();	
}

/** ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### 
	Update to given version....
*/
function updateToVersion( number )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var dat = JSON.parse( d );
			ge( 'UpdateTaskResult' ).innerHTML = dat.result;
			
			console.log( dat.versionlistings );
			updateVersionListing( dat.versionlistings );
		}
	}
	m.execute( 'friendversion', { action: 'updatetoversion', number: number } );
}


/** ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### ###### 
	Update to latest version....
*/
function UpdateAll()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var dat = JSON.parse( d );
			ge( 'UpdateTaskResult' ).innerHTML = dat.result;

			console.log( dat.versionlistings );
			updateVersionListing( dat.versionlistings );
		}
	}
	m.execute( 'friendversion', { action: 'tolatest' } );
}


