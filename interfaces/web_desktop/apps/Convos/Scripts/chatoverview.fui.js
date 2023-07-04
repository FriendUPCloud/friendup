class FUIChatoverview extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIChatoverview';
        
        let data = '\
        <div class="Channels"></div>\
        <div class="Chatlist"></div>\
        ';
        
        this.domElement.innerHTML = data;
        
        this.domChannels = this.domElement.querySelector( '.Channels' );
        this.domChatlist = this.domElement.querySelector( '.Chatlist' );
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
    }
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        let self = this;
        
        console.log( 'Refreshing dom!' );
        this.redrawChannels();
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
    	return '<fui-chatoverview' + props + '></fui-chatoverview>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
    // Redraw channels
    redrawChannels()
    {
    	let self = this;
    	
    	if( this.channels )
    	{
    		return;
    	}
    	// Default
    	this.domChannels.innerHTML = '\
    	<div class="Channel Jeanie" uniqueid="jeanie"></div>\
    	<div class="Channel DM" uniqueid="dm"></div>\
    	<div class="Channel Add" uniqueid="add"></div>\
    	';
    	
    	let chans = this.domChannels.getElementsByClassName( 'Channel' );
    	for( let a = 0; a < chans.length; a++ )
    	{
    		let uniqueid = chans[ a ].getAttribute( 'uniqueid' );
    		( function( ele, prop )
    		{
    			if( prop == 'jeanie' )
    			{
					ele.onclick = function()
					{
						self.setActiveChannel( prop, this );
					}
				}
				else
				{
					console.log( 'not yet.' );
				}
    		} )( chans[ a ], uniqueid );
    	}
    }
    // Set active channel
    setActiveChannel( label, tab )
    {
    	let tabs = this.domChannels.getElementsByClassName( 'Channel' );
    	for( let a = 0; a < tabs.length; a++ )
    	{
    		if( tabs[ a ] == tab )
    		{
    			tabs[ a ].classList.add( 'Active' );
    		}
    		else
    		{
    			tabs[ a ].classList.remove( 'Active' );
    		}
    	}
		let chlist = this.domElement.querySelector( '.Chatlist' );
		chlist.innerHTML = '<fui-chatlog name="' + label + '"></fui-chatlog>';
		FUI.initialize();
    }
}
FUI.registerClass( 'chatoverview', FUIChatoverview );

