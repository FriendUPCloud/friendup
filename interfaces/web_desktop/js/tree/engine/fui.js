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
 * Creates a tree from a fui definition
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 06/03/2018
 */

Friend.Tree.constructFuiTree = function( root, item, source )
{
	this.itemCount = 0;
	this.doConstructFuiTree( root, item, source[ 0 ], 0 );
	this.sendMessageToTree( root, 
	{
		command: 'organize',
		type: 'system'
	} );
};
Friend.Tree.doConstructFuiTree = function( root, parent, source, childNumber )
{
	var name = 'Item' + this.itemCount++;
	if ( source.name )
		name = source.name;

	var item;
	switch ( source.type )
	{
		case 'Group':
			item = new Friend.Tree.UI.Group( this, name,
			{
				root: root,
				parent: parent,
				x: 0,
				y: 0,
				z: 0,
				desiredwidth: source.width,
				desiredheight: source.height,
				rows: source.rows,
				columns: source.columns,
				sizes: source.sizes,
				visible: source.show,
				hAlign: source.hAlign,
				vAlign: source.vAlign,
				padding: source.padding,
				paddingTop: source.paddingTop,
				paddingLeft: source.paddingLeft,
				paddingRight: source.paddingRight,
				paddingBottom: source.paddingBottom,
				childNumber: childNumber
			} );
			break;
		case 'Text':
			item = new Friend.Tree.UI.Text( this, name,
			{
				root: root,
				parent: parent,
				x: 0,
				y: 0,
				z: 0,
				desiredwidth: source.width,
				desiredheight: source.height,
				text: source.text,
				weight: source.weight,
				visible: source.show,
				hAlign: source.hAlign,
				vAlign: source.vAlign,
				padding: source.padding,
				paddingTop: source.paddingTop,
				paddingLeft: source.paddingLeft,
				paddingRight: source.paddingRight,
				paddingBottom: source.paddingBottom,
				childNumber: childNumber
			} );
			break;
		case 'Input':
			item = new Friend.Tree.UI.Edit( this, name,
			{
				root: root,
				parent: parent,
				x: 0,
				y: 0,
				z: 0,
				desiredwidth: source.width,
				desiredheight: source.height,
				text: source.text,
				visible: source.show,
				hAlign: source.hAlign,
				vAlign: source.vAlign,
				padding: source.padding,
				paddingTop: source.paddingTop,
				paddingLeft: source.paddingLeft,
				paddingRight: source.paddingRight,
				paddingBottom: source.paddingBottom,
				childNumber: childNumber
			} );
			break;
		case 'Button':
			item = new Friend.Tree.UI.Button( this, name,
			{
				root: root,
				parent: parent,
				x: 0,
				y: 0,
				z: 0,
				desiredwidth: source.width,
				desiredheight: source.height,
				visible: source.show,
				hAlign: source.hAlign,
				vAlign: source.vAlign,
				padding: source.padding,
				paddingTop: source.paddingTop,
				paddingLeft: source.paddingLeft,
				paddingRight: source.paddingRight,
				paddingBottom: source.paddingBottom,
				childNumber: childNumber
			} );
			break;			
	}

	// Call the children
	if ( source.children )
	{
		for ( var c = 0; c < source.children.length; c++ )
		{
			this.doConstructFuiTree( root, item, source.children[ c ], c );
		}
	}
}