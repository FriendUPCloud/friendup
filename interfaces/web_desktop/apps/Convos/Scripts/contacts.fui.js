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
        let self = this;
        
        let d = document.createElement( 'div' );
        d.className = 'Contact';
        if( contact.Type == 'User' )
        {
            d.className += ' User';
        }
        d.record = contact;
        d.innerHTML = '<span class="Avatar"></span><span class="Name">' + contact.Fullname + '</span>';
        d.onclick = function()
        {
            self.setChatView( this.record );
        }
        
        // The slot does not exist?
        if( !this.userList[ contact.Fullname ] )
        {
            this.userList[ contact.Fullname ] = document.createElement( 'div' );
            this.userList[ contact.Fullname ].className = 'Slot';
            this.domContacts.appendChild( this.userList[ contact.Fullname ] );
        }
        // Add to slot
        this.userList[ contact.Fullname ].appendChild( d );
        setTimeout( function(){ d.classList.add( 'Showing' ); }, 2 );
    }
    setChatView( record )
    {
        let context = ' context="' + ( record.Type == 'User' ? 'user' : 'contact' ) + '"';
        context += ' cid="' + record.ID + '"';
        let dm = record.Type == 'User' ? 'dm-user' : 'dm-contact';
        this.domChat.innerHTML = '<fui-chatlog uniqueid="dmchat" type="' + dm + '" name="' + record.Fullname + '"' + context + '></fui-chatlog>';
        FUI.initialize();
    }
    // Contacts are refreshed by date active
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
                for( let a = 0; a < list.contacts.length; a++ )
                {
                    self.addContact( list.contacts[a] );
                }
            }
        }
        m.execute( 'convos', { method: 'contacts' } );
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

