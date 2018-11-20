/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

{
	var w = new Window ( {
		'title'  : '!application!', 
		'width'  : 640, 
		'height' : 480, 
		'id'     : 'installapp_!application!' 
	} );

	w.setContent ( '\
			<div class="ContentFull">\
				<div class="VContentTop VContent40" style="background: url(!installimage!) center center">\
					<div class="FontLarge Negative Padding" style="position: absolute; bottom: 0px; left: 0px; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.4)">!application!</div>\
				</div>\
				<div class="VContentBottom VContent60" name="stage">\
					\
				</div>\
			</div>\
	' );

	// Get stage
	var v = w.getElementsByTagName ( 'div' );
	var stage = false;
	for ( var a = 0; a < v.length; a++ )
	{
		if ( v[a].getAttribute ( 'name' ) && v[a].getAttribute ( 'name' ) == 'stage' )
		{
			stage = v[a];
		}
	}
	if ( !stage ) w.close ();
	
	var perms = { !permissions! };
	var permi = '';
	if ( typeof ( perms.perms ) == 'undefined' || perms.perms != false )
	{
		permi += '<table cellspacing="0" cellpadding="0" border="0" width="100%">';
		for ( var a in perms )
		{
			var cl = a.split ( /[^a-z0-9]+/i ).join ( '_' );
			permi += '<tr><td width="80%" style="padding-left: 10px"><label for="check_'+cl+'" style="font-weight: normal">' + perms[a] + '</label></td><td width="20%"><input type="checkbox" id="check_'+cl+'"/></td></tr>';
		}
		permi += '</table>';
	}
	
	var desc = "!description!";
	
	stage.innerHTML = '<div class="VContentBottom VContent100"><div class="HContent50 FloatLeft"><div class="FontMedium Padding FullWidth">Rettigheter</div><div class="Padding">Dette programmet krever følgende rettigheter:</div><div class="Permis">' + permi + '</div></div><div class="HContent50 FloatLeft"><div class="FontMedium Padding FullWidth">Beskrivelse</div><div class="Padding">' + desc + '</div></div></div>';
	
	stage.innerHTML += '<div class="VContentBottom VContent10"><div style="position: absolute; left: 10px; bottom: 10px"><button type="button"><img src="ac2/icsmall/accept.png"/> !continue!</button></div></div>';
	
	var b = stage.getElementsByTagName ( 'button' );
	if ( b.length )
	{
		b[0].onclick = function ()
		{
			var f = new Module ( '!authkey!', 'system' );
			var eles = w.getElementsByTagName ( 'input' );
			var options = { 'permissions' : new Array (), 'application' : '!appname!' };
			for ( var a = 0; a < eles.length; a++ )
			{
				if ( eles[a].type != 'checkbox' )
					continue;
				var e = eles[a];
				if ( e.checked )
				{
					options.permissions.push ( e.id.split ( 'check_' )[1].split ( '_' ).join ( ' ' ) );
				}
			}
			f.onExecuted = function ( returncode, data )
			{
				w.close ();
				if ( returncode != 'ok' )
				{
					Ac2Alert ( '!couldnotinstall!' );
				}
			}
			f.execute ( 'installapplication', options );
		}
	}
}

