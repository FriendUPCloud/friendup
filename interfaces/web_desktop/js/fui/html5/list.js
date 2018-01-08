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

fui.List = fui.inherit( fui.Group.prototype );

fui.List.prototype.construct = function()
{
	this.columns = [ 'Column1' ];
	this.entries = [];
}

fui.List.prototype.show = function( bool )
{
	var self = this;
	
	if( this.parent )
	{
		// When we want it visible, and it isn't
		if( bool && !this.visible )
		{
			this.visible = true;
			if( this.dom )
			{
				this.dom.style.visibility = '';
				this.dom.style.pointerEvents = '';
			}
			else
			{
				// Build the whole ui
				var baseDivs = false;
				if( this.baseDivs ) baseDivs = this.baseDivs;
				else
				{
					baseDivs = [ { 
						type: 'div', 
						className: 'FUIList', 
						width: this.flags.width, 
						height: this.flags.height,
						name: this.flags.name ? this.flags.name : false,
						label: 'content'
					} ];
				}
				
				this.dom = this.build( baseDivs, this.parent );
				this.domContent = this.get( 'content' );
				
				var d = this.dom;
				var group = this.domContent;
				
				// Read flags
				if( this.flags.border )
				{
					var cl = this.flags.border.charAt( 0 ).toUpperCase() +
						this.flags.border.substr( 1, this.flags.border.length - 1 );
					group.classList.add( 'Border' + cl );
				}
				if( this.flags.width )
				{
					group.style.width = this.flags.width;
				}
				if( this.flags.height )
				{
					group.style.height = this.flags.height;
				}
				if( this.flags.padding )
				{
					group.style.padding = this.flags.padding + 'px';
				}
				var paddings = [ 'Left', 'Right', 'Bottom', 'Top' ];
				for( var u = 0; u < paddings.length; u++ )
				{
					if( this.flags[ 'padding' + paddings[ u ] ] >= 0 )
					{
						group.style[ 'padding' + paddings[ u ] ] = this.flags[ 'padding' + paddings[ u ] ] + 'px';
					}
				}
				// Done reading flags
				
				// Draw first time
				this.redraw();
				
				
				this.ondestroy = function()
				{
					d.parentNode.removeChild( d );
				}
				
				// Close gadget
				var close = this.get( 'close', d );
				if( close ) close.onclick = function(){ self.destroy(); }
			}
		}
		else
		{
			if( this.visible && this.dom )
			{
				this.visible = false;
				this.dom.style.visibility = 'hidden';
				this.dom.style.pointerEvents = 'none';
			}
		}
		return this;
	}
	return false;
}

/**
 * Adds an entry to the list
 */
fui.List.prototype.addEntry = function( entry, where )
{
	if( !where || where == 'end' )
	{
		this.entries.push( entry );
		this.redraw();
		return true;
	}
	return false;
}

/**
 * Removes an entry from the list
 */
fui.List.prototype.removeEntry = function( num )
{
	var out = [];
	var found = False;
	for( var a = 0; a < this.entries.length; a++ )
	{
		if( a == num )
		{
			found = true;
			continue;
		}
		out.push( this.entries[ a ] );
	}
	this.entries = out;
	if( found ) this.redraw();
	return found;
}

/**
 * Sets the columns
 */
fui.List.prototype.setColumns = function( cols )
{
	this.columns = cols;
	this.redraw();
	return true;
}

/**
 * Redraws the list
 */
fui.List.prototype.redraw = function()
{
	var d = '';
	if( !this.columns || !this.columns.length ) return false;
	if( !this.entries || !this.entries.length ) return false;
	var w = Math.floor( 100 / this.columns.length );
	if( w == 33 ) w = '33';
	else if( w == 66 ) w = '66';
	else
	{
		w = Math.floor( w / 5 ) * 5;
	}
	d += '<div class="FUIListColumns">';
	for( var a = 0; a < this.columns.length; a++ )
	{
		d += '<div class="FUIListColumn FUIWidth' + w + '">' + this.columns[a] + '</div>';
	}
	d += '</div>';
	d += '<div class="FUIListRows">';
	for( var a = 0; a < this.entries.length; a++ )
	{
		d += '<div class="FUIListRow">';
		for( var c = 0; c < this.columns.length; c++ )
		{
			var f = c < this.entries[ a ].length ? this.entries[ a ][ c ] : '';
			d += '<div class="FUIListField FUIWidth' + w + '">' + f + '</div>';
		}
		d += '</div>';
	}
	d += '</div>';
	this.domContent.innerHTML = d;
	var cols = this.domContent.getElementsByClassName( 'FUIListColumn' );
	var rows = this.domContent.getElementsByClassName( 'FUIListRow' );
	if( rows.length && cols.length )
	{
		var tw = cols[0].parentNode.offsetWidth;
		for( var a = 0; a < this.columns.length - 1; a++ )
		{
			if( cols[a] )
			{
				cols[a].style.width = rows[0].childNodes[a].offsetWidth + 'px';
				tw -= rows[0].childNodes[a].offsetWidth;
			}
		}
		cols[ this.columns.length - 1 ].style.width = tw + 'px'; 
	}
	return true;
}

