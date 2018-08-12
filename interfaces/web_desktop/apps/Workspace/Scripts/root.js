/*©agpl*************************************************************************
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
*****************************************************************************©*/
/** @file
 *
 * Tree Workspace Desktop
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 06/11/2017
 */
Friend = window.Friend || {};
Friend.Workspace = Friend.Workspace || {};

// Link utility functions to Friend.utilities
Friend.Utilities = Friend.Utilities || {};
Friend.Tree.Utilities.setCookie = SetCookie;
Friend.Tree.Utilities.getCookie = GetCookie;
Friend.Tree.Utilities.delCookie = DelCookie;
Friend.Tree.Utilities.entityEncode = EntityEncode;
Friend.Tree.Utilities.entityDecode = EntityDecode;
Friend.Tree.Utilities.setCursorPosition = SetCursorPosition;
Friend.Tree.Utilities.include = Include;
Friend.Tree.Utilities.activateScripts = ActivateScripts;
Friend.Tree.Utilities.runScripts = RunScripts;
Friend.Tree.Utilities.getWindowWidth = GetWindowWidth;
Friend.Tree.Utilities.getWindowHeight = GetWindowHeight;
Friend.Tree.Utilities.getElementWidth = GetElementWidth;
Friend.Tree.Utilities.getElementWidthTotal = GetElementWidthTotal;
Friend.Tree.Utilities.getElementHeight = GetElementHeight;
Friend.Tree.Utilities.getElementLeft = GetElementLeft;
Friend.Tree.Utilities.getElementTop = GetElementTop;
Friend.Tree.Utilities.i18n = i18n;
Friend.Tree.Utilities.i18nAddPath = i18nAddPath;
Friend.Tree.Utilities.i18nReplace = i18nReplace;
Friend.Tree.Utilities.i18nClearLocale = i18nClearLocale;
Friend.Tree.Utilities.trim = Trim;
Friend.Tree.Utilities.strPad = StrPad;
Friend.Tree.Utilities.numberExtract = NumberExtract;
Friend.Tree.Utilities.numberFormat = NumberFormat;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Workspace root
//
Friend.Workspace.Root = function( tree, name, flags )
{
	this.themeName = 'Friend';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Workspace.Root', flags );

	// Load all the extra sources
	var self = this;
	Friend.Tree.include(
	[
		'Progdir:Scripts/dos.js',
		'Progdir:Scripts/themes.js'
	], function( response )
	{
		if ( response != 'OK' )
			debugger;

		// Setup the theme
		self.themes = Friend.Themes.defaultThemes;
		self.wallpapers = Friend.Themes.defaultWallpapers;
		self.wallpaper = 'FjordCoast';
		self.setValue( 'theme', self.themeName, true );
		flags.theme = self.theme;
		flags.themes = self.themes;
		flags.wallpaper = self.wallpaper;
		flags.wallpapers = self.wallpapers;
		flags.root = self;
		flags.parent = self;

		// Get the mounted drives
		self.startInsertItems();
		self.ready = false;
		self.readyCount = 0;
		self.readyNumber = 2;
		self.wallpaper = new Friend.Workspace.Wallpaper( self.tree, 'Wallpaper', flags );
		self.DOS = new Friend.DOS.Root( self.tree, 'DOS', flags );
		self.addItem( self.wallpaper );
		self.addItem( self.DOS );
		self.endInsertItems();
	} );
};
Friend.Workspace.Root.render = function( flags )
{
	flags.theme = this.theme;
	flags.themes = this.themes;
	flags.wallpaper = this.wallpaper;
	flags.wallpapers = this.wallpapers;
	return flags;
};
Friend.Workspace.Root.messageUp = function( message )
{
 	return this.startProcess( message, [ ] );
};
Friend.Workspace.Root.messageDown = function( message )
{
	return this.endProcess( message, [ ] );
};
Friend.Workspace.Root.setValue = function( name, value, force )
{
	switch ( name )
	{
		case 'theme':
			for ( var t = 0; t < this.themes.length; t++ )
			{
				if ( value == this.themes[ t ].name )
				{
					if ( ( this.theme && value != this.theme.name ) || force )
					{
						this.theme = this.themes[ t ];
						this.doRefresh();
						return true;
					}
				}
			}
			if ( !force )
				Friend.Tree.log( this, { error: 'Theme not found: ' + theme, level: Friend.Tree.ERRORLEVEL_MEDIUM } );
			return true;
		default:
			break;
	}
	return undefined;
};
Friend.Workspace.Root.getValue = function( name, parameters )
{
	return undefined;
};
Friend.Workspace.Root.setReady = function()
{
	this.readyCount++;
	if ( this.readyCount == this.readyNumber )
	{
		this.ready = true;
		this.tree.start();
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Wallpaper
//
Friend.Workspace.Wallpaper = function( tree, name, flags )
{
	this.image = false;
	this.wallpapers = false;
	this.wallpaper = false;
	this.rendererType= 'Sprite';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Workspace.Wallpaper', flags );

	this.setValue( 'wallpaper', this.wallpaper, true );
};
Friend.Workspace.Wallpaper.render = function( flags )
{
	return flags;
};
Friend.Workspace.Wallpaper.messageUp = function( message )
{
	return this.startProcess( message, [ 'rotation', 'image', 'wallpaper' ] );
};
Friend.Workspace.Wallpaper.messageDown = function( message )
{
	var image = this.image;
	var wallpaper = this.wallpaper;
	if ( this.endProcess( message, [ 'rotation', 'image', 'wallpaper' ] ) )
	{
		if ( image != this.image )
			this.setValue( 'image', this.image, true );
		if ( wallpaper != this.wallpaper )
			this.setValue( 'wallpaper', this.wallpaper, true );
	}
	return message;
};
Friend.Workspace.Wallpaper.setValue = function( name, value, force )
{
	switch ( name )
	{
		case 'wallpaper':
			if ( value != this.wallpaper || force )
			{
				for ( var t = 0; t < this.wallpapers.length; t++ )
				{
					if ( value == this.wallpapers[ t ].name )
					{
						var self = this;
						this.wallpaper = value;
						this.resources.loadSingleImage( this.wallpaper, this.wallpapers[ t ].image, Friend.Tree.HOTSPOT_LEFTTOP, function( image )
						{
							self.image = image.treeName;
							self.root.setReady();
							self.doRefresh();
						}, this.width, this.height ) ;
						return true;
					}
				}
			}
			if ( !force )
				Friend.Tree.log( this, { error: 'Theme not found: ' + theme, level: Friend.Tree.ERRORLEVEL_MEDIUM } );
			break;

		case 'image':
			if ( value != this.image || force )
			{
				var image = this.resources.getImage( value );
				if ( image )
				{
					this.image = image.treeName;
					this.doRefresh();
				}
			}
			return true;
	}
	return undefined;
};
Friend.Workspace.Wallpaper.getValue = function( image )
{
	return this.image;
};
