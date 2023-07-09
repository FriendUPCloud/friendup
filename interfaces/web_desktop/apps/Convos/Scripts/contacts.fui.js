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
        
        this.initialized = true;
        this.contactFilter = '';
        this.userList = {}; // Dom elements
        this.userListOrder = []; // Sorted list
        
        this.refreshDom();
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIContacts';
        
        let data = '\
        <div class="ContactSearch"><input type="text" value="' + ( typeof( self.contactFilter ) != 'undefined' ? self.contactFilter : '' ) + '" placeholder="Find a contact..."/></div>\
        <div class="Contacts"></div>\
        <div class="Chat"></div>\
        ';
        
        this.domElement.innerHTML = data;
        
        this.domContacts = this.domElement.querySelector( '.Contacts' );
        this.domChat = this.domElement.querySelector( '.Chat' );
        this.domSearch = this.domElement.querySelector( '.ContactSearch' ).getElementsByTagName( 'input' )[0];
        
        this.domSearch.addEventListener( 'keyup', function( e )
        {
            let s = this;
            if( self.contacttimeo )
                clearTimeout( self.contacttimeo );
            self.contacttimeo = setTimeout( function()
            {
                self.contactFilter = s.value.toLowerCase();
                self.refreshDom();
            }, 100 );
        } );
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
        
        let user = domElement.getAttribute( 'user' );
        if( user ) this.options.user = user;
    }
    // Just check the contact
    poll( contactName )
    {
        let self = this;
        
        // TODO: Replace with UniqueID at one point
        // Only poll active channels
        if( typeof( self.userList[ contactName ] ) != 'undefined' )
        {
            let ele = self.userList[ contactName ].querySelector( '.Contact' );
            if( ele.classList.contains( 'Active' ) )
            {
                Application.holdConnection( { method: 'messages', roomType: 'dm-user', cid: ele.record.ID } );
            }
            // Not active, simply add activity marker
            else
            {
                ele.classList.add( 'NewActivity' );
            }
        }
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
            this.classList.remove( 'NewActivity' );
        }
        
        // Init user
        if( contact.Fullname == this.options.user )
        {
            self.queuedClick = function()
            {
                self.options.user = null;
                self.queuedClick = null;
                d.click();
            }
        }
        
        // Load avatar
        let i = new Image();
        i.src = '/system.library/module/?module=system&command=getavatar&userid=' + contact.UserID + '&width=128&height=128&authid=' + Application.authId;
        i.onload = function()
        {
            d.querySelector( '.Avatar' ).style.backgroundImage = 'url(' + this.src + ')';
            document.body.removeChild( i );
        }
        i.style.position = 'absolute';
        i.style.visibility = 'hidden';
        document.body.appendChild( i );
        
        // The slot does not exist?
        if( !this.userList[ contact.Fullname ] )
        {
            this.userList[ contact.Fullname ] = document.createElement( 'div' );
            this.userList[ contact.Fullname ].className = 'Slot';
            this.domContacts.appendChild( this.userList[ contact.Fullname ] );
            // Add to slot
            this.userList[ contact.Fullname ].appendChild( d );
        }
        setTimeout( function(){ d.classList.add( 'Showing' ); }, 2 );
    }
    setChatView( record )
    {
        let context = ' context="' + ( record.Type == 'User' ? 'user' : 'contact' ) + '"';
        context += ' cid="' + record.ID + '"';
        let dm = record.Type == 'User' ? 'dm-user' : 'dm-contact';
        this.domChat.innerHTML = '<fui-chatlog uniqueid="messages" type="' + dm + '" name="' + record.Fullname + '"' + context + '></fui-chatlog>';
        FUI.initialize();
        
        let contacts = this.domContacts.getElementsByClassName( 'Contact' );
        for( let a = 0; a < contacts.length; a++ )
        {
            if( contacts[a].record == record )
            {
                contacts[a].classList.add( 'Active' );
            }
            else
            {
                contacts[a].classList.remove( 'Active' );
            }
        }
        
        Application.holdConnection( { method: 'messages', roomType: dm, cid: record.ID } );
    }
    // Contacts are refreshed by date active
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        
        if( !this.initialized ) return;
        
        let self = this;
        
        if( self.contactFilter != '' )
        {
            let conts = self.domContacts.getElementsByClassName( 'Contact' );
            for( let a = 0; a < conts.length; a++ )
            {
                if( conts[ a ].querySelector( '.Name' ).innerText.toLowerCase().indexOf( self.contactFilter ) >= 0 )
                {
                    conts[ a ].parentNode.style.display = '';
                }
                else
                {
                    conts[ a ].parentNode.style.display = 'none';
                }
            }
            if( self.queuedClick )
                self.queuedClick();
        }
        else
        {
            let m = new Module( 'system' );
            m.onExecuted = function( me, md )
            {
                // Reset hidden
                let conts = self.domContacts.getElementsByClassName( 'Contact' );
                for( let a = 0; a < conts.length; a++ )
                {
                    conts[ a ].parentNode.style.display = '';
                }
                if( me == 'ok' )
                {
                    let list = JSON.parse( md );
                    for( let a = 0; a < list.contacts.length; a++ )
                    {
                        self.addContact( list.contacts[a] );
                    }
                }
                if( self.queuedClick )
                    self.queuedClick();
            }
            m.execute( 'convos', { method: 'contacts' } );
        }
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

