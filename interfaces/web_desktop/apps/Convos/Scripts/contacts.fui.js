/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIContacts extends FUIElement
{
    constructor( options )
    {
        super( options );
        
        this.userList = {}; // Dom elements
        this.userListOrder = []; // Sorted list
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIContacts';
        
        let data = '\
        <div class="ContactSearch"><input type="text" value="" placeholder="Find a contact..."/></div>\
        <div class="Contacts"></div>\
        <div class="Chat"></div>\
        ';
        
        this.domElement.innerHTML = data;
        
        this.domContacts = this.domElement.querySelector( '.Contacts' );
        this.domChat = this.domElement.querySelector( '.Chat' );
        this.domSearch = this.domElement.querySelector( '.ContactSearch' ).getElementsByTagName( 'input' )[0];
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
    }
    addContact( contact )
    {
        let d = document.createElement( 'div' );
        d.className = 'Contact';
        if( contact.Type == 'User' )
        {
            d.className += ' User';
        }
        d.innerHTML = '<span class="Avatar"></span><span class="Name">' + contact.Fullname + '</span>';
        if( !this.userList[ contact.Fullname ] )
        {
            this.userList[ contact.Fullname ] = document.createElement( 'div' );
            this.userList[ contact.Fullname ].className = 'Slot';
        }
        this.userList[ contact.Fullname ].appendChild( d );
        setTimeout( function(){ d.classList.add( 'Showing' ); }, 2 );
    }
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        let self = this;
        
        let m = new Module( 'system' );
        m.onExecuted = function( me, md )
        {
            if( me == 'ok' )
            {
                let list = JSON.parse( md );
                for( let a = 0; a < list.length; a++ )
                {
                    self.addContact( list[a] );
                }
            }
        }
        m.execute( 'convos', { method: 'contacts' } );
        
        console.log( 'Refreshing dom!' );
    }
    // Get markup for object
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let props = '';
    	let n = 0;
    	for( let a in this.options )
    	{
    	    if( n++ > 0 ) props += ' ';
    	    props += a + '="' + props[ a ] + '"';
    	}
    	return '<fui-contacts' + props + '></fui-contacts>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
}
FUI.registerClass( 'contacts', FUIContacts );

