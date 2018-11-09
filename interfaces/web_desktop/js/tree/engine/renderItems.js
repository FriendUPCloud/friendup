/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Tree engine main processes
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/09/2017
 */
Friend = window.Friend || {};
Friend.Flags = Friend.Flags || {};
Friend.Tree = Friend.Tree || {};

/**
 * Common functions
 */
Friend.Tree.RenderItems =
{
	/**
	 * init
	 *
	 * RenderItem initialization
	 */
	init: function ( self, tree, item, className, properties )
	{
		self.utilities = tree.utilities;
		self.resources = tree.resources;

		// Default general values
		self.x = 0;
		self.y = 0;
		self.z = 0;
		self.width = 0;
		self.height = 0;
		self.rotation = 0;
		self.hotSpotX = 0;
		self.hotSpotY = 0;
		self.hotSpot = Friend.Tree.HOTSPOT_LEFTTOP;
		self.zoomX = 1;
		self.zoomY = 1;
		self.alpha = 1;
		self.noPerspective = false;
		self.noRotation = false;
		self.visible = true; 

		// Is a theme defined?
		var theme = false;
		var theme2 = false;
		if ( properties.theme )
		{
			// Find the class in the theme
			if ( properties.theme[ item.className ] )
			{
				theme = properties.theme[ item.className ];
				self.utilities.setFlags( self, theme );
				if ( theme.fromName && theme.fromName[ item.name ] )
					self.utilities.setFlags( self, theme.fromName[ item.name ] );
			}
		}
		self.utilities.setFlags( self, properties );
		self.thisRect = new Friend.Tree.Utilities.Rect( 0, 0, 0, 0 );
        self.rect = new Friend.Tree.Utilities.Rect( 0, 0, 0, 0 );

        // Assign the functions of the class
		self.onDestroy = this.onDestroy;
        Friend.Tree.Utilities.assignToObject( self, className );
		
		// Values for itself
		self.tree = tree;
		self.item = item;
		item.renderItem = self;
		self.className = className;
		self.name = '<RI>' + item.name;
		self.identifier = '<RI' + tree.identifierCount++ + '>' + item.identifier;
	
		// Assign the renderer. 
		if ( self.rendererName )
		{
			if ( typeof self.rendererName == 'string' )
				assignRenderer( self.rendererName );
			else
			{
				for ( var rr = 0; rr < self.rendererName; rr++ )
				{
					if ( assignRenderer( self.rendererName[ rr ] ) )
						break;
				}
			}
		}

		function assignRenderer( name )
		{
			for ( var r = 0; r < tree.renderers.length; r++ )
			{
				if ( self.rendererName == '*' || name == tree.renderers[ r ].name )
				{
					self.renderer = tree.renderers[ r ];
					
					// Append to the list of renderers in the root of the tree
					if ( !self.item.root.renderers )
						self.item.root.renderers = {};
					self.item.root.renderers[ tree.renderers[ r ].className ] = tree.renderers[ r ];
					return true;
				}
			}
			return false;
		}
	},
	onDestroy: function()
	{
		if ( this.renderer )
			this.renderer.destroy( this );
	}
};


